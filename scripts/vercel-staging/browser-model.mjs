import {startTestServer} from '../../tests/harness.mjs';import {serveModel} from './serve-model.mjs';import http from 'node:http';import crypto from 'node:crypto';
// Private fixture-only basic gate; random credential printed solely as machine-readable test bootstrap.
const artifact=process.argv[2],integrated=process.argv[3]==='connected';
let backend,gate;
const user='fixture-owner',password=crypto.randomBytes(24).toString('hex'),expected='Basic '+Buffer.from(user+':'+password).toString('base64');
if(integrated){
 gate=http.createServer((req,res)=>{if(req.headers.authorization!==expected){res.writeHead(401,{'WWW-Authenticate':'Basic realm="isolated-staging-fixture"','Cache-Control':'no-store'});res.end('Restricted');return}const p=http.request(new URL(req.url,backend.url),{method:req.method,headers:{...req.headers,host:new URL(backend.url).host}},r=>{res.writeHead(r.statusCode,r.headers);r.pipe(res)});p.on('error',()=>{res.writeHead(502);res.end()});req.pipe(p)});await new Promise(r=>gate.listen(0,'127.0.0.1',r));
}
const model=await serveModel({artifact,upstream:integrated?`http://127.0.0.1:${gate.address().port}`:undefined});
if(integrated)backend=await startTestServer({THN_PUBLIC_ORIGIN:model.url,NODE_OPTIONS:'--import='+new URL('../../deployment/vercel-staging/backend-preload.mjs',import.meta.url).href});
console.log(JSON.stringify({url:model.url,user,password,mode:integrated?'connected':'unconfigured'}));
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,async()=>{await model.stop();if(gate)await new Promise(r=>gate.close(r));if(backend)await backend.stop();process.exit()});
