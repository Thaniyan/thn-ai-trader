// Source bytes are immutable; the platform-consumed configuration must retain
// the same JSON settings, except the exact validated platform project name.
// No VERCEL environment-variable bypass.
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {backendOrigin,config} from './policy.mjs';
const digest=name=>crypto.createHash('sha256').update(fs.readFileSync(name)).digest('hex');
assert.ok(process.argv.slice(2).every(arg=>arg==='--source'),'Unknown verifier option');
const manifest=JSON.parse(fs.readFileSync('manifest.json'));
assert.equal(manifest.purpose,'STAGING_FRONTEND_ONLY_UNDEPLOYED');
assert.ok(manifest.sourceTreeClean===true||process.env.THN_LOCAL_BUILD_TEST==='1','Dirty development artifact is not approved for deployment');
const files=fs.readdirSync('.').filter(n=>!['public','manifest.json','vercel.json','.vercel','node_modules'].includes(n)).concat(fs.readdirSync('public').map(n=>'public/'+n)).sort();
assert.deepEqual(files,Object.keys(manifest.sha256).sort());
for(const name of ['public','manifest.json','vercel.json',...files]){
 assert.ok(!fs.lstatSync(name).isSymbolicLink(),`Symlink forbidden: ${name}`);
 if(name!=='public')assert.ok(fs.lstatSync(name).isFile(),`Regular file required: ${name}`);
}
for(const [name,hash] of Object.entries(manifest.sha256)){
 assert.match(hash,/^[a-f0-9]{64}$/);
 assert.equal(digest(name),hash,`SHA-256 mismatch: ${name}`);
}
const source=JSON.parse(fs.readFileSync('vercel.source.json'));
const cfg=JSON.parse(fs.readFileSync('vercel.json'));
const backend=manifest.backend===null?null:backendOrigin(manifest.backend);
assert.equal(manifest.mode,backend?'connected':'unconfigured');
assert.deepEqual(source,config(backend),'Source configuration differs from staging security policy');
// Vercel injects this top-level project identity into the effective config.
// Validate before omitting only that field; never mutate the hashed source.
const comparison=structuredClone(cfg);
if(Object.hasOwn(comparison,'name')){
 assert.equal(comparison.name,'thn-ai-trader-staging-frontend','Unexpected Vercel project name');
 delete comparison.name;
}
// All remaining fields, including unknown properties and every security setting,
// must match. Object-key order and JSON whitespace have no semantic effect.
assert.deepStrictEqual(comparison,source,'Platform configuration changed staging settings');
if(process.argv.includes('--source'))assert.equal(digest('vercel.json'),manifest.sha256['vercel.source.json'],'Source configuration bytes changed');
const pkg=JSON.parse(fs.readFileSync('package.json'));
assert.equal(pkg.engines.node,'24.x');
for(const name of ['api','server.js','state.sqlite'])assert.ok(!fs.existsSync(name));
const [major,minor]=process.versions.node.split('.').map(Number);assert.ok(major===24&&minor>=5);
console.log('Static staging build PASS: SHA-256 assets/source, exact configuration settings, Node24, no serverless backend or runtime data');
