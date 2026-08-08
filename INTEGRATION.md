

---
Additional Integration Notes: Creator / Admin Uploads (Sprint 6)

This sprint adds a frontend-only upload flow (validation + simulated upload progress) and admin/creator dashboards that manage upload metadata stored in localStorage. For production, follow these important integration steps:

1) Signed uploads
   - Generate signed/upload URLs server-side (S3 presigned URLs, GCS signed URLs, or cloud provider equivalent).
   - Client uploads directly to the storage provider using the signed URL; server should not proxy file data unnecessarily.

2) Server-side validation & processing
   - After upload, send metadata to server (user id, file path, checksum, type, size).
   - Server should enqueue background jobs for:
     - Virus/malware scanning
     - Thumbnail generation
     - Transcoding (if needed)
     - OCR / metadata extraction
   - Use idempotent job patterns and handle retries safely.

3) Moderation & content policy
   - Integrate automated moderation (hash matching, NSFW classifiers) and human moderation queue.
   - Store moderation decisions and expose status to creators via API.

4) Storage & CDN
   - Serve media through a CDN with signed URLs for protected content.
   - Use lifecycle rules for temporary files and archival strategies for older media.

5) Quotas & billing
   - Enforce per-user quotas server-side to prevent abuse.
   - Track storage usage and bill or block uploads when limits reached.

6) Security
   - Validate file types on server (do not trust client-side mime-type alone).
   - Use content-disposition and secure filenames; avoid storing user-supplied filenames in public paths without sanitization.

7) Webhooks & publish flow
   - When background processing completes, server should update the upload record and notify clients (webhooks / push / polling).
   - Use secure webhook verification and idempotency keys on order/process creation.

---
