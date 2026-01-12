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

interface OrderItemWithProduct extends OrderItem {
  product?: {
    id: string
    name?: string
    image_url?: string
  }
}

interface OrderWithDetails extends Order {
  store?: Store
  items?: OrderItemWithProduct[]
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
              .select(`
                *,
                products (
                  id,
                  name,
                  image_url
                )
              `)
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
      <div className="min-h-screen bg-kasi-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kasi-blue mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-kasi-black">
      <ToastContainer toasts={toasts} />
      
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center justify-between sm:justify-start gap-3">
              <h1 className="text-xl sm:text-2xl font-display font-bold text-white">My Orders</h1>
              <Link href="/customer/stores" className="text-gray-300 hover:text-kasi-blue font-medium text-sm">
                ← Stores
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/customer/cart"
                className="relative bg-kasi-orange text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-opacity-90 transition flex items-center gap-1 sm:gap-2"
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
                href="/customer/profile"
                className="flex items-center gap-2 text-gray-300 hover:text-kasi-blue font-medium"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-700 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <span className="hidden md:inline">{userName || 'Profile'}</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        {showSuccess && (
          <div className="bg-green-900/30 border border-green-700 text-green-300 px-6 py-4 rounded-lg mb-6 flex items-center gap-3">
            <span className="text-2xl">✓</span>
            <span>Order placed successfully.</span>
            <Link
              href="/customer/cart"
              className="ml-auto relative bg-kasi-orange text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition flex items-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>View Cart</span>
            </Link>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="flex justify-center mb-4">
              <Package className="w-16 h-16 text-gray-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">No orders yet</h2>
            <p className="text-gray-400 mb-6">Start shopping to place your first order!</p>
            <Link
              href="/customer/stores"
              className="inline-block bg-kasi-orange hover:bg-opacity-90 text-white font-semibold py-3 px-6 rounded-lg transition"
            >
              Browse Stores
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
                {/* Order Header */}
                <div className="bg-gray-800 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-700">
                  <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-2 sm:gap-4">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-400">
                        Order #{order.id.slice(0, 8)} • {new Date(order.created_at).toLocaleDateString()}
                      </p>
                      <p className="font-semibold text-white mt-1 text-sm sm:text-base">
                        🏪 {order.store?.name || 'Unknown Store'}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold border flex items-center ${getStatusColor(order.status)}`}>
                        {getStatusIconEl(order.status)} {getStatusLabel(order.status)}
                      </span>
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold border flex items-center ${
                        order.payment_status === 'paid' 
                          ? 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-200 border border-emerald-500/30' 
                          : 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-yellow-200 border border-yellow-500/30'
                      }`}>
                        {order.payment_status === 'paid' ? (
                          <>
                            <CreditCard className="w-3 h-3 sm:w-4 sm:h-4" /> Paid
                          </>
                        ) : (
                          <>
                            <Banknote className="w-3 h-3 sm:w-4 sm:h-4" /> Pending
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Details */}
                <div className="p-6">
                  {order.order_type === 'custom_request' ? (
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-300 mb-2">Custom Request:</h4>
                      <p className="text-gray-300 bg-gray-800 p-3 rounded-lg border border-gray-700">
                        {order.custom_request_text}
                      </p>
                    </div>
                  ) : (
                    order.items && order.items.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-300 mb-2">Items:</h4>
                        <div className="space-y-3">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
                              {item.product?.image_url && (
                                <div className="flex-shrink-0 w-24 h-24 bg-gray-700 rounded-lg overflow-hidden">
                                  <img 
                                    src={item.product.image_url} 
                                    alt={item.product_name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-gray-200 font-medium">
                                  {item.quantity}x {item.product_name}
                                </p>
                                <p className="text-gray-400 text-xs mt-0.5">
                                  R{(item.subtotal / item.quantity).toFixed(2)} each
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="font-bold text-white">
                                  R{item.subtotal.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-semibold text-gray-300 text-sm mb-1">Delivery Address:</h4>
                      <p className="text-gray-300 text-sm">
                        {order.delivery_address}, {order.delivery_township}
                      </p>
                    </div>
                    {order.notes && (
                      <div>
                        <h4 className="font-semibold text-gray-300 text-sm mb-1">Notes:</h4>
                        <p className="text-gray-300 text-sm">{order.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Order Progress Timeline */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-300 mb-3">Order Progress:</h4>
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
                                className="h-full bg-gradient-to-r from-kasi-blue via-purple-500 to-emerald-500 rounded-full transition-all duration-1000 ease-out" 
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
                                      transition-all duration-500
                                      ${
                                        passed 
                                          ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg scale-110' 
                                          : 'bg-gray-700/50 text-gray-400 border border-gray-600'
                                      }
                                      ${isCurrent ? 'animate-pulse ring-4 ring-emerald-500/30' : ''}
                                    `}>
                                      {passed && idx < currentIndex ? (
                                        <CheckCircle2 className="w-6 h-6" />
                                      ) : (
                                        <Icon className="w-6 h-6" />
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

                  {/* Pricing */}
                  <div className="border-t border-gray-700 pt-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm text-gray-300">
                        <span>Subtotal:</span>
                        <span>R{order.total_amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-300">
                        <span>Delivery Fee:</span>
                        <span>R{order.delivery_fee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-white pt-2 border-t border-gray-700">
                        <span>Total:</span>
                        <span>R{(order.total_amount + order.delivery_fee).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {order.proof_of_purchase_url && (
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <a
                        href={order.proof_of_purchase_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-kasi-blue hover:opacity-90 text-sm font-medium inline-flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" /> View Proof of Purchase
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
