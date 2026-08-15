import { z } from 'zod'

export const usernameSchema = z.string()
  .min(3, 'Username minimal 3 karakter')
  .max(30, 'Username maksimal 30 karakter')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username hanya boleh berisi huruf, angka, dan underscore')

export const emailSchema = z.string()
  .email('Email tidak valid')

export const passwordSchema = z.string()
  .min(8, 'Password minimal 8 karakter')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password harus mengandung huruf besar, huruf kecil, dan angka'
  )

export const sanitizeHtml = (text: string): string => {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export const validateChapterAccess = (
  chapter: { isPremium: boolean; isLocked: boolean; coinPrice: number },
  user: { coins: number; isVIP: boolean } | null
) => {
  if (!chapter.isPremium && !chapter.isLocked) {
    return { allowed: true }
  }

  if (!user) {
    return { allowed: false, requiresAuth: true }
  }

  if (user.isVIP) {
    return { allowed: true }
  }

  if (user.coins >= chapter.coinPrice) {
    return { allowed: true }
  }

  return { allowed: false, requiresPayment: true, price: chapter.coinPrice }
}

export const fileValidation = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxDimensions: { width: 4096, height: 4096 },
}
