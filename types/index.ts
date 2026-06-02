import { Timestamp } from 'firebase/firestore'

export interface Marca {
  id: string
  slug: string
  name: string
  bio: string
  logoUrl: string
  bannerUrl: string
  socialLinks: {
    tiktok?: string
    instagram?: string
    web?: string
  }
  highlights: Highlight[]
  city: string
  ownerId: string
  themeColors: { primary: string; secondary: string }
  whatsapp: string
  category: Category
  likesCount: number
  followersCount: number
  createdAt: Timestamp
  updatedAt?: Timestamp
}

export interface Producto {
  id: string
  marcaId: string
  marcaSlug: string
  marcaName: string
  marcaLogoUrl: string
  marcaWhatsapp: string
  marcaCity: string
  title: string
  description: string
  price: number
  imageUrl: string
  videoUrl?: string
  category: Category
  city: string
  sizes: string[]
  colors: string[]
  likesCount: number
  viewsCount: number
  reviewsAvg: number
  reviewsCount: number
  score: number // computed field for recommendation
  createdAt: Timestamp
}

export interface Resena {
  id: string
  productoId: string
  marcaId: string
  usuarioId: string
  usuarioName: string
  usuarioPhotoUrl?: string
  rating: 1 | 2 | 3 | 4 | 5
  text: string
  createdAt: Timestamp
}

export interface Comentario {
  id: string
  productoId: string
  usuarioId: string
  usuarioName: string
  usuarioPhotoUrl?: string
  text: string
  createdAt: Timestamp
}

export interface Highlight {
  id: string
  icon: string
  title: string
  content: string
}

export type Category =
  | 'moda'
  | 'belleza'
  | 'comida'
  | 'tech'
  | 'arte'
  | 'hogar'
  | 'deportes'
  | 'otro'

export type UserRole = 'buyer' | 'seller'

export interface AppUser {
  uid: string
  email: string
  displayName: string
  photoURL: string
  role: UserRole
  city: string
  marcaId?: string
  marcaSlug?: string
  createdAt: Timestamp
}

export interface FeedFilters {
  category?: Category | 'todas'
  city?: string
  query?: string
  sortBy?: 'score' | 'recent' | 'price_asc' | 'price_desc'
}

// Scoring weights for recommendation algorithm
export const SCORE_WEIGHTS = {
  likes: 3,
  views: 1,
  reviews: 5,
  recencyDecayDays: 30,
} as const
