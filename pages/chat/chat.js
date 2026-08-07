/* Chat JS - stub. Replace with realtime integration (Firebase / sockets) */
const Chat = (function(){
  function init(){
    document.getElementById('send-btn').addEventListener('click', ()=>{
      const text = document.getElementById('chat-input').value.trim();
      if(!text) return;
      const m = document.createElement('div'); m.textContent = 'You: ' + text; document.getElementById('messages').appendChild(m);
      document.getElementById('chat-input').value = '';
    });
  }
  return {init};
})();
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>Chat.init()); else Chat.init();
