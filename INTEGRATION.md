
---
Payments & Monetization notes (Sprint 10)

This sprint adds a client-side payments stub to manage creator balances and withdrawal requests. All functionality is currently local-only and intended as a UI/workflow prototype.

Key integration steps for production:
1) Use a PCI-compliant payments provider (Stripe, PayPal, Adyen) for customer checkout and payouts.
2) Never store raw payment credentials or card numbers in your app. Use tokenization / hosted pages.
3) Implement server-side endpoints to create charges, handle webhooks (payment success/refund), and reconcile transactions.
4) KYC & Compliance: verify creator identities and tax information before processing payouts. Store KYC status server-side.
5) Withdrawals: perform payouts via provider payouts API (Stripe Connect, PayPal Payouts) and mark transactions idempotently.
6) Fees & thresholds: enforce minimum withdrawal amount and fees server-side; surface net amount & expected arrival time to users.
7) Audit & reconciliation: store transactions in server DB, reconcile with provider statements daily; build alerts for reconciliation gaps.

Storage keys used (client prototype):
- payments:transactions
- creator:balance:{userId}

---
