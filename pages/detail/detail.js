/* pages/detail/detail.js
 * Small wiring for detail page: populate series info and manage counters (view/like/bookmark)
 * Uses query param `?id=SERIESID` to identify series. Data stored in localStorage under 'series:meta'
 */

const DetailPage = (function(){
  const KEY = 'series:meta';

  function getSeriesId(){
    const params = new URLSearchParams(window.location.search);
    return params.get('id') || 'series_example_1';
  }

  function loadSeriesMeta(){
    const map = StorageService.get(KEY, {});
    return map[getSeriesId()] || { id:getSeriesId(), title:'Series Title', author:'Unknown', cover:'/assets/images/covers/cover1.jpg', genre:['Action'], views:0, likes:0, bookmarks:0, comments:[] };
  }

  function saveSeriesMeta(meta){
    const map = StorageService.get(KEY, {});
    map[meta.id] = meta; StorageService.set(KEY, map);
  }

  function incrementView(){
    const sid = getSeriesId(); const meta = loadSeriesMeta();
    // only count once per session
    const sessionKey = 'viewed:' + sid;
    if(!sessionStorage.getItem(sessionKey)){
      meta.views = (meta.views||0) + 1; saveSeriesMeta(meta); sessionStorage.setItem(sessionKey, '1');
    }
  }

  function render(){
    const container = document.getElementById('series-info'); if(!container) return;
    const meta = loadSeriesMeta();
    container.innerHTML = `
      <div class="detail-card">
        <img src="${meta.cover}" alt="${meta.title}" class="detail-cover">
        <div class="detail-body">
          <h2 class="detail-title">${meta.title}</h2>
          <div class="detail-meta">${meta.genre.join(', ')} • by ${meta.author}</div>
          <div class="detail-stats">Views: <strong id="meta-views">${meta.views}</strong> • Likes: <strong id="meta-likes">${meta.likes}</strong> • Bookmarks: <strong id="meta-bookmarks">${meta.bookmarks}</strong></div>
          <div class="detail-actions">
            <button class="btn" id="btn-like">Like</button>
            <button class="btn" id="btn-bookmark">Bookmark</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-like').addEventListener('click', ()=>{ like(); });
    document.getElementById('btn-bookmark').addEventListener('click', ()=>{ bookmark(); });
  }

  function like(){ const meta = loadSeriesMeta(); meta.likes = (meta.likes||0) + 1; saveSeriesMeta(meta); document.getElementById('meta-likes').textContent = meta.likes; }
  function bookmark(){ const meta = loadSeriesMeta(); meta.bookmarks = (meta.bookmarks||0) + 1; saveSeriesMeta(meta); document.getElementById('meta-bookmarks').textContent = meta.bookmarks; }

  function init(){ incrementView(); render(); }
  return { init };
})();

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', ()=> DetailPage.init()); else DetailPage.init();
