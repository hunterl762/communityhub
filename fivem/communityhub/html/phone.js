(() => {
  document.body.classList.add('phone-app');
  // LB Phone writes data-theme on the iframe body; shared styles use the root.
  function applyTheme(theme) {
    if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
  }
  function phoneTheme() { applyTheme(document.body.dataset.theme || globalThis.settings?.display?.theme); }
  phoneTheme();
  new MutationObserver(phoneTheme).observe(document.body, {attributes:true, attributeFilter:['data-theme']});
  if (typeof globalThis.onSettingsChange === 'function') globalThis.onSettingsChange(settings => applyTheme(settings?.display?.theme));
  window.addEventListener('message', ({data}) => {
    if (data?.type === 'settingsUpdated' || data?.action === 'settingsUpdated') applyTheme(data.settings?.display?.theme);
    if (data?.type === 'visible' && data.visible) phoneTheme();
  });
  const tablet = document.getElementById('tablet');
  const menu = tablet.querySelector('.tablet-tabs');
  menu.id = 'phoneMenu';
  menu.setAttribute('aria-label', 'All Community Hub pages');
  const dock = document.createElement('nav');
  dock.className = 'phone-dock';
  dock.setAttribute('aria-label', 'Phone navigation');
  for (const [page, label] of [['home', 'Overview'], ['learning', 'Training'], ['support', 'Support'], ['more', 'More']]) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.phonePage = page;
    const icon = menu.querySelector(`[data-page="${page}"] svg`);
    if (icon) button.append(icon.cloneNode(true));
    else {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', 'currentColor'); svg.setAttribute('stroke-width', '1.8');
      svg.innerHTML = '<path d="M4 6h16M4 12h16M4 18h16"/>'; button.append(svg);
    }
    button.querySelector('svg').setAttribute('aria-hidden', 'true');
    const text = document.createElement('span'); text.textContent = label; button.append(text);
    if (page === 'more') { button.setAttribute('aria-controls', menu.id); button.setAttribute('aria-expanded', 'false'); }
    dock.append(button);
  }
  tablet.append(dock);
  const more = dock.querySelector('[data-phone-page="more"]');
  function showMenu(open) {
    tablet.classList.toggle('phone-menu-open', open);
    tablet.querySelector('main').inert = open;
    more.setAttribute('aria-expanded', String(open));
    if (open) { menu.scrollTop = 0; menu.querySelector('button:not(.hidden)')?.focus(); }
  }
  function syncNavigation() {
    const active = menu.querySelector('button.active')?.dataset.page || 'home';
    dock.querySelectorAll('button').forEach(button => {
      const selected = button.dataset.phonePage === active || (button === more && !['home', 'learning', 'support'].includes(active));
      button.classList.toggle('active', selected);
      if (selected) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current');
    });
  }
  dock.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button === more) return showMenu(!tablet.classList.contains('phone-menu-open'));
    showMenu(false);
    menu.querySelector(`[data-page="${button.dataset.phonePage}"]`)?.click();
  });
  document.addEventListener('click', event => {
    if (event.target.closest('[data-page]')) {
      showMenu(false);
      syncNavigation();
      tablet.querySelector('main').scrollTop = 0;
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && tablet.classList.contains('phone-menu-open')) { showMenu(false); more.focus(); }
  });
  syncNavigation();
  window.dispatchEvent(new MessageEvent('message', {data: {type: 'visible', visible: true}}));
})();
