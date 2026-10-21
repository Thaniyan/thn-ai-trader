import os,json,pathlib,threading,http.server,argparse
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright
root=pathlib.Path(__file__).resolve().parents[2]
parser=argparse.ArgumentParser(description='Read-only browser comparison; never certifies candles from iframe or canvas presence.')
parser.add_argument('--url',required=True,help='Existing local candidate URL; starts no application or deployment')
parser.add_argument('--output',default=str(root/'work/tv-network'))
args=parser.parse_args();out=pathlib.Path(args.output);out.mkdir(parents=True,exist_ok=True)
if urlsplit(args.url).hostname not in ['127.0.0.1','localhost']:raise SystemExit('Use an existing local candidate server; this tool does not target hosting projects')
minimal=(root/'tests/fixtures/tradingview-minimal.html').read_bytes()
legacy=b'''<!doctype html><html><head><meta charset="utf-8"><title>Legacy public widget isolation</title></head><body><h1>Legacy public tv.js comparison</h1><div id="legacy" style="height:600px;width:100%"></div><script src="https://s3.tradingview.com/tv.js"></script><script>if(window.TradingView){new TradingView.widget({autosize:true,symbol:"FX:EURUSD",interval:"60",timezone:"Etc/UTC",theme:"dark",style:"1",locale:"en",hide_side_toolbar:false,allow_symbol_change:true,container_id:"legacy",studies:["RSI@tv-basicstudies","MACD@tv-basicstudies","ATR@tv-basicstudies","BB@tv-basicstudies"]});}</script></body></html>'''
class Handler(http.server.BaseHTTPRequestHandler):
 def do_GET(self):
  data=legacy if self.path=='/legacy' else minimal;self.send_response(200);self.send_header('Content-Type','text/html; charset=utf-8');self.end_headers();self.wfile.write(data)
 def log_message(self,*a):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start()
result={'network':'Configured proxy retained when present; only localhost bypassed for local test servers','ownerObservation':'Direct official EURUSD candles work in owner Chrome; THN Production embed toolbar loads but candles do not. Not independently reproduced here.','profiles':'Clean Playwright Chromium, no extensions loaded. Owner cookie/storage/extension settings unobservable.','experiments':[]}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'],**({'proxy':{'server':os.environ['HTTPS_PROXY'],'bypass':'127.0.0.1,localhost'}} if os.environ.get('HTTPS_PROXY') else {}))
 for label,url in [('minimal','http://127.0.0.1:'+str(server.server_port)+'/minimal'),('legacy','http://127.0.0.1:'+str(server.server_port)+'/legacy'),('candidate',args.url)]:
  page=b.new_page(viewport={'width':1440,'height':1000});entry={'name':label,'console':[],'pageErrors':[],'failedRequests':[],'responses':[],'scriptLoaded':False,'iframeLoaded':False,'toolbarLoaded':'unverified','marketCandles':'unverified','providerUnavailable':'unverified'}
  page.on('framenavigated',lambda frame,e=entry:e.__setitem__('iframeLoaded',True) if frame.parent_frame and frame.url!='about:blank' else None)
  page.on('pageerror',lambda error,e=entry:e['pageErrors'].append(str(error)[:250]))
  page.on('console',lambda m,e=entry:e['console'].append({'type':m.type,'text':m.text[:250]}))
  page.on('requestfailed',lambda req,e=entry:e['failedRequests'].append({'host':urlsplit(req.url).netloc,'path':urlsplit(req.url).path,'type':req.resource_type,'error':req.failure}))
  page.on('response',lambda resp,e=entry:e['responses'].append({'host':urlsplit(resp.url).netloc,'path':urlsplit(resp.url).path,'status':resp.status}))
  try:
   response=page.goto(url,wait_until='domcontentloaded',timeout=20000)
   entry['headers']={k:v for k,v in response.headers.items() if k in ['content-security-policy','permissions-policy','referrer-policy','x-frame-options']}
   if label=='candidate':
    page.wait_for_function('window.THNProfessional',timeout=15000);page.locator('.nav-stack [data-view="trading"]').click();page.locator('#proTradingViewMode').click()
   page.wait_for_timeout(2500)
   if label=='candidate':entry['state']=page.evaluate('THNTradingViewStatus()');entry['scriptLoaded']=entry['state']['scriptLoaded'];entry['iframeLoaded']=entry['state']['iframeLoaded']
   else:entry['scriptLoaded']=any(r['host']=='s3.tradingview.com' and r['status']==200 for r in entry['responses'])
   frames=page.locator('iframe');entry['iframeCount']=frames.count()
   for i in range(frames.count()):frames.nth(i).screenshot(path=str(out/(label+'-frame-'+str(i)+'.png')))
   page.screenshot(path=str(out/(label+'.png')))
  except Exception as e:entry['error']=str(e).split('Call log:')[0].strip()
  result['experiments'].append(entry);page.close()
 b.close()
server.shutdown();(out/'real-browser.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps([{k:e.get(k) for k in ['name','scriptLoaded','iframeLoaded','iframeCount','marketCandles','failedRequests','error']} for e in result['experiments']],indent=2))
