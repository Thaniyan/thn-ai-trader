import fs from 'node:fs';
import path from 'node:path';
import {createPrivateKey} from 'node:crypto';
import {createExnessReadOnly} from '../server/exness-readonly.js';

// No HTTP listener, browser password field, credential persistence or mutation API.
// Credentials must be provisioned by the operator outside the repository.
try{
 if(process.argv.length!==2)throw Error('EXNESS_ARGUMENTS_REJECTED');
 if(['VERCEL','AWS_LAMBDA_FUNCTION_NAME','NETLIFY','K_SERVICE','CF_PAGES'].some(k=>Boolean(process.env[k]))||process.env.THN_EXNESS_READONLY!=='1')throw Error('EXNESS_LOCAL_OPT_IN_REQUIRED');
 const filename=process.env.EXN_PRIVATE_KEY_FILE;if(!filename||!path.isAbsolute(filename))throw Error('EXNESS_PRIVATE_FILE_REQUIRED');
 const root=fs.realpathSync(new URL('..',import.meta.url)),file=fs.realpathSync(filename),stat=fs.lstatSync(filename);
 if(stat.isSymbolicLink()||!stat.isFile()||stat.size>16384||stat.size===0||file===root||file.startsWith(root+path.sep)||(stat.mode&0o077)!==0||(process.getuid&&stat.uid!==process.getuid()))throw Error('EXNESS_PRIVATE_FILE_UNSAFE');
 // Open without following a last-moment symlink and verify the opened inode.
 const fd=fs.openSync(filename,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);let privateKey;
 try{const actual=fs.fstatSync(fd);if(actual.dev!==stat.dev||actual.ino!==stat.ino||actual.size>16384||(actual.mode&0o077)!==0)throw Error('EXNESS_PRIVATE_FILE_UNSAFE');privateKey=createPrivateKey(fs.readFileSync(fd));}finally{fs.closeSync(fd);}
 const client=createExnessReadOnly({accountId:process.env.EXN_ACCOUNT_ID,apiKey:process.env.EXN_API_KEY,origin:process.env.EXN_ACCOUNT_ACCESS_POINT,privateKey});
 const result=await client.inspect();
 // Deliberately do not dump balances, account number, key IDs, request headers or upstream bodies.
 console.log(JSON.stringify({ok:true,provider:result.provider,mode:result.mode,currency:result.currency,receivedAt:result.receivedAt,providerAsOf:result.providerAsOf,freshness:result.freshness,balanceReceived:typeof result.balance==='string',equityReceived:typeof result.equity==='string',usedMarginReceived:typeof result.usedMargin==='string',freeMarginAvailable:false,executionEnabled:false,websiteConnected:false}));
}catch(error){
 const code=/^EXNESS_[A-Z_]+$/.test(error?.code||error?.message||'')?(error.code||error.message):'EXNESS_CONFIGURATION_OR_PROVIDER_FAILURE';
 console.error(JSON.stringify({ok:false,code,executionEnabled:false,websiteConnected:false}));process.exitCode=1;
}
