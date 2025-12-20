"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Product, Store, Category } from '@/types'

export default function EditProductPage() {
  const params = useParams()
  const router = useRouter()
  const storeId = params?.id as string
  const productId = params?.productId as string

  const [store, setStore] = useState<Store | null>(null)
  const [product, setProduct] = useState<Product | null>(null)
  const [initialProduct, setInitialProduct] = useState<Product | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string>('')
  const [message, setMessage] = useState<string>('')
  const [authUserEmail, setAuthUserEmail] = useState<string | null>(null)

  useEffect(() => {
    if (!storeId || !productId) return
    ;(async () => {
      const { data: auth } = await supabase.auth.getUser()
      setAuthUserEmail(auth.user?.email ?? null)
      const [storeRes, productRes, categoriesRes] = await Promise.all([
        supabase.from('stores').select('*').eq('id', storeId).single(),
        supabase.from('products').select('*').eq('id', productId).single(),
        supabase.from('categories').select('*').eq('store_id', storeId).order('sort_order').order('name')
      ])
      const { data: storeData } = storeRes as any
      const { data: productData } = productRes as any
      const { data: categoriesData } = categoriesRes as any
      if (storeData) setStore(storeData as Store)
      if (productData) {
        setProduct(productData as Product)
        setInitialProduct(productData as Product)
      }
      if (categoriesData) setCategories(categoriesData as Category[])
      setLoading(false)
    })()
  }, [storeId, productId])

  const hasChanges = () => {
    if (!product || !initialProduct) return false
    const fields: (keyof Product)[] = ['name', 'description', 'price', 'category', 'image_url', 'available']
    return fields.some((f) => (product as any)[f] !== (initialProduct as any)[f])
  }

  const handleSave = async () => {
    if (!product) return
    if (!hasChanges()) {
      setMessage('No changes to save.')
      return
    }
    setSaving(true)
    setError('')
    setMessage('')
    const { error } = await supabase
      .from('products')
      .update({
        name: product.name,
        description: product.description || null,
        price: product.price,
        category: product.category,
        category_id: product.category_id || null,
        image_url: product.image_url || null,
        available: product.available,
      })
      .eq('id', product.id)

    if (error) {
      setError('Failed to save product.')
    } else {
      setMessage('Product saved.')
      setInitialProduct(product)
    }
    setSaving(false)
  }

  const handleImageUpload = async (file: File) => {
    if (!product) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const fileName = `${storeId}/${product.id}_${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('product-images')
        .upload(fileName, file)
      if (uploadErr) throw uploadErr
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName)
      setProduct({ ...product, image_url: publicUrl })
      setMessage('Image uploaded. Click Save to persist.')
    } catch (e: any) {
      console.error(e)
      setError('Image upload failed. Ensure bucket "product-images" exists and is Public.')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-kasi-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kasi-blue mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading product…</p>
        </div>
      </div>
    )
  }

  if (!store || !product) {
    return (
      <div className="min-h-screen bg-kasi-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Product or Store not found</p>
          <Link href={`/admin/stores/${storeId}/products`} className="text-kasi-blue hover:underline mt-4 inline-block">
            Back to Products
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-kasi-black">
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-display font-bold">
              <span className="text-kasi-blue">TSA</span>{' '}
              <span className="text-kasi-orange">KASi</span>
            </h1>
            <span className="text-gray-400 text-sm">Admin • Edit Product</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/admin/stores/${store.id}/products`} className="text-gray-300 hover:text-kasi-blue font-medium">← Back</Link>
            <Link href={`/customer/store/${store.id}`} className="bg-kasi-orange text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition">Customer View</Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          {!authUserEmail && (
            <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-700 text-yellow-300 rounded">
              Not signed in. Storage uploads require authentication. Please sign in via Admin Login.
            </div>
          )}
          {message && <div className="mb-4 p-3 bg-green-900/30 border border-green-700 text-green-300 rounded">{message}</div>}
          {error && <div className="mb-4 p-3 bg-red-900/30 border border-red-700 text-red-300 rounded">{error}</div>}
          {!hasChanges() ? (
            <div className="mb-4 p-3 bg-gray-800 border border-gray-700 text-gray-300 rounded">No changes to save</div>
          ) : (
            <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-700 text-yellow-300 rounded">Unsaved changes</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Name</label>
              <input
                value={product.name}
                onChange={(e) => setProduct({ ...product, name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Price (R)</label>
              <input
                type="number"
                step="0.01"
                value={product.price}
                onChange={(e) => setProduct({ ...product, price: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Category</label>
              <select
                value={product.category_id || ''}
                onChange={(e) => {
                  const id = e.target.value
                  const c = categories.find(x => x.id === id)
                  setProduct({ ...product, category_id: id || null, category: c?.name || '' })
                }}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded"
              >
                <option value="">Select category…</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-300 mb-1">Description</label>
              <textarea
                value={product.description || ''}
                onChange={(e) => setProduct({ ...product, description: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-300 mb-1">Availability</label>
              <div className="flex items-center gap-3">
                <input
                  id="available"
                  type="checkbox"
                  checked={product.available}
                  onChange={(e) => setProduct({ ...product, available: e.target.checked })}
                />
                <label htmlFor="available" className="text-gray-300">Available</label>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-300 mb-1">Product Image</label>
              <div className="flex items-center gap-4">
                {product.image_url ? (
                  <div className="h-24 w-24 rounded border border-gray-700 overflow-hidden bg-gray-800">
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="h-24 w-24 rounded border border-dashed border-gray-700 flex items-center justify-center text-gray-500 text-xs">
                    No image
                  </div>
                )}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) handleImageUpload(f)
                    }}
                    className="w-full text-sm text-gray-300"
                  />
                  <div className="text-xs text-gray-400 mt-1">Uploads go to Supabase bucket: product-images (must be Public).</div>
                  {uploading && <div className="text-xs text-gray-400 mt-1">Uploading…</div>}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges()}
              className="px-6 py-2 bg-kasi-orange text-white rounded-lg hover:bg-opacity-90 transition font-semibold disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <Link href={`/admin/stores/${store.id}/products`} className="px-6 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 hover:bg-gray-700">Back to Products</Link>
          </div>
        </div>
      </main>
    </div>
  )
}
