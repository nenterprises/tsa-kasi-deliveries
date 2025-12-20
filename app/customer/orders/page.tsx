'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Order, OrderItem, Store } from '@/types'
import { useCart } from '@/lib/CartContext'
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
  Package
} from 'lucide-react'

interface OrderWithDetails extends Order {
  store?: Store
  items?: OrderItem[]
}

export default function OrdersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const showSuccess = searchParams.get('success') === 'true'
  const { totalItems } = useCart()
  
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/customer/login')
    } else {
      setUser(user)
      fetchOrders(user.id)
    }
  }

  const fetchOrders = async (userId: string) => {
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
  }

  const normalizeStatus = (status: string) => {
    if (status === 'received') return 'assigned'
    if (status === 'cash_requested' || status === 'cash_approved') return 'assigned'
    return status
  }

  const getStatusColor = (status: string) => {
    status = normalizeStatus(status)
    const colors: Record<string, string> = {
      pending: 'bg-yellow-900/30 text-yellow-300 border-yellow-700',
      assigned: 'bg-blue-900/30 text-blue-300 border-blue-700',
      purchased: 'bg-purple-900/30 text-purple-300 border-purple-700',
      on_the_way: 'bg-indigo-900/30 text-indigo-300 border-indigo-700',
      delivered: 'bg-green-900/30 text-green-300 border-green-700',
      cancelled: 'bg-red-900/30 text-red-300 border-red-700',
    }
    return colors[status] || 'bg-gray-800 text-gray-300 border-gray-700'
  }

  const getStatusLabel = (status: string) => {
    status = normalizeStatus(status)
    const labels: Record<string, string> = {
      pending: 'Pending',
      assigned: 'Received by Agent',
      purchased: 'Items Purchased',
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
      case 'purchased':
        return <ShoppingBag className={common} />
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

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'text-yellow-300',
      paid: 'text-green-300',
      failed: 'text-red-300',
      refunded: 'text-gray-300',
    }
    return colors[status] || 'text-gray-300'
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
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-display font-bold text-white">My Orders</h1>
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-400">
                        Order #{order.id.slice(0, 8)} • {new Date(order.created_at).toLocaleDateString()}
                      </p>
                      <p className="font-semibold text-white mt-1">
                        🏪 {order.store?.name || 'Unknown Store'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold border flex items-center ${getStatusColor(order.status)}`}>
                        {getStatusIconEl(order.status)} {getStatusLabel(order.status)}
                      </span>
                      <span className={`text-sm font-semibold flex items-center gap-1 ${getPaymentStatusColor(order.payment_status)}`}>
                        {order.payment_status === 'paid' ? (
                          <>
                            <CreditCard className="w-4 h-4" /> Paid
                          </>
                        ) : (
                          <>
                            <Banknote className="w-4 h-4" /> Payment Pending
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
                        <div className="space-y-2">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span className="text-gray-300">
                                {item.quantity}x {item.product_name}
                              </span>
                              <span className="font-medium text-white">
                                R{item.subtotal.toFixed(2)}
                              </span>
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

                  {/* Order Status Timeline */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-300 mb-3">Order Progress:</h4>
                    <div className="flex items-center justify-between relative">
                      {(() => {
                        const steps: Array<{ key: string; label: string }> = [
                          { key: 'pending', label: getStatusLabel('pending') },
                          { key: 'assigned', label: getStatusLabel('assigned') },
                          { key: 'purchased', label: getStatusLabel('purchased') },
                          { key: 'on_the_way', label: getStatusLabel('on_the_way') },
                          { key: 'delivered', label: getStatusLabel('delivered') },
                        ]
                        const currentKey = normalizeStatus(order.status)
                        const currentIndex = steps.findIndex(s => s.key === currentKey)
                        const progressPct = ((currentIndex < 0 ? 0 : currentIndex) / (steps.length - 1)) * 100
                        return (
                          <>
                            <div className="absolute top-4 left-0 right-0 h-1 bg-gray-700">
                              <div className="h-full bg-kasi-orange transition-all duration-500" style={{ width: `${progressPct}%` }} />
                            </div>
                            {steps.map((s, idx) => {
                              const passed = idx <= currentIndex
                              return (
                                <div key={s.key} className="relative flex flex-col items-center z-10">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border ${passed ? 'bg-kasi-orange text-white border-kasi-orange' : 'bg-gray-700 text-gray-400 border-gray-600'}`}>
                                    {passed && idx !== 0 ? (
                                      <Check className="w-4 h-4" />
                                    ) : (
                                      // smaller icon in the timeline
                                      (() => {
                                        const iconClass = 'w-4 h-4'
                                        switch (s.key) {
                                          case 'pending':
                                            return <Hourglass className={iconClass} />
                                          case 'assigned':
                                            return <CheckCircle2 className={iconClass} />
                                          case 'purchased':
                                            return <ShoppingBag className={iconClass} />
                                          case 'on_the_way':
                                            return <Truck className={iconClass} />
                                          case 'delivered':
                                            return <PackageCheck className={iconClass} />
                                          default:
                                            return <Hourglass className={iconClass} />
                                        }
                                      })()
                                    )}
                                  </div>
                                  <span className={`text-xs mt-1 text-center max-w-[76px] ${passed ? 'text-gray-200' : 'text-gray-500'}`}>
                                    {s.label}
                                  </span>
                                </div>
                              )
                            })}
                          </>
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
    </div>
  )
}
