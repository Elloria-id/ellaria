/* pages/search/search.js - advanced filters + suggestions + trending + voice stub */

const SearchPage = (function(){
  let page = 1;
  const perPage = 18;
  let currentQuery = '';
  let currentFilters = {};
  let currentSort = 'relevance';

  function init(){
    // initialize dataset
    const data = SearchService.generateDummy(220);
    // optional: persist dataset into StorageService for other pages
    SearchService.setDataset(data);

    populateFilterOptions(data);
    populateTrending(data);

    document.getElementById('search-btn').addEventListener('click', ()=>{ page = 1; doSearch(); });
    document.getElementById('load-more-results').addEventListener('click', ()=>{ page++; doSearch(true); });

    document.getElementById('search-query').addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ page=1; doSearch(); } });

    document.getElementById('voice-search').addEventListener('click', () => {
      // simple UI stub. Replace with Web Speech API integration for real voice search.
      alert('Voice search stub: integrate Web Speech API here (TODO)');
    });

    document.getElementById('sort-by').addEventListener('change', (e)=>{ currentSort = e.target.value; page=1; doSearch(); });

    // basic suggestion: show top titles when typing
    const qIn = document.getElementById('search-query');
    qIn.addEventListener('input', ()=>{
      const val = qIn.value.trim();
      if(val.length < 2) return;
      const suggestions = data.filter(d => (d.title||'').toLowerCase().includes(val.toLowerCase())).slice(0,6);
      // show as trending tags list temporarily
      const tags = document.getElementById('trending-tags'); tags.innerHTML = suggestions.map(s=>`<div class="tag" data-q="${s.title}">${s.title}</div>`).join('');
      tags.querySelectorAll('.tag').forEach(t=> t.addEventListener('click', ()=>{ qIn.value = t.dataset.q; page=1; doSearch(); }));
    });

    // filter change
    document.getElementById('filter-genre').addEventListener('change', ()=>{ page=1; doSearch(); });
    document.getElementById('filter-type').addEventListener('change', ()=>{ page=1; doSearch(); });
    document.getElementById('filter-status').addEventListener('change', ()=>{ page=1; doSearch(); });
    document.getElementById('filter-author').addEventListener('input', ()=>{ page=1; doSearch(); });
    document.getElementById('filter-year').addEventListener('input', ()=>{ page=1; doSearch(); });

    // initial search to show suggestions
    doSearch();
  }

  function populateFilterOptions(data){
    const genres = Array.from(new Set(data.flatMap(d => d.genre || []))).sort();
    const types = Array.from(new Set(data.map(d => d.type))).sort();
    const statuses = Array.from(new Set(data.map(d => d.status))).sort();

    const gEl = document.getElementById('filter-genre'); genres.forEach(g => { const opt = document.createElement('option'); opt.value = g; opt.textContent = g; gEl.appendChild(opt); });
    const tEl = document.getElementById('filter-type'); types.forEach(t => { const opt = document.createElement('option'); opt.value = t; opt.textContent = t; tEl.appendChild(opt); });
    const sEl = document.getElementById('filter-status'); statuses.forEach(s => { const opt = document.createElement('option'); opt.value = s; opt.textContent = s; sEl.appendChild(opt); });
  }

  function populateTrending(data){
    // pick some high-view titles
    const top = data.sort((a,b)=> (b.views||0)-(a.views||0)).slice(0,8);
    const tags = document.getElementById('trending-tags'); if(!tags) return;
    tags.innerHTML = top.map(t => `<div class="tag" data-q="${t.title}">${t.title}</div>`).join('');
    tags.querySelectorAll('.tag').forEach(t=> t.addEventListener('click', ()=>{ document.getElementById('search-query').value = t.dataset.q; page=1; doSearch(); }));
  }

  function collectFilters(){
    const genreSel = Array.from(document.getElementById('filter-genre').selectedOptions).map(o=>o.value);
    const typeSel = Array.from(document.getElementById('filter-type').selectedOptions).map(o=>o.value);
    const statusSel = Array.from(document.getElementById('filter-status').selectedOptions).map(o=>o.value);
    const author = document.getElementById('filter-author').value.trim();
    const year = document.getElementById('filter-year').value.trim();
    const filters = {};
    if(genreSel.length) filters.genre = genreSel;
    if(typeSel.length) filters.type = typeSel;
    if(statusSel.length) filters.status = statusSel;
    if(author) filters.author = [author];
    if(year) filters.year = [year];
    return filters;
  }

  function renderResults(resultsObj, append=false){
    const grid = document.getElementById('results-grid'); if(!grid) return;
    const items = resultsObj.results;
    const html = items.map(it => `
      <article class="result-card">
        <img class="result-cover" src="${it.cover}" alt="${it.title}">
        <div>
          <h4>${it.title}</h4>
          <div class="result-meta">${it.author} • ${it.genre.join(', ')} • ${it.type} • ${it.year}</div>
          <div class="result-meta">Views: ${it.views} • Rating: ${it.rating}</div>
          <a class="btn" href="/pages/detail/detail.html?id=${it.id}">Detail</a>
        </div>
      </article>
    `).join('');
    if(append) grid.insertAdjacentHTML('beforeend', html); else grid.innerHTML = html;
    // hide load-more if no more
    const pager = document.getElementById('results-pager'); if(resultsObj.results.length < resultsObj.perPage) pager.style.display = 'none'; else pager.style.display = 'block';
  }

  function doSearch(append=false){
    currentQuery = document.getElementById('search-query').value.trim();
    currentFilters = collectFilters();
    currentSort = document.getElementById('sort-by').value;
    const res = SearchService.search({ query: currentQuery, filters: currentFilters, sort: currentSort, page, perPage });
    renderResults(res, append);
  }

  return { init };
})();

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', ()=>SearchPage.init()); else SearchPage.init();
