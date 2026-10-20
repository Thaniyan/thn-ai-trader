import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const output=path.join(root,'.vercel/output');
// Build Output API v3. No provider SDK, environment file, runtime data or old artifact imported.
fs.rmSync(output,{recursive:true,force:true});
const fn=path.join(output,'functions/index.func');fs.mkdirSync(fn,{recursive:true});
const files=['server.js','package.json'];
for(const dir of ['server','public'])for(const ent of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){
 if(!ent.isFile()||ent.isSymbolicLink())throw Error('Unexpected runtime entry: '+dir+'/'+ent.name);
 files.push(dir+'/'+ent.name);
}
const manifest=[];
for(const name of files.sort()){
 if(!/^(server\.js|package\.json|server\/[\w.-]+\.js|public\/[\w.-]+\.(?:js|css|html|png|svg|json))$/.test(name))throw Error('Non-runtime file: '+name);
 const data=fs.readFileSync(path.join(root,name));const target=path.join(fn,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,data);
 manifest.push({path:name,sha256:crypto.createHash('sha256').update(data).digest('hex')});
}
fs.writeFileSync(path.join(fn,'index.mjs'),`import server from './server.js';
export default function handler(req,res){server.emit('request',req,res);}
`);
// Preserve raw Node request streams; the application owns JSON/body limits.
fs.writeFileSync(path.join(fn,'.vc-config.json'),JSON.stringify({runtime:'nodejs24.x',handler:'index.mjs',launcherType:'Nodejs',shouldAddHelpers:false}));
fs.writeFileSync(path.join(output,'config.json'),JSON.stringify({version:3,routes:[{src:'/(.*)',dest:'/index'}]},null,2)+'\n');
fs.writeFileSync(path.join(output,'runtime-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
const artifact=[];
function inventory(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const file=path.join(dir,item.name);if(item.isDirectory())inventory(file);else artifact.push({path:path.relative(output,file).split(path.sep).join('/'),sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')});}}
inventory(output);
const bytes=JSON.stringify(artifact,null,2)+'\n';
fs.writeFileSync(path.join(output,'artifact-manifest.json'),bytes);
console.log(JSON.stringify({output,runtimeFiles:manifest.length,artifactFiles:artifact.length,manifestSHA256:crypto.createHash('sha256').update(bytes).digest('hex')}));
