/* pages/register/register.js */

document.addEventListener('DOMContentLoaded', ()=>{
  const form = document.getElementById('register-form');
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const fd = new FormData(form);
    const displayName = fd.get('displayName');
    const email = fd.get('email');
    const password = fd.get('password');
    try{
      AuthService.register({ email, password, displayName });
      alert('Registered (stub) and signed in');
      window.location.href = '/pages/profile/profile.html';
    } catch(err){ alert('Error: ' + err.message); }
  });
});
