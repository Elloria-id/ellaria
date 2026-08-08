/* js/notifService.js
 * Local notifications queue using StorageService. Keys: 'notifications:list'
 * Notification structure: { id, type, title, body, data, read, createdAt }
 * For production, replace with push service & server-sent events / push subscriptions.
 */

const NotifService = (function(){
  const KEY = 'notifications:list';

  function list(){ return StorageService.get(KEY, []); }
  function save(arr){ StorageService.set(KEY, arr); }

  function genId(){ return 'n_' + Math.random().toString(36).slice(2,9); }

  function push({ type='info', title='', body='', data=null }){
    const arr = list();
    const n = { id: genId(), type, title, body, data, read:false, createdAt: Date.now() };
    arr.unshift(n); save(arr); renderBadge(); return n;
  }

  function markRead(id){ const arr = list(); const it = arr.find(x=>x.id===id); if(it){ it.read = true; save(arr); renderBadge(); } }
  function markAllRead(){ const arr = list(); arr.forEach(x=> x.read = true); save(arr); renderBadge(); }
  function clearAll(){ save([]); renderBadge(); }

  function getUnreadCount(){ return list().filter(x=>!x.read).length; }

  function renderBadge(){ const el = document.getElementById('notif-badge'); if(!el) return; const c = getUnreadCount(); el.textContent = c>0? String(c): ''; el.style.display = c>0? 'inline-block':'none'; }

  function attachPanel(){
    // create a panel in DOM if not present
    if(document.getElementById('notif-panel')) return;
    const btn = document.querySelector('.navbar-container'); if(!btn) return;
    const wrap = document.createElement('div'); wrap.id = 'notif-panel'; wrap.style.position = 'fixed'; wrap.style.right='18px'; wrap.style.top='72px'; wrap.style.zIndex = 1400; wrap.style.maxWidth='360px';
    const inner = document.createElement('div'); inner.className = 'notif-inner'; inner.style.background='var(--surface)'; inner.style.padding='12px'; inner.style.borderRadius='12px'; inner.style.boxShadow='0 8px 30px rgba(0,0,0,0.5)';
    inner.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><strong>Notifications</strong><div><button class="btn" id="mark-read-all">Mark all read</button><button class="btn btn-secondary" id="clear-notifs">Clear</button></div></div><div id="notif-list" style="margin-top:8px"></div>`;
    wrap.appendChild(inner); document.body.appendChild(wrap);
    document.getElementById('mark-read-all').addEventListener('click', ()=>{ markAllRead(); renderPanel(); });
    document.getElementById('clear-notifs').addEventListener('click', ()=>{ clearAll(); renderPanel(); });
    renderPanel();
  }

  function renderPanel(){ const listEl = document.getElementById('notif-list'); if(!listEl) return; const items = list(); if(items.length===0) listEl.innerHTML = '<p class="muted">No notifications</p>'; else listEl.innerHTML = items.map(n=>`<div style="padding:8px;border-radius:8px;background:${n.read?'rgba(255,255,255,0.02)':'rgba(2,194,255,0.06)'};margin-bottom:8px"><strong>${n.title}</strong><div class="muted" style="font-size:12px">${new Date(n.createdAt).toLocaleString()}</div><div style="margin-top:6px">${n.body}</div><div style="margin-top:6px"><button class="btn" data-id="${n.id}">Mark Read</button></div></div>`).join('');
    listEl.querySelectorAll('button[data-id]').forEach(b=> b.addEventListener('click',(e)=>{ markRead(e.currentTarget.dataset.id); renderPanel(); })); renderBadge(); }

  // small helper to try native notifications (requires permission & https)
  function tryNative(n){ if(!('Notification' in window)) return; if(Notification.permission === 'granted'){ new Notification(n.title, { body: n.body }); } else if(Notification.permission !== 'denied'){ Notification.requestPermission().then(p=>{ if(p==='granted') new Notification(n.title,{ body: n.body }); }); } }

  return { list, push, markRead, markAllRead, clearAll, getUnreadCount, renderBadge, attachPanel, tryNative };
})();

window.NotifService = NotifService;
