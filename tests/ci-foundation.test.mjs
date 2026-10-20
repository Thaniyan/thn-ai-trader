import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {forbiddenPath,secretPattern,inspectRepository} from '../scripts/ci/source-guard.mjs';
import {evaluateAudit} from '../scripts/ci/dependency-audit.mjs';

test('dependency policy blocks high/critical and unavailable audits without blocking advisory-only low findings',()=>{
  assert.equal(evaluateAudit({},0).blocking,false);
  assert.equal(evaluateAudit({pkg:[{severity:'high'}]},1).blocking,true);
  assert.equal(evaluateAudit({pkg:[{severity:'low'}]},1).blocking,false);
  for(const [report,status] of [[{},1],[{},2],[{error:'offline'},0],[{pkg:[{severity:'unknown'}]},1]])assert.throws(()=>evaluateAudit(report,status));
});

test('source guard rejects runtime material while permitting inert templates and fixture source',()=>{
  for(const p of ['.env','.env.production','nested/state.sqlite-wal','data/broker_accounts.json','x/archive.bundle','.vercel/project.json','a/cert.pem','public/app.js.map'])assert.ok(forbiddenPath(p),p);
  for(const p of ['.env.example','deployment/staging.env.example','tests/fixtures/providers.mjs','.github/workflows/ci.yml'])assert.equal(forbiddenPath(p),false,p);
  assert.ok(secretPattern(Buffer.from('ghp_'+'x'.repeat(36))));
  assert.ok(secretPattern(Buffer.from('-----BEGIN '+'PRIVATE KEY-----')));
  assert.equal(secretPattern(Buffer.from('test-only-operator-token')),false);
});
test('history guard detects deleted artifacts, unrelated roots and physically excluded objects',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'thn-ci-guard-'));
  const git=(...args)=>execFileSync('git',['-C',dir,...args],{encoding:'utf8'}).trim();
  try {
    git('init','-q');git('config','user.name','CI fixture');git('config','user.email','fixture@example.invalid');
    fs.writeFileSync(path.join(dir,'README.md'),'synthetic fixture');git('add','.');git('commit','-qm','root');
    const root=git('rev-parse','HEAD'),policy={anchor:root,root,excludedObjects:[]};
    assert.deepEqual(inspectRepository(dir,policy).problems,[]);
    fs.writeFileSync(path.join(dir,'.env'),'fixture-only');git('add','.env');git('commit','-qm','bad artifact');
    fs.unlinkSync(path.join(dir,'.env'));git('add','-u');git('commit','-qm','remove artifact');
    assert.ok(inspectRepository(dir,policy).problems.some(p=>p.includes('Forbidden historical')));
    assert.ok(inspectRepository(dir,{...policy,excludedObjects:[root]}).problems.some(p=>p.includes('physically present')));
    git('checkout','--orphan','other');git('rm','-rf','.');fs.writeFileSync(path.join(dir,'OTHER'),'fixture');git('add','.');git('commit','-qm','unrelated');
    assert.ok(inspectRepository(dir,policy).problems.some(p=>p.includes('Unexpected root')));
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
