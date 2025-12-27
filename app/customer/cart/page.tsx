'use client'

import { useCart } from '@/lib/CartContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { ShoppingCart } from 'lucide-react'

export default function CartPage() {
  const router = useRouter()
  const { items, updateQuantity, removeFromCart, totalPrice, totalItems, clearCart } = useCart()
  const [removingId, setRemovingId] = useState<string | null>(null)

  const handleRemove = (productId: string) => {
    setRemovingId(productId)
    setTimeout(() => {
      removeFromCart(productId)
      setRemovingId(null)
    }, 300)
  }

  const groupedByStore = items.reduce((acc, item) => {
    const storeKey = item.store_name || 'Unknown Store'
    if (!acc[storeKey]) {
      acc[storeKey] = []
    }
    acc[storeKey].push(item)
    return acc
  }, {} as Record<string, typeof items>)

  const estimatedDeliveryFee = totalPrice > 0 ? 25 : 0
  const estimatedTotal = totalPrice + estimatedDeliveryFee

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-kasi-black">
        <header className="bg-gray-900 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/customer/stores" className="text-gray-300 hover:text-kasi-blue font-medium">
              ← Back to Stores
            </Link>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="mb-4 flex items-center justify-center">
              <ShoppingCart className="w-16 h-16 text-gray-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Your cart is empty</h2>
            <p className="text-gray-400 mb-6">Add some items to get started!</p>
            <Link
              href="/customer/stores"
              className="inline-block bg-kasi-orange hover:bg-opacity-90 text-white font-semibold py-3 px-6 rounded-lg transition"
            >
              Browse Stores
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-kasi-black">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <div className="flex items-center justify-between">
              <Link href="/customer/stores" className="text-gray-300 hover:text-kasi-blue font-medium text-sm sm:text-base">
                ← Continue Shopping
              </Link>
              <button
                onClick={clearCart}
                className="text-red-400 hover:text-red-300 font-medium text-sm sm:text-base sm:hidden"
              >
                Clear
              </button>
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-white text-center">Shopping Cart ({totalItems})</h1>
            <button
              onClick={clearCart}
              className="text-red-400 hover:text-red-300 font-medium hidden sm:block"
            >
              Clear Cart
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {Object.entries(groupedByStore).map(([storeName, storeItems]) => (
              <div key={storeName} className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
                <div className="bg-gray-800 px-4 sm:px-6 py-3 border-b border-gray-700">
                  <h3 className="font-semibold text-white">{storeName}</h3>
                </div>
                <div className="divide-y divide-gray-800">
                  {storeItems.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 sm:p-6 transition-opacity duration-300 ${
                        removingId === item.id ? 'opacity-0' : 'opacity-100'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row gap-4">
                        {item.image_url && (
                          <div className="w-full sm:w-24 h-32 sm:h-24 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-white mb-1">{item.name}</h4>
                          {item.description && (
                            <p className="text-sm text-gray-400 mb-2 line-clamp-1">{item.description}</p>
                          )}
                          <p className="text-lg font-bold text-kasi-orange">
                            R{item.price.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-8 h-8 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-bold transition"
                            >
                              -
                            </button>
                            <span className="w-8 sm:w-12 text-center font-semibold">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-8 h-8 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-bold transition"
                            >
                              +
                            </button>
                          </div>
                          <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                            <p className="font-bold text-white">
                              R{(item.price * item.quantity).toFixed(2)}
                            </p>
                            <button
                              onClick={() => handleRemove(item.id)}
                              className="text-red-400 hover:text-red-300 text-sm font-medium"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 sm:p-6 sticky top-24">
              <h2 className="text-xl font-bold text-white mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-300">
                  <span>Subtotal ({totalItems} items)</span>
                  <span>R{totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Delivery Fee (est.)</span>
                  <span>R{estimatedDeliveryFee.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-700 pt-3">
                  <div className="flex justify-between text-lg font-bold text-white">
                    <span>Total (est.)</span>
                    <span>R{estimatedTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 mb-4">
                <p className="text-xs text-yellow-300">
                  <strong>Note:</strong> Final delivery fee will be calculated based on your exact location.
                </p>
              </div>

              <button
                onClick={() => router.push('/customer/checkout')}
                className="w-full bg-kasi-orange hover:bg-opacity-90 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
              >
                Proceed to Checkout
              </button>

              <Link
                href="/customer/stores"
                className="block w-full text-center text-kasi-blue hover:opacity-90 font-medium mt-3"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
