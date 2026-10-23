// Optional cost-inclusive sizing wraps the unchanged authoritative planner/risk engine.
import {createPlan} from './decision.js';
import {getContractSpec,calculateOrderRisk} from './riskEngine.js';
import {researchError} from './research.js';
export function budgetPlan(input){
 if(input?.costInclusive!==undefined&&typeof input.costInclusive!=='boolean')throw researchError('INVALID_PLAN','Cost-inclusive flag must be boolean.');
 const quote=/^USD[A-Z]{3}$/.test(input?.symbol||'')?input.symbol.slice(3):'USD';
 if(input?.researchCurrency!=null&&input.researchCurrency!==quote)throw researchError('RESEARCH_CURRENCY_MISMATCH','Research observation currency does not match the planning contract. No automatic currency conversion.');
 if(input?.side==='BUY'&&Number.isFinite(input.entry)&&Number.isFinite(input.stop)&&input.stop>=input.entry)throw researchError('BUY_STOP_DIRECTION','BUY stop must be below entry.');
 if(input?.side==='SELL'&&Number.isFinite(input.entry)&&Number.isFinite(input.stop)&&input.stop<=input.entry)throw researchError('SELL_STOP_DIRECTION','SELL stop must be above entry.');
 if(/USDT$/.test(input?.symbol||''))throw researchError('UNSUPPORTED_USDT_PLAN','Native USDT planning is unavailable; USD proxy observations are not USDT contracts.');
 const original=createPlan(input);let plan=original;
 if(input.costInclusive===true){
  const spec=getContractSpec(input.symbol),perLot=original.plannedStopLossWithCosts/original.lots;
  // All current cost inputs are explicit proportional bps; no fixed/minimum fees assumed.
  let steps=Math.min(Math.floor(original.lots/spec.lotStep+1e-9),Math.floor(original.budget/(perLot*spec.lotStep)));
  const lots=Number((steps*spec.lotStep).toFixed(10));
  if(lots<spec.minLot)throw researchError('PLAN_BELOW_MINIMUM','Cost-inclusive budget cannot fund the minimum lot.');
  const metrics=calculateOrderRisk({symbol:input.symbol,side:input.side,lots,entryPrice:input.entry,stopLoss:input.stop,takeProfit:input.targets[0],leverage:input.leverage});
  const scale=lots/original.lots,cost=original.estimatedRoundTripCosts*scale,total=metrics.slDollars+cost;
  if(total>original.budget)throw researchError('BUDGET_EXCEEDED','Cost-inclusive exposure exceeds budget.');
  plan={...original,lots,metrics,estimatedRoundTripCosts:cost,plannedStopLossWithCosts:total,targetOutcomes:original.targetOutcomes.map(v=>({...v,reward:v.reward*scale,rewardRisk:v.reward*scale/total})),warnings:[...original.warnings.filter(v=>!['costs_exceed_budget','margin_exceeds_capital'].includes(v)),...(metrics.requiredMargin>input.capital?['margin_exceeds_capital']:[])]};
 }
 return {...plan,inputValid:true,sizingMode:input.costInclusive===true?'cost-inclusive':'nominal',budgetCompliant:plan.plannedStopLossWithCosts<=plan.budget,executionAuthorized:false};
}
