/* Upload JS - prevent actual upload; show TODO where to integrate */
document.addEventListener('DOMContentLoaded', ()=>{
  const f = document.getElementById('upload-form');
  f.addEventListener('submit', (e)=>{
    e.preventDefault();
    alert('TODO: implement upload with server/Firebase. Form values captured here.');
  });
});
