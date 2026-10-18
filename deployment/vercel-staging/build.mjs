// Local source-only generation. No Vercel account, deployment, backend or remote Git operation.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {execFileSync} from 'node:child_process';import crypto from 'node:crypto';
import {backendOrigin,config} from './policy.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(here,'../..');
const args=process.argv.slice(2),get=key=>{const i=args.indexOf(key);return i<0?undefined:args[i+1]};
if(args.some((v,i)=>i%2===0&&!['--output','--backend'].includes(v))||args.length%2)throw Error('Usage: node build.mjs --output /absolute/new-artifact [--backend https://approved-staging-backend-host]');
const out=get('--output');if(!out||!path.isAbsolute(out)||fs.existsSync(out))throw Error('Choose a new absolute output directory outside the repository');
if(path.resolve(out).startsWith(repo+path.sep))throw Error('Artifact must be outside the Git checkout');
const backend=get('--backend')?backendOrigin(get('--backend')):null;
const version=process.versions.node.split('.').map(Number);if(version[0]!==24||version[1]<5)throw Error('Node 24.x >=24.5 required');
fs.mkdirSync(out,{recursive:true,mode:0o700});const pub=path.join(out,'public');fs.mkdirSync(pub);
for(const name of ['app.js','style.css','logo.svg','d3.min.js','brand-preview.png'])fs.copyFileSync(path.join(repo,'public',name),path.join(pub,name));
let body=fs.readFileSync(path.join(repo,'public/index.html'),'utf8').match(/<body>([\s\S]*)<\/body>/)[1].replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
// Workstation markup is inert until the persistent backend contract is verified.
const shell=fs.readFileSync(path.join(here,'shell.html'),'utf8').replace('<!--WORKSTATION-->',body);
fs.writeFileSync(path.join(pub,'index.html'),shell);
for(const name of ['boot.js','staging.css'])fs.copyFileSync(path.join(here,name),path.join(pub,name));
fs.writeFileSync(path.join(pub,'staging-config.json'),JSON.stringify({mode:backend?'connected':'unconfigured',contractVersion:1})+'\n');
fs.writeFileSync(path.join(pub,'staging-api-unavailable.json'),JSON.stringify({ok:false,code:'STAGING_BACKEND_UNCONFIGURED',error:'Persistent staging backend is not configured. No authentication, market data, analysis or execution is available.',liveExecutionEnabled:false})+'\n');
fs.writeFileSync(path.join(out,'vercel.json'),JSON.stringify(config(backend),null,2)+'\n');
fs.copyFileSync(path.join(out,'vercel.json'),path.join(out,'vercel.source.json'));
fs.copyFileSync(path.join(here,'policy.mjs'),path.join(out,'policy.mjs'));
fs.writeFileSync(path.join(out,'package.json'),JSON.stringify({name:'thn-ai-trader-staging-frontend',private:true,version:'1.0.0',engines:{node:'24.x'},scripts:{build:'node verify-build.mjs'}} ,null,2)+'\n');
fs.copyFileSync(path.join(here,'verify-build.mjs'),path.join(out,'verify-build.mjs'));
const files={};for(const name of fs.readdirSync(pub).sort())files['public/'+name]=crypto.createHash('sha256').update(fs.readFileSync(path.join(pub,name))).digest('hex');
for(const name of ['vercel.source.json','policy.mjs','package.json','verify-build.mjs'])files[name]=crypto.createHash('sha256').update(fs.readFileSync(path.join(out,name))).digest('hex');
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({purpose:'STAGING_FRONTEND_ONLY_UNDEPLOYED',sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim(),sourceTreeClean:execFileSync('git',['status','--porcelain','--untracked-files=all'],{cwd:repo,encoding:'utf8'}).trim()==='',mode:backend?'connected':'unconfigured',backend,sha256:files},null,2)+'\n');
console.log(JSON.stringify({artifact:out,mode:backend?'connected':'unconfigured',backendConfigured:Boolean(backend),automaticGitDeployments:false,serverlessFunctions:0}));
