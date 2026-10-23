/* Explicit research identities; never a currency conversion or venue assertion. */
export const APPLICATION_VERSION='7.5.0';
export function instrumentIdentity(symbol,provenance={}){
 const canonicalInstrument=String(symbol).toUpperCase();
 const crypto=/^(BTC|ETH)(USD|USDT)$/.exec(canonicalInstrument);
 const fx=/^([A-Z]{3})([A-Z]{3})$/.exec(canonicalInstrument);
 const providerInstrument=provenance.providerSymbol||null;
 const observedCurrency=provenance.currency||(providerInstrument?.endsWith('-USD')?'USD':providerInstrument?.endsWith('USDT')?'USDT':null);
 const proxy=Boolean(crypto&&observedCurrency&&crypto[2]!==observedCurrency);
 return Object.freeze({canonicalInstrument,baseAsset:crypto?.[1]||fx?.[1]||null,quoteCurrency:crypto?.[2]||fx?.[2]||null,productType:crypto?'crypto observation':fx?'currency/metal observation':'provider observation',venue:null,provider:provenance.source||null,providerInstrument,observationCurrency:observedCurrency,proxy,limitations:proxy?observedCurrency+' provider proxy; not native '+crypto[2]+' evidence. No USD/USDT conversion or native USDT financial planning.':'Provider observations are not executable venue quotes.'});
}
export function researchIdentity(symbol,interval,provenance={},method='THN-closed-bars-6.3'){
 return Object.freeze({...instrumentIdentity(symbol,provenance),interval,closedBarTimestamp:provenance.lastTime??null,datasetHash:provenance.hash||null,analysisEngineVersion:method});
}
