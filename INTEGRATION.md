
---
Analytics & A/B Testing notes added in Sprint 7

This repo now contains a client-side analytics wrapper (js/analyticsService.js) and a simple
client-side A/B testing helper (js/abTestService.js). These are development-friendly
implementations intended to be swapped for production providers.

Production guidance (short):
- Use server-side event collection where possible to avoid ad-blockers and client-side loss.
- For GA4: add the official gtag snippet on the server-rendered pages and set measurementId in AnalyticsService.init({ provider:'ga4', measurementId:'G-XXXX' }).
- For A/B testing: prefer server-side assignment for experiments that affect business metrics. Use client-side consistent bucketing for UI-only experiments or early prototyping.
- Respect user opt-out and privacy laws (GDPR, CCPA): communicate tracking, provide opt-out, and do not send PII in events.

---
