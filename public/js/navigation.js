(() => {
  const header=document.querySelector('.community-topnav'),toggle=document.querySelector('.topnav-toggle');
  function navigation(open){header?.classList.toggle('topnav-open',open);toggle?.setAttribute('aria-expanded',String(open));toggle?.setAttribute('aria-label',open?'Close navigation':'Open navigation');}
  toggle?.addEventListener('click',()=>navigation(toggle.getAttribute('aria-expanded')!=='true'));
  const groups=[...document.querySelectorAll('.topnav-group')];
  groups.forEach(group=>group.addEventListener('toggle',()=>{if(group.open)groups.forEach(other=>{if(other!==group)other.open=false;});}));
  document.querySelectorAll('.topnav-links a').forEach(link=>link.addEventListener('click',()=>navigation(false)));
  document.addEventListener('click',e=>groups.forEach(group=>{if(!group.contains(e.target))group.open=false;}));
  document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;const open=groups.find(g=>g.open);if(open){open.open=false;open.querySelector('summary').focus();}else if(toggle?.getAttribute('aria-expanded')==='true'){navigation(false);toggle.focus();}});
  matchMedia('(min-width:1051px)').addEventListener('change',e=>{if(e.matches)navigation(false);});
  document.querySelectorAll('[data-avatar-image]').forEach(img=>{const fallback=()=>img.hidden=true;img.addEventListener('error',fallback);if(img.complete&&!img.naturalWidth)fallback();});
  const dialog=document.getElementById('page-search'),input=document.getElementById('page-search-input');
  function search(){if(dialog&&!dialog.open){dialog.showModal();input?.focus();}}
  dialog?.addEventListener('cancel',()=>{dialog.close();});
  document.getElementById('search-open')?.addEventListener('click',search);document.getElementById('search-close')?.addEventListener('click',()=>dialog.close());
  document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)&&!e.target.isContentEditable){e.preventDefault();search();}});
  input?.addEventListener('input',()=>{let found=0;document.querySelectorAll('[data-search-link]').forEach(a=>{a.hidden=!a.textContent.toLowerCase().includes(input.value.toLowerCase().trim());if(!a.hidden)found++;});document.getElementById('search-empty').hidden=!!found;});
  const media=matchMedia('(prefers-color-scheme: dark)');let preference=document.cookie.match(/(?:^|; )communityhub_theme=(light|dark|system)(?:;|$)/)?.[1]||'dark';
  const modes=['dark','light','system'],names={dark:'Dark',light:'Light',system:'System'},icons={dark:'M20 15a8 8 0 0 1-11-11 8 8 0 1 0 11 11',light:'M12 3v2 M12 19v2 M3 12h2 M19 12h2 M5.6 5.6l1.4 1.4 M17 17l1.4 1.4 M5.6 18.4L7 17 M17 7l1.4-1.4 M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',system:'M3 4h18v13H3z M12 17v4 M8 21h8'};
  function theme(){document.documentElement.dataset.theme=preference==='system'?(media.matches?'dark':'light'):preference;document.querySelectorAll('[data-theme-toggle]').forEach(el=>{const next=modes[(modes.indexOf(preference)+1)%modes.length];el.dataset.mode=preference;el.querySelector('[data-theme-name]').textContent=names[preference];el.querySelector('[data-theme-icon]').setAttribute('d',icons[preference]);el.setAttribute('aria-label','Color theme: '+names[preference]+'. Switch to '+names[next]);el.title='Click to switch to '+names[next];});}
  document.querySelectorAll('[data-theme-toggle]').forEach(el=>el.addEventListener('click',()=>{preference=modes[(modes.indexOf(preference)+1)%modes.length];document.cookie='communityhub_theme='+preference+'; Path=/; Max-Age=31536000; SameSite=Lax'+(location.protocol==='https:'?'; Secure':'');theme();}));media.addEventListener('change',theme);theme();
  const menus=[...document.querySelectorAll('.account-dropdown')];document.addEventListener('click',e=>menus.forEach(menu=>{if(!menu.contains(e.target))menu.open=false;}));document.addEventListener('keydown',e=>{if(e.key==='Escape')menus.forEach(menu=>{if(menu.open){menu.open=false;menu.querySelector('summary').focus();}});});
})();
