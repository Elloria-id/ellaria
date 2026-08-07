/* Shop JS - dummy items (client only). Replace purchaseItem with server-side call. */

const Shop = (function(){
  const ITEMS = [
    {id:1, name:'100 Coins', price:10000, desc:'Pack of 100 coins'},
    {id:2, name:'500 Coins', price:45000, desc:'Pack of 500 coins'},
    {id:3, name:'VIP 1 Month', price:99000, desc:'Monthly VIP membership'}
  ];

  function render(){
    const grid = document.getElementById('shop-grid');
    if(!grid) return;
    grid.innerHTML = ITEMS.map(i=>`<div class="shop-card"><h3>${i.name}</h3><p>${i.desc}</p><div><strong>Rp ${i.price}</strong></div><button onclick="Shop.purchase(${i.id})" class="btn">Beli</button></div>`).join('');
  }

  return {
    init(){ render(); },
    purchase(id){
      // TODO: replace with server side payment/session creation
      alert('TODO: create payment session for item id:'+id);
    }
  }
})();

if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded',()=>Shop.init()); } else { Shop.init(); }
