'use client'

import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { Instagram, Globe, Eye, EyeOff, Copy, Check, ExternalLink, Pencil } from 'lucide-react'
import { db } from '@/lib/firebase'
import { Marca, Producto } from '@/types'
import { buildWhatsAppLink, formatPrice, CATEGORIES } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import ProductCard from '@/components/ProductCard'
import { BrandHeaderSkeleton, ProductGridSkeleton, EmptyState } from '@/components/Skeletons'
import PublishProductModal from '@/components/PublishProductModal'

interface Props { params: { slug: string } }

function HighlightPill({ icon, title, content }: { icon: string; title: string; content: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-xs font-semibold text-gray-700 hover:bg-orange-50 hover:border-orange-200 transition-colors"
      >
        <span>{icon}</span>{title}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-3">{icon} {title}</h3>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
            <button onClick={() => setOpen(false)} className="mt-4 w-full py-2 bg-gray-100 rounded-xl text-sm font-semibold">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default function MarcaPage({ params }: Props) {
  const { user, isOwnerOf } = useAuth()
  const [marca, setMarca] = useState<Marca | null>(null)
  const [products, setProducts] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [previewMode, setPreviewMode] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showPublish, setShowPublish] = useState(false)
  const [activeCategory, setActiveCategory] = useState('todas')

  useEffect(() => {
    const fetch = async () => {
      const snap = await getDocs(query(collection(db, 'marcas'), where('slug', '==', params.slug)))
      if (snap.empty) { setLoading(false); return }
      const m = { id: snap.docs[0].id, ...snap.docs[0].data() } as Marca
      setMarca(m)
      const pSnap = await getDocs(query(collection(db, 'productos'), where('marcaId', '==', m.id)))
      setProducts(pSnap.docs.map(d => ({ id: d.id, ...d.data() } as Producto)).sort((a,b) => b.score - a.score))
      setLoading(false)
    }
    fetch()
  }, [params.slug])

  const isOwner = marca ? isOwnerOf(marca.ownerId) : false
  const showOwnerTools = isOwner && !previewMode

  const copyUrl = () => {
    navigator.clipboard.writeText(`https://lokkal.co/marca/${params.slug}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const filteredProducts = activeCategory === 'todas'
    ? products
    : products.filter(p => p.category === activeCategory)

  if (loading) return <div className="max-w-2xl mx-auto"><BrandHeaderSkeleton /><ProductGridSkeleton /></div>
  if (!marca) return <div className="text-center py-20 text-gray-400">Marca no encontrada</div>

  const accentColor = marca.themeColors?.primary || '#e84c1e'
  const waLink = buildWhatsAppLink(marca.whatsapp, `información sobre ${marca.name}`)

  return (
    <div className="max-w-2xl mx-auto pb-20">
      {/* BANNER */}
      <div
        className="relative h-44 w-full overflow-hidden"
        style={{ background: marca.bannerUrl ? undefined : `linear-gradient(135deg, ${accentColor}44, ${accentColor}88)` }}
      >
        {marca.bannerUrl && <img src={marca.bannerUrl} className="w-full h-full object-cover" alt="" />}
        {showOwnerTools && (
          <label className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full cursor-pointer hover:bg-black/70 transition-colors">
            <Pencil size={12} /> Cambiar banner
            <input type="file" accept="image/*" className="hidden" onChange={e => {/* upload handler */}} />
          </label>
        )}
      </div>

      {/* META */}
      <div className="bg-white px-4 pb-4">
        <div className="flex items-end justify-between -mt-10 mb-3">
          {/* Logo */}
          <div className="relative">
            <div
              className="w-20 h-20 rounded-full border-4 border-white overflow-hidden flex items-center justify-center text-2xl font-bold text-white shadow-md"
              style={{ background: accentColor }}
            >
              {marca.logoUrl
                ? <img src={marca.logoUrl} className="w-full h-full object-cover" alt={marca.name} />
                : marca.name[0].toUpperCase()
              }
            </div>
            {showOwnerTools && (
              <label className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-gray-800 text-white flex items-center justify-center cursor-pointer hover:bg-orange-500 transition-colors border-2 border-white">
                <Pencil size={11} />
                <input type="file" accept="image/*" className="hidden" onChange={e => {/* upload logo */}} />
              </label>
            )}
          </div>

          {/* Owner tools */}
          {isOwner && (
            <div className="flex gap-2 items-center">
              <button
                onClick={() => setPreviewMode(p => !p)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-semibold text-gray-700 transition-colors"
              >
                {previewMode ? <Eye size={13} /> : <EyeOff size={13} />}
                {previewMode ? 'Ver como cliente' : 'Vista previa'}
              </button>
              {showOwnerTools && (
                <button
                  onClick={copyUrl}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-full text-xs font-semibold transition-colors"
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? 'Copiado' : 'Copiar bio link'}
                </button>
              )}
            </div>
          )}

          {/* Visitor: WhatsApp */}
          {!isOwner && (
            <a href={waLink} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-full text-sm font-semibold transition-colors">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.113 1.527 5.842L.057 24l6.306-1.654A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.795 9.795 0 01-4.988-1.365l-.358-.213-3.712.974.991-3.618-.234-.372A9.78 9.78 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/></svg>
              Contactar
            </a>
          )}
        </div>

        {/* Name & handle */}
        <h1 className="font-bold text-2xl text-gray-900 leading-tight">{marca.name}</h1>
        <p className="text-gray-400 text-sm mb-2">@{marca.slug}</p>

        {/* Stats */}
        <div className="flex gap-5 text-sm mb-3">
          <div><span className="font-bold text-gray-900">{products.length}</span> <span className="text-gray-400">productos</span></div>
          <div><span className="font-bold text-gray-900">📍</span> <span className="text-gray-400">{marca.city}</span></div>
        </div>

        {/* Bio */}
        {marca.bio && <p className="text-gray-600 text-sm leading-relaxed mb-3">{marca.bio}</p>}

        {/* Social links */}
        <div className="flex gap-2 mb-3">
          {marca.socialLinks?.instagram && (
            <a href={`https://instagram.com/${marca.socialLinks.instagram}`} target="_blank" rel="noopener noreferrer"
              className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-pink-50 hover:text-pink-600 text-gray-500 transition-colors border border-gray-200">
              <Instagram size={15} />
            </a>
          )}
          {marca.socialLinks?.tiktok && (
            <a href={`https://tiktok.com/@${marca.socialLinks.tiktok}`} target="_blank" rel="noopener noreferrer"
              className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-black hover:text-white text-gray-500 transition-colors border border-gray-200">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.17 8.17 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/></svg>
            </a>
          )}
          {marca.socialLinks?.web && (
            <a href={marca.socialLinks.web} target="_blank" rel="noopener noreferrer"
              className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-500 transition-colors border border-gray-200">
              <Globe size={15} />
            </a>
          )}
        </div>

        {/* Highlights */}
        {marca.highlights?.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {marca.highlights.map(h => (
              <HighlightPill key={h.id} icon={h.icon} title={h.title} content={h.content} />
            ))}
          </div>
        )}
      </div>

      {/* PRODUCT GRID */}
      <div className="mt-2">
        {/* Category filter tabs */}
        <div className="flex gap-2 overflow-x-auto px-4 py-3 bg-white border-y border-gray-100 sticky top-0 z-10 no-scrollbar">
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              onClick={() => setActiveCategory(c.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === c.value
                  ? 'text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={activeCategory === c.value ? { background: accentColor } : {}}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>

        {showOwnerTools && (
          <div className="px-4 py-3 bg-orange-50 border-b border-orange-100 flex items-center justify-between">
            <p className="text-xs text-orange-700 font-medium">🛍️ {products.length} productos publicados</p>
            <button
              onClick={() => setShowPublish(true)}
              className="flex items-center gap-1.5 bg-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-bold hover:bg-orange-600 transition-colors"
            >
              + Publicar producto
            </button>
          </div>
        )}

        {filteredProducts.length === 0 ? (
          <EmptyState
            emoji={isOwner ? '🚀' : '📦'}
            title={isOwner ? 'Tu catálogo está vacío' : 'Sin productos en esta categoría'}
            subtitle={isOwner
              ? 'Publica tu primer producto y aparecerá aquí inmediatamente.'
              : 'Esta marca no tiene productos en esta categoría aún. Vuelve pronto.'}
            cta={isOwner ? '+ Publicar ahora' : undefined}
            onCta={isOwner ? () => setShowPublish(true) : undefined}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4">
            {filteredProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>

      {/* Owner floating config panel */}
      {showOwnerTools && (
        <div className="fixed bottom-20 right-4 z-30">
          <button
            onClick={() => setShowPublish(true)}
            className="w-14 h-14 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg hover:bg-orange-600 transition-all hover:scale-105 text-xl"
            aria-label="Publicar producto"
          >
            +
          </button>
        </div>
      )}

      {showPublish && (
        <PublishProductModal
          onClose={() => setShowPublish(false)}
          onPublished={() => {
            setShowPublish(false)
            // Refresh products list
            getDocs(query(collection(db, 'productos'), where('marcaId', '==', marca?.id))).then(snap => {
              setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Producto)).sort((a,b) => b.score - a.score))
            })
          }}
        />
      )}
    </div>
  )
}
