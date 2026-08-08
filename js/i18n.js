/* js/i18n.js - minimal i18n helper (en-only in this sprint)
 * Usage: i18n.init({ locale: 'en' }); i18n.t('key.path')
 */

const i18n = (function(){
  let locale = 'en';
  let resources = {};

  function load(res){ resources = res || {}; }
  function init(opts = {}){ locale = opts.locale || 'en'; if(opts.resources) load(opts.resources); }
  function t(key, fallback=''){
    if(!key) return fallback;
    const parts = key.split('.'); let cur = resources[locale] || {};
    for(const p of parts){ cur = cur && cur[p]; if(cur===undefined) return fallback || key; }
    return cur;
  }

  return { init, load, t };
})();

window.i18n = i18n;
