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
  draw(){super.draw();if(!this.data||!this.plot)return;const ctx=this.canvas.getContext('2d'),p=this.plot;ctx.save();ctx.beginPath();ctx.rect(p.left,p.top,p.width,p.height);ctx.clip();ctx.strokeStyle=document.documentElement.dataset.theme==='light'?'#6d28d9':'#c4b5fd';ctx.fillStyle=ctx.strokeStyle;ctx.font='11px ui-monospace,monospace';for(const d of this.drawings.filter(d=>d.type==='horizontal')){const y=p.top+(p.max-d.price)/(p.max-p.min)*p.height;ctx.setLineDash([5,3]);ctx.beginPath();ctx.moveTo(p.left,y);ctx.lineTo(p.right,y);ctx.stroke();ctx.setLineDash([]);ctx.fillText(d.price.toPrecision(6),p.left+8,y-5);}ctx.restore();}
 };
})();
