/* pages/wallet/wallet.js
 * Simulated wallet: balance + transactions stored in StorageService
 * Keys: 'wallet:balance' (number), 'wallet:transactions' (array)
 */

const WalletApp = (function(){
  const BAL_KEY = 'wallet:balance';
  const TX_KEY = 'wallet:transactions';

  function getBalance(){ return StorageService.get(BAL_KEY, 0); }
  function setBalance(v){ StorageService.set(BAL_KEY, v); }
  function getTx(){ return StorageService.get(TX_KEY, []); }
  function setTx(arr){ StorageService.set(TX_KEY, arr); }

  function formatIDR(num){ return 'Rp ' + (num||0).toLocaleString('id-ID'); }

  function render(){
    document.getElementById('wallet-balance').textContent = formatIDR(getBalance());
    const list = getTx();
    const el = document.getElementById('transactions-list');
    if(!el) return;
    if(list.length===0) el.innerHTML = '<p class="muted">Belum ada transaksi</p>';
    else el.innerHTML = list.map(t => `<div class="transaction"><div><strong>${t.title}</strong><div class="muted">${new Date(t.timestamp).toLocaleString()}</div></div><div>${t.type==='in' ? '+' : '-'} ${formatIDR(t.amount)}</div></div>`).join('');
  }

  function openModal(title, bodyHtml, onConfirm){
    const modal = document.getElementById('modal');
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHtml;
    modal.style.display = 'flex';
    const onConfirmBtn = document.getElementById('modal-confirm');
    const onCancelBtn = document.getElementById('modal-cancel');
    function cleanup(){ modal.style.display='none'; onConfirmBtn.replaceWith(onConfirmBtn.cloneNode(true)); onCancelBtn.replaceWith(onCancelBtn.cloneNode(true)); }
    onConfirmBtn.addEventListener('click', ()=>{ cleanup(); onConfirm && onConfirm(); });
    onCancelBtn.addEventListener('click', ()=>{ cleanup(); });
  }

  function topUp(){
    // show quick choices (use shop items as well)
    const body = `
      <p>Pilih paket top up (simulasi):</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
        <button class="btn" id="tp1">100 Coins - Rp 10.000</button>
        <button class="btn" id="tp2">500 Coins - Rp 45.000</button>
        <button class="btn" id="tp3">VIP 1 Month - Rp 99.000</button>
      </div>
    `;
    openModal('Top Up', body, ()=>{
      // fallback: if no selection default add 10000
      // but attach listeners for specific buttons before confirm
      // We'll simulate success by default adding 10000, but if a button was clicked it will set a chosen value
    });

    // attach handlers to simulate selection
    setTimeout(()=>{
      const tp1 = document.getElementById('tp1'); const tp2 = document.getElementById('tp2'); const tp3 = document.getElementById('tp3');
      let chosen = 10000;
      tp1.addEventListener('click', ()=> chosen = 10000);
      tp2.addEventListener('click', ()=> chosen = 45000);
      tp3.addEventListener('click', ()=> chosen = 99000);
      document.getElementById('modal-confirm').addEventListener('click', ()=>{
        // apply chosen
        const bal = getBalance(); setBalance(bal + chosen);
        const tx = getTx(); tx.unshift({ id: 'tx_'+Date.now(), title: 'Top Up', amount: chosen, type:'in', timestamp: Date.now() }); setTx(tx);
        render(); alert('Top up simulated: ' + formatIDR(chosen));
      }, { once:true });
    }, 50);
  }

  function withdraw(){
    openModal('Tarik Saldo', '<p>Masukkan jumlah yang ingin ditarik (simulasi)</p><input id="withdraw-amt" type="number" style="width:100%;padding:8px;margin-top:8px">', ()=>{
      const amt = Number(document.getElementById('withdraw-amt').value || 0);
      const bal = getBalance();
      if(amt <= 0) return alert('Jumlah tidak valid');
      if(amt > bal) return alert('Saldo tidak cukup');
      setBalance(bal - amt);
      const tx = getTx(); tx.unshift({ id: 'tx_'+Date.now(), title: 'Withdraw', amount: amt, type:'out', timestamp: Date.now() }); setTx(tx);
      render(); alert('Withdraw simulated: ' + formatIDR(amt));
    });
  }

  function init(){
    // ensure defaults
    if(StorageService.get(BAL_KEY) === null) StorageService.set(BAL_KEY, 0);
    if(StorageService.get(TX_KEY) === null) StorageService.set(TX_KEY, []);

    document.getElementById('topup-btn').addEventListener('click', topUp);
    document.getElementById('withdraw-btn').addEventListener('click', withdraw);

    render();
  }

  return { init };
})();

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', ()=>WalletApp.init()); else WalletApp.init();
