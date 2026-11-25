// Filesystem-only operator boundaries; no provider or model dependency.
import fs from 'node:fs/promises';
import {constants} from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
export const fileSHA=b=>crypto.createHash('sha256').update(b).digest('hex');
async function outsideGit(real){for(let p=real;;p=path.dirname(p)){try{await fs.lstat(path.join(p,'.git'));throw Error('PRIVATE_PATH_INSIDE_GIT');}catch(e){if(e.code!=='ENOENT')throw e;}if(path.dirname(p)===p)break;}}
export async function privateFile(name,max,{immutable=true}={}){
 if(typeof name!=='string'||!path.isAbsolute(name))throw Error('ABSOLUTE_PRIVATE_FILE_REQUIRED');
 const stat=await fs.lstat(name);if(!stat.isFile()||stat.isSymbolicLink()||stat.size>max)throw Error('PRIVATE_FILE_INVALID_OR_TOO_LARGE');
 const real=await fs.realpath(name);await outsideGit(path.dirname(real));
 if(immutable&&(stat.mode&0o222)!==0)throw Error('READ_ONLY_EVIDENCE_REQUIRED');
 const handle=await fs.open(real,constants.O_RDONLY|(constants.O_NOFOLLOW||0)|(constants.O_NONBLOCK||0));let bytes=0,parts=[];
 try{const first=await handle.stat();if(!first.isFile()||first.dev!==stat.dev||first.ino!==stat.ino||first.size>max||immutable&&(first.mode&0o222)!==0)throw Error('PRIVATE_FILE_REPLACED');for(;;){const b=Buffer.alloc(Math.min(65536,max+1-bytes));const {bytesRead}=await handle.read(b);if(!bytesRead)break;bytes+=bytesRead;if(bytes>max)throw Error('PRIVATE_FILE_SIZE_LIMIT');parts.push(b.subarray(0,bytesRead));}const last=await handle.stat();if(first.size!==last.size||first.mtimeMs!==last.mtimeMs)throw Error('PRIVATE_FILE_CHANGED');}finally{await handle.close();}
 const body=Buffer.concat(parts);return {body,real,sha256:fileSHA(body)};
}
export async function privateOutputDirectory(parent){
 if(typeof parent!=='string'||!path.isAbsolute(parent))throw Error('ABSOLUTE_PRIVATE_DIRECTORY_REQUIRED');
 const real=await fs.realpath(parent),stat=await fs.stat(real);await outsideGit(real);
 if(!stat.isDirectory()||process.platform!=='win32'&&(stat.mode&0o077)!==0)throw Error('OWNER_PRIVATE_DIRECTORY_REQUIRED');
 return fs.mkdtemp(path.join(real,'p2-source-cases-'));
}
export async function writePrivateReport(directory,name,value){if(!['private-case-ledger.json','redacted-report.json'].includes(name))throw Error('OUTPUT_NAME_INVALID');const f=path.join(directory,name);await fs.writeFile(f,JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});await fs.chmod(f,0o400);}
export async function verifyUnchanged(files){for(const f of files){const now=await privateFile(f.real,f.body.length,{immutable:false});if(now.sha256!==f.sha256)throw Error('PRIVATE_INPUT_CHANGED');}}
