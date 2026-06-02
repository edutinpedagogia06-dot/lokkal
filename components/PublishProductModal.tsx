'use client'

import { useState, useRef } from 'react'
import { addDoc, collection, serverTimestamp, doc, getDoc } from 'firebase/firestore'
import { X, Upload, CheckCircle } from 'lucide-react'
import { db } from '@/lib/firebase'
import { Category } from '@/types'
import { CATEGORIES, validateColombianPhone } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!

const SIZES = ['XS','S','M','L','XL','XXL','Único','35','36','37','38','39','40']
const COLORS = ['#0f0e0d','#ffffff','#e84c1e','#f5a623','#18a558','#2563eb','#7c3aed','#db2777','#d97706','#9ca3af']

interface Props { onClose: () => void; onPublished?: () => void }

async function uploadToCloudinary(file: File): Promise<{ url: string; type: 'image' | 'video' }> {
  const resourceType = file.type.startsWith('video') ? 'video' : 'image'
  const form = new FormData()
  form.append('file', file)
  form.append('upload_preset', UPLOAD_PRESET)
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`, {
    method: 'POST', body: form,
  })
  const data = await res.json()
  if (!data.secure_url) throw new Error(data.error?.message || 'Upload failed')
  return { url: data.secure_url, type: resourceType }
}

export default function PublishProductModal({ onClose, onPublished }: Props) {
  const { user, profile } = useAuth()
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Category>('moda')
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [mediaUrl, setMediaUrl] = useState('')
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setUploading(true)
    try {
      const { url, type } = await uploadToCloudinary(f)
      setMediaUrl(url)
      setMediaType(type)
    } catch (err: any) {
      alert('Error al subir: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const toggleColor = (c: string) =>
    setSelectedColors(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])

  const toggleSize = (s: string) =>
    setSelectedSizes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  const submit = async () => {
    if (!user || !title || !price || !mediaUrl) return
    if (!profile?.marcaId) { alert('Completa tu perfil de marca primero'); return }
    setSaving(true)
    try {
      // Fetch brand data from Firestore to inject automatically
      const marcaSnap = await getDoc(doc(db, 'marcas', profile.marcaId))
      if (!marcaSnap.exists()) throw new Error('Marca no encontrada')
      const m = marcaSnap.data()

      await addDoc(collection(db, 'productos'), {
        // Auto-injected from session — seller never types these
        marcaId: profile.marcaId,
        marcaSlug: m.slug,
        marcaName: m.name,
        marcaLogoUrl: m.logoUrl || '',
        marcaWhatsapp: m.whatsapp || '',
        marcaCity: m.city || '',
        city: m.city || '',
        // Seller inputs
        title: title.trim(),
        price: Number(price),
        description: description.trim(),
        category,
        colors: selectedColors,
        sizes: selectedSizes,
        imageUrl: mediaType === 'image' ? mediaUrl : '',
        videoUrl: mediaType === 'video' ? mediaUrl : null,
        // Defaults
        likesCount: 0,
        viewsCount: 0,
        reviewsAvg: 0,
        reviewsCount: 0,
        score: 0,
        createdAt: serverTimestamp(),
      })
      setDone(true)
      onPublished?.()
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!user) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-t-3xl max-h-[94dvh] overflow-y-auto">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="px-5 pb-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-xl text-gray-900">Publicar producto</h2>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
              <X size={16} />
            </button>
          </div>

          {/* Brand context — auto-injected, read-only */}
          {profile?.marcaId && (
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 mb-4 text-xs text-orange-700 font-medium">
              Publicando como <strong>{profile.displayName}</strong> · {profile.city}
            </div>
          )}

          {done ? (
            <div className="text-center py-12">
              <CheckCircle className="text-emerald-500 w-16 h-16 mx-auto mb-4" />
              <p className="font-bold text-lg text-gray-900 mb-1">¡Publicado con éxito!</p>
              <p className="text-gray-400 text-sm mb-5">Tu producto ya está visible en el catálogo.</p>
              <button onClick={onClose} className="px-6 py-2.5 bg-orange-500 text-white rounded-xl font-semibold text-sm">
                Ver mi perfil
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Media upload */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Foto o video *
                </label>
                <label
                  onClick={() => fileRef.current?.click()}
                  className={`block border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-colors ${
                    uploading ? 'border-orange-300 bg-orange-50' : mediaUrl ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                  }`}
                >
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
                      <span className="text-xs text-orange-600 font-medium">Procesando archivo...</span>
                    </div>
                  ) : mediaUrl ? (
                    <div className="flex flex-col items-center gap-1">
                      <CheckCircle className="text-emerald-500" size={24} />
                      <span className="text-xs text-emerald-600 font-medium">
                        {mediaType === 'video' ? '🎬 Video listo' : '🖼️ Imagen lista'}
                      </span>
                      {mediaType === 'image' && (
                        <img src={mediaUrl} className="w-20 h-20 object-cover rounded-xl mt-2 border" alt="" />
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5">
                      <Upload size={28} className="text-gray-300" />
                      <span className="text-sm text-gray-500 font-medium">Toca para subir foto o video</span>
                      <span className="text-xs text-gray-400">JPG, PNG, MP4 · máx 50MB</span>
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFile} />
                </label>
              </div>

              {/* Title */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Nombre del producto *</label>
                <input
                  value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="Ej: Body Floral Negro Talla M"
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              {/* Price */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Precio (COP) *</label>
                <input
                  type="number" value={price} onChange={e => setPrice(e.target.value)}
                  placeholder="85000" min={0}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Categoría</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as Category)}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-orange-400 bg-white"
                >
                  {CATEGORIES.filter(c => c.value !== 'todas').map(c => (
                    <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
                  ))}
                </select>
              </div>

              {/* Colors */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Colores disponibles</label>
                <div className="flex flex-wrap gap-2.5">
                  {COLORS.map(c => (
                    <button
                      key={c} type="button" onClick={() => toggleColor(c)}
                      className={`w-8 h-8 rounded-full border-2 transition-all relative ${selectedColors.includes(c) ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                      style={{ background: c }}
                    >
                      {selectedColors.includes(c) && (
                        <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sizes */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Tallas disponibles</label>
                <div className="flex flex-wrap gap-2">
                  {SIZES.map(s => (
                    <button
                      key={s} type="button" onClick={() => toggleSize(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        selectedSizes.includes(s)
                          ? 'bg-orange-500 border-orange-500 text-white scale-105'
                          : 'border-gray-200 text-gray-500 hover:border-orange-300'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Descripción</label>
                <textarea
                  value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Materiales, detalles, instrucciones de cuidado..."
                  rows={3} maxLength={500}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              <button
                onClick={submit}
                disabled={!title || !price || !mediaUrl || uploading || saving}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2 text-base"
              >
                {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Publicar producto 🚀
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
