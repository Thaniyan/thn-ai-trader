// Loopback-only local model of reviewed Vercel headers/static/external rewrite semantics.
// Not a Vercel emulator or proof of deployed edge behavior. Never deploy this process.
import http from 'node:http';import fs from 'node:fs';import path from 'node:path';
export async function serveModel({artifact,upstream,port=0}){
 if(upstream){const u=new URL(upstream);if(u.protocol!=='http:'||u.hostname!=='127.0.0.1')throw Error('Fixture upstream must be loopback HTTP')}
 const cfg=JSON.parse(fs.readFileSync(path.join(artifact,'vercel.json')));
 const server=http.createServer((req,res)=>{
  for(const rule of cfg.headers)if(rule.source==='/:path*'||req.url.startsWith('/api/'))for(const h of rule.headers)res.setHeader(h.key,h.value);
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/api'||url.pathname.startsWith('/api/')){
   if(upstream&&cfg.rewrites[0].destination.startsWith('https://')){
    const target=new URL(req.url,upstream);const proxy=http.request(target,{method:req.method,headers:{...req.headers,host:target.host}},response=>{res.statusCode=response.statusCode;for(const [name,value]of Object.entries(response.headers))if(!['connection','transfer-encoding','content-length'].includes(name))res.setHeader(name,value);response.pipe(res)});
    proxy.on('error',()=>{res.writeHead(502,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:false,code:'MODEL_UPSTREAM_UNAVAILABLE'}))});req.pipe(proxy);return;
   }
   const data=fs.readFileSync(path.join(artifact,'public/staging-api-unavailable.json'));res.writeHead(req.method==='GET'?200:405,{'Content-Type':'application/json'});res.end(data);return;
  }
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return}
  let decoded;try{decoded=decodeURIComponent(url.pathname)}catch{res.writeHead(400);res.end();return}
  const file=path.resolve(artifact,'public','.'+(decoded==='/'?'/index.html':decoded));const prefix=path.resolve(artifact,'public')+path.sep;
  if(!file.startsWith(prefix)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end('Not found');return}
  const types={'.html':'text/html; charset=utf-8','.js':'application/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png'};res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(req.method==='HEAD'?'':fs.readFileSync(file));
 });
 await new Promise(resolve=>server.listen(port,'127.0.0.1',resolve));return {server,url:`http://127.0.0.1:${server.address().port}`,stop:()=>new Promise(resolve=>{server.close(resolve);server.closeAllConnections()})};
}
