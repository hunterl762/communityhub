(() => {
  const anchors=new WeakMap();
  function tick(){
    document.querySelectorAll('[data-duty-seconds]').forEach(node=>{
      const key=node.dataset.dutySeconds+'|'+node.dataset.dutyRunning;
      let anchor=anchors.get(node);
      if(!anchor||anchor.key!==key){anchor={key,seconds:Math.max(0,Number(node.dataset.dutySeconds)||0),time:Date.now()};anchors.set(node,anchor);}
      const total=Math.floor(anchor.seconds+(node.dataset.dutyRunning==='true'?Math.max(0,Date.now()-anchor.time)/1000:0));
      const label=[Math.floor(total/3600),Math.floor(total/60)%60,total%60].map(n=>String(n).padStart(2,'0')).join(':');
      if(node.textContent!==label)node.textContent=label;
      node.style.fontVariantNumeric='tabular-nums';
    });
  }
  tick();setInterval(tick,1000);
  document.addEventListener('visibilitychange',tick);
  new MutationObserver(tick).observe(document.getElementById('main-content')||document.body,{childList:true,subtree:true});
})();
