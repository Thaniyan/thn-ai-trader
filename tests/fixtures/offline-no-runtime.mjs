// Fail before any network, model worker or subprocess operation in the offline
// measurement child. Module/code loading itself remains ordinary Node I/O.
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import tls from 'node:tls';
import child from 'node:child_process';
import threads from 'node:worker_threads';
import {syncBuiltinESMExports} from 'node:module';
const deny=()=>{throw Error('Offline measurement attempted a forbidden runtime operation');};
http.request=http.get=https.request=https.get=deny;
net.connect=net.createConnection=net.Socket.prototype.connect=tls.connect=deny;
for(const key of ['spawn','spawnSync','exec','execSync','execFile','execFileSync','fork'])child[key]=deny;
threads.Worker=class{constructor(){deny();}};
globalThis.fetch=deny;syncBuiltinESMExports();
