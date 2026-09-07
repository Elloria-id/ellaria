import { prisma } from '@/lib/db/prisma'

export async function getActiveTelegram() {
  const setting = await prisma.siteSetting.findUnique({ where: { key: 'telegram_community_url' } })
  return setting?.value ?? null
}
