import fs from 'node:fs';
import path from 'node:path';
import {DatabaseSync,backup} from 'node:sqlite';
const dir=process.env.THN_DATA_DIR,destination=process.argv[2];
if(!dir||!destination)throw Error('Usage: THN_DATA_DIR=/private/data node scripts/backup-sqlite.mjs /private/backup.sqlite');
if(fs.existsSync(destination))throw Error('Backup destination already exists');
fs.mkdirSync(path.dirname(path.resolve(destination)),{recursive:true,mode:0o700});
// Precreate privately, avoiding a window where a snapshot is world-readable.
fs.closeSync(fs.openSync(destination,'wx',0o600));
const db=new DatabaseSync(path.join(dir,'state.sqlite'),{readOnly:true});
try{await backup(db,destination);const snapshot=new DatabaseSync(destination,{readOnly:true});try{if(snapshot.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')throw Error('Snapshot integrity check failed')}finally{snapshot.close()};console.log('Consistent SQLite snapshot completed; separately preserve the matching encryption key.')}finally{db.close()}
