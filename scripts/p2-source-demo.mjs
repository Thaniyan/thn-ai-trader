// Controlled fixtures only. These are not corrected vendor data or owner records.
import {compareSourceCases} from './p2-source-cases.mjs';
import {fileSHA} from './p2-private-files.mjs';
export function p2Fixture(){
 const t=Date.UTC(2020,0,1)/1000,timestamp=Array.from({length:120},(_,i)=>t+i*86400),quote={open:Array(120).fill(1.1),high:Array(120).fill(1.11),low:Array(120).fill(1.09),close:Array(120).fill(1.1),volume:Array(120).fill(0)};
 const masks=[...Array(6).fill(2),...Array(12).fill(3),...Array(7).fill(8),...Array(11).fill(12)];masks.forEach((m,j)=>{const i=j+10;if(m<4){quote.high[i]=1.099;quote.open[i]=m===2?1.098:1.1;}else{quote.low[i]=1.101;quote.open[i]=m===8?1.102:1.1;}});for(let i=60;i<65;i++)for(const k of ['open','high','low','close'])quote[k][i]=null;
 const original={chart:{result:[{timestamp,meta:{symbol:'EURUSD=X',currency:'USD',instrumentType:'CURRENCY',exchangeTimezoneName:'UTC'},indicators:{quote:[quote]}}]}};
 const candidate=structuredClone(original);const q=candidate.chart.result[0].indicators.quote[0];for(let i=0;i<120;i++){q.open[i]=1.1;q.high[i]=1.11;q.low[i]=1.09;q.close[i]=1.1;}
 const originalBytes=Buffer.from(JSON.stringify(original)),candidateBytes=Buffer.from(JSON.stringify(candidate));
 const bar={timezone:'UTC',sessionBoundary:'00:00',quoteBasis:'MID',adjustment:'UNADJUSTED',timestampConvention:'BAR_OPEN_UTC',aggregation:'SOURCE_SUPPLIED_1D',semanticsEvidenceId:'fixture-semantics'};
 const identity={sourceId:'yahoo-finance',providerSymbol:'EURUSD=X',instrument:'EURUSD',product:'OTC_FX',base:'EUR',quote:'USD',interval:'1d',format:'YAHOO_CHART_1',bar};
 const originalSidecar=fileSHA(originalBytes),candidateSidecar=fileSHA(candidateBytes),contract={schema:'THN-P2-CONTRACT-1',mode:'CONTROLLED_FIXTURE',purpose:'SOURCE_REVISION',originalSHA256:originalSidecar,candidateSHA256:candidateSidecar,original:structuredClone(identity),candidate:structuredClone(identity),rights:{status:'APPROVED_PRIVATE_OFFLINE_COMPARE',approvalId:'fixture-approval',originalEvidenceId:'fixture-original-rights',candidateEvidenceId:'fixture-revision-rights',retentionEvidenceId:'fixture-retention'},revision:{kind:'SOURCE_DECLARED_CORRECTION',revisionId:'fixture-revision',attributionEvidenceId:'fixture-attribution',originalSHA256:originalSidecar},independence:null,restrictions:{network:false,priceWrites:false,providerActivation:false,production:false,admission:false,execution:false}};
 return {originalBytes,candidateBytes,originalSidecar,candidateSidecar,contract,synthetic:true};
}
export function p2Demonstration(){
 const scenarios=[['valid_fixture_revision',f=>f],['missing_candidate',f=>({...f,candidateBytes:null})],['missing_contract',f=>({...f,contract:null})],['bad_hash',f=>({...f,candidateSidecar:'0'.repeat(64)})],['pending_rights',f=>{f.contract.rights.status='PENDING';return f;}],['different_semantics',f=>{f.contract.candidate.bar.quoteBasis='ASK';return f;}],['still_invalid',f=>{f.candidateBytes=f.originalBytes;f.candidateSidecar=f.originalSidecar;f.contract.candidateSHA256=f.originalSidecar;return f;}]];
 return {scope:'CONTROLLED_SYNTHETIC_DEMO_NOT_SOURCE_MODEL_OR_TICKET_QUALIFICATION',networkRequests:0,priceWrites:0,rows:scenarios.map(([name,change])=>{const {report}=compareSourceCases(change(p2Fixture()));return {name,state:report.state,assessment:report.assessment,reason:report.reason,cases:report.observedCases,dispositions:Object.fromEntries(Object.entries(report.dispositions).filter(([,v])=>v)),sourceQualification:report.sourceQualification};})};
}
