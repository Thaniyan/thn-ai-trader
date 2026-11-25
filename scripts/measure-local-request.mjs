// Offline synthetic bytes/construction only. No model/network/worker operations.
import {pathToFileURL} from 'node:url';
import {performance} from 'node:perf_hooks';
import {syntheticPilotSnapshot} from './pilot-local-ai.mjs';
import {buildLocalRequest,compactPilotEvidence} from '../server/intelligence-local.js';
import {unpackLocalEvidence,LOCAL_REQUEST_VERSION} from '../server/intelligence-request-codec.js';
import {baselineLocalRequest} from '../tests/fixtures/local-request-v1.mjs';
import {evidenceSnapshot} from '../server/intelligence.js';
import {isDeepStrictEqual} from 'node:util';
import {validateGeneration,evidenceState} from '../public/intelligence-generation.js';

export function richOfflineSnapshot(at=1800000000000){
 const s=syntheticPilotSnapshot(at);
 const frames=s.refs.filter(r=>r.interval).map(r=>({interval:r.interval,available:true,trend:r.trend,...r.inputs,provenance:{source:r.source,providerSymbol:r.providerSymbol,hash:r.datasetHash,lastTime:r.availableAt-({"15m":900000,"1h":3600000,"1d":86400000}[r.interval]),status:r.status}}));
 const selected={provenance:{hash:s.selectedHash},events:Array.from({length:6},(_,i)=>({type:'SYNTHETIC structure observation',confirmedAt:at-7200000-i*3600000,price:1.1}))};
 return evidenceSnapshot({symbol:s.symbol,interval:s.interval,asOf:at,selected,frames},{riskPlan:{symbol:s.symbol,capital:10000,riskPct:1,entry:1.1,stop:1.09,lots:.1,budget:100,plannedStopLossWithCosts:100,metrics:{requiredMargin:200}}});
}
export function measureLocalRequests(){
 const rows=[];
 for(const language of ['en','ar'])for(const scenario of ['conflicting','bullish','bearish','neutral','missing','stale','rich']){
  const s=scenario==='rich'?richOfflineSnapshot():syntheticPilotSnapshot(1800000000000,scenario),question=language==='ar'?'تحليل EURUSD':'Analyze EURUSD',old=baselineLocalRequest(s,question,{language}),next=buildLocalRequest(s,question,{language,pilotCompact:true});
  const wire=unpackLocalEvidence(JSON.parse(next.messages[1].content).evidence);for(const key of ['snapshotId','symbol','interval','evidenceState'])wire[key]=next.format.properties[key].const;
  if(!isDeepStrictEqual(wire,JSON.parse(JSON.stringify(compactPilotEvidence(s))))||!isDeepStrictEqual(next.format,old.format))throw Error('Offline source/strict-schema parity failed');
  const samples=[],baselineSamples=[];for(let i=0;i<100;i++){let start=performance.now();baselineLocalRequest(s,question,{language});baselineSamples.push(performance.now()-start);start=performance.now();buildLocalRequest(s,question,{language,pilotCompact:true});samples.push(performance.now()-start);}samples.sort((a,b)=>a-b);baselineSamples.sort((a,b)=>a-b);
  // A valid synthetic response representation, not generated model output or
  // a tokenizer/throughput estimate. Keep both sides of a conflicting case.
  const refs=s.refs.filter(r=>r.interval),specimen={schema:'THN-GENERATION-7.1',snapshotId:s.id,symbol:s.symbol,interval:s.interval,summary:language==='ar'?'راجع الأدلة والأدلة المعارضة.':'Review the evidence and opposing observations.',citations:refs.map(r=>r.id),claims:refs.map(r=>({reference:r.id,field:'trend',value:r.trend})),roles:next.roles,evidenceState:evidenceState(s),uncertainties:[language==='ar'?'المشاهدات لا تثبت النتائج المستقبلية.':'Observations do not establish future outcomes.']};
  validateGeneration(specimen,s,{strict:true,expectedRoles:next.roles});
  rows.push({scenario,language,references:s.refs.length,oldRequestBytes:old.requestBytes,newRequestBytes:next.requestBytes,savedBytes:old.requestBytes-next.requestBytes,reductionPct:Math.round((old.requestBytes-next.requestBytes)/old.requestBytes*10000)/100,reservedBefore:old.requestBytes+512+256,reservedAfter:next.requestBytes+512+256,context:4096,outputBudget:256,baselineConstructionMedianMs:Number(baselineSamples[50].toFixed(3)),baselineConstructionP95Ms:Number(baselineSamples[94].toFixed(3)),constructionMedianMs:Number(samples[50].toFixed(3)),constructionP95Ms:Number(samples[94].toFixed(3)),illustrativeValidOutput:{generated:false,allFieldsAndFrameClaimsRetained:true,prettyBytes:Buffer.byteLength(JSON.stringify(specimen,null,2)),minifiedBytes:Buffer.byteLength(JSON.stringify(specimen)),actualModelTokens:null},losslessEvidence:true,unchangedOutputSchema:true});
 }
 return {schema:'THN-OFFLINE-REQUEST-MEASUREMENT-1',baseline:'7a79e44c0a13c9a77d19dde66172eb12fb1403b0',optimizerVersion:LOCAL_REQUEST_VERSION,syntheticOnly:true,networkRequests:0,generationTested:false,modelQualification:'NOT_VERIFIED',releaseDecision:'NO_GO',actualModelTokens:null,actualInferenceLatencyMs:null,policyMs:12000,reservationFormula:'encoded messages/format bytes +512 +unchanged output budget; not measured tokens',rows};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){if(process.argv.length!==2){process.stderr.write('Offline measurement takes no model, input or run arguments.\n');process.exitCode=1;}else process.stdout.write(JSON.stringify(measureLocalRequests(),null,2)+'\n');}
