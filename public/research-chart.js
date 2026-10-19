/* Provider OHLCV canvas, with time/price anchored drawings and bounded viewport controls. */
window.THNCandleChart = class {
  constructor(canvas, tooltip, describe) {
    this.canvas = canvas; this.tooltip = tooltip; this.describe = describe; this.count = 90; this.offset = 0;
    this.layers = { ema:true, volume:true, rsi:true, levels:true, smc:false }; this.drawings=[]; this.mode='pan'; this.hover=null;
    canvas.tabIndex=0;
    canvas.addEventListener('wheel',e=>{e.preventDefault();this.zoom(e.deltaY>0?1.2:1/1.2);},{passive:false});
    canvas.addEventListener('pointerdown',e=>{if(!this.data || !this.plot)return;canvas.setPointerCapture(e.pointerId);this.drag={x:e.clientX,offset:this.offset};});
    canvas.addEventListener('pointermove',e=>{
      const r=canvas.getBoundingClientRect();this.hover={x:e.clientX-r.left,y:e.clientY-r.top};
      if(this.drag && this.mode==='pan')this.offset=this.drag.offset+Math.round((this.drag.x-e.clientX)/Math.max(3,this.plot.width/this.visible.length))*-1;
      this.draw();
    });
    canvas.addEventListener('pointerup',e=>{
      if(this.drag && Math.abs(e.clientX-this.drag.x)<6 && this.mode!=='pan' && this.data){
        const point=this.pointAt(this.hover || {x:e.offsetX,y:e.offsetY});
        if(point){
          if(this.mode==='line'){
            if(this.anchor){this.drawings.push({type:'line',a:this.anchor,b:point});this.anchor=null;this.persist();}
            else this.anchor=point;
          }else {const label=this.annotation || 'Note';this.drawings.push({type:'note',point,label:label.slice(0,80)});this.persist();}
        }
      }
      this.drag=null;this.draw();
    });
    canvas.addEventListener('pointercancel',()=>{this.drag=null;});
    canvas.addEventListener('pointerleave',()=>{if(!this.drag){this.hover=null;this.draw();}});
    canvas.addEventListener('keydown',e=>{
      if(!['ArrowLeft','ArrowRight','+','-','Escape','Home'].includes(e.key))return;e.preventDefault();
      if(e.shiftKey && ['ArrowLeft','ArrowRight'].includes(e.key) && this.visible?.length){this.keyboardIndex=Math.max(0,Math.min(this.visible.length-1,(this.keyboardIndex??this.visible.length-1)+(e.key==='ArrowRight'?1:-1)));const c=this.visible[this.keyboardIndex],p=this.plot;this.hover={x:p.left+(this.keyboardIndex+.5)*p.width/this.visible.length,y:p.top+(p.max-c.close)/(p.max-p.min)*p.height};this.draw();return;}
      if(e.key==='+')this.zoom(.8);else if(e.key==='-')this.zoom(1.25);else if(e.key==='Home')this.reset();
      else if(e.key==='Escape'){this.anchor=null;this.hover=null;this.draw();}
      else {this.offset+=e.key==='ArrowLeft'?5:-5;this.draw();}
    });
    this.resize=new ResizeObserver(()=>this.draw());this.resize.observe(canvas.parentElement);
  }
  setData(data,context){
    this.data=data;this.context=context;this.offset=0;this.count=Math.min(this.canvas.clientWidth<600?45:90,data.candles.length);
    this.storageKey=`thn_drawings_v62_${context.symbol}_${context.interval}`;
    try {const saved=JSON.parse(localStorage.getItem(this.storageKey));this.drawings=Array.isArray(saved)?saved.filter(d=>['line','note'].includes(d.type)).slice(-50):[];}catch{this.drawings=[];}
    this.anchor=null;this.draw();
  }
  clear(){this.data=null;this.hover=null;this.tooltip.textContent='';this.draw();}
  persist(){this.drawings=this.drawings.slice(-50);localStorage.setItem(this.storageKey,JSON.stringify(this.drawings));}
  zoom(factor){if(!this.data)return;this.count=Math.round(Math.max(20,Math.min(this.data.candles.length,this.count*factor)));this.draw();}
  reset(){this.offset=0;this.count=this.canvas.clientWidth<600?45:90;this.anchor=null;this.draw();}
  pointAt(point){
    if(!this.visible?.length)return null;const p=this.plot;
    if(point.x<p.left||point.x>p.right||point.y<p.top||point.y>p.bottom)return null;
    const index=Math.max(0,Math.min(this.visible.length-1,Math.floor((point.x-p.left)/p.width*this.visible.length)));
    return {time:this.visible[index].time,price:p.max-(point.y-p.top)/p.height*(p.max-p.min)};
  }
  draw(){
    const canvas=this.canvas,rect=canvas.getBoundingClientRect(),width=Math.max(280,rect.width),height=Math.max(360,rect.height),dpr=Math.min(2,devicePixelRatio||1);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
    const css=getComputedStyle(document.documentElement),text=css.getPropertyValue('--text').trim(),muted=css.getPropertyValue('--muted').trim(),border=css.getPropertyValue('--border').trim();
    const light=document.documentElement.dataset.theme==='light',bull=light?'#087c6c':'#19c9a6',bear=light?'#b91c1c':'#f87171';
    ctx.font='10px ui-monospace,monospace';ctx.fillStyle=muted;
    if(!this.data){ctx.fillText(this.describe('noData'),16,40);return;}
    const all=this.data.candles;this.count=Math.min(all.length,Math.max(20,this.count));this.offset=Math.max(0,Math.min(all.length-this.count,this.offset));
    const end=all.length-this.offset,start=Math.max(0,end-this.count);this.visible=all.slice(start,end);const bars=this.visible;
    let min=Math.min(...bars.map(c=>c.low)),max=Math.max(...bars.map(c=>c.high));if(this.showPlanOverlay!==false&&this.planLevels?.symbol===this.context.symbol){min=Math.min(min,this.planLevels.stop,this.planLevels.entry,...this.planLevels.targets);max=Math.max(max,this.planLevels.stop,this.planLevels.entry,...this.planLevels.targets);}const pad=(max-min)*.08||max*.01;min-=pad;max+=pad;
    const plot={left:12,right:width-72,top:24,bottom:height-(this.layers.rsi?140:60),min,max};plot.width=plot.right-plot.left;plot.height=plot.bottom-plot.top;this.plot=plot;
    const x=i=>plot.left+(i+.5)*plot.width/bars.length,y=v=>plot.top+(max-v)/(max-min)*plot.height;
    const price=v=>new Intl.NumberFormat(document.documentElement.lang==='ar'?'ar-OM':'en-US',{maximumFractionDigits:v>100?2:5}).format(v);
    for(let j=0;j<=5;j++){const py=plot.top+plot.height*j/5;ctx.strokeStyle=border;ctx.beginPath();ctx.moveTo(plot.left,py);ctx.lineTo(plot.right,py);ctx.stroke();ctx.fillStyle=muted;ctx.fillText(price(max-(max-min)*j/5),plot.right+8,py+3);}
    ctx.save();ctx.beginPath();ctx.rect(plot.left,plot.top,plot.width,plot.height);ctx.clip();
    const barWidth=Math.max(1,plot.width/bars.length*.65),maxVol=Math.max(1,...bars.map(c=>c.volume||0));
    bars.forEach((c,i)=>{
      const color=c.close>=c.open?bull:bear;
      if(this.layers.volume && c.volume>0){ctx.globalAlpha=.2;ctx.fillStyle=color;const h=c.volume/maxVol*45;ctx.fillRect(x(i)-barWidth/2,plot.bottom-h,barWidth,h);ctx.globalAlpha=1;}
      ctx.strokeStyle=color;ctx.beginPath();ctx.moveTo(x(i),y(c.high));ctx.lineTo(x(i),y(c.low));ctx.stroke();ctx.fillStyle=color;ctx.fillRect(x(i)-barWidth/2,y(Math.max(c.open,c.close)),barWidth,Math.max(1,Math.abs(y(c.open)-y(c.close))));
    });
    const line=(values,color)=>{ctx.strokeStyle=color;ctx.lineWidth=1.5;ctx.beginPath();let begun=false;values.slice(start,end).forEach((v,i)=>{if(v==null)return;begun?ctx.lineTo(x(i),y(v)):ctx.moveTo(x(i),y(v));begun=true;});ctx.stroke();};
    if(this.layers.ema){line(this.data.indicators.ema20,light?'#a16207':'#eab85f');line(this.data.indicators.ema50,light?'#1d4ed8':'#60a5fa');}
    if(this.layers.levels){const prev=all.slice(Math.max(0,end-21),end-1);for(const [v,color] of [[Math.min(...prev.map(c=>c.low)),'#19c9a6'],[Math.max(...prev.map(c=>c.high)),'#f87171']]){ctx.strokeStyle=color;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(plot.left,y(v));ctx.lineTo(plot.right,y(v));ctx.stroke();ctx.setLineDash([]);}}
    if(this.layers.smc){
      this.data.events.filter(e=>e.index>=start&&e.index<end).slice(-30).forEach(e=>{
        const px=x(e.index-start),py=y(e.price),color=e.direction===1?bull:bear;ctx.strokeStyle=color;ctx.fillStyle=color;
        if(e.low!=null){ctx.globalAlpha=.1;ctx.fillRect(px,y(e.high),plot.right-px,y(e.low)-y(e.high));ctx.globalAlpha=1;}
        ctx.fillText(e.type,px,Math.max(plot.top+10,Math.min(plot.bottom-4,py-6)));ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(Math.min(plot.right,px+40),py);ctx.stroke();
      });
    }
    if(this.showPlanOverlay!==false&&this.planLevels?.symbol===this.context.symbol){
      const plan=this.planLevels,arabic=document.documentElement.lang==='ar';
      [[plan.entry,arabic?'دخول افتراضي':'Hypothetical entry',bull],[plan.stop,arabic?'وقف غير مضمون':'Stop (not guaranteed)',bear],...plan.targets.map((v,i)=>[v,(arabic?'هدف ':'Target ')+(i+1),light?'#6d28d9':'#c4b5fd'])].forEach(([v,label,color])=>{if(v<min||v>max)return;ctx.strokeStyle=color;ctx.fillStyle=color;ctx.setLineDash([8,4]);ctx.beginPath();ctx.moveTo(plot.left,y(v));ctx.lineTo(plot.right,y(v));ctx.stroke();ctx.setLineDash([]);ctx.fillText(label+' '+price(v),plot.left+8,y(v)-5);});
    }
    const timeX=time=>{const index=bars.findIndex(c=>c.time===time);return index<0?null:x(index);};
    this.drawings.forEach(d=>{
      ctx.strokeStyle=light?'#6d28d9':'#c4b5fd';ctx.fillStyle=light?'#6d28d9':'#c4b5fd';ctx.lineWidth=2;
      if(d.type==='line'){const ax=timeX(d.a?.time),bx=timeX(d.b?.time);if(ax==null||bx==null)return;ctx.beginPath();ctx.moveTo(ax,y(d.a.price));ctx.lineTo(bx,y(d.b.price));ctx.stroke();}
      else {const px=timeX(d.point?.time);if(px!=null)ctx.fillText(d.label,px,y(d.point.price));}
    });
    if(this.anchor){const px=timeX(this.anchor.time);if(px!=null){ctx.fillStyle=light?'#6d28d9':'#c4b5fd';ctx.fillRect(px-3,y(this.anchor.price)-3,6,6);}}
    ctx.restore();ctx.fillStyle=muted;
    for(let j=0;j<4;j++){const i=Math.round((bars.length-1)*j/3);ctx.fillText(new Date(bars[i].time).toISOString().slice(this.context.interval==='1d'?0:5,this.context.interval==='1d'?10:16).replace('T',' '),Math.min(plot.right-50,x(i)),plot.bottom+20);}
    if(this.layers.rsi){
      const top=height-100,bottom=height-30;ctx.fillText('RSI 14',12,top-8);
      [30,70].forEach(v=>{const py=bottom-v/100*(bottom-top);ctx.strokeStyle=border;ctx.beginPath();ctx.moveTo(plot.left,py);ctx.lineTo(plot.right,py);ctx.stroke();ctx.fillText(String(v),plot.right+8,py);});
      ctx.strokeStyle=light?'#6d28d9':'#c4b5fd';ctx.beginPath();this.data.indicators.rsi14.slice(start,end).forEach((v,i)=>{if(v!=null){i?ctx.lineTo(x(i),bottom-v/100*(bottom-top)):ctx.moveTo(x(i),bottom-v/100*(bottom-top));}});ctx.stroke();
    }
    if(this.hover && this.hover.x>=plot.left&&this.hover.x<=plot.right){
      const index=Math.max(0,Math.min(bars.length-1,Math.floor((this.hover.x-plot.left)/plot.width*bars.length))),c=bars[index];
      ctx.strokeStyle=muted;ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(x(index),plot.top);ctx.lineTo(x(index),plot.bottom);ctx.moveTo(plot.left,this.hover.y);ctx.lineTo(plot.right,this.hover.y);ctx.stroke();ctx.setLineDash([]);
      this.tooltip.textContent=`${new Date(c.time).toISOString()} UTC · ${this.describe('open')} ${price(c.open)} · ${this.describe('high')} ${price(c.high)} · ${this.describe('low')} ${price(c.low)} · ${this.describe('close')} ${price(c.close)} · ${this.describe('volume')} ${c.volume || '—'}`;
    } else this.tooltip.textContent=`${bars.length} / ${all.length} ${this.describe('bars')} · UTC · ${this.describe('chartHelp')}`;
    ctx.fillStyle=text;ctx.fillText(`${this.context.symbol} · ${this.context.interval} · ${this.data.provenance.source}`,12,14);
  }
};
