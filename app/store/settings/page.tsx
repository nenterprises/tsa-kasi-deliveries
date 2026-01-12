'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface StoreSession {
  storeId: string
  storeName: string
  accessCode: string
}

export default function StoreSettings() {
  const [storeSession, setStoreSession] = useState<StoreSession | null>(null)
  const [storeData, setStoreData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showCopied, setShowCopied] = useState(false)
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    // Banking details
    bank_name: '',
    account_holder_name: '',
    account_number: '',
    account_type: '' as '' | 'savings' | 'current' | 'cheque',
    branch_code: ''
  })

  useEffect(() => {
    const sessionData = localStorage.getItem('store_session')
    if (!sessionData) {
      router.push('/store/login')
      return
    }

    const session = JSON.parse(sessionData)
    setStoreSession(session)
    loadStoreData(session.storeId)
  }, [router])

  const loadStoreData = async (storeId: string) => {
    setLoading(true)

    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .single()

    if (error) {
      console.error('Error loading store data:', error)
    } else {
      setStoreData(data)
      setFormData({
        name: data.name || '',
        description: data.description || '',
        address: data.street_address || '',
        phone: data.phone_number || '',
        email: data.email || '',
        // Banking details
        bank_name: data.bank_name || '',
        account_holder_name: data.account_holder_name || '',
        account_number: data.account_number || '',
        account_type: data.account_type || '',
        branch_code: data.branch_code || ''
      })
    }

    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    if (!storeSession) return

    const { error } = await supabase
      .from('stores')
      .update({
        name: formData.name,
        description: formData.description,
        street_address: formData.address,
        phone_number: formData.phone,
        // Banking details
        bank_name: formData.bank_name || null,
        account_holder_name: formData.account_holder_name || null,
        account_number: formData.account_number || null,
        account_type: formData.account_type || null,
        branch_code: formData.branch_code || null,
        banking_details_updated_at: new Date().toISOString()
      })
      .eq('id', storeSession.storeId)

    if (error) {
      alert('Error updating store: ' + error.message)
    } else {
      // Update session storage with new name
      const updatedSession = { ...storeSession, storeName: formData.name }
      localStorage.setItem('store_session', JSON.stringify(updatedSession))
      setStoreSession(updatedSession)
      
      alert('Settings updated successfully!')
      loadStoreData(storeSession.storeId)
    }

    setSaving(false)
  }

  const copyAccessCode = () => {
    if (storeData?.access_code) {
      navigator.clipboard.writeText(storeData.access_code)
      setShowCopied(true)
      setTimeout(() => setShowCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Store Settings</h1>
        <p className="text-gray-400">Manage your store information and preferences</p>
      </div>

      {/* Access Code Section */}
      <div className="bg-blue-900/30 border border-blue-700 rounded-2xl p-4 sm:p-6">
        <h2 className="text-xl font-bold text-blue-300 mb-3">Your Access Code</h2>
        <p className="text-sm text-blue-400 mb-4">
          This is your unique store access code. Keep it secure and share it only with authorized staff.
        </p>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl px-4 py-3">
            <p className="text-xl sm:text-2xl font-mono font-bold text-kasi-blue text-center tracking-wider">
              {storeData?.access_code || 'N/A'}
            </p>
          </div>
          <button
            onClick={copyAccessCode}
            className="bg-gradient-to-r from-kasi-orange to-orange-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-kasi-orange/30 hover:shadow-xl hover:shadow-kasi-orange/40 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="flex items-center gap-2">
              {showCopied ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Copy
                </>
              )}
            </span>
          </button>
        </div>
      </div>

      {/* Store Information Form */}
      <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">Store Information</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Store Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800/50 backdrop-blur border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-kasi-orange focus:border-kasi-orange transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800/50 backdrop-blur border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-kasi-orange focus:border-kasi-orange transition-all"
              rows={3}
              placeholder="Brief description of your store"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Address *
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800/50 backdrop-blur border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-kasi-orange focus:border-kasi-orange transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800/50 backdrop-blur border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-kasi-orange focus:border-kasi-orange transition-all"
                placeholder="e.g., 0123456789"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800/50 backdrop-blur border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-kasi-orange focus:border-kasi-orange transition-all"
                placeholder="store@example.com"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-800">
            <button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-kasi-orange to-orange-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-kasi-orange/30 hover:shadow-xl hover:shadow-kasi-orange/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Banking Details Form */}
      <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">Banking Details</h2>
          <p className="text-sm text-gray-400 mt-1">
            Add your banking details to receive payments from sales
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Bank Name *
            </label>
            <select
              value={formData.bank_name}
              onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800/50 backdrop-blur border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-kasi-orange focus:border-kasi-orange transition-all"
            >
              <option value="">Select a bank</option>
              <option value="ABSA">ABSA</option>
              <option value="African Bank">African Bank</option>
              <option value="Capitec">Capitec</option>
              <option value="Discovery Bank">Discovery Bank</option>
              <option value="FNB">FNB (First National Bank)</option>
              <option value="Investec">Investec</option>
              <option value="Nedbank">Nedbank</option>
              <option value="Standard Bank">Standard Bank</option>
              <option value="TymeBank">TymeBank</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Account Holder Name *
            </label>
            <input
              type="text"
              value={formData.account_holder_name}
              onChange={(e) => setFormData({ ...formData, account_holder_name: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800/50 backdrop-blur border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-kasi-orange focus:border-kasi-orange transition-all"
              placeholder="Full name on bank account"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Account Number *
              </label>
              <input
                type="text"
                value={formData.account_number}
                onChange={(e) => setFormData({ ...formData, account_number: e.target.value.replace(/\D/g, '') })}
                className="w-full px-4 py-2 bg-gray-800/50 backdrop-blur border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-kasi-orange focus:border-kasi-orange transition-all font-mono"
                placeholder="1234567890"
                maxLength={16}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Account Type *
              </label>
              <select
                value={formData.account_type}
                onChange={(e) => setFormData({ ...formData, account_type: e.target.value as any })}
                className="w-full px-4 py-2 bg-gray-800/50 backdrop-blur border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-kasi-orange focus:border-kasi-orange transition-all"
              >
                <option value="">Select account type</option>
                <option value="savings">Savings</option>
                <option value="current">Current</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Branch Code
            </label>
            <input
              type="text"
              value={formData.branch_code}
              onChange={(e) => setFormData({ ...formData, branch_code: e.target.value.replace(/\D/g, '') })}
              className="w-full px-4 py-2 bg-gray-800/50 backdrop-blur border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-kasi-orange focus:border-kasi-orange transition-all font-mono"
              placeholder="123456"
              maxLength={6}
            />
            <p className="text-xs text-gray-500 mt-1">
              Some banks use a universal branch code (e.g., Capitec: 470010)
            </p>
          </div>

          {storeData?.banking_details_verified && (
            <div className="bg-green-900/20 border border-green-700 rounded-xl p-4">
              <p className="text-sm text-green-300 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Banking details verified by admin
              </p>
            </div>
          )}

          <div className="bg-blue-900/20 border border-blue-700 rounded-xl p-4">
            <p className="text-sm text-blue-300">
              <strong>Note:</strong> Your banking details are securely stored and will be used for weekly payouts. Make sure all information is accurate to avoid payment delays.
            </p>
          </div>

          <div className="pt-4 border-t border-gray-800">
            <button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-kasi-orange to-orange-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-kasi-orange/30 hover:shadow-xl hover:shadow-kasi-orange/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {saving ? 'Saving...' : 'Save Banking Details'}
            </button>
          </div>
        </form>
      </div>

      {/* Store Statistics */}
      <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl shadow-lg p-4 sm:p-6">
        <h2 className="text-xl font-bold text-white mb-4">Store Statistics</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl">
            <p className="text-sm text-gray-400">Store ID</p>
            <p className="font-mono text-xs text-white mt-1">
              {storeData?.id.slice(0, 13)}...
            </p>
          </div>
          <div className="p-4 bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl">
            <p className="text-sm text-gray-400">Created On</p>
            <p className="text-sm text-white mt-1">
              {storeData?.created_at ? new Date(storeData.created_at).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl shadow-lg p-4 sm:p-6">
        <h2 className="text-xl font-bold text-white mb-3">Need Help?</h2>
        <p className="text-sm text-gray-400 mb-4">
          If you encounter any issues or need assistance with your store, please contact your platform administrator.
        </p>
        <div className="space-y-2 text-sm">
          <p className="text-gray-300">
            <span className="font-medium">Common Issues:</span>
          </p>
          <ul className="list-disc list-inside text-gray-400 space-y-1 ml-4">
            <li>Can't update menu items? Check your internet connection</li>
            <li>Orders not appearing? Refresh the page</li>
            <li>Access code not working? Contact admin to regenerate</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
