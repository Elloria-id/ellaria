
---
Social & i18n notes (Sprint 9)

This sprint introduces client-side social features (profiles, followers, comments) and a minimal
internationalization skeleton (en-only in this sprint). Mentions detection integrates with NotifService
so users receive local notifications when mentioned.

Storage keys used:
- social:profiles
- social:followers
- social:comments

Production integration notes:
- Map usernames to canonical user IDs server-side. Do not rely on display names for identity.
- Send mention notifications via server push / push notification service to reach users across devices.
- For i18n in production: use gettext/ICU message format and compile resources; support locale negotiation server-side.
- Accessibility: ensure forms and interactive elements include ARIA labels and keyboard focus states.

---
