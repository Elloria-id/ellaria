/* pages/history/history.js
 * Client-side reading history recording and simple statistics/calendar view.
 * Exposes History.record(seriesId, chapterId, progressSeconds) to be called
 * by reader when a chapter is opened/closed.
 */

const History = (function(){
  const KEY = 'history';

  function get(){ return StorageService.get(KEY, []); }
  function save(list){ StorageService.set(KEY, list); }

  function record(seriesId, chapterId, progressSeconds = 0){
    const list = get();
    list.unshift({ id: 'h_' + Math.random().toString(36).slice(2,9), seriesId, chapterId, timestamp: Date.now(), progressSeconds });
    // keep max 500 entries
    if(list.length > 500) list.length = 500;
    save(list);
    render();
  }

  function render(){
    const container = document.getElementById('history-list');
    if(!container) return;
    const list = get();
    if(list.length === 0){
      const empty = document.getElementById('empty-state'); if(empty) empty.style.display = 'block';
      container.innerHTML = '';
      return;
    }
    const rows = list.slice(0,200).map(it => {
      const d = new Date(it.timestamp);
      return `<div class="history-card"><div class="history-meta">${d.toLocaleString()}</div><div>Series: ${it.seriesId} • Chapter: ${it.chapterId} • Progress: ${Math.round(it.progressSeconds)}s</div></div>`;
    }).join('');
    container.innerHTML = rows;
  }

  function clearAll(){ if(confirm('Hapus semua riwayat?')){ save([]); render(); } }

  function exportJSON(){ const json = StorageService.exportJSON(KEY); const blob = new Blob([json],{type:'application/json'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='ellaria-history.json'; a.click(); URL.revokeObjectURL(url); }

  function attach(){
    // add simple controls
    const container = document.querySelector('.section-container');
    if(container && !document.getElementById('history-controls')){
      const el = document.createElement('div'); el.id = 'history-controls'; el.style.marginBottom = 'var(--sp-md)';
      el.innerHTML = `<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="clear-history-btn">Hapus Semua</button><button class="btn" id="export-history">Export JSON</button></div>`;
      container.insertBefore(el, container.firstChild);
      document.getElementById('clear-history-btn').addEventListener('click', clearAll);
      document.getElementById('export-history').addEventListener('click', exportJSON);
    }
  }

  return { init(){ attach(); render(); }, record, clearAll, exportJSON };
})();

// expose globally
window.History = History;
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', ()=>History.init()); else History.init();
