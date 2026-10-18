/* Staging-only bootstrap. Availability gating is not authentication or deployment protection. */
(()=>{
 const byId=id=>document.getElementById(id),transport=window.fetch.bind(window);
 const text={en:{pages:['Dashboard','Markets','Trading Terminal','AI Intelligence','Risk Desk','Portfolio','Trade Journal','Broker Accounts','Settings'],label:'Frontend review · paper only · live execution disabled',unavailable:'Backend unavailable. No accounts, market prices, signals, AI results or execution are available.',explanation:'Navigation, language and layout review work. Trading features require a separately approved persistent backend.',access:'This interface is not an access-control layer. Deployment protection must be verified before exposure.',retry:'Check backend',gate:'Open backend access check',checking:'Checking the persistent staging backend…',auth:'Backend access is restricted. Complete the independent backend access check, then retry. No application session has been created.',mismatch:'Backend contract or exact frontend HTTPS origin is not approved. Account and trading features remain unavailable.',capabilities:['Available: page navigation, English/Arabic, responsive layout.','Unavailable until verified: accounts, quotes, analysis, AI, paper orders and execution.']},ar:{pages:['لوحة القيادة','الأسواق','منصة التداول','الذكاء الاصطناعي','إدارة المخاطر','المحفظة','سجل التداول','حسابات الوسيط','الإعدادات'],label:'مراجعة الواجهة · تداول تجريبي فقط · التنفيذ الحقيقي معطّل',unavailable:'الخادم الخلفي غير متاح. لا تتوفر حسابات أو أسعار سوق أو إشارات أو نتائج ذكاء اصطناعي أو تنفيذ.',explanation:'يعمل التنقل واللغات ومراجعة التخطيط. تتطلب ميزات التداول خادماً دائماً مستقلاً ومعتمداً.',access:'هذه الواجهة ليست طبقة حماية وصول. يجب التحقق من حماية النشر قبل إتاحتها.',retry:'فحص الخادم',gate:'فتح فحص الوصول إلى الخادم',checking:'جارٍ فحص خادم بيئة الاختبار الدائم…',auth:'الوصول إلى الخادم مقيّد. أكمل فحص الوصول المستقل ثم أعد المحاولة. لم يتم إنشاء جلسة حساب.',mismatch:'عقد الخادم أو عنوان HTTPS الدقيق للواجهة غير معتمد. تظل الحسابات وميزات التداول غير متاحة.',capabilities:['المتاح: التنقل بين الصفحات واللغتان العربية والإنجليزية والتخطيط المتجاوب.','غير المتاح حتى التحقق: الحسابات والأسعار والتحليل والذكاء الاصطناعي والأوامر والتنفيذ التجريبي.']}};
 const views=['dashboard','markets','trading','ai','risk','portfolio','journal','brokers','settings'];
 let lang='en',view=0,state='unavailable',ready=false,mounted=false,scriptsLoaded=false,probing=false,configuration=null;
 function render(){const t=text[lang];document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';byId('stagingLabel').textContent=t.label;byId('stagingPageTitle').textContent=t.pages[view];byId('stagingState').textContent=t[state]||t.unavailable;byId('stagingExplanation').textContent=t.explanation;byId('stagingAccessNotice').textContent=t.access;byId('stagingRetry').textContent=t.retry;byId('stagingRetry').disabled=probing;byId('stagingGateLink').textContent=t.gate;byId('stagingGateLink').hidden=configuration?.mode!=='connected';byId('stagingCapabilities').replaceChildren(...t.capabilities.map(value=>{const li=document.createElement('li');li.textContent=value;return li}));byId('stagingNav').replaceChildren(...t.pages.map((value,index)=>{const button=document.createElement('button');button.type='button';button.dataset.stagingView=views[index];button.textContent=value;button.setAttribute('aria-current',index===view?'page':'false');button.onclick=()=>{view=index;render()};return button}));}
 function unavailable(reason='unavailable'){
  ready=false;state=reason;byId('stagingWorkstation').hidden=true;byId('stagingShell').hidden=false;
  if(mounted){if(typeof stopScanner==='function')stopScanner(false);if(typeof clearPrivateState==='function')clearPrivateState()}
  render();
 }
 window.fetch=async function(input,options={}){
  const url=new URL(typeof input==='string'||input instanceof URL?input:input.url,location.href);
  if(url.origin===location.origin&&/^\/api(?:\/|$)/.test(url.pathname)){
   if(!ready)return new Response(JSON.stringify({ok:false,code:'STAGING_BACKEND_UNAVAILABLE',error:'Persistent staging backend unavailable; no operation submitted'}),{status:503,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
   try{return await transport(input,options)}catch(error){if(error.name!=='AbortError'&&error.name!=='TimeoutError')unavailable();throw error}
  }
  return transport(input,options);
 };
 function script(src){return new Promise((resolve,reject)=>{const node=document.createElement('script');node.src=src;node.onload=resolve;node.onerror=()=>reject(Error('Staging asset failed'));document.body.append(node)})}
 async function mount(){
  if(!mounted){byId('stagingWorkstation').append(byId('stagingWorkstationTemplate').content.cloneNode(true));mounted=true;await script('/d3.min.js');await script('/app.js');if(typeof clearPrivateState!=='function'||typeof initializeSession!=='function'||typeof setLanguage!=='function'||typeof analyze!=='function')throw Error('Incomplete workstation initialization');scriptsLoaded=true;void script('https://s3.tradingview.com/tv.js').then(()=>{if(ready&&typeof loadChart==='function')loadChart()}).catch(()=>{/* The application's unavailable chart placeholder remains truthful. */})}
  if(!scriptsLoaded)throw Error('Workstation asset initialization failed; reload required');
  // Clear all historical/inert account markup before revealing the real workstation.
  if(typeof clearPrivateState==='function')clearPrivateState();
  if(typeof initializeSession==='function')await initializeSession();
  if(!ready)return;
  if(typeof setLanguage==='function')setLanguage(lang);
  byId('stagingShell').hidden=true;byId('stagingWorkstation').hidden=false;
  if(typeof analyze==='function')void analyze();
 }
 async function probe(){
  if(probing)return;probing=true;state='checking';render();
  try{
   configuration=await(await transport('/staging-config.json',{cache:'no-store',signal:AbortSignal.timeout(8000)})).json();
   if(configuration.mode!=='connected'){unavailable();return}
   const response=await transport('/api/staging-contract',{cache:'no-store',credentials:'same-origin',signal:AbortSignal.timeout(8000)});
   if(response.status===401||response.status===403){unavailable('auth');return}
   if(!response.ok){unavailable();return}
   const contract=await response.json();
   if(contract.ok!==true||contract.contractVersion!==1||contract.liveExecutionEnabled!==false||contract.backend!=='persistent-node-sqlite'||contract.frontendOrigin!==location.origin){unavailable('mismatch');return}
   ready=true;await mount();
  }catch{unavailable()}finally{probing=false;render()}
 }
 byId('stagingRetry').onclick=probe;document.querySelectorAll('[data-staging-language]').forEach(node=>node.onclick=()=>{lang=node.dataset.stagingLanguage;render()});
 render();void probe();setInterval(()=>{if(ready&&!document.hidden)void probeHealth()},15000);
 async function probeHealth(){
  try{const response=await transport('/api/staging-contract',{cache:'no-store',signal:AbortSignal.timeout(8000)});if(!response.ok){unavailable(response.status===401||response.status===403?'auth':'unavailable');return}const value=await response.json();if(value.ok!==true||value.frontendOrigin!==location.origin||value.liveExecutionEnabled!==false)unavailable('mismatch')}catch{unavailable()}
 }
})();
