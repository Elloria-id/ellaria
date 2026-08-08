/* pages/forum/forum.js - small enhancement to existing forum page: sample threads & pagination */

const ForumPage = (function(){
  function init(){
    const listEl = document.getElementById('forum-list'); if(!listEl) return;
    // generate sample topics using CommunityService
    CommunityService.seedIfEmpty();
    const threads = CommunityService.listThreads().slice(0,20);
    listEl.innerHTML = threads.map(t=>`<div class="thread-card"><a href="/pages/community/thread.html?id=${t.id}"><strong>${t.title}</strong></a><div class="thread-meta">by ${t.author} • ${t.views} views</div></div>`).join('');
  }
  return { init };
})();

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', ()=>ForumPage.init()); else ForumPage.init();
