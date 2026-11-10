// Request and evidence contracts only. Authoritative numerical formulas are unchanged.
import {getContractSpec,calculateOrderRisk} from './riskEngine.js';
import {INTERVAL_MS} from './research.js';
const supported=/^(EURUSD|GBPUSD|AUDUSD|NZDUSD|USDJPY|USDCHF|USDCAD|XAUUSD|XAGUSD|USOIL|BRENT|BTCUSD|BTCUSDT|ETHUSD|ETHUSDT|SPX|NAS100|US30)$/;
const messages={
 INVALID_RISK_INPUT:['Use finite numeric lots, entry, stop, target and leverage; blank inputs are not values and prices must be positive.','أدخل قيماً رقمية صريحة للحجم والدخول والوقف والهدف والرافعة؛ لا تُقبل الحقول الفارغة ويجب أن تكون الأسعار موجبة.'],
 UNSUPPORTED_RISK_CONTRACT:['Select a supported instrument and explicit BUY or SELL direction.','اختر أداة مدعومة واتجاه شراء أو بيع صريحاً.'],
 INVALID_LEVERAGE:['Leverage must be between 1 and 2000; no default or clamping is applied.','يجب أن تكون الرافعة بين 1 و2000؛ لا تُطبق قيمة بديلة أو تعديل تلقائي.'],
 AMBIGUOUS_ENTRY:['Entry and current price disagree. Supply one explicit hypothetical entry.','سعر الدخول والسعر الحالي مختلفان. أدخل سعر دخول افتراضياً واحداً صريحاً.'],
 INVALID_PROTECTION_DIRECTION:['For BUY, stop < entry < target; for SELL, target < entry < stop.','للشراء: الوقف أقل من الدخول والهدف أعلى منه؛ وللبيع العكس.'],
 INVALID_VOLUME:['Volume must satisfy the instrument minimum, maximum and lot step.','يجب أن يطابق الحجم الحد الأدنى والأقصى وخطوة العقد للأداة.'],
 INVALID_RISK_CONTEXT:['Market context is missing required identity or timestamp fields.','سياق السوق يفتقر إلى حقول الهوية أو الوقت المطلوبة.'],
 RISK_CONTEXT_MISMATCH:['The instrument or retained evidence changed. Refresh research and review the draft again.','تغيرت الأداة أو الأدلة المحفوظة. حدّث البحث وراجع المسودة مجدداً.'],
 STALE_RISK_CONTEXT:['Retained market evidence is stale; refresh before contextual risk review.','أدلة السوق المحفوظة قديمة؛ حدّثها قبل مراجعة المخاطر المرتبطة بالسياق.'],
 RISK_CONTEXT_UNAVAILABLE:['Current market evidence could not be verified. No approval was issued.','تعذر التحقق من أدلة السوق الحالية. لم يصدر أي اعتماد.'],
 INVALID_RISK_METRICS:['The engine could not produce finite risk estimates for these inputs.','تعذر على المحرك إنتاج تقديرات مخاطر محدودة لهذه المدخلات.']
};
export function riskPreviewError(code,status=400){const [en,ar]=messages[code];return Object.assign(new Error(en),{code,status,messages:{en,ar}});}
const numeric=v=>typeof v==='number'&&Number.isFinite(v);
export function validateRiskPreview(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw riskPreviewError('INVALID_RISK_INPUT');
 if(typeof input.symbol!=='string'||!supported.test(input.symbol)||!['BUY','SELL'].includes(input.side))throw riskPreviewError('UNSUPPORTED_RISK_CONTRACT');
 const entry=input.entryPrice??input.currentPrice;
 if(![input.lots,entry,input.stopLoss,input.takeProfit,input.leverage].every(numeric)||[entry,input.stopLoss,input.takeProfit].some(v=>v<=0||v>1e9))throw riskPreviewError('INVALID_RISK_INPUT');
 if(input.currentPrice!==undefined&&(!numeric(input.currentPrice)||input.currentPrice!==entry))throw riskPreviewError('AMBIGUOUS_ENTRY');
 if(input.entryPrice!==undefined&&(!numeric(input.entryPrice)||input.entryPrice!==entry))throw riskPreviewError('AMBIGUOUS_ENTRY');
 if(input.leverage<1||input.leverage>2000)throw riskPreviewError('INVALID_LEVERAGE');
 if(input.side==='BUY'?!(input.stopLoss<entry&&entry<input.takeProfit):!(input.takeProfit<entry&&entry<input.stopLoss))throw riskPreviewError('INVALID_PROTECTION_DIRECTION');
 const spec=getContractSpec(input.symbol),lots=input.lots;
 if(lots<spec.minLot||lots>spec.maxLot||Math.abs(lots/spec.lotStep-Math.round(lots/spec.lotStep))>1e-7)throw riskPreviewError('INVALID_VOLUME');
 const c=input.context;
 if(c!==undefined){
  if(!c||typeof c!=='object'||Array.isArray(c)||typeof c.symbol!=='string'||typeof c.interval!=='string'||!Object.hasOwn(INTERVAL_MS,c.interval)||typeof c.datasetId!=='string'||!/^[a-f0-9]{64}$/.test(c.datasetId)||!numeric(c.dataTimestamp)||c.dataTimestamp<=0||typeof c.provider!=='string'||!c.provider||c.provider.length>160||typeof c.providerSymbol!=='string'||!c.providerSymbol||c.providerSymbol.length>160)throw riskPreviewError('INVALID_RISK_CONTEXT');
  if(c.symbol!==input.symbol)throw riskPreviewError('RISK_CONTEXT_MISMATCH',409);
 }
 return {symbol:input.symbol,side:input.side,lots,entryPrice:entry,stopLoss:input.stopLoss,takeProfit:input.takeProfit,leverage:input.leverage,...(c===undefined?{}:{context:{symbol:c.symbol,interval:c.interval,datasetId:c.datasetId,dataTimestamp:c.dataTimestamp,provider:c.provider,providerSymbol:c.providerSymbol}})};
}
export function verifyRiskContext(input,series,now=Date.now()){
 const c=input.context,p=series?.provenance;
 if(!c)return null;
 if(!p||!series.candles?.length)throw riskPreviewError('RISK_CONTEXT_UNAVAILABLE',503);
 if(p.lastTime+INTERVAL_MS[c.interval]>now||p.status!=='recent')throw riskPreviewError('STALE_RISK_CONTEXT',409);
 if(c.datasetId!==p.hash||c.interval!==p.interval||c.dataTimestamp!==p.lastTime||c.provider!==p.source||c.providerSymbol!==p.providerSymbol)throw riskPreviewError('RISK_CONTEXT_MISMATCH',409);
 return {...c,verifiedAt:now,status:p.status,entryBasis:'user_hypothetical_assumption',executableQuote:false};
}
export function calculateRiskPreview(input,context=null){
 const metrics=calculateOrderRisk(input);
 if(Object.values(metrics).some(v=>!numeric(v)||v<0))throw riskPreviewError('INVALID_RISK_METRICS');
 return {ok:true,metrics,riskAnalysis:metrics,assumptions:{symbol:input.symbol,side:input.side,lots:input.lots,entryPrice:input.entryPrice,stopLoss:input.stopLoss,takeProfit:input.takeProfit,leverage:input.leverage},context,hypothetical:true,executionApproval:false,evidenceStatus:context?'matched_at_calculation':'manual_assumptions_only'};
}
