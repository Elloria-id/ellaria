/* pages/admin/upload.js */

document.addEventListener('DOMContentLoaded', ()=>{
  const form = document.getElementById('upload-form');
  const fileInput = document.getElementById('file-input');
  const uploadsList = document.getElementById('uploads-list');
  const progressModal = document.getElementById('progress-modal');
  const progressBar = document.getElementById('progress-bar');
  const progressClose = document.getElementById('progress-close');

  function renderUploads(){
    const arr = UploadService.list();
    uploadsList.innerHTML = arr.map(u=>`<div class="upload-item"><div><strong>${u.title}</strong><div class="muted">${u.fileName} • ${u.status}</div></div><div><button class="btn" data-id="${u.id}" data-action="publish">Publish</button><button class="btn btn-secondary" data-id="${u.id}" data-action="unpublish">Unpublish</button></div></div>`).join('');
    uploadsList.querySelectorAll('button[data-action]').forEach(b=> b.addEventListener('click', (e)=>{
      const id = e.currentTarget.dataset.id; const action = e.currentTarget.dataset.action; if(action==='publish') UploadService.publish(id); else UploadService.unpublish(id); renderUploads();
    }));
  }

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const title = document.getElementById('title').value.trim();
    const tags = document.getElementById('tags').value.split(',').map(s=>s.trim()).filter(Boolean);
    const file = fileInput.files[0];
    if(!file) return alert('File required');
    const v = UploadService.validateFile(file);
    if(!v.ok) return alert('Validation failed: ' + v.reason);

    // show progress modal
    progressModal.style.display = 'flex'; progressBar.style.width = '0%';
    try{
      const meta = await UploadService.simulateUpload(file, (pct)=>{ progressBar.style.width = pct + '%'; });
      // create metadata entry
      const user = window.AuthService && AuthService.getUser ? AuthService.getUser() : null;
      UploadService.createUpload({ title, author: user? user.displayName || user.email : 'Guest', tags, fileMeta: meta, status: 'draft' });
      renderUploads();
      alert('Upload simulated and saved as draft');
    } catch(err){ alert('Upload error: ' + err.message); }
  });

  progressClose.addEventListener('click', ()=>{ progressModal.style.display = 'none'; });

  // initial render
  renderUploads();
});
