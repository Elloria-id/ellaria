/* storageService.js
 * Small wrapper around localStorage to centralize storage usage.
 * All functions are synchronous (localStorage). Replace implementations with
 * Firestore/Prisma/API calls when wiring backend (see TODO markers).
 */

const StorageService = (function () {
  const PREFIX = 'ellaria:';

  function key(k) { return PREFIX + k; }

  function getRaw(k) {
    try {
      const v = localStorage.getItem(key(k));
      return v ? JSON.parse(v) : null;
    } catch (e) {
      console.error('storageService.get error', e);
      return null;
    }
  }

  function setRaw(k, value) {
    try {
      localStorage.setItem(key(k), JSON.stringify(value));
    } catch (e) {
      console.error('storageService.set error', e);
    }
  }

  function remove(k) {
    localStorage.removeItem(key(k));
  }

  /* Public API */
  return {
    // Generic get/set/remove
    get(k, fallback = null) {
      const v = getRaw(k);
      return v === null ? fallback : v;
    },
    set(k, value) {
      setRaw(k, value);
    },
    remove(k) {
      remove(k);
    },

    // List keys under ellaria: (not deep namespacing)
    listKeys() {
      const out = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.indexOf(PREFIX) === 0) out.push(k.replace(PREFIX, ''));
      }
      return out;
    },

    // Export/Import JSON
    exportJSON(k) {
      const v = getRaw(k);
      return JSON.stringify(v, null, 2);
    },
    importJSON(k, jsonString) {
      try {
        const parsed = JSON.parse(jsonString);
        setRaw(k, parsed);
        return true;
      } catch (e) {
        console.error('storageService.importJSON error', e);
        return false;
      }
    },

    // CSV export helper for array-of-objects (simple)
    exportCSV(k) {
      const arr = getRaw(k) || [];
      if (!Array.isArray(arr) || arr.length === 0) return '';
      const headers = Object.keys(arr[0]);
      const rows = arr.map(r => headers.map(h => `"${(r[h] !== undefined && r[h] !== null) ? String(r[h]).replace(/"/g, '""') : ''}"`).join(','));
      return [headers.join(','), ...rows].join('\n');
    },

    // Clear all ellaria keys (dangerous)
    clearAll() {
      const keys = this.listKeys();
      keys.forEach(k => remove(k));
    }

    /* TODO:
      - Replace this module with async calls to Firestore/Prisma when wiring backend.
      - For server-backed storage keep the same method names (get/set/remove) but
        return Promises and handle auth/permissions server-side.
    */
  };
})();

// Expose globally for simple usage from page scripts
window.StorageService = StorageService;
