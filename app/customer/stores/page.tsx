'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Store } from '@/types'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/lib/CartContext'
import { useActiveOrdersCount } from '@/lib/useActiveOrders'
import { ShoppingCart, Store as StoreIcon, Utensils, Beer, ShoppingBasket, Package, MapPin, Phone, Clock } from 'lucide-react'

export default function StoresPage() {
  const router = useRouter()
  const { totalItems } = useCart()
  const { count: activeOrdersCount } = useActiveOrdersCount()
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [user, setUser] = useState<any>(null)

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
      spaza: 'Spaza Shop',
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
      case 'spaza':
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="leading-tight">
                <h1 className="text-2xl font-display font-bold">
                  <span className="text-kasi-blue">TSA</span>{' '}
                  <span className="text-kasi-orange">KASi</span>
                </h1>
                <div className="text-kasi-orange text-xs font-semibold tracking-wide">Deliveries</div>
              </div>
              <span className="text-gray-400 text-sm hidden sm:inline">Customer Portal</span>
            </div>
            <div className="flex items-center gap-4">
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
              <Link
                href="/customer/orders"
                className="text-gray-300 hover:text-kasi-blue font-medium flex items-center"
              >
                My Orders
                {activeOrdersCount > 0 && (
                  <span
                    title={`${activeOrdersCount} active`}
                    className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 min-w-5 px-1 flex items-center justify-center"
                  >
                    {activeOrdersCount}
                  </span>
                )}
              </Link>
              <button
                onClick={handleLogout}
                className="text-gray-300 hover:text-red-500 font-medium"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mt-4 flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Search stores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-kasi-blue focus:border-transparent"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-kasi-blue focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="spaza">Spaza Shops</option>
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

      {/* Custom Request Banner */}
      <div className="bg-gray-900 border-y border-gray-800 text-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg">Need something specific?</h2>
              <p className="text-sm opacity-90 text-gray-300">Submit a custom request like "Buy 2 loaves at Spaza X"</p>
            </div>
            <Link
              href="/customer/custom-request"
              className="bg-kasi-orange text-white px-6 py-2 rounded-lg font-semibold hover:bg-opacity-90 transition"
            >
              Custom Request
            </Link>
          </div>
        </div>
      </div>

      {/* Stores Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredStores.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No stores found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStores.map((store) => (
              <div
                key={store.id}
                className="bg-gray-900 border border-gray-800 rounded-lg hover:border-gray-700 transition-shadow duration-200 overflow-hidden"
              >
                <div className="h-36 w-full bg-gray-800 border-b border-gray-800 flex items-center justify-center p-3 rounded-t-lg overflow-hidden">
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
                <div className="p-6">
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      {getCategoryIconEl(store.category)}
                      <span className="text-xs font-semibold text-gray-400 uppercase">
                        {getCategoryLabel(store.category)}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{store.name}</h3>
                    {store.description && (
                      <p className="text-gray-400 text-sm">{store.description}</p>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-400">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{store.street_address}, {store.township}</span>
                    </div>
                    {store.phone_number && (
                      <div className="flex items-center text-sm text-gray-400">
                        <Phone className="w-4 h-4 mr-2" />
                        <span>{store.phone_number}</span>
                      </div>
                    )}
                    {store.open_time && store.close_time && (
                      <div className="flex items-center text-sm text-gray-400">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>{store.open_time} - {store.close_time}</span>
                      </div>
                    )}
                  </div>

                  {store.custom_orders_only ? (
                    <Link
                      href={`/customer/custom-request?store=${store.id}`}
                      className="block w-full text-center bg-kasi-orange hover:bg-opacity-90 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
                    >
                      Custom Request Only
                    </Link>
                  ) : (
                    <Link
                      href={`/customer/store/${store.id}`}
                      className="block w-full text-center bg-kasi-orange hover:bg-opacity-90 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
                    >
                      Browse Products
                    </Link>
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
