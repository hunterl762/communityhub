const menus = [...document.querySelectorAll('.site-nav details')];
menus.forEach(menu => menu.addEventListener('toggle', () => {
  if (menu.open) menus.forEach(other => { if (other !== menu) other.open = false; });
}));
document.addEventListener('click', event => {
  menus.forEach(menu => { if (!menu.contains(event.target)) menu.open = false; });
});
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  const current = menus.find(menu => menu.open && menu.contains(document.activeElement));
  menus.forEach(menu => { menu.open = false; });
  if (current) current.querySelector('summary').focus();
});
