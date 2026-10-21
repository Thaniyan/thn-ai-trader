/* Research records are user-controlled data, never proof of broker execution.
 * Interpretation is read-only: old bytes are not migrated or promoted on load. */
(() => {
  const KINDS = Object.freeze(['research_idea','hypothetical_scenario','paper_trade','executed_trade','closed_trade','unknown']);
  const finite = v => typeof v === 'number' && Number.isFinite(v);
  const date = v => typeof v === 'string' && /^\d{4}-\d\d-\d\d(?:T\d\d:\d\d:\d\d(?:\.\d{1,3})?Z)?$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0,10) === v.slice(0,10);
  const symbol = v => typeof v === 'string' && /^[A-Z0-9^=:.\-]{1,32}$/.test(v);
  function supportedOutcome(r, now = Date.now()) {
    return r && symbol(r.symbol) && ['BUY','SELL'].includes(r.decision) && date(r.date) && Date.parse(r.date) <= now &&
      [r.entry,r.exitPrice,r.risk].every(v=>finite(v)&&v>0&&v<=1e12) && finite(r.pnl) && Math.abs(r.pnl)<=1e12 &&
      Number.isFinite(r.pnl/r.risk) && r.currency === 'USD' && (r.openedAt == null || date(r.openedAt) && Date.parse(r.openedAt)<=Date.parse(r.date));
  }
  function classify(r, now = Date.now()) {
    const unknown = {kind:'unknown',source:'legacy',verification:'unverified',closed:false,eligible:false};
    if (!r || r.schema !== 'THN-RECORD-1' || !KINDS.includes(r.kind)) return unknown;
    if (['research_idea','hypothetical_scenario'].includes(r.kind)) return {kind:r.kind,source:'research',verification:'unverified',closed:false,eligible:false};
    // A browser field named "verified" or an imported receipt never establishes authority.
    const source = ['manual','import','local_paper'].includes(r.source) ? r.source : 'unknown';
    if (r.kind === 'paper_trade') {
      const e=r.execution;
      const closed=supportedOutcome(r,now)&&source==='local_paper'&&e?.mode==='PAPER'&&typeof e.ticket==='string'&&/^PT-[A-Z0-9-]{1,60}$/.test(e.ticket)&&finite(e.closedLots)&&e.closedLots>0&&e.realizedPnl===r.pnl&&e.exitPrice===r.exitPrice;
      return {kind:'paper_trade',source,verification:'unverified',closed:Boolean(closed),eligible:Boolean(closed)};
    }
    if (r.kind==='closed_trade' && ['manual','import'].includes(source) && supportedOutcome(r,now))
      return {kind:'closed_trade',source,verification:'unverified',closed:true,eligible:true};
    // No real broker verification mechanism exists in this application.
    return {...unknown,source};
  }
  function idea(analysis, now=Date.now()) {
    return {schema:'THN-RECORD-1',kind:'research_idea',source:'research',verification:'unverified',id:'idea-'+crypto.randomUUID(),date:new Date(now).toISOString(),symbol:analysis.symbol,decision:analysis.decision,
      entry:analysis.entry,stopLoss:analysis.stopLoss,target1:analysis.targets?.[0],risk:analysis.risk?.riskAmount,confidence:analysis.confidence,grade:analysis.grade,assetClass:analysis.assetClass,
      evidence:analysis.evidence?{hash:analysis.evidence.hash,interval:analysis.evidence.interval,lastTime:analysis.evidence.lastTime,availableAt:analysis.evidence.availableAt}:null};
  }
  function outcome(input, source='manual', now=Date.now()) {
    const r={...input,schema:'THN-RECORD-1',kind:'closed_trade',source:source==='import'?'import':'manual',verification:'unverified'};
    if (!supportedOutcome(r,now)) throw Error('Complete dated USD outcome, explicit entry/exit, risk and reported PnL required.');
    r.status=r.pnl>0?'WIN':r.pnl<0?'LOSS':'BE';
    // R is derived from an explicitly supplied reported PnL and risk, never a forecast.
    r.pnlR=r.pnl/r.risk;
    return r;
  }
  function select(records, source='verified', now=Date.now()) {
    return records.filter(r=>{const c=classify(r,now);return c.eligible && c.source===({paper:'local_paper',manual:'manual',import:'import'})[source];});
  }
  const reportedR=r=>classify(r).eligible?r.pnl/r.risk:null;
  function csvRows(raw) {
    if(typeof raw!=='string'||new TextEncoder().encode(raw).length>1000000)throw Error('CSV exceeds 1 MB.');
    const rows=[];let row=[],value='',quoted=false,closed=false;
    for(let i=0;i<raw.length;i++){
      const c=raw[i];
      if(quoted){if(c==='"'){if(raw[i+1]==='"'){value+='"';i++;}else{quoted=false;closed=true;}}else value+=c;continue;}
      if(c==='"'){if(value||closed)throw Error('Invalid CSV quoting.');quoted=true;}
      else if(c===','||c==='\n'||c==='\r'){
        row.push(value);value='';closed=false;
        if(c!==','){if(c==='\r'&&raw[i+1]==='\n')i++;if(row.some(v=>v.trim()))rows.push(row);row=[];if(rows.length>501)throw Error('At most 500 CSV records.');}
      }else {if(closed&&!/\s/.test(c))throw Error('Invalid CSV suffix.');if(!closed)value+=c;}
    }
    if(quoted)throw Error('Interrupted quoted CSV.');
    if(value||row.length){row.push(value);if(row.some(v=>v.trim()))rows.push(row);}
    if(rows.length>501)throw Error('At most 500 CSV records.');return rows;
  }
  function parseCSV(raw,now=Date.now()) {
    const rows=csvRows(raw),records=[],issues=[];
    if(!rows.length)return {records,issues};
    const headers=rows.shift().map(v=>v.trim().replace(/^\uFEFF/,'').toLowerCase());
    if(new Set(headers).size!==headers.length)throw Error('Duplicate CSV headers.');
    const aliases={date:['date','closedat','closedate'],symbol:['symbol','pair','ticker','instrument'],decision:['decision','side','direction'],entry:['entry','openprice'],exitPrice:['exitprice','exit','closeprice'],risk:['risk','riskamount'],pnl:['pnl','realizedpnl'],currency:['currency'],kind:['kind']};
    const index=Object.fromEntries(Object.entries(aliases).map(([k,names])=>[k,headers.findIndex(h=>names.includes(h))]));
    const get=(row,k)=>index[k]<0?undefined:row[index[k]]?.trim();
    rows.forEach((row,n)=>{
      if(row.length!==headers.length){issues.push({row:n+2,reason:'column_count'});return;}
      const data={id:'import-'+crypto.randomUUID(),date:get(row,'date'),symbol:get(row,'symbol'),decision:get(row,'decision'),currency:get(row,'currency')};
      for(const k of ['entry','exitPrice','risk','pnl']){const v=get(row,k);data[k]=v==null||v===''?null:Number(v);}
      // CSV can report outcomes, but cannot confer paper/broker authority or promote an idea.
      const kind=get(row,'kind');
      if(!kind){issues.push({row:n+2,reason:'explicit_record_kind_required'});return;}
      if(kind && kind!=='closed_trade'){records.push({...data,schema:'THN-RECORD-1',kind:KINDS.includes(kind)?kind:'unknown',source:'import',verification:'unverified',pnl:undefined,exitPrice:undefined,originalCSV:{headers:[...headers],values:[...row]}});return;}
      try{records.push({...outcome(data,'import',now),originalCSV:{headers:[...headers],values:[...row]}});}
      catch{issues.push({row:n+2,reason:'incomplete_or_invalid_outcome'});}
    });
    return {records,issues};
  }
  function parseBackup(raw,now=Date.now()) {
    if(typeof raw!=='string'||new TextEncoder().encode(raw).length>2100000)throw Error('Backup exceeds 2.1 MB.');
    const backup=JSON.parse(raw);
    if(backup?.schema!=='THN-RECORDS-1'||!Array.isArray(backup.records)||backup.records.length>500)throw Error('Invalid record backup.');
    const pending=[[backup,0]];let nodes=0;
    while(pending.length){const [v,depth]=pending.pop();if(++nodes>30000||depth>16)throw Error('Backup structure exceeds bounds.');if(v&&typeof v==='object')for(const child of Object.values(v))pending.push([child,depth+1]);}
    return {records:backup.records.map(original=>{
      if(!original||typeof original!=='object'||Array.isArray(original))throw Error('Invalid record.');
      // JSON restoration preserves the original as data, but never restores authority.
      const fields=Object.fromEntries(['date','symbol','decision','entry','exitPrice','risk','pnl','currency','openedAt'].filter(k=>Object.hasOwn(original,k)).map(k=>[k,original[k]]));
      const base={...fields,id:'restored-'+crypto.randomUUID(),originalRecord:original,source:'import',verification:'unverified'};
      if(original.schema==='THN-RECORD-1'&&original.kind==='closed_trade'&&supportedOutcome(original,now))return outcome(base,'import',now);
      return {...base,schema:'THN-RECORD-1',kind:['research_idea','hypothetical_scenario'].includes(original.kind)?original.kind:'unknown'};
    }),issues:[]};
  }
  const csvCell=v=>'"'+(typeof v==='number'&&finite(v)?String(v):String(v??'').replace(/^[\s\uFEFF]*[=+@-]/,m=>"'"+m)).replace(/"/g,'""')+'"';
  const labels={en:{research_idea:'Research idea · no realized outcome',hypothetical_scenario:'Hypothetical scenario · not executed',paper_trade:'Paper trade · simulated, unverified record',executed_trade:'Execution claim · unverified',closed_trade:'Reported closed outcome · unverified',unknown:'Unknown historical record · unverified'},ar:{research_idea:'فكرة بحثية · دون نتيجة محققة',hypothetical_scenario:'سيناريو افتراضي · غير منفذ',paper_trade:'صفقة ورقية · سجل محاكاة غير موثق',executed_trade:'ادعاء تنفيذ · غير موثق',closed_trade:'نتيجة مغلقة مسجلة · غير موثقة',unknown:'سجل تاريخي مجهول · غير موثق'}};
  function label(r,language='en'){return labels[language==='ar'?'ar':'en'][classify(r).kind];}
  globalThis.THNRecords=Object.freeze({KINDS,classify,idea,outcome,select,reportedR,parseCSV,parseBackup,csvCell,label,supportedOutcome});
})();
