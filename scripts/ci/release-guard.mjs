import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {forbiddenPath,secretPattern} from './source-guard.mjs';
const base='ddd13c298103d93ced74fdb8bbf8c43f4579369c';
const git=(...a)=>execFileSync('git',a,{encoding:'utf8',maxBuffer:32*1024*1024}).trim();
git('merge-base','--is-ancestor',base,'HEAD');
if(git('rev-parse','--is-shallow-repository')!=='false')throw Error('Complete tested ancestry required');
for(const name of ['objects/info/alternates','info/grafts'])if(fs.existsSync(git('rev-parse','--git-path',name)))throw Error('Borrowed or grafted ancestry forbidden');
if(git('replace','-l'))throw Error('Replacement ancestry forbidden');
if(git('rev-list','--merges',base+'..HEAD'))throw Error('Unreviewed merge ancestry');
const problems=[];
for(const file of git('ls-files','-c','-o','--exclude-standard').split('\n').filter(Boolean)) {
 if(!fs.existsSync(file))continue;
 if(forbiddenPath(file)||file==='metadata.json'||!fs.lstatSync(file).isFile())problems.push('Forbidden source: '+file);
 else if(secretPattern(fs.readFileSync(file)))problems.push('Secret marker in source: '+file);
}
// Existing canonical history must be preserved. Scan ALL newly introduced blobs,
// including deleted post-baseline files; never grandfather newly added artifacts.
for(const line of git('rev-list','--objects',base+'..HEAD').split('\n').filter(Boolean)){
 const [id,...names]=line.split(' ');if(git('cat-file','-t',id)!=='blob')continue;
 if(forbiddenPath(names.join(' '))||secretPattern(execFileSync('git',['cat-file','blob',id])))problems.push('Unsafe added object: '+id);
}
for(const file of ['server/research.js','server/backtest.js','server/evaluation.js','server/decision.js','server/replay.js','public/research-chart.js'])if(!fs.readFileSync(file).equals(execFileSync('git',['show',base+':'+file])))problems.push('Numerical baseline changed: '+file);
console.log(JSON.stringify({base,policy:'canonical descendant; current and added source exclusions; numerical parity',problems},null,2));
if(problems.length)process.exitCode=1;
