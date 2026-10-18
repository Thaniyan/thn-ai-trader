import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

test('root Git policy disables only develop without adding build, route or credential configuration',()=>{
  const config=JSON.parse(fs.readFileSync('vercel.json','utf8'));
  assert.deepEqual(config,{
    $schema:'https://openapi.vercel.sh/vercel.json',
    git:{deploymentEnabled:{develop:false,main:true}}
  });
  // No overlapping wildcard true, global false or alternate config can silently
  // replace the intended literal policy. This is not a Vercel service emulator.
  for(const name of ['vercel.ts','vercel.js','vercel.mjs','vercel.cjs','vercel.mts','vercel.toml'])assert.equal(fs.existsSync(name),false,name);
});

test('only root deployment policy is unignored; private links and generated configs stay excluded',()=>{
  const ignored=name=>spawnSync('git',['check-ignore','--no-index','--quiet',name]).status;
  assert.equal(ignored('vercel.json'),1);
  for(const name of ['.vercel/project.json','generated/vercel.json','.env','credentials.json','state.sqlite'])assert.equal(ignored(name),0,name);
});
