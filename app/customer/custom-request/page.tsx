'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Store } from '@/types'
import { useActiveOrdersCount } from '@/lib/useActiveOrders'

function CustomRequestContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedStoreId = searchParams.get('store')
  const { count: activeOrdersCount } = useActiveOrdersCount()

  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    storeId: preselectedStoreId || '',
    requestText: '',
    deliveryAddress: '',
    deliveryTownship: 'modimolle',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchStores()
  }, [])

  const fetchStores = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('status', 'active')
        .order('name')

      if (error) throw error
      setStores(data || [])
    } catch (error) {
      console.error('Error fetching stores:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!formData.storeId || !formData.requestText.trim() || !formData.deliveryAddress.trim()) {
      setError('Please fill in all required fields')
      setLoading(false)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/customer/login')
        return
      }

      // Create order with custom request - cash on delivery only
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: user.id,
          store_id: formData.storeId,
          order_type: 'custom_request',
          custom_request_text: formData.requestText,
          delivery_address: formData.deliveryAddress,
          delivery_township: formData.deliveryTownship,
          total_amount: 0, // Customer pays on delivery
          delivery_fee: 15, // Flat delivery fee
          status: 'pending',
          payment_status: 'pending',
          payment_method: 'yoco', // Online payment only
        })
        .select()
        .single()

      if (orderError) throw orderError

      setSuccess(true)
      setTimeout(() => {
        router.push('/customer/orders')
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-kasi-black">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-display font-bold">
              <span className="text-kasi-blue">TSA</span>{' '}
              <span className="text-kasi-orange">KASi</span>
            </h1>
            <Link href="/customer/stores" className="text-gray-300 hover:text-kasi-blue font-medium">
              ← Back to Stores
            </Link>
          </div>
          <Link href="/customer/orders" className="text-gray-300 hover:text-kasi-blue font-medium flex items-center">
            My Orders
            {activeOrdersCount > 0 && (
              <span
                title={`${activeOrdersCount} active`}
                className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 min-w-5 px-1 flex items-center justify-center"
              >
                {activeOrdersCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">Custom Request</h1>
            <p className="text-gray-400">
              Tell us what you need and we'll get it for you! For example: "Buy 2 loaves of bread at Spaza X" or "Get me chips and a cold drink from Mama K restaurant"
            </p>
          </div>

          {success && (
            <div className="bg-green-900/30 border border-green-700 text-green-300 px-4 py-3 rounded-lg mb-6">
              ✓ Custom request submitted successfully! Redirecting to your orders...
            </div>
          )}

          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="storeId" className="block text-sm font-medium text-gray-300 mb-2">
                Select Store <span className="text-red-500">*</span>
              </label>
              <select
                id="storeId"
                value={formData.storeId}
                onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                required
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-kasi-blue focus:border-transparent"
              >
                <option value="">Choose a store...</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name} - {store.township}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="requestText" className="block text-sm font-medium text-gray-300 mb-2">
                What do you need? <span className="text-red-500">*</span>
              </label>
              <textarea
                id="requestText"
                value={formData.requestText}
                onChange={(e) => setFormData({ ...formData, requestText: e.target.value })}
                required
                rows={5}
                placeholder="Example: Buy 2 loaves of Albany bread, 1L milk, and a dozen eggs"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-kasi-blue focus:border-transparent resize-none placeholder:text-gray-400"
              />
              <p className="mt-2 text-sm text-gray-400">
                Be as specific as possible about what you want, including quantities and brands if needed.
              </p>
            </div>

            <div>
              <label htmlFor="deliveryAddress" className="block text-sm font-medium text-gray-300 mb-2">
                Delivery Address <span className="text-red-500">*</span>
              </label>
              <input
                id="deliveryAddress"
                type="text"
                value={formData.deliveryAddress}
                onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                required
                placeholder="123 Main Street"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-kasi-blue focus:border-transparent placeholder:text-gray-400"
              />
            </div>

            <div>
              <label htmlFor="deliveryTownship" className="block text-sm font-medium text-gray-300 mb-2">
                Township <span className="text-red-500">*</span>
              </label>
              <select
                id="deliveryTownship"
                value={formData.deliveryTownship}
                onChange={(e) => setFormData({ ...formData, deliveryTownship: e.target.value })}
                required
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-kasi-blue focus:border-transparent"
              >
                <option value="modimolle">Modimolle</option>
                <option value="phagameng">Phagameng</option>
                <option value="leseding">Leseding</option>
                <option value="bela_bela">Bela Bela</option>
              </select>
            </div>

            <div className="bg-secondary-900/20 border border-secondary-700/50 rounded-lg p-4">
              <h3 className="font-semibold text-secondary-200 mb-2">💳 How it works:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-secondary-200/80">
                <li>Submit your request (tell us what you need)</li>
                <li>Pay online securely</li>
                <li>Agent picks up your items from the store</li>
                <li>Items delivered to your door!</li>
              </ol>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full bg-kasi-orange hover:bg-opacity-90 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : success ? '✓ Submitted' : 'Submit Custom Request'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}

export default function CustomRequestPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-kasi-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kasi-blue mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <CustomRequestContent />
    </Suspense>
  )
}
