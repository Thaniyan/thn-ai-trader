import {test} from 'node:test';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
test('configuration boundary permits representation only; source bytes and all assets stay verified',()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'thn-integrity-')),out=path.join(temp,'artifact');
 try{
  const built=spawnSync(process.execPath,['deployment/vercel-staging/build.mjs','--output',out],{encoding:'utf8'});assert.equal(built.status,0,built.stderr);
  const run=(args=[])=>spawnSync(process.execPath,['verify-build.mjs',...args],{cwd:out,encoding:'utf8',env:{...process.env,THN_LOCAL_BUILD_TEST:'1'}});
  assert.equal(run(['--source']).status,0);
  const original=fs.readFileSync(path.join(out,'vercel.json')),cfg=JSON.parse(original);
  const normalized=Object.fromEntries(Object.entries(cfg).reverse());
  fs.writeFileSync(path.join(out,'vercel.json'),JSON.stringify(normalized));
  assert.equal(run().status,0);assert.notEqual(run(['--source']).status,0);
  for(const mutate of [c=>c.git.deploymentEnabled=true,c=>c.headers[0].headers[0].value="default-src *",c=>c.headers[1].headers=[],c=>c.rewrites[0].destination='https://example.com/api',c=>c.functions={'api/**':{}},c=>c.outputDirectory='.',c=>delete c.git,c=>c.buildCommand='echo bypass']){
   const changed=structuredClone(cfg);mutate(changed);fs.writeFileSync(path.join(out,'vercel.json'),JSON.stringify(changed));assert.notEqual(run().status,0);
  }
  fs.writeFileSync(path.join(out,'vercel.json'),original);
  const manifest=JSON.parse(fs.readFileSync(path.join(out,'manifest.json')));
  for(const name of Object.keys(manifest.sha256)){
   const file=path.join(out,name),bytes=fs.readFileSync(file);fs.appendFileSync(file,'\nTAMPER');assert.notEqual(run().status,0,`Undetected tamper: ${name}`);fs.writeFileSync(file,bytes);
  }
  fs.writeFileSync(path.join(out,'public/unexpected.txt'),'runtime artifact');assert.notEqual(run().status,0);fs.unlinkSync(path.join(out,'public/unexpected.txt'));
  assert.equal(run().status,0);
 }finally{fs.rmSync(temp,{recursive:true,force:true})}
});

test('confirmed hosted project-name injection passes; wrong identity and all other configuration changes fail',()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'thn-hosted-name-')),out=path.join(temp,'artifact');
 try{
  const built=spawnSync(process.execPath,['deployment/vercel-staging/build.mjs','--output',out],{encoding:'utf8'});assert.equal(built.status,0,built.stderr);
  const run=(args=[])=>spawnSync(process.execPath,['verify-build.mjs',...args],{cwd:out,encoding:'utf8',env:{...process.env,THN_LOCAL_BUILD_TEST:'1'}});
  const configFile=path.join(out,'vercel.json'),sourceFile=path.join(out,'vercel.source.json');
  const original=fs.readFileSync(configFile),sourceBytes=fs.readFileSync(sourceFile),cfg=JSON.parse(original);
  assert.equal(run(['--source']).status,0,'Unmodified local source must pass');
  const hosted={...cfg,name:'thn-ai-trader-staging-frontend'};
  const hostedBytes=JSON.stringify(hosted)+'\n';
  // Exact bytes reproduce the original hosted SHA, not just its semantics.
  assert.equal(createHash('sha256').update(hostedBytes).digest('hex'),'1962e12f7487a565b7e7afcc8533a43c4933157e10b92c830f71b1ce307da0b7');
  fs.writeFileSync(configFile,hostedBytes);
  // Reproduces exactly the reported semantic difference: one injected name.
  assert.deepEqual(Object.keys(hosted).filter(key=>!Object.hasOwn(cfg,key)),['name']);
  const passed=run();assert.equal(passed.status,0,passed.stderr);
  assert.notEqual(run(['--source']).status,0,'Upload verification must still reject changed source bytes');
  assert.deepEqual(fs.readFileSync(sourceFile),sourceBytes,'Source snapshot must remain unchanged');
  const cases=[
   ['wrong name',c=>c.name='thn-ai-trader'],
   ['empty name',c=>c.name=''],
   ['null name',c=>c.name=null],
   ['non-string name',c=>c.name={value:'thn-ai-trader-staging-frontend'}],
   ['unknown property',c=>c.unapproved=true],
   ['nested unknown property',c=>c.git.name='thn-ai-trader-staging-frontend'],
   ['modified CSP',c=>c.headers[0].headers[0].value="default-src *"],
   ['altered rewrites',c=>c.rewrites[0].destination='https://example.com/api'],
   ['changed caching',c=>c.headers[0].headers.find(h=>h.key==='Cache-Control').value='public, max-age=3600'],
   ['enabled Git deployments',c=>c.git.deploymentEnabled=true],
   ['missing expected setting',c=>delete c.headers],
   ['changed build',c=>c.buildCommand='echo bypass'],
   ['changed output',c=>c.outputDirectory='.'],
  ];
  for(const [label,mutate] of cases){const changed=structuredClone(hosted);mutate(changed);fs.writeFileSync(configFile,JSON.stringify(changed));assert.notEqual(run().status,0,label)}
  fs.writeFileSync(configFile,JSON.stringify(hosted));
  fs.unlinkSync(sourceFile);assert.notEqual(run().status,0,'Missing expected snapshot must fail');
  fs.writeFileSync(sourceFile,'{}');assert.notEqual(run().status,0,'Incorrect snapshot must fail');
  fs.writeFileSync(sourceFile,sourceBytes);
  assert.equal(run().status,0,'Hosted input must pass after restoring the exact snapshot');
 }finally{fs.rmSync(temp,{recursive:true,force:true})}
});
