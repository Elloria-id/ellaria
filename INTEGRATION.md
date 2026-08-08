

---
Additional Integration Notes: Payments & Wallet (Sprint 4)

This branch adds client-side simulated wallet/shop/vip flows. Important production guidance below:

1) Do NOT handle payment secrets in frontend
   - All payment session creation (QRIS, card, third-party) must be created server-side.
   - Server should return a short-lived payment URL / QR payload to the client.

2) Recommended flow
   - Client posts purchase intent to server (item id, user id) -> server verifies user & item, creates payment session (gateway API), returns session id / payment URL / QR code data to client -> client redirects or shows QR/modal -> webhook receives confirmation -> server updates order & credits user account -> client polls order status or receives push notification.

3) Data to store server-side (not client)
   - Orders table: id, user_id, item_sku, amount, currency, payment_provider, status, created_at, paid_at, webhook_payload
   - Wallet ledger: transaction_id, user_id, change_amount (+/-), balance_after, reason, metadata

4) Webhooks & security
   - Verify webhooks from payment providers using signature/secret.
   - Use idempotency keys for order creation.

5) Migration from localStorage to server
   - Replace StorageService.get/set for wallet & vip with server API calls returning user-scoped data.
   - Use optimistic UI updates with caution; always reconcile with server state after webhook/confirmation.

---
