import {readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const files=['server.js','public/app.js',...readdirSync('server').filter(f=>f.endsWith('.js')).map(f=>'server/'+f),...readdirSync('scripts').filter(f=>f.endsWith('.mjs')).map(f=>'scripts/'+f)];
for(const file of files){const result=spawnSync(process.execPath,['--check',file],{stdio:'inherit'});if(result.status)process.exit(result.status)}
console.log(`Syntax verified: ${files.length} files`);
