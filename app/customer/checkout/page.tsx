'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/lib/CartContext'
import { supabase } from '@/lib/supabase'
import { ShoppingCart } from 'lucide-react'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, totalPrice, clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    deliveryAddress: '',
    deliveryTownship: 'modimolle',
    paymentMethod: 'cash' as 'cash' | 'yoco',
    notes: '',
  })

  useEffect(() => {
    checkAuth()
    if (items.length === 0) {
      router.push('/customer/cart')
    }
  }, [items])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/customer/login')
    } else {
      setUser(user)
    }
  }

  const estimatedDeliveryFee = 25
  const estimatedTotal = totalPrice + estimatedDeliveryFee

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

      // Create an order for each store
      for (const [storeId, storeItems] of Object.entries(itemsByStore)) {
        const storeTotal = storeItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

        // Create order
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert({
            customer_id: user.id,
            store_id: storeId,
            order_type: 'product_order',
            purchase_type: 'APO',
            total_amount: storeTotal,
            delivery_fee: estimatedDeliveryFee,
            delivery_address: formData.deliveryAddress,
            delivery_township: formData.deliveryTownship,
            status: 'pending',
            payment_status: formData.paymentMethod === 'cash' ? 'pending' : 'pending',
            payment_method: formData.paymentMethod,
            notes: formData.notes || null,
          })
          .select()
          .single()

        if (orderError) throw orderError

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

      // Clear cart and redirect
      clearCart()
      router.push('/customer/orders?success=true')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/customer/cart" className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            <span>Back to Cart</span>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Checkout</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Delivery Details */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Delivery Details</h2>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="deliveryAddress" className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="deliveryAddress"
                      type="text"
                      value={formData.deliveryAddress}
                      onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                      required
                      placeholder="123 Main Street"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="deliveryTownship" className="block text-sm font-medium text-gray-700 mb-2">
                      Township <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="deliveryTownship"
                      value={formData.deliveryTownship}
                      onChange={(e) => setFormData({ ...formData, deliveryTownship: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="modimolle">Modimolle</option>
                      <option value="phagameng">Phagameng</option>
                      <option value="leseding">Leseding</option>
                      <option value="bela_bela">Bela Bela</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Instructions (Optional)
                    </label>
                    <textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      placeholder="Any special instructions for the driver..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Payment Method</h2>
                
                <div className="space-y-3">
                  <label className="flex items-center p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash"
                      checked={formData.paymentMethod === 'cash'}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: 'cash' })}
                      className="mr-3 h-5 w-5 text-blue-600"
                    />
                    <div>
                      <div className="font-semibold text-gray-800">💵 Cash on Delivery</div>
                      <div className="text-sm text-gray-600">Pay when you receive your order</div>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="yoco"
                      checked={formData.paymentMethod === 'yoco'}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: 'yoco' })}
                      className="mr-3 h-5 w-5 text-blue-600"
                    />
                    <div>
                      <div className="font-semibold text-gray-800">💳 Yoco Payment</div>
                      <div className="text-sm text-gray-600">Pay securely online</div>
                    </div>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                {loading ? 'Placing Order...' : 'Place Order'}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Order Summary</h2>
              
              <div className="space-y-4 mb-4">
                {Object.entries(groupedByStore).map(([storeName, storeItems]) => (
                  <div key={storeName} className="pb-3 border-b border-gray-200">
                    <h3 className="font-semibold text-sm text-gray-700 mb-2">🏪 {storeName}</h3>
                    <div className="space-y-1">
                      {storeItems.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm text-gray-600">
                          <span className="truncate">{item.quantity}x {item.name}</span>
                          <span className="ml-2">R{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>R{totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span>R{estimatedDeliveryFee.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between text-lg font-bold text-gray-800">
                    <span>Total</span>
                    <span>R{estimatedTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  Your order will be confirmed shortly. You'll receive updates via the order tracking page.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
