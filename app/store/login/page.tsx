'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function StoreLogin() {
  const [accessCode, setAccessCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Verify the access code exists and get the store
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('access_code', accessCode.toUpperCase())
        .single()

      if (storeError || !store) {
        setError('Invalid access code. Please check and try again.')
        setLoading(false)
        return
      }

      // Store the session in localStorage
      localStorage.setItem('store_session', JSON.stringify({
        storeId: store.id,
        storeName: store.name,
        accessCode: store.access_code,
        loginTime: new Date().toISOString()
      }))

      // Redirect to store dashboard
      router.push('/store/dashboard')
    } catch (err) {
      console.error('Login error:', err)
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-kasi-black">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-center sm:justify-start">
            <div className="leading-tight text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl font-display font-bold">
                <span className="text-kasi-blue">TSA</span>{' '}
                <span className="text-kasi-orange">KASi</span>
              </h1>
              <div className="text-xs text-kasi-orange font-semibold tracking-wide">Deliveries</div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex items-center justify-center p-4 py-8 sm:py-12">
        <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-10 w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <div className="mb-4 flex justify-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-kasi-blue to-kasi-orange flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Store Portal</h2>
          <p className="text-sm sm:text-base text-gray-400">Enter your unique access code to continue</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5 sm:space-y-6">
          <div>
            <label htmlFor="accessCode" className="block text-sm font-medium text-gray-300 mb-2 sm:mb-3">
              Access Code
            </label>
            <input
              id="accessCode"
              type="text"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
              placeholder="XXXXXXXX"
              className="w-full px-4 py-4 bg-gray-800/50 backdrop-blur border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-kasi-orange focus:border-kasi-orange uppercase text-center text-2xl font-mono tracking-widest placeholder:text-gray-600 transition-all"
              maxLength={8}
              required
            />
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-800 text-red-300 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || accessCode.length < 8}
            className="w-full bg-gradient-to-r from-kasi-orange to-orange-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-kasi-orange/30 hover:shadow-xl hover:shadow-kasi-orange/40 focus:ring-4 focus:ring-kasi-orange/30 disabled:from-gray-700 disabled:to-gray-800 disabled:shadow-none disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Logging in...
              </span>
            ) : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            Don't have an access code? Contact your administrator.
          </p>
        </div>
      </div>
      </div>
    </div>
  )
}
