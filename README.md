Ellaria - Scaffold (Next.js + TypeScript + Tailwind)

Overview
- This branch (scaffold/ellaria-v1) contains a migration scaffold to Next.js + TypeScript + Tailwind CSS with a Prisma schema for PostgreSQL.
- Old static files are preserved in the repository root; a legacy README is added explaining existing files.

Setup (local)
1. cp .env.example .env and fill values
2. yarn install
3. npx prisma generate
4. npx prisma migrate dev --name init
5. yarn dev

Notes
- No secrets are committed. Fill credentials in .env.
- Storage for images is local for MVP. You can replace with Cloudinary or S3 later.
- Admin pages and auth are scaffolded but require NEXTAUTH configuration.
