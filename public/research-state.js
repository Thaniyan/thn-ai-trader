/* A single research context. Metadata changes never reload symbol/timeframe data. */
(() => {
  const key='thn_research_context_v63';
  const validSymbol=v=>typeof v==='string'&&/^[A-Z0-9^=:.\-]{1,32}$/.test(v);
  const finite=(v,min,max)=>Number.isFinite(v)&&v>=min&&v<=max;
  function cleanMetadata(p){
    const out={};
    for(const k of ['provider','datasetId','providerSymbol','analysisVersion'])if(typeof p[k]==='string'&&p[k].length<=160)out[k]=p[k];
    if(p.dataTimestamp===null||finite(p.dataTimestamp,0,1e15))out.dataTimestamp=p.dataTimestamp;
    if(finite(p.analysisTimestamp,0,1e15))out.analysisTimestamp=p.analysisTimestamp;
    if(p.scenario===null)out.scenario=null;
    else if(p.scenario&&['bullish','bearish','neutral'].includes(p.scenario.direction))out.scenario={direction:p.scenario.direction,invalidation:finite(p.scenario.invalidation,0,1e12)?p.scenario.invalidation:null,sourceTimestamp:finite(p.scenario.sourceTimestamp,0,1e15)?p.scenario.sourceTimestamp:null,sourceInterval:['15m','1h','1d'].includes(p.scenario.sourceInterval)?p.scenario.sourceInterval:null,sourceDatasetHash:typeof p.scenario.sourceDatasetHash==='string'&&/^[a-f0-9]{64}$/.test(p.scenario.sourceDatasetHash)?p.scenario.sourceDatasetHash:null};
    if(p.riskAssumptions&&typeof p.riskAssumptions==='object'){
      out.riskAssumptions={};for(const k of ['capital','riskPct','leverage','spreadBps','slippageBps','commissionBps'])if(finite(p.riskAssumptions[k],0,1e8))out.riskAssumptions[k]=p.riskAssumptions[k];
    }
    if(p.strategy&&['ema','rsi','breakout'].includes(p.strategy.name))out.strategy={name:p.strategy.name,direction:['long_only','short_only','long_short'].includes(p.strategy.direction)?p.strategy.direction:'long_only'};
    if(p.levels&&typeof p.levels==='object'){out.levels={};for(const k of ['support','resistance'])if(finite(p.levels[k],0,1e12))out.levels[k]=p.levels[k];}
    if(p.evaluationPeriod===null)out.evaluationPeriod=null;
    else if(p.evaluationPeriod&&finite(p.evaluationPeriod.firstTime,0,1e15)&&finite(p.evaluationPeriod.lastTime,0,1e15))out.evaluationPeriod={firstTime:p.evaluationPeriod.firstTime,lastTime:p.evaluationPeriod.lastTime};
    if(p.researchQuality===null)out.researchQuality=null;
    else if(p.researchQuality&&['insufficient','limited','mixed','consistent'].includes(p.researchQuality.label))out.researchQuality={label:p.researchQuality.label,criteriaVersion:'6.4-Q1'};
    return out;
  }
  let saved;try{saved=JSON.parse(localStorage.getItem(key)||localStorage.getItem('thn_research_context_v62'));}catch{}
  let state={symbol:validSymbol(saved?.symbol)?saved.symbol:'EURUSD',interval:['15m','1h','1d'].includes(saved?.interval)?saved.interval:'1h',...cleanMetadata(saved||{})};
  window.THNContext={
    get:()=>structuredClone(state),
    set(patch,source='user'){
      const symbol=patch.symbol??state.symbol,interval=patch.interval??state.interval;
      if(!validSymbol(symbol)||!['15m','1h','1d'].includes(interval))return false;
      const changed=symbol!==state.symbol||interval!==state.interval;
      const next={...state,symbol,interval,...(changed?{provider:'',datasetId:'',providerSymbol:'',dataTimestamp:null,analysisTimestamp:null,analysisVersion:'',scenario:null,levels:{},evaluationPeriod:null,researchQuality:null}:{}),...cleanMetadata(patch)};
      if(JSON.stringify(next)===JSON.stringify(state))return true;
      state=next;try{localStorage.setItem(key,JSON.stringify(state));}catch{/* session memory remains available */}
      window.dispatchEvent(new CustomEvent(changed?'thn:context':'thn:research-context',{detail:{...structuredClone(state),source}}));return true;
    }
  };
})();
