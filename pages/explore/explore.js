/* pages/explore/explore.js
 * Infinite scroll stub and filter bar for Explore page.
 * Uses SearchService dataset when available, otherwise generates dummy data.
 */

const ExplorePage = (function(){
  let page = 1; const perPage = 24; let loading = false; let sort = 'popular';

  function init(){
    let dataTest = []; try { dataTest = SearchService.generateDummy(300); } catch(e){ dataTest = []; }
    SearchService.setDataset(dataTest);

    // attach filter controls
    const sortEl = document.getElementById('explore-sort'); if(sortEl){ sortEl.addEventListener('change', (e)=>{ sort = e.target.value; resetAndLoad(); }); }

    window.addEventListener('scroll', () => {
      if((window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 800)){
        loadMore();
      }
    });

    resetAndLoad();
  }

  function resetAndLoad(){
    page = 1; document.getElementById('explore-grid').innerHTML = ''; loadMore();
  }

  function loadMore(){
    if(loading) return; loading = true;
    const res = SearchService.search({ query: '', filters: {}, sort: sort, page, perPage });
    render(res.results, page>1);
    page++; loading = false;
  }

  function render(items, append=false){
    const grid = document.getElementById('explore-grid'); if(!grid) return;
    const html = items.map(it=>`<article class="card"><img src="${it.cover}" class="card-cover"><div class="card-body"><h4 class="card-title">${it.title}</h4><div class="card-meta">${it.author} • ${it.genre.join(', ')}</div><a class="btn" href="/pages/detail/detail.html?id=${it.id}">Buka</a></div></article>`).join('');
    if(append) grid.insertAdjacentHTML('beforeend', html); else grid.innerHTML = html;
  }

  return { init };
})();

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', ()=>ExplorePage.init()); else ExplorePage.init();
