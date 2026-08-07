INTEGRATION NOTES

This file lists common integration points and guidance to connect the static UI to your backend services (Firestore, Prisma, payment gateways, etc.).

1) Authentication
- Files: pages/login/login.html, pages/register/register.html
- TODO: replace stubbed login handlers with Firebase Auth or NextAuth. Example:
  async function signInWithGoogle() { /* TODO: Firebase Google sign-in */ }

2) Data storage (series, chapters, users, bookmarks)
- Files: pages/*/ *.js where DATA arrays exist (look for: /* TODO: replace with Firestore / API */)
- Recommendation: Create API routes (/api/...) that return JSON; have UI call those endpoints. If using Firebase, use Firestore queries.

3) Wallet / Payments
- Files: pages/wallet/wallet.js, pages/shop/shop.js
- TODO: implement server-side payment session creation (QRIS, other gateways) — do NOT handle secret keys on client.

4) Reader progress, bookmarks, history
- Store per-user progress in Firestore or your relational DB via Prisma. Use anonymous user IDs for guests.

5) Realtime (chat, notifications)
- Use Firebase Realtime Database or Firestore with onSnapshot for realtime updates; or use WebSockets/server for scale.

6) Admin / Dashboards
- Protect routes server-side; only authorized users should read/write admin endpoints.

7) Assets
- Place cover images at /assets/images/covers/cover1.jpg ... cover8.jpg
- Place avatars at /assets/images/avatar/*.jpg

8) Replacing stubs
- Search for the string: "/* TODO: replace with Firestore / API */" to find integration points.

If you want, I can help wire specific endpoints (e.g., bookmarks with Firebase) once you provide project credentials or allow me to scaffold server-side code.
