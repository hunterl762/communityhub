(() => {
 const form=document.getElementById('accountLinkForm'),input=document.getElementById('linkCode'),button=document.getElementById('link'),status=document.getElementById('linkStatus');
 let pending=false,linked=false,timer;
 function finish(){pending=false;clearTimeout(timer);button.disabled=linked;button.textContent='Link account';input.disabled=linked;}
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(pending||linked)return;
  const code=input.value.trim();if(!/^[0-9]{6}$/.test(code)){status.textContent='Enter the six-digit code generated on the website.';input.focus();return;}
  pending=true;button.disabled=true;button.textContent='Connecting…';input.disabled=true;status.textContent='Checking your linking code…';
  timer=setTimeout(()=>{finish();status.textContent='No response from the website. Check your connection and try again.';},20000);
  if(!await send('link',{code})){finish();status.textContent='Cannot contact CommunityHub. Please try again.';}
 });
 window.addEventListener('message',event=>{
  const message=event.data;if(!message)return;
  if(message.type==='linkResult'){
   finish();if(message.data?.ok){input.value='';status.textContent='Account linked successfully. Loading your profile…';}else status.textContent=message.data?.error||'Could not link your account. Generate a fresh code and try again.';
  }
  if(message.type==='profile'){
   const wasLinked=linked,player=message.data?.ok?message.data.player:null;linked=!!player;
   document.getElementById('linkConnected').classList.toggle('hidden',!linked);
   document.getElementById('linkConnectedName').textContent=player?.display_name||player?.discord_username||'';
   document.getElementById('linkBox').classList.toggle('hidden',linked);
   if(linked){finish();input.value='';status.textContent='Your game account is connected.';}
   else if(!pending){button.disabled=false;input.disabled=false;if(wasLinked||!status.textContent)status.textContent='Generate a code on the website to connect your account.';}
  }
 });
})();
