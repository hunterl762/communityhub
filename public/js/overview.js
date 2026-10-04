(() => {
  const target=document.getElementById('overview-content');if(!target)return;let pending=false;
  async function refresh(){if(document.hidden||pending)return;pending=true;try{const res=await fetch('/overview/updates',{headers:{Accept:'text/html'},cache:'no-store'});if(!res.ok||res.redirected)throw Error('Unavailable');const html=await res.text();if(target.contains(document.activeElement))return;target.innerHTML=html;}catch{const note=target.querySelector('[data-overview-notice]');if(note)note.textContent='Live update unavailable. Showing the last received data; retrying shortly.';}finally{pending=false;}}
  const timer=setInterval(refresh,15000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});window.addEventListener('pagehide',()=>clearInterval(timer));
})();
