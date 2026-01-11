'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Store as StoreType } from '@/types'
import { Plus, Search, MapPin, Phone, Clock, Package, ShoppingCart, Copy, Check } from 'lucide-react'
import AddStoreModal from './AddStoreModal'
import Link from 'next/link'

export default function StoresPage() {
  const [stores, setStores] = useState<StoreType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [productCounts, setProductCounts] = useState<Record<string, number>>({})
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  

  useEffect(() => {
    loadStores()
  }, [])

  const loadStores = async () => {
    try {
      let query = supabase.from('stores').select('*').order('created_at', { ascending: false })

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus)
      }

      const { data, error } = await query

      if (error) throw error
      const loaded = data || []
      setStores(loaded)

      // Load product counts per store to help diagnose "no products" issues
      const entries = await Promise.all(
        loaded.map(async (s) => {
          const { count } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('store_id', s.id)
          return [s.id, count || 0] as const
        })
      )
      setProductCounts(Object.fromEntries(entries))
    } catch (error) {
      console.error('Error loading stores:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyAccessCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const filteredStores = stores.filter(store =>
    store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-900/30 text-green-300 border border-green-700',
      pending: 'bg-yellow-900/30 text-yellow-300 border border-yellow-700',
      inactive: 'bg-gray-800 text-gray-300 border border-gray-700'
    }
    return styles[status as keyof typeof styles] || styles.inactive
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      tuck_shop: 'Tuck Shop',
      takeaways: 'Takeaways',
      alcohol: 'Alcohol',
      groceries: 'Groceries',
      restaurant: 'Restaurant',
      other: 'Other'
    }
    return labels[category] || category
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Stores</h1>
          <p className="text-gray-400 mt-1">Manage formal and informal stores</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="mt-4 md:mt-0 flex items-center px-6 py-3 bg-kasi-orange text-white rounded-lg hover:bg-opacity-90 transition font-semibold"
        >
          <Plus size={20} className="mr-2" />
          Add Store
        </button>
      </div>

      

      {/* Filters */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search stores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-kasi-blue focus:border-transparent placeholder:text-gray-400"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-kasi-blue focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stores List */}
      {loading ? (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
          <p className="text-gray-400">Loading stores...</p>
        </div>
      ) : filteredStores.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
          <Store className="mx-auto text-gray-500 mb-3" size={48} />
          <p className="text-gray-400 mb-4">
            {searchTerm ? 'No stores found matching your search' : 'No stores added yet'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowAddModal(true)}
              className="text-kasi-blue hover:opacity-90 font-semibold"
            >
              Add your first store
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredStores.map((store) => (
            <div key={store.id} className="bg-gray-900 border border-gray-800 rounded-lg hover:border-gray-700 transition">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">{store.name}</h3>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(store.status)}`}>
                      {store.status.charAt(0).toUpperCase() + store.status.slice(1)}
                    </span>
                    <span className="ml-2 inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-900/30 text-blue-300 border border-blue-700">
                      {getCategoryLabel(store.category)}
                    </span>
                  </div>
                  {store.logo_url && (
                    <img
                      src={store.logo_url}
                      alt={store.name}
                      className="w-16 h-16 rounded-lg object-cover border border-gray-800"
                    />
                  )}
                </div>

                {store.description && (
                  <p className="text-gray-400 text-sm mb-4">{store.description}</p>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-400">
                    <MapPin size={16} className="mr-2 text-gray-500" />
                    <span>{store.street_address}, {store.township}</span>
                  </div>
                  <div className="flex items-center text-gray-400">
                    <Phone size={16} className="mr-2 text-gray-500" />
                    <span>{store.phone_number}</span>
                  </div>
                  {store.open_time && store.close_time && (
                    <div className="flex items-center text-gray-400">
                      <Clock size={16} className="mr-2 text-gray-500" />
                      {String(store.open_time).startsWith('00:00') && String(store.close_time).startsWith('23:59') ? (
                        <span>24 hours ({store.operating_days || 'Mon-Sun'})</span>
                      ) : (
                        <span>{store.open_time} - {store.close_time} ({store.operating_days})</span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center text-gray-300">
                    <Package size={16} className="mr-2 text-gray-500" />
                    <span>Products: {productCounts[store.id] ?? 0}</span>
                  </div>
                </div>

                {store.custom_orders_only && (
                  <div className="mt-4 p-3 bg-orange-900/30 border border-orange-700 rounded-lg">
                    <p className="text-xs text-orange-300 font-semibold flex items-center gap-1"><ShoppingCart size={14} /> Custom Orders Only</p>
                    <p className="text-xs text-orange-300/90 mt-1">Driver purchases items manually</p>
                  </div>
                )}

                {/* Store Access Code */}
                {store.access_code && (
                  <div className="mt-4 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                    <p className="text-xs text-blue-300 font-semibold mb-2">Store Access Code</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-1.5 bg-gray-800 text-blue-200 font-mono text-sm rounded border border-gray-700">
                        {store.access_code}
                      </code>
                      <button
                        onClick={() => copyAccessCode(store.access_code!)}
                        className="p-2 bg-gray-800 hover:bg-gray-700 text-blue-300 rounded border border-gray-700 transition"
                        title="Copy access code"
                      >
                        {copiedCode === store.access_code ? (
                          <Check size={16} className="text-green-400" />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-blue-300/70 mt-2">Share this code with store managers to access their portal</p>
                  </div>
                )}

                <div className="mt-6 flex gap-2">
                  <Link
                    href={`/admin/stores/${store.id}/edit`}
                    className="flex-1 text-center px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition font-semibold text-sm border border-gray-700"
                  >
                    Edit Store
                  </Link>
                  <Link
                    href={`/admin/stores/${store.id}/products`}
                    className="flex-1 text-center px-4 py-2 bg-kasi-orange text-white rounded-lg hover:bg-opacity-90 transition font-semibold text-sm"
                  >
                    View Products
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Store Modal */}
      {showAddModal && (
        <AddStoreModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            loadStores()
          }}
        />
      )}
    </div>
  )
}

function Store({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}
