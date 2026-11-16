import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

test('browser CI shards cover every canonical suite once and reject incomplete or invalid configuration',()=>{
 const result=execFileSync('python3',['-c',`
import importlib.util,json
spec=importlib.util.spec_from_file_location('browser_suites','scripts/ci/browser_suites.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
all_suites=m.select_suites({})
assert len(all_suites)==len(set(all_suites))==38
for count in [1,2,3,len(all_suites)]:
    groups=[m.select_suites({'THN_BROWSER_SHARD_INDEX':str(index),'THN_BROWSER_SHARD_COUNT':str(count)}) for index in range(count)]
    flat=[suite for group in groups for suite in group]
    assert all(groups) and len(flat)==len(set(flat))==len(all_suites)
    assert set(flat)==set(all_suites)
for bad in [{'THN_BROWSER_SHARD_COUNT':'2'}, {'THN_BROWSER_SHARD_INDEX':'0'}, {'THN_BROWSER_SHARD_INDEX':'2','THN_BROWSER_SHARD_COUNT':'2'}, {'THN_BROWSER_SHARD_INDEX':'-1','THN_BROWSER_SHARD_COUNT':'2'}, {'THN_BROWSER_SHARD_INDEX':'0','THN_BROWSER_SHARD_COUNT':'0'}, {'THN_BROWSER_SHARD_INDEX':'0','THN_BROWSER_SHARD_COUNT':'39'}, {'THN_BROWSER_SHARD_INDEX':'x','THN_BROWSER_SHARD_COUNT':'2'}]:
    try: m.select_suites(bad)
    except ValueError: pass
    else: raise AssertionError(bad)
print(json.dumps(all_suites))
`],{encoding:'utf8'});
 const suites=JSON.parse(result);
 for(const required of ['confidence','workspace_hierarchy','unified_workspace','research_studio','responsive_fonts','command_center','command_workbench','institutional_desk'])assert.ok(suites.includes(required));
});
