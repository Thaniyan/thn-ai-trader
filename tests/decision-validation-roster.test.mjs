import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
test('Decision validation extends all42 previous suites exactly once per shard',()=>{
const output=execFileSync('python3',['-c',`
import importlib.util
s=importlib.util.spec_from_file_location('m','scripts/ci/browser_suites.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
previous=m.select_suites({})+m.select_trust_suites({})+m.select_precision_suites({})+m.select_heritage_suites({})
assert len(previous)==42
for count in [1,2,3,38]:
 flat=[]
 for index in range(count):
  e={'THN_BROWSER_SHARD_INDEX':str(index),'THN_BROWSER_SHARD_COUNT':str(count)}
  flat+=m.select_suites(e)+m.select_trust_suites(e)+m.select_precision_suites(e)+m.select_heritage_suites(e)+m.select_decision_validation_suites(e)
 assert len(flat)==len(set(flat))==43 and set(flat)==set(previous+['decision_validation'])
try: m.select_decision_validation_suites({'THN_BROWSER_SHARD_INDEX':'0'})
except ValueError: pass
else: raise AssertionError('partial configuration accepted')
print('PASS')
`],{encoding:'utf8'});assert.equal(output.trim(),'PASS');
});
