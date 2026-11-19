import {marketDiagnostics} from './provider-diagnostics.js';
import {prepareSeries,INTERVAL_MS,researchError} from './research.js';

// Data-boundary validation only: authoritative indicator/backtest formulas stay unchanged.
export function closedMarket(market,asOf=Date.now()) {
  const step=INTERVAL_MS[market?.interval];
  if(!step||!Number.isFinite(asOf)||market.providerTimePresent===false||!Number.isFinite(market.marketTime)||market.marketTime<=0||market.marketTime>asOf+5000)
    throw researchError('INVALID_OBSERVATION_TIME','Valid interval and nonfuture provider observation time required.',503);
  // Legacy adapters may retain a display fallback; analytical provenance may not.
  if(market.providerCurrencyPresent===false||typeof market.currency!=='string'||!market.currency.trim())
    throw researchError('INVALID_OBSERVATION_CURRENCY','Provider-reported currency is required for analytical observations.',503);
  // Delayed observations cannot vouch for bars that became available afterwards.
  const through=Math.min(asOf,market.marketTime);
  const series=prepareSeries(market,market.interval,through);
  const last=series.candles.at(-1);
  const dataDiagnostics=marketDiagnostics({...market,evidence:{asOf}},series);
  return {...market,dataDiagnostics,candles:series.candles,evidence:{...series.provenance,asOf,observedAt:market.marketTime,availableAt:last.time+step,timestampConvention:'bar-open; available after interval close',excludedUnclosedBars:market.candles.filter(c=>c.time+step>through).length}};
}
