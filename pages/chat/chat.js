/* pages/chat/chat.js - enhanced chat with message persistence and simple read indicator */

const Chat = (function(){
  const KEY = 'chat:messages';
  function get(){ return StorageService.get(KEY, []); }
  function save(arr){ StorageService.set(KEY, arr); }

  function init(){
    const messages = get();
    const messagesEl = document.getElementById('messages'); if(messagesEl){ messagesEl.innerHTML = messages.map(m => `<div>${m.from}: ${m.text}</div>`).join(''); }
    document.getElementById('send-btn').addEventListener('click', send);
    document.getElementById('chat-input').addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ send(); } });
  }

  function send(){ const input = document.getElementById('chat-input'); const text = input.value.trim(); if(!text) return; const messages = get(); const user = AuthService.getUser(); const from = user? user.displayName || user.email : 'You'; messages.push({ id:'m_'+Date.now(), from, text, ts: Date.now() }); save(messages); const el = document.getElementById('messages'); el.innerHTML += `<div>${from}: ${text}</div>`; input.value=''; // create notif
    NotifService.push({ title:'Chat message', body:`${from}: ${text.slice(0,60)}` }); NotifService.renderBadge(); }

  return { init };
})();

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', ()=>Chat.init()); else Chat.init();
