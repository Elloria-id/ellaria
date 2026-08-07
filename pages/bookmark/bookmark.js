/* pages/bookmark/bookmark.js
 * Implements client-side bookmark management (folders, collections, import/export)
 * Uses StorageService (localStorage) under key 'bookmarks' and 'bookmarkFolders'
 */

const BookmarkApp = (function(){
  const BOOKMARK_KEY = 'bookmarks';
  const FOLDER_KEY = 'bookmarkFolders';

  function defaultState(){
    return { id: generateId(), seriesId: null, title: 'Sample Series', cover: '/assets/images/covers/cover1.jpg', status: 'reading', folder: 'default', createdAt: Date.now(), updatedAt: Date.now() };
  }

  function generateId(){
    return 'bm_' + Math.random().toString(36).slice(2,9);
  }

  function getBookmarks(){
    return StorageService.get(BOOKMARK_KEY, []);
  }
  function saveBookmarks(list){
    StorageService.set(BOOKMARK_KEY, list);
  }

  function getFolders(){
    return StorageService.get(FOLDER_KEY, ['default']);
  }
  function saveFolders(list){
    StorageService.set(FOLDER_KEY, list);
  }

  function render(){
    const grid = document.getElementById('bookmarks-grid');
    const empty = document.getElementById('empty-state');
    if(!grid) return;
    const bookmarks = getBookmarks();
    if(bookmarks.length === 0){
      if(empty) empty.style.display = 'block';
      grid.innerHTML = '';
      return;
    }
    if(empty) empty.style.display = 'none';

    grid.innerHTML = bookmarks.map(b => `
      <article class="card">
        <img src="${b.cover}" alt="${b.title}" class="card-cover">
        <div class="card-body">
          <h3 class="card-title">${b.title}</h3>
          <div class="card-meta">Status: ${b.status} • Folder: ${b.folder}</div>
          <div class="card-actions">
            <button class="btn btn-sm" onclick="BookmarkApp.remove('${b.id}')">Remove</button>
            <button class="btn btn-sm" onclick="BookmarkApp.moveToFolder('${b.id}')">Move</button>
          </div>
        </div>
      </article>
    `).join('');
  }

  function addSample(){
    const list = getBookmarks();
    list.unshift(defaultState());
    saveBookmarks(list);
    render();
  }

  function remove(id){
    let list = getBookmarks();
    list = list.filter(b => b.id !== id);
    saveBookmarks(list);
    render();
  }

  function moveToFolder(id){
    const folder = prompt('Move to folder (type new name to create):');
    if(!folder) return;
    const list = getBookmarks();
    const it = list.find(b => b.id === id);
    if(it){ it.folder = folder; it.updatedAt = Date.now(); saveBookmarks(list); }
    const folders = getFolders();
    if(!folders.includes(folder)) folders.push(folder); saveFolders(folders);
    render();
  }

  function createFolder(){
    const name = prompt('Folder name:');
    if(!name) return;
    const folders = getFolders();
    if(!folders.includes(name)) { folders.push(name); saveFolders(folders); alert('Folder created: ' + name); }
  }

  function exportJSON(){
    const json = StorageService.exportJSON(BOOKMARK_KEY);
    const blob = new Blob([json], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'ellaria-bookmarks.json'; a.click(); URL.revokeObjectURL(url);
  }

  function importJSONFile(file){
    const reader = new FileReader();
    reader.onload = function(e){
      try{ const parsed = JSON.parse(e.target.result); if(Array.isArray(parsed)){ StorageService.set(BOOKMARK_KEY, parsed); render(); alert('Imported bookmarks'); } else alert('Invalid format'); } catch(e){ alert('Invalid JSON'); }
    };
    reader.readAsText(file);
  }

  function exportCSV(){
    const csv = StorageService.exportCSV(BOOKMARK_KEY);
    const blob = new Blob([csv], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'ellaria-bookmarks.csv'; a.click(); URL.revokeObjectURL(url);
  }

  function importCSVFile(file){
    // simple CSV parse (expects header row matching keys). For complex cases, replace with proper CSV parser.
    const reader = new FileReader();
    reader.onload = function(e){
      const txt = e.target.result;
      const lines = txt.split(/\r?\n/).filter(Boolean);
      if(lines.length < 2) return alert('No rows');
      const headers = lines[0].split(',').map(h => h.trim());
      const rows = lines.slice(1).map(l => l.split(',').map(cell => cell.replace(/^"|"$/g, '')));
      const arr = rows.map(r => { const obj = {}; headers.forEach((h,i)=> obj[h]=r[i]); obj.id = obj.id || generateId(); return obj; });
      StorageService.set(BOOKMARK_KEY, arr);
      render();
      alert('Imported CSV');
    };
    reader.readAsText(file);
  }

  function attach(){
    // add control toolbar dynamically if not present
    const container = document.querySelector('.section-container');
    if(container && !document.getElementById('bookmark-controls')){
      const controls = document.createElement('div'); controls.id = 'bookmark-controls'; controls.className = 'bookmark-controls';
      controls.innerHTML = `
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:var(--sp-md)">
          <button class="btn" id="add-sample">Add Sample</button>
          <button class="btn" id="create-folder">Create Folder</button>
          <button class="btn" id="export-json">Export JSON</button>
          <button class="btn" id="export-csv">Export CSV</button>
          <label class="btn">Import JSON<input type="file" id="import-json-file" style="display:none"></label>
          <label class="btn">Import CSV<input type="file" id="import-csv-file" style="display:none"></label>
        </div>
      `;
      container.insertBefore(controls, container.firstChild);
      document.getElementById('add-sample').addEventListener('click', addSample);
      document.getElementById('create-folder').addEventListener('click', createFolder);
      document.getElementById('export-json').addEventListener('click', exportJSON);
      document.getElementById('export-csv').addEventListener('click', exportCSV);
      document.getElementById('import-json-file').addEventListener('change', (e)=> importJSONFile(e.target.files[0]));
      document.getElementById('import-csv-file').addEventListener('change', (e)=> importCSVFile(e.target.files[0]));
    }

    // attach tabs behaviour already present
    const tabs = document.querySelectorAll('.category-tabs .tab');
    tabs.forEach(t => t.addEventListener('click', (e) => {
      tabs.forEach(x=>x.classList.remove('active')); e.currentTarget.classList.add('active');
      // filter by category
      const cat = e.currentTarget.dataset.category;
      const all = getBookmarks();
      const filtered = all.filter(b => {
        if(cat === 'favorites') return b.favorite;
        if(cat === 'reading') return b.status === 'reading';
        if(cat === 'completed') return b.status === 'completed';
        if(cat === 'planned') return b.status === 'planned';
        if(cat === 'dropped') return b.status === 'dropped';
        return true;
      });
      // render filtered directly
      const grid = document.getElementById('bookmarks-grid'); if(!grid) return;
      grid.innerHTML = filtered.map(b => `\n      <article class="card">\n        <img src="${b.cover}" alt="${b.title}" class="card-cover">\n        <div class="card-body">\n          <h3 class="card-title">${b.title}</h3>\n          <div class="card-meta">Status: ${b.status} • Folder: ${b.folder}</div>\n        </div>\n      </article>\n    `).join('');
    }));
  }

  return { init(){ attach(); render(); }, remove, moveToFolder, exportJSON, exportCSV, importCSVFile, importJSONFile };
})();

// expose globally for inline handlers
window.BookmarkApp = BookmarkApp;

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', ()=>BookmarkApp.init()); else BookmarkApp.init();
