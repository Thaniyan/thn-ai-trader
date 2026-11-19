import test from 'node:test';
import assert from 'node:assert/strict';
import {decisionHeadline} from '../public/command-evidence.js';
import {recommendationReason} from '../public/recommendation-core.js';

test('concise Day5 blockers preserve recorded priority and full original explanations',()=>{
 const warnings=['risk_review_required','history_stale','neutral_consensus'];const before=JSON.stringify(warnings);
 for(const language of ['en','ar']){const r=decisionHeadline(warnings,language);assert.equal(r.code,'history_stale');assert.equal(r.detail,recommendationReason('history_stale',language));assert.equal(JSON.stringify(warnings),before);assert.equal(Object.hasOwn(r,'probability'),false);assert.equal(Object.hasOwn(r,'entry'),false);}
});
test('each existing blocker has an explicit bilingual headline without interpreting it as a trade signal',()=>{
 for(const code of ['analysis_running','history_unavailable','data_quality','analysis_stale','history_stale','proxy_context','analysis_incomplete','analysis_required','incomplete_frames','conflicting_frames','neutral_consensus','pending_pullback','signal_disagreement','scenario_unavailable','confirmation_pending','risk_exceeded','plan_direction_mismatch','risk_review_required','contract_unavailable','currency_mismatch','invalid_recorded_levels']){
  const en=decisionHeadline([code],'en'),ar=decisionHeadline([code],'ar');assert.equal(en.code,code);assert.equal(ar.code,code);assert.notEqual(en.label,code);assert.notEqual(ar.label,en.label);assert.match(ar.label,/[\u0600-\u06ff]/);assert.equal(en.detail,recommendationReason(code,'en'));assert.equal(ar.detail,recommendationReason(code,'ar'));assert.equal(/\b(?:BUY|SELL|win rate|probability)\b/.test(en.label),false);
 }
});
test('unknown or absent recorded blockers cannot invent financial eligibility or successful validation',()=>{
 const unknown=decisionHeadline(['unsupported-contract-version'],'en');assert.equal(unknown.code,'unsupported-contract-version');assert.equal(unknown.label,'Evidence requires review');assert.equal(unknown.detail,'unsupported-contract-version');
 const none=decisionHeadline([],'en');assert.equal(none.code,null);assert.equal(none.detail,null);assert.equal(none.label,'Review the recorded evidence');
});
test('risk-only and mixed warnings retain the existing presentation priority without mutating frozen source',()=>{
 const warnings=Object.freeze(['risk_review_required']);assert.equal(decisionHeadline(warnings).code,'risk_review_required');assert.equal(decisionHeadline(Object.freeze(['risk_exceeded','history_stale'])).code,'risk_exceeded');
});

import {commandAssessment} from '../public/command-center-core.js';
import {recommendationReview} from '../public/recommendation-core.js';
const day5Now=1800000000000;
function identityFixture(){
 const p={hash:'a'.repeat(64),interval:'1h',lastTime:day5Now-3600000,status:'recent',source:'offline fixture',providerSymbol:'EURUSD=X',currency:'USD',gapCount:0,discardedRows:0};
 return {now:day5Now,context:{symbol:'EURUSD',interval:'1h',datasetId:p.hash},series:{symbol:'EURUSD',provenance:{...p},candles:[{time:p.lastTime,close:1.1}]},analysis:{symbol:'EURUSD',timeframe:'1h',evidence:{...p},confidence:80,grade:'A',schools:[{reasons:[],bias:'BULLISH'}],consensusLabel:'BULLISH',decision:'BUY',entry:1.1,stopLoss:1.09,targets:[1.12,1.13,1.14]},brief:{symbol:'EURUSD',interval:'1h',selected:{provenance:{...p},lastCandle:{close:1.1}},frames:['15m','1h','1d'].map(interval=>({interval,available:true,trend:'bullish',provenance:{...p,interval,lastTime:day5Now-({'15m':900000,'1h':3600000,'1d':86400000}[interval])}})),complete:true,conflicting:false,scenarios:[{direction:'bullish',trigger:1.1,invalidation:1.09,readyForPlanning:true}]},catalog:[{symbol:'EURUSD',providerSymbol:'EURUSD=X',proxy:false,contract:{contractSize:100000,lotStep:.01,minLot:.01,maxLot:100}}]};
}
test('complete matched provider identity preserves exact original levels, recommendation and immutable records',()=>{
 const f=identityFixture(),before=JSON.stringify(f),r=recommendationReview(f),m=commandAssessment(f);assert.equal(m.sourceIdentityMatched,true);assert.deepEqual(m.recommendation,r);assert.equal(m.candidate.entry,f.analysis.entry);assert.deepEqual(m.candidate.targets,f.analysis.targets);assert.equal(m.confluence,80);assert.equal(m.probability,null);assert.equal(JSON.stringify(f),before);
});
test('missing or contradictory provider identity withholds display levels without changing the original recommendation algorithm',()=>{
 for(const mutate of [f=>delete f.series.provenance.source,f=>delete f.series.provenance.providerSymbol,f=>{f.analysis.evidence.providerSymbol='GBPUSD=X'},f=>{f.brief.selected.provenance.currency='JPY'},f=>{f.brief.frames[0].provenance.providerSymbol='GBPUSD=X'},f=>{f.brief.frames[2].provenance.source='different source'},f=>{f.catalog[0].providerSymbol='GBPUSD=X'},f=>{f.catalog[0].providerSymbol=''},f=>{f.series.provenance.providerSymbol='';f.analysis.evidence.providerSymbol='';f.brief.selected.provenance.providerSymbol='';f.brief.frames.forEach(v=>v.provenance.providerSymbol='')}]){
  const f=identityFixture();mutate(f);const before=JSON.stringify(f),raw=recommendationReview(f),m=commandAssessment(f);assert.equal(raw.action,'BUY');assert.deepEqual(m.recommendation,raw);assert.equal(m.sourceIdentityMatched,false);assert.equal(m.candidate,null);assert.ok(m.warnings.includes('source_identity_unverified'));assert.equal(m.probability,null);assert.equal(m.executionAuthorized,false);assert.equal(JSON.stringify(f),before);
 }
});
test('new source labels distinguish incomplete loading from an actual retained identity mismatch',()=>{
 const f=identityFixture();f.analysis=null;const m=commandAssessment(f);assert.equal(m.candidate,null);assert.equal(m.sourceIdentityMatched,false);assert.ok(!m.warnings.includes('source_identity_unverified'));assert.ok(m.warnings.includes('analysis_required'));
});

import {execFileSync} from 'node:child_process';
test('the additive Day5 browser gate preserves all44 original suites and covers45 exactly once',()=>{
 const code=`
import sys
sys.path.insert(0,'scripts/ci')
import browser_suites as m
original=[m.select_suites,m.select_trust_suites,m.select_precision_suites,m.select_heritage_suites,m.select_decision_validation_suites,m.select_phase2_suites]
old=sum((f({}) for f in original),[])
assert len(old)==len(set(old))==44
all_functions=original+[m.select_day5_suites]
for count in [1,2,3,38]:
    groups=[sum((f({'THN_BROWSER_SHARD_INDEX':str(i),'THN_BROWSER_SHARD_COUNT':str(count)}) for f in all_functions),[]) for i in range(count)]
    flat=sum(groups,[])
    assert len(flat)==len(set(flat))==45 and set(flat)==set(old+['day5'])
for env in [{'THN_BROWSER_SHARD_INDEX':'0'}, {'THN_BROWSER_SHARD_COUNT':'2'}, {'THN_BROWSER_SHARD_INDEX':'2','THN_BROWSER_SHARD_COUNT':'2'}]:
    try:m.select_day5_suites(env)
    except ValueError:pass
    else:raise AssertionError(env)
print('45 suites, no loss or duplication')
`;
 assert.match(execFileSync('python3',['-c',code],{encoding:'utf8'}),/45 suites/);
});

test('missing independent timeframes do not erase the unchanged current school score or authorize a setup',()=>{const f=identityFixture();f.brief=null;const m=commandAssessment(f);assert.equal(m.sourceIdentityMatched,true);assert.equal(m.confluence,80);assert.equal(m.candidate,null);assert.equal(m.probability,null);assert.ok(m.warnings.includes('incomplete_frames'));});
test('source mismatch withdraws current model projection while preserving the original retained response and recommendation',()=>{
 const f=identityFixture();f.review={method:'llm-assisted',provider:'ollama',model:'offline-fixture',modelCalls:1,summary:'Offline fixture, not a genuine inference.',generation:{citations:['frame-1h']},snapshot:{symbol:'EURUSD',interval:'1h',selectedHash:f.context.datasetId,fresh:true,asOf:day5Now,refs:[{id:'frame-1h',availableAt:day5Now}]}};f.reviewLanguage='en';f.language='en';assert.ok(commandAssessment(f).verified_model_interpretation);f.series.provenance.providerSymbol='GBPUSD=X';const before=JSON.stringify(f.review),m=commandAssessment(f);assert.equal(m.recommendation.interpretation.method,'llm-assisted');assert.equal(m.verified_model_interpretation,null);assert.equal(JSON.stringify(f.review),before);
});
