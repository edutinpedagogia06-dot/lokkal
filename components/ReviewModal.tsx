'use client'

import { useState } from 'react'
import { addDoc, collection, serverTimestamp, updateDoc, doc, increment } from 'firebase/firestore'
import { X, Star } from 'lucide-react'
import { db } from '@/lib/firebase'
import { Producto } from '@/types'
import { useAuth } from '@/hooks/useAuth'

interface Props { product: Producto; onClose: () => void }

export default function ReviewModal({ product, onClose }: Props) {
  const { user, profile } = useAuth()
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async () => {
    if (!user || rating === 0) return
    setSaving(true)
    try {
      await addDoc(collection(db, 'resenas'), {
        productoId: product.id,
        marcaId: product.marcaId,
        usuarioId: user.uid,
        usuarioName: profile?.displayName || user.email || 'Anónimo',
        usuarioPhotoUrl: profile?.photoURL || '',
        rating,
        text: text.trim(),
        createdAt: serverTimestamp(),
      })
      // Update product avg (simplified — for production use a Cloud Function)
      await updateDoc(doc(db, 'productos', product.id), {
        reviewsCount: increment(1),
      })
      setDone(true)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white w-full max-w-md rounded-t-3xl p-6 pb-10"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-gray-900">Dejar reseña</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200">
            <X size={16} />
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4 line-clamp-1">{product.title}</p>

        {done ? (
          <div className="text-center py-8">
            <span className="text-4xl mb-3 block">🎉</span>
            <p className="font-semibold text-gray-800">¡Gracias por tu reseña!</p>
            <p className="text-sm text-gray-400 mt-1">Tu opinión ayuda a otros compradores.</p>
            <button onClick={onClose} className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold">
              Cerrar
            </button>
          </div>
        ) : (
          <>
            {/* Star selector */}
            <div className="flex gap-2 mb-4 justify-center">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onMouseEnter={() => setHovered(n)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(n)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={32}
                    className={n <= (hovered || rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-xs text-gray-400 mb-4">
              {rating === 0 ? 'Selecciona una calificación' : ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'][rating]}
            </p>

            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Cuéntanos tu experiencia (opcional)..."
              rows={3}
              maxLength={400}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
            <div className="text-right text-xs text-gray-300 mt-1">{text.length}/400</div>

            {!user && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-xl p-2 mt-2">
                Inicia sesión para dejar una reseña.
              </p>
            )}

            <button
              onClick={submit}
              disabled={!user || rating === 0 || saving}
              className="mt-3 w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
              Publicar reseña
            </button>
          </>
        )}
      </div>
    </div>
  )
}
