import crypto from 'node:crypto';

export const INTERVAL_MS = { '15m': 900000, '1h': 3600000, '1d': 86400000 };
export function researchError(code, message, status = 400) {
  const error = new Error(message); error.code = code; error.status = status; return error;
}
export function validateCandles(candles) {
  if (!Array.isArray(candles)) throw researchError('INVALID_CANDLES', 'OHLCV series required.');
  let previous = -Infinity;
  for (const c of candles) {
    if (![c.time, c.open, c.high, c.low, c.close].every(Number.isFinite) || c.time <= previous || Math.min(c.open, c.high, c.low, c.close) <= 0 || c.high < Math.max(c.open, c.close) || c.low > Math.min(c.open, c.close) || c.high < c.low || (c.volume != null && (!Number.isFinite(c.volume) || c.volume < 0)))
      throw researchError('INVALID_CANDLES', 'Provider candles must be ordered, unique, finite and internally consistent.');
    previous = c.time;
  }
  return candles;
}
export function emaSeries(values, period) {
  const out = values.map(() => null); if (values.length < period) return out;
  let value = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  out[period - 1] = value;
  for (let i = period; i < values.length; i++) out[i] = value = values[i] * (2 / (period + 1)) + value * (1 - 2 / (period + 1));
  return out;
}
export function rsiSeries(values, period = 14) {
  const out = values.map(() => null); if (values.length <= period) return out;
  let gain = 0, loss = 0;
  for (let i = 1; i <= period; i++) { const d = values[i] - values[i - 1]; gain += Math.max(d, 0); loss += Math.max(-d, 0); }
  gain /= period; loss /= period;
  const calc = () => loss === 0 ? (gain === 0 ? 50 : 100) : 100 - 100 / (1 + gain / loss);
  out[period] = calc();
  for (let i = period + 1; i < values.length; i++) { const d = values[i] - values[i - 1]; gain = (gain * (period - 1) + Math.max(d, 0)) / period; loss = (loss * (period - 1) + Math.max(-d, 0)) / period; out[i] = calc(); }
  return out;
}
export function atrSeries(candles, period = 14) {
  const tr = candles.map((c, i) => i ? Math.max(c.high - c.low, Math.abs(c.high - candles[i - 1].close), Math.abs(c.low - candles[i - 1].close)) : c.high - c.low);
  const out = tr.map(() => null); if (tr.length < period) return out;
  let value = tr.slice(0, period).reduce((a, b) => a + b, 0) / period; out[period - 1] = value;
  for (let i = period; i < tr.length; i++) out[i] = value = (value * (period - 1) + tr[i]) / period;
  return out;
}
// Pivots become observable two bars after their anchor. Every event is stamped at confirmation.
export function structureEvents(candles) {
  const events = []; let high = null, low = null, trend = 0;
  for (let i = 4; i < candles.length; i++) {
    const p = i - 2, pivot = candles[p], window = candles.slice(p - 2, p + 3);
    if (window.every((c, j) => j === 2 || c.high < pivot.high)) high = { price: pivot.high, anchor: p, confirmed: i, broken: false };
    if (window.every((c, j) => j === 2 || c.low > pivot.low)) low = { price: pivot.low, anchor: p, confirmed: i, broken: false };
    for (const [level, direction] of [[high, 1], [low, -1]]) {
      if (level && !level.broken && (direction === 1 ? candles[i].close > level.price : candles[i].close < level.price)) {
        events.push({ type: trend && trend !== direction ? 'CHoCH' : 'BOS', direction, index: i, time: candles[i].time, price: level.price, anchorTime: candles[level.anchor].time, confirmedAt: candles[i].time });
        level.broken = true; trend = direction;
        const prior = candles.slice(Math.max(0, i - 5), i).map((c, n) => ({ ...c, index: Math.max(0, i - 5) + n })).reverse().find(c => direction === 1 ? c.close < c.open : c.close > c.open);
        if (prior) events.push({ type: 'OB', direction, index: i, time: candles[i].time, low: prior.low, high: prior.high, price: prior.close, confirmedAt: candles[i].time });
      }
    }
    if (candles[i].low > candles[i - 2].high) events.push({ type: 'FVG', direction: 1, index: i, time: candles[i].time, low: candles[i - 2].high, high: candles[i].low, price: candles[i].low, confirmedAt: candles[i].time });
    if (candles[i].high < candles[i - 2].low) events.push({ type: 'FVG', direction: -1, index: i, time: candles[i].time, low: candles[i].high, high: candles[i - 2].low, price: candles[i].high, confirmedAt: candles[i].time });
    if (high && candles[i].high > high.price && candles[i].close < high.price) events.push({ type: 'LIQ', direction: -1, index: i, time: candles[i].time, price: high.price, confirmedAt: candles[i].time });
    if (low && candles[i].low < low.price && candles[i].close > low.price) events.push({ type: 'LIQ', direction: 1, index: i, time: candles[i].time, price: low.price, confirmedAt: candles[i].time });
  }
  return events;
}
export function prepareSeries(market, interval, asOf = Date.now()) {
  if (!INTERVAL_MS[interval] || market.interval !== interval) throw researchError('INTERVAL_MISMATCH', 'Provider interval does not match requested timeframe.', 503);
  const candles = validateCandles(market.candles).filter(c => c.time + INTERVAL_MS[interval] <= asOf).slice(-2000);
  if (candles.length < 60) throw researchError('INSUFFICIENT_HISTORY', 'At least 60 closed provider candles are required.', 503);
  const gaps = candles.slice(1).map((c,i) => c.time - candles[i].time).sort((a,b) => a-b);
  if (Math.abs(gaps[Math.floor(gaps.length/2)] - INTERVAL_MS[interval]) > INTERVAL_MS[interval] * .05) throw researchError("INTERVAL_MISMATCH", "Provider candle cadence does not match requested interval.", 503);
  const close = candles.map(c => c.close);
  return { candles, indicators: { ema20: emaSeries(close, 20), ema50: emaSeries(close, 50), rsi14: rsiSeries(close), atr14: atrSeries(candles) }, events: structureEvents(candles), provenance: {
    source: market.source, providerSymbol: market.providerSymbol, interval, requestedInterval: interval, currency: market.currency, count: candles.length,
    firstTime: candles[0].time, lastTime: candles.at(-1).time, providerTime: market.marketTime,
    status: asOf - (candles.at(-1).time + INTERVAL_MS[interval]) > Math.max(INTERVAL_MS[interval] * 3, 7200000) ? 'stale' : 'recent',
    discardedRows: market.discardedRows || 0, gapCount: candles.slice(1).filter((c,i) => c.time-candles[i].time > INTERVAL_MS[interval]*1.5).length,
    hash: crypto.createHash('sha256').update(JSON.stringify(candles)).digest('hex'), closedBarsOnly: true,
    observation: market.symbolInfo?.assetClass === 'Commodity' ? 'Futures proxy, not executable spot' : 'Provider OHLCV observations', volumeAvailable: candles.some(c => c.volume > 0)
  } };
}
export function summarizeSeries(series) {
  const c = series.candles, i = series.indicators;
  const last = c.at(-1), ema20 = i.ema20.at(-1), ema50 = i.ema50.at(-1), rsi = i.rsi14.at(-1), atr = i.atr14.at(-1);
  const trend = ema20 > ema50 && last.close > ema20 ? 'bullish' : ema20 < ema50 && last.close < ema20 ? 'bearish' : 'neutral';
  const window = c.slice(-21, -1), support = Math.min(...window.map(c => c.low)), resistance = Math.max(...window.map(c => c.high));
  return { trend, close: last.close, ema20, ema50, rsi, atr, atrPct: atr / last.close * 100, support, resistance,
    lastStructure: series.events.filter(e => ['BOS', 'CHoCH'].includes(e.type)).at(-1) || null, provenance: series.provenance };
}
export async function multiTimeframe(symbol, getMarketData, asOf = Date.now()) {
  const intervals = ['15m', '1h', '1d'];
  const frames = await Promise.all(intervals.map(async interval => {
    try { const market = await getMarketData(symbol, interval); return { interval, available: true, ...summarizeSeries(prepareSeries(market, interval, asOf)) }; }
    catch (e) { return { interval, available: false, code: e.code || 'MARKET_DATA_UNAVAILABLE' }; }
  }));
  const verified = frames.filter(f => f.available && f.provenance.status === 'recent');
  const bullish = verified.filter(f => f.trend === 'bullish').map(f => f.interval), bearish = verified.filter(f => f.trend === 'bearish').map(f => f.interval);
  const daily = frames.find(f => f.interval === '1d' && f.available), hourly = frames.find(f => f.interval === '1h' && f.available);
  return { symbol, asOf, frames, available: frames.some(f => f.available), complete: verified.length === 3,
    agreement: { bullish, bearish, neutral: verified.filter(f => f.trend === 'neutral').map(f => f.interval), conflicting: bullish.length > 0 && bearish.length > 0 },
    scenarios: [
      { direction: 'bullish', evidence: bullish, opposing: bearish, trigger: hourly?.resistance ?? null, invalidation: daily?.support ?? null },
      { direction: 'bearish', evidence: bearish, opposing: bullish, trigger: hourly?.support ?? null, invalidation: daily?.resistance ?? null },
      { direction: 'neutral', evidence: verified.filter(f => f.trend === 'neutral').map(f => f.interval), reason: verified.length < 3 ? 'incomplete' : bullish.length && bearish.length ? 'conflict' : 'confirmation_required' }
    ], methodology: 'Independent provider requests; EMA20/50, Wilder RSI14/ATR14, prior 20-bar range. No probability claim.' };
}
