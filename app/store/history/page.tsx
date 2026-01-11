'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface StoreSession {
  storeId: string
  storeName: string
}

export default function StoreHistory() {
  const [storeSession, setStoreSession] = useState<StoreSession | null>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('week')
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const sessionData = localStorage.getItem('store_session')
    if (!sessionData) {
      router.push('/store/login')
      return
    }

    const session = JSON.parse(sessionData)
    setStoreSession(session)
    loadOrders(session.storeId)
  }, [router, dateRange])

  const loadOrders = async (storeId: string) => {
    setLoading(true)

    let query = supabase
      .from('orders')
      .select(`
        *,
        customers:customer_id(name, phone),
        order_items(*, products(*)),
        agents:agent_id(name, phone)
      `)
      .eq('store_id', storeId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })

    // Apply date filter
    if (dateRange !== 'all') {
      const now = new Date()
      let startDate = new Date()

      if (dateRange === 'today') {
        startDate.setHours(0, 0, 0, 0)
      } else if (dateRange === 'week') {
        startDate.setDate(now.getDate() - 7)
      } else if (dateRange === 'month') {
        startDate.setMonth(now.getMonth() - 1)
      }

      query = query.gte('created_at', startDate.toISOString())
    }

    const { data, error } = await query

    if (error) {
      console.error('Error loading order history:', error)
    } else {
      setOrders(data || [])
    }

    setLoading(false)
  }

  const getOrderTotal = (order: any) => {
    if (!order.order_items) return 0
    return order.order_items.reduce((sum: number, item: any) => {
      return sum + (item.quantity * item.price)
    }, 0)
  }

  const getTotalSales = () => {
    return orders.reduce((sum, order) => sum + getOrderTotal(order), 0)
  }

  const getTotalOrders = () => orders.length

  const getAverageOrderValue = () => {
    const total = getTotalSales()
    const count = getTotalOrders()
    return count > 0 ? total / count : 0
  }

  const exportToCSV = () => {
    if (orders.length === 0) {
      alert('No orders to export')
      return
    }

    // Create CSV header
    const headers = ['Order ID', 'Date', 'Customer', 'Items', 'Total', 'Payment Status', 'Agent']
    
    // Create CSV rows
    const rows = orders.map(order => {
      const items = order.order_items?.map((item: any) => 
        `${item.quantity}x ${item.products?.name}`
      ).join('; ') || ''
      
      return [
        order.id,
        new Date(order.created_at).toLocaleString(),
        order.customers?.name || 'N/A',
        items,
        `R${getOrderTotal(order).toFixed(2)}`,
        order.payment_status || 'N/A',
        order.agents?.name || 'N/A'
      ]
    })

    // Combine header and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `order-history-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading order history...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Order History</h1>
          <p className="text-gray-400">View your completed orders and sales data</p>
        </div>
        <button
          onClick={exportToCSV}
          className="bg-gradient-to-r from-kasi-orange to-orange-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-kasi-orange/30 hover:shadow-xl hover:shadow-kasi-orange/40 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export to CSV
        </button>
      </div>

      {/* Date Range Filter */}
      <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl shadow-lg p-3 flex gap-3">
        {(['today', 'week', 'month', 'all'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setDateRange(range)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              dateRange === range
                ? 'bg-gradient-to-r from-kasi-orange to-orange-600 text-white shadow-lg'
                : 'bg-gray-800/50 backdrop-blur text-gray-400 hover:bg-gray-700'
            }`}
          >
            {range === 'today' ? 'Today' : 
             range === 'week' ? 'Last 7 Days' : 
             range === 'month' ? 'Last 30 Days' : 
             'All Time'}
          </button>
        ))}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl shadow-lg p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-gray-400">Total Sales</p>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-green-300">
            R{getTotalSales().toFixed(2)}
          </p>
        </div>

        <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl shadow-lg p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-sm text-gray-400">Total Orders</p>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-kasi-blue">
            {getTotalOrders()}
          </p>
        </div>

        <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl shadow-lg p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-kasi-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-400">Average Order Value</p>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-kasi-orange">
            R{getAverageOrderValue().toFixed(2)}
          </p>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">
            Completed Orders ({orders.length})
          </h2>
        </div>
        
        <div className="divide-y divide-gray-800">
          {orders.map((order) => (
            <div
              key={order.id}
              className="px-6 py-4 hover:bg-gray-800 cursor-pointer"
              onClick={() => setSelectedOrder(order)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <p className="font-medium text-white">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <span className="px-2 py-1 text-xs bg-green-900/30 text-green-300 border border-green-700 rounded-full">
                      Completed
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    {order.customers?.name || 'Customer'} • {order.order_items?.length || 0} items
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xl font-bold text-white">
                    R{getOrderTotal(order).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    <span className={order.payment_status === 'paid' ? 'text-green-400' : 'text-gray-500'}>
                      {order.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {orders.length === 0 && (
          <div className="px-6 py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No orders found</h3>
            <p className="text-gray-400">
              No completed orders for the selected time period.
            </p>
          </div>
        )}
      </div>

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
                    Completed on {new Date(selectedOrder.created_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-300 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Customer Details */}
              <div className="mb-6 p-4 bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl">
                <h3 className="font-bold text-white mb-2">Customer Information</h3>
                <p className="text-sm text-gray-300">{selectedOrder.customers?.name}</p>
                <p className="text-sm text-gray-400">{selectedOrder.customers?.phone}</p>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h3 className="font-bold text-white mb-3">Order Items</h3>
                <div className="space-y-3">
                  {selectedOrder.order_items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl">
                      <div className="flex-1">
                        <p className="font-medium text-white">{item.products?.name}</p>
                        <p className="text-sm text-gray-400">Quantity: {item.quantity}</p>
                        <p className="text-xs text-gray-500">R{item.price} each</p>
                      </div>
                      <p className="font-semibold text-white">
                        R{(item.quantity * item.price).toFixed(2)}
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

              {/* Agent Info */}
              {selectedOrder.agents && (
                <div className="mb-6 p-4 bg-blue-900/30 border border-blue-700 rounded-xl">
                  <h3 className="font-bold text-blue-300 mb-2">Delivery Agent</h3>
                  <p className="text-sm text-blue-300">{selectedOrder.agents.name}</p>
                  <p className="text-sm text-blue-400">{selectedOrder.agents.phone}</p>
                </div>
              )}

              {/* Payment Status */}
              <div className="p-4 bg-green-900/30 border border-green-700 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-300">Payment Status</span>
                  <span className="px-3 py-1 text-sm font-medium bg-green-900/50 text-green-300 border border-green-700 rounded-full">
                    {selectedOrder.payment_status === 'paid' ? '✓ Paid' : 'Unpaid'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="w-full mt-6 bg-gray-800/50 backdrop-blur border border-gray-700 text-gray-300 py-3 rounded-xl font-bold hover:border-kasi-orange/50 hover:bg-gray-700 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
