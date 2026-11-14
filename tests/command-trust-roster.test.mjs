import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
test('new trust suites extend the complete original browser gate exactly once per shard',()=>{
 const result=execFileSync('python3',['-c',`
import importlib.util,json
spec=importlib.util.spec_from_file_location('browser_suites','scripts/ci/browser_suites.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
original=m.select_suites({})
assert len(original)==len(set(original))==38
additional=m.select_trust_suites({})
assert additional==['command_trust','command_trust_candidate']
assert not set(original).intersection(additional)
for count in [1,2,3,len(original)]:
    flat=[]
    for index in range(count):
        env={'THN_BROWSER_SHARD_INDEX':str(index),'THN_BROWSER_SHARD_COUNT':str(count)}
        flat+=m.select_suites(env)+m.select_trust_suites(env)
    assert len(flat)==len(set(flat))==40
    assert set(flat)==set(original+additional)
for bad in [{'THN_BROWSER_SHARD_INDEX':'0'},{'THN_BROWSER_SHARD_INDEX':'2','THN_BROWSER_SHARD_COUNT':'2'}]:
    try: m.select_trust_suites(bad)
    except ValueError: pass
    else: raise AssertionError(bad)
print(json.dumps(original+additional))
 `],{encoding:'utf8'});
 assert.equal(JSON.parse(result).length,40);
});
