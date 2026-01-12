'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import StoreProfileWizard from '../components/StoreProfileWizard'

interface Order {
  id: string
  created_at: string
  status: string
  total: number
  customer_name?: string
  items?: any[]
}

interface StoreSession {
  storeId: string
  storeName: string
}

export default function StoreDashboard() {
  const [storeSession, setStoreSession] = useState<StoreSession | null>(null)
  const [newOrders, setNewOrders] = useState<Order[]>([])
  const [inProgressOrders, setInProgressOrders] = useState<Order[]>([])
  const [completedToday, setCompletedToday] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [showWizard, setShowWizard] = useState(false)
  const [storeData, setStoreData] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const sessionData = localStorage.getItem('store_session')
    if (!sessionData) {
      router.push('/store/login')
      return
    }

    const session = JSON.parse(sessionData)
    setStoreSession(session)
    loadStoreInfo(session.storeId)
    loadDashboardData(session.storeId)

    // Set up real-time subscription for orders
    const subscription = supabase
      .channel('store-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `store_id=eq.${session.storeId}`
        },
        () => {
          loadDashboardData(session.storeId)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [router])
  const loadStoreInfo = async (storeId: string) => {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .single()

    if (data) {
      setStoreData(data)
      // Check if profile is incomplete (missing banking details or description)
      // Only show wizard if ANY required field is missing or empty
      const isIncomplete = !data.description?.trim() || 
                          !data.phone_number?.trim() || 
                          !data.bank_name?.trim() || 
                          !data.account_number?.trim()
      setShowWizard(isIncomplete)
    } else {
      // If no data, don't show wizard (prevents errors)
      setShowWizard(false)
    }
  }
  const loadDashboardData = async (storeId: string) => {
    setLoading(true)

    // Get new orders (pending/received)
    const { data: newOrdersData, error: newOrdersError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*, products(*))
      `)
      .eq('store_id', storeId)
      .in('status', ['pending', 'received'])
      .order('created_at', { ascending: false })

    console.log('New orders:', newOrdersData, 'Error:', newOrdersError)

    console.log('New orders:', newOrdersData, 'Error:', newOrdersError)

    // Get in-progress orders (purchased/on_the_way)
    const { data: inProgressData, error: inProgressError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*, products(*))
      `)
      .eq('store_id', storeId)
      .in('status', ['purchased'])
      .order('created_at', { ascending: false })

    console.log('In progress orders:', inProgressData, 'Error:', inProgressError)

    console.log('In progress orders:', inProgressData, 'Error:', inProgressError)

    // Get today's completed orders
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const { data: completedData, error: completedError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*, products(*))
      `)
      .eq('store_id', storeId)
      .eq('status', 'delivered')
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false })

    setNewOrders(newOrdersData || [])
    setInProgressOrders(inProgressData || [])
    setCompletedToday(completedData || [])
    setLoading(false)
  }

  const getOrderTotal = (order: any) => {
    if (!order.order_items) return 0
    return order.order_items.reduce((sum: number, item: any) => {
      return sum + (Number(item.subtotal) || 0)
    }, 0)
  }

  const getTodaySales = () => {
    return completedToday.reduce((sum, order) => sum + getOrderTotal(order), 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">Welcome back! Here's your store overview.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl p-3 sm:p-6 hover:border-kasi-blue/50 transition-all shadow-lg">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-kasi-blue/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-kasi-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="text-2xl sm:text-4xl font-bold text-white">{newOrders.length}</p>
          </div>
          <p className="text-xs sm:text-sm text-gray-400">New Orders</p>
        </div>

        <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl p-3 sm:p-6 hover:border-kasi-orange/50 transition-all shadow-lg">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-kasi-orange/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-kasi-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-2xl sm:text-4xl font-bold text-white">{inProgressOrders.length}</p>
          </div>
          <p className="text-xs sm:text-sm text-gray-400">In Progress</p>
        </div>

        <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl p-3 sm:p-6 hover:border-green-500/50 transition-all shadow-lg">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-2xl sm:text-4xl font-bold text-white">{completedToday.length}</p>
          </div>
          <p className="text-xs sm:text-sm text-gray-400 line-clamp-1">Completed Today</p>
        </div>

        <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl p-3 sm:p-6 hover:border-purple-500/50 transition-all shadow-lg">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-xl sm:text-4xl font-bold text-white">R{getTodaySales().toFixed(2)}</p>
          </div>
          <p className="text-xs sm:text-sm text-gray-400\">Today's Sales</p>
        </div>
      </div>

      {/* New Orders Alert */}
      {newOrders.length > 0 && (
        <div className="bg-yellow-900/20 backdrop-blur border border-yellow-800/50 rounded-2xl p-3 sm:p-5 shadow-lg">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-yellow-300">
                {newOrders.length} new order{newOrders.length > 1 ? 's' : ''} pending!
              </h3>
              <p className="text-sm text-yellow-400/90 mt-1">
                Please review and confirm the orders in the Orders section.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Recent Orders</h2>
        </div>
        <div className="divide-y divide-gray-800">
          {[...newOrders, ...inProgressOrders].slice(0, 5).map((order: any) => (
            <div key={order.id} className="px-4 sm:px-6 py-4 hover:bg-gray-800/50 transition-colors">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-white">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <span className={`inline-block px-2.5 py-0.5 text-xs rounded-full font-medium ${
                      order.status === 'pending' ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-700' :
                      order.status === 'confirmed' ? 'bg-blue-900/30 text-blue-300 border border-blue-700' :
                      order.status === 'preparing' ? 'bg-orange-900/30 text-orange-300 border border-orange-700' :
                      'bg-green-900/30 text-green-300 border border-green-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    Customer ID: {order.customer_id?.slice(0, 8) || 'N/A'} • {order.order_items?.length || 0} items
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xl font-bold text-white">
                    R{getOrderTotal(order).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {newOrders.length === 0 && inProgressOrders.length === 0 && (
            <div className="px-6 py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-gray-400">No active orders at the moment.</p>
            </div>
          )}
        </div>
      </div>

      {/* Profile Wizard Modal */}
      {showWizard && storeSession && (
        <StoreProfileWizard
          storeId={storeSession.storeId}
          onComplete={() => {
            setShowWizard(false)
            if (storeSession) {
              loadStoreInfo(storeSession.storeId)
            }
          }}
        />
      )}
    </div>
  )
}
