/* js/abTestService.js
 * Simple client-side A/B testing assignment with persistent bucketing via localStorage.
 * Usage:
 *   AbTest.assign('hero_banner_color', ['blue','green'], 0.1); // 10% sample
 *   const variant = AbTest.get('hero_banner_color');
 */

const AbTest = (function(){
  const KEY = 'abtests:assignments';

  function _storage(){ return StorageService.get(KEY, {}); }
  function _save(obj){ StorageService.set(KEY, obj); }

  function _bucketKey(name){ return 'ab:'+name; }
  function _random(){ return Math.random(); }

  function assign(name, variations = ['control','variant'], sampleRate = 0.1){
    const store = _storage();
    if(store[name]) return store[name]; // already assigned
    // sample decide
    if(_random() > sampleRate){ store[name] = { assigned:false }; _save(store); return store[name]; }
    // deterministic-ish assignment via hashed seed from localStorage user id or fallback
    const uid = StorageService.get('analytics:userId') || StorageService.get('user:anonId') || (function(){ const v = 'anon_'+Math.random().toString(36).slice(2,9); StorageService.set('user:anonId', v); return v; })();
    const seed = Array.from(name+uid).reduce((s,c)=> s + c.charCodeAt(0), 0);
    const idx = seed % variations.length;
    store[name] = { assigned:true, variation: variations[idx], sampleRate, createdAt: Date.now() };
    _save(store);
    return store[name];
  }

  function get(name){ const s = _storage(); return s[name] || null; }

  function list(){ return _storage(); }

  function clear(){ _save({}); }

  return { assign, get, list, clear };
})();

window.AbTest = AbTest;
