/* pages/reader/reader.js
 * Basic reader controls (modes, brightness, bg color, auto-scroll, save progress)
 * Works with localStorage via StorageService. Exposes Reader.saveProgress(seriesId, chapterId, percent)
 */

const Reader = (function(){
  const PREF_KEY = 'reader:preferences';
  const PROG_KEY = 'reader:progress';
  let autosaveTimer = null;

  function getPrefs(){ return StorageService.get(PREF_KEY, { mode:'vertical', brightness:1, bg:'#0b1020', autoScroll:false, readingDirection:'ltr' }); }
  function savePrefs(p){ StorageService.set(PREF_KEY, p); }

  function saveProgressObj(){
    // keep as map {seriesId:{chapterId:percent}}
    const obj = StorageService.get(PROG_KEY, {});
    StorageService.set(PROG_KEY, obj);
  }

  function setBrightness(v){
    document.documentElement.style.setProperty('--reader-brightness', v);
    const p = getPrefs(); p.brightness = v; savePrefs(p);
  }

  function setBgColor(c){
    document.documentElement.style.setProperty('--reader-bg', c);
    const p = getPrefs(); p.bg = c; savePrefs(p);
  }

  function setMode(m){
    const p = getPrefs(); p.mode = m; savePrefs(p);
    document.body.setAttribute('data-reader-mode', m);
  }

  function setReadingDirection(dir){ const p = getPrefs(); p.readingDirection = dir; savePrefs(p); document.documentElement.dir = dir; }

  function toggleAutoScroll(){ const p = getPrefs(); p.autoScroll = !p.autoScroll; savePrefs(p); if(p.autoScroll) startAutoScroll(); else stopAutoScroll(); }

  function startAutoScroll(){ stopAutoScroll(); autosaveTimer = setInterval(()=>{ window.scrollBy(0,1); }, 50); }
  function stopAutoScroll(){ if(autosaveTimer) { clearInterval(autosaveTimer); autosaveTimer = null; } }

  function saveProgress(seriesId, chapterId, percent){
    const key = PROG_KEY;
    const obj = StorageService.get(key, {});
    if(!obj[seriesId]) obj[seriesId] = {};
    obj[seriesId][chapterId] = { percent, updatedAt: Date.now() };
    StorageService.set(key, obj);
    // also add to history
    if(window.History && typeof window.History.record === 'function'){
      window.History.record(seriesId, chapterId, Math.round(percent*100));
    }
  }

  function getProgress(seriesId, chapterId){ const obj = StorageService.get(PROG_KEY, {}); return (obj[seriesId] && obj[seriesId][chapterId]) ? obj[seriesId][chapterId] : null; }

  function attachControls(){
    // Create overlay controls if not present
    if(document.getElementById('reader-controls')) return;
    const ctr = document.createElement('div'); ctr.id = 'reader-controls'; ctr.style.position='fixed'; ctr.style.bottom='18px'; ctr.style.left='18px'; ctr.style.zIndex=1200; ctr.style.display='flex'; ctr.style.gap='8px';
    ctr.innerHTML = `
      <button class="btn" id="mode-vertical">Vertical</button>
      <button class="btn" id="mode-horizontal">Horizontal</button>
      <button class="btn" id="mode-page">Page</button>
      <button class="btn" id="toggle-autoscroll">AutoScroll</button>
      <button class="btn" id="fullscreen-toggle">Fullscreen</button>
    `;
    document.body.appendChild(ctr);
    document.getElementById('mode-vertical').addEventListener('click', ()=> setMode('vertical'));
    document.getElementById('mode-horizontal').addEventListener('click', ()=> setMode('horizontal'));
    document.getElementById('mode-page').addEventListener('click', ()=> setMode('page'));
    document.getElementById('toggle-autoscroll').addEventListener('click', ()=> toggleAutoScroll());
    document.getElementById('fullscreen-toggle').addEventListener('click', ()=> {
      if(!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen();
    });
  }

  function attachBrightnessPicker(){
    if(document.getElementById('reader-brightness')) return;
    const el = document.createElement('div'); el.id='reader-brightness'; el.style.position='fixed'; el.style.top='18px'; el.style.right='18px'; el.style.zIndex=1200; el.innerHTML=`Brightness: <input type='range' id='reader-brightness-range' min='0.2' max='1.4' step='0.1' value='1'>`;
    document.body.appendChild(el);
    const range = document.getElementById('reader-brightness-range'); range.addEventListener('input',(e)=> setBrightness(e.target.value));
  }

  function attach(){
    const pref = getPrefs(); setMode(pref.mode); setBrightness(pref.brightness); setBgColor(pref.bg); if(pref.autoScroll) startAutoScroll(); document.documentElement.dir = pref.readingDirection || 'ltr'; attachControls(); attachBrightnessPicker();

    // autosave current progress every 10s if meta attributes present on body
    setInterval(()=>{
      const sid = document.body.dataset.seriesId; const cid = document.body.dataset.chapterId; const pct = window.__ellaria_reader_percent || 0;
      if(sid && cid) saveProgress(sid, cid, pct);
    }, 10000);

    window.addEventListener('beforeunload', ()=>{
      const sid = document.body.dataset.seriesId; const cid = document.body.dataset.chapterId; const pct = window.__ellaria_reader_percent || 0;
      if(sid && cid) saveProgress(sid, cid, pct);
    });
  }

  return { init(){ attach(); }, saveProgress }
})();

window.Reader = Reader;
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', ()=> Reader.init()); else Reader.init();
