// Offline research only. Never connects to providers or accepts account/credential state.
import fs from 'node:fs';
import { webcrypto } from 'node:crypto';
import { decodeBackup, LIMITS } from '../public/library-core.js';
import { evaluateResearch } from '../server/evaluation.js';
const matchesRecorded=(saved,actual)=>saved&&typeof saved==='object'?Object.keys(saved).every(k=>matchesRecorded(saved[k],actual?.[k])):saved===actual;
export async function replayBackup(raw,id){
  const library=await decodeBackup(raw,webcrypto),entry=id?library.reports.find(e=>e.id===id||e.record.id===id):library.reports.find(e=>e.record.quantitative);
  if(!entry?.record.quantitative)throw Error('No matching saved quantitative report. Pass its library ID as the second argument.');
  const report=entry.record,e=report.quantitative,hash=report.brief.selected.provenance.hash;
  const snapshot=library.snapshots.find(s=>s.hash===hash&&s.symbol===report.symbol&&s.interval===report.interval);
  if(!snapshot)throw Error('Exact selected-frame candle snapshot was not retained. A hash alone cannot recover provider data.');
  if(report.lineage?.engineVersion&&report.lineage.engineVersion!=='6.3')throw Error('Saved engine version is unsupported.');
  const result=evaluateResearch({candles:snapshot.candles,provenance:snapshot.provenance},snapshot.symbol,e.parameters,{trainFraction:e.split.trainFraction,minimumTrades:e.split.minimumTrades});
  return {schema:'THN-REPLAY-6.5',reportId:entry.id,engineVersion:'6.3',snapshotHash:hash,inputAuthenticity:'Imported backup is unverified; matching SHA-256 checks integrity, not provider authenticity.',matches:{development:matchesRecorded(e.development,result.development.metrics),holdout:matchesRecorded(e.holdout,result.holdout.metrics)},development:result.development.metrics,holdout:result.holdout.metrics};
}
if(process.argv[1]?.endsWith('replay-research.mjs')){
  try{const file=process.argv[2];if(!file||fs.statSync(file).size>LIMITS.backupBytes)throw Error('Usage: node scripts/replay-research.mjs <backup.json> [report-id]; maximum 2.1 MB.');console.log(JSON.stringify(await replayBackup(fs.readFileSync(file,'utf8'),process.argv[3]),null,2));}catch(error){console.error(error.message);process.exitCode=1;}
}
