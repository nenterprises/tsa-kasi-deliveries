'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Store, Product, Category } from '@/types'
import { useCart } from '@/lib/CartContext'
import { ShoppingCart, MapPin, Phone, Clock } from 'lucide-react'

export default function StorePage() {
  const params = useParams()
  const router = useRouter()
  const { addToCart, totalItems } = useCart()
  const [store, setStore] = useState<Store | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCategoryId, setActiveCategoryId] = useState<string>('')
  const [showSidebar, setShowSidebar] = useState(true)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [addedToCart, setAddedToCart] = useState<string | null>(null)

  useEffect(() => {
    fetchStoreAndProducts()
  }, [params.id])

  const fetchStoreAndProducts = async () => {
    try {
      // Fetch store
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('id', params.id)
        .single()

      if (storeError) throw storeError
      setStore(storeData)

      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', params.id)
        .eq('available', true)
        .order('name')

      if (productsError) throw productsError
      setProducts(productsData || [])

      // Fetch categories for sidebar
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('store_id', params.id)
        .order('sort_order')
        .order('name')
      if (categoriesError) throw categoriesError
      setCategories(categoriesData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = (product: Product) => {
    addToCart(product, store?.name)
    setAddedToCart(product.id)
    setTimeout(() => setAddedToCart(null), 2000)
  }

  const textFiltered = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  )
  const filteredProducts = activeCategoryId
    ? textFiltered.filter(p => p.category_id === activeCategoryId)
    : textFiltered

  const activeCategoryName = activeCategoryId
    ? categories.find(c => c.id === activeCategoryId)?.name
    : 'All'

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
          <Link href="/customer/stores" className="text-kasi-blue hover:underline mt-4 inline-block">
            Back to Stores
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-kasi-black">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="leading-tight">
                <h1 className="text-xl font-display font-bold">
                  <span className="text-kasi-blue">TSA</span>{' '}
                  <span className="text-kasi-orange">KASi</span>
                </h1>
                <div className="text-kasi-orange text-[10px] font-semibold tracking-wide">Deliveries</div>
              </div>
              <Link href="/customer/stores" className="text-gray-300 hover:text-kasi-blue font-medium">
                ← Back to Stores
              </Link>
            </div>
            <Link
              href="/customer/cart"
              className="relative bg-kasi-orange text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition flex items-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Cart</span>
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Store Info */}
      <div className="bg-gray-900 border-y border-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-2">
            {store.logo_url && (
              <img
                src={store.logo_url}
                alt={store.name}
                className="w-12 h-12 rounded-lg object-cover border border-gray-800"
              />
            )}
            <h1 className="text-3xl font-bold">{store.name}</h1>
          </div>
          {store.description && <p className="text-lg opacity-90 mb-4 text-gray-300">{store.description}</p>}
          <div className="flex flex-wrap gap-4 text-sm text-gray-300">
            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {store.street_address}, {store.township}</span>
            {store.phone_number && <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {store.phone_number}</span>}
            {store.open_time && store.close_time && (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" /> {store.open_time.startsWith('00:00') && store.close_time.startsWith('23:59')
                  ? '24 hours'
                  : `${store.open_time} - ${store.close_time}`}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-kasi-blue focus:border-transparent"
        />
      </div>

      {/* Products + Sidebar */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Toolbar for category control */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-300">Category:</span>
            <span className="px-2 py-1 rounded bg-gray-800 text-gray-100 text-sm border border-gray-700">
              {activeCategoryName}
            </span>
            {activeCategoryId && (
              <button
                onClick={() => { setActiveCategoryId(''); setShowSidebar(true) }}
                className="text-sm text-kasi-blue hover:underline"
              >
                Clear
              </button>
            )}
          </div>
          <button
            onClick={() => setShowSidebar(s => !s)}
            className="px-3 py-2 text-sm rounded border border-gray-700 text-gray-200 bg-gray-900 hover:bg-gray-800"
          >
            {showSidebar ? 'Hide Categories' : 'Categories'}
          </button>
        </div>

        {/* Quick category pills when sidebar is hidden */}
        {!showSidebar && categories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              onClick={() => { setActiveCategoryId(''); setShowSidebar(true) }}
              className={`px-3 py-1 rounded-full border text-sm whitespace-nowrap ${
                activeCategoryId === ''
                  ? 'bg-kasi-orange text-white border-kasi-orange'
                  : 'bg-gray-900 text-gray-200 border-gray-700 hover:bg-gray-800'
              }`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCategoryId(c.id)}
                className={`px-3 py-1 rounded-full border text-sm whitespace-nowrap ${
                  activeCategoryId === c.id
                    ? 'bg-kasi-orange text-white border-kasi-orange'
                    : 'bg-gray-900 text-gray-200 border-gray-700 hover:bg-gray-800'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar */}
          {showSidebar && (
          <aside className="lg:col-span-2">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 sticky top-20">
              <div className="space-y-2">
                <button
                  onClick={() => { setActiveCategoryId(''); setShowSidebar(true) }}
                  className={`w-full text-left px-3 py-2 rounded-md ${activeCategoryId === '' ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800/60'}`}
                >
                  All
                </button>
                {categories.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setActiveCategoryId(c.id); setShowSidebar(false) }}
                    className={`w-full text-left px-3 py-2 rounded-md ${activeCategoryId === c.id ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800/60'}`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          </aside>
          )}
          {/* Products Grid */}
          <section className={`lg:col-span-10 ${!showSidebar ? 'lg:col-span-12' : ''}`}>
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg mb-4">
              {searchTerm ? 'No products found matching your search.' : 'No products available at this store.'}
            </p>
            <Link
              href={`/customer/custom-request?store=${store.id}`}
              className="inline-block bg-kasi-orange text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition"
            >
              Make a Custom Request Instead
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-gray-900 border border-gray-800 rounded-lg hover:border-gray-700 transition-shadow duration-200 overflow-hidden"
              >
                {product.image_url && (
                  <div className="h-48 bg-gray-800 overflow-hidden">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <div className="mb-3">
                    <span className="text-xs font-semibold text-gray-400 uppercase">
                      {product.category}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-1">{product.name}</h3>
                    {product.description && (
                      <p className="text-sm text-gray-400 mt-1 line-clamp-2">{product.description}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-kasi-orange">
                      R{product.price.toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleAddToCart(product)}
                      className={`px-4 py-2 rounded-lg font-semibold transition duration-200 ${
                        addedToCart === product.id
                          ? 'bg-green-500 text-white'
                          : 'bg-kasi-orange hover:bg-opacity-90 text-white'
                      }`}
                    >
                      {addedToCart === product.id ? '✓ Added' : '+ Add'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
          </section>
        </div>
      </main>
    </div>
  )
}
