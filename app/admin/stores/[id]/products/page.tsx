'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Product, Store, Category } from '@/types'

export default function StoreProductsAdminPage() {
  const params = useParams()
  const storeId = params?.id as string
  const [store, setStore] = useState<Store | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const [addErrorDetail, setAddErrorDetail] = useState<string | null>(null)
  const [authUserEmail, setAuthUserEmail] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [newCategoryId, setNewCategoryId] = useState<string>('')
  const [newDescription, setNewDescription] = useState('')
  const [newImage, setNewImage] = useState<File | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [catError, setCatError] = useState('')
  const [catAdding, setCatAdding] = useState(false)

  useEffect(() => {
    if (!storeId) return
    ;(async () => {
      const { data: auth } = await supabase.auth.getUser()
      setAuthUserEmail(auth.user?.email ?? null)
      await loadStore()
      await Promise.all([loadProducts(), loadCategories()])
      setLoading(false)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId])

  const loadStore = async () => {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .single()
    if (!error) setStore(data as Store)
  }

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId)
      .order('name')
    if (!error) setProducts((data || []) as Product[])
  }

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('store_id', storeId)
      .order('sort_order')
      .order('name')
    if (!error) setCategories((data || []) as Category[])
  }

  const toggleAvailable = async (productId: string, available: boolean) => {
    setSaving(productId)
    const { error } = await supabase
      .from('products')
      .update({ available: !available })
      .eq('id', productId)
    if (!error) {
      setProducts(prev => prev.map(p => (p.id === productId ? { ...p, available: !available } : p)))
    }
    setSaving(null)
  }

  const handleAddProduct = async () => {
    setAddError('')
    setAddErrorDetail(null)
    if (!newName || !newPrice || !newCategoryId) {
      setAddError('Name, price and category are required.')
      return
    }
    setAdding(true)
    try {
      let imageUrl = ''
      if (newImage) {
        const ext = newImage.name.split('.').pop()
        const fileName = `${storeId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('product-images')
          .upload(fileName, newImage)
        if (uploadErr) throw uploadErr
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName)
        imageUrl = publicUrl
      }

      const selectedCat = categories.find(c => c.id === newCategoryId)
      const { data, error } = await supabase
        .from('products')
        .insert([
          {
            store_id: storeId,
            name: newName,
            description: newDescription || null,
            price: parseFloat(newPrice),
            category: selectedCat?.name || '',
            category_id: newCategoryId,
            image_url: imageUrl || null,
            available: true,
          }
        ])
        .select('*')
      if (error) throw error
      setProducts((prev) => [...prev, ...(data as Product[])])

      // reset form
      setNewName('')
      setNewPrice('')
      setNewCategoryId('')
      setNewDescription('')
      setNewImage(null)
    } catch (e: any) {
      console.error(e)
      setAddError('Failed to add product. Ensure you are logged in and bucket "product-images" exists and is Public.')
      setAddErrorDetail(e?.message ?? String(e))
    } finally {
      setAdding(false)
    }
  }

  const handleAddCategory = async () => {
    setCatError('')
    if (!newCategoryName) {
      setCatError('Category name is required.')
      return
    }
    setCatAdding(true)
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{ store_id: storeId, name: newCategoryName }])
        .select('*')
        .single()
      if (error) throw error
      setCategories(prev => [...prev, data as Category].sort((a,b) => (a.sort_order-b.sort_order) || a.name.localeCompare(b.name)))
      setNewCategoryName('')
    } catch (e: any) {
      setCatError(e?.message || 'Failed to add category')
    } finally {
      setCatAdding(false)
    }
  }

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    const productCount = products.filter(p => p.category_id === categoryId).length
    const confirmMsg = productCount > 0
      ? `Delete "${categoryName}"? ${productCount} product(s) use this category and will be unlinked.`
      : `Delete "${categoryName}"?`
    
    if (!confirm(confirmMsg)) return

    setCatError('')
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)
      if (error) throw error
      setCategories(prev => prev.filter(c => c.id !== categoryId))
      // Clear category_id from local products state
      setProducts(prev => prev.map(p => p.category_id === categoryId ? { ...p, category_id: null } : p))
    } catch (e: any) {
      setCatError(e?.message || 'Failed to delete category')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-kasi-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kasi-blue mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading products...</p>
        </div>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-kasi-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Store not found</p>
          <Link href="/admin/stores" className="text-kasi-blue hover:underline mt-4 inline-block">
            Back to Stores
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-kasi-black">
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-display font-bold">
              <span className="text-kasi-blue">TSA</span>{' '}
              <span className="text-kasi-orange">KASi</span>
            </h1>
            <span className="text-gray-400 text-sm">Admin • {store.name} Products</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/stores" className="text-gray-300 hover:text-kasi-blue font-medium">Stores</Link>
            <Link href={`/customer/store/${store.id}`} className="bg-kasi-orange text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition">Customer View</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
          {!authUserEmail && (
            <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-700 text-yellow-300 rounded">
              Not signed in. Storage uploads require authentication. Please sign in via Admin Login.
            </div>
          )}
          <h3 className="text-white font-semibold mb-4">Categories</h3>
          {catError && (
            <div className="mb-3 p-3 bg-red-900/30 border border-red-700 text-red-300 rounded">{catError}</div>
          )}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {categories.length === 0 ? (
              <div className="text-gray-400 text-sm">No categories yet.</div>
            ) : (
              categories.map(c => (
                <span key={c.id} className="px-3 py-1 rounded border border-gray-700 text-gray-200 text-sm bg-gray-800 flex items-center gap-2">
                  {c.name}
                  <button
                    onClick={() => handleDeleteCategory(c.id, c.name)}
                    className="text-red-400 hover:text-red-300 ml-1"
                    title="Delete category"
                  >
                    ✕
                  </button>
                </span>
              ))
            )}
          </div>
          <div className="flex items-center gap-2 mb-8">
            <input
              placeholder="New category name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded w-64"
            />
            <button onClick={handleAddCategory} disabled={catAdding} className="px-4 py-2 bg-gray-700 text-white rounded disabled:opacity-50">
              {catAdding ? 'Adding…' : 'Add Category'}
            </button>
          </div>

          <h3 className="text-white font-semibold mb-4">Add Product</h3>
          {addError && (
            <div className="mb-3 p-3 bg-red-900/30 border border-red-700 text-red-300 rounded">
              <div>{addError}</div>
              {addErrorDetail && <div className="text-xs opacity-80 mt-1">{addErrorDetail}</div>}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Name</label>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded" />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Price (R)</label>
              <input type="number" step="0.01" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded" />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Category</label>
              <select value={newCategoryId} onChange={(e) => setNewCategoryId(e.target.value)} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded">
                <option value="">Select category…</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Image</label>
              <input type="file" accept="image/*" onChange={(e) => setNewImage(e.target.files?.[0] || null)} className="w-full text-sm text-gray-300" />
              <div className="text-xs text-gray-400 mt-1">Uploads go to Supabase bucket: product-images (must be Public).</div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-300 mb-1">Description</label>
              <textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded" />
            </div>
          </div>
          <div className="mt-4">
            <button onClick={handleAddProduct} disabled={adding} className="px-6 py-2 bg-kasi-orange text-white rounded-lg hover:bg-opacity-90 transition font-semibold disabled:opacity-50">
              {adding ? 'Adding…' : 'Add Product'}
            </button>
          </div>
        </div>
        {products.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400">No products yet. Add items via the Add Store flow or SQL.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p) => (
              <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                {p.image_url && (
                  <div className="h-40 w-full mb-3 overflow-hidden rounded bg-gray-800">
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="mb-2 text-xs text-gray-400 uppercase">{p.category}</div>
                <div className="text-white font-semibold">{p.name}</div>
                {p.description && <div className="text-gray-400 text-sm mt-1 line-clamp-2">{p.description}</div>}
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="text-kasi-orange font-bold">R{Number(p.price).toFixed(2)}</div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleAvailable(p.id, p.available)}
                      disabled={saving === p.id}
                      className={`px-3 py-1 rounded text-sm font-semibold border ${p.available ? 'bg-green-600/30 text-green-300 border-green-700' : 'bg-gray-800 text-gray-300 border-gray-700'}`}
                    >
                      {saving === p.id ? 'Saving…' : p.available ? 'Available' : 'Hidden'}
                    </button>
                    <Link
                      href={`/admin/stores/${store.id}/products/${p.id}/edit`}
                      className="px-3 py-1 rounded text-sm font-semibold border bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
