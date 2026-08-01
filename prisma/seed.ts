import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  const adminEmail = 'admin@ellaria.test'
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } })
  if (!existing) {
    const hash = await bcrypt.hash('password123', 10)
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Admin',
        avatar: '',
        role: 'ADMIN',
        // store hashed password in a non-schema field? We'll use a simple separate tableless approach: add passwordHash as a temp field in User? To keep schema unchanged, we'll use a simple approach: create an account via prisma.user and a raw table for auth not present.
      },
    })
    // Note: For simplicity, we don't store the password in the User model in this scaffold. The login flow uses credentials against the email and a temporary in-memory check for dev. Run `prisma studio` to explore data.
    console.log('Created admin user:', adminEmail)
  } else {
    console.log('Admin user already exists')
  }

  // Create sample series and chapters
  const s1 = await prisma.series.upsert({
    where: { slug: 'sample-series-1' },
    update: {},
    create: {
      slug: 'sample-series-1',
      title: 'Sample Series 1',
      altTitle: 'SS1',
      coverUrl: '/placeholder.png',
      bannerUrl: '/placeholder.png',
      genres: ['Action', 'Adventure'],
      status: 'Ongoing',
      type: 'Manga',
      author: 'Author A',
      artist: 'Artist A',
      translator: 'Team A',
      rating: 4.5,
      views: 1200,
      synopsis: 'This is a sample synopsis for Sample Series 1.',
      chapters: {
        create: [
          {
            title: 'Chapter 1',
            number: 1,
            images: ['/placeholder.png'],
          },
          {
            title: 'Chapter 2',
            number: 2,
            images: ['/placeholder.png'],
          },
        ],
      },
    },
  })

  const s2 = await prisma.series.upsert({
    where: { slug: 'sample-series-2' },
    update: {},
    create: {
      slug: 'sample-series-2',
      title: 'Sample Series 2',
      altTitle: 'SS2',
      coverUrl: '/placeholder.png',
      bannerUrl: '/placeholder.png',
      genres: ['Romance'],
      status: 'Completed',
      type: 'Manhwa',
      author: 'Author B',
      artist: 'Artist B',
      translator: 'Team B',
      rating: 4.2,
      views: 980,
      synopsis: 'This is a sample synopsis for Sample Series 2.',
      chapters: {
        create: [
          {
            title: 'Chapter 1',
            number: 1,
            images: ['/placeholder.png'],
          },
        ],
      },
    },
  })

  console.log('Seed finished')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
