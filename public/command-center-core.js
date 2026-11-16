import {recommendationReview} from './recommendation-core.js';
import {confidenceReview} from './confidence-core.js';
import {instrumentIdentity} from './instrument-identity.js';

// Mirrors the frozen prepareSeries freshness criterion; parity-tested against it.
export function observationExpiry(provenance){
 const span={'15m':900000,'1h':3600000,'1d':86400000}[provenance?.interval];
 return span&&Number.isFinite(provenance?.lastTime)?provenance.lastTime+span+Math.max(span*3,7200000):null;
}
function currentObservation(provenance,now){const expiry=observationExpiry(provenance),span={'15m':900000,'1h':3600000,'1d':86400000}[provenance?.interval];return provenance?.status==='recent'&&expiry!==null&&provenance.lastTime+span<=now&&now<=expiry;}

// Read-only projection of retained engine output. No price, sizing or return formula.
export function commandAssessment(input){
 const {context={},series,analysis,brief,catalog=[],busy=false}=input;
 const recommendation=recommendationReview(input);
 const now=input.now??Date.now();
 const hash=context.datasetId,provenance=recommendation.provenance;
 const matching=!!(provenance&&analysis&&analysis.symbol===context.symbol&&analysis.timeframe===context.interval&&analysis.evidence?.hash===hash&&analysis.evidence.lastTime===provenance.lastTime);
 const sound=Number.isFinite(analysis?.confidence)&&analysis.confidence>=0&&analysis.confidence<=100&&Array.isArray(analysis?.schools)&&analysis.schools.length>0&&analysis.schools.every(v=>v&&typeof v==='object'&&Array.isArray(v.reasons))&&Array.isArray(series?.candles)&&series.candles.length>0&&series.candles.at(-1).time===provenance?.lastTime;
 const fresh=matching&&sound&&!busy&&currentObservation(provenance,now)&&currentObservation(analysis.evidence,now);
 const identity=instrumentIdentity(context.symbol,provenance||{}),instrument=Array.isArray(catalog)?catalog.find(v=>v?.symbol===context.symbol):null,spec=instrument?.contract;
 const proxy=identity.proxy||instrument?.proxy===true;
 const contract=!!(typeof instrument?.proxy==='boolean'&&spec&&['contractSize','lotStep','minLot','maxLot'].every(k=>Number.isFinite(spec[k])&&spec[k]>0)&&spec.maxLot>=spec.minLot);
 const currency=!!provenance?.currency&&(!identity.quoteCurrency||identity.quoteCurrency===provenance.currency);
 const levels=Array.isArray(analysis?.targets)?analysis.targets:null,side=recommendation.action;
 const geometry=levels&&levels.length>=1&&levels.length<=3&&[analysis.entry,analysis.stopLoss,...levels].every(v=>Number.isFinite(v)&&v>0)&&new Set(levels).size===levels.length&&(side==='BUY'?analysis.stopLoss<analysis.entry&&levels.every((v,i)=>v>analysis.entry&&(!i||v>levels[i-1])):side==='SELL'?analysis.stopLoss>analysis.entry&&levels.every((v,i)=>v<analysis.entry&&(!i||v<levels[i-1])):false);
 const framesCurrent=!!(brief&&Array.isArray(brief.frames)&&brief.frames.length===3&&brief.frames.every(v=>v.available&&currentObservation(v.provenance,now)));
 const ready=!!(fresh&&framesCurrent&&contract&&currency&&!proxy&&geometry&&['BUY','SELL'].includes(side)&&provenance.gapCount===0&&provenance.discardedRows===0);
 const candidate=ready?{source:'rule_based_evidence',policy:'retained-engine-levels-1',symbol:context.symbol,interval:context.interval,hash,barTime:provenance.lastTime,side,entry:analysis.entry,stop:analysis.stopLoss,targets:[...levels],executionAuthorized:false,entryQuoteVerified:false,capital:null,lots:null}:null;
 const confidence=confidenceReview({analysis:fresh?analysis:null,evaluation:input.evaluation,context,evaluationState:input.evaluationState});
 const warnings=[...recommendation.reasons];if(provenance&&!currentObservation(provenance,now)&&!warnings.includes('history_stale'))warnings.unshift('history_stale');if(fresh&&!framesCurrent&&!warnings.includes('incomplete_frames'))warnings.unshift('incomplete_frames');if(proxy&&!warnings.includes('proxy_context'))warnings.unshift('proxy_context');
 if(!contract)warnings.push('contract_unavailable');if(!currency)warnings.push('currency_mismatch');if(fresh&&['BUY','SELL'].includes(side)&&!geometry)warnings.push('invalid_recorded_levels');
 return {schema:'THN-COMMAND-1',expiresAt:observationExpiry(provenance),frameExpirations:Array.isArray(brief?.frames)?brief.frames.map(v=>observationExpiry(v.provenance)).filter(Number.isFinite):[],source:'rule_based_evidence',context:{symbol:context.symbol,interval:context.interval,hash:provenance?.hash??null,barTime:provenance?.lastTime??null},phase:busy?'loading':!provenance?'unavailable':!matching?'analysis_required':!fresh?'stale':'ready',fresh,confidence,confluence:fresh?confidence.confluence:null,probability:null,recommendation,candidate,identity:{...identity,proxy,limitations:proxy&&!identity.proxy?'Provider futures/proxy observations, not native executable spot or broker contract evidence.':identity.limitations},warnings:[...new Set(warnings)],verified_model_interpretation:recommendation.interpretation?.method==='llm-assisted'?recommendation.interpretation:null,executionAuthorized:false};
}

// Presentation coordinates only; exact original chart viewport and engine prices.
export function projectLevel(plot,price){
 if(!plot||![plot.top,plot.height,plot.min,plot.max,price].every(Number.isFinite)||plot.max<=plot.min||plot.height<=0)return null;
 return {y:plot.top+(plot.max-price)/(plot.max-plot.min)*plot.height,visible:price>=plot.min&&price<=plot.max};
}
export function sourceAnchor(plot,bars,time){const index=bars?.findIndex(v=>v.time===time)??-1;return index>=0&&plot?.width>0?plot.left+(index+.5)*plot.width/bars.length:null;}

// An explicit quoted research note fits the existing report schema. Never an order.
export function candidateResearchNote(candidate,language='en'){
 if(!candidate)return '';
 const ar=language==='ar';
 return [ar?'[سيناريو حتمي مسجل — غير معتمد للتنفيذ]':'[Recorded rule-based candidate — not execution-approved]',`${candidate.symbol} / ${candidate.interval} / ${candidate.side}`,`${ar?'بصمة البيانات':'Dataset SHA-256'}: ${candidate.hash}`,`${ar?'شمعة المصدر':'Source bar'}: ${new Date(candidate.barTime).toISOString()}`,`${ar?'مرجع الدخول':'Entry reference'}: ${candidate.entry}`,`${ar?'وقف مسجل غير مضمون':'Recorded stop, not guaranteed'}: ${candidate.stop}`,`${ar?'مراجع الأهداف المستقلة':'Independent target references'}: ${candidate.targets.join(' / ')}`,`${ar?'سياسة العرض':'Display policy'}: ${candidate.policy}`,ar?'ليست أسعار تنفيذ أو أمراً أو اعتماد رأس مال أو حجم. لا يتغير الأداء التاريخي بهذه المراجع.':'Not an executable quote, order, capital or sizing approval. Historical performance is unchanged by these references.'].join('\n');
}
