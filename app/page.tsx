'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, SlidersHorizontal, Play } from 'lucide-react'
import { useRecommendedFeed } from '@/hooks/useRecommendedFeed'
import ProductCard from '@/components/ProductCard'
import { ProductGridSkeleton, EmptyState } from '@/components/Skeletons'
import { CATEGORIES, CITIES } from '@/lib/utils'
import { FeedFilters, Category } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import PublishProductModal from '@/components/PublishProductModal'
import TikTokFeed from '@/components/TikTokFeed'

export default function HomePage() {
  const router = useRouter()
  const { isSeller } = useAuth()
  const [view, setView] = useState<'grid' | 'tiktok'>('grid')
  const [showPublish, setShowPublish] = useState(false)
  const [filters, setFilters] = useState<FeedFilters>({ category: 'todas', sortBy: 'score' })
  const [searchInput, setSearchInput] = useState('')

  const { products, loading, loadingMore, hasMore, loadMore, refresh } = useRecommendedFeed(filters)

  const updateFilters = useCallback((partial: Partial<FeedFilters>) => {
    setFilters(prev => ({ ...prev, ...partial }))
  }, [])

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value)
    const timeout = setTimeout(() => updateFilters({ query: e.target.value }), 300)
    return () => clearTimeout(timeout)
  }, [updateFilters])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* STICKY SEARCH + FILTERS */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm">
        {/* Search row */}
        <div className="px-4 py-3 flex gap-2 items-center">
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              value={searchInput}
              onChange={handleSearch}
              placeholder="Buscar productos, marcas, ciudades..."
              className="w-full bg-gray-100 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-orange-200 transition-all"
            />
          </div>
          {/* View toggle */}
          <button
            onClick={() => setView(v => v === 'grid' ? 'tiktok' : 'grid')}
            className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all ${
              view === 'tiktok' ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
            title="Feed de videos"
          >
            <Play size={16} fill={view === 'tiktok' ? 'white' : 'none'} />
          </button>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 no-scrollbar">
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              onClick={() => updateFilters({ category: c.value as Category | 'todas' })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                filters.category === c.value
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>

        {/* City + sort row */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
          <select
            value={filters.city || ''}
            onChange={e => updateFilters({ city: e.target.value || undefined })}
            className="text-xs font-semibold border border-gray-200 rounded-full px-3 py-1.5 bg-white outline-none focus:border-orange-400 cursor-pointer flex-shrink-0"
          >
            <option value="">📍 Toda Colombia</option>
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={filters.sortBy}
            onChange={e => updateFilters({ sortBy: e.target.value as FeedFilters['sortBy'] })}
            className="text-xs font-semibold border border-gray-200 rounded-full px-3 py-1.5 bg-white outline-none focus:border-orange-400 cursor-pointer flex-shrink-0"
          >
            <option value="score">⭐ Relevancia</option>
            <option value="recent">🕐 Más recientes</option>
            <option value="price_asc">💰 Menor precio</option>
            <option value="price_desc">💎 Mayor precio</option>
          </select>
          {(filters.category !== 'todas' || filters.city || filters.query) && (
            <button
              onClick={() => { setFilters({ category: 'todas', sortBy: 'score' }); setSearchInput('') }}
              className="text-xs font-semibold text-orange-500 border border-orange-200 rounded-full px-3 py-1.5 hover:bg-orange-50 transition-colors flex-shrink-0"
            >
              ✕ Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* FEED CONTENT */}
      {view === 'tiktok' ? (
        <div className="h-[calc(100dvh-160px)]">
          <TikTokFeed />
        </div>
      ) : (
        <div className="px-3 py-4">
          {/* Results label */}
          {!loading && (
            <p className="text-xs text-gray-400 mb-3 px-1">
              {products.length} producto{products.length !== 1 ? 's' : ''} encontrado{products.length !== 1 ? 's' : ''}
              {filters.city ? ` en ${filters.city}` : ' en Colombia'}
            </p>
          )}

          {loading ? (
            <ProductGridSkeleton count={12} />
          ) : products.length === 0 ? (
            <EmptyState
              emoji="🔍"
              title="Sin resultados"
              subtitle="Prueba con otros filtros o busca otra categoría."
              cta={isSeller ? '+ Publicar un producto' : undefined}
              onCta={isSeller ? () => setShowPublish(true) : undefined}
            />
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {products.map(p => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onBrandClick={slug => router.push(`/marca/${slug}`)}
                  />
                ))}
              </div>

              {/* Load more */}
              {hasMore && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="px-8 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:border-orange-400 hover:text-orange-500 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {loadingMore && <span className="w-4 h-4 border-2 border-gray-300 border-t-orange-500 rounded-full animate-spin" />}
                    Cargar más
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* FAB for sellers */}
      {isSeller && (
        <button
          onClick={() => setShowPublish(true)}
          className="fixed bottom-6 right-4 z-30 w-14 h-14 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center text-2xl transition-all hover:scale-105"
          aria-label="Publicar producto"
        >
          +
        </button>
      )}

      {showPublish && (
        <PublishProductModal
          onClose={() => setShowPublish(false)}
          onPublished={() => { setShowPublish(false); refresh() }}
        />
      )}
    </div>
  )
}
