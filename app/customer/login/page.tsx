'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import BrandMark from '@/components/BrandMark'

export default function CustomerLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Verify user role is customer; create profile if missing (dev fallback)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, status')
        .eq('id', data.user.id)
        .maybeSingle()

      if (userError) throw userError

      let profile = userData
      if (!profile) {
        // Fallback: create profile when trigger hasn't run yet (dev mode)
        const meta = data.user.user_metadata || {}
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email,
            full_name: meta.full_name || data.user.email || '',
            phone_number: meta.phone_number || null,
            role: 'customer',
            status: 'active',
          })
        if (insertError) throw insertError
        profile = { role: 'customer', status: 'active' }
      }

      if (profile.role !== 'customer') {
        await supabase.auth.signOut()
        throw new Error('Access denied. Customer accounts only.')
      }

      if (profile.status !== 'active') {
        await supabase.auth.signOut()
        throw new Error('Your account is not active. Please contact support.')
      }

      router.push('/customer/stores')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-kasi-black p-4">
      <div className="bg-gray-900 p-8 rounded-lg shadow-2xl w-full max-w-md border border-gray-800">
        <div className="text-center mb-8">
          <BrandMark align="center" size="lg" />
          <p className="text-gray-400 mt-1">Customer Portal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-kasi-blue focus:border-transparent"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-kasi-blue focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-kasi-orange text-white py-3 rounded-lg font-bold hover:bg-opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/customer/signup" className="text-kasi-blue hover:text-opacity-80 text-sm">
            Don't have an account? Sign up
          </Link>
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="text-gray-500 hover:text-gray-400 text-sm">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
