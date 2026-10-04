(() => {
  const publicToggle=document.querySelector('.public-menu-toggle'),publicHeader=document.querySelector('.community-public-header');
  function publicMenu(open){if(!publicToggle||!publicHeader)return;publicHeader.classList.toggle('public-menu-open',open);publicToggle.setAttribute('aria-expanded',String(open));publicToggle.setAttribute('aria-label',open?'Close menu':'Open menu');}
  publicToggle?.addEventListener('click',()=>publicMenu(publicToggle.getAttribute('aria-expanded')!=='true'));
  document.getElementById('public-menu')?.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>publicMenu(false)));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&publicToggle?.getAttribute('aria-expanded')==='true'){publicMenu(false);publicToggle.focus();}});
  matchMedia('(min-width:761px)').addEventListener('change',e=>{if(e.matches)publicMenu(false);});
  const sidebar=document.getElementById('hub-navigation'),toggle=document.getElementById('drawer-toggle');let lastFocus;
  function drawer(open){if(!sidebar)return;if(open)lastFocus=document.activeElement;document.body.classList.toggle('drawer-open',open);document.querySelectorAll('main,footer,.hub-topbar,.mobile-bottom').forEach(el=>{el.inert=open;});toggle?.setAttribute('aria-expanded',String(open));if(open)sidebar.querySelector('a')?.focus();else lastFocus?.focus();}
  document.querySelectorAll('[data-drawer-open]').forEach(b=>b.addEventListener('click',()=>drawer(true)));
  toggle?.addEventListener('click',()=>drawer(!document.body.classList.contains('drawer-open')));
  document.querySelectorAll('[data-drawer-close]').forEach(b=>b.addEventListener('click',()=>drawer(false)));
  sidebar?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>drawer(false)));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('drawer-open'))drawer(false);if(e.key==='Tab'&&document.body.classList.contains('drawer-open')){const items=[...sidebar.querySelectorAll('a,button')].filter(el=>el.getClientRects().length);const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
  matchMedia('(min-width:761px)').addEventListener('change',e=>{if(e.matches&&document.body.classList.contains('drawer-open'))drawer(false);});
  const dialog=document.getElementById('page-search'),input=document.getElementById('page-search-input');
  function search(){if(dialog&&!dialog.open){dialog.showModal();input?.focus();}}
  dialog?.addEventListener('cancel',()=>{dialog.close();});
  document.getElementById('search-open')?.addEventListener('click',search);document.getElementById('search-close')?.addEventListener('click',()=>dialog.close());
  document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)&&!e.target.isContentEditable){e.preventDefault();search();}});
  input?.addEventListener('input',()=>{let found=0;document.querySelectorAll('[data-search-link]').forEach(a=>{a.hidden=!a.textContent.toLowerCase().includes(input.value.toLowerCase().trim());if(!a.hidden)found++;});document.getElementById('search-empty').hidden=!!found;});
  const media=matchMedia('(prefers-color-scheme: dark)');let preference=document.cookie.match(/(?:^|; )communityhub_theme=(light|dark|system)(?:;|$)/)?.[1]||'dark';
  function theme(){document.documentElement.dataset.theme=preference==='system'?(media.matches?'dark':'light'):preference;}
  document.querySelectorAll('[data-theme-control]').forEach(el=>{el.value=preference;el.addEventListener('change',()=>{preference=el.value;document.cookie='communityhub_theme='+preference+'; Path=/; Max-Age=31536000; SameSite=Lax'+(location.protocol==='https:'?'; Secure':'');theme();});});media.addEventListener('change',theme);
  const menus=[...document.querySelectorAll('.account-dropdown')];document.addEventListener('click',e=>menus.forEach(menu=>{if(!menu.contains(e.target))menu.open=false;}));document.addEventListener('keydown',e=>{if(e.key==='Escape')menus.forEach(menu=>{if(menu.open){menu.open=false;menu.querySelector('summary').focus();}});});
})();
