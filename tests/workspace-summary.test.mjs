import test from 'node:test';
import assert from 'node:assert/strict';
import {workspaceSummary} from '../public/workspace-summary-core.js';
test('workspace prioritizes exact source blockers, never turns confluence into eligibility',()=>{
 const m={fresh:true,sourceIdentityMatched:true,confluence:94,warnings:['risk_review_required','neutral_consensus','data_quality']};
 const p={status:'wait',candidate:null,risk:'unreviewed'},before=JSON.stringify({m,p});const s=workspaceSummary(m,p);
 assert.equal(s.status,'wait');assert.equal(s.dataState,'blocked');assert.deepEqual(s.primary,['data_quality','neutral_consensus']);assert.equal(s.next,'quality');assert.equal(s.candidate,false);assert.equal(s.probability,null);assert.equal(s.executionAuthorized,false);assert.equal(JSON.stringify({m,p}),before);
});
test('missing, stale, incompatible and incomplete observations have distinct next checks',()=>{
 for(const [warnings,next]of [[['history_unavailable','currency_mismatch'],'source'],[['history_stale'],'source'],[['proxy_context'],'identity'],[['incomplete_frames'],'frames']]){
  const s=workspaceSummary({fresh:false,sourceIdentityMatched:false,warnings},{status:'wait'});assert.equal(s.next,next);assert.equal(s.dataState,'blocked');assert.equal(s.candidate,false);
 }
});
test('conditional and original validated-plan states are copied without recalculating money or levels',()=>{
 const m={fresh:true,sourceIdentityMatched:true,warnings:['risk_review_required']},p={status:'conditional',candidate:{entry:1.1,stop:1.09,targets:[1.12]},risk:'unreviewed'};
 assert.equal(workspaceSummary(m,p).next,'risk');assert.equal(workspaceSummary(m,p).riskState,'unreviewed');assert.equal(workspaceSummary(m,p).status,'conditional');
 p.validatedPlan={};p.risk='within_budget';p.status='eligible';const s=workspaceSummary(m,p);assert.equal(s.riskState,'reviewed');assert.equal(s.status,'eligible');assert.ok(!('entry' in s));assert.ok(!('lots' in s));assert.equal(s.executionAuthorized,false);
 p.risk='over_budget';assert.equal(workspaceSummary(m,p).riskState,'over_budget');
});
test('pending confirmation is not a released candidate and missing context stays unavailable',()=>{
 const s=workspaceSummary({fresh:true,sourceIdentityMatched:true,warnings:['confirmation_pending','risk_review_required']},{status:'conditional'});assert.equal(s.next,'confirmation');assert.equal(s.candidate,false);assert.deepEqual(s.primary,['confirmation_pending']);
 const empty=workspaceSummary();assert.equal(empty.status,'wait');assert.equal(empty.dataState,'unavailable');assert.equal(empty.riskState,'unreviewed');
});
