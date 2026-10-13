(() => {
  document.body.classList.add('phone-app');
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
    button.textContent = label;
    if (page === 'more') { button.setAttribute('aria-controls', menu.id); button.setAttribute('aria-expanded', 'false'); }
    dock.append(button);
  }
  tablet.append(dock);
  const more = dock.querySelector('[data-phone-page="more"]');
  function showMenu(open) {
    tablet.classList.toggle('phone-menu-open', open);
    tablet.querySelector('main').inert = open;
    more.setAttribute('aria-expanded', String(open));
    if (open) menu.querySelector('button:not(.hidden)')?.focus();
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
