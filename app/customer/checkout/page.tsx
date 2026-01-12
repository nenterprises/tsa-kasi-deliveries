'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/lib/CartContext'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, MapPin, CreditCard, ShoppingBag, Truck, CheckCircle, PartyPopper } from 'lucide-react'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, totalPrice, clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState<any>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [formData, setFormData] = useState({
    deliveryAddress: '',
    deliveryTownship: 'modimolle',
    notes: '',
  })

  useEffect(() => {
    checkAuth()
    // Only redirect if cart is empty AND we're not showing success modal
    if (items.length === 0 && !showSuccess) {
      router.push('/customer/cart')
    }
  }, [items, showSuccess])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/customer/login')
    } else {
      setUser(user)
    }
  }

  const deliveryFee = 15
  const totalAmount = totalPrice + deliveryFee

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!formData.deliveryAddress.trim()) {
      setError('Please enter a delivery address')
      setLoading(false)
      return
    }

    try {
      // Group items by store
      const itemsByStore = items.reduce((acc, item) => {
        if (!acc[item.store_id]) {
          acc[item.store_id] = []
        }
        acc[item.store_id].push(item)
        return acc
      }, {} as Record<string, typeof items>)

      const orderIds: string[] = []

      // Create an order for each store
      for (const [storeId, storeItems] of Object.entries(itemsByStore)) {
        const storeTotal = storeItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

        // Create order - simplified, no purchase_type
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert({
            customer_id: user.id,
            store_id: storeId,
            order_type: 'product_order',
            total_amount: storeTotal,
            delivery_fee: deliveryFee,
            delivery_address: formData.deliveryAddress,
            delivery_township: formData.deliveryTownship,
            status: 'pending',
            payment_status: 'pending',
            payment_method: 'yoco',
            notes: formData.notes || null,
          })
          .select()
          .single()

        if (orderError) throw orderError

        orderIds.push(orderData.id)

        // Create order items
        const orderItems = storeItems.map(item => ({
          order_id: orderData.id,
          product_id: item.id,
          product_name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          subtotal: item.price * item.quantity,
        }))

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems)

        if (itemsError) throw itemsError
      }

      // Initiate Yoco payment
      const paymentResponse = await fetch('/api/yoco/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalAmount,
          currency: 'ZAR',
          metadata: {
            orderIds,
            customerId: user.id,
            customerEmail: user.email,
          },
        }),
      })

      const paymentData = await paymentResponse.json()

      if (!paymentResponse.ok) {
        throw new Error(paymentData.error || 'Failed to create payment')
      }

      // Redirect to Yoco payment page
      if (paymentData.redirectUrl) {
        // Clear cart before redirecting
        clearCart()
        window.location.href = paymentData.redirectUrl
      } else {
        throw new Error('No payment redirect URL received')
      }
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (items.length === 0 && !showSuccess) {
    return null
  }

  const groupedByStore = items.reduce((acc, item) => {
    const storeKey = item.store_name || 'Unknown Store'
    if (!acc[storeKey]) {
      acc[storeKey] = []
    }
    acc[storeKey].push(item)
    return acc
  }, {} as Record<string, typeof items>)

  // Success Modal
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-kasi-black flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-md w-full text-center animate-in fade-in zoom-in duration-300">
          {/* Brand Logo */}
          <div className="mb-6">
            <h2 className="text-2xl font-display font-bold">
              <span className="text-kasi-blue">TSA</span>{' '}
              <span className="text-kasi-orange">KASi</span>
            </h2>
            <div className="text-xs text-kasi-orange font-semibold tracking-wide">Deliveries</div>
          </div>
          
          {/* Success Icon */}
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-kasi-blue/20 to-kasi-orange/20 border-2 border-kasi-orange/30 flex items-center justify-center">
            <CheckCircle className="w-14 h-14 text-kasi-orange" />
          </div>
          
          {/* Message */}
          <h1 className="text-3xl font-bold text-white mb-2">Thank You! 🎉</h1>
          <p className="text-xl text-gray-300 mb-6">Your order has been placed!</p>
          
          {/* Order Info */}
          <div className="bg-kasi-blue/10 border border-kasi-blue/20 rounded-xl p-4 mb-6">
            <p className="text-kasi-blue text-sm font-medium mb-3">What happens next:</p>
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-kasi-orange/20 flex items-center justify-center text-xs font-bold text-kasi-orange">1</div>
                <span className="text-gray-300 text-sm">We'll find an available agent</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-kasi-orange/20 flex items-center justify-center text-xs font-bold text-kasi-orange">2</div>
                <span className="text-gray-300 text-sm">Agent picks up your order</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-kasi-orange/20 flex items-center justify-center text-xs font-bold text-kasi-orange">3</div>
                <span className="text-gray-300 text-sm">Delivered to your door!</span>
              </div>
            </div>
          </div>
          
          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => router.push('/customer/orders')}
              className="w-full py-3 bg-gradient-to-r from-kasi-blue to-kasi-orange hover:opacity-90 text-white font-semibold rounded-xl transition-all shadow-lg shadow-kasi-orange/20"
            >
              Track My Order
            </button>
            <button
              onClick={() => router.push('/customer/stores')}
              className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-xl transition-colors border border-gray-700"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-kasi-black">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <Link href="/customer/cart" className="text-gray-300 hover:text-secondary-400 font-medium inline-flex items-center gap-2 text-sm sm:text-base">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Cart</span>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Checkout</h1>

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Delivery Details */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-secondary-500/20 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-secondary-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Delivery Details</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="deliveryAddress" className="block text-sm font-medium text-gray-300 mb-2">
                      Delivery Address <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="deliveryAddress"
                      type="text"
                      value={formData.deliveryAddress}
                      onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                      required
                      placeholder="e.g., 123 Main Street, Section B"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-secondary-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="deliveryTownship" className="block text-sm font-medium text-gray-300 mb-2">
                      Township <span className="text-red-400">*</span>
                    </label>
                    <select
                      id="deliveryTownship"
                      value={formData.deliveryTownship}
                      onChange={(e) => setFormData({ ...formData, deliveryTownship: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-secondary-500"
                    >
                      <option value="modimolle">Modimolle</option>
                      <option value="phagameng">Phagameng</option>
                      <option value="leseding">Leseding</option>
                      <option value="bela_bela">Bela Bela</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-2">
                      Delivery Instructions (Optional)
                    </label>
                    <textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      placeholder="Gate code, landmarks, special instructions..."
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-secondary-500 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method - Online Only */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-secondary-500/20 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-secondary-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Payment</h2>
                </div>
                
                <div className="flex items-center p-4 border-2 border-secondary-500 bg-secondary-900/20 rounded-xl">
                  <CreditCard className="w-6 h-6 mr-3 text-secondary-400" />
                  <div className="flex-1">
                    <div className="font-semibold text-white">Pay Online with Yoco</div>
                    <div className="text-sm text-gray-400">Secure card payment</div>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-secondary-500 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 px-6 rounded-xl transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Placing Order...
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    Place Order • R{totalAmount.toFixed(2)}
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 sticky top-24">
              <h2 className="text-xl font-bold text-white mb-4">Order Summary</h2>
              
              <div className="space-y-4 mb-4">
                {Object.entries(groupedByStore).map(([storeName, storeItems]) => (
                  <div key={storeName} className="pb-3 border-b border-gray-800">
                    <h3 className="font-semibold text-sm text-gray-400 mb-2">🏪 {storeName}</h3>
                    <div className="space-y-1">
                      {storeItems.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-gray-300 truncate">{item.quantity}x {item.name}</span>
                          <span className="ml-2 text-white">R{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span>
                  <span className="text-white">R{totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span className="flex items-center gap-1">
                    <Truck className="w-4 h-4" />
                    Delivery Fee
                  </span>
                  <span className="text-white">R{deliveryFee.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-800 pt-3 mt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-white">Total</span>
                    <span className="text-green-400">R{totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-secondary-900/20 border border-secondary-700/50 rounded-lg p-3">
                <p className="text-xs text-secondary-200">
                  🚀 Your order will be assigned to a delivery agent shortly. Track it in the "My Orders" page.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
