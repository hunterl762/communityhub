(() => {
  const root=document.querySelector('[data-live-url]');
  if(!root)return;
  const notice=root.querySelector('[data-live-notice]');
  const make=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;};
  const duration=seconds=>{const minutes=Math.floor(Number(seconds||0)/60);return Math.floor(minutes/60)+'h '+minutes%60+'m';};
  const date=value=>value?new Date(value).toLocaleString():'Not received';
  function renderServers(data){
    const container=root.querySelector('[data-server-cards]');if(!container)return;
    const cards=data.servers.map(s=>{
      const card=make('article',undefined,'panel');const title=make('div',undefined,'server-title');
      title.append(make('h2',s.name),make('span',s.live?'Operational':'Offline','status-badge '+(s.live?'online':'offline')));
      card.append(title,make('p',s.current_players+' / '+s.max_players+' players'));const gameFresh=s.live&&s.game_clock_at&&Date.now()-new Date(s.game_clock_at).getTime()<90000;card.append(make('p','Game time: '+(gameFresh?String(s.game_hours).padStart(2,'0')+':'+String(s.game_minutes).padStart(2,'0'):'Awaiting game sample'),'muted'));
      const meta=make('dl',undefined,'server-meta');const total=Number(s.online_seconds)+Number(s.offline_seconds);
      for(const [label,value] of [['Recorded uptime · 30 days',total?(100*Number(s.online_seconds)/total).toFixed(2)+'%':'Collecting data'],['Online time',duration(s.online_seconds)],['Offline time',duration(s.offline_seconds)]]){const div=make('div');div.append(make('dt',label),make('dd',value));meta.append(div);}
      card.append(meta,make('p','Last heartbeat: '+date(s.last_heartbeat_at),'muted'),make('small','History begins: '+(s.tracked_since?date(s.tracked_since):'Not yet recorded')));return card;
    });
    container.replaceChildren(...(cards.length?cards:[make('p','No community servers are configured yet.','panel muted')]));
    const history=root.querySelector('[data-status-history]');if(!history)return;
    const rows=data.history.map(p=>{const row=make('article',undefined,'history-row');const heading=make('div');heading.append(make('strong',p.server_name),make('span',p.state==='online'?'Operational':'Offline','status-badge '+p.state));row.append(heading,make('p',date(p.started_at)+' → '+(p.ended_at?date(p.ended_at):'Ongoing')),make('small',duration(p.duration_seconds)));return row;});
    history.replaceChildren(...(rows.length?rows:[make('p','No status history yet.','muted')]));
  }
  function renderReviews(items,selector,kind){
    const list=root.querySelector(selector);if(!list||!items)return;
    const rows=items.map(item=>{const link=make('a',undefined,'admin-row');link.href='/admin/'+kind+'/'+item.id;const info=make('div');info.append(make('strong','#'+item.id+' · '+(kind==='applications'?item.form_title:item.report_type+(item.reported_name?' · '+item.reported_name:''))),make('div',(kind==='applications'?item.display_name||item.discord_username||'Unknown applicant':item.reporter_name||item.reporter_discord||'Unknown reporter')+' · '+date(kind==='applications'?item.submitted_at:item.created_at),'muted'));link.append(info,make('span',item.status.replaceAll('_',' '),'pill'));return link;});
    list.replaceChildren(...(rows.length?rows:[make('p','No '+kind+' have been submitted.','muted')]));
  }
  function renderClock(log){const target=root.querySelector('[data-patrol-log]');if(!target||!log)return;const rows=log.sessions.map(p=>{const row=make('article',undefined,'history-row');const heading=make('div');heading.append(make('strong',p.display_name||p.discord_username||'Member'),make('span',p.status==='active'?'On duty':'Completed','status-badge '+(p.status==='active'?'online':'')));row.append(heading,make('p',(p.server_name||'Community')+' · '+(p.department_name||'Unassigned')+' · '+(p.callsign||'No callsign')),make('p',date(p.clocked_in_at)+' → '+(p.clocked_out_at?date(p.clocked_out_at):'On duty')),make('small',duration(p.duration_seconds)));return row;});target.replaceChildren(...(rows.length?rows:[make('p','No patrol clock records yet.','muted')]));const events=root.querySelector('[data-clock-events]');if(events)events.replaceChildren(...log.events.map(e=>make('p',(e.display_name||e.discord_username)+' · '+(e.event_type==='clock_in'?'Clocked in':'Clocked out')+' · '+(e.source==='web'?'Website':'In game')+' · '+date(e.occurred_at))));}
  let updating=false;
  async function refresh(){
    if(document.hidden||updating)return;updating=true;
    try{
      const res=await fetch(root.dataset.liveUrl,{headers:{Accept:'application/json'},cache:'no-store'});
      if(!res.ok||res.redirected)throw new Error('Live update failed');
      const data=await res.json();if(!data.ok)throw new Error('Live update failed');
      if(data.clockLog)renderClock(data.clockLog);if(data.servers)renderServers(data);renderReviews(data.applications,'[data-review-apps]','applications');renderReviews(data.reports,'[data-review-reports]','reports');
      root.querySelectorAll('[data-live-stat]').forEach(el=>{const value=data.stats?.[el.dataset.liveStat];if(value!==undefined)el.textContent=value;});
      if(notice)notice.textContent='Updated '+new Date(data.updatedAt).toLocaleTimeString()+' · every 15 seconds';
    }catch{if(notice)notice.textContent='Live update unavailable. Showing the last received data; retrying shortly.';}
    finally{updating=false;}
  }
  const timer=setInterval(refresh,15000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});window.addEventListener('pagehide',()=>clearInterval(timer));refresh();
})();
