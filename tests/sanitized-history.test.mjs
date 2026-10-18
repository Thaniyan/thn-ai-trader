import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import fs from 'node:fs';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
// Object IDs identify excluded history, never secret values. Every original ref
// remains in the protected source checkout, outside this publication candidate.
const excludedObjects=[
 '8ca2b232ba1dc94d1fd2d73ad13debfecd792ffe',
 '08152faae47f8efdd776464ebac5abd36b2164e8','6b4b1395c5c14016b41e9767843663db61cc380f',
 '0a45e66596cd97c87d62252afc6c2649f90470df','f9f819cfcb8353d3657ae6857f78661fc90fcc1e',
 '324da3d5104959e8732662389ddf38fbc3b073ec','fe593de51464869035adcb1abc23d88cb3efdac9',
 '02f7aef4dec30b447391c5c8c254ee10b2c071d8','bf214b9a0297ab29569232921db080a4db03b48d',
 '45d515f8788218c40721b5e534f6339af6ed274b'
];
test('publication refs have no reachable legacy records, sensitive blobs or original ancestry',()=>{
 const objects=git('rev-list','--objects','--all').split('\n');
 const ids=new Set(objects.map(line=>line.split(' ')[0]));
 for(const id of excludedObjects)assert.equal(ids.has(id),false,'Excluded sensitive object is reachable');
 for(const id of ['3b641fcfac6f4e0f326a0f056529620a2419616d','50857dfc1e45a901515b56ffe2ed914d897671af'])assert.equal(ids.has(id),false,'Unsanitized ancestor is reachable');
 for(const line of objects)assert.equal(/ (?:.*\/)?(?:broker_accounts\.json|trading_accounts\.json|audit_log\.json|AUDIT_REPORT\.md)$/.test(line),false,'Legacy data path in reachable history');
 assert.equal(fs.existsSync('.git/objects/info/alternates'),false,'No borrowed unsanitized object store');
 assert.equal(git('rev-list','--max-parents=0','--all').split('\n').length,1);
});
test('broker account inputs are blank and connect handler has no credential fallback',()=>{
 const html=fs.readFileSync('public/index.html','utf8'),app=fs.readFileSync('public/app.js','utf8');
 for(const id of ['brokerAccountIdInput','docExnessAccountInput','docXtbAccountInput','docMt5AccountInput'])assert.ok(new RegExp('<input id="'+id+'" value="" placeholder="Enter your account ID"').test(html),'Account input must be blank: '+id);
 assert.ok(/const token = \$\("brokerPasswordInput"\)\?\.value\?\.trim\(\) \|\| "";/.test(app),"No password fallback permitted");
 assert.ok(/const accId = \$\("brokerAccountIdInput"\)\?\.value\?\.trim\(\) \|\| "";/.test(app),"No account fallback permitted");
 for(const id of excludedObjects)assert.notEqual(spawnSync('git',['cat-file','-e',id]).status,0,'Sensitive blob should not even exist in independent candidate');
});
