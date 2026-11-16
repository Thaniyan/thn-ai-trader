import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
test('A+ acceptance extends all forty original suites exactly once without weakening sharding',()=>{
 const value=execFileSync('python3',['-c',`
import importlib.util
spec=importlib.util.spec_from_file_location('m','scripts/ci/browser_suites.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
original=m.select_suites({})+m.select_trust_suites({})
assert len(original)==40
assert m.select_precision_suites({})==['precision']
for count in [1,2,3,38]:
    flat=[]
    for index in range(count):
        env={'THN_BROWSER_SHARD_INDEX':str(index),'THN_BROWSER_SHARD_COUNT':str(count)}
        flat+=m.select_suites(env)+m.select_trust_suites(env)+m.select_precision_suites(env)
    assert len(flat)==len(set(flat))==41
    assert set(flat)==set(original+['precision'])
try: m.select_precision_suites({'THN_BROWSER_SHARD_INDEX':'0'})
except ValueError: pass
else: raise AssertionError('invalid configuration accepted')
print('PASS')
 `],{encoding:'utf8'});assert.equal(value.trim(),'PASS');
});
