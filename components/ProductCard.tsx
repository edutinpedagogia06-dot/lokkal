'use client'

import Image from 'next/image'
import { useState } from 'react'
import { doc, updateDoc, increment, addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { MessageCircle, Heart, MapPin, Star } from 'lucide-react'
import { db } from '@/lib/firebase'
import { Producto } from '@/types'
import { buildWhatsAppLink, formatPrice } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import ReviewModal from './ReviewModal'

interface Props {
  product: Producto
  onBrandClick?: (slug: string) => void
}

function StarRating({ avg, count }: { avg: number; count: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          size={11}
          className={n <= Math.round(avg) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}
        />
      ))}
      {count > 0 && <span className="text-xs text-gray-400 ml-1">({count})</span>}
    </div>
  )
}

export default function ProductCard({ product, onBrandClick }: Props) {
  const { user } = useAuth()
  const [liked, setLiked] = useState(false)
  const [localLikes, setLocalLikes] = useState(product.likesCount)
  const [showReview, setShowReview] = useState(false)
  const waLink = buildWhatsAppLink(product.marcaWhatsapp, product.title)

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (liked) return
    setLiked(true)
    setLocalLikes(prev => prev + 1)
    try {
      await updateDoc(doc(db, 'productos', product.id), { likesCount: increment(1) })
    } catch {}
  }

  const handleView = async () => {
    try {
      await updateDoc(doc(db, 'productos', product.id), { viewsCount: increment(1) })
    } catch {}
  }

  return (
    <>
      <article
        className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col cursor-pointer"
        onClick={handleView}
      >
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          <Image
            src={product.imageUrl || '/placeholder.png'}
            alt={product.title}
            fill
            className="object-cover hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          {/* Like button */}
          <button
            onClick={handleLike}
            className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm transition-all ${
              liked ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-500 hover:bg-red-50 hover:text-red-500'
            }`}
            aria-label="Me gusta"
          >
            <Heart size={14} className={liked ? 'fill-current' : ''} />
          </button>
          {/* New badge if < 7 days */}
          {product.createdAt && Date.now() - product.createdAt.toMillis() < 7 * 24 * 3600 * 1000 && (
            <span className="absolute top-2.5 left-2.5 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
              Nuevo
            </span>
          )}
        </div>

        {/* Body */}
        <div className="p-3 flex flex-col gap-1.5 flex-1">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">{product.title}</h3>

          <p className="font-bold text-gray-900 text-lg leading-none tracking-tight">
            {formatPrice(product.price)}
          </p>

          <div className="flex items-center gap-1 text-gray-400">
            <MapPin size={10} />
            <span className="text-xs">{product.city}</span>
          </div>

          {product.reviewsCount > 0 && (
            <StarRating avg={product.reviewsAvg} count={product.reviewsCount} />
          )}

          {/* Color swatches */}
          {product.colors?.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {product.colors.slice(0, 6).map(c => (
                <span
                  key={c}
                  className="w-3.5 h-3.5 rounded-full border border-gray-200 flex-shrink-0"
                  style={{ background: c }}
                />
              ))}
            </div>
          )}

          {/* Size pills */}
          {product.sizes?.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {product.sizes.slice(0, 5).map(s => (
                <span key={s} className="text-[10px] px-1.5 py-0.5 border border-gray-200 rounded text-gray-500">
                  {s}
                </span>
              ))}
            </div>
          )}

          {/* Brand link */}
          <button
            onClick={e => { e.stopPropagation(); onBrandClick?.(product.marcaSlug) }}
            className="text-xs text-blue-600 font-medium hover:text-orange-500 transition-colors text-left truncate"
          >
            {product.marcaName}
          </button>
        </div>

        {/* Footer actions */}
        <div className="px-3 pb-3 flex gap-2">
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.113 1.527 5.842L.057 24l6.306-1.654A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.795 9.795 0 01-4.988-1.365l-.358-.213-3.712.974.991-3.618-.234-.372A9.78 9.78 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
            </svg>
            Pedir
          </a>
          <button
            onClick={e => { e.stopPropagation(); setShowReview(true) }}
            className="w-9 h-9 flex items-center justify-center border border-gray-200 rounded-xl hover:border-orange-400 hover:text-orange-500 text-gray-400 transition-colors"
            aria-label="Comentar"
          >
            <MessageCircle size={14} />
          </button>
          <div className="w-9 h-9 flex items-center justify-center border border-gray-200 rounded-xl text-gray-400 text-xs font-semibold">
            {localLikes}
          </div>
        </div>
      </article>

      {showReview && (
        <ReviewModal
          product={product}
          onClose={() => setShowReview(false)}
        />
      )}
    </>
  )
}
