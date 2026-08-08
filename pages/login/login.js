/* pages/login/login.js */

document.addEventListener('DOMContentLoaded', ()=>{
  const form = document.getElementById('login-form');
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const fd = new FormData(form);
    const email = fd.get('email');
    const password = fd.get('password');
    try{
      AuthService.signIn({ email, password });
      alert('Signed in (stub)');
      window.location.href = '/pages/profile/profile.html';
    } catch(err){ alert('Error: ' + err.message); }
  });

  document.getElementById('google-login').addEventListener('click', ()=>{ AuthService.signInWithProvider('google'); window.location.href = '/pages/profile/profile.html'; });
  document.getElementById('discord-login').addEventListener('click', ()=>{ AuthService.signInWithProvider('discord'); window.location.href = '/pages/profile/profile.html'; });
});
