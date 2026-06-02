'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  collection, query, where, orderBy, limit,
  getDocs, Query, DocumentData,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Producto, FeedFilters } from '@/types'
import { computeScore } from '@/lib/utils'

const PAGE_SIZE = 24

interface UseFeedResult {
  products: Producto[]
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  loadMore: () => void
  refresh: () => void
}

export function useRecommendedFeed(filters: FeedFilters = {}): UseFeedResult {
  const [products, setProducts] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)

  const fetchPage = useCallback(async (pageNum: number, append: boolean) => {
    if (pageNum === 0) setLoading(true)
    else setLoadingMore(true)

    try {
      let q: Query<DocumentData> = collection(db, 'productos') as any
      const constraints: any[] = []

      if (filters.category && filters.category !== 'todas') {
        constraints.push(where('category', '==', filters.category))
      }
      if (filters.city) {
        constraints.push(where('city', '==', filters.city))
      }

      // Primary sort: score desc (pre-computed field)
      constraints.push(orderBy('score', 'desc'))
      constraints.push(limit(PAGE_SIZE))

      q = query(collection(db, 'productos'), ...constraints)
      const snap = await getDocs(q)
      let docs: Producto[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as Producto))

      // Client-side text filter (Firestore full-text not supported)
      if (filters.query) {
        const q2 = filters.query.toLowerCase()
        docs = docs.filter(p =>
          p.title.toLowerCase().includes(q2) ||
          p.marcaName.toLowerCase().includes(q2) ||
          p.description?.toLowerCase().includes(q2)
        )
      }

      // Re-compute score client-side for fresh data
      docs = docs.map(p => ({ ...p, score: computeScore(p) }))
        .sort((a, b) => b.score - a.score)

      setHasMore(snap.docs.length === PAGE_SIZE)
      setProducts(prev => append ? [...prev, ...docs] : docs)
    } catch (err) {
      console.error('Feed error:', err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [filters.category, filters.city, filters.query])

  useEffect(() => {
    setPage(0)
    fetchPage(0, false)
  }, [filters.category, filters.city, filters.query])

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      const next = page + 1
      setPage(next)
      fetchPage(next, true)
    }
  }, [page, loadingMore, hasMore, fetchPage])

  const refresh = useCallback(() => {
    setPage(0)
    fetchPage(0, false)
  }, [fetchPage])

  return { products, loading, loadingMore, hasMore, loadMore, refresh }
}

/** Feed filtered by a single brand */
export function useBrandFeed(marcaId: string): Omit<UseFeedResult, 'loadMore' | 'hasMore'> {
  const [products, setProducts] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!marcaId) return
    const q = query(
      collection(db, 'productos'),
      where('marcaId', '==', marcaId),
      orderBy('createdAt', 'desc')
    )
    getDocs(q).then(snap => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Producto)))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [marcaId])

  return { products, loading, loadingMore: false, refresh: () => {} }
}

/** Feed for TikTok-style vertical video scroll */
export function useVideoFeed(filters: FeedFilters = {}): UseFeedResult {
  const [products, setProducts] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    const constraints: any[] = [
      where('videoUrl', '!=', null),
      orderBy('videoUrl'),
      orderBy('score', 'desc'),
      limit(20),
    ]
    if (filters.city) constraints.splice(0, 0, where('city', '==', filters.city))
    const q = query(collection(db, 'productos'), ...constraints)
    getDocs(q).then(snap => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Producto)))
      setHasMore(snap.docs.length === 20)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [filters.city])

  return { products, loading, loadingMore, hasMore, loadMore: () => {}, refresh: () => {} }
}
