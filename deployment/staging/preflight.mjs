// Staging-only, read-only deployment checks. Never prints environment values.
import fs from 'node:fs';
import path from 'node:path';
const fail=reason=>{throw Error('Staging preflight: '+reason)};
const [major,minor]=process.versions.node.split('.').map(Number);
if(major!==24||minor<5)fail('Use the tested Node 24.x line, minimum 24.5');
let origin;try{origin=new URL(process.env.THN_PUBLIC_ORIGIN)}catch{fail('Public origin required')}
if(origin.protocol!=='https:'||!origin.hostname.startsWith('staging.')||origin.hostname.endsWith('.invalid')||origin.origin!==process.env.THN_PUBLIC_ORIGIN)fail('Configure an exact isolated staging HTTPS origin');
const dir=process.env.THN_DATA_DIR;
if(!dir||!path.isAbsolute(dir)||!path.basename(dir).includes('staging'))fail('Absolute dedicated staging data directory required');
if(!fs.existsSync(dir)||!fs.statSync(dir).isDirectory()||fs.statSync(dir).mode&0o077)fail('Provision private staging directory mode 0700');
if(!process.env.APP_ENCRYPTION_KEY||process.env.APP_ENCRYPTION_KEY.length<32)fail('Dedicated managed staging encryption key required');
let users=[];try{if(process.env.THN_AUTH_USERS)users=JSON.parse(process.env.THN_AUTH_USERS)}catch{fail('Authentication configuration is invalid')}
if(!Array.isArray(users)||users.some(u=>!u||typeof u.id!=='string'||!u.id||typeof u.token!=='string'||u.token.length<32))fail('Authentication configuration is invalid');
if(process.env.THN_AUTH_TOKEN&&process.env.THN_AUTH_TOKEN.length<32)fail('Dedicated strong staging authentication token required');
if(!users.length&&!process.env.THN_AUTH_TOKEN)fail('Staging authentication must be configured');
if(!['','3000'].includes(process.env.PORT||''))fail('Keep the local backend port consistent with the reviewed proxy template');
for(const filename of ['trading_accounts.json','audit_log.json','.vault_key'])if(fs.existsSync(path.join(process.cwd(),filename)))fail('Release directory contains excluded legacy data or generated key');
console.log('Staging preflight PASS. Verify external routing, isolation and key provenance separately.');
