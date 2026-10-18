import {allowRequest,mapConcurrent} from "./server/limits.js";
import {enhanceWithOpenAI,openaiReadiness} from "./server/openai.js";
import {values, sma, emaSeries, ema, standardDeviation, rsi, atr, macd, bollinger, linearRegressionSlope} from "./server/indicators.js";
import {startPaperWorker,refreshPaperRisk,inspectPaperRecovery} from "./server/paperWorker.js";
import {withTransaction,commitTransaction,rollbackTransaction,recordFill,getLedger,closeStorage} from "./server/storage.js";
import { getMarketData, assertPaperMarket, marketReadiness, getPaperPricing } from "./server/marketData.js";
import { authenticate, authenticateToken, createSession, logout, assertOrigin, assertAccountOwner } from "./server/auth.js";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getAllSanitizedAccounts,
  getAccountById,
  addTradingAccount,
  removeTradingAccount,
  checkAndStoreIdempotencyKey,
  saveIdempotencyResponse,
  saveTradingAccounts,
  sanitizeAccountForClient
} from "./server/accountStore.js";
import { getBrokerAdapter } from "./server/brokerAdapters.js";
import { validateOrderRisk, calculateOrderRisk, getContractSpec, conversionFactor } from "./server/riskEngine.js";
import { logAuditEvent, getAuditEvents } from "./server/auditLogger.js";
import { reconcileAccount } from "./server/reconciliationEngine.js";
import crypto from "node:crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnvFile() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (!process.env[key]) process.env[key] = rest.join("=").trim().replace(/^['"]|['"]$/g, "");
  }
}

loadEnvFile();
const PORT = Number(process.env.PORT || 3000);
const openaiEnabled = Boolean(process.env.OPENAI_API_KEY);

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number.isFinite(Number(value)) ? Number(value) : min));
}

function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function round(value, digits = 2) {
  const n = Number(value);
  if (value == null || !Number.isFinite(n)) return null;
  const p = 10 ** digits;
  return Math.round(n * p) / p;
}

function detectStructure(candles) {
  const highs = values(candles, "high");
  const lows = values(candles, "low");
  const closes = values(candles, "close");
  const lastClose = closes[closes.length - 1];
  const recentHighs = [];
  const recentLows = [];
  for (let i = Math.max(2, candles.length - 90); i < candles.length - 2; i++) {
    if (candles[i].high > candles[i - 1].high && candles[i].high > candles[i + 1].high) recentHighs.push(candles[i].high);
    if (candles[i].low < candles[i - 1].low && candles[i].low < candles[i + 1].low) recentLows.push(candles[i].low);
  }
  const lowerSupports = recentLows.filter(v => v < lastClose).sort((a, b) => b - a);
  const higherRes = recentHighs.filter(v => v > lastClose).sort((a, b) => a - b);
  const support = lowerSupports[0] || Math.min(...lows.slice(-60));
  const resistance = higherRes[0] || Math.max(...highs.slice(-60));
  const last = candles[candles.length - 1];
  const previousLows = lows.slice(-25, -2);
  const previousHighs = highs.slice(-25, -2);
  const sweepDown = last.low < Math.min(...previousLows) && last.close > support;
  const sweepUp = last.high > Math.max(...previousHighs) && last.close < resistance;
  const last10 = candles.slice(-10);
  const higherHighs = last10.filter((c, i, arr) => i > 0 && c.high > arr[i - 1].high).length;
  const higherLows = last10.filter((c, i, arr) => i > 0 && c.low > arr[i - 1].low).length;
  const lowerHighs = last10.filter((c, i, arr) => i > 0 && c.high < arr[i - 1].high).length;
  const lowerLows = last10.filter((c, i, arr) => i > 0 && c.low < arr[i - 1].low).length;
  const trendStructure = higherHighs + higherLows > lowerHighs + lowerLows ? "Bullish structure" : lowerHighs + lowerLows > higherHighs + higherLows ? "Bearish structure" : "Range structure";
  return { support, resistance, sweepDown, sweepUp, trendStructure, recentHigh: Math.max(...highs.slice(-60)), recentLow: Math.min(...lows.slice(-60)) };
}

function addScore(item, amount, reason) {
  item.directionScore += amount;
  if (reason) item.reasons.push(reason);
}

function schoolTemplate(name) {
  return { name, bias: "NEUTRAL", score: 50, directionScore: 0, reasons: [], warnings: [] };
}

function finalizeSchool(item) {
  item.score = clamp(50 + Math.abs(item.directionScore) * 0.55, 35, 96);
  item.bias = item.directionScore > 10 ? "BULLISH" : item.directionScore < -10 ? "BEARISH" : "NEUTRAL";
  item.score = round(item.score, 0);
  item.directionScore = round(item.directionScore, 2);
  return item;
}


function average(arr) {
  const clean = (arr || []).map(Number).filter(Number.isFinite);
  return clean.length ? clean.reduce((a, b) => a + b, 0) / clean.length : 0;
}

function percentile(arr, pct) {
  const clean = (arr || []).map(Number).filter(Number.isFinite).sort((a, b) => a - b);
  if (!clean.length) return 0;
  const idx = clamp(Math.round((clean.length - 1) * pct), 0, clean.length - 1);
  return clean[idx];
}

function findSwingPoints(candles, lookback = 120, wing = 2) {
  const start = Math.max(wing, candles.length - lookback);
  const highs = [];
  const lows = [];
  for (let i = start; i < candles.length - wing; i++) {
    const current = candles[i];
    let isHigh = true;
    let isLow = true;
    for (let j = i - wing; j <= i + wing; j++) {
      if (j === i) continue;
      if (candles[j].high >= current.high) isHigh = false;
      if (candles[j].low <= current.low) isLow = false;
    }
    if (isHigh) highs.push({ index: i, time: current.time, price: current.high });
    if (isLow) lows.push({ index: i, time: current.time, price: current.low });
  }
  return { highs, lows };
}

function clusterPriceLevels(points, atrValue, type, currentPrice) {
  const tolerance = Math.max(atrValue * 0.45, Math.abs(currentPrice) * 0.00035);
  const sorted = [...points].sort((a, b) => a.price - b.price);
  const clusters = [];
  for (const point of sorted) {
    let cluster = clusters.find(c => Math.abs(c.price - point.price) <= tolerance);
    if (!cluster) {
      cluster = { type, price: point.price, touches: 0, lastTouchIndex: point.index, prices: [] };
      clusters.push(cluster);
    }
    cluster.prices.push(point.price);
    cluster.touches += 1;
    cluster.lastTouchIndex = Math.max(cluster.lastTouchIndex, point.index);
    cluster.price = average(cluster.prices);
  }
  return clusters
    .map(c => ({
      type: c.type,
      price: round(c.price, 6),
      touches: c.touches,
      distancePct: round(((c.price - currentPrice) / currentPrice) * 100, 3),
      strength: round(clamp(35 + c.touches * 13 + (c.lastTouchIndex / Math.max(1, points.at(-1)?.index || 1)) * 15, 35, 96), 0)
    }))
    .sort((a, b) => Math.abs(a.distancePct) - Math.abs(b.distancePct));
}

function candleBody(candle) {
  return Math.abs(candle.close - candle.open);
}

function candleRange(candle) {
  return Math.max(Math.abs(candle.high - candle.low), 1e-12);
}

function detectProfessionalPatterns(candles, structure, atrValue, price) {
  const signals = [];
  const names = [];
  const recent = candles.slice(-5);
  const last = candles.at(-1);
  const prev = candles.at(-2) || last;
  const body = candleBody(last);
  const range = candleRange(last);
  const upperWick = last.high - Math.max(last.open, last.close);
  const lowerWick = Math.min(last.open, last.close) - last.low;
  if (lowerWick > body * 1.6 && last.close > last.open) {
    signals.push({ name: "Bullish rejection candle", direction: "BULLISH", score: 11, confidence: 68, reason: "Latest candle rejected lower prices with a dominant lower wick." });
    names.push("Bullish rejection candle");
  }
  if (upperWick > body * 1.6 && last.close < last.open) {
    signals.push({ name: "Bearish rejection candle", direction: "BEARISH", score: -11, confidence: 68, reason: "Latest candle rejected higher prices with a dominant upper wick." });
    names.push("Bearish rejection candle");
  }
  if (last.close > last.open && prev.close < prev.open && last.close > prev.open && last.open < prev.close) {
    signals.push({ name: "Bullish engulfing", direction: "BULLISH", score: 16, confidence: 74, reason: "Bullish engulfing candle detected near the latest close." });
    names.push("Bullish engulfing");
  }
  if (last.close < last.open && prev.close > prev.open && last.open > prev.close && last.close < prev.open) {
    signals.push({ name: "Bearish engulfing", direction: "BEARISH", score: -16, confidence: 74, reason: "Bearish engulfing candle detected near the latest close." });
    names.push("Bearish engulfing");
  }
  if (body / range < 0.25 && Math.max(upperWick, lowerWick) > range * 0.33) {
    signals.push({ name: "Indecision candle", direction: "NEUTRAL", score: 0, confidence: 56, reason: "Latest candle is indecisive; confirmation candle is required." });
    names.push("Indecision candle");
  }
  const swings = findSwingPoints(candles, 150, 2);
  const lastHighs = swings.highs.slice(-4);
  const lastLows = swings.lows.slice(-4);
  if (lastHighs.length >= 2) {
    const h1 = lastHighs.at(-2).price;
    const h2 = lastHighs.at(-1).price;
    if (Math.abs(h2 - h1) <= atrValue * 0.65 && price < h2) {
      signals.push({ name: "Double-top pressure", direction: "BEARISH", score: -13, confidence: 63, reason: "Two recent swing highs formed a nearby resistance ceiling." });
      names.push("Double-top pressure");
    }
  }
  if (lastLows.length >= 2) {
    const l1 = lastLows.at(-2).price;
    const l2 = lastLows.at(-1).price;
    if (Math.abs(l2 - l1) <= atrValue * 0.65 && price > l2) {
      signals.push({ name: "Double-bottom reaction", direction: "BULLISH", score: 13, confidence: 63, reason: "Two recent swing lows formed a nearby support base." });
      names.push("Double-bottom reaction");
    }
  }
  const compression = recent.every(c => candleRange(c) < atrValue * 1.4);
  if (compression) {
    signals.push({ name: "Volatility compression", direction: "NEUTRAL", score: 0, confidence: 61, reason: "Recent candles are compressed; prepare for breakout confirmation." });
    names.push("Volatility compression");
  }
  if (structure.sweepDown) names.push("Sell-side liquidity sweep");
  if (structure.sweepUp) names.push("Buy-side liquidity sweep");
  return { signals, names: [...new Set(names)].slice(0, 8) };
}

function buildTrendChannel(candles, price) {
  const slice = candles.slice(-80);
  const highs = slice.map(c => c.high);
  const lows = slice.map(c => c.low);
  const closes = slice.map(c => c.close);
  const closeSlope = linearRegressionSlope(closes);
  const highSlope = linearRegressionSlope(highs);
  const lowSlope = linearRegressionSlope(lows);
  const direction = closeSlope > price * 0.00008 ? "UPTREND" : closeSlope < -price * 0.00008 ? "DOWNTREND" : "SIDEWAYS";
  const projectedMid = closes.at(-1);
  const spread = Math.max(standardDeviation(closes), Math.abs(average(highs) - average(lows)) / 2);
  const quality = clamp(50 + Math.abs(closeSlope / Math.max(price, 1e-9)) * 85000 - standardDeviation(closes.slice(-20).map((c, i, arr) => i ? (c - arr[i - 1]) / arr[i - 1] : 0)) * 1000, 35, 92);
  return {
    direction,
    slopePct: round((closeSlope / price) * 100, 5),
    channelQuality: round(quality, 0),
    upper: round(projectedMid + spread * 1.45, 6),
    mid: round(projectedMid, 6),
    lower: round(projectedMid - spread * 1.45, 6)
  };
}

function buildFibonacciLevels(structure) {
  const high = Number(structure.recentHigh);
  const low = Number(structure.recentLow);
  const span = high - low;
  if (!Number.isFinite(span) || span <= 0) return [];
  return [0.236, 0.382, 0.5, 0.618, 0.786].map(ratio => ({
    ratio,
    label: `${round(ratio * 100, 1)}%`,
    price: round(high - span * ratio, 6)
  }));
}

function buildSupplyDemandZones(candles, atrValue) {
  const impulseThreshold = Math.max(atrValue * 1.25, 1e-9);
  const zones = [];
  for (let i = Math.max(1, candles.length - 100); i < candles.length; i++) {
    const c = candles[i];
    const impulse = c.close - c.open;
    if (Math.abs(impulse) < impulseThreshold) continue;
    const prior = candles[i - 1];
    const type = impulse > 0 ? "DEMAND" : "SUPPLY";
    zones.push({
      type,
      from: round(type === "DEMAND" ? Math.min(prior.low, c.open) : Math.max(prior.high, c.open), 6),
      to: round(type === "DEMAND" ? Math.max(prior.low, c.open) : Math.min(prior.high, c.open), 6),
      strength: round(clamp(55 + Math.abs(impulse / atrValue) * 10, 55, 94), 0),
      time: c.time
    });
  }
  return zones.slice(-6).reverse();
}


function buildSmartMoneyMap(candles, structure, atrValue, price) {
  const swings = findSwingPoints(candles, 160, 2);
  const highs = swings.highs || [];
  const lows = swings.lows || [];
  const combined = [
    ...highs.map(p => ({ ...p, kind: "HIGH" })),
    ...lows.map(p => ({ ...p, kind: "LOW" }))
  ].sort((a, b) => a.index - b.index);

  const pivots = combined.slice(-10).map((point, idx, arr) => {
    const prevSame = [...arr.slice(0, idx)].reverse().find(x => x.kind === point.kind);
    let label = point.kind === "HIGH" ? "SH" : "SL";
    if (prevSame) {
      if (point.kind === "HIGH") label = point.price >= prevSame.price ? "HH" : "LH";
      else label = point.price <= prevSame.price ? "LL" : "HL";
    }
    return { index: point.index, price: round(point.price, 6), kind: point.kind, label };
  }).slice(-8);

  const lastHigh = highs.at(-1);
  const lastLow = lows.at(-1);
  const smcEvents = [];
  if (lastHigh && price > lastHigh.price + atrValue * 0.08) {
    smcEvents.push({ type: structure.trendStructure === "Bearish structure" ? "CHoCH" : "BOS", direction: "BULLISH", price: round(lastHigh.price, 6), index: lastHigh.index, label: structure.trendStructure === "Bearish structure" ? "Bullish CHoCH" : "Bullish BOS" });
  }
  if (lastLow && price < lastLow.price - atrValue * 0.08) {
    smcEvents.push({ type: structure.trendStructure === "Bullish structure" ? "CHoCH" : "BOS", direction: "BEARISH", price: round(lastLow.price, 6), index: lastLow.index, label: structure.trendStructure === "Bullish structure" ? "Bearish CHoCH" : "Bearish BOS" });
  }

  const liquidityPools = [];
  const recentHighs = highs.slice(-4);
  const recentLows = lows.slice(-4);
  if (recentHighs.length >= 2) {
    const a = recentHighs.at(-1), b = recentHighs.at(-2);
    if (Math.abs(a.price - b.price) <= atrValue * 0.55) liquidityPools.push({ type: "EQH", price: round((a.price + b.price) / 2, 6), label: "Equal Highs liquidity" });
  }
  if (recentLows.length >= 2) {
    const a = recentLows.at(-1), b = recentLows.at(-2);
    if (Math.abs(a.price - b.price) <= atrValue * 0.55) liquidityPools.push({ type: "EQL", price: round((a.price + b.price) / 2, 6), label: "Equal Lows liquidity" });
  }

  const orderBlocks = [];
  const fvgs = [];
  for (let i = Math.max(2, candles.length - 90); i < candles.length - 2; i++) {
    const c = candles[i];
    const next = candles[i + 1];
    const impulse = next.close - next.open;
    if (!Number.isFinite(impulse)) continue;
    if (c.close < c.open && impulse > atrValue * 0.75) {
      orderBlocks.push({ type: "BULLISH_OB", from: round(Math.min(c.open, c.close), 6), to: round(c.high, 6), strength: round(clamp(58 + Math.abs(impulse / atrValue) * 10, 58, 92), 0), index: i });
    }
    if (c.close > c.open && impulse < -atrValue * 0.75) {
      orderBlocks.push({ type: "BEARISH_OB", from: round(c.low, 6), to: round(Math.max(c.open, c.close), 6), strength: round(clamp(58 + Math.abs(impulse / atrValue) * 10, 58, 92), 0), index: i });
    }
  }

  // Fair Value Gaps (3-candle imbalance detection)
  for (let i = 2; i < candles.length; i++) {
    const c0 = candles[i - 2];
    const c1 = candles[i - 1];
    const c2 = candles[i];
    if (c2.low > c0.high && (c1.close - c1.open) > atrValue * 0.35) {
      fvgs.push({ type: "BULLISH_FVG", from: round(c0.high, 6), to: round(c2.low, 6), mid: round((c0.high + c2.low) / 2, 6), index: i - 1 });
    } else if (c2.high < c0.low && (c1.open - c1.close) > atrValue * 0.35) {
      fvgs.push({ type: "BEARISH_FVG", from: round(c2.high, 6), to: round(c0.low, 6), mid: round((c2.high + c0.low) / 2, 6), index: i - 1 });
    }
  }

  const activeFvgs = fvgs.filter(gap=>!candles.slice(gap.index+2).some(c=>gap.type==="BULLISH_FVG"?c.low<=gap.from:c.high>=gap.to)).slice(-4);
  const activeObs = orderBlocks.filter(ob=>!candles.slice(ob.index+2).some(c=>ob.type==="BULLISH_OB"?c.close<ob.from:c.close>ob.to)).slice(-4);

  return {
    pivots,
    smcEvents: smcEvents.slice(-3),
    liquidityPools: liquidityPools.slice(-3),
    orderBlocks: activeObs,
    fvgs: activeFvgs,
    summary: [
      ...smcEvents.map(x => x.label),
      ...liquidityPools.map(x => x.label),
      ...activeObs.slice(-2).map(x => x.type === "BULLISH_OB" ? "Bullish Demand OB" : "Bearish Supply OB"),
      ...activeFvgs.slice(-2).map(x => x.type === "BULLISH_FVG" ? "Bullish Fair Value Gap" : "Bearish Fair Value Gap")
    ].slice(0, 6)
  };
}


function buildVolumeProfile(candles, price) {
  const volumes = values(candles, "volume");
  const recentVolume = average(volumes.slice(-20));
  const baselineVolume = average(volumes.slice(-80));
  const volumeRatio = baselineVolume ? recentVolume / baselineVolume : 1;
  const closes = values(candles, "close");
  const bars=candles.slice(-120),low=Math.min(...bars.map(c=>c.low)),high=Math.max(...bars.map(c=>c.high));
  const bins=Array.from({length:24},(_,i)=>({price:low+(i+0.5)*(high-low)/24,volume:0}));
  for(const c of bars){const covered=bins.filter(bin=>bin.price>=c.low&&bin.price<=c.high);for(const bin of covered)bin.volume+=(c.volume||0)/Math.max(1,covered.length)}
  const total=bins.reduce((sum,bin)=>sum+bin.volume,0);let left=bins.reduce((best,bin,i)=>bin.volume>bins[best].volume?i:best,0),right=left,accumulated=bins[left].volume;
  while(total>0&&accumulated<total*0.7&&(left>0||right<bins.length-1)){if(left>0&&(right===bins.length-1||bins[left-1].volume>=bins[right+1].volume)){left--;accumulated+=bins[left].volume}else{right++;accumulated+=bins[right].volume}}
  const valueLow=total>0?bins[left].price:null,valueHigh=total>0?bins[right].price:null;
  const valueAreaPosition = valueHigh > valueLow ? clamp((price - valueLow) / (valueHigh - valueLow), 0, 1) * 100 : 50;
  return {
    method:total>0?"OHLCV bin approximation; not tick volume-at-price":"UNAVAILABLE_NO_VOLUME",
    bins:total>0?bins:[],
    recentVolume: round(recentVolume, 0),
    volumeRatio: total>0?round(volumeRatio,2):null,
    volumeState: total===0?"UNAVAILABLE":volumeRatio > 1.35 ? "EXPANDING" : volumeRatio < 0.75 ? "QUIET" : "NORMAL",
    valueAreaLow: round(valueLow, 6),
    valueAreaHigh: round(valueHigh, 6),
    valueAreaPosition:total>0?round(valueAreaPosition,1):null
  };
}

function buildSessionInfo(marketTime) {
  const date = new Date(marketTime || Date.now());
  const hour = date.getUTCHours();
  let session = "Asia / rollover";
  let quality = 58;
  if (hour >= 7 && hour < 12) { session = "London active"; quality = 82; }
  else if (hour >= 12 && hour < 16) { session = "London-New York overlap"; quality = 90; }
  else if (hour >= 16 && hour < 21) { session = "New York active"; quality = 78; }
  else if (hour >= 21 || hour < 1) { session = "Rollover / thin liquidity"; quality = 42; }
  return { utcHour: hour, session, timingQuality: quality };
}

function buildProfessionalLayer({ candles, price, atr14, atrPct, ema20, ema50, ema200, rsi14, macdData, bb, structure, rangePosition, schools, decision, confidence, grade, consensusScore, riskPct, exposurePct, volatilityLabel, market, timeframe, request, patternPack }) {
  const swings = findSwingPoints(candles, 160, 2);
  const supports = clusterPriceLevels(swings.lows.filter(p => p.price <= price), atr14, "SUPPORT", price).slice(0, 5);
  const resistances = clusterPriceLevels(swings.highs.filter(p => p.price >= price), atr14, "RESISTANCE", price).slice(0, 5);
  const trend = buildTrendChannel(candles, price);
  const fibonacci = buildFibonacciLevels(structure);
  const zones = buildSupplyDemandZones(candles, atr14);
  const smcMap = buildSmartMoneyMap(candles, structure, atr14, price);
  const volumeProfile = buildVolumeProfile(candles, price);
  const session = buildSessionInfo(market.marketTime);
  const isBuy = decision.startsWith("BUY");
  const isSell = decision.startsWith("SELL");
  const isLimit = decision.includes("LIMIT");
  const schoolAgreement = schools.length ? (schools.filter(s => (isBuy && s.bias === "BULLISH") || (isSell && s.bias === "BEARISH")).length / schools.length) * 100 : 0;
  const dataQuality = market.warning ? 45 : 92;
  const riskQuality = clamp(100 - Math.max(0, riskPct - 1) * 18 - Math.max(0, exposurePct - 300) * 0.05, 25, 100);
  const structureQuality = clamp(45 + (supports[0]?.strength || 45) * 0.18 + (resistances[0]?.strength || 45) * 0.18 + (trend.channelQuality || 50) * 0.28, 35, 94);
  const executionReadiness = round(clamp(confidence * 0.34 + schoolAgreement * 0.22 + riskQuality * 0.20 + dataQuality * 0.14 + session.timingQuality * 0.10, 20, 96), 0);
  const marketRegime = volatilityLabel === "Extreme" ? "High-risk volatility expansion" : trend.direction === "SIDEWAYS" ? "Range / mean-reversion environment" : `${trend.direction.toLowerCase()} continuation environment`;
  const confluence = [
    { name: "Multi-school agreement", score: round(schoolAgreement, 0), status: schoolAgreement >= 50 ? "PASS" : "WARNING", detail: `${round(schoolAgreement, 0)}% of directional schools align with ${decision}.` },
    { name: "Data quality", score: dataQuality, status: dataQuality >= 80 ? "PASS" : "WARNING", detail: market.warning || "Provider returned usable closed candles." },
    { name: "Risk governance", score: round(riskQuality, 0), status: riskQuality >= 75 ? "PASS" : "WARNING", detail: `Risk ${round(riskPct, 2)}%, exposure ${round(exposurePct, 1)}%.` },
    { name: "Structure quality", score: round(structureQuality, 0), status: structureQuality >= 68 ? "PASS" : "WAIT", detail: `${structure.trendStructure}; ${supports.length} supports and ${resistances.length} resistances mapped.` },
    { name: "Timing session", score: session.timingQuality, status: session.timingQuality >= 70 ? "PASS" : "WARNING", detail: session.session }
  ];
  const indicatorLines=Object.fromEntries([20,50,200].map(period=>[period,emaSeries(candles.map(c=>c.close),period)]));
  const visibleStart=Math.max(0,candles.length-300);
  const playbook = decision==="WAIT" ? ["Wait for verified data and directional confirmation; no order is proposed."] : isBuy
    ? isLimit
      ? ["Queue BUY LIMIT order at optimal discount / OTE pullback level to avoid buying at the top.", "Protective stop-loss is placed strictly below institutional swing support.", "Scale out 50% at Take Profit 1 and trail stop to entry."]
      : ["Immediate Market BUY execution confirmed by trend momentum and price action.", "Invalidation remains strictly protected below recent swing low.", "Move to break-even once price closes beyond Take Profit 1."]
    : isLimit
      ? ["Queue SELL LIMIT order at optimal premium / OTE bounce level to avoid selling at the bottom.", "Protective stop-loss is placed strictly above institutional swing resistance.", "Scale out 50% at Take Profit 1 and trail stop to entry."]
      : ["Immediate Market SELL execution confirmed by bearish structure break and momentum.", "Invalidation remains strictly protected above recent swing high.", "Reduce exposure if volatility expands before entry."];
  return {
    executionReadiness,
    marketRegime,
    grade,
    schoolAgreement: round(schoolAgreement, 0),
    dataQuality,
    riskQuality: round(riskQuality, 0),
    structureQuality: round(structureQuality, 0),
    session,
    trend,
    volumeProfile,
    smc: smcMap,
    patterns: patternPack.names,
    patternSignals: patternPack.signals,
    levels: { supports, resistances },
    fibonacci,
    zones,
    confluence,
    playbook,
    analysisMap: {
      price: round(price, 6),
      atr: round(atr14, 6),
      atrPct: round(atrPct, 3),
      rangePosition: round(rangePosition * 100, 2),
      support: round(structure.support, 6),
      resistance: round(structure.resistance, 6),
      trend,
      supports,
      resistances,
      fibonacci,
      zones,
      smc: smcMap,
      patterns: patternPack.names,
      candles: candles.slice(-300).map((c,index) => ({ time: c.time, open: round(c.open, 6), high: round(c.high, 6), low: round(c.low, 6), close: round(c.close, 6), volume: c.volume || 0,...Object.fromEntries([20,50,200].map(period=>{const line=indicatorLines[period],at=index+visibleStart-(candles.length-line.length);return ["ema"+period,at>=0?round(line[at],6):null]})) }))
    },
    professionalChecklist: [
      { item: "Broker spread check", status: "WAIT", detail: "Confirm spread, commission and swap before execution." },
      { item: "News calendar check", status: "WAIT", detail: "Avoid high-impact news windows unless this is part of your plan." },
      { item: "Kill-switch rule", status: riskPct <= 2 ? "PASS" : "WARNING", detail: "Stop trading after daily loss limit or two consecutive rule violations." },
      { item: "Alert-only policy", status: "PASS", detail: "The platform does not send live orders without broker authorization." }
    ]
  };
}


function buildAIAutomation({ symbol, decision, confidence, grade, professional, riskPct, exposurePct, structure, price, atr14, rangePosition, schools, volatilityLabel }) {
  const readiness = Number(professional?.executionReadiness || 0);
  const schoolAgreement = Number(professional?.schoolAgreement || 0);
  const dataQuality = Number(professional?.dataQuality || 0);
  const riskQuality = Number(professional?.riskQuality || 0);
  const structureQuality = Number(professional?.structureQuality || 0);
  const automationScore = round(clamp(readiness * 0.32 + riskQuality * 0.22 + dataQuality * 0.18 + structureQuality * 0.16 + confidence * 0.12, 0, 100), 0);
  const botStatus = riskPct > 2 ? "RISK_LOCKED" : decision === "WAIT" ? "AI_PATROL" : automationScore >= 72 ? "CONDITIONAL_ALERT_READY" : "REVIEW_ONLY";
  const mode = decision === "WAIT" ? "AI patrol mode" : "Conditional alert mode";
  const support = professional?.levels?.supports?.[0]?.price ?? structure?.support;
  const resistance = professional?.levels?.resistances?.[0]?.price ?? structure?.resistance;
  const atrBuffer = Math.max(Number(atr14 || 0) * 0.18, Math.abs(Number(price || 1)) * 0.00015);
  const bullishCount = (schools || []).filter(s => s.bias === "BULLISH").length;
  const bearishCount = (schools || []).filter(s => s.bias === "BEARISH").length;
  const neutralCount = (schools || []).filter(s => s.bias === "NEUTRAL").length;
  const isBuy = decision.includes("BUY");
  const isSell = decision.includes("SELL");
  const isLimit = decision.includes("LIMIT");
  const smartAlerts = [
    {
      name: "Resistance breakout confirmation",
      priority: isBuy ? "HIGH" : "MEDIUM",
      trigger: resistance ? round(resistance + atrBuffer, 6) : null,
      condition: "Alert when candle closes above resistance with RSI not overextended and spread acceptable.",
      reason: "Confirms bullish continuation instead of buying directly into resistance."
    },
    {
      name: "Support rejection confirmation",
      priority: isSell ? "HIGH" : "MEDIUM",
      trigger: support ? round(support - atrBuffer, 6) : null,
      condition: "Alert when price rejects support/resistance zone with confirmation candle.",
      reason: "Filters false breaks and avoids emotional entries."
    },
    {
      name: "Invalidation guard",
      priority: "HIGH",
      trigger: isBuy ? (support ? round(support - atrBuffer, 6) : null) : isSell ? (resistance ? round(resistance + atrBuffer, 6) : null) : null,
      condition: "Disable signal when price violates the nearest institutional level.",
      reason: "Prevents stale setups from remaining active after structure changes."
    },
    {
      name: "Momentum expansion watch",
      priority: volatilityLabel === "Low" ? "HIGH" : "MEDIUM",
      trigger: null,
      condition: "Alert when ATR and candle body expand after compression.",
      reason: "The AI waits for momentum before activating stronger opportunity alerts."
    }
  ];
  const nextBestAction = automationScore >= 72
    ? `Prepare ${decision} order in alert-only mode; verify broker spread and liquidity before execution.`
    : `Monitor ${decision} setup; wait for candle close and risk validation.`;
  return {
    mode,
    botStatus,
    automationScore,
    nextBestAction,
    schoolBalance: { bullish: bullishCount, bearish: bearishCount, neutral: neutralCount },
    smartAlerts,
    riskGovernor: {
      maxRiskPct: riskPct <= 1 ? "Professional" : riskPct <= 2 ? "Acceptable" : "Too aggressive",
      exposureState: exposurePct <= 100 ? "Controlled" : exposurePct <= 300 ? "Elevated" : "High exposure",
      rules: [
        "No live order execution in prototype mode.",
        "Calendar and executable broker spread are unavailable; verify them independently.",
        "Paper orders enforce daily loss and aggregate risk limits; scanner remains informational.",
        "Require manual confirmation for every trade ticket."
      ]
    },
    executionProtocol: [
      `AI reads ${symbol} across ${schools?.length || 0} schools and assigns grade ${grade}.`,
      `Automation score ${automationScore}/100 with ${schoolAgreement}% school agreement.`,
      "Only alerts are generated; execution remains manual and risk-controlled.",
      "If price reaches an alert trigger, re-run analysis before entering."
    ],
    chartBrief: {
      technical: `Trend: ${professional?.trend?.direction || "--"}; structure quality ${structureQuality}/100; nearest support ${round(support, 6)} and resistance ${round(resistance, 6)}.`,
      sk: (professional?.smc?.summary || []).length ? professional.smc.summary.join(" | ") : "SK/SMC map is monitoring pivots, liquidity, BOS/CHoCH and order blocks."
    }
  };
}

function buildAnalysis(market, request = {}) {
  const candles = market.candles;
  const closes = values(candles, "close");
  const highs = values(candles, "high");
  const lows = values(candles, "low");
  const last = candles[candles.length - 1];
  const price = last.close;
  const symbol = market.symbolInfo.display;
  const timeframe = String(request.timeframe || "intraday").toLowerCase();
  const accountBalance = Math.max(1, num(request.accountBalance, 10000));
  const riskPct = clamp(num(request.riskPct, 1), 0.05, 10);
  const desiredRR = clamp(num(request.rewardRisk, 2), 1, 5);
  const atr14 = atr(candles, 14) || Math.max(price * 0.005, 0.0001);
  const atrPct = (atr14 / price) * 100;
  const ema20 = ema(closes, 20);
  const ema50 = ema(closes, 50);
  const ema200 = ema(closes, 200);
  const sma20 = sma(closes, 20);
  const rsi14 = rsi(closes, 14);
  const macdData = macd(closes);
  const bb = bollinger(closes);
  const structure = detectStructure(candles);
  const returns = [];
  for (let i = 1; i < closes.length; i++) returns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  const retMean = returns.slice(-60).reduce((a, b) => a + b, 0) / Math.max(1, returns.slice(-60).length);
  const retStd = standardDeviation(returns.slice(-60));
  const zScore = retStd ? (returns[returns.length - 1] - retMean) / retStd : 0;
  const slope50 = linearRegressionSlope(closes.slice(-50));
  const slopePct = (slope50 / price) * 100;
  const volatilityLabel = atrPct > 3 ? "Extreme" : atrPct > 1.4 ? "High" : atrPct > 0.45 ? "Normal" : "Low";
  const patternPack = detectProfessionalPatterns(candles, structure, atr14, price);

  const technical = schoolTemplate("Technical Analysis");
  if (ema20 && ema50 && ema20 > ema50) addScore(technical, 24, "EMA 20 is above EMA 50, confirming bullish trend alignment.");
  if (ema20 && ema50 && ema20 < ema50) addScore(technical, -24, "EMA 20 is below EMA 50, confirming bearish trend alignment.");
  if (ema200 && price > ema200) addScore(technical, 10, "Price is above the long-term EMA filter.");
  if (ema200 && price < ema200) addScore(technical, -10, "Price is below the long-term EMA filter.");
  if (macdData.histogram > 0) addScore(technical, 14, "MACD histogram is positive.");
  if (macdData.histogram < 0) addScore(technical, -14, "MACD histogram is negative.");
  if (rsi14 >= 52 && rsi14 <= 68) addScore(technical, 12, "RSI supports bullish momentum without being extremely overbought.");
  if (rsi14 <= 48 && rsi14 >= 32) addScore(technical, -12, "RSI supports bearish momentum without being extremely oversold.");
  if (rsi14 > 72) technical.warnings.push("RSI is overbought; avoid late buying without confirmation.");
  if (rsi14 < 28) technical.warnings.push("RSI is oversold; avoid late selling without confirmation.");
  finalizeSchool(technical);

  const priceAction = schoolTemplate("Price Action");
  const range = Math.max(structure.resistance - structure.support, atr14);
  const rangePosition = clamp((price - structure.support) / range, 0, 1);
  const bodySize = Math.abs(last.close - last.open);
  const candleBullish = last.close > last.open && bodySize > atr14 * 0.25;
  const candleBearish = last.close < last.open && bodySize > atr14 * 0.25;

  // Real institutional price action: False breakout sweeps reverse; confirmed closes break through
  if (structure.sweepUp) {
    addScore(priceAction, -22, "Bearish liquidity sweep above resistance rejected; smart money trapped breakout buyers.");
  } else if (structure.sweepDown) {
    addScore(priceAction, 22, "Bullish liquidity sweep below support rejected; smart money trapped breakdown sellers.");
  } else if (price > structure.resistance && last.close > structure.resistance && candleBullish) {
    addScore(priceAction, 20, "Confirmed bullish breakout candle closed above active resistance.");
  } else if (price < structure.support && last.close < structure.support && candleBearish) {
    addScore(priceAction, -20, "Confirmed bearish breakdown candle closed below active support.");
  } else if (rangePosition < 0.32) {
    if (candleBullish) addScore(priceAction, 18, "Bullish price reaction off key support floor in discount zone.");
    else priceAction.reasons.push("Price is at support floor; awaiting bullish confirmation candle before entry.");
  } else if (rangePosition > 0.68) {
    if (candleBearish) addScore(priceAction, -18, "Bearish price rejection off key resistance ceiling in premium zone.");
    else priceAction.reasons.push("Price is at resistance ceiling; awaiting bearish confirmation candle before entry.");
  }

  if (structure.trendStructure === "Bullish structure") addScore(priceAction, 14, "Structural sequence of higher highs and higher lows is intact.");
  if (structure.trendStructure === "Bearish structure") addScore(priceAction, -14, "Structural sequence of lower highs and lower lows is intact.");
  finalizeSchool(priceAction);

  const smartMoney = schoolTemplate("Smart Money Concepts");
  if (structure.sweepDown) addScore(smartMoney, 24, "Sell-side liquidity pool swept; smart money accumulated orders in discount.");
  if (structure.sweepUp) addScore(smartMoney, -24, "Buy-side liquidity pool swept; smart money distributed orders in premium.");

  // Discount vs Premium SMC Rule
  if (rangePosition <= 0.45) {
    addScore(smartMoney, 12, "Price is trading in the institutional Discount zone (optimal accumulation area).");
  } else if (rangePosition >= 0.55) {
    addScore(smartMoney, -12, "Price is trading in the institutional Premium zone (optimal distribution area).");
  } else {
    smartMoney.reasons.push("Price is at range equilibrium (50%); no high-probability SMC discount/premium edge.");
  }

  // Check proximity to Order Blocks and Fair Value Gaps
  const smcMapData = buildSmartMoneyMap(candles, structure, atr14, price);
  const bullObs = (smcMapData.orderBlocks || []).filter(o => o.type === "BULLISH_OB");
  const bearObs = (smcMapData.orderBlocks || []).filter(o => o.type === "BEARISH_OB");
  const testingBullOb = bullObs.some(o => Math.abs(price - ((o.from + o.to) / 2)) <= atr14 * 0.75);
  const testingBearOb = bearObs.some(o => Math.abs(price - ((o.from + o.to) / 2)) <= atr14 * 0.75);
  if (testingBullOb) addScore(smartMoney, 16, "Price is retesting an active Bullish Demand Order Block.");
  if (testingBearOb) addScore(smartMoney, -16, "Price is retesting an active Bearish Supply Order Block.");

  const bullFvgs = (smcMapData.fvgs || []).filter(f => f.type === "BULLISH_FVG");
  const bearFvgs = (smcMapData.fvgs || []).filter(f => f.type === "BEARISH_FVG");
  if (bullFvgs.some(f => price >= f.bottom && price <= f.top + atr14 * 0.2)) {
    addScore(smartMoney, 12, "Price filled an institutional Bullish Fair Value Gap imbalance.");
  }
  if (bearFvgs.some(f => price <= f.top && price >= f.bottom - atr14 * 0.2)) {
    addScore(smartMoney, -12, "Price filled an institutional Bearish Fair Value Gap imbalance.");
  }
  finalizeSchool(smartMoney);

  const quant = schoolTemplate("Quantitative Model");
  if (slopePct > 0.015) addScore(quant, 18, "Linear regression slope shows positive statistical drift.");
  if (slopePct < -0.015) addScore(quant, -18, "Linear regression slope shows negative statistical drift.");
  if (zScore > 1.6) {
    addScore(quant, -14, "Latest candle return is statistically stretched (+1.6σ); high mean-reversion risk.");
    quant.warnings.push("Price is statistically extended to the upside; avoid chasing longs.");
  }
  if (zScore < -1.6) {
    addScore(quant, 14, "Latest candle return is statistically stretched (-1.6σ); high bounce probability.");
    quant.warnings.push("Price is statistically extended to the downside; avoid chasing shorts.");
  }
  if (bb.upper && price > bb.upper) quant.warnings.push("Price is piercing the upper Bollinger band; overextension filter active.");
  if (bb.lower && price < bb.lower) quant.warnings.push("Price is piercing the lower Bollinger band; overextension filter active.");
  finalizeSchool(quant);

  const macro = schoolTemplate("Fundamental / Sentiment Context");
  macro.reasons.push("No paid institutional news feed is connected, so this module stays conservative and uses market-data context only.");
  if (market.symbolInfo.assetClass === "Forex") macro.reasons.push("For forex pairs, confirm central-bank calendar, CPI, NFP, PMI, and rate expectations before execution.");
  if (market.symbolInfo.assetClass === "Commodity") macro.reasons.push("For commodities, confirm USD strength, real yields, inventory data, and geopolitical risk.");
  if (market.symbolInfo.assetClass === "Crypto") macro.reasons.push("For crypto, confirm BTC dominance, funding, ETF flows, and broad risk sentiment.");
  if (request.sentiment === "bullish") addScore(macro, 12, "User-provided sentiment context is bullish.");
  if (request.sentiment === "bearish") addScore(macro, -12, "User-provided sentiment context is bearish.");
  finalizeSchool(macro);

  const patternSchool = schoolTemplate("Pattern Recognition");
  for (const signal of patternPack.signals) {
    addScore(patternSchool, signal.score, signal.reason);
    if (signal.direction === "NEUTRAL") patternSchool.warnings.push(signal.reason);
  }
  if (!patternPack.signals.length) patternSchool.reasons.push("No high-probability chart pattern is dominant at the latest candle.");
  finalizeSchool(patternSchool);

  const volatilitySchool = schoolTemplate("Volume & Volatility");
  if (volatilityLabel === "Low") volatilitySchool.reasons.push("Low volatility regime: wait for expansion confirmation before chasing entries.");
  if (volatilityLabel === "Normal") volatilitySchool.reasons.push("Volatility regime is tradable with normal risk controls.");
  if (volatilityLabel === "High") volatilitySchool.warnings.push("High volatility: reduce size and demand cleaner confirmation.");
  if (volatilityLabel === "Extreme") volatilitySchool.warnings.push("Extreme volatility: professional desk mode is defensive.");
  if (bb.widthPct && bb.widthPct < 1) volatilitySchool.reasons.push("Bollinger bandwidth is compressed; breakout alert conditions are relevant.");
  if (bb.widthPct && bb.widthPct > 5) volatilitySchool.warnings.push("Bollinger bandwidth is wide; avoid late entries into exhaustion.");
  finalizeSchool(volatilitySchool);

  const governanceSchool = schoolTemplate("Risk Governance");
  governanceSchool.reasons.push("Risk governance validates whether the signal is tradable, not only directionally attractive.");
  if (riskPct <= 1) addScore(governanceSchool, 6, "Selected risk is conservative and suitable for professional process discipline.");
  if (riskPct > 2) { addScore(governanceSchool, -8, "Selected risk is above a conservative professional guardrail."); governanceSchool.warnings.push("Reduce risk per trade or require stronger confirmation."); }
  finalizeSchool(governanceSchool);

  const weights = {
    "Technical Analysis": 0.22,
    "Price Action": 0.22,
    "Smart Money Concepts": 0.20,
    "Quantitative Model": 0.16,
    "Fundamental / Sentiment Context": 0.06,
    "Pattern Recognition": 0.08,
    "Volume & Volatility": 0.03,
    "Risk Governance": 0
  };
  const schools = [technical, priceAction, smartMoney, quant, macro, patternSchool, volatilitySchool, governanceSchool];
  const consensusScore = schools.reduce((sum, s) => sum + s.directionScore * weights[s.name], 0);
  const absConsensus = Math.abs(consensusScore);

  // Directional agreement count among primary schools
  const bullSchoolsCount = [technical.bias === "BULLISH", priceAction.bias === "BULLISH", smartMoney.bias === "BULLISH", quant.bias === "BULLISH"].filter(Boolean).length;
  const bearSchoolsCount = [technical.bias === "BEARISH", priceAction.bias === "BEARISH", smartMoney.bias === "BEARISH", quant.bias === "BEARISH"].filter(Boolean).length;

  // Filter against chasing tops/bottoms
  const buyChasingTrap = rangePosition > 0.68 || rsi14 > 68 || (bb.upper && price >= bb.upper);
  const sellChasingTrap = rangePosition < 0.32 || rsi14 < 32 || (bb.lower && price <= bb.lower);

  // Dynamic Structural Stop Loss & Realistic Target Computation
  const recentSwings = findSwingPoints(candles, 40, 2);
  const swingLows = (recentSwings.lows || []).filter(p => p.price < price);
  const swingHighs = (recentSwings.highs || []).filter(p => p.price > price);
  const nearestLow = swingLows.at(-1)?.price || Math.min(...lows.slice(-18));
  const nearestHigh = swingHighs.at(-1)?.price || Math.max(...highs.slice(-18));

  // Optimal Pullback Entries (Discount OTE for Buys, Premium OTE for Sells)
  const bullOptimalEntry = Math.max(nearestLow + (price - nearestLow) * 0.45, price - atr14 * 0.38);
  const bearOptimalEntry = Math.min(nearestHigh - (nearestHigh - price) * 0.45, price + atr14 * 0.38);

  // Intelligent Actionable Decision Engine:
  // Provides professional trades in all circumstances. If immediate entry requires waiting,
  // it provides BUY LIMIT or SELL LIMIT orders at optimal structural pullback levels.
  let decision = "BUY";
  let isLimitOrder = false;

  if (consensusScore >= 18 && bullSchoolsCount >= 2 && !buyChasingTrap) {
    decision = "BUY";
  } else if (consensusScore <= -18 && bearSchoolsCount >= 2 && !sellChasingTrap) {
    decision = "SELL";
  } else if (consensusScore >= 10 && bullSchoolsCount >= 2) {decision="BUY LIMIT";isLimitOrder=true;}
  else if (consensusScore <= -10 && bearSchoolsCount >= 2) {decision="SELL LIMIT";isLimitOrder=true;}
  else {decision="WAIT";}

  const isBuy = decision.startsWith("BUY");
  const isSell = decision.startsWith("SELL");

  let optimalEntry = isBuy ? bullOptimalEntry : bearOptimalEntry;
  let entry = isLimitOrder ? optimalEntry : price;
  let stopLoss = null;
  let targets = [];

  if (isBuy) {
    const rawSL = nearestLow - atr14 * 0.28;
    const distance = entry - rawSL;
    if (distance < atr14 * 0.85) {
      stopLoss = entry - atr14 * 0.95;
    } else if (distance > atr14 * 2.1) {
      stopLoss = entry - atr14 * 1.65;
    } else {
      stopLoss = rawSL;
    }
    const riskDist = Math.max(Math.abs(entry - stopLoss), atr14 * 0.5);
    targets = [
      entry + riskDist * Math.min(desiredRR, 1.6),
      entry + riskDist * Math.max(desiredRR, 2.4),
      entry + riskDist * Math.max(desiredRR * 1.5, Math.max(desiredRR,2.4)+0.8)
    ];
  } else {
    const rawSL = nearestHigh + atr14 * 0.28;
    const distance = rawSL - entry;
    if (distance < atr14 * 0.85) {
      stopLoss = entry + atr14 * 0.95;
    } else if (distance > atr14 * 2.1) {
      stopLoss = entry + atr14 * 1.65;
    } else {
      stopLoss = rawSL;
    }
    const riskDist = Math.max(Math.abs(stopLoss - entry), atr14 * 0.5);
    targets = [
      entry - riskDist * Math.min(desiredRR, 1.6),
      entry - riskDist * Math.max(desiredRR, 2.4),
      entry - riskDist * Math.max(desiredRR * 1.5, Math.max(desiredRR,2.4)+0.8)
    ];
  }
  if(decision==="WAIT"||!market.provenance?.fresh||!Number.isFinite(entry)||!(entry>0)||!Number.isFinite(stopLoss)||!(stopLoss>0)||targets.some(target=>!Number.isFinite(target)||!(target>0))){decision="WAIT";entry=null;optimalEntry=null;stopLoss=null;targets=[];}
  const riskPerUnit = stopLoss ? Math.abs(entry - stopLoss) : null;
  const riskAmount = accountBalance * (riskPct / 100);
  let unitConversion=null;try{unitConversion=conversionFactor(symbol,stopLoss||price,"USD",request.pricing?.conversionRates||{},market.currency)}catch{}
  const units = riskPerUnit && unitConversion ? riskAmount / (riskPerUnit*unitConversion) : 0;
  const forexLots = market.symbolInfo.assetClass === "Forex" ? units / 100000 : null;
  let exposure=0;try{if(units>0)exposure=units*entry*conversionFactor(symbol,entry,"USD",request.pricing?.conversionRates||{},market.currency)}catch{}
  const exposurePct = (exposure / accountBalance) * 100;
  const actualRR=stopLoss&&targets.length?Math.abs(targets[0]-entry)/Math.abs(entry-stopLoss):null;
  const breakEvenWinRate = actualRR?100 / (1 + actualRR):null;
  const riskWarnings = [];
  if (riskPct > 2) riskWarnings.push("Risk per trade is above 2%; professional risk plans usually keep single-trade risk lower.");
  if (volatilityLabel === "Extreme") riskWarnings.push("ATR is extreme; reduce size or wait for volatility to normalize.");
  if (decision === "WAIT") riskWarnings.push("Consensus is not strong enough for a directional signal; waiting is the professional decision.");
  if (exposurePct > 500) riskWarnings.push("Nominal exposure is high relative to account size. Confirm broker contract value and margin before trading.");
  if (market.warning) riskWarnings.unshift(market.warning);

  const confidence = round(clamp(46 + absConsensus * 1.28 + (schools.filter(s => s.bias !== "NEUTRAL").length * 2.5) - (riskWarnings.length * 3.2), 18, 94), 0);
  const grade = confidence >= 82 ? "A+" : confidence >= 74 ? "A" : confidence >= 66 ? "B" : confidence >= 56 ? "C" : "D";
  const consensusLabel = consensusScore > 14 ? "BULLISH" : consensusScore < -14 ? "BEARISH" : "NEUTRAL";

  const scenarios = [
    { name: "Conservative", riskPct: Math.max(0.25, riskPct * 0.5), rr: Math.max(1.2, desiredRR * 0.75) },
    { name: "Balanced", riskPct, rr: desiredRR },
    { name: "Aggressive", riskPct: Math.min(5, riskPct * 1.5), rr: Math.min(5, desiredRR * 1.35) }
  ].map(s => ({
    ...s,
    riskAmount: round(accountBalance * (s.riskPct / 100), 2),
    potentialProfit: round(accountBalance * (s.riskPct / 100) * s.rr, 2),
    breakEvenWinRate: round(100 / (1 + s.rr), 2)
  }));

  const backtest = simulateBacktest({ confidence, rr: desiredRR, riskPct, accountBalance, consensusScore });
  const professional = buildProfessionalLayer({ candles, price, atr14, atrPct, ema20, ema50, ema200, rsi14, macdData, bb, structure, rangePosition, schools, decision, confidence, grade, consensusScore, riskPct, exposurePct, volatilityLabel, market, timeframe, request, patternPack });
  const aiAutomation = buildAIAutomation({ symbol, decision, confidence, grade, professional, riskPct, exposurePct, structure, price, atr14, rangePosition, schools, volatilityLabel });
  const allReasons = schools.flatMap(s => s.reasons.slice(0, 2));
  const allWarnings = [...riskWarnings, ...schools.flatMap(s => s.warnings)].filter(Boolean);

  const mtfa = {verdict:"UNAVAILABLE",score:null};
  const macroCalendar = buildMacroCalendar(market.symbolInfo);

  return {
    appName: "THN Trader",
    source: "THN Quantitative Engine",
    marketDataSource: market.source,
    provenance: market.provenance,
    symbol,
    yahooSymbol: market.symbolInfo.yahoo,
    tvSymbol: market.symbolInfo.tv,
    assetClass: market.symbolInfo.assetClass,
    timeframe,
    interval: market.interval,
    range: market.range,
    tvInterval: market.tvInterval,
    exchangeName: market.exchangeName,
    currency: market.currency,
    marketTime: market.marketTime,
    decision,
    consensusLabel,
    consensusScore: round(consensusScore, 2),
    confidence,
    confidenceType:"HEURISTIC_CONFLUENCE_NOT_PROBABILITY",
    grade,
    entry: round(entry, 6),
    optimalEntry: optimalEntry ? round(optimalEntry, 6) : round(entry, 6),
    stopLoss: stopLoss ? round(stopLoss, 6) : null,
    targets: targets.map(t => round(t, 6)),
    mtfa,
    macroCalendar,
    macroCalendarStatus:"UNAVAILABLE_NO_VERIFIED_PROVIDER",
    risk: {
      accountBalance: round(accountBalance, 2),
      riskPct: round(riskPct, 2),
      riskAmount: round(riskAmount, 2),
      riskPerUnit: riskPerUnit ? round(riskPerUnit, 6) : null,
      units: round(units, 4),
      forexLots: forexLots ? round(forexLots, 4) : null,
      exposure: round(exposure, 2),
      exposurePct: round(exposurePct, 2),
      rewardRisk: round(actualRR, 2),
      requestedRewardRisk:desiredRR,
      breakEvenWinRate: round(breakEvenWinRate, 2)
    },
    indicators: {
      price: round(price, 6),
      open: round(last.open, 6),
      high: round(last.high, 6),
      low: round(last.low, 6),
      ema20: round(ema20, 6),
      ema50: round(ema50, 6),
      ema200: round(ema200, 6),
      sma20: round(sma20, 6),
      rsi14: round(rsi14, 2),
      atr14: round(atr14, 6),
      atrPct: round(atrPct, 3),
      macd: round(macdData.macd, 6),
      macdSignal: round(macdData.signal, 6),
      macdHistogram: round(macdData.histogram, 6),
      bollingerUpper: round(bb.upper, 6),
      bollingerMiddle: round(bb.middle, 6),
      bollingerLower: round(bb.lower, 6),
      bollingerWidthPct: round(bb.widthPct, 3),
      returnZScore: round(zScore, 2),
      slopePct: round(slopePct, 5),
      volatilityLabel
    },
    structure: {
      support: round(structure.support, 6),
      resistance: round(structure.resistance, 6),
      recentHigh: round(structure.recentHigh, 6),
      recentLow: round(structure.recentLow, 6),
      trendStructure: structure.trendStructure,
      possibleSellSideSweep: structure.sweepDown,
      possibleBuySideSweep: structure.sweepUp,
      rangePosition: round(rangePosition * 100, 2)
    },
    schools,
    reasons: allReasons.slice(0, 9),
    warnings: allWarnings.length ? allWarnings.slice(0, 10) : ["No critical warning from the supplied data, but execution must still follow risk rules."],
    checklist: buildChecklist({ decision, riskPct, volatilityLabel, confidence, market, rsi14, stopLoss }),
    scenarios,
    backtest,
    professional,
    aiAutomation,
    candles: candles.slice(-300).map(c => ({ time: c.time, open: round(c.open, 6), high: round(c.high, 6), low: round(c.low, 6), close: round(c.close, 6), volume: c.volume })),
    aiNarrative: buildNarrative({ symbol, decision, confidence, grade, consensusLabel, schools, allWarnings, timeframe, market })
  };
}

async function fetchMTFA(symbol){
  const entries=[["d1","position","D1"],["h4","h4","H4"],["h1","intraday","H1"],["m15","scalp","M15"]];
  const result={score:null,verdict:"DATA INCOMPLETE"};
  await Promise.all(entries.map(async([key,timeframe,label])=>{try{const market=await getMarketData(symbol,timeframe);const closes=values(market.candles,"close"),fast=ema(closes,20),slow=ema(closes,50);if(!market.provenance.fresh||slow===null)throw Error("Fresh data and 50 closed candles required");result[key]={timeframe:label,trend:fast>slow?"BULLISH":fast<slow?"BEARISH":"NEUTRAL",detail:`${market.interval}: ${closes.length} closed bars; EMA20/EMA50`,provenance:market.provenance};}catch(error){result[key]={timeframe:label,trend:"UNAVAILABLE",detail:error.message}}}));
  const trends=entries.map(([key])=>result[key].trend);if(!trends.includes("UNAVAILABLE"))result.verdict=trends.every(x=>x==="BULLISH")?"BULLISH ALIGNMENT":trends.every(x=>x==="BEARISH")?"BEARISH ALIGNMENT":"MIXED TIMEFRAMES";
  return result;
}
function buildMacroCalendar(){return []} // No verified calendar provider configured.

function buildChecklist({ decision, riskPct, volatilityLabel, confidence, market, rsi14, stopLoss }) {
  return [
    { item: "Directional consensus", status: decision === "WAIT" ? "WAIT" : "PASS", detail: decision === "WAIT" ? "No trade until stronger confluence." : "Signal has directional consensus." },
    { item: "Risk per trade", status: riskPct <= 2 ? "PASS" : "WARNING", detail: `${riskPct}% risk selected.` },
    { item: "Volatility regime", status: volatilityLabel === "Extreme" ? "WARNING" : "PASS", detail: `${volatilityLabel} ATR regime.` },
    { item: "RSI safety", status: rsi14 > 25 && rsi14 < 75 ? "PASS" : "WARNING", detail: `RSI ${round(rsi14, 2)}.` },
    { item: "Stop-loss present", status: stopLoss ? "PASS" : "WAIT", detail: stopLoss ? "SL calculated from ATR and structure." : "No SL because no trade signal." },
    { item: "Market data", status: market.warning ? "WARNING" : "PASS", detail: market.source }
  ];
}

function simulateBacktest() {
  return {simulationType:"UNAVAILABLE",isHistoricalBacktest:false,trades:null,wins:null,losses:null,estimatedWinRate:null,estimatedReturnPct:null,endingBalance:null,maxDrawdownPct:null,profitFactor:null,provenance:"No historical strategy evaluation implemented",note:"Performance unavailable; analysis confidence cannot estimate profitability."};
}

function buildNarrative({ symbol, decision, confidence, grade, consensusLabel, schools, allWarnings, timeframe, market }) {
  const leaders = schools
    .filter(s => s.bias !== "NEUTRAL")
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(s => `${s.name}: ${s.bias} (${s.score}/100)`)
    .join("; ");
  const caution = allWarnings.length ? allWarnings[0] : "No major internal warning was detected.";
  return `THN AI Trader classifies ${symbol} as ${decision} on the ${timeframe} profile with ${confidence}% confidence and grade ${grade}. The multi-school consensus is ${consensusLabel}. Strongest modules: ${leaders || "no directional module dominance"}. Data source: ${market.source}. Main caution: ${caution} This output is an analytical decision-support report, not financial advice.`;
}


function buildAutomationSignal(analysis, minConfidence = 72) {
  const decision = analysis.decision || "BUY";
  const isDirectional = decision.startsWith("BUY") || decision.startsWith("SELL");
  const warningText = (analysis.warnings || []).join(" ").toLowerCase();
  const liveData = analysis.provenance?.state === "REAL" && analysis.provenance?.fresh === true && analysis.provenance?.verified === true && analysis.provenance?.instrumentMatch === true;
  const stopReady = Boolean(analysis.stopLoss && analysis.targets?.length);
  const riskPct = Number(analysis.risk?.riskPct || 0);
  const exposurePct = Number(analysis.risk?.exposurePct || 0);
  const riskQuality = stopReady && riskPct <= 2 && exposurePct <= 500 ? 100 : stopReady && riskPct <= 3 ? 78 : stopReady ? 60 : 35;
  const dataQuality = liveData ? 96 : 56;
  const desiredBias = decision.startsWith("BUY") ? "BULLISH" : decision.startsWith("SELL") ? "BEARISH" : "NEUTRAL";
  const schools = Array.isArray(analysis.schools) ? analysis.schools : [];
  const alignedSchools = isDirectional ? schools.filter(s => s.bias === desiredBias).length : 0;
  const schoolAgreement = schools.length ? (alignedSchools / schools.length) * 100 : 0;
  const confidence = Number(analysis.confidence || 0);
  const trustScore = round(clamp(confidence * 0.45 + dataQuality * 0.22 + riskQuality * 0.20 + schoolAgreement * 0.13, 0, 100), 0);
  const threshold = clamp(num(minConfidence, 72), 50, 95);
  const blockedReasons = [];
  if (!isDirectional) blockedReasons.push("No directional trade signal yet.");
  if (confidence < threshold) blockedReasons.push(`Confidence ${confidence}% is below the ${threshold}% alert threshold.`);
  if (!stopReady) blockedReasons.push("Stop-loss and target levels are not ready.");
  if(Object.values(analysis.mtfa||{}).some(row=>row?.trend==="UNAVAILABLE"))blockedReasons.push("Independent timeframe data incomplete");
  if(!(analysis.risk?.units>0))blockedReasons.push("Verified position sizing unavailable");
  if (!liveData) blockedReasons.push("Live data was unavailable; alert downgraded until verified data returns.");
  if (riskPct > 2) blockedReasons.push("Risk per trade is above the professional 2% guardrail.");
  if (exposurePct > 500) blockedReasons.push("Exposure is high relative to account size.");
  const active = blockedReasons.length === 0 && trustScore >= 72;
  const severity = active && trustScore >= 84 ? "strong-entry" : active ? "qualified-entry" : isDirectional ? "review" : "none";
  const directionWord = decision.includes("BUY") ? (decision.includes("LIMIT") ? "buy limit" : "long") : decision.includes("SELL") ? (decision.includes("LIMIT") ? "sell limit" : "short") : "stand aside";
  return {
    mode: "ALERT_ONLY",
    active,
    severity,
    trustScore,
    threshold,
    alignedSchools,
    totalSchools: schools.length,
    liveData,
    riskQuality: round(riskQuality, 0),
    dataQuality: round(dataQuality, 0),
    schoolAgreement: round(schoolAgreement, 0),
    blockedReasons,
    summary: active
      ? `${analysis.symbol} has a ${severity.replace("-", " ")} ${directionWord} setup. Review spread, news, liquidity, and account risk before execution.`
      : `${analysis.symbol} is not cleared for automation. ${blockedReasons[0] || "Wait for stronger confirmation."}`,
    executionPolicy: "Alert only. No live order is sent by this prototype."
  };
}

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8"
};

function setBaseHeaders(res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' https://s3.tradingview.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; frame-src https://*.tradingview.com; connect-src 'self'; base-uri 'self'; frame-ancestors 'none'");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
}

function sendJson(res, statusCode, data) {
  if(statusCode===413)res.setHeader("Connection","close");
  if(statusCode>=500)rollbackTransaction();else commitTransaction();
  setBaseHeaders(res);

  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  if (req.parsedBody !== undefined) return Promise.resolve(req.parsedBody);
  return new Promise((resolve, reject) => {
    let body = "", oversized=false;
    req.on("data", chunk => {
      if(oversized)return;
      body += chunk;
      if (body.length > 1_000_000) {
        oversized=true;req.pause();
        reject(Object.assign(new Error("Request body too large"),{status:413}));
      }
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        const parsed=JSON.parse(body);if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))throw Error("Invalid JSON body");
        for(const field of ["broker","symbol","side","accountId","ticket","orderId","idempotencyKey","server","accountNumber","apiToken","permissionLevel","currency","tradingMode","timeframe"])if(parsed[field]!==undefined&&(typeof parsed[field]!=="string"||parsed[field].length>4096))throw Error("Invalid JSON body");
        for(const field of ["lots","stopLoss","takeProfit","entryPrice","currentPrice","volumeRatio","leverage","balance","accountBalance","riskPct","rewardRisk","minConfidence"])if(parsed[field]!==undefined&&!Number.isFinite(parsed[field]))throw Error("Invalid JSON body");
        resolve(parsed);
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function safeStaticPath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const cleanPath = decoded === "/" ? "/index.html" : decoded;
  const target = path.normalize(path.join(__dirname, "public", cleanPath));
  const publicRoot = path.join(__dirname, "public");
  if (!target.startsWith(publicRoot + path.sep)) return null;
  return target;
}

function serveFile(res, filePath) {
  if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    filePath = path.join(__dirname, "public", "index.html");
  }
  const ext = path.extname(filePath).toLowerCase();
  setBaseHeaders(res);
  res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
  fs.createReadStream(filePath).pipe(res);
}

async function handleRequest(req,res) {
  setBaseHeaders(res);
  const correlationId=crypto.randomUUID();
  res.setHeader("X-Correlation-ID",correlationId);
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    if (req.method === "POST") assertOrigin(req);
    const expensive=["/api/analyze","/api/watchlist/scan","/api/quotes","/api/market/quotes","/api/accounts/recovery"].includes(url.pathname)||url.pathname.startsWith("/api/market/");
    const kind=url.pathname==="/api/session"&&req.method==="POST"?"login":expensive?"provider":"api";
    if(url.pathname.startsWith("/api/")&&!['/api/health','/api/readiness'].includes(url.pathname)&&!allowRequest(authenticate(req)||req.socket.remoteAddress,kind,kind==="login"?10:kind==="provider"?30:240)){res.setHeader("Retry-After","60");return sendJson(res,429,{ok:false,error:"Request budget exceeded",code:"REQUEST_RATE_LIMITED",retryAfter:60,correlationId})}

    if (url.pathname === "/api/session") {
      if (req.method === "POST") { const body=await readBody(req); const user=authenticateToken(body.token); if(!user){logout(req,res);return sendJson(res,401,{ok:false,error:"Invalid credentials"})} logout(req,res);createSession(user,res,Boolean(process.env.THN_PUBLIC_ORIGIN?.startsWith("https:"))); return sendJson(res,200,{ok:true,user}); }
      if(req.method === "DELETE") { assertOrigin(req); logout(req,res); return sendJson(res,200,{ok:true}); }
      return sendJson(res,200,{ok:true,user:authenticate(req),authenticationConfigured:Boolean(process.env.THN_AUTH_TOKEN||process.env.THN_AUTH_USERS),liveExecutionEnabled:false});
    }
    req.user=authenticate(req);
    if (/^\/api\/(accounts|broker|orders|positions|audit-logs|ledger|risk)(\/|$)/.test(url.pathname)) {
      if(req.user)res.setHeader("X-Session-User",req.user);
      if (!req.user) return sendJson(res,401,{ok:false,error:"Sign in to access trading accounts",code:"AUTH_REQUIRED"});
      if (req.method === "POST") {
        req.parsedBody=await readBody(req);
        if (/^\/api\/(orders|positions)\//.test(url.pathname)||["/api/broker/reset-sandbox","/api/broker/reconcile","/api/accounts/delete","/api/broker/delete-account"].includes(url.pathname)) assertAccountOwner(getAccountById(req.parsedBody.accountId||"acc_paper_sandbox_01"),req.user);
        if (/^\/api\/(orders|positions)\//.test(url.pathname)){const a=getAccountById(req.parsedBody.accountId);if(a&&(a.permissionLevel!=="TRADING_ENABLED"||a.broker!=="paper"||a.tradingMode!=="PAPER"))throw Object.assign(Error("Execution not permitted"),{status:403})}
      }
    }
    if (req.method === "GET" && url.pathname === "/api/readiness") return sendJson(res,200,{ok:true,liveExecutionEnabled:false,marketData:marketReadiness(),openai:openaiReadiness(),brokers:{live:"DISABLED_UNVERIFIED"}});
    if (req.method === "GET" && url.pathname === "/api/health") {
      return sendJson(res, 200, { ok: true, app: "THN AI Trader", version: "6.0.0", liveExecutionEnabled: false, openaiEnabled, serverTime: new Date().toISOString() });
    }

    if (req.method === "GET" && url.pathname.startsWith("/api/market/") && url.pathname !== "/api/market/quotes") {
      const symbol = decodeURIComponent(url.pathname.replace("/api/market/", ""));
      const timeframe = url.searchParams.get("timeframe") || "intraday";
      const market = await getMarketData(symbol, timeframe);
      return sendJson(res, 200, {
        symbolInfo: market.symbolInfo,
        source: market.source,
        provenance: market.provenance,
        warning: market.warning,
        currency: market.currency,
        exchangeName: market.exchangeName,
        marketTime: market.marketTime,
        interval: market.interval,
        range: market.range,
        tvInterval: market.tvInterval,
        last: market.candles.at(-1),
        candles: market.candles.slice(-300)
      });
    }

    if (req.method === "GET" && (url.pathname === "/api/quotes" || url.pathname === "/api/market/quotes")) {
      const requested=url.searchParams.get("symbols");
      const symbolsToFetch=requested?[...new Set(requested.split(",").map(s=>s.trim().toUpperCase()).filter(Boolean))]:["XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "BTCUSDT", "US30"];
      if(!symbolsToFetch.length||symbolsToFetch.length>30)return sendJson(res,400,{ok:false,error:"Quote batch must contain 1–30 instruments"});
      const quotes = {}, errors = {};
      await Promise.allSettled(symbolsToFetch.map(async sym => {
        try {
          const m = await getMarketData(sym, "intraday");
          const valid = (m.candles || []).filter(c => c && Number(c.close) > 0);
          const lastCandle = valid.at(-1);
          if (lastCandle) {
            const quoteSymbol=m.symbolInfo.display;
            const spec = getContractSpec(quoteSymbol);
            const close = Number(m.quotePrice);
            const prevClose = valid.at(-2)?.close ? Number(valid.at(-2).close) : close;
            const changePct = prevClose > 0 ? +(((close - prevClose) / prevClose) * 100).toFixed(2) : 0;
            const spreadOffset = (spec.pipSize || 0.0001) * 0.8;
            quotes[quoteSymbol] = {
              symbol: quoteSymbol,
              name: m.symbolInfo.display,
              assetClass: m.symbolInfo.assetClass,
              currency:m.currency,
              bid: +(close - spreadOffset / 2).toFixed(spec.digits),
              ask: +(close + spreadOffset / 2).toFixed(spec.digits),
              close,
              changePct,
              digits: spec.digits,
              contractSize: spec.contractSize,
              minLot:spec.minLot,maxLot:spec.maxLot,lotStep:spec.lotStep,
              source: m.source,
              provenance: m.provenance,
              executable: false,
              spreadModel: "Paper approximation; not broker bid/ask",
              timestamp: m.marketTime
            };
          }
        } catch (err) {
          errors[sym]={code:err.code||"MARKET_UNAVAILABLE",error:err.message,retryAfter:err.retryAfter||15};
        }
      }));
      const available=Object.keys(quotes).length;
      const retryAfter=Object.keys(errors).length?Math.max(...Object.values(errors).map(error=>error.retryAfter)):0;
      if(Object.keys(errors).length)console.warn(JSON.stringify({event:"quote_batch_degraded",correlationId,availableCount:available,failedCount:Object.keys(errors).length}));
      if(!available&&retryAfter)res.setHeader("Retry-After",String(retryAfter));
      return sendJson(res, available?200:Object.values(errors).some(error=>error.code==="PROVIDER_RATE_LIMITED")?429:503, { ok: available>0, state:available?(Object.keys(errors).length?"DEGRADED":"AVAILABLE"):"UNAVAILABLE", quotes, errors, retryAfter, correlationId, timestamp: new Date().toISOString() });
    }

    if (req.method === "POST" && url.pathname === "/api/analyze") {
      const body = await readBody(req);
      const market = await getMarketData(body.symbol || "EURUSD", body.timeframe || "intraday");
      try{body.pricing=await getPaperPricing(market)}catch{}
      const analysis = buildAnalysis(market, body);
      if(!market.provenance.fresh||!market.provenance.instrumentMatch){analysis.decision="WAIT";analysis.entry=null;analysis.stopLoss=null;analysis.targets=[];analysis.warnings.unshift(market.warning)}
      analysis.mtfa=await fetchMTFA(market.symbolInfo.display);
      const enhanced = await enhanceWithOpenAI(analysis,req.user);
      return sendJson(res, 200, enhanced);
    }


    if (req.method === "POST" && url.pathname === "/api/watchlist/scan") {
      const body = await readBody(req);
      const symbols = Array.isArray(body.symbols)
        ? body.symbols
        : String(body.symbols || "").split(/[,\s]+/);
      const uniqueSymbols = [...new Set(symbols.map(x => String(x || "").trim().toUpperCase()).filter(Boolean))];
      if(uniqueSymbols.length>30)return sendJson(res,400,{ok:false,error:"Maximum 30 instruments"});
      if (!uniqueSymbols.length) return sendJson(res, 400, { ok: false, error: "No symbols supplied" });
      const minConfidence = clamp(num(body.minConfidence, 72), 50, 95);
      const scanDeadline=Date.now()+20000;
      const results = await mapConcurrent(uniqueSymbols,async symbol=>{
        try {
          if(Date.now()>scanDeadline||res.destroyed)throw Error("Scan deadline reached or client disconnected");
          const market = await getMarketData(symbol, body.timeframe || "intraday");
          try{body.pricing=await getPaperPricing(market)}catch{}
      const analysis = buildAnalysis(market, body);
      if(!market.provenance.fresh||!market.provenance.instrumentMatch){analysis.decision="WAIT";analysis.entry=null;analysis.stopLoss=null;analysis.targets=[];analysis.warnings.unshift(market.warning)}
          analysis.mtfa=await fetchMTFA(market.symbolInfo.display);
          if(Date.now()>scanDeadline||res.destroyed)throw Error("Scan expired before qualification");
          const automation = buildAutomationSignal(analysis, minConfidence);
          const setupId=crypto.createHash("sha256").update(JSON.stringify({symbol:analysis.symbol,timeframe:analysis.timeframe,bar:market.candles.at(-1).time,decision:analysis.decision,entry:analysis.entry,sl:analysis.stopLoss,targets:analysis.targets})).digest("hex");
          return {
            symbol: analysis.symbol,
            requestedSymbol: symbol,
            timeframe:analysis.timeframe,
            setupId,
            assetClass: analysis.assetClass,
            decision: analysis.decision,
            confidence: analysis.confidence,
            grade: analysis.grade,
            consensusScore: analysis.consensusScore,
            entry: analysis.entry,
            optimalEntry: analysis.optimalEntry || analysis.entry,
            stopLoss: analysis.stopLoss,
            targets: analysis.targets,
            risk: analysis.risk,
            marketTime: analysis.marketTime,
            provenance: analysis.provenance,
            marketDataSource: analysis.marketDataSource,
            tvSymbol: analysis.tvSymbol,
            tvInterval: analysis.tvInterval,
            warnings: analysis.warnings,
            reasons: analysis.reasons,
            automation
          };
        } catch (error) {
          return { requestedSymbol: symbol, symbol, decision: "WAIT", confidence: 0, grade: "D", error: error.message, automation: { mode: "ALERT_ONLY", active: false, severity: "error", trustScore: 0, blockedReasons: [error.message], executionPolicy: "Alert only. No live order is sent by this prototype." } };
        }
      });
      const strongAlerts = results.filter(item => item.automation?.active);
      return sendJson(res, 200, {
        ok: true,
        automationMode: "ALERT_ONLY",
        scannedAt: new Date().toISOString(),
        minConfidence,
        count: results.length,
        strongAlertCount: strongAlerts.length,
        results
      });
    }

    // --- Production Trading Accounts & Broker Adapter Endpoints ---

    if (req.method === "GET" && (url.pathname === "/api/accounts" || url.pathname === "/api/broker/accounts")) {
      const accounts = getAllSanitizedAccounts(req.user);
      return sendJson(res, 200, { ok: true, accounts });
    }

    if (req.method === "POST" && url.pathname === "/api/accounts/test-connection") {
      const body = await readBody(req);
      const broker = (body.broker || "paper").toLowerCase();
      const adapter = getBrokerAdapter(broker);
      try {
        const testResult = await adapter.testConnection({
          server: body.server,
          accountNumber: body.accountNumber,
          apiToken: body.apiToken
        });
        return sendJson(res, 200, testResult);
      } catch (err) {
        return sendJson(res, 400, { ok: false, error: err.message, status: "CONNECTION_FAILED" });
      }
    }

    if (req.method === "POST" && (url.pathname === "/api/accounts/connect" || url.pathname === "/api/broker/connect-account")) {
      const body = await readBody(req);
      const broker = (body.broker || "paper").toLowerCase();
      const server = (body.server || "Sandbox").trim();
      const accountNumber = (body.accountNumber || `ACC-${Date.now().toString().slice(-6)}`).trim();
      const apiToken = (body.apiToken || "").trim();
      const permissionLevel = body.permissionLevel === "READ_ONLY" ? "READ_ONLY" : "TRADING_ENABLED";
      const tradingMode = broker === "paper" ? "PAPER" : (body.tradingMode === "LIVE" ? "LIVE" : "LIVE");
      const currency = (body.currency || "USD").toUpperCase();
      const leverage = Number(body.leverage || 200);
      const balance = body.balance ?? 50000;
      if (!Number.isFinite(balance) || balance < 0) return sendJson(res,400,{ok:false,error:"Balance must be a finite non-negative number"});

      // If connecting a live broker, test connection through adapter
      if (broker !== "paper") {
        const adapter = getBrokerAdapter(broker);
        try {
          const testRes = await adapter.testConnection({ server, accountNumber, apiToken });
          if (!testRes.ok && testRes.status !== "CONNECTED") {
            // If bridge is offline, still record as standby if user requested, but clearly flag offline status
            console.warn(`[BROKER CONNECT] Notice: ${testRes.message}`);
          }
        } catch (testErr) {
          console.warn(`[BROKER CONNECT] Adapter test warning: ${testErr.message}`);
        }
      }

      if(currency!=="USD"||!Number.isFinite(leverage)||leverage<1||leverage>200)return sendJson(res,400,{ok:false,error:"USD account and leverage 1–200 required"});
      if (broker !== "paper") return sendJson(res,403,{ok:false,error:"Live broker integration is disabled pending verification",code:"LIVE_DISABLED"});
      const newAccount = addTradingAccount({
        ownerId: req.user,
        broker,
        server,
        accountNumber,
        apiToken,
        permissionLevel,
        currency,
        leverage,
        balance,
        tradingMode
      });

      return sendJson(res, 200, {
        ok: true,
        account: newAccount,
        message: `Trading account ${newAccount.accountAlias} linked successfully.`
      });
    }

    if (req.method === "POST" && url.pathname === "/api/broker/register-account") {
      const body = await readBody(req);
      const broker = (body.broker || "exness").toLowerCase();
      if((body.currency||"USD").toUpperCase()!=="USD"||!Number.isFinite(body.leverage||200)||(body.leverage||200)<1||(body.leverage||200)>200)return sendJson(res,400,{ok:false,error:"USD account and leverage 1–200 required"});
      const randomAccNum = `${broker.toUpperCase().slice(0, 3)}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
      if (broker !== "paper") return sendJson(res,403,{ok:false,error:"Live broker integration is disabled pending verification",code:"LIVE_DISABLED"});
      const newAccount = addTradingAccount({
        ownerId: req.user,
        broker,
        server: `${broker.toUpperCase()}-Live02`,
        accountNumber: randomAccNum,
        apiToken: `tok_${broker}_${Date.now()}`,
        permissionLevel: "TRADING_ENABLED",
        currency: (body.currency || "USD").toUpperCase(),
        leverage: Number(body.leverage || 200),
        balance: broker === "paper" ? 50000 : 0,
        tradingMode: broker === "paper" ? "PAPER" : "LIVE"
      });

      return sendJson(res, 200, {
        ok: true,
        account: newAccount,
        message: `Linked external ${newAccount.brokerName} (#${newAccount.accountNumberMasked}). Awaiting broker bridge verification.`
      });
    }

    if (req.method === "POST" && url.pathname === "/api/broker/reconcile") {
      const body = await readBody(req);
      const accountId = body.accountId || "acc_paper_sandbox_01";
      try {
        const report = await reconcileAccount(accountId);
        return sendJson(res, 200, report);
      } catch (err) {
        return sendJson(res, 400, { ok: false, error: err.message });
      }
    }

    if (req.method === "POST" && url.pathname === "/api/broker/reset-sandbox") {
      const body = await readBody(req);
      const accountId = body.accountId || "acc_paper_sandbox_01";
      const account = getAccountById(accountId);
      if (account && account.broker === "paper" && account.tradingMode === "PAPER" && account.permissionLevel === "TRADING_ENABLED") {
        account.balance = 50000.0;
        account.equity = 50000.0;
        account.freeMargin = 50000.0;
        account.usedMargin = 0.0;
        account.marginLevel = 999.0;
        account.dailyRealizedPnl = 0.0;
        account.todayTradesCount = 0;
        account.positions = [];
        account.orders = [];account.accountEpoch=crypto.randomUUID();account.startingBalance=50000;
        account.riskDay=new Date().toISOString().slice(0,10);account.dayStartBalance=50000;
        saveTradingAccounts();
        logAuditEvent({
          eventType: "SANDBOX_RESET",
          accountId: account.id,
          details: { balance: 50000.0 }
        });
        return sendJson(res, 200, {
          ok: true,
          account: sanitizeAccountForClient(account),
          message: "Sandbox paper trading portfolio reset to $50,000.00."
        });
      }
      return sendJson(res, 404, { ok: false, error: "Sandbox account not found" });
    }

    if (req.method === "POST" && (url.pathname === "/api/accounts/delete" || url.pathname === "/api/broker/delete-account")) {
      const body = await readBody(req);
      const accountId = body.accountId;
      const target=getAccountById(accountId);if(target?.positions?.length||target?.orders?.length)return sendJson(res,409,{ok:false,error:"Close positions and cancel pending orders before deleting the account"});
      try {
        const remaining = removeTradingAccount(accountId).filter(a=>a.ownerId===req.user);
        return sendJson(res, 200, { ok: true, accounts: remaining });
      } catch (err) {
        return sendJson(res, 400, { ok: false, error: err.message });
      }
    }

    if(req.method==="GET"&&url.pathname==="/api/accounts/recovery"){
      const account=getAccountById(url.searchParams.get("accountId"));assertAccountOwner(account,req.user);
      if(account.broker!=="paper"||account.tradingMode!=="PAPER")return sendJson(res,403,{ok:false,code:"LIVE_DISABLED",error:"Paper accounts only"});
      return sendJson(res,200,{ok:true,...await inspectPaperRecovery(account),correlationId});
    }

    // --- Backend-Authoritative Order Execution ---
    if (req.method === "POST" && url.pathname === "/api/orders/execute") {
      const body = await readBody(req);
      const { accountId, symbol, side, lots, stopLoss, takeProfit, idempotencyKey } = body;

      // 1. Idempotency Check
      if (!idempotencyKey) return sendJson(res,400,{ok:false,error:"Idempotency key required"});
      if (idempotencyKey) {
        const idem = checkAndStoreIdempotencyKey(`${req.user}:${accountId}:${idempotencyKey}`,body);
        if (idem.isDuplicate && idem.response) {
          return sendJson(res, 200, idem.response);
        }
      }

      // 2. Account Check
      const account = getAccountById(accountId);
      if (!account) {
        return sendJson(res, 404, { ok: false, error: "Target trading account not found.", code: "ACCOUNT_NOT_FOUND" });
      }

      // 3. Permission Check
      if (account.broker !== "paper" || account.tradingMode !== "PAPER") return sendJson(res,403,{ok:false,error:"Live execution disabled",code:"LIVE_DISABLED"});
      if (account.permissionLevel !== "TRADING_ENABLED") {
        logAuditEvent({
          eventType: "ORDER_REJECTED",
          accountId: account.id,
          symbol,
          details: { reason: "Account is in READ_ONLY mode" },
          status: "REJECTED"
        });
        return sendJson(res, 403, {
          ok: false,
          error: "Order blocked: This account is connected in READ-ONLY mode. Live order submission is disabled.",
          code: "PERMISSION_DENIED"
        });
      }

      await refreshPaperRisk(account);
      // 4. Retrieve Live Market Quote
      let market;
      try {
        market = await getMarketData(symbol || "EURUSD", "intraday");
      } catch (err) {
        return sendJson(res, 502, { ok: false, error: `Market data feed unavailable for ${symbol}: ${err.message}`, code: "STALE_PRICE" });
      }

      const validCandles = (market.candles || []).filter(c => c && Number(c.close) > 0);
      const lastCandle = validCandles.at(-1);
      assertPaperMarket(market);
      const currentPrice = Number(market.quotePrice);
      if (!currentPrice || currentPrice <= 0) {
        return sendJson(res, 502, { ok: false, error: `Invalid quote price for ${symbol}`, code: "INVALID_QUOTE" });
      }

      // 5. Backend Risk Engine Validation
      const pricing=await getPaperPricing(market,account.currency);
      const riskValidation = validateOrderRisk({ account, order: body, currentPrice, ...pricing });
      if (!riskValidation.approved) {
        logAuditEvent({
          eventType: "ORDER_REJECTED",
          accountId: account.id,
          symbol,
          details: { reason: riskValidation.reason, code: riskValidation.code },
          status: "REJECTED"
        });
        return sendJson(res, 400, {
          ok: false,
          error: riskValidation.reason,
          code: riskValidation.code
        });
      }

      // 6. Execute Order through Broker Adapter
      const adapter = getBrokerAdapter(account.broker);
      try {
        const orderResult = await adapter.placeOrder(account, body, currentPrice, pricing);

        if(orderResult.pendingOrder){account.orders.push({...orderResult.pendingOrder,riskDollars:riskValidation.riskMetrics.slRiskUpperBound,reservedMargin:riskValidation.requiredMargin});account.freeMargin=Math.max(0,account.freeMargin-riskValidation.requiredMargin);saveTradingAccounts()}
        // Deduct margin & add position to account
        if (orderResult.position) {
          if (!account.positions) account.positions = [];
          account.positions.unshift(orderResult.position);
          account.usedMargin = +(Number(account.usedMargin || 0) + orderResult.requiredMargin).toFixed(2);
          account.freeMargin = Math.max(0, +(Number(account.equity || account.balance) - account.usedMargin - account.orders.reduce((sum,o)=>sum+Number(o.reservedMargin||0),0)).toFixed(2));
          account.todayTradesCount = Number(account.todayTradesCount || 0) + 1;
          saveTradingAccounts();
        }

        const sanitized = sanitizeAccountForClient(account);
        const responseData = {
          ok: true,
          orderResult,
          account: sanitized,
          message: orderResult.message || `Order filled: ${side} ${lots} ${symbol} @ ${orderResult.executedPrice}`
        };

        logAuditEvent({
          eventType: orderResult.status==="PENDING"?"ORDER_PENDING":"ORDER_FILLED",
          accountId: account.id,
          symbol,
          details: {
            ticket: orderResult.ticket,
            side,
            lots,
            executedPrice: orderResult.executedPrice,
            requiredMargin: orderResult.requiredMargin
          },
          status: "SUCCESS"
        });

        if (idempotencyKey) {
          saveIdempotencyResponse(`${req.user}:${accountId}:${idempotencyKey}`, responseData);
        }

        return sendJson(res, 200, responseData);
      } catch (execErr) {
        logAuditEvent({
          eventType: "ORDER_FAILED",
          accountId: account.id,
          symbol,
          details: { error: execErr.message },
          status: "ERROR"
        });
        return sendJson(res, 500, { ok: false, error: execErr.message, code: "EXECUTION_FAILED" });
      }
    }

    if(req.method==="POST"&&url.pathname==="/api/orders/cancel"){
      const body=await readBody(req),account=getAccountById(body.accountId);
      const order=account.orders.find(o=>o.id===body.orderId);if(!order)return sendJson(res,404,{ok:false,error:"Pending order not found"});
      account.orders=account.orders.filter(o=>o.id!==body.orderId);account.freeMargin+=order.reservedMargin||0;saveTradingAccounts();logAuditEvent({eventType:"PENDING_CANCELLED",accountId:account.id,details:{orderId:order.id}});return sendJson(res,200,{ok:true,account:sanitizeAccountForClient(account)});
    }

    // --- Backend Position Closing ---
    if (req.method === "POST" && url.pathname === "/api/positions/close") {
      const body = await readBody(req);
      const { accountId, ticket, volumeRatio = 1.0, symbol } = body;
      if(!body.idempotencyKey)return sendJson(res,400,{ok:false,error:"Close idempotency key required"});
      const closeKey=`close:${req.user}:${accountId}:${body.idempotencyKey}`;
      const previous=checkAndStoreIdempotencyKey(closeKey,body);if(previous.response)return sendJson(res,200,previous.response);

      const account = getAccountById(accountId);
      if (!account) {
        return sendJson(res, 404, { ok: false, error: "Account not found." });
      }

      if(account.broker!=="paper"||account.tradingMode!=="PAPER"||account.permissionLevel!=="TRADING_ENABLED") return sendJson(res,403,{ok:false,error:"Position closing is not permitted",code:"PERMISSION_DENIED"});
      if(!Number.isFinite(volumeRatio)||volumeRatio<=0||volumeRatio>1)return sendJson(res,400,{ok:false,error:"Close ratio must be >0 and <=1",code:"INVALID_CLOSE_RATIO"});
      const position=account.positions.find(p=>p.ticket===ticket||p.id===ticket);
      if(!position)return sendJson(res,404,{ok:false,error:"Position not found"});
      let currentPrice = 0; let closingMarket;
      try {
        const market = await getMarketData(position.symbol, "intraday");
        closingMarket=market;
        assertPaperMarket(market);
        currentPrice = Number(market.quotePrice);
      } catch (error) {
        logAuditEvent({eventType:"POSITION_CLOSE_BLOCKED",accountId:account.id,symbol:position.symbol,status:"REJECTED",correlationId,details:{ticket:position.ticket,code:error.code||"MARKET_UNAVAILABLE"}});
        return sendJson(res,409,{ok:false,error:"Close blocked: fresh exact-instrument price unavailable. No fill was created; exposure is unchanged.",code:"CLOSE_PRICE_UNAVAILABLE",causeCode:error.code||"MARKET_UNAVAILABLE",correlationId,recovery:"Inspect /api/accounts/recovery for this account; cancel pending orders if needed and retry when exact fresh pricing returns. Never reset positions or supply a substitute fill price."});
      }

      const adapter = getBrokerAdapter(account.broker);
      try {
        const closeResult = await adapter.closePosition(account, ticket, volumeRatio, currentPrice,await getPaperPricing(closingMarket,account.currency));

        // Update account balance and positions
        if (closeResult.isPartial && closeResult.remainingPosition) {
          const idx = account.positions.findIndex(p => p.ticket === ticket || p.id === ticket);
          if (idx !== -1) account.positions[idx] = closeResult.remainingPosition;
        } else {
          account.positions = (account.positions || []).filter(p => p.ticket !== ticket && p.id !== ticket);
        }

        account.balance = +(Number(account.balance) + closeResult.realizedPnl).toFixed(2);
        account.equity = +(account.balance + account.positions.reduce((sum,p)=>sum+Number(p.floatingPnl||0),0)).toFixed(2);
        account.dailyRealizedPnl = +(Number(account.dailyRealizedPnl || 0) + closeResult.realizedPnl).toFixed(2);

        // Recalculate margins
        let totalMargin = 0;
        account.positions.forEach(p => { totalMargin += p.margin || 0; });
        account.usedMargin = +totalMargin.toFixed(2);
        account.freeMargin = Math.max(0, +(account.equity - totalMargin - account.orders.reduce((sum,o)=>sum+Number(o.reservedMargin||0),0)).toFixed(2));

        recordFill({id:crypto.randomUUID(),accountId:account.id,symbol:position.symbol,side:position.side,entryPrice:position.entryPrice,stopLoss:position.sl,originalLots:position.lots,riskDollars:(position.riskDollars||0)*closeResult.closedLots/position.lots,epoch:account.accountEpoch||"legacy",...closeResult,closedAt:new Date().toISOString()},account.id);
        saveTradingAccounts();

        logAuditEvent({
          eventType: "POSITION_CLOSED",
          accountId: account.id,
          symbol,
          details: {
            ticket,
            closedLots: closeResult.closedLots,
            realizedPnl: closeResult.realizedPnl,
            exitPrice: closeResult.exitPrice
          }
        });

        const response={ok:true,closeResult,account:sanitizeAccountForClient(account),message:`Closed position #${ticket}`};saveIdempotencyResponse(closeKey,response);return sendJson(res,200,response);
      } catch (err) {
        return sendJson(res, 400, { ok: false, error: err.message });
      }
    }

    // --- Risk Engine Preview Endpoint ---
    if (req.method === "POST" && url.pathname === "/api/risk/calculate") {
      const body = await readBody(req);
      const market=await getMarketData(body.symbol||"EURUSD","intraday");assertPaperMarket(market);
      const account=getAccountById(body.accountId||"acc_paper_sandbox_01");assertAccountOwner(account,req.user);
      const order={...body,side:body.side||"BUY"},pricing=await getPaperPricing(market,account.currency);
      const validation=validateOrderRisk({account,order,currentPrice:market.quotePrice,...pricing});if(!validation.approved)return sendJson(res,400,{ok:false,error:validation.reason,code:validation.code});
      const riskMetrics = calculateOrderRisk({...order,currentPrice:order.side.includes("LIMIT")?order.entryPrice:market.quotePrice,leverage:account.leverage,accountCurrency:account.currency,...pricing});
      return sendJson(res, 200, { ok: true, metrics: riskMetrics, riskAnalysis: riskMetrics });
    }

    if(req.method==="GET"&&url.pathname==="/api/ledger"){const account=getAccountById(url.searchParams.get("accountId")||"acc_paper_sandbox_01");assertAccountOwner(account,req.user);return sendJson(res,200,{ok:true,...getLedger([account.id],{limit:Number(url.searchParams.get("limit")??100),before:url.searchParams.has("before")?Number(url.searchParams.get("before")):undefined}),epoch:account.accountEpoch||"legacy",startingBalance:sanitizeAccountForClient(account).startingBalance});}
    // --- Audit Log Retrieval ---
    if (req.method === "GET" && url.pathname === "/api/audit-logs") {
      const owned=new Set(getAllSanitizedAccounts(req.user).map(a=>a.id));
      const events = getAuditEvents(200).filter(e=>owned.has(e.accountId)).slice(0,60);
      return sendJson(res, 200, { ok: true, events });
    }

    // --- Measured Broker Latency Ping ---
    if (req.method === "POST" && url.pathname === "/api/broker/ping") {
      const body = await readBody(req);
      const broker = (body.broker || "paper").toLowerCase();
      const adapter = getBrokerAdapter(broker);
      const status = await adapter.getConnectionStatus();
      return sendJson(res, 200, {
        ok: status.status === "CONNECTED",
        broker,
        status: status.status,
        latencyMs: status.latencyMs ?? null,
        serverTime: new Date().toISOString(),
        message: status.message
      });
    }

    // --- Notice on Broker Direct Funding ---
    if (req.method === "POST" && url.pathname === "/api/broker/funds") {
      return sendJson(res, 400, {
        ok: false,
        error: "THN AI Trader does not custody or transfer client funds. Please deposit and withdraw directly through your regulated broker's official client portal.",
        code: "DIRECT_BROKER_PORTAL_REQUIRED"
      });
    }

    if (url.pathname.startsWith("/api/")) return sendJson(res,404,{ok:false,error:"Unknown API route"});
    if (req.method === "GET") {
      return serveFile(res, safeStaticPath(url.pathname));
    }

    return sendJson(res, 405, { ok: false, error: "Method not allowed" });
  } catch (error) {
    console.warn(JSON.stringify({event:"request_failed",correlationId,code:error.code||"REQUEST_FAILED",status:error.status||500,method:req.method}));
    if(error.retryAfter)res.setHeader("Retry-After",String(error.retryAfter));
    return sendJson(res, error.status || (error.message === "Invalid JSON body" ? 400 : 500), { ok: false, error: error.message,code:error.code||"REQUEST_FAILED",retryAfter:error.retryAfter||null,causeCode:error.causeCode||null,correlationId });
  }
}

let shuttingDown=false;
const server=http.createServer(async(req,res)=>{if(shuttingDown){res.setHeader("Connection","close");return sendJson(res,503,{ok:false,error:"Server shutting down"})}try{if(/^\/api\/(accounts|broker|orders|positions|audit-logs|ledger|risk)(\/|$)/.test(req.url))await withTransaction(()=>handleRequest(req,res));else await handleRequest(req,res)}catch(error){if(!res.headersSent)sendJson(res,error.status||500,{ok:false,error:"State transaction failed"});else res.destroy()}});

server.headersTimeout=10000;server.requestTimeout=15000;server.maxHeadersCount=100;
const worker=startPaperWorker();
async function shutdown(signal){
  if(shuttingDown)return;shuttingDown=true;
  console.log(`Shutdown started: ${signal}`);
  const deadline=setTimeout(()=>{console.error("Shutdown drain deadline exceeded; operator lock recovery may be required");process.exit(1)},30000);
  try{
    const drained=new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
    server.closeIdleConnections();
    await Promise.all([drained,worker.stop()]);
    await closeStorage();clearTimeout(deadline);process.exitCode=0;
  }catch(error){console.error("Shutdown failed:",error.message);clearTimeout(deadline);process.exit(1)}
}
for(const signal of ["SIGTERM","SIGINT"])process.on(signal,()=>shutdown(signal));
server.listen(PORT, "0.0.0.0", () => {
  console.log(`THN AI Trader running on http://0.0.0.0:${server.address().port}`);
  console.log(`OpenAI enabled: ${openaiEnabled ? "yes" : "no"}`);
});
