/* pages/community/community.js
 * Frontend for community listing & creating threads + small thread viewer
 */

const CommunityPage = (function(){
  function init(){
    CommunityService.seedIfEmpty();
    renderThreads();
    document.getElementById('create-thread').addEventListener('click', ()=>{
      const title = document.getElementById('new-thread-title').value.trim();
      if(!title) return alert('Title required');
      const user = AuthService.getUser();
      const author = user ? user.displayName || user.email : 'Guest';
      const t = CommunityService.createThread({ title, author, content: 'Topic created' });
      document.getElementById('new-thread-title').value = '';
      NotifService.push({ title: 'New thread', body: `Topik baru: ${t.title}`, data:{ threadId: t.id } });
      NotifService.tryNative({ title: 'New thread', body: `Topik baru: ${t.title}` });
      renderThreads();
    });

    document.getElementById('open-notif').addEventListener('click', ()=>{ NotifService.attachPanel(); NotifService.renderBadge(); });
    NotifService.renderBadge();
  }

  function renderThreads(){
    const list = CommunityService.listThreads();
    const el = document.getElementById('threads-list'); if(!el) return;
    el.innerHTML = list.map(t => `<div class="thread-card"><div><a href="/pages/community/thread.html?id=${t.id}"><strong>${t.title}</strong></a><div class="thread-meta">by ${t.author} • ${t.views} views • ${new Date(t.updatedAt).toLocaleString()}</div></div><div><button class="btn" data-id="${t.id}" data-action="open">View</button></div></div>`).join('');
    el.querySelectorAll('button[data-action="open"]').forEach(b=> b.addEventListener('click',(e)=>{ const id = e.currentTarget.dataset.id; window.location.href = `/pages/community/thread.html?id=${id}`; }));
  }

  return { init };
})();

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', ()=>CommunityPage.init()); else CommunityPage.init();
