/* pages/profile/profile.js */

const ProfilePage = (function(){
  function render(){
    const user = AuthService.getUser();
    const card = document.getElementById('profile-card');
    if(!user){
      card.innerHTML = `<div class="empty-state"><p>Anda belum masuk. <a href="/pages/login/login.html">Masuk</a> atau <a href="/pages/register/register.html">Daftar</a></p></div>`;
      document.getElementById('profile-actions').innerHTML = '';
      return;
    }
    card.innerHTML = `
      <img class="profile-avatar" src="${user.avatar || '/assets/images/avatar/default.jpg'}" alt="avatar">
      <div class="profile-body">
        <h2>${user.displayName || user.email}</h2>
        <p class="muted">Member sejak: ${new Date(user.createdAt||Date.now()).toLocaleDateString()}</p>
        <p class="muted">Email: ${user.email}</p>
      </div>
    `;

    const actions = document.getElementById('profile-actions');
    actions.innerHTML = `<button class="btn" id="edit-profile">Edit Profile</button><button class="btn btn-secondary" id="signout">Sign out</button>`;
    document.getElementById('signout').addEventListener('click', ()=>{ AuthService.signOut(); render(); alert('Signed out (stub)'); location.reload(); });
    document.getElementById('edit-profile').addEventListener('click', ()=>{ editProfile(user); });

    // load collections from StorageService (bookmarks as sample)
    const collectionsEl = document.getElementById('my-collections');
    const bms = StorageService.get('bookmarks', []);
    collectionsEl.innerHTML = bms.length ? bms.map(b=>`<div class="card" style="display:inline-block;margin:8px;padding:8px;border-radius:8px">${b.title}</div>`).join('') : '<p class="muted">Belum ada koleksi</p>';

    // followers/following stub
    const followEl = document.getElementById('follow-stats'); followEl.innerHTML = '<div>Followers: <strong>0</strong> • Following: <strong>0</strong></div>';
  }

  function editProfile(user){
    const name = prompt('Nama tampilan:', user.displayName || '');
    if(name){ user.displayName = name; AuthService.register({ email: user.email, password: '***', displayName: user.displayName }); alert('Profile updated (stub)'); render(); }
  }

  return { init(){ render(); } };
})();

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', ()=>ProfilePage.init()); else ProfilePage.init();
