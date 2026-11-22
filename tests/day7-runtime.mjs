// Synthetic protocol only: binds before the app starts; never contacts an existing model.
import http from 'node:http';
import {pilotEnv} from './pilot-fixture.mjs';
export async function day7Runtime(){
 let mode='valid',calls=0,inventory=0,notify=()=>{},encodedSettings=null,disconnected=0,closed=()=>{};
 const server=http.createServer(async(req,res)=>{let text='';for await(const c of req)text+=c;const body=text?JSON.parse(text):null;const send=x=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(x));};
  if(req.url==='/api/tags'){inventory++;return send({models:[{name:pilotEnv.THN_AI_MODEL,size:100000000,digest:(mode==='digest'?'b':'a').repeat(64)}]});}
  if(req.url==='/api/show')return send({model_info:{'general.architecture':'offline-day7-fixture'},capabilities:['completion']});
  if(req.url!=='/api/chat'){res.statusCode=404;return res.end();}calls++;encodedSettings={compact:body.think===false,keepAlive:body.keep_alive,threads:body.options.num_thread};notify();
  if(mode==='stall'){res.on('close',()=>{disconnected++;closed();});return;}
  const {evidence,roles,language}=JSON.parse(body.messages[1].content),ref=evidence.refs.find(x=>x.id==='frame-1h');
  const context=k=>body.format.properties[k]?.const??evidence[k];
  const summary=language==='ar'&&mode!=='language'?'راجع الأدلة الداعمة والمعارضة دون افتراض نتيجة.':'Review supporting and opposing evidence without assuming outcomes.';
  const value={schema:'THN-GENERATION-7.1',snapshotId:context('snapshotId'),symbol:context('symbol'),interval:context('interval'),summary,citations:evidence.refs.filter(x=>x.interval).map(x=>x.id),claims:[{reference:ref.id,field:'close',value:ref.inputs.close}],roles:context('roles')||roles,evidenceState:context('evidenceState'),uncertainties:[language==='ar'?'المشاهدات لا تثبت النتائج المستقبلية.':'Observations cannot establish future outcomes.']};
  if(mode==='claim')value.claims[0].value=-77;if(mode==='citation')value.citations=['invented'];if(mode==='context')value.snapshotId='f'.repeat(64);if(mode==='text')value.summary='Buy now for guaranteed profit.';
  send({model:pilotEnv.THN_AI_MODEL,done:mode!=='partial',message:{role:'assistant',content:mode==='json'?'{':JSON.stringify(value)}});
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(11434,'127.0.0.1',resolve);});
 return {set:v=>mode=v,stats:()=>({calls,inventory,encodedSettings,disconnected}),nextChat:()=>new Promise(resolve=>notify=resolve),nextDisconnect:()=>new Promise(resolve=>closed=resolve),stop:()=>{server.closeAllConnections();return new Promise(resolve=>server.close(resolve));}};
}
