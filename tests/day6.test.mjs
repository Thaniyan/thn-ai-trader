import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {formatRetainedLevel} from '../public/command-evidence.js';

test('retained six-decimal references remain distinct and round-trip in EN and AR',()=>{
 const values=Object.freeze([1.100019,1.100013,1.100029,1.100034,1.100038,157.123456,.000001]);
 const parse=s=>Number(s.replace(/[,\u066c]/g,'').replace(/\u066b/g,'.').replace(/[\u0660-\u0669]/g,c=>String(c.charCodeAt(0)-0x660)));
 for(const lang of ['en','ar']){
  const rendered=values.map(v=>formatRetainedLevel(v,lang));assert.equal(new Set(rendered).size,values.length);
  assert.deepEqual(rendered.map(parse),[...values]);
 }
});
test('unavailable or disqualified references never acquire a synthetic display price',()=>{
 for(const lang of ['en','ar'])for(const value of [null,undefined,NaN,Infinity,-Infinity,0,-1,'1.1',false])assert.equal(formatRetainedLevel(value,lang),'—');
});
test('retained reference formatting adds no conversion or extra significant digits',()=>{
 assert.equal(formatRetainedLevel(1.1),'1.1');assert.equal(formatRetainedLevel(1.100029),'1.100029');assert.equal(formatRetainedLevel(157.123456),'157.123456');
});

test('Day6 extends all45 existing browser suites exactly once, retaining strict sharding',()=>{
 const result=execFileSync('python3',['-c',`
import sys
sys.path.insert(0,'scripts/ci')
import browser_suites as m
old=[m.select_suites,m.select_trust_suites,m.select_precision_suites,m.select_heritage_suites,m.select_decision_validation_suites,m.select_phase2_suites,m.select_day5_suites]
original=sum((f({}) for f in old),[])
assert len(original)==len(set(original))==45
for count in [1,2,3,38]:
    groups=[sum((f({'THN_BROWSER_SHARD_INDEX':str(i),'THN_BROWSER_SHARD_COUNT':str(count)}) for f in old+[m.select_day6_suites]),[]) for i in range(count)]
    flat=sum(groups,[])
    assert len(flat)==len(set(flat))==46 and set(flat)==set(original+['day6'])
assert m.select_day6_suites({'THN_BROWSER_SHARD_INDEX':'0','THN_BROWSER_SHARD_COUNT':'2'})==[]
assert m.select_day6_suites({'THN_BROWSER_SHARD_INDEX':'1','THN_BROWSER_SHARD_COUNT':'2'})==['day6']
for env in [{'THN_BROWSER_SHARD_INDEX':'0'},{'THN_BROWSER_SHARD_COUNT':'2'},{'THN_BROWSER_SHARD_INDEX':'2','THN_BROWSER_SHARD_COUNT':'2'}]:
    try:m.select_day6_suites(env)
    except ValueError:pass
    else:raise AssertionError(env)
print('46 suites; all45 original suites retained unchanged')
`],{encoding:'utf8'});
 assert.match(result,/46 suites/);
});
