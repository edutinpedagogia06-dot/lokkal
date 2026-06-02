export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-200" />
      <div className="p-3 space-y-2">
        <div className="h-3.5 bg-gray-200 rounded-full w-3/4" />
        <div className="h-3.5 bg-gray-200 rounded-full w-1/2" />
        <div className="h-5 bg-gray-200 rounded-full w-1/3" />
        <div className="h-2.5 bg-gray-100 rounded-full w-2/3" />
      </div>
      <div className="px-3 pb-3">
        <div className="h-9 bg-gray-200 rounded-xl" />
      </div>
    </div>
  )
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function BrandHeaderSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Banner */}
      <div className="h-44 bg-gray-200 w-full" />
      <div className="px-4 pb-4 bg-white">
        {/* Avatar + actions row */}
        <div className="flex items-end justify-between -mt-8 mb-3">
          <div className="w-20 h-20 rounded-full bg-gray-300 border-4 border-white" />
          <div className="flex gap-2">
            <div className="h-9 w-24 bg-gray-200 rounded-full" />
          </div>
        </div>
        {/* Name */}
        <div className="h-6 bg-gray-200 rounded-full w-40 mb-2" />
        <div className="h-4 bg-gray-100 rounded-full w-24 mb-3" />
        {/* Bio */}
        <div className="space-y-1.5">
          <div className="h-3 bg-gray-100 rounded-full w-full" />
          <div className="h-3 bg-gray-100 rounded-full w-5/6" />
        </div>
        {/* Highlights */}
        <div className="flex gap-2 mt-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-8 w-20 bg-gray-100 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function EmptyState({
  title = 'Sin productos aún',
  subtitle = 'Esta marca no ha publicado productos todavía.',
  emoji = '📦',
  cta,
  onCta,
}: {
  title?: string
  subtitle?: string
  emoji?: string
  cta?: string
  onCta?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <span className="text-5xl mb-4 block">{emoji}</span>
      <h3 className="font-bold text-xl text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed max-w-xs">{subtitle}</p>
      {cta && onCta && (
        <button
          onClick={onCta}
          className="mt-5 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl text-sm transition-colors"
        >
          {cta}
        </button>
      )}
    </div>
  )
}
