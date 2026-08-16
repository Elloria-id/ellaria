# Ellaria エル

Ellaria adalah platform membaca manga, manhwa, manhua, novel, dan one shot dengan tampilan modern dark-blue.

## Tech Stack

- Next.js 14
- TypeScript
- React
- Tailwind CSS
- Prisma ORM
- PostgreSQL
- NextAuth
- Cloudflare R2
- QRIS / Payment Provider
- PWA

## Fitur Utama

### Reader
- Manga reader
- Manhwa reader
- Manhua reader
- Novel reader
- Continuous scroll
- Page mode
- Brightness control
- Font size control untuk novel
- Riwayat membaca
- Continue Reading

### User

- Register
- Login
- Profile
- Bookmark
- History
- Follow series
- Coins
- Wallet
- Unlock chapter
- VIP
- Daily reward
- Missions
- Notifications
- Comments
- Community

### Admin

- Dashboard
- User management
- Series management
- Chapter management
- Genre management
- Banner management
- Payment management
- Website settings
- Audit log

### Creator / Translator

- Upload series
- Upload chapter
- Publish chapter
- Assignment
- Statistics

## Struktur Project

```text
ellaria/
├── app/
│   ├── admin/
│   ├── api/
│   ├── bookmark/
│   ├── history/
│   ├── reader/
│   ├── search/
│   ├── series/
│   ├── login/
│   └── register/
│
├── components/
│   ├── admin/
│   ├── home/
│   ├── layout/
│   ├── providers/
│   ├── reader/
│   └── ui/
│
├── lib/
│   ├── auth/
│   ├── db/
│   ├── coins/
│   ├── payments/
│   ├── storage/
│   ├── security/
│   ├── vip/
│   └── watermark/
│
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
│
├── public/
├── types/
├── utils/
│
├── .env.example
├── .gitignore
├── middleware.ts
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
└── README.md
