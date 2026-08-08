/* js/analyticsService.js
 * Lightweight analytics wrapper. Default writes events to localStorage (dev) and
 * supports a GA4 client-side example. Replace or extend provider integration in one place.
 * Storage key: 'analytics:events'
 */

const AnalyticsService = (function(){
  const KEY = 'analytics:events';
  let provider = 'local';
  let config = {};
  let optOut = StorageService.get('analytics:optout', false);

  function persistEvent(e){
    const arr = StorageService.get(KEY, []);
    arr.unshift(e);
    StorageService.set(KEY, arr);
  }

  function ga4Send(eventName, params){
    // Example GA4 gtag push. Requires adding GA snippet in production.
    try{
      if(window.gtag){ window.gtag('event', eventName, params); }
    } catch(e){ /* noop */ }
  }

  function init(cfg = {}){
    provider = cfg.provider || 'local';
    config = cfg;
    optOut = StorageService.get('analytics:optout', false);
  }

  function pageView(path){ if(optOut) return; const ev = { type:'pageview', path, ts:Date.now() }; persistEvent(ev); if(provider==='ga4') ga4Send('page_view', { page_path: path }); }

  function trackEvent(name, params={}){ if(optOut) return; const ev = { type:'event', name, params, ts:Date.now() }; persistEvent(ev); if(provider==='ga4') ga4Send(name, params); }

  function setUserId(id){ if(optOut) return; StorageService.set('analytics:userId', id); if(provider==='ga4') ga4Send('set_user_id', { user_id: id }); }

  function getEvents(){ return StorageService.get(KEY, []); }

  function clearEvents(){ StorageService.set(KEY, []); }

  function exportEvents(){ const data = getEvents(); return JSON.stringify(data, null, 2); }

  function optOutToggle(v){ StorageService.set('analytics:optout', !!v); optOut = !!v; }

  function isOptedOut(){ return optOut; }

  return { init, pageView, trackEvent, setUserId, getEvents, clearEvents, exportEvents, optOutToggle, isOptedOut };
})();

window.AnalyticsService = AnalyticsService;
