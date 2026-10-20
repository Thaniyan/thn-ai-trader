import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {execFileSync} from 'node:child_process';import {evaluatePilot} from '../scripts/evaluate-intelligence-pilot.mjs';
test('frozen evaluation compares unchanged v6.6/v7 deterministic engines without inventing model scores',async()=>{
 assert.deepEqual(fs.readFileSync('public/decision-core.js'),execFileSync('git',['show','ddd13c298103d93ced74fdb8bbf8c43f4579369c:public/decision-core.js']));
 const r=await evaluatePilot();assert.equal(r.cases.length,6);assert.equal(r.realModelRun,false);assert.equal(r.modelSelfEvaluation,false);
 for(const c of r.cases){for(const k of ['A_v66','B_v70']){assert.equal(c[k].validCitations,c[k].citations,c.name);assert.equal(c[k].numericalCorrect,true,c.name);assert.equal(c[k].contradictionCorrect,true,c.name);assert.equal(c[k].uncertainty,true,c.name);}assert.equal(c.C_realLocalModel.run,false);assert.equal(c.C_realLocalModel.factualAccuracy,null);}
 assert.equal(r.cases.find(c=>c.name==='missing_daily').B_v70.outcome,'insufficient');assert.equal(r.cases.find(c=>c.name==='stale_daily').B_v70.outcome,'insufficient');
});
