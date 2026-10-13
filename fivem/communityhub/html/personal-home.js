(() => {
  const $ = id => document.getElementById(id);
  let visible = false, identity = null, generation = 0, busy = false, community = null;
  const node = (tag, text) => { const n = document.createElement(tag); n.textContent = text; return n; };
  const active = () => visible && !$('home').classList.contains('hidden');
  function badge(id, count) {
    $(id).textContent = count ? '(' + count + ')' : '';
    const page = id === 'trainingBadge' ? 'learning' : 'support';
    document.querySelectorAll(`[data-phone-page="${page}"],.tablet-tabs [data-page="${page}"]`).forEach(button => {
      let indicator = button.querySelector('.phone-badge');
      if (!indicator) { indicator = document.createElement('small'); indicator.className = 'phone-badge'; button.append(indicator); }
      indicator.textContent = count ? String(count) : ''; indicator.hidden = !count;
      indicator.setAttribute('aria-label', count + (page === 'learning' ? ' training items need attention' : ' tickets awaiting your reply'));
    });
  }
  function clear() {
    generation++; busy = false; $('homeRefresh').disabled = false;
    $('homeGreeting').textContent = 'Welcome'; $('homeUpdated').textContent = '';
    $('homeTraining').textContent = identity ? 'Loading your training…' : 'Link your account to view training.';
    $('homeSupport').textContent = identity ? 'Loading your tickets…' : 'Link your account to view your tickets.';
    $('homeAnnouncements').textContent = identity ? 'Waiting for community updates…' : 'Link your account to view community updates.';
    $('homeEvent').textContent = identity ? 'Waiting for upcoming events…' : 'Link your account to view community events.';
    badge('trainingBadge', 0); badge('supportBadge', 0);
  }
  function renderCommunity() {
    if (!identity || !community) return;
    const announcements = community.announcements || [];
    const latest = announcements[0];
    $('homeAnnouncements').replaceChildren(...(latest ? [node('strong', latest.title), node('p', latest.message || '')] : [node('p', 'No current announcements.')]));
    const next = [...(community.training || []), ...(community.calendar || [])].filter(e => Number.isFinite(Date.parse(e.start_at)) && Date.parse(e.start_at) >= Date.now()).sort((a,b) => Date.parse(a.start_at)-Date.parse(b.start_at))[0];
    $('homeEvent').replaceChildren(...(next ? [node('strong', next.title), node('p', new Date(next.start_at).toLocaleString()), node('small', next.location || next.event_type || 'Community event')] : [node('p', 'No upcoming events.')]));
  }
  function training(data) {
    const courses = (data.courses || []).filter(c => c.status !== 'completed');
    const renewals = (data.certifications || []).filter(c => ['expired','expiring'].includes(c.validity_status));
    const parts = [node('p', courses.length ? courses.length + (courses.length === 1 ? ' course to continue' : ' courses to continue') : 'Your assigned training is complete.')];
    for (const c of courses.slice(0, 3)) {
      const pct = Math.max(0, Math.min(100, Number(c.progress_percent) || 0));
      parts.push(node('strong', c.title), node('small', pct + '% complete'));
      const progress = document.createElement('progress'); progress.max = 100; progress.value = pct; progress.setAttribute('aria-label', c.title + ' progress'); parts.push(progress);
    }
    for (const c of renewals.slice(0, 3)) parts.push(node('p', c.name + (c.validity_status === 'expired' ? ' · expired' : ' · expires within 30 days')));
    $('homeTraining').replaceChildren(...parts); badge('trainingBadge', courses.length + renewals.length);
  }
  function support(data) {
    const open = (data.tickets || []).filter(t => !['closed','resolved'].includes(t.status));
    const replies = open.filter(t => t.status === 'waiting_on_member');
    const parts = [node('p', open.length + (open.length === 1 ? ' open ticket' : ' open tickets') + (replies.length ? ' · ' + replies.length + ' awaiting your reply' : ''))];
    for (const t of [...replies, ...open.filter(t => t.status !== 'waiting_on_member')].slice(0, 3)) parts.push(node('strong', '#' + t.id + ' · ' + t.subject), node('small', t.status === 'waiting_on_member' ? 'Staff replied · awaiting you' : 'Awaiting support'));
    $('homeSupport').replaceChildren(...parts); badge('supportBadge', replies.length);
  }
  async function refresh() {
    if (!active() || !identity || busy) return;
    const token = ++generation; busy = true; $('homeRefresh').disabled = true;
    $('homeUpdated').textContent = 'Checking your updates…';
    const results = await Promise.allSettled([window.communityHubRpc('lmsRead'), window.communityHubRpc('ticketsRead')]);
    if (token !== generation || !active()) { if(token === generation){busy=false;$('homeRefresh').disabled=false;} return; }
    results.forEach((result, index) => {
      const data = result.status === 'fulfilled' ? result.value : null;
      if (data?.ok) (index === 0 ? training : support)(data);
      else { $(index === 0 ? 'homeTraining' : 'homeSupport').textContent = data?.error || 'Updates unavailable. Try refreshing.'; badge(index === 0 ? 'trainingBadge' : 'supportBadge', 0); }
    });
    busy = false; $('homeRefresh').disabled = false;
    $('homeUpdated').textContent = 'Checked ' + new Date().toLocaleTimeString(); renderCommunity();
  }
  $('homeRefresh').onclick = () => { send('phoneReady'); refresh(); };
  document.addEventListener('click', event => {
    const shortcut = event.target.closest('#home [data-page]');
    if (shortcut) document.querySelector('.tablet-tabs [data-page="' + shortcut.dataset.page + '"]')?.click();
    if (event.target.closest('[data-page="home"],[data-phone-page="home"]')) refresh();
  });
  window.addEventListener('message', ({data:m}) => {
    if (m.type === 'profile') {
      const player = m.data?.ok ? m.data.player : null;
      const next = player ? String(player.id || player.display_name) : null;
      if (next !== identity) { identity = next; community = null; clear(); }
      if (player) { $('homeGreeting').textContent = 'Hello, ' + (player.display_name || 'member'); renderCommunity(); if (active()) refresh(); }
    }
    if (m.type === 'tabletData') { community = m.data?.ok === false ? null : m.data; renderCommunity(); }
    if (m.type === 'visible') { visible = !!m.visible; if (!visible) { identity = null; community = null; clear(); } else refresh(); }
  });
  setInterval(() => { if (active()) refresh(); }, 60000);
  clear();
})();
