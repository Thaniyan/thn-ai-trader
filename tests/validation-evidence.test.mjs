import {test} from 'node:test';
import assert from 'node:assert/strict';
import {savedValidationModel,savedValidationHTML,checks} from '../public/validation-evidence.js';
const hash='a'.repeat(64);
const report=()=>({brief:{selected:{provenance:{hash,status:'recent',gapCount:0,discardedRows:0}}},quantitative:{parameters:{strategy:'ema',spreadBps:2,slippageBps:1,commissionBps:0},split:{minimumTrades:20,developmentFirstTime:1700000000000,developmentLastTime:1700003600000,holdoutFirstTime:1700007200000,holdoutLastTime:1700010800000},development:{trades:1,returnPct:100,expectancy:10,averageR:2},holdout:{trades:1,returnPct:100,expectancy:10,averageR:null},quality:{criteriaVersion:'6.4-Q1',datasetHash:hash,checks:Object.keys(checks).map((code,i)=>({code,pass:i%2===0}))},sensitivity:[{kind:'cost',label:'higher_costs',parameters:{spreadBps:9,commissionBps:4},development:{returnPct:-1},holdout:{returnPct:0}}],walkForward:{available:true,summary:{positiveFolds:3,totalTrades:30}}}});
const freeze=v=>{if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
test('saved verdicts are preserved even when retained metrics suggest another result',()=>{
 const r=freeze(report()),before=JSON.stringify(r),m=savedValidationModel(r);
 assert.equal(m.findings.length,10);assert.equal(m.findings[0].status,'passed');assert.equal(m.findings[1].status,'unmet');
 assert.match(savedValidationHTML(r),/Recorded unmet/);assert.equal(JSON.stringify(r),before);
});
test('missing checks cannot be inferred from positive metrics',()=>{
 const r=report();delete r.quantitative.quality.checks;
 assert.ok(savedValidationModel(r).findings.every(c=>c.status==='missing'));
 assert.doesNotMatch(savedValidationHTML(r),/>Recorded pass</);
});
test('no quantitative evaluation produces missing evidence, not zero returns or outcomes',()=>{
 const r={brief:report().brief,quantitative:null};const html=savedValidationHTML(r);
 assert.ok(savedValidationModel(r).findings.every(c=>c.status==='missing'));
 assert.match(html,/Not recorded/);assert.doesNotMatch(html,/>Recorded pass</);assert.match(html,/disabled/);
});
test('unknown criteria preserve raw flags without applying current thresholds',()=>{
 const r=report();r.quantitative.quality.criteriaVersion='legacy-unknown';const html=savedValidationHTML(r);
 assert.ok(savedValidationModel(r).findings.every(c=>c.status==='indeterminate'));
 assert.match(html,/Stored flag \(not validated here\)/);assert.doesNotMatch(html,/≤ 40%/);assert.match(html,/Current thresholds are not applied/);
});
test('conflicting or absent identity does not substitute current report provenance',()=>{
 for(const identity of ['b'.repeat(64),undefined]){const r=report();r.quantitative.quality.datasetHash=identity;const m=savedValidationModel(r);assert.equal(m.linked,false);assert.deepEqual(m.evaluation.dataset,{});assert.ok(m.findings.every(c=>c.status==='indeterminate'));}
});
test('duplicate or nonboolean recorded flags are indeterminate',()=>{
 const r=report();r.quantitative.quality.checks.push({code:'trade_count',pass:false});r.quantitative.quality.checks[1].pass='true';
 const m=savedValidationModel(r);assert.equal(m.findings[0].status,'indeterminate');assert.equal(m.findings[1].status,'indeterminate');
});
test('missing fold and stress details are explicit, never reconstructed from summaries',()=>{
 const r=report();let html=savedValidationHTML(r);assert.match(html,/Individual fold periods and trade counts were not retained/);assert.match(html,/Spread bps: 9/);assert.match(html,/Commission bps: 4/);
 delete r.quantitative.sensitivity;html=savedValidationHTML(r);assert.match(html,/Stress variants and their assumptions were not retained/);
});
test('imports remain unverified and source labels cannot create HTML',()=>{
 const r=report();r.imported=true;r.quantitative.sensitivity[0].label='<img src=x onerror=alert(1)>';
 const html=savedValidationHTML(r);assert.match(html,/Imported \/ unverified research/);assert.match(html,/not independently verified/);assert.doesNotMatch(html,/<img/);assert.match(html,/&lt;img/);
});
test('recorded null and absent values remain distinct and do not become zero',()=>{
 const r=report();delete r.quantitative.holdout.trades;const html=savedValidationHTML(r);
 assert.match(html,/data-validation-value="holdout-trades"><bdi dir="ltr">Not recorded/);
 assert.match(html,/data-validation-value="holdout-averageR"><bdi dir="ltr">Unavailable/);
});
test('complete retained folds show their own historical periods without current-data reconstruction',()=>{
 const r=report();r.quantitative.walkForward.folds=[{fold:1,development:{sample:{firstTime:1700000000000,lastTime:1700003600000}},holdout:{sample:{firstTime:1700007200000,lastTime:1700010800000},metrics:{returnPct:3,trades:7}}}];freeze(r);
 const html=savedValidationHTML(r);assert.match(html,/2023-11-15 00:13:20 UTC/);assert.match(html,/data-validation-value="fold-1-trades"><bdi dir="ltr">7/);assert.doesNotMatch(html,/Individual fold periods and trade counts were not retained/);
});
test('contradictory retained period metadata remains indeterminate without overwriting stored flags',()=>{
 const r=report();r.quantitative.quality.period={minimumTrades:5};const before=JSON.stringify(r);
 assert.ok(savedValidationModel(r).findings.every(c=>c.status==='indeterminate'&&c.reason==='period_conflict'));
 assert.match(savedValidationHTML(r),/Stored flags are preserved/);assert.equal(JSON.stringify(r),before);
});
test('untrusted retained fold identifiers cannot escape evidence attributes',()=>{
 const r=report();r.quantitative.walkForward.folds=[{fold:'1" onmouseover="alert(1)',holdout:{metrics:{returnPct:1,trades:1}}}];
 const html=savedValidationHTML(r);assert.match(html,/data-validation-value="fold-1&quot; onmouseover=&quot;/);assert.doesNotMatch(html,/data-validation-value="fold-1" onmouseover=/);
});
