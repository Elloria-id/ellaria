/* js/uploadService.js
 * Client-side upload service stub. Validates files and simulates upload progress.
 * Stores upload metadata under key 'uploads:list' via StorageService.
 * TODO: Replace this with signed uploads to cloud storage (S3/GCS) + server-side processing.
 */

const UploadService = (function(){
  const KEY = 'uploads:list';
  const ALLOWED = ['image/jpeg','image/png','image/webp','application/zip','application/pdf'];
  const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

  function list(){ return StorageService.get(KEY, []); }
  function save(arr){ StorageService.set(KEY, arr); }

  function validateFile(file){
    if(!file) return { ok:false, reason:'No file' };
    if(!ALLOWED.includes(file.type)) return { ok:false, reason:'File type not allowed: ' + file.type };
    if(file.size > MAX_BYTES) return { ok:false, reason:'File too large (max 10MB)' };
    return { ok:true };
  }

  function simulateUpload(file, onProgress){
    // returns a Promise that resolves to a simulated remote path and metadata
    return new Promise((resolve, reject) => {
      const validation = validateFile(file);
      if(!validation.ok) return reject(new Error(validation.reason));
      let uploaded = 0; const size = file.size || (5*1024*1024);
      const step = Math.max(1024*50, Math.floor(size / 60));
      const id = 'upl_' + Date.now();
      const interval = setInterval(()=>{
        uploaded = Math.min(size, uploaded + step);
        const pct = Math.round((uploaded/size)*100);
        onProgress && onProgress(pct);
        if(uploaded >= size){
          clearInterval(interval);
          // simulated remote path
          const remotePath = `/assets/uploads/${id}_${file.name}`;
          resolve({ id, name: file.name, size: size, type: file.type, remotePath });
        }
      }, 80 + Math.floor(Math.random()*120));
    });
  }

  function createUpload({ title, author='Anon', tags = [], fileMeta, status = 'draft' }){
    const arr = list();
    const now = Date.now();
    const item = {
      id: fileMeta && fileMeta.id ? fileMeta.id : 'upl_' + now,
      title: title || fileMeta && fileMeta.name || 'untitled',
      author,
      tags,
      fileName: fileMeta && fileMeta.name,
      fileSize: fileMeta && fileMeta.size,
      fileType: fileMeta && fileMeta.type,
      remotePath: fileMeta && fileMeta.remotePath,
      status, // draft | published | processing
      createdAt: now,
      updatedAt: now
    };
    arr.unshift(item); save(arr); return item;
  }

  function publish(id){ const arr = list(); const it = arr.find(x=>x.id===id); if(it){ it.status='published'; it.updatedAt = Date.now(); save(arr); } }
  function unpublish(id){ const arr = list(); const it = arr.find(x=>x.id===id); if(it){ it.status='draft'; it.updatedAt = Date.now(); save(arr); } }

  return { ALLOWED, MAX_BYTES, validateFile, simulateUpload, createUpload, list, publish, unpublish };
})();

window.UploadService = UploadService;
