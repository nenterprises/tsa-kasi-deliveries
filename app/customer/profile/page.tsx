'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { User } from '@/types'
import { useCart } from '@/lib/CartContext'
import { useActiveOrdersCount } from '@/lib/useActiveOrders'
import { ShoppingCart, User as UserIcon, Mail, Phone, MapPin, Save, ArrowLeft, Edit2, X } from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const { totalItems } = useCart()
  const { count: activeOrdersCount } = useActiveOrdersCount()
  
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
  })

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/customer/login')
      return
    }
    
    setUser(user)
    fetchProfile(user.id)
  }

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      
      setProfile(data)
      setFormData({
        full_name: data.full_name || '',
        phone_number: data.phone_number || '',
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return
    
    setSaving(true)
    setMessage(null)
    
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: formData.full_name,
          phone_number: formData.phone_number,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error
      
      setProfile(prev => prev ? { ...prev, ...formData } : null)
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      setEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/customer/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-kasi-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kasi-blue mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-kasi-black">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <div className="leading-tight">
                <h1 className="text-lg sm:text-2xl font-display font-bold">
                  <span className="text-kasi-blue">TSA</span>{' '}
                  <span className="text-kasi-orange">KASi</span>
                </h1>
                <div className="text-kasi-orange text-[10px] sm:text-xs font-semibold tracking-wide">Deliveries</div>
              </div>
              <span className="text-gray-400 text-sm hidden md:inline">Customer Portal</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                href="/customer/cart"
                className="relative bg-kasi-orange text-white px-2 sm:px-4 py-2 rounded-lg hover:bg-opacity-90 transition flex items-center gap-1 sm:gap-2"
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
                href="/customer/orders"
                className="text-gray-300 hover:text-kasi-blue font-medium flex items-center text-sm sm:text-base"
              >
                <span className="hidden sm:inline">My Orders</span>
                <span className="sm:hidden">Orders</span>
                {activeOrdersCount > 0 && (
                  <span
                    title={`${activeOrdersCount} active`}
                    className="ml-1 sm:ml-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 min-w-5 px-1 flex items-center justify-center"
                  >
                    {activeOrdersCount}
                  </span>
                )}
              </Link>
              <button
                onClick={handleLogout}
                className="text-gray-300 hover:text-red-500 font-medium text-sm sm:text-base"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Link */}
        <Link
          href="/customer/stores"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-kasi-blue mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Stores
        </Link>

        {/* Profile Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gray-900 border-b border-gray-800 p-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center">
                <UserIcon className="w-10 h-10 text-gray-300" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{profile?.full_name || 'Customer'}</h2>
                <p className="text-gray-400">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          {message && (
            <div className={`mx-6 mt-6 p-4 rounded-lg border ${
              message.type === 'success' 
                ? 'bg-green-900/30 border-green-700 text-green-300' 
                : 'bg-red-900/30 border-red-700 text-red-300'
            }`}>
              {message.text}
            </div>
          )}

          {/* Profile Details */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Profile Information</h3>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 text-kasi-blue hover:text-kasi-orange transition"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </button>
              ) : (
                <button
                  onClick={() => {
                    setEditing(false)
                    setFormData({
                      full_name: profile?.full_name || '',
                      phone_number: profile?.phone_number || '',
                    })
                  }}
                  className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              )}
            </div>

            <div className="space-y-6">
              {/* Full Name */}
              <div>
                <label className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                  <UserIcon className="w-4 h-4" />
                  Full Name
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-kasi-blue focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                ) : (
                  <p className="text-white text-lg">{profile?.full_name || 'Not set'}</p>
                )}
              </div>

              {/* Email (Read-only) */}
              <div>
                <label className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </label>
                <p className="text-white text-lg">{user?.email}</p>
                <p className="text-gray-500 text-xs mt-1">Email cannot be changed</p>
              </div>

              {/* Phone Number */}
              <div>
                <label className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </label>
                {editing ? (
                  <input
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-kasi-blue focus:border-transparent"
                    placeholder="Enter your phone number"
                  />
                ) : (
                  <p className="text-white text-lg">{profile?.phone_number || 'Not set'}</p>
                )}
              </div>

              {/* Account Status */}
              <div>
                <label className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                  Account Status
                </label>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  profile?.status === 'active' 
                    ? 'bg-green-900/30 text-green-300 border border-green-700' 
                    : 'bg-yellow-900/30 text-yellow-300 border border-yellow-700'
                }`}>
                  {profile?.status === 'active' ? '✓ Active' : profile?.status || 'Unknown'}
                </span>
              </div>

              {/* Member Since */}
              <div>
                <label className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                  Member Since
                </label>
                <p className="text-white text-lg">
                  {profile?.created_at 
                    ? new Date(profile.created_at).toLocaleDateString('en-ZA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'Unknown'}
                </p>
              </div>
            </div>

            {/* Save Button */}
            {editing && (
              <div className="mt-8 pt-6 border-t border-gray-800">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 bg-kasi-orange hover:bg-opacity-90 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg transition"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/customer/orders"
            className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-kasi-blue transition group"
          >
            <h4 className="text-white font-semibold mb-2 group-hover:text-kasi-blue transition">My Orders</h4>
            <p className="text-gray-400 text-sm">View your order history and track active orders</p>
          </Link>
          <Link
            href="/customer/stores"
            className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-kasi-orange transition group"
          >
            <h4 className="text-white font-semibold mb-2 group-hover:text-kasi-orange transition">Browse Stores</h4>
            <p className="text-gray-400 text-sm">Explore local stores and place new orders</p>
          </Link>
        </div>
      </main>
    </div>
  )
}
