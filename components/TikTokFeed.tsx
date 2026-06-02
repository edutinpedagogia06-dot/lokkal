'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { doc, updateDoc, increment, addDoc, collection, serverTimestamp, getDocs, query, where, orderBy } from 'firebase/firestore'
import { Heart, MessageCircle, X, Send, ChevronDown } from 'lucide-react'
import { db } from '@/lib/firebase'
import { Producto, Comentario } from '@/types'
import { buildWhatsAppLink, formatPrice } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useVideoFeed } from '@/hooks/useRecommendedFeed'

function VideoCard({
  product,
  isActive,
  onOpenComments,
}: {
  product: Producto
  isActive: boolean
  onOpenComments: (id: string) => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [liked, setLiked] = useState(false)
  const [localLikes, setLocalLikes] = useState(product.likesCount)
  const waLink = buildWhatsAppLink(product.marcaWhatsapp, product.title)

  useEffect(() => {
    const vid = videoRef.current
    if (!vid) return
    if (isActive) vid.play().catch(() => {})
    else { vid.pause(); vid.currentTime = 0 }
  }, [isActive])

  const handleLike = async () => {
    if (liked) return
    setLiked(true)
    setLocalLikes(p => p + 1)
    try { await updateDoc(doc(db, 'productos', product.id), { likesCount: increment(1) }) } catch {}
  }

  return (
    <div className="relative w-full h-full bg-black snap-start flex-shrink-0 overflow-hidden">
      {product.videoUrl ? (
        <video
          ref={videoRef}
          src={product.videoUrl}
          className="absolute inset-0 w-full h-full object-cover"
          loop muted playsInline preload="metadata"
        />
      ) : (
        <img src={product.imageUrl} className="absolute inset-0 w-full h-full object-cover" alt={product.title} />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30 pointer-events-none" />

      {/* Top brand */}
      <div className="absolute top-0 left-0 right-12 p-4 flex items-center gap-2.5 z-10">
        <img
          src={product.marcaLogoUrl || '/placeholder.png'}
          className="w-9 h-9 rounded-full border-2 border-white object-cover"
          alt={product.marcaName}
        />
        <div>
          <p className="text-white text-sm font-bold leading-none">{product.marcaName}</p>
          <p className="text-white/60 text-xs mt-0.5">📍 {product.city}</p>
        </div>
      </div>

      {/* Right action bar */}
      <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5 z-10">
        <ActionBtn
          icon={<Heart size={22} className={liked ? 'fill-red-500 text-red-500' : 'text-white'} />}
          label={String(localLikes)}
          onClick={handleLike}
        />
        <ActionBtn
          icon={<MessageCircle size={22} className="text-white" />}
          label="Ver"
          onClick={() => onOpenComments(product.id)}
        />
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-1"
        >
          <div className="w-11 h-11 rounded-full bg-emerald-500 flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.113 1.527 5.842L.057 24l6.306-1.654A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.795 9.795 0 01-4.988-1.365l-.358-.213-3.712.974.991-3.618-.234-.372A9.78 9.78 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
            </svg>
          </div>
          <span className="text-white text-[10px] font-semibold">Comprar</span>
        </a>
      </div>

      {/* Bottom product info */}
      <div className="absolute bottom-0 left-0 right-16 p-4 z-10">
        <p className="text-white font-bold text-base leading-snug mb-1">{product.title}</p>
        <p className="text-orange-400 font-extrabold text-xl leading-none">{formatPrice(product.price)}</p>
      </div>
    </div>
  )
}

function ActionBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button className="flex flex-col items-center gap-1" onClick={onClick}>
      <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center">
        {icon}
      </div>
      <span className="text-white text-[10px] font-semibold">{label}</span>
    </button>
  )
}

function CommentsDrawer({
  productoId,
  onClose,
}: { productoId: string; onClose: () => void }) {
  const { user, profile } = useAuth()
  const [comments, setComments] = useState<Comentario[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const q = query(
      collection(db, 'comentarios'),
      where('productoId', '==', productoId),
      orderBy('createdAt', 'asc')
    )
    getDocs(q).then(snap => {
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Comentario)))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [productoId])

  const sendComment = async () => {
    if (!user || !text.trim()) return
    setSending(true)
    const newComment = {
      productoId,
      usuarioId: user.uid,
      usuarioName: profile?.displayName || user.email || 'Anónimo',
      usuarioPhotoUrl: profile?.photoURL || '',
      text: text.trim(),
      createdAt: serverTimestamp(),
    }
    try {
      const ref = await addDoc(collection(db, 'comentarios'), newComment)
      setComments(prev => [...prev, { id: ref.id, ...newComment, createdAt: { toMillis: () => Date.now() } as any }])
      setText('')
    } catch {}
    setSending(false)
  }

  return (
    <div className="absolute inset-x-0 bottom-0 z-20 bg-white rounded-t-3xl max-h-[70%] flex flex-col shadow-2xl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="font-bold text-gray-900">Comentarios</h3>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
          <ChevronDown size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {loading && <p className="text-center text-gray-400 text-sm">Cargando...</p>}
        {!loading && comments.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-6">Sé el primero en comentar 💬</p>
        )}
        {comments.map(c => (
          <div key={c.id} className="flex gap-2.5">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-orange-600">
              {c.usuarioName[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-700">{c.usuarioName}</p>
              <p className="text-sm text-gray-600">{c.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
        <input
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendComment()}
          placeholder={user ? 'Escribe un comentario...' : 'Inicia sesión para comentar'}
          disabled={!user || sending}
          className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-200 disabled:opacity-50"
        />
        <button
          onClick={sendComment}
          disabled={!user || !text.trim() || sending}
          className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center disabled:opacity-40"
        >
          <Send size={14} className="text-white" />
        </button>
      </div>
    </div>
  )
}

export default function TikTokFeed() {
  const { products, loading } = useVideoFeed()
  const [activeIndex, setActiveIndex] = useState(0)
  const [openCommentsId, setOpenCommentsId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // IntersectionObserver to detect which card is active
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const cards = container.querySelectorAll('[data-card]')
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.card)
            setActiveIndex(idx)
          }
        })
      },
      { root: container, threshold: 0.6 }
    )
    cards.forEach(c => observer.observe(c))
    return () => observer.disconnect()
  }, [products])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-black text-white gap-4">
        <span className="text-5xl">🎬</span>
        <p className="font-bold text-xl">Sin videos aún</p>
        <p className="text-white/50 text-sm">Sé el primero en publicar</p>
      </div>
    )
  }

  return (
    <div className="relative h-full overflow-hidden bg-black">
      <div
        ref={containerRef}
        className="h-full overflow-y-scroll snap-y snap-mandatory"
        style={{ scrollbarWidth: 'none' }}
      >
        {products.map((p, i) => (
          <div key={p.id} data-card={i} className="w-full h-full snap-start flex-shrink-0">
            <VideoCard
              product={p}
              isActive={i === activeIndex && !openCommentsId}
              onOpenComments={setOpenCommentsId}
            />
          </div>
        ))}
      </div>

      {openCommentsId && (
        <CommentsDrawer
          productoId={openCommentsId}
          onClose={() => setOpenCommentsId(null)}
        />
      )}
    </div>
  )
}
