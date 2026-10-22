/* Extend the frozen authoritative chart renderer; indicator and numerical source is unchanged. */
(() => {
 const Base=window.THNCandleChart;
 window.THNCandleChart=class extends Base {
  constructor(...args){super(...args);this.canvas.addEventListener('pointerup',e=>{if(this.mode!=='horizontal')return;e.stopImmediatePropagation();if(this.drag&&Math.abs(e.clientX-this.drag.x)<6){const r=this.canvas.getBoundingClientRect(),point=this.pointAt({x:e.clientX-r.left,y:e.clientY-r.top});if(point){this.drawings.push({type:'horizontal',price:point.price});this.persist();}}this.drag=null;this.draw();},true);}
  setData(data,context){
   this.data=data;this.context=context;this.offset=0;this.count=Math.min(this.canvas.clientWidth<600?45:90,data.candles.length);this.storageKey=`thn_drawings_v62_${context.symbol}_${context.interval}`;
   const point=p=>p&&Number.isFinite(p.time)&&Number.isFinite(p.price)&&p.price>0;
   try{const raw=localStorage.getItem(this.storageKey);if(raw?.length>100000)throw Error();const saved=JSON.parse(raw);this.drawings=Array.isArray(saved)?saved.filter(d=>d&&((d.type==='line'&&point(d.a)&&point(d.b))||(d.type==='note'&&point(d.point)&&typeof d.label==='string'&&d.label.length<=80)||(d.type==='horizontal'&&Number.isFinite(d.price)&&d.price>0))).slice(-50):[];}catch{this.drawings=[];}
   this.anchor=null;this.draw();
  }
  persist(){this.drawings=this.drawings.slice(-50);try{localStorage.setItem(this.storageKey,JSON.stringify(this.drawings));}catch{window.dispatchEvent(new Event('thn:storage-unavailable'));}}
  draw(){super.draw();if(!this.data||!this.plot)return;const ctx=this.canvas.getContext('2d'),p=this.plot;ctx.save();ctx.beginPath();ctx.rect(p.left,p.top,p.width,p.height);ctx.clip();ctx.strokeStyle=document.documentElement.dataset.theme==='light'?'#6d28d9':'#c4b5fd';ctx.fillStyle=ctx.strokeStyle;ctx.font='11px ui-monospace,monospace';for(const d of this.drawings.filter(d=>d.type==='horizontal')){const y=p.top+(p.max-d.price)/(p.max-p.min)*p.height;ctx.setLineDash([5,3]);ctx.beginPath();ctx.moveTo(p.left,y);ctx.lineTo(p.right,y);ctx.stroke();ctx.setLineDash([]);ctx.fillText(d.price.toPrecision(6),p.left+8,y-5);}ctx.restore();this.drawTimeLabels(ctx,p);}
  // Presentation-only axis layout: use original visible bars and measured text widths.
  drawTimeLabels(ctx,p){
   ctx.save();ctx.clearRect(0,p.bottom+5,this.canvas.width,p.bottom?23:0);ctx.font='10px ui-monospace,monospace';ctx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--muted').trim();
   const bars=this.visible||[],candidates=[0,Math.round((bars.length-1)/3),Math.round(2*(bars.length-1)/3),bars.length-1];this.timeLabels=[];
   // Place the endpoints first; intermediate ticks only when a complete label fits.
   for(const index of [candidates[0],candidates[3],candidates[1],candidates[2]]){if(!bars[index])continue;const label=new Date(bars[index].time).toISOString().slice(this.context.interval==='1d'?0:5,this.context.interval==='1d'?10:16).replace('T',' '),width=ctx.measureText(label).width;const x=Math.max(p.left,Math.min(p.right-width,p.left+(index+.5)*p.width/bars.length));if(this.timeLabels.some(v=>x<v.x+v.width+10&&x+width+10>v.x))continue;this.timeLabels.push({x,width,label});ctx.fillText(label,x,p.bottom+20);}
   ctx.restore();
  }
 };
})();
