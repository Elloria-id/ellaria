/* Wallet JS - stubbed. Replace with API calls to server or Firestore */
const Wallet = (function(){
  let balance = 0;
  const transactions = [];

  function render(){
    document.getElementById('wallet-balance').textContent = 'Rp ' + balance;
    const txEl = document.getElementById('wallet-transactions');
    txEl.innerHTML = transactions.length ? transactions.map(t=>`<div>${t}</div>`).join('') : '<p class="muted">Belum ada transaksi</p>';
  }

  return {
    init(){
      document.getElementById('topup-btn').addEventListener('click', ()=> alert('TODO: open top-up flow'));
      document.getElementById('withdraw-btn').addEventListener('click', ()=> alert('TODO: open withdraw flow'));
      render();
    }
  };
})();

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>Wallet.init()); else Wallet.init();
