// Local staging only: do not change the application's production listener.
import http from 'node:http';
const listen=http.Server.prototype.listen;
http.Server.prototype.listen=function(...args){
  if(typeof args[0]==='object')args[0]={...args[0],host:'127.0.0.1'};
  else if(typeof args[0]==='number'){
    if(typeof args[1]==='string')args[1]='127.0.0.1';else args.splice(1,0,'127.0.0.1');
  }else throw Error('Local staging only permits loopback TCP listeners');
  return listen.apply(this,args);
};
const emit=http.Server.prototype.emit;
http.Server.prototype.emit=function(event,...args){
  if(event==='request'&&!new URL(args[0].url,'http://localhost').pathname.startsWith('/api/')){
    args[1].writeHead(404,{'Content-Type':'text/plain','Cache-Control':'no-store'});args[1].end('API only');return true;
  }
  return emit.call(this,event,...args);
};
