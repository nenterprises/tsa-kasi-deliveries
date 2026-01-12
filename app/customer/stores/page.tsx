'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Store, Product } from '@/types'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/lib/CartContext'
import { useActiveOrdersCount } from '@/lib/useActiveOrders'
import { ShoppingCart, Store as StoreIcon, Utensils, Beer, ShoppingBasket, Package, MapPin, Phone, Clock, User } from 'lucide-react'
import StoreProductPreview from './StoreProductPreview'

export default function StoresPage() {
  const router = useRouter()
  const { totalItems } = useCart()
  const { count: activeOrdersCount } = useActiveOrdersCount()
  const [stores, setStores] = useState<Store[]>([])
  const [storeProducts, setStoreProducts] = useState<Record<string, Product[]>>({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [user, setUser] = useState<any>(null)
  const [userName, setUserName] = useState<string>('')

  useEffect(() => {
    checkAuth()
    fetchStores()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/customer/login')
    } else {
      setUser(user)
      // Fetch user profile for display
      const { data: profile } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .single()
      if (profile?.full_name) {
        setUserName(profile.full_name)
      }
    }
  }

  const fetchStores = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('status', 'active')
        .order('name')

      if (error) throw error
      setStores(data || [])
      
      // Fetch products for each store
      if (data && data.length > 0) {
        const productsMap: Record<string, Product[]> = {}
        
        for (const store of data) {
          const { data: products } = await supabase
            .from('products')
            .select('*')
            .eq('store_id', store.id)
            .eq('available', true)
            .limit(10)
            .order('name')
          
          if (products && products.length > 0) {
            productsMap[store.id] = products
          }
        }
        
        setStoreProducts(productsMap)
      }
    } catch (error) {
      console.error('Error fetching stores:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/customer/login')
  }

  const filteredStores = stores.filter(store => {
    const matchesFilter = filter === 'all' || store.category === filter
    const matchesSearch = store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         store.description?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      tuck_shop: 'Tuck Shop',
      takeaways: 'Takeaways',
      alcohol: 'Liquor Store',
      groceries: 'Groceries',
      restaurant: 'Restaurant',
      other: 'Other'
    }
    return labels[category] || category
  }

  const getCategoryIconEl = (category: string) => {
    const common = 'w-5 h-5 text-gray-300'
    switch (category) {
      case 'tuck_shop':
        return <StoreIcon className={common} />
      case 'takeaways':
        return <Utensils className={common} />
      case 'alcohol':
        return <Beer className={common} />
      case 'groceries':
        return <ShoppingBasket className={common} />
      case 'restaurant':
        return <Utensils className={common} />
      default:
        return <Package className={common} />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-kasi-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kasi-blue mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading stores...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-kasi-black">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <div className="leading-tight">
                <h1 className="text-lg sm:text-2xl font-display font-bold">
                  <span className="text-kasi-blue">TSA</span>{' '}
                  <span className="text-kasi-orange">KASi</span>
                </h1>
                <div className="text-kasi-orange text-[10px] sm:text-xs font-semibold tracking-wide">Deliveries</div>
              </div>
              <span className="text-gray-400 text-sm hidden md:inline">Customer Portal</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                href="/customer/cart"
                className="relative bg-kasi-orange text-white px-2 sm:px-4 py-2 rounded-lg hover:bg-opacity-90 transition flex items-center gap-1 sm:gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="hidden sm:inline">Cart</span>
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Link>
              <Link
                href="/customer/orders"
                className="text-gray-300 hover:text-kasi-blue font-medium flex items-center text-sm sm:text-base"
              >
                <span className="hidden sm:inline">My Orders</span>
                <span className="sm:hidden">Orders</span>
                {activeOrdersCount > 0 && (
                  <span
                    title={`${activeOrdersCount} active`}
                    className="ml-1 sm:ml-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 min-w-5 px-1 flex items-center justify-center"
                  >
                    {activeOrdersCount}
                  </span>
                )}
              </Link>
              <Link
                href="/customer/profile"
                className="flex items-center gap-2 text-gray-300 hover:text-kasi-blue font-medium"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-700 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <span className="hidden md:inline">{userName || 'Profile'}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="hidden sm:flex p-2 sm:px-4 sm:py-2 text-sm text-red-400 hover:bg-red-900/20 rounded-lg transition-all border border-red-900/30 hover:border-red-800 items-center gap-2 flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mt-3 sm:mt-4 flex flex-col gap-3">
            <input
              type="text"
              placeholder="Search stores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-kasi-blue focus:border-transparent text-sm sm:text-base"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full sm:w-auto px-4 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-kasi-blue focus:border-transparent text-sm sm:text-base"
            >
              <option value="all">All Categories</option>
              <option value="tuck_shop">Tuck Shops</option>
              <option value="takeaways">Takeaways</option>
              <option value="restaurant">Restaurants</option>
              <option value="alcohol">Liquor Stores</option>
              <option value="groceries">Groceries</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </header>

      {/* Stores Grid */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        {filteredStores.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No stores found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredStores.map((store) => (
              <div
                key={store.id}
                className="bg-gray-900 border border-gray-800 rounded-lg hover:border-gray-700 transition-shadow duration-200 overflow-hidden"
              >
                <div className="h-28 sm:h-36 w-full bg-gray-800 border-b border-gray-800 flex items-center justify-center p-3 rounded-t-lg overflow-hidden">
                  {store.logo_url ? (
                    <img
                      src={store.logo_url}
                      alt={store.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="flex items-center gap-3 text-gray-300">
                      {getCategoryIconEl(store.category)}
                      <span className="text-sm font-semibold opacity-80">{store.name}</span>
                    </div>
                  )}
                </div>
                <div className="p-4 sm:p-6">
                  <div className="mb-3 sm:mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      {getCategoryIconEl(store.category)}
                      <span className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase">
                        {getCategoryLabel(store.category)}
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{store.name}</h3>
                    {store.description && (
                      <p className="text-gray-400 text-xs sm:text-sm line-clamp-2">{store.description}</p>
                    )}
                  </div>

                  <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                    <div className="flex items-start text-xs sm:text-sm text-gray-400">
                      <MapPin className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{store.street_address}, {store.township}</span>
                    </div>
                    {store.phone_number && (
                      <div className="flex items-center text-xs sm:text-sm text-gray-400">
                        <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span>{store.phone_number}</span>
                      </div>
                    )}
                    {store.open_time && store.close_time && (
                      <div className="flex items-center text-xs sm:text-sm text-gray-400">
                        <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span>{store.open_time} - {store.close_time}</span>
                      </div>
                    )}
                  </div>

                  {store.custom_orders_only ? (
                    <Link
                      href={`/customer/custom-request?store=${store.id}`}
                      className="block w-full text-center bg-kasi-orange hover:bg-opacity-90 text-white font-semibold py-2.5 sm:py-3 px-4 rounded-lg transition duration-200 text-sm sm:text-base"
                    >
                      Custom Request Only
                    </Link>
                  ) : (
                    <>
                      {/* Product Preview Slideshow */}
                      {storeProducts[store.id] && storeProducts[store.id].length > 0 && (
                        <StoreProductPreview 
                          storeId={store.id}
                          products={storeProducts[store.id]}
                        />
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
