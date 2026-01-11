'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface StoreSession {
  storeId: string
  storeName: string
}

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  category: string
  category_id: string | null
  available: boolean
  image_url?: string | null
}

interface Category {
  id: string
  name: string
  store_id: string
  sort_order: number
}

export default function StoreMenu() {
  const [storeSession, setStoreSession] = useState<StoreSession | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [saving, setSaving] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const router = useRouter()

  // Category management
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [catAdding, setCatAdding] = useState(false)
  const [catError, setCatError] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    available: true,
    image: null as File | null
  })

  useEffect(() => {
    const sessionData = localStorage.getItem('store_session')
    if (!sessionData) {
      router.push('/store/login')
      return
    }

    const session = JSON.parse(sessionData)
    setStoreSession(session)
    Promise.all([loadProducts(session.storeId), loadCategories(session.storeId)])
  }, [router])

  const loadProducts = async (storeId: string) => {
    setLoading(true)

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId)
      .order('category', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      console.error('Error loading products:', error)
    } else {
      setProducts(data || [])
    }

    setLoading(false)
  }

  const loadCategories = async (storeId: string) => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('store_id', storeId)
      .order('sort_order')
      .order('name')

    if (!error) {
      setCategories(data || [])
    }
  }

  const handleAddCategory = async () => {
    setCatError('')
    if (!newCategoryName || !storeSession) {
      setCatError('Category name is required.')
      return
    }
    setCatAdding(true)
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{ store_id: storeSession.storeId, name: newCategoryName }])
        .select('*')
        .single()
      
      if (error) throw error
      setCategories(prev => [...prev, data as Category].sort((a, b) => (a.sort_order - b.sort_order) || a.name.localeCompare(b.name)))
      setNewCategoryName('')
      setShowCategoryModal(false)
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

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)
      
      if (error) throw error
      setCategories(prev => prev.filter(c => c.id !== categoryId))
      setProducts(prev => prev.map(p => p.category_id === categoryId ? { ...p, category_id: null } : p))
    } catch (e: any) {
      alert('Failed to delete category: ' + e.message)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddError('')

    if (!storeSession) return
    if (!formData.name || !formData.price || !formData.category_id) {
      setAddError('Name, price and category are required.')
      return
    }

    setAdding(true)

    try {
      let imageUrl = ''
      if (formData.image) {
        const ext = formData.image.name.split('.').pop()
        const fileName = `${storeSession.storeId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('product-images')
          .upload(fileName, formData.image)
        
        if (uploadErr) throw uploadErr
        
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName)
        imageUrl = publicUrl
      }

      const selectedCat = categories.find(c => c.id === formData.category_id)
      
      const productData = {
        store_id: storeSession.storeId,
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        category: selectedCat?.name || '',
        category_id: formData.category_id,
        available: formData.available,
        image_url: imageUrl || (editingProduct?.image_url || null)
      }

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productData])

        if (error) throw error
      }

      loadProducts(storeSession.storeId)
      closeModal()
    } catch (e: any) {
      setAddError(e?.message || 'Failed to save product')
    } finally {
      setAdding(false)
    }
  }

  const deleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)

    if (error) {
      alert('Error deleting product: ' + error.message)
    } else {
      if (storeSession) loadProducts(storeSession.storeId)
    }
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

  const openEditModal = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      category_id: product.category_id || '',
      available: product.available,
      image: null
    })
    setShowAddModal(true)
  }

  const closeModal = () => {
    setShowAddModal(false)
    setEditingProduct(null)
    setAddError('')
    setFormData({
      name: '',
      description: '',
      price: '',
      category_id: '',
      available: true,
      image: null
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading menu...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Menu Management</h1>
          <p className="text-gray-400">Manage your products and categories</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="bg-gray-800/50 backdrop-blur text-white px-4 py-2 rounded-xl border border-gray-700 hover:bg-gray-700 hover:border-gray-600 font-bold transition-all"
          >
            Categories
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-kasi-orange to-orange-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-kasi-orange/30 hover:shadow-xl hover:shadow-kasi-orange/40 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            + Add Product
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl p-3 flex gap-3 overflow-x-auto hide-scrollbar">
        {['all', ...categories.map(c => c.id)].map((catId) => {
          const cat = categories.find(c => c.id === catId)
          const label = catId === 'all' ? 'All' : cat?.name || 'Unknown'
          const count = catId === 'all' ? products.length : products.filter(p => p.category_id === catId).length
          
          return (
            <button
              key={catId}
              onClick={() => setFilter(catId)}
              className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                filter === catId
                  ? 'bg-gradient-to-r from-kasi-orange to-orange-600 text-white shadow-lg'
                  : 'bg-gray-800/50 backdrop-blur text-gray-400 hover:bg-gray-700'
              }`}
            >
              {label}
              <span className="ml-2 text-xs">({count})</span>
            </button>
          )
        })}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(filter === 'all' ? products : products.filter(p => p.category_id === filter)).map((product) => (
          <div key={product.id} className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl shadow-lg hover:border-kasi-orange/50 transition-all overflow-hidden">
            {product.image_url && (
              <div className="h-48 w-full overflow-hidden bg-gray-800">
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-4 sm:p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{product.name}</h3>
                  {product.category && (
                    <span className="inline-block mt-1 px-2 py-1 text-xs bg-gray-800 text-gray-300 rounded border border-gray-700">
                      {product.category}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => toggleAvailable(product.id, product.available)}
                  disabled={saving === product.id}
                  className={`px-3 py-1 text-xs font-medium rounded-full ${
                    product.available
                      ? 'bg-green-900/30 text-green-300 border border-green-700'
                      : 'bg-gray-800/50 text-gray-400 border border-gray-700'
                  }`}
                >
                  {saving === product.id ? '...' : (product.available ? 'Available' : 'Out of Stock')}
                </button>
              </div>

              {product.description && (
                <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                  {product.description}
                </p>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                <p className="text-xl font-bold text-kasi-orange">
                  R{product.price.toFixed(2)}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(product)}
                    className="px-3 py-1 text-sm bg-blue-900/30 text-blue-300 rounded-xl hover:bg-blue-900/50 transition-all border border-blue-800 font-bold"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteProduct(product.id)}
                    className="px-3 py-1 text-sm bg-red-900/30 text-red-300 rounded-xl hover:bg-red-900/50 transition-all border border-red-800 font-bold"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {(filter === 'all' ? products : products.filter(p => p.category_id === filter)).length === 0 && (
        <div className="text-center py-12 bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl shadow-lg">
          <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No products found</h3>
          <p className="text-gray-400 mb-4">
            {filter === 'all' 
              ? "Start by adding your first product!" 
              : `No products in this category`}
          </p>
          {filter === 'all' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-kasi-orange to-orange-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-kasi-orange/30 hover:shadow-xl hover:shadow-kasi-orange/40 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Add Your First Product
            </button>
          )}
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-800 rounded-3xl shadow-2xl max-w-md w-full my-8">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              {addError && (
                <div className="mb-4 p-3 bg-red-900/20 border border-red-800 text-red-300 rounded-xl text-sm">
                  {addError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800/50 backdrop-blur border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-kasi-orange focus:border-kasi-orange transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800/50 backdrop-blur border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-kasi-orange focus:border-kasi-orange transition-all"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Price (R) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800/50 backdrop-blur border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-kasi-orange focus:border-kasi-orange transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800/50 backdrop-blur border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-kasi-orange focus:border-kasi-orange transition-all"
                    required
                  >
                    <option value="">Select category...</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">Use Categories button to manage categories</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Product Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFormData({ ...formData, image: e.target.files?.[0] || null })}
                    className="w-full text-sm text-gray-300"
                  />
                  <p className="text-xs text-gray-400 mt-1">Upload to Supabase storage (product-images bucket)</p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="available"
                    checked={formData.available}
                    onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                    className="w-4 h-4 text-kasi-orange bg-gray-800 border-gray-700 rounded focus:ring-kasi-orange"
                  />
                  <label htmlFor="available" className="ml-2 text-sm text-gray-300">
                    Available for purchase
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={adding}
                    className="flex-1 bg-gradient-to-r from-kasi-orange to-orange-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-kasi-orange/30 hover:shadow-xl hover:shadow-kasi-orange/40 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  >
                    {adding ? 'Saving...' : (editingProduct ? 'Update Product' : 'Add Product')}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-3 bg-gray-800/50 backdrop-blur text-gray-300 rounded-xl border border-gray-700 hover:bg-gray-700 hover:border-gray-600 font-bold transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Categories Management Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-800 rounded-3xl shadow-2xl max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Manage Categories</h2>
                <button
                  onClick={() => setShowCategoryModal(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              {catError && (
                <div className="mb-4 p-3 bg-red-900/20 border border-red-800 text-red-300 rounded-xl text-sm">
                  {catError}
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Add New Category
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Category name"
                    className="flex-1 px-3 py-2 bg-gray-800/50 backdrop-blur border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-kasi-orange focus:border-kasi-orange transition-all"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
                  />
                  <button
                    onClick={handleAddCategory}
                    disabled={catAdding}
                    className="px-4 py-2 bg-kasi-orange text-white rounded-xl hover:bg-opacity-90 transition font-semibold disabled:opacity-50"
                  >
                    {catAdding ? 'Adding...' : 'Add'}
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-3">Current Categories</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {categories.length === 0 ? (
                    <div className="text-gray-400 text-sm text-center py-4">No categories yet</div>
                  ) : (
                    categories.map(cat => {
                      const productCount = products.filter(p => p.category_id === cat.id).length
                      return (
                        <div key={cat.id} className="flex items-center justify-between bg-gray-800/50 border border-gray-700 rounded-xl p-3">
                          <div>
                            <span className="text-white font-medium">{cat.name}</span>
                            <span className="text-gray-400 text-xs ml-2">({productCount} products)</span>
                          </div>
                          <button
                            onClick={() => handleDeleteCategory(cat.id, cat.name)}
                            className="px-3 py-1 text-sm bg-red-900/30 text-red-300 rounded-lg hover:bg-red-900/50 transition-all border border-red-800"
                          >
                            Delete
                          </button>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setShowCategoryModal(false)}
                  className="w-full py-3 bg-gray-800/50 backdrop-blur text-gray-300 rounded-xl border border-gray-700 hover:bg-gray-700 hover:border-gray-600 font-bold transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
