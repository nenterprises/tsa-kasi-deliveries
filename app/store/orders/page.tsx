'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useToast } from '@/lib/useRealtime'

interface StoreSession {
  storeId: string
  storeName: string
}

export default function StoreOrders() {
  const [storeSession, setStoreSession] = useState<StoreSession | null>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'received' | 'purchased' | 'on_the_way' | 'paid' | 'unpaid'>('all')
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const router = useRouter()
  const { showToast, ToastContainer } = useToast()

  useEffect(() => {
    const sessionData = localStorage.getItem('store_session')
    if (!sessionData) {
      router.push('/store/login')
      return
    }

    const session = JSON.parse(sessionData)
    setStoreSession(session)
    loadOrders(session.storeId)

    // Set up real-time subscription
    const subscription = supabase
      .channel('store-orders-page')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `store_id=eq.${session.storeId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            showToast('🛒 New order received!', 'success')
          } else if (payload.eventType === 'UPDATE') {
            const newOrder = payload.new as any
            if (newOrder.payment_status === 'paid') {
              showToast('✅ Payment received!', 'success')
            }
          }
          loadOrders(session.storeId)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [router, showToast])

  const loadOrders = async (storeId: string) => {
    setLoading(true)

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*, products(*))
      `)
      .eq('store_id', storeId)
      .in('status', ['pending', 'received', 'purchased', 'on_the_way'])
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading orders:', error)
    } else {
      setOrders(data || [])
    }

    setLoading(false)
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)

    if (error) {
      alert('Error updating order status: ' + error.message)
    } else {
      // Reload orders
      if (storeSession) {
        loadOrders(storeSession.storeId)
      }
      setSelectedOrder(null)
    }
  }

  const getOrderTotal = (order: any) => {
    if (!order.order_items) return 0
    return order.order_items.reduce((sum: number, item: any) => {
      return sum + (Number(item.subtotal) || 0)
    }, 0)
  }

  const filteredOrders = filter === 'all' 
    ? orders 
    : filter === 'paid'
      ? orders.filter(order => order.payment_status === 'paid')
      : filter === 'unpaid'
        ? orders.filter(order => order.payment_status !== 'paid')
        : orders.filter(order => order.status === filter)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-900/30 text-yellow-300 border-yellow-700'
      case 'received': return 'bg-blue-900/30 text-blue-300 border-blue-700'
      case 'purchased': return 'bg-green-900/30 text-green-300 border-green-700'
      case 'on_the_way': return 'bg-purple-900/30 text-purple-300 border-purple-700'
      case 'delivered': return 'bg-green-600/30 text-green-200 border-green-600'
      case 'cancelled': return 'bg-red-900/30 text-red-300 border-red-700'
      default: return 'bg-gray-800 text-gray-300 border-gray-700'
    }
  }

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'pending': return { status: 'received', label: 'Accept Order' }
      case 'received': return { status: 'purchased', label: 'Mark as Purchased' }
      case 'purchased': return { status: 'on_the_way', label: 'Out for Delivery' }
      default: return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading orders...</div>
      </div>
    )
  }

  return (
    <>
      <ToastContainer />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Orders</h1>
          <p className="text-gray-400">Manage your incoming and active orders</p>
        </div>

      {/* Filter Tabs */}
      <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl p-3 flex gap-3 overflow-x-auto hide-scrollbar">
        {['all', 'pending', 'received', 'purchased', 'on_the_way', 'paid', 'unpaid'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status as any)}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              filter === status
                ? 'bg-gradient-to-r from-kasi-orange to-orange-600 text-white shadow-lg'
                : 'bg-gray-800/50 backdrop-blur text-gray-400 hover:bg-gray-700'
            }`}
          >
            {status === 'all' ? 'All' : 
             status === 'pending' ? 'New' :
             status === 'received' ? 'Accepted' :
             status === 'purchased' ? 'Purchased' :
             status === 'on_the_way' ? 'In Transit' :
             status === 'paid' ? '✓ Paid' :
             status === 'unpaid' ? '💰 Unpaid' :
             status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            <span className="ml-2 text-xs">
              ({status === 'all' ? orders.length : 
                status === 'paid' ? orders.filter(o => o.payment_status === 'paid').length :
                status === 'unpaid' ? orders.filter(o => o.payment_status !== 'paid').length :
                orders.filter(o => o.status === status).length})
            </span>
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredOrders.map((order) => (
          <div
            key={order.id}
            className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl shadow-lg hover:border-kasi-orange/50 transition-all cursor-pointer overflow-hidden"
            onClick={() => setSelectedOrder(order)}
          >
            <div className="p-4 sm:p-6">
              {/* Order Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-white">
                    Order #{order.id.slice(0, 8).toUpperCase()}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(order.status)}`}>
                  {order.status === 'pending' ? 'NEW' : 
                   order.status === 'received' ? 'ACCEPTED' : 
                   order.status === 'purchased' ? 'PURCHASED' : 
                   order.status === 'on_the_way' ? 'IN TRANSIT' : 
                   order.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              {/* Customer Info */}
              <div className="mb-4 pb-4 border-b border-gray-800">
                <p className="text-sm font-medium text-white">
                  Customer
                </p>
                <p className="text-sm text-gray-400">ID: {order.customer_id?.slice(0, 8)}</p>
                {order.customers?.address && (
                  <p className="text-xs text-gray-500 mt-1">{order.customers.address}</p>
                )}
              </div>

              {/* Order Items */}
              <div className="space-y-2 mb-4">
                {order.order_items?.slice(0, 3).map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-300">
                      {item.quantity}x {item.products?.name || 'Item'}
                    </span>
                    <span className="font-medium text-white">
                      R{Number(item.subtotal || 0).toFixed(2)}
                    </span>
                  </div>
                ))}
                {order.order_items?.length > 3 && (
                  <p className="text-xs text-gray-500">
                    +{order.order_items.length - 3} more items
                  </p>
                )}
              </div>

              {/* Special Notes */}
              {order.notes && (
                <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-800 rounded-lg">
                  <p className="text-xs font-medium text-yellow-400">Customer Notes:</p>
                  <p className="text-sm text-yellow-300">{order.notes}</p>
                </div>
              )}

              {/* Total and Payment */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                <div>
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="text-xl font-bold text-white">
                    R{getOrderTotal(order).toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                    order.payment_status === 'paid' 
                      ? 'bg-green-900/30 text-green-300 border border-green-700' 
                      : 'bg-red-900/30 text-red-300 border border-red-700'
                  }`}>
                    {order.payment_status === 'paid' ? '✓ Paid' : 'Unpaid'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12 bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl shadow-lg">
          <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No orders found</h3>
          <p className="text-gray-400">
            {filter === 'all' 
              ? "You don't have any active orders yet." 
              : `No orders with status "${filter}"`}
          </p>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Order #{selectedOrder.id.slice(0, 8).toUpperCase()}
                  </h2>
                  <p className="text-sm text-gray-400">
                    {new Date(selectedOrder.created_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Customer Details */}
              <div className="mb-6 p-4 bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl">
                <h3 className="font-bold text-white mb-2">Customer Information</h3>
                <p className="text-sm text-gray-300">Customer</p>
                <p className="text-xs text-gray-400">ID: {selectedOrder.customer_id?.slice(0, 8)}</p>
                {selectedOrder.customers?.address && (
                  <p className="text-sm text-gray-400 mt-1">{selectedOrder.customers.address}</p>
                )}
              </div>

              {/* All Items */}
              <div className="mb-6">
                <h3 className="font-bold text-white mb-3">Order Items</h3>
                <div className="space-y-3">
                  {selectedOrder.order_items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl">
                      <div className="flex-1">
                        <p className="font-medium text-white">{item.products?.name}</p>
                        <p className="text-sm text-gray-400">Quantity: {item.quantity}</p>
                        <p className="text-xs text-gray-500">R{Number(item.unit_price || 0).toFixed(2)} each</p>
                      </div>
                      <p className="font-semibold text-white">
                        R{Number(item.subtotal || 0).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <div className="flex justify-between items-center">
                    <p className="text-lg font-semibold text-white">Total</p>
                    <p className="text-2xl font-bold text-kasi-orange">
                      R{getOrderTotal(selectedOrder).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-800 rounded-xl">
                  <h3 className="font-bold text-yellow-300 mb-2">Special Instructions</h3>
                  <p className="text-sm text-yellow-400">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Agent Info */}
              {selectedOrder.agents && (
                <div className="mb-6 p-4 bg-blue-900/20 border border-blue-800 rounded-xl">
                  <h3 className="font-bold text-blue-300 mb-2">Assigned Agent</h3>
                  <p className="text-sm text-blue-400">{selectedOrder.agents.name}</p>
                  <p className="text-sm text-blue-500">{selectedOrder.agents.phone}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                {getNextStatus(selectedOrder.status) && (
                  <button
                    onClick={() => {
                      const next = getNextStatus(selectedOrder.status)
                      if (next) updateOrderStatus(selectedOrder.id, next.status)
                    }}
                    className="flex-1 bg-gradient-to-r from-kasi-orange to-orange-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-kasi-orange/30 hover:shadow-xl hover:shadow-kasi-orange/40 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {getNextStatus(selectedOrder.status)?.label}
                  </button>
                )}
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-6 py-3 bg-gray-800/50 backdrop-blur text-gray-300 rounded-xl border border-gray-700 hover:bg-gray-700 hover:border-gray-600 font-bold transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  )
}
