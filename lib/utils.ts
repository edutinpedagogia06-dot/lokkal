import { Producto, SCORE_WEIGHTS } from '@/types'

/**
 * Sanitizes a phone number and builds a WhatsApp deep link with pre-filled message.
 * Strips all non-digit characters, ensures Colombian +57 prefix.
 */
export function buildWhatsAppLink(rawPhone: string, productTitle: string): string {
  const digits = rawPhone.replace(/\D/g, '')
  const normalized = digits.startsWith('57') ? digits : `57${digits}`
  const message = encodeURIComponent(
    `¡Hola! Estoy interesado en el producto *${productTitle}* que vi en Lokkal. ¿Me puedes dar más información? 🛍️`
  )
  return `https://wa.me/${normalized}?text=${message}`
}

/**
 * Validates a Colombian phone number (10 digits, starting with 3).
 */
export function validateColombianPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '')
  return /^3\d{9}$/.test(digits)
}

/**
 * Computes a recommendation score for a product.
 * score = (likes * w_likes + views * w_views + reviewsCount * w_reviews) * recencyFactor
 */
export function computeScore(p: Partial<Producto>): number {
  const likes = p.likesCount ?? 0
  const views = p.viewsCount ?? 0
  const reviews = p.reviewsCount ?? 0
  const raw = likes * SCORE_WEIGHTS.likes + views * SCORE_WEIGHTS.views + reviews * SCORE_WEIGHTS.reviews
  const ageMs = p.createdAt ? Date.now() - p.createdAt.toMillis() : 0
  const ageDays = ageMs / (1000 * 60 * 60 * 24)
  const decayFactor = Math.exp(-ageDays / SCORE_WEIGHTS.recencyDecayDays)
  return raw * decayFactor
}

/**
 * Generates a URL-safe slug from a brand name.
 */
export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

/**
 * Formats a price in Colombian pesos.
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(price)
}

export const CITIES = [
  'Barranquilla', 'Bogotá', 'Medellín', 'Cali', 'Cartagena',
  'Santa Marta', 'Bucaramanga', 'Pereira', 'Manizales', 'Cúcuta',
]

export const CATEGORIES: { value: string; label: string; emoji: string }[] = [
  { value: 'todas', label: 'Todas', emoji: '🌟' },
  { value: 'moda', label: 'Moda', emoji: '👗' },
  { value: 'belleza', label: 'Belleza', emoji: '💄' },
  { value: 'comida', label: 'Comida', emoji: '🍽️' },
  { value: 'tech', label: 'Tech', emoji: '💻' },
  { value: 'arte', label: 'Arte', emoji: '🎨' },
  { value: 'hogar', label: 'Hogar', emoji: '🏡' },
  { value: 'deportes', label: 'Deportes', emoji: '⚽' },
]
