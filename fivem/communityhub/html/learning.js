(() => {
  const $=id=>document.getElementById(id),node=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
  let visible=false,identity=null,generation=0,website=null;
  const active=()=>visible&&!$('learning').classList.contains('hidden');
  const date=value=>value?new Date(value).toLocaleDateString():'No expiry';
  const status=value=>String(value||'not_started').replaceAll('_',' ');
  function safeUrl(value){try{const u=new URL(value),base=new URL(website);return ['http:','https:'].includes(u.protocol)&&u.origin===base.origin&&/^\/lms(?:\/courses\/\d+)?\/?$/.test(u.pathname)&&!u.username&&!u.password&&!u.search&&!u.hash?u.href:null;}catch{return null;}}
  function openWebsite(url){const safe=safeUrl(url);if(!safe)return;generation++;
    if(typeof window.invokeNative==='function'){fetch('https://'+GetParentResourceName()+'/close',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}).then(()=>window.invokeNative('openUrl',safe)).catch(()=>$('learningStatus').textContent='Unable to open the website. Try again.');}
    else window.open(safe,'_blank','noopener,noreferrer');
  }
  function link(article,url,label){if(!safeUrl(url))return;const b=node('button',label);b.className='secondary';b.onclick=()=>openWebsite(url);article.append(b);}
  function group(title,items,render,empty){const section=node('section');section.className='learning-group';section.append(node('h3',title));if(!items.length)section.append(node('p',empty));else for(const item of items)section.append(render(item));return section;}
  function course(c,requirements,catalog=false){const a=node('article');a.className='learning-course';a.append(node('h4',c.title));
    if(catalog){if(c.description)a.append(node('p',c.description));a.append(node('small','Available course · '+(c.estimated_minutes?c.estimated_minutes+' minutes · ':'')+'Assessment pass mark '+c.passing_score+'%'));}
    else{const pct=Math.min(100,Math.max(0,Number(c.progress_percent)||0));a.append(node('p',status(c.status)+' · '+pct+'% complete'+(c.final_score!=null?' · Final score '+Number(c.final_score).toFixed(0)+'%':'')));const progress=node('progress');progress.max=100;progress.value=pct;progress.setAttribute('aria-label',c.title+' progress');a.append(progress);}
    const r=catalog?c:requirements;
    if(r){if(r.prerequisites?.length)a.append(node('small','Prerequisites: '+r.prerequisites.map(p=>p.title+' ('+(Number(p.completed)?'complete':'needed')+')').join(', ')));if(r.required_lessons?.length){const details=node('details');details.append(node('summary','Required lessons and assessments'));const list=node('ul');for(const l of r.required_lessons)list.append(node('li',l.title+' · '+(l.lesson_type==='quiz'?'Assessment · ':'')+status(l.status)+(l.score!=null?' · '+Number(l.score).toFixed(0)+'%':'')));details.append(list);a.append(details);}}
    if(c.course_status==='archived'||c.course_status==='draft')a.append(node('small','This course is unavailable. Contact training staff.'));else link(a,c.website_url,catalog?'View course on website':c.status==='completed'?'Review on website':'Continue on website');return a;
  }
  function clear(){generation++;website=null;$('learningWebsite').disabled=true;$('learningContent').replaceChildren();$('learningStatus').textContent='';$('learningRefresh').disabled=false;}
  async function load(){if(!active())return;const token=++generation;$('learningRefresh').disabled=true;$('learningStatus').textContent='Loading your training…';
    try{const data=await window.communityHubRpc('lmsRead');if(token!==generation||!active())return;if(!data.ok)throw Error(data.error||'Training is unavailable.');website=data.website_url;$('learningWebsite').disabled=!safeUrl(website);
      const requirements=new Map(data.available_courses.map(c=>[Number(c.id),c])),assigned=new Set(data.courses.map(c=>Number(c.id)));
      $('learningContent').replaceChildren(group('Assigned and current training',data.courses.filter(c=>c.status!=='completed'),c=>course(c,requirements.get(Number(c.id))),'You have no assigned or current courses.'),group('Completed training',data.courses.filter(c=>c.status==='completed'),c=>course(c,requirements.get(Number(c.id))),'You have no completed courses yet.'),group('Certifications',data.certifications,c=>{const a=node('article');a.className='learning-course';a.append(node('h4',c.name),node('p',c.validity_status==='expired'?'Expired · renewal required':c.validity_status==='expiring'?'Expires within 30 days':'Valid'),node('small','Awarded '+date(c.awarded_at)+' · '+(c.expires_at?'Expires '+date(c.expires_at):'No expiry')));if(c.validity_status==='expired'||c.validity_status==='expiring')a.append(node('p','Contact training staff to arrange renewal.'));return a;},'You have no certifications yet.'),group('Available courses',data.available_courses.filter(c=>!assigned.has(Number(c.id))),c=>course(c,null,true),'No additional courses are currently available.'));
      $('learningStatus').textContent='Updated '+new Date(data.updated_at).toLocaleTimeString()+'. Refreshes while this page is open.';
    }catch(e){if(token===generation&&active()){website=null;$('learningWebsite').disabled=true;$('learningContent').replaceChildren();$('learningStatus').textContent=e.message;}}
    finally{if(token===generation)$('learningRefresh').disabled=false;}
  }
  $('learningRefresh').onclick=load;$('learningWebsite').onclick=()=>openWebsite(website);
  document.querySelector('.tablet-tabs [data-page="learning"]').addEventListener('click',load);
  window.addEventListener('message',({data:m})=>{if(m.type==='profile'){const next=m.data?.player?.id||null;if(next!==identity){identity=next;clear();if(active())load();}}if(m.type==='visible'){visible=!!m.visible;if(!visible)clear();else if(active())load();}});
  setInterval(()=>{if(active())load();},60000);
})();
