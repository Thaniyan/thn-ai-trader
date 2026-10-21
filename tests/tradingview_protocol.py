"""Offline public-embed script protocol. It never emits or certifies market candles."""
EMBED_URL='https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
TOOLBAR_ONLY="""(()=>{const script=document.currentScript,parent=script.parentElement,config=JSON.parse(script.textContent);(window.__widgets||=[]).push({...config,container_id:parent.id});const frame=document.createElement('iframe');frame.style.cssText='width:100%;height:100%;border:0';frame.srcdoc='<p>Protocol toolbar only. No market candle data.</p>';parent.querySelector('.tradingview-widget-container__widget').append(frame);})();"""
SCRIPT_ONLY="""(()=>{const script=document.currentScript;(window.__widgets||=[]).push({...JSON.parse(script.textContent),container_id:script.parentElement.id});})();"""
