import {execFileSync, spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

// Bounded source/history guard. Never print matched secret contents.
export function forbiddenPath(name) {
  const base=path.posix.basename(name);
  return /(^|\/)(node_modules|\.vercel|\.local-staging|\.runtime|\.aws|\.ssh|backups|__pycache__)(\/|$)/i.test(name)
    || /^(broker_accounts|trading_accounts|audit_log|credentials)\.json$/i.test(base)
    || base==='AUDIT_REPORT.md' || base==='.vault_key'
    || (/^\.env(?:\.|$)/.test(base)&&!base.endsWith('.example'))
    || /\.(sqlite(?:3)?(?:-wal|-shm)?|db|key|pem|p12|pfx|crt|zip|bundle|tgz|map|bak|backup|sql|7z|rar)$/i.test(base)
    || /\.tar(?:\.gz)?$/i.test(base);
}
export function secretPattern(bytes) {
  return [
    /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/,
    /gh[pousr]_[A-Za-z0-9]{30,}/,
    /github_pat_[A-Za-z0-9_]{40,}/,
    /AKIA[0-9A-Z]{16}/,
    /sk-(?:proj-)?[A-Za-z0-9_-]{40,}/
  ].some(pattern=>pattern.test(bytes.toString('latin1')));
}
export function inspectRepository(repo, policy) {
  const git=(...args)=>execFileSync('git',['-C',repo,...args],{encoding:'utf8',maxBuffer:32*1024*1024}).trim();
  const problems=[];
  if(git('rev-parse','--is-shallow-repository')!=='false')problems.push('Shallow history cannot establish exclusions');
  for(const name of ['objects/info/alternates','info/grafts']) {
    const p=git('rev-parse','--git-path',name);
    if(fs.existsSync(path.resolve(repo,p)))problems.push('Borrowed/grafted object store forbidden');
  }
  if(git('replace','-l'))problems.push('Replacement objects forbidden');
  const roots=git('rev-list','--max-parents=0','--all').split('\n');
  if(roots.length!==1||roots[0]!==policy.root)problems.push('Unexpected root ancestry');
  if(spawnSync('git',['-C',repo,'merge-base','--is-ancestor',policy.anchor,'HEAD']).status!==0)problems.push('Reviewed sanitized anchor missing');
  for(const id of policy.excludedObjects) {
    if(spawnSync('git',['-C',repo,'cat-file','-e',id],{stdio:'ignore'}).status===0)problems.push('Excluded object physically present: '+id);
  }
  // ls-tree each commit: rev-list alone may assign only one name to reused blobs.
  const blobs=new Set();
  for(const commit of git('rev-list','--all').split('\n')) {
    const tree=execFileSync('git',['-C',repo,'ls-tree','-rz',commit],{encoding:'utf8'});
    for(const record of tree.split('\0').filter(Boolean)) {
      const [meta,name]=record.split('\t'); const [mode,type,oid]=meta.split(' ');
      if(mode!=='100644'&&mode!=='100755')problems.push('Non-regular tracked entry: '+name);
      if(forbiddenPath(name))problems.push('Forbidden historical source path: '+name);
      if(type==='blob')blobs.add(oid);
    }
  }
  for(const oid of blobs) {
    const bytes=execFileSync('git',['-C',repo,'cat-file','blob',oid],{maxBuffer:32*1024*1024});
    if(secretPattern(bytes))problems.push('Strong secret pattern in blob: '+oid);
  }
  return {commits:Number(git('rev-list','--count','--all')),blobs:blobs.size,problems:[...new Set(problems)]};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const policy=JSON.parse(fs.readFileSync(new URL('./source-policy.json',import.meta.url)));
  const report=inspectRepository(process.cwd(),policy);
  console.log(JSON.stringify(report,null,2));
  if(report.problems.length)process.exitCode=1;
}
