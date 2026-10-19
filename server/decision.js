import { getContractSpec, calculateOrderRisk } from './riskEngine.js';
import { researchError } from './research.js';
const supported=new Set(['EURUSD','GBPUSD','USDJPY','USDCHF','USDCAD','AUDUSD','NZDUSD','XAUUSD','XAGUSD','USOIL','BRENT','US30','NAS100','SPX','BTCUSD','ETHUSD']);
export function createPlan(input){
  if(!input||typeof input!=='object'||Array.isArray(input)||!supported.has(input.symbol)||!['BUY','SELL'].includes(input.side))throw researchError('INVALID_PLAN','Unsupported USD-settled planning contract.');
  const fields=['capital','riskPct','entry','stop','leverage','spreadBps','slippageBps','commissionBps'];
  if(fields.some(k=>typeof input[k]!=='number'||!Number.isFinite(input[k])))throw researchError('INVALID_PLAN','Finite numeric plan inputs required.');
  const {symbol,side,capital,riskPct,entry,stop,leverage,spreadBps,slippageBps,commissionBps}=input;
  const targets=input.targets;
  if(capital<=0||capital>1e8||riskPct<=0||riskPct>5||entry<=0||entry>1e9||stop<=0||stop>1e9||leverage<1||leverage>200||[spreadBps,slippageBps,commissionBps].some(v=>v<0||v>100)||!Array.isArray(targets)||!targets.length||targets.length>3||targets.some(v=>typeof v!=='number'||!Number.isFinite(v)||v<=0||v>1e9)||!(side==='BUY'?stop<entry&&targets.every(v=>v>entry):stop>entry&&targets.every(v=>v<entry)))throw researchError('INVALID_PLAN','Invalid plan limits or directional levels.');
  const spec=getContractSpec(symbol),fx=/^USD[A-Z]{3}$/.test(symbol)?1/entry:1,budget=capital*riskPct/100;
  const lots=Math.min(spec.maxLot,Math.floor((budget/(Math.abs(entry-stop)*spec.contractSize*fx)+1e-10)/spec.lotStep)*spec.lotStep);
  if(lots<spec.minLot)throw researchError('PLAN_BELOW_MINIMUM','Risk budget cannot fund the minimum contract lot.');
  const metrics=calculateOrderRisk({symbol,side,lots,entryPrice:entry,stopLoss:stop,takeProfit:targets[0],leverage});
  const cost=lots*spec.contractSize*(/^USD/.test(symbol)?1:entry)*(spreadBps+2*slippageBps+2*commissionBps)/10000;
  return {version:'6.4.0',symbol,side,capital,riskPct,entry,stop,targets:[...targets],leverage,spreadBps,slippageBps,commissionBps,lots,contractSize:spec.contractSize,budget,metrics,estimatedRoundTripCosts:cost,plannedStopLossWithCosts:metrics.slDollars+cost,targetOutcomes:targets.map(price=>({price,reward:(Math.abs(price-entry)*spec.contractSize*lots*fx)-cost,rewardRisk:(Math.abs(price-entry)*spec.contractSize*lots*fx-cost)/(metrics.slDollars+cost)})),warnings:['hypothetical_capital','stop_not_guaranteed','no_funding_or_borrow','contract_terms_unverified',...(metrics.requiredMargin>capital?['margin_exceeds_capital']:[]),...(metrics.slDollars+cost>budget?['costs_exceed_budget']:[])]};
}
