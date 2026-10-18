// EMA: SMA seed. RSI/ATR: rolling simple averages. Bollinger: population variance.
export function values(candles, key) {
  return candles.map(c => Number(c[key])).filter(Number.isFinite);
}

export function sma(arr, period) {
  if (arr.length < period) return null;
  return arr.slice(-period).reduce((a, b) => a + b, 0) / period;
}

export function emaSeries(arr, period) {
  if (arr.length < period) return [];
  const k = 2 / (period + 1);
  const out = [];
  let prev = arr.slice(0, period).reduce((a, b) => a + b, 0) / period;
  out.push(prev);
  for (let i = period; i < arr.length; i++) {
    prev = arr[i] * k + prev * (1 - k);
    out.push(prev);
  }
  return out;
}

export function ema(arr, period) {
  const s = emaSeries(arr, period);
  return s.length ? s[s.length - 1] : null;
}

export function standardDeviation(arr) {
  if (!arr.length) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((sum, x) => sum + (x - mean) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

export function rsi(closes, period = 14) {
  if (closes.length < period + 1) return null;
  let gains = 0;
  let losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }
  if (losses === 0) return gains === 0 ? 50 : 100;
  const rs = gains / losses;
  return 100 - 100 / (1 + rs);
}

export function atr(candles, period = 14) {
  if (candles.length < period + 1) return null;
  const trs = [];
  for (let i = candles.length - period; i < candles.length; i++) {
    const current = candles[i];
    const prev = candles[i - 1];
    trs.push(Math.max(
      current.high - current.low,
      Math.abs(current.high - prev.close),
      Math.abs(current.low - prev.close)
    ));
  }
  return trs.reduce((a, b) => a + b, 0) / trs.length;
}

export function macd(closes) {
  if (closes.length < 35) return { macd: null, signal: null, histogram: null };
  const ema12 = emaSeries(closes, 12);
  const ema26 = emaSeries(closes, 26);
  const offset = ema12.length - ema26.length;
  const line = ema26.map((v, i) => ema12[i + offset] - v);
  const signalSeries = emaSeries(line, 9);
  const macdValue = line[line.length - 1];
  const signal = signalSeries[signalSeries.length - 1];
  return { macd: macdValue, signal, histogram: macdValue - signal };
}

export function bollinger(closes, period = 20, mult = 2) {
  if (closes.length < period) return { upper: null, middle: null, lower: null, widthPct: null };
  const slice = closes.slice(-period);
  const middle = sma(closes, period);
  const sd = standardDeviation(slice);
  return { upper: middle + sd * mult, middle, lower: middle - sd * mult, widthPct: middle ? (sd * mult * 2 / middle) * 100 : null };
}

export function linearRegressionSlope(arr) {
  const n = arr.length;
  if (n < 2) return 0;
  const xMean = (n - 1) / 2;
  const yMean = arr.reduce((a, b) => a + b, 0) / n;
  let nume = 0;
  let deno = 0;
  arr.forEach((y, x) => {
    nume += (x - xMean) * (y - yMean);
    deno += (x - xMean) ** 2;
  });
  return deno ? nume / deno : 0;
}
