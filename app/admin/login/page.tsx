'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import BrandMark from '@/components/BrandMark'

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Authenticate via Supabase Auth
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError || !data.user) {
        setError('Invalid email or password')
        setLoading(false)
        return
      }

      // Verify admin role from profile; create it if missing (dev fallback)
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('role, status')
        .eq('id', data.user.id)
        .maybeSingle()

      if (profileError) {
        setError('Failed to load profile')
        setLoading(false)
        return
      }

      let profile = profileData
      if (!profile) {
        const meta = data.user.user_metadata || {}
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email,
            full_name: meta.full_name || data.user.email || '',
            phone_number: meta.phone_number || null,
            role: 'admin',
            status: 'active',
          })
        if (insertError) {
          setError('Failed to create admin profile')
          setLoading(false)
          return
        }
        profile = { role: 'admin', status: 'active' }
      }

      if (!profile || profile.role !== 'admin') {
        setError('You do not have admin access')
        setLoading(false)
        return
      }

      // Persist admin session for layout auth gate
      try {
        const adminUser = {
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name || data.user.email || 'Admin',
          role: 'admin',
        }
        localStorage.setItem('admin_user', JSON.stringify(adminUser))
      } catch (e) {
        // Non-blocking: proceed even if storage fails
        console.warn('Failed to persist admin_user to localStorage', e)
      }

      router.push('/admin/dashboard')
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-kasi-black">
      <div className="bg-gray-900 p-8 rounded-lg shadow-2xl w-full max-w-md border border-gray-800">
        <div className="text-center mb-8">
          <BrandMark align="center" size="lg" />
          <p className="text-gray-400 mt-1">Admin Portal</p>
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
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-kasi-blue focus:border-transparent"
              placeholder="admin@tsakasi.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
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
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/admin/signup" className="text-kasi-blue hover:text-opacity-80 text-sm">
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
