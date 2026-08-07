

---
Additional Integration Notes for core-interactive sprint

The project includes a small storage abstraction at js/storageService.js. This centralizes usage of localStorage so you can replace it easily with server-side API or Firestore:

- StorageService.get(key, fallback)
- StorageService.set(key, value)
- StorageService.remove(key)
- StorageService.exportJSON(key) / importJSON(key, json)
- StorageService.exportCSV(key)

Files created in Sprint 1 use keys:
- bookmarks -> 'bookmarks'
- bookmark folders -> 'bookmarkFolders'
- history -> 'history'
- reader prefs -> 'reader:preferences'
- reader progress -> 'reader:progress'
- series metadata -> 'series:meta'

TODO when switching to Firestore / API:
- Implement an async service that replaces StorageService and maps get/set/remove to Firestore reads/writes or to REST endpoints.
- Migrate data model: series:meta can be a collection 'series' with fields: views, likes, bookmarks, comments.
- Ensure authentication: guard write operations on server side and use user-scoped collections for bookmarks/history.

---
