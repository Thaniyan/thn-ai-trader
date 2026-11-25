// Offline command. Only immutable existing private files are read; no fetch/server.
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {compareSourceCases,parseP2Contract,contractStatus,P2_LIMITS,P1_ORIGINAL_SHA} from './p2-source-cases.mjs';
import {fileSHA,privateFile,privateOutputDirectory,verifyUnchanged,writePrivateReport} from './p2-private-files.mjs';
import {p2Demonstration} from './p2-source-demo.mjs';
export function parseCaseArgs(args){
 if(args.length===1&&args[0]==='--demo')return {demo:true};
 const allowed=['--original','--original-sha-file','--candidate','--candidate-sha-file','--contract','--private-dir'],out={};
 for(let i=0;i<args.length;i+=2){const key=args[i],v=args[i+1];if(!allowed.includes(key)||Object.hasOwn(out,key)||!v||!path.isAbsolute(v))throw Error('PRIVATE_ARGUMENTS_INVALID');out[key]=v;}
 if(!out['--private-dir']||!!out['--original']!==!!out['--original-sha-file']||!!out['--candidate']!==!!out['--candidate-sha-file'])throw Error('PRIVATE_ARGUMENTS_INVALID');return out;
}
export async function runCaseCommand(args,{synthetic=false}={}){
 const a=parseCaseArgs(args);if(a.demo)return p2Demonstration();
 const directory=await privateOutputDirectory(a['--private-dir']),files=[],input={synthetic};
 if(a['--original']){const body=await privateFile(a['--original'],P2_LIMITS.bytes),side=await privateFile(a['--original-sha-file'],256);files.push(body,side);input.originalBytes=body.body;input.originalSidecar=side.body.toString('utf8').trim();}
 if(a['--contract']){const c=await privateFile(a['--contract'],P2_LIMITS.contractBytes,{immutable:false});files.push(c);input.contract=parseP2Contract(c.body);}
 // Rights/identity/semantics gate precedes reading candidate private content.
 const actualOriginalHash=input.originalBytes?fileSHA(input.originalBytes):null;
 const originalVerified=actualOriginalHash&&actualOriginalHash===input.originalSidecar&&(synthetic||actualOriginalHash===P1_ORIGINAL_SHA);
 if(a['--candidate']&&originalVerified&&contractStatus(input.contract,actualOriginalHash,{synthetic})==='APPROVED_DECLARATIONS_NOT_INDEPENDENT_AUTHENTICATION'){
  const body=await privateFile(a['--candidate'],P2_LIMITS.bytes),side=await privateFile(a['--candidate-sha-file'],256);files.push(body,side);input.candidateBytes=body.body;input.candidateSidecar=side.body.toString('utf8').trim();
 }
 const result=compareSourceCases(input);await verifyUnchanged(files);result.report.inputIntegrity='UNCHANGED';
 await writePrivateReport(directory,'private-case-ledger.json',result.privateLedger);await writePrivateReport(directory,'redacted-report.json',result.report);
 return result.report;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const report=await runCaseCommand(process.argv.slice(2));console.log(JSON.stringify(report,null,2));if(report.schema&&report.assessment!=='PASS')process.exitCode=2;}
 catch{console.error(JSON.stringify({schema:'THN-P2-RESULT-1',state:'BLOCKED',assessment:'NOT_VERIFIED',reason:'PRIVATE_INPUT_OR_CONTRACT_REJECTED',networkRequests:0,priceWrites:0,qualificationChanged:false,financialExecution:false}));process.exitCode=1;}
}
