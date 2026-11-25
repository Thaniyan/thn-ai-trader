// Offline private case resolution only. No provider, model or admission imports.
import crypto from 'node:crypto';
import {validateCandles} from '../server/research.js';
export const P1_ORIGINAL_SHA='d0b0435ff1b685a250c60d208fda058d44aff8c69bab744f3074dc64b55add0d';
export const P2_LIMITS=Object.freeze({bytes:2*1024*1024,rows:5000,cases:36,contractBytes:32768});
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const hash=v=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const id=v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,79}$/.test(v);
const exact=(o,keys)=>!!o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
const positiveTime=t=>Number.isSafeInteger(t)&&t>0&&t<=8640000000000000;
const shapeKeys=['timezone','sessionBoundary','quoteBasis','adjustment','timestampConvention','aggregation','semanticsEvidenceId'];
function barContract(v){if(!exact(v,shapeKeys)||typeof v.timezone!=='string'||v.timezone.length>80||!/^([01]\d|2[0-3]):[0-5]\d$/.test(v.sessionBoundary)||!['BID','ASK','MID','TRADE','INDICATIVE'].includes(v.quoteBasis)||v.adjustment!=='UNADJUSTED'||v.timestampConvention!=='BAR_OPEN_UTC'||v.aggregation!=='SOURCE_SUPPLIED_1D'||!id(v.semanticsEvidenceId))return false;try{new Intl.DateTimeFormat('en',{timeZone:v.timezone}).format(0);return true;}catch{return false;}}
function identity(v){return exact(v,['sourceId','providerSymbol','instrument','product','base','quote','interval','format','bar'])&&id(v.sourceId)&&typeof v.providerSymbol==='string'&&/^[A-Za-z0-9=^:.\-]{1,32}$/.test(v.providerSymbol)&&v.instrument==='EURUSD'&&v.product==='OTC_FX'&&v.base==='EUR'&&v.quote==='USD'&&v.interval==='1d'&&['YAHOO_CHART_1','THN_P2_BARS_1'].includes(v.format)&&barContract(v.bar);}
export function contractStatus(c,originalSHA,{synthetic=false}={}){
 if(!c)return 'CONTRACT_REQUIRED';
 if(!exact(c,['schema','mode','purpose','originalSHA256','candidateSHA256','original','candidate','rights','revision','independence','restrictions'])||c.schema!=='THN-P2-CONTRACT-1'||c.mode!==(synthetic?'CONTROLLED_FIXTURE':'OWNER_PRIVATE')||!['SOURCE_REVISION','INDEPENDENT_REFERENCE'].includes(c.purpose)||!hash(c.originalSHA256)||!hash(c.candidateSHA256)||c.originalSHA256!==originalSHA)return 'CONTRACT_INVALID';
 if(!identity(c.original)||!identity(c.candidate)||c.original.sourceId!=='yahoo-finance'||c.original.providerSymbol!=='EURUSD=X'||c.original.format!=='YAHOO_CHART_1')return 'IDENTITY_OR_SEMANTICS_UNVERIFIED';
 if(!exact(c.rights,['status','approvalId','originalEvidenceId','candidateEvidenceId','retentionEvidenceId'])||!Object.values(c.rights).every(v=>typeof v==='string')||c.rights.status!=='APPROVED_PRIVATE_OFFLINE_COMPARE'||!['approvalId','originalEvidenceId','candidateEvidenceId','retentionEvidenceId'].every(k=>id(c.rights[k])))return 'RIGHTS_NOT_APPROVED';
 if(!exact(c.restrictions,['network','priceWrites','providerActivation','production','admission','execution'])||Object.values(c.restrictions).some(v=>v!==false))return 'FORBIDDEN_PERMISSION';
 // Evidence references may differ; actual bar conventions must match exactly.
 if(shapeKeys.filter(k=>k!=='semanticsEvidenceId').some(k=>c.original.bar[k]!==c.candidate.bar[k]))return 'BAR_SEMANTICS_MISMATCH';
 if(c.purpose==='SOURCE_REVISION'){
  if(c.original.sourceId!==c.candidate.sourceId||c.original.providerSymbol!==c.candidate.providerSymbol||c.candidate.format!=='YAHOO_CHART_1'||c.independence!==null||!exact(c.revision,['kind','revisionId','attributionEvidenceId','originalSHA256'])||c.revision.kind!=='SOURCE_DECLARED_CORRECTION'||!id(c.revision.revisionId)||!id(c.revision.attributionEvidenceId)||c.revision.originalSHA256!==originalSHA)return 'REVISION_ATTRIBUTION_UNAVAILABLE';
 }else if(c.revision!==null||c.original.sourceId===c.candidate.sourceId||!exact(c.independence,['status','lineageEvidenceId'])||c.independence.status!=='DECLARED_DISTINCT_UPSTREAM'||!id(c.independence.lineageEvidenceId))return 'INDEPENDENCE_UNESTABLISHED';
 return 'APPROVED_DECLARATIONS_NOT_INDEPENDENT_AUTHENTICATION';
}
function parse(bytes,max=P2_LIMITS.bytes){if(!Buffer.isBuffer(bytes)||!bytes.length||bytes.length>max)throw Error('INPUT_SIZE_OR_TYPE');try{return JSON.parse(bytes.toString('utf8'));}catch{throw Error('INPUT_JSON_INVALID');}}
function sourceRows(bytes,contract=null){
 const value=parse(bytes);
 if(!contract||contract.format==='YAHOO_CHART_1'){
  const r=value?.chart?.result?.[0],q=r?.indicators?.quote?.[0],t=r?.timestamp;
  if(!q||!Array.isArray(t)||!t.length||t.length>P2_LIMITS.rows||r.meta?.symbol!==(contract?.providerSymbol||'EURUSD=X')||r.meta?.currency!=='USD'||r.meta?.instrumentType&&r.meta.instrumentType!=='CURRENCY')throw Error('SNAPSHOT_IDENTITY_INVALID');
  if(contract&&r.meta.exchangeTimezoneName&&r.meta.exchangeTimezoneName!==contract.bar.timezone)throw Error('SNAPSHOT_SEMANTICS_MISMATCH');
  return t.map((time,i)=>({time:time*1000,open:q.open?.[i],high:q.high?.[i],low:q.low?.[i],close:q.close?.[i],volume:q.volume?.[i]||0}));
 }
 if(!exact(value,['schema','identity','bars'])||value.schema!=='THN-P2-BARS-1'||!exact(value.identity,['sourceId','providerSymbol','instrument','product','base','quote','interval','barSemanticsEvidenceId'])||!['sourceId','providerSymbol','instrument','product','base','quote','interval'].every(k=>value.identity[k]===contract[k])||value.identity.barSemanticsEvidenceId!==contract.bar.semanticsEvidenceId||!Array.isArray(value.bars)||!value.bars.length||value.bars.length>P2_LIMITS.rows)throw Error('SNAPSHOT_IDENTITY_INVALID');
 if(value.bars.some(b=>!exact(b,['time','open','high','low','close','volume'])))throw Error('SNAPSHOT_SCHEMA_INVALID');
 return value.bars;
}
function geometry(row){return [row.open,row.high,row.low,row.close].every(v=>typeof v==='number'&&Number.isFinite(v)&&v>0)&&(row.high<Math.max(row.open,row.close)||row.low>Math.min(row.open,row.close));}
function valid(row){try{if(!positiveTime(row.time))return false;validateCandles([row]);return true;}catch{return false;}}
const codes=['SOURCE_REVISION_VALID','REFERENCE_VALID_NOT_CORRECTION','STILL_INVALID','MISSING_OR_OUT_OF_COVERAGE','AMBIGUOUS_KEY','CONTRACT_UNAVAILABLE','CANDIDATE_UNAVAILABLE','ATTRIBUTION_UNAVAILABLE','SEMANTICS_INCOMPATIBLE','EVIDENCE_UNVERIFIED'];
function grouped(rows){const map=new Map();for(const [index,row] of rows.entries()){if(!positiveTime(row.time))continue;const found=map.get(row.time)||[];found.push({index,row});map.set(row.time,found);}return map;}
export function compareSourceCases({originalBytes=null,originalSidecar=null,candidateBytes=null,candidateSidecar=null,contract=null,synthetic=false}={}){
 const hashes={original:Buffer.isBuffer(originalBytes)&&originalBytes.length<=P2_LIMITS.bytes?digest(originalBytes):null,candidate:Buffer.isBuffer(candidateBytes)&&candidateBytes.length<=P2_LIMITS.bytes?digest(candidateBytes):null};
 const report={schema:'THN-P2-RESULT-1',scope:synthetic?'CONTROLLED_FIXTURE_NOT_REAL_QUALIFICATION':'OWNER_PRIVATE_OFFLINE',state:'BLOCKED',assessment:'NOT_VERIFIED',caseAssessment:'NOT_VERIFIED',reason:'ORIGINAL_REQUIRED',expectedCases:36,observedCases:null,caseAccounting:'NOT_AVAILABLE',dispositions:Object.fromEntries(codes.map(k=>[k,0])),hashes,contractHash:contract?digest(JSON.stringify(contract)):null,contractStatus:'NOT_EVALUATED',rights:'NOT_VERIFIED',sourceQualification:'NOT_VERIFIED',historicalEarlier36Identity:'NOT_ESTABLISHED',financialExecution:false,qualificationChanged:false,networkRequests:0,priceWrites:0};
 const ledger={schema:'THN-P2-PRIVATE-LEDGER-1',scope:report.scope,originalSHA256:hashes.original,cases:[]};
 const finish=()=>({report,privateLedger:ledger});
 if(!Buffer.isBuffer(originalBytes))return finish();
 if(!originalBytes.length||originalBytes.length>P2_LIMITS.bytes){report.reason='ORIGINAL_SIZE_LIMIT';return finish();}
 if(!hash(originalSidecar)||hashes.original!==originalSidecar||!synthetic&&hashes.original!==P1_ORIGINAL_SHA){report.reason='ORIGINAL_HASH_MISMATCH';return finish();}
 let original;try{original=sourceRows(originalBytes);}catch(e){report.reason=e.message;return finish();}
 const cohort=original.map((row,index)=>({row,index})).filter(x=>geometry(x.row));
 if(cohort.length!==36||cohort.some(x=>!positiveTime(x.row.time))){report.reason='ORIGINAL_COHORT_UNVERIFIED';return finish();}
 report.observedCases=cohort.length;report.caseAccounting='COMPLETE';
 const setAll=(code,reason,state='NO_COMPARISON')=>{report.state=state;report.reason=reason;for(const c of cohort){ledger.cases.push({barOpenUTC:c.row.time,originalIndex:c.index,disposition:code,candidateIndex:null});report.dispositions[code]++;}return finish();};
 const status=contractStatus(contract,hashes.original,{synthetic});report.contractStatus=status;
 if(status!=='APPROVED_DECLARATIONS_NOT_INDEPENDENT_AUTHENTICATION')return setAll(status==='REVISION_ATTRIBUTION_UNAVAILABLE'||status==='INDEPENDENCE_UNESTABLISHED'?'ATTRIBUTION_UNAVAILABLE':status==='BAR_SEMANTICS_MISMATCH'||status==='IDENTITY_OR_SEMANTICS_UNVERIFIED'?'SEMANTICS_INCOMPATIBLE':'CONTRACT_UNAVAILABLE',status);
 report.rights=synthetic?'CONTROLLED_FIXTURE_DECLARATION_ONLY':'OWNER_DECLARED_PRIVATE_COMPARISON_NOT_VERIFIED_LICENSE';
 if(!Buffer.isBuffer(candidateBytes))return setAll('CANDIDATE_UNAVAILABLE','CANDIDATE_REQUIRED','BLOCKED');
 if(!candidateBytes.length||candidateBytes.length>P2_LIMITS.bytes)return setAll('EVIDENCE_UNVERIFIED','CANDIDATE_SIZE_LIMIT','BLOCKED');
 if(!hash(candidateSidecar)||hashes.candidate!==candidateSidecar||hashes.candidate!==contract.candidateSHA256)return setAll('EVIDENCE_UNVERIFIED','CANDIDATE_HASH_MISMATCH','BLOCKED');
 let candidate;try{sourceRows(originalBytes,contract.original);candidate=sourceRows(candidateBytes,contract.candidate);}catch(e){return setAll('EVIDENCE_UNVERIFIED',e.message);}
 const om=grouped(original),cm=grouped(candidate);
 let sourceOrder=true;for(let i=0;i<candidate.length;i++)if(!positiveTime(candidate[i].time)||i&&candidate[i].time<=candidate[i-1].time)sourceOrder=false;
 for(const c of cohort){const matches=cm.get(c.row.time)||[];let disposition,index=null;
  if(om.get(c.row.time)?.length!==1||matches.length>1)disposition='AMBIGUOUS_KEY';
  else if(!matches.length)disposition='MISSING_OR_OUT_OF_COVERAGE';
  else{index=matches[0].index;disposition=valid(matches[0].row)?contract.purpose==='SOURCE_REVISION'?'SOURCE_REVISION_VALID':'REFERENCE_VALID_NOT_CORRECTION':'STILL_INVALID';}
  ledger.cases.push({barOpenUTC:c.row.time,originalIndex:c.index,disposition,candidateIndex:index});report.dispositions[disposition]++;
 }
 const accepted=report.dispositions.SOURCE_REVISION_VALID+report.dispositions.REFERENCE_VALID_NOT_CORRECTION;
 report.caseAssessment=accepted===36?'PASS':'FAIL';
 report.candidateSnapshotChecks={orderedUniqueTime:sourceOrder,allRowsPassOriginalOHLCValidation:candidate.every(valid),caseRecordsAccountedFor:ledger.cases.length===36,cadenceFreshnessCalendarQualification:'NOT_VERIFIED'};
 report.assessment=accepted===36&&sourceOrder&&report.candidateSnapshotChecks.allRowsPassOriginalOHLCValidation?'PASS':'FAIL';
 report.state=report.assessment==='PASS'?'COMPARISON_COMPLETE_REQUIRES_SOURCE_REVIEW':'COMPARISON_FAILED';
 report.reason=report.assessment==='PASS'?contract.purpose==='SOURCE_REVISION'?'DECLARED_SOURCE_REVISION_VALID_NOT_ADMISSION':'REFERENCE_VALID_NOT_YAHOO_CORRECTION':'UNRESOLVED_CASES_OR_SNAPSHOT_QUALITY';
 return finish();
}
export function parseP2Contract(bytes){return parse(bytes,P2_LIMITS.contractBytes);}
