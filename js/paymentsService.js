/* js/paymentsService.js
 * Client-side payments stub for creators. Uses StorageService.
 * Keys:
 *  - payments:transactions (array of { id, userId, type, amount, status, createdAt, meta })
 *  - creator:balance:{userId} (number)
 *
 * Methods:
 *  - PaymentsService.getBalance(userId)
 *  - PaymentsService.credit(userId, amount, meta)
 *  - PaymentsService.debit(userId, amount, meta)
 *  - PaymentsService.requestWithdraw(userId, amount, destination)
 *  - PaymentsService.listTransactions(userId)
 *  - PaymentsService.processWithdraw(id, action) // admin
 */

const PaymentsService = (function(){
  const TX_KEY = 'payments:transactions';
  function _list(){ return StorageService.get(TX_KEY, []); }
  function _save(arr){ StorageService.set(TX_KEY, arr); }

  function _balKey(userId){ return `creator:balance:${userId}`; }
  function getBalance(userId){ return StorageService.get(_balKey(userId), 0); }
  function _setBalance(userId, v){ StorageService.set(_balKey(userId), v); }

  function _newId(){ return 'tx_' + Math.random().toString(36).slice(2,9); }

  function credit(userId, amount, meta = {}){
    const now = Date.now(); const id = _newId();
    const tx = { id, userId, type:'credit', amount, status:'settled', createdAt: now, meta };
    const arr = _list(); arr.unshift(tx); _save(arr);
    const bal = getBalance(userId); _setBalance(userId, bal + amount);
    return tx;
  }

  function debit(userId, amount, meta = {}){
    const now = Date.now(); const id = _newId();
    const bal = getBalance(userId);
    if(amount > bal) throw new Error('Insufficient balance');
    const tx = { id, userId, type:'debit', amount, status:'settled', createdAt: now, meta };
    const arr = _list(); arr.unshift(tx); _save(arr);
    _setBalance(userId, bal - amount);
    return tx;
  }

  function requestWithdraw(userId, amount, destination = null){
    const now = Date.now(); const id = _newId();
    const bal = getBalance(userId);
    if(amount <= 0) throw new Error('Invalid amount');
    if(amount > bal) throw new Error('Insufficient balance');
    // create pending withdrawal
    const tx = { id, userId, type:'withdraw', amount, status:'pending', createdAt: now, meta:{ destination } };
    const arr = _list(); arr.unshift(tx); _save(arr);
    // do not debit balance until processed by admin
    return tx;
  }

  function listTransactions(userId = null){ const arr = _list(); return userId ? arr.filter(x=> x.userId===userId) : arr; }

  function processWithdraw(txId, action = 'approve'){ // admin action
    const arr = _list(); const tx = arr.find(x=> x.id===txId); if(!tx) throw new Error('Not found');
    if(tx.type !== 'withdraw') throw new Error('Not a withdrawal');
    if(tx.status !== 'pending') throw new Error('Already processed');
    if(action === 'approve'){
      // debit balance and mark settled
      const bal = getBalance(tx.userId);
      if(tx.amount > bal) { tx.status = 'failed'; tx.meta.reason = 'Insufficient funds'; }
      else { _setBalance(tx.userId, bal - tx.amount); tx.status = 'settled'; tx.meta.processedAt = Date.now(); }
    } else {
      tx.status = 'cancelled'; tx.meta.cancelledAt = Date.now(); tx.meta.cancelReason = 'admin_cancelled';
    }
    _save(arr);
    return tx;
  }

  function seedIfEmpty(){ const u = _list(); if(u.length === 0){ credit('alice', 150000, { note:'Initial credit' }); credit('bob', 50000, { note:'Welcome promo' }); } }

  return { getBalance, credit, debit, requestWithdraw, listTransactions, processWithdraw, seedIfEmpty };
})();

window.PaymentsService = PaymentsService;
