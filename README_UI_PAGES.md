# Ellaria UI All Pages

This branch adds static UI skeletons for the full Ellaria feature list. All pages are frontend-only and use dummy data/placeholders.

Purpose:
- Provide complete UI surface so you can wire Firestore / Prisma / Payment providers later.
- Keep clear TODO marks where to integrate backend services.

What I added:
- pages/* (many feature pages) each with HTML/CSS/JS stub files.
- INTEGRATION.md describing where to replace stubs with real services and APIs.
- assets/images/PLACEHOLDERS.txt listing placeholder assets to add.

Note:
- I did not add any real credentials or external service calls. Every data access point contains a TODO comment.
- After you review, I'll create a PR to merge this branch into main (per your request).
