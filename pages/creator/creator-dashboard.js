/* pages/creator/creator-dashboard.js */

document.addEventListener('DOMContentLoaded', ()=>{
  const draftsEl = document.getElementById('creator-drafts');
  const balanceEl = document.getElementById('creator-balance');

  function render(){
    const all = UploadService.list();
    const drafts = all.filter(x=> x.status !== 'published');
    draftsEl.innerHTML = drafts.length ? drafts.map(d=>`<div style="padding:8px;border-radius:8px;background:rgba(255,255,255,0.02);margin-bottom:8px"><strong>${d.title}</strong><div class="muted">${d.fileName} • ${d.status}</div><div style="margin-top:8px"><button class="btn" data-id="${d.id}" data-action="publish">Publish</button></div></div>`).join('') : '<p class="muted">No drafts</p>';
    draftsEl.querySelectorAll('button[data-action]').forEach(b=> b.addEventListener('click', (e)=>{ const id = e.currentTarget.dataset.id; UploadService.publish(id); render(); }));

    const bal = StorageService.get('wallet:balance', 0);
    balanceEl.innerHTML = `<div class="muted">Balance</div><div style="font-weight:700">Rp ${bal.toLocaleString('id-ID')}</div>`;
  }

  render();
});
