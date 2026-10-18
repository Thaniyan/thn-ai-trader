// Selected only by the dedicated staging unit; no production application change.
import http from 'node:http';
const originalListen=http.Server.prototype.listen,originalEmit=http.Server.prototype.emit;
http.Server.prototype.listen=function(port,host,...rest){if(typeof port!=='number')throw Error('Staging loopback TCP required');return originalListen.call(this,port,'127.0.0.1',...rest)};
http.Server.prototype.emit=function(event,...args){
 if(event==='request'){
  const [req,res]=args;const pathname=new URL(req.url,'http://localhost').pathname;
  if(pathname==='/api/staging-contract'){
   if(req.method!=='GET'){res.writeHead(405,{'Cache-Control':'no-store'});res.end();return true}
   res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'private, no-store','CDN-Cache-Control':'no-store','Vercel-CDN-Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
   res.end(JSON.stringify({ok:true,contractVersion:1,backend:'persistent-node-sqlite',frontendOrigin:process.env.THN_PUBLIC_ORIGIN,liveExecutionEnabled:false}));return true;
  }
 }
 return originalEmit.call(this,event,...args);
};
