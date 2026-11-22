import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {parsePilotArgs} from '../scripts/pilot-local-ai.mjs';
import https from 'node:https';
import {prepareLocalAI,preparationCLI} from '../scripts/prepare-local-ai.mjs';
const configuration=()=>({schema:'THN-LOCAL-ASSESSMENT-1',models:[{model:'qwen3:1.7b',digest:'a'.repeat(64),optional:false}],languages:['en','ar'],threads:[2],conditions:['warm'],profiles:['compact'],cases:['bullish','bearish','neutral','conflicting','missing','stale'],repetitions:1,prepareModel:false});
const environment=()=>({THN_AI_MODEL:'qwen3:1.7b',THN_AI_EXPECTED_DIGEST:'a'.repeat(64),THN_LOCAL_PAPER:'0',THN_AI_MAX_REQUESTS:'12',THN_AI_CONTEXT_TOKENS:'4096',THN_AI_MAX_OUTPUT_TOKENS:'500',THN_AI_TOTAL_TOKEN_CEILING:'50000',THN_AI_PILOT_COMPACT:'1',THN_AI_PILOT_KEEP_ALIVE:'5m',THN_AI_PILOT_THREADS:'2'});
test('offline preparation uses existing plans and evidence contracts without network, activation or configuration writes',()=>{
 const env=environment(),config=configuration(),before=JSON.stringify({env,config});
 let calls=0;const blocked=()=>{calls++;throw Error('Network forbidden');};
 const originals=[http.request,https.request,globalThis.fetch];
 http.request=blocked;https.request=blocked;globalThis.fetch=blocked;
 let report;try{report=prepareLocalAI(config,{env});}finally{[http.request,https.request,globalThis.fetch]=originals;}
 assert.equal(calls,0);assert.equal(JSON.stringify({env,config}),before);
 assert.equal(report.networkRequests,0);assert.equal(report.generationTested,false);assert.equal(report.modelActivationPerformed,false);assert.equal(report.financialExecution,false);
 assert.equal(report.runtimeInventory,'NOT_VERIFIED');assert.equal(report.modelQualification,'NOT_VERIFIED');assert.equal(report.releaseDecision,'NO_GO');assert.equal(report.digestIdentity,'REQUESTED_NOT_INSPECTED');
 assert.equal(report.requestPolicyMs,12000);assert.equal(report.worstCaseReservedUnits,49152);assert.equal(report.minimumRepeatedPositiveCoveragePlanned,false);
 assert.deepEqual(report.requestedSettings,{compactPilot:true,keepAlive:'5m',pilotThreads:2});assert.equal(report.workerConfirmedSettings,null);assert.equal(report.runtimeSettingsVerified,false);
 assert.deepEqual(report.evidenceCases.map(x=>[x.caseName,x.localEvidenceAdmissible]),[['bullish',true],['bearish',true],['neutral',true],['conflicting',true],['missing',false],['stale',false]]);
 assert.equal(report.futureSingleShotCommands.length,2);assert.ok(report.futureSingleShotCommands.every(x=>x.requiresSeparateOwnerAuthorization&&x.syntheticOnly&&!x.qualifiesMarketData));
 assert.ok(report.blockers.includes('EXPLICIT_LOCAL_INFERENCE_AUTHORIZATION_NOT_CONFIGURED'));
});
test('even configured local inference never becomes qualified in offline preparation',()=>{
 const report=prepareLocalAI(configuration(),{env:{...environment(),THN_AI_PROVIDER:'ollama',THN_AI_ENABLED:'1',THN_AI_AUTH_TOKEN:'private-test-token'}});
 assert.equal(report.requestedInferenceAuthorized,true);assert.equal(report.modelQualification,'NOT_VERIFIED');assert.equal(report.releaseDecision,'NO_GO');assert.equal(JSON.stringify(report).includes('private-test-token'),false);
});
test('identity, EN/AR, scenario coverage, closed keys and budgets fail closed',()=>{
 for(const change of [c=>c.extra=true,c=>c.models[0].digest='bad',c=>c.models[0].optional=true,c=>c.models[0].model='cloud:latest',c=>c.languages=['en'],c=>c.languages=['en','ar','fr'],c=>c.cases.pop(),c=>c.repetitions=2,c=>c.threads=[1],c=>c.conditions=['cold'],c=>c.profiles=['full']]){
  const config=configuration();change(config);assert.throws(()=>prepareLocalAI(config,{env:environment()}));
 }
 for(const change of [{THN_AI_EXPECTED_DIGEST:'b'.repeat(64)},{THN_AI_MODEL:'qwen3:0.6b'},{THN_AI_MAX_REQUESTS:'11'},{THN_AI_TOTAL_TOKEN_CEILING:'40000'},{THN_AI_MAX_OUTPUT_TOKENS:'NaN'},{THN_AI_CONTEXT_TOKENS:'0'},{THN_AI_CONTEXT_TOKENS:'x'},{THN_LOCAL_PAPER:'1'},{THN_AI_TIMEOUT_MS:'12001'},{THN_AI_PILOT_THREADS:'3'},{THN_AI_PILOT_KEEP_ALIVE:'1h'},{THN_AI_PILOT_COMPACT:'true'},{THN_AI_OLLAMA_URL:'https://example.com'},{VERCEL:'1'}])assert.throws(()=>prepareLocalAI(configuration(),{env:{...environment(),...change}}),JSON.stringify(change));
 assert.throws(()=>prepareLocalAI(configuration(),{env:{}}));
});
test('secret-like requested identity is rejected and neither config paths nor arbitrary fields are echoed',()=>{
 assert.throws(()=>prepareLocalAI(configuration(),{env:{...environment(),THN_AI_AUTH_TOKEN:'a'.repeat(64)}}));
 const report=preparationCLI(['--plan','private-plan.json'],{env:environment(),readFile:()=>Buffer.from(JSON.stringify(configuration()))});
 assert.equal(JSON.stringify(report).includes('private-plan.json'),false);
 assert.equal(JSON.stringify(report).includes('"digest":'),false);
});
test('CLI is strictly offline, bounded and rejects inference/install flags before reading files',()=>{
 let reads=0;const readFile=()=>{reads++;return Buffer.from('{}');};
 for(const args of [[],['--run','x'],['--check','x'],['--pull','x'],['--plan','x','extra']])assert.throws(()=>preparationCLI(args,{env:environment(),readFile}));
 assert.equal(reads,0);
 assert.throws(()=>preparationCLI(['--plan','x'],{readFile:()=>Buffer.alloc(16385),env:environment()}));
 assert.throws(()=>preparationCLI(['--plan','x'],{readFile:()=>Buffer.from('{broken'),env:environment()}));
});
test('readiness never hides future preparation activation or labels synthetic evidence as live market data',()=>{
 const config=configuration();config.prepareModel=true;
 const report=prepareLocalAI(config,{env:environment()});
 assert.equal(report.preparationWouldActivateModel,true);assert.equal(report.modelActivationPerformed,false);
 assert.ok(report.evidenceCases.every(x=>x.syntheticOnly));assert.equal(report.acceptanceContract.hardDeadlineIncludingCancellationMs,12000);
 assert.equal(report.acceptanceContract.sourceCitations,true);assert.equal(report.acceptanceContract.noPredictiveProbability,true);
});

test('default reader rejects actual oversized, nonregular and symlink plans without unbounded reads',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'thn-ai-prep-'));
 try{
  const valid=path.join(dir,'valid.json'),oversized=path.join(dir,'oversized.json'),link=path.join(dir,'link.json');
  fs.writeFileSync(valid,JSON.stringify(configuration()));fs.writeFileSync(oversized,Buffer.alloc(16385));
  const report=preparationCLI(['--plan',valid],{env:environment()});assert.equal(report.configurationValid,true);
  assert.throws(()=>preparationCLI(['--plan',oversized],{env:environment()}),/Bounded regular/);
  assert.throws(()=>preparationCLI(['--plan',dir],{env:environment()}),/Bounded regular/);
  if(process.platform!=='win32'){
   fs.symlinkSync(valid,link);assert.throws(()=>preparationCLI(['--plan',link],{env:environment()}),/Bounded regular/);
   if(fs.existsSync('/dev/null'))assert.throws(()=>preparationCLI(['--plan','/dev/null'],{env:environment()}),/Bounded regular/);
  }
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('future single-shot handoff matches the original parser exactly and remains a nonexecuted command',()=>{
 const report=prepareLocalAI(configuration(),{env:environment()});
 for(const handoff of report.futureSingleShotCommands){
  const tokens=handoff.command.split(' ');
  assert.deepEqual(tokens.slice(0,2),['node','scripts/pilot-local-ai.mjs']);
  assert.deepEqual(parsePilotArgs(tokens.slice(2)),{mode:'--run',model:'qwen3:1.7b',language:handoff.language});
 }
 assert.equal(report.modelActivationPerformed,false);assert.equal(report.generationTested,false);
});
