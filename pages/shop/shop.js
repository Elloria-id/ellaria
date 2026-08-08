/* pages/shop/shop.js
 * Shop catalog + simulated checkout. Uses StorageService and wallet keys.
 * shop items stored under 'shop:items' as array. Wallet update uses 'wallet:balance' and 'wallet:transactions'.
 */

const ShopApp = (function(){
  const ITEMS_KEY = 'shop:items';
  const BAL_KEY = 'wallet:balance';
  const TX_KEY = 'wallet:transactions';

  function defaultItems(){
    return [
      { id:'itm_100c', title:'100 Coins', price:10000, type:'coin', desc:'Pack of 100 coins', sku:'COIN100' },
      { id:'itm_500c', title:'500 Coins', price:45000, type:'coin', desc:'Pack of 500 coins', sku:'COIN500' },
      { id:'itm_vip_1m', title:'VIP 1 Month', price:99000, type:'vip', desc:'Monthly VIP membership (simulated)', sku:'VIP1M' }
    ];
  }

  function getItems(){
    let it = StorageService.get(ITEMS_KEY);
    if(!it){ it = defaultItems(); StorageService.set(ITEMS_KEY, it); }
    return it;
  }

  function render(){
    const grid = document.getElementById('shop-grid'); if(!grid) return;
    const items = getItems();
    grid.innerHTML = items.map(i=>`<div class="shop-card"><h4>${i.title}</h4><div class="muted">${i.desc}</div><div class="shop-price">Rp ${i.price.toLocaleString('id-ID')}</div><div style="margin-top:8px"><button class="btn" onclick="ShopApp.buy('${i.id}')">Beli</button></div></div>`).join('');
  }

  function openCheckout(item){
    const modal = document.getElementById('checkout-modal');
    const body = document.getElementById('checkout-body');
    body.innerHTML = `<div><strong>${item.title}</strong><div class="muted">${item.desc}</div><div style="margin-top:8px">Harga: <strong>Rp ${item.price.toLocaleString('id-ID')}</strong></div><div style="margin-top:8px">Pilihan pembayaran: <em>Simulated QRIS / Topup</em></div>`;
    modal.style.display = 'flex';

    // attach handlers
    const confirm = document.getElementById('checkout-confirm'); const cancel = document.getElementById('checkout-cancel');
    function cleanup(){ modal.style.display='none'; confirm.replaceWith(confirm.cloneNode(true)); cancel.replaceWith(cancel.cloneNode(true)); }
    confirm.addEventListener('click', ()=>{ cleanup(); processPurchase(item); }, { once:true });
    cancel.addEventListener('click', ()=>{ cleanup(); }, { once:true });
  }

  function processPurchase(item){
    // automatic behavior: if balance >= price then deduct; otherwise show topup modal
    const bal = StorageService.get(BAL_KEY, 0);
    if(bal >= item.price){
      StorageService.set(BAL_KEY, bal - item.price);
      const tx = StorageService.get(TX_KEY, []);
      tx.unshift({ id:'tx_'+Date.now(), title: `Purchase ${item.title}`, amount: item.price, type:'out', timestamp: Date.now(), sku: item.sku });
      StorageService.set(TX_KEY, tx);
      // if VIP, record membership (simplified)
      if(item.type === 'vip'){
        const mems = StorageService.get('vip:memberships', []);
        mems.unshift({ id:'vip_'+Date.now(), sku:item.sku, start: Date.now(), expires: Date.now() + 30*24*60*60*1000 });
        StorageService.set('vip:memberships', mems);
      }
      alert('Pembelian berhasil (simulasi). Saldo telah dipotong.');
    } else {
      // prompt topup modal with QRIS sandbox info
      openQRISModal(item);
    }
    // refresh wallet page if open
  }

  function openQRISModal(item){
    // simple QRIS instructions modal
    const modal = document.getElementById('checkout-modal');
    const body = document.getElementById('checkout-body');
    body.innerHTML = `
      <div>
        <p>Saldo Anda tidak cukup. Anda dapat melakukan Top Up terlebih dahulu atau gunakan metode pembayaran eksternal.</p>
        <p class="muted">QRIS Sandbox (simulasi): scan QR yang disimulasikan di production. This is a UI-only placeholder.</p>
        <div style="background:#fff;padding:12px;border-radius:8px;margin-top:8px;text-align:center">[QR IMAGE PLACEHOLDER]</div>
      </div>
    `;
    modal.style.display = 'flex';
    document.getElementById('checkout-confirm').addEventListener('click', ()=>{
      // simulate topup success then apply purchase
      // add 100k then retry
      const bal = StorageService.get(BAL_KEY,0); StorageService.set(BAL_KEY, bal + 100000);
      alert('Top up simulated (Rp 100.000) — saldo diperbarui. Pembelian akan diproses ulang.');
      modal.style.display='none';
      processPurchase(item);
    }, { once:true });
    document.getElementById('checkout-cancel').addEventListener('click', ()=>{ modal.style.display='none'; }, { once:true });
  }

  return { init(){ render(); }, buy(id){ const it = getItems().find(x=>x.id===id); if(it) openCheckout(it); } };
})();

window.ShopApp = ShopApp;
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', ()=>ShopApp.init()); else ShopApp.init();
