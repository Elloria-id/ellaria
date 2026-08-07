/* VIP JS - stubbed list of packages */
const VIP = (function(){
  const PACKS = [{id:1,name:'VIP 1 Month',price:99000},{id:2,name:'VIP 6 Month',price:499000}];
  function render(){
    const el = document.getElementById('vip-cards'); if(!el) return;
    el.innerHTML = PACKS.map(p=>`<div class="vip-card"><h3>${p.name}</h3><div>Rp ${p.price}</div><button class="btn" onclick="alert('TODO: purchase ${p.id}')">Beli</button></div>`).join('');
  }
  return { init(){ render(); } }
})();
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>VIP.init()); else VIP.init();
