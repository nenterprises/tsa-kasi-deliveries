'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Order, OrderItem, Store } from '@/types'
import { useCart } from '@/lib/CartContext'
import { useToast, ToastContainer } from '@/lib/useRealtime'
import {
  ShoppingCart,
  Hourglass,
  CheckCircle2,
  ShoppingBag,
  Truck,
  PackageCheck,
  XCircle,
  CreditCard,
  Banknote,
  Check,
  FileText,
  Package,
  User,
  Sparkles,
  Clock,
  MapPin,
  Receipt,
  ArrowRight,
  ChevronRight
} from 'lucide-react'

interface OrderWithDetails extends Order {
  store?: Store
  items?: OrderItem[]
}

function OrdersContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const showSuccess = searchParams.get('success') === 'true'
  const { totalItems } = useCart()
  const { toasts, showToast } = useToast()
  
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [userName, setUserName] = useState<string>('')

  const fetchOrders = useCallback(async (userId: string) => {
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          stores (*)
        `)
        .eq('customer_id', userId)
        .order('created_at', { ascending: false })

      if (ordersError) throw ordersError

      // Fetch order items for each order
      const ordersWithItems = await Promise.all(
        (ordersData || []).map(async (order) => {
          if (order.order_type === 'product_order') {
            const { data: itemsData } = await supabase
              .from('order_items')
              .select('*')
              .eq('order_id', order.id)

            return { ...order, store: order.stores, items: itemsData || [] }
          }
          return { ...order, store: order.stores }
        })
      )

      setOrders(ordersWithItems)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [])

  // Real-time subscription for order updates
  useEffect(() => {
    if (!user?.id) return

    console.log('🔴 Setting up realtime subscription for customer:', user.id)

    const channel = supabase
      .channel('customer-orders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `customer_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔴 Order update received:', payload)
          
          if (payload.eventType === 'UPDATE') {
            const updatedOrder = payload.new as Order
            
            // Show toast notification for status changes
            if (payload.old.status !== updatedOrder.status) {
              console.log('🔴 Status changed from', payload.old.status, 'to', updatedOrder.status)
              const statusMessages: Record<string, string> = {
                'assigned': '🎯 Agent assigned to your order!',
                'purchased': '🛍️ Items purchased!',
                'on_the_way': '🚚 Your order is on the way!',
                'delivered': '✅ Order delivered!'
              }
              
              if (statusMessages[updatedOrder.status]) {
                showToast({
                  message: statusMessages[updatedOrder.status],
                  type: 'success'
                })
              }
            }
            
            // Show toast for payment status changes
            if (payload.old.payment_status !== updatedOrder.payment_status && updatedOrder.payment_status === 'paid') {
              console.log('🔴 Payment status changed to paid')
              showToast({
                message: '💳 Payment confirmed!',
                type: 'success'
              })
            }
          }
          
          // Refresh orders list
          console.log('🔴 Fetching updated orders...')
          fetchOrders(user.id)
        }
      )
      .subscribe((status) => {
        console.log('🔴 Subscription status:', status)
      })

    return () => {
      console.log('🔴 Unsubscribing from realtime')
      channel.unsubscribe()
    }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/customer/login')
    } else {
      setUser(user)
      fetchOrders(user.id)
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

  const normalizeStatus = (status: string) => {
    // Simplify statuses for MVP - no purchase step
    if (status === 'received') return 'assigned'
    if (status === 'cash_requested' || status === 'cash_approved' || status === 'purchased') return 'assigned'
    return status
  }

  const getStatusColor = (status: string) => {
    status = normalizeStatus(status)
    const colors: Record<string, string> = {
      pending: 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-yellow-200 border border-yellow-500/30 shadow-lg shadow-yellow-500/10',
      assigned: 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-cyan-200 border border-cyan-500/30 shadow-lg shadow-cyan-500/10',
      on_the_way: 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-pink-200 border border-purple-500/30 shadow-lg shadow-purple-500/10',
      delivered: 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-200 border border-emerald-500/30 shadow-lg shadow-emerald-500/10',
      cancelled: 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-rose-200 border border-red-500/30 shadow-lg shadow-red-500/10',
    }
    return colors[status] || 'bg-gray-800/50 text-gray-300 border border-gray-700'
  }

  const getStatusLabel = (status: string) => {
    status = normalizeStatus(status)
    const labels: Record<string, string> = {
      pending: 'Finding Agent',
      assigned: 'Agent Assigned',
      on_the_way: 'On the Way',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    }
    return labels[status] || status
  }

  const getStatusIconEl = (status: string) => {
    status = normalizeStatus(status)
    const common = 'w-4 h-4 mr-1'
    switch (status) {
      case 'pending':
        return <Hourglass className={common} />
      case 'assigned':
        return <CheckCircle2 className={common} />
      case 'on_the_way':
        return <Truck className={common} />
      case 'delivered':
        return <PackageCheck className={common} />
      case 'cancelled':
        return <XCircle className={common} />
      default:
        return <Hourglass className={common} />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center relative overflow-hidden">
        {/* Animated background gradients */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-kasi-blue/10 via-transparent to-transparent blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-kasi-orange/10 via-transparent to-transparent blur-3xl animate-pulse delay-700"></div>
        </div>
        
        <div className="text-center relative z-10">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-kasi-blue border-r-kasi-orange mx-auto shadow-2xl shadow-kasi-blue/30"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-kasi-blue/30 mx-auto"></div>
          </div>
          <p className="mt-6 text-gray-300 font-medium tracking-wide">Loading your orders...</p>
          <div className="mt-2 flex items-center justify-center gap-1">
            <div className="w-2 h-2 bg-kasi-blue rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-kasi-orange rounded-full animate-bounce delay-100"></div>
            <div className="w-2 h-2 bg-kasi-blue rounded-full animate-bounce delay-200"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black relative overflow-hidden">
      {/* Premium animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-kasi-blue/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-kasi-orange/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-kasi-blue/3 to-kasi-orange/3 rounded-full blur-3xl"></div>
      </div>

      <ToastContainer toasts={toasts} />
      
      {/* Premium Header with Glassmorphism */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-gray-900/70 border-b border-white/10 shadow-2xl shadow-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Package className="w-8 h-8 text-kasi-blue" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-kasi-orange rounded-full animate-pulse"></div>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-display font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                    My Orders
                  </h1>
                  <p className="text-xs text-gray-400 mt-0.5">Track your deliveries</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Link
                href="/customer/stores"
                className="group hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white transition-all duration-300"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="text-sm font-medium">Browse Stores</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              
              <Link
                href="/customer/cart"
                className="relative group"
              >
                <div className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-kasi-orange to-orange-600 hover:from-kasi-orange/90 hover:to-orange-600/90 text-white shadow-lg shadow-kasi-orange/25 hover:shadow-xl hover:shadow-kasi-orange/40 transition-all duration-300 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  <span className="hidden sm:inline font-semibold">Cart</span>
                </div>
                {totalItems > 0 && (
                  <div className="absolute -top-2 -right-2 min-w-[24px] h-6 px-1.5 bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg shadow-red-500/50 animate-bounce">
                    {totalItems}
                  </div>
                )}
              </Link>
              
              <Link
                href="/customer/profile"
                className="group flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300"
              >
                <div className="w-9 h-9 bg-gradient-to-br from-kasi-blue to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-kasi-blue/25 group-hover:shadow-kasi-blue/40 transition-shadow">
                  <User className="w-5 h-5 text-white" />
                </div>
                <span className="hidden md:inline text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                  {userName || 'Profile'}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showSuccess && (
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500/10 via-green-500/10 to-emerald-500/10 border border-emerald-500/30 backdrop-blur-sm mb-8 animate-in slide-in-from-top duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-green-500/5 animate-pulse"></div>
            <div className="relative px-6 py-5 flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="w-6 h-6 text-white animate-in zoom-in duration-700" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-emerald-200 mb-0.5">Order Placed Successfully! 🎉</h3>
                <p className="text-sm text-emerald-300/80">Your order is being processed by our agents</p>
              </div>
              <Link
                href="/customer/cart"
                className="group/btn flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white font-semibold transition-all duration-300 hover:scale-105"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>View Cart</span>
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="text-center py-20 animate-in fade-in duration-700">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-kasi-blue/20 to-kasi-orange/20 rounded-full blur-2xl"></div>
              <div className="relative flex justify-center items-center w-24 h-24 rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-white/10 backdrop-blur-sm">
                <Package className="w-12 h-12 text-gray-400" />
              </div>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-3">
              No orders yet
            </h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Ready to experience premium delivery? Browse our stores and place your first order!
            </p>
            <Link
              href="/customer/stores"
              className="group inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-kasi-orange to-orange-600 hover:from-kasi-orange/90 hover:to-orange-600/90 text-white font-bold shadow-2xl shadow-kasi-orange/30 hover:shadow-kasi-orange/50 transition-all duration-300 hover:scale-105"
            >
              <Sparkles className="w-5 h-5" />
              <span>Start Shopping</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order, idx) => (
              <div 
                key={order.id} 
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900/90 via-gray-900/80 to-gray-800/90 backdrop-blur-xl border border-white/10 hover:border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-[1.01] animate-in slide-in-from-bottom"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {/* Premium shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                
                {/* Order Header */}
                <div className="relative bg-gradient-to-r from-gray-800/80 to-gray-900/80 backdrop-blur-sm px-6 py-4 border-b border-white/10">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-kasi-blue/20 to-cyan-600/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                        <ShoppingBag className="w-6 h-6 text-cyan-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-gray-400 bg-gray-800/50 px-2 py-1 rounded">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(order.created_at).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <p className="font-bold text-white text-lg flex items-center gap-2">
                          <span className="text-xl">🏪</span>
                          {order.store?.name || 'Unknown Store'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                      <div className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${getStatusColor(order.status)} backdrop-blur-sm`}>
                        {getStatusIconEl(order.status)} 
                        {getStatusLabel(order.status)}
                      </div>
                      <div className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 backdrop-blur-sm ${
                        order.payment_status === 'paid' 
                          ? 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-200 border border-emerald-500/30' 
                          : 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-yellow-200 border border-yellow-500/30'
                      }`}>
                        {order.payment_status === 'paid' ? (
                          <>
                            <CreditCard className="w-4 h-4" /> Paid
                          </>
                        ) : (
                          <>
                            <Banknote className="w-4 h-4" /> Pending
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Details */}
                <div className="p-6 space-y-6">
                  {order.order_type === 'custom_request' ? (
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-white/10 p-5">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-kasi-blue/10 to-transparent rounded-full blur-2xl"></div>
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-3">
                          <FileText className="w-5 h-5 text-kasi-blue" />
                          <h4 className="font-bold text-white">Custom Request</h4>
                        </div>
                        <p className="text-gray-300 leading-relaxed">
                          {order.custom_request_text}
                        </p>
                      </div>
                    </div>
                  ) : (
                    order.items && order.items.length > 0 && (
                      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-white/10 p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <Receipt className="w-5 h-5 text-kasi-orange" />
                          <h4 className="font-bold text-white">Order Items</h4>
                          <span className="ml-auto text-xs bg-kasi-orange/20 text-kasi-orange px-2 py-1 rounded-full font-semibold">
                            {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                          </span>
                        </div>
                        <div className="space-y-3">
                          {order.items.map((item, itemIdx) => (
                            <div 
                              key={item.id} 
                              className="group/item flex items-center justify-between p-3 rounded-lg bg-gray-900/50 hover:bg-gray-900/80 border border-white/5 hover:border-white/10 transition-all duration-300"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-kasi-orange/20 to-orange-600/20 border border-orange-500/30 flex items-center justify-center flex-shrink-0">
                                  <span className="font-bold text-kasi-orange">{item.quantity}×</span>
                                </div>
                                <span className="text-gray-200 font-medium group-hover/item:text-white transition-colors">
                                  {item.product_name}
                                </span>
                              </div>
                              <span className="font-bold text-white text-lg">
                                R{item.subtotal.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  )}

                  {/* Delivery Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-white/10 p-5">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white mb-1.5">Delivery Address</h4>
                          <p className="text-gray-300 text-sm leading-relaxed">
                            {order.delivery_address}, {order.delivery_township}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {order.notes && (
                      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-white/10 p-5">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <h4 className="font-bold text-white mb-1.5">Special Notes</h4>
                            <p className="text-gray-300 text-sm leading-relaxed">{order.notes}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Premium Order Progress Timeline */}
                  <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-white/10 p-6">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-kasi-blue via-purple-500 to-kasi-orange opacity-50"></div>
                    <h4 className="font-bold text-white mb-6 flex items-center gap-2">
                      <Truck className="w-5 h-5 text-kasi-blue" />
                      Order Journey
                    </h4>
                    <div className="relative">
                      {(() => {
                        const steps: Array<{ key: string; label: string; icon: any }> = [
                          { key: 'pending', label: 'Finding Agent', icon: Hourglass },
                          { key: 'assigned', label: 'Picking Up', icon: Package },
                          { key: 'on_the_way', label: 'On the Way', icon: Truck },
                          { key: 'delivered', label: 'Delivered', icon: PackageCheck },
                        ]
                        const currentKey = normalizeStatus(order.status)
                        const currentIndex = steps.findIndex(s => s.key === currentKey)
                        const progressPct = ((currentIndex < 0 ? 0 : currentIndex) / (steps.length - 1)) * 100
                        
                        return (
                          <div className="relative">
                            {/* Progress Bar */}
                            <div className="absolute top-6 left-0 right-0 h-1.5 bg-gray-700/50 rounded-full">
                              <div 
                                className="h-full bg-gradient-to-r from-kasi-blue via-purple-500 to-emerald-500 rounded-full transition-all duration-1000 ease-out shadow-lg shadow-emerald-500/30" 
                                style={{ width: `${progressPct}%` }} 
                              />
                            </div>
                            
                            {/* Steps */}
                            <div className="relative flex items-start justify-between">
                              {steps.map((s, idx) => {
                                const passed = idx <= currentIndex
                                const isCurrent = idx === currentIndex
                                const Icon = s.icon
                                
                                return (
                                  <div key={s.key} className="flex flex-col items-center gap-2 z-10 flex-1">
                                    <div className={`
                                      relative w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold
                                      transition-all duration-500 transform
                                      ${passed 
                                        ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/40 scale-110' 
                                        : 'bg-gray-700/50 text-gray-400 border border-gray-600'
                                      }
                                      ${isCurrent ? 'animate-pulse ring-4 ring-emerald-500/30' : ''}
                                    `}>
                                      {passed && idx < currentIndex ? (
                                        <CheckCircle2 className="w-6 h-6" />
                                      ) : (
                                        <Icon className="w-6 h-6" />
                                      )}
                                      {isCurrent && (
                                        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl opacity-20 blur-md animate-pulse"></div>
                                      )}
                                    </div>
                                    <span className={`
                                      text-xs font-semibold text-center max-w-[80px] leading-tight
                                      ${passed ? 'text-gray-200' : 'text-gray-500'}
                                      ${isCurrent ? 'text-emerald-300' : ''}
                                    `}>
                                      {s.label}
                                    </span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  </div>

                  {/* Premium Pricing Summary */}
                  <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-white/10 p-6">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-kasi-orange/10 to-transparent rounded-full blur-3xl"></div>
                    <div className="relative space-y-3">
                      <div className="flex items-center gap-2 mb-4">
                        <Receipt className="w-5 h-5 text-gray-400" />
                        <h4 className="font-bold text-white">Order Summary</h4>
                      </div>
                      
                      <div className="flex justify-between items-center text-gray-300 py-2">
                        <span className="flex items-center gap-2">
                          <ShoppingBag className="w-4 h-4 text-gray-400" />
                          Subtotal
                        </span>
                        <span className="font-semibold">R{order.total_amount.toFixed(2)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center text-gray-300 py-2">
                        <span className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-gray-400" />
                          Delivery Fee
                        </span>
                        <span className="font-semibold">R{order.delivery_fee.toFixed(2)}</span>
                      </div>
                      
                      <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-3"></div>
                      
                      <div className="flex justify-between items-center py-3 px-4 rounded-xl bg-gradient-to-r from-kasi-orange/10 to-orange-600/10 border border-kasi-orange/20">
                        <span className="text-lg font-bold text-white flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-kasi-orange" />
                          Total Amount
                        </span>
                        <span className="text-2xl font-black bg-gradient-to-r from-kasi-orange to-orange-400 bg-clip-text text-transparent">
                          R{(order.total_amount + order.delivery_fee).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {order.proof_of_purchase_url && (
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 p-5">
                      <a
                        href={order.proof_of_purchase_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/link flex items-center justify-between hover:scale-[1.02] transition-transform duration-300"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <h4 className="font-bold text-blue-200">Proof of Purchase</h4>
                            <p className="text-xs text-blue-300/60">View receipt details</p>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-blue-400 group-hover/link:translate-x-1 transition-transform" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} />
    </div>
  )
}

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center relative overflow-hidden">
        {/* Animated background gradients */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-kasi-blue/10 via-transparent to-transparent blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-kasi-orange/10 via-transparent to-transparent blur-3xl animate-pulse delay-700"></div>
        </div>
        
        <div className="text-center relative z-10">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-kasi-blue border-r-kasi-orange mx-auto shadow-2xl shadow-kasi-blue/30"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-kasi-blue/30 mx-auto"></div>
          </div>
          <p className="mt-6 text-gray-300 font-medium tracking-wide">Loading your orders...</p>
          <div className="mt-2 flex items-center justify-center gap-1">
            <div className="w-2 h-2 bg-kasi-blue rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-kasi-orange rounded-full animate-bounce delay-100"></div>
            <div className="w-2 h-2 bg-kasi-blue rounded-full animate-bounce delay-200"></div>
          </div>
        </div>
      </div>
    }>
      <OrdersContent />
    </Suspense>
  )
}
