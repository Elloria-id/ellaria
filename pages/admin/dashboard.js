/* pages/admin/dashboard.js - simple dashboard visuals (client-only) */

document.addEventListener('DOMContentLoaded', ()=>{
  const statsArea = document.getElementById('stats-area');
  const uploadsEl = document.getElementById('admin-uploads');

  function renderStats(){
    const uploads = UploadService.list();
    const total = uploads.length;
    const published = uploads.filter(u=>u.status==='published').length;
    const drafts = uploads.filter(u=>u.status!=='published').length;
    statsArea.innerHTML = `<div>Total uploads: <strong>${total}</strong></div><div>Published: <strong>${published}</strong></div><div>Drafts: <strong>${drafts}</strong></div>`;
  }

  function renderUploads(){
    const uploads = UploadService.list();
    uploadsEl.innerHTML = uploads.map(u=>`<div style="padding:8px;border-radius:8px;background:rgba(255,255,255,0.02);margin-bottom:8px"><strong>${u.title}</strong><div class="muted">${u.fileName} • ${u.status}</div><div style="margin-top:8px"><button class="btn" data-id="${u.id}" data-action="publish">Publish</button><button class="btn btn-secondary" data-id="${u.id}" data-action="unpublish">Unpublish</button></div></div>`).join('');
    uploadsEl.querySelectorAll('button[data-action]').forEach(b=> b.addEventListener('click', (e)=>{ const id = e.currentTarget.dataset.id; const act = e.currentTarget.dataset.action; if(act==='publish') UploadService.publish(id); else UploadService.unpublish(id); renderUploads(); renderStats(); }));
  }

  renderStats(); renderUploads();
});
