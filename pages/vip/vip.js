/* pages/vip/vip.js
 * Simple VIP listing. Purchasing handled via ShopApp (shop:items) simulation.
 */

const VIPApp = (function(){
  function getPacks(){
    return [
      { id:'vip_1m', title:'VIP 1 Month', price:99000, desc:'Monthly VIP membership: early access, ad-free, bonus coins' },
      { id:'vip_6m', title:'VIP 6 Months', price:499000, desc:'6 months VIP, save more' }
    ];
  }

  function render(){
    const el = document.getElementById('vip-cards'); if(!el) return;
    el.innerHTML = getPacks().map(p=>`<div class="vip-card"><h3>${p.title}</h3><div class="muted">${p.desc}</div><div style="margin-top:8px"><strong>Rp ${p.price.toLocaleString('id-ID')}</strong></div><div style="margin-top:8px"><button class="btn" onclick="ShopApp.buy('itm_vip_1m')">Beli</button></div></div>`).join('');
  }

  return { init(){ render(); } };
})();

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', ()=>VIPApp.init()); else VIPApp.init();
