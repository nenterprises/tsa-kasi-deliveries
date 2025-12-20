'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { OrderWithDetails } from '@/types'
import { Package } from 'lucide-react'

interface HistoryProps {
  agentId: string
}

export default function History({ agentId }: HistoryProps) {
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'delivered' | 'cancelled'>('all')

  useEffect(() => {
    loadHistory()
  }, [agentId, filter])

  const loadHistory = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          store:stores(*),
          items:order_items(*)
        `)
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false })

      if (filter === 'delivered') {
        query = query.eq('status', 'delivered')
      } else if (filter === 'cancelled') {
        query = query.eq('status', 'cancelled')
      } else {
        query = query.in('status', ['delivered', 'cancelled'])
      }

      const { data, error } = await query

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error loading history:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-ZA', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    if (status === 'delivered') {
      return <span className="px-3 py-1 bg-green-900/30 text-green-300 border border-green-700 rounded-full text-xs font-semibold">✓ Delivered</span>
    }
    if (status === 'cancelled') {
      return <span className="px-3 py-1 bg-red-900/30 text-red-300 border border-red-700 rounded-full text-xs font-semibold">✕ Cancelled</span>
    }
    return <span className="px-3 py-1 bg-gray-800 text-gray-300 border border-gray-700 rounded-full text-xs font-semibold capitalize">{status}</span>
  }

  const calculateEarnings = () => {
    return orders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + (o.delivery_fee || 0), 0)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900 rounded-lg border border-gray-800 shadow-sm p-6">
          <p className="text-sm text-gray-400 mb-1">Total Deliveries</p>
          <p className="text-3xl font-bold text-gray-100">
            {orders.filter(o => o.status === 'delivered').length}
          </p>
        </div>
        <div className="bg-gray-900 rounded-lg border border-gray-800 shadow-sm p-6">
          <p className="text-sm text-gray-400 mb-1">Total Earnings</p>
          <p className="text-3xl font-bold text-green-400">
            R{calculateEarnings().toFixed(2)}
          </p>
        </div>
        <div className="bg-gray-900 rounded-lg border border-gray-800 shadow-sm p-6">
          <p className="text-sm text-gray-400 mb-1">Cancelled Orders</p>
          <p className="text-3xl font-bold text-red-400">
            {orders.filter(o => o.status === 'cancelled').length}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 shadow-sm p-4">
        <div className="flex gap-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-secondary-500 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('delivered')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'delivered'
                ? 'bg-green-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Delivered
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'cancelled'
                ? 'bg-red-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Cancelled
          </button>
        </div>
      </div>

      {/* Order History List */}
      {orders.length === 0 ? (
        <div className="text-center py-12 bg-gray-900 rounded-lg border border-gray-800">
          <div className="mb-4 flex items-center justify-center">
            <Package className="w-16 h-16 text-gray-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-100 mb-2">No History Yet</h3>
          <p className="text-gray-400">Your completed orders will appear here</p>
        </div>
      ) : (
        <div className="bg-gray-900 rounded-lg border border-gray-800 shadow-sm divide-y divide-gray-800">
          {orders.map((order) => (
            <div key={order.id} className="p-6 hover:bg-gray-800 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-gray-100 mb-1">
                    Order #{order.id.slice(0, 8).toUpperCase()}
                  </h3>
                  <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                </div>
                <div className="text-right">
                  {getStatusBadge(order.status)}
                  <p className="text-sm text-gray-500 mt-1">
                    {order.purchase_type === 'CPO' && (
                      <span className="inline-block px-2 py-0.5 rounded text-xs bg-secondary-900/40 text-secondary-300 border border-secondary-700">CPO</span>
                    )}
                    {order.purchase_type === 'APO' && (
                      <span className="inline-block px-2 py-0.5 rounded text-xs bg-primary-900/40 text-primary-300 border border-primary-700 ml-2">APO</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Store</p>
                  <p className="font-medium text-gray-100">{order.store?.name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Delivery Address</p>
                  <p className="text-sm text-gray-100">{order.delivery_address}</p>
                </div>
              </div>

              {order.items && order.items.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-gray-500 mb-2">Items</p>
                  <div className="flex flex-wrap gap-2">
                    {order.items.slice(0, 3).map((item, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-300">
                        {item.product_name} x{item.quantity}
                      </span>
                    ))}
                    {order.items.length > 3 && (
                      <span className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-500">
                        +{order.items.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between items-center">
                <div>
                  {order.actual_amount && (
                    <p className="text-sm text-gray-400">
                      Purchase: <span className="font-semibold">R{order.actual_amount.toFixed(2)}</span>
                    </p>
                  )}
                  {order.delivery_fee && (
                    <p className="text-sm text-gray-400">
                      Delivery Fee: <span className="font-semibold text-green-400">+R{order.delivery_fee.toFixed(2)}</span>
                    </p>
                  )}
                </div>
                
                {order.proof_of_purchase_url && (
                  <a
                    href={order.proof_of_purchase_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-secondary-400 hover:text-secondary-300 underline"
                  >
                    View Receipt
                  </a>
                )}
              </div>

              {order.status === 'delivered' && order.delivery_photo_url && (
                <div className="mt-4">
                  <a
                    href={order.delivery_photo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-secondary-400 hover:text-secondary-300 underline"
                  >
                    View Delivery Photo
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
