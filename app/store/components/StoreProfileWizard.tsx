'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface StoreProfileWizardProps {
  storeId: string
  onComplete: () => void
}

export default function StoreProfileWizard({ storeId, onComplete }: StoreProfileWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    description: '',
    phone_number: '',
    
    // Step 2: Banking Details
    bank_name: '',
    account_holder_name: '',
    account_number: '',
    account_type: '' as '' | 'savings' | 'current' | 'cheque',
    branch_code: '',
    
    // Step 3: Operating Hours
    open_time: '08:00',
    close_time: '18:00',
    operating_days: 'Mon-Sun'
  })

  // Load existing store data on mount
  useEffect(() => {
    loadStoreData()
  }, [storeId])

  const loadStoreData = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .single()

      if (error) throw error

      if (data) {
        // Prefill form with existing data
        setFormData({
          description: data.description || '',
          phone_number: data.phone_number || '',
          bank_name: data.bank_name || '',
          account_holder_name: data.account_holder_name || '',
          account_number: data.account_number || '',
          account_type: data.account_type || '',
          branch_code: data.branch_code || '',
          open_time: data.open_time || '08:00',
          close_time: data.close_time || '18:00',
          operating_days: data.operating_days || 'Mon-Sun'
        })
      }
    } catch (error) {
      console.error('Error loading store data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('stores')
        .update({
          description: formData.description || null,
          phone_number: formData.phone_number || null,
          open_time: formData.open_time || null,
          close_time: formData.close_time || null,
          operating_days: formData.operating_days || 'Mon-Sun',
          bank_name: formData.bank_name || null,
          account_holder_name: formData.account_holder_name || null,
          account_number: formData.account_number || null,
          account_type: formData.account_type || null,
          branch_code: formData.branch_code || null,
          banking_details_updated_at: new Date().toISOString()
        })
        .eq('id', storeId)

      if (error) throw error

      onComplete()
    } catch (error: any) {
      alert('Error saving profile: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const isStep1Valid = formData.description && formData.phone_number
  const isStep2Valid = formData.bank_name && formData.account_holder_name && 
                       formData.account_number && formData.account_type

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kasi-orange mx-auto mb-4"></div>
          <p className="text-gray-400">Loading store data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-6 py-4 z-10">
          <h2 className="text-2xl font-bold text-white mb-2">Complete Your Store Profile</h2>
          <p className="text-sm text-gray-400">
            Step {currentStep} of 3 - Let's set up your store
          </p>
          
          {/* Progress Bar */}
          <div className="mt-4 flex gap-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`h-2 flex-1 rounded-full transition-all ${
                  step <= currentStep
                    ? 'bg-gradient-to-r from-kasi-orange to-orange-600'
                    : 'bg-gray-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Basic Information</h3>
                <p className="text-gray-400 mb-6">
                  Tell us a bit about your store
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Store Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-kasi-orange focus:border-kasi-orange transition-all"
                  rows={4}
                  placeholder="Describe what makes your store special..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Contact Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-kasi-orange focus:border-kasi-orange transition-all"
                  placeholder="e.g., 0123456789"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Operating Days
                </label>
                <input
                  type="text"
                  value={formData.operating_days}
                  onChange={(e) => setFormData({ ...formData, operating_days: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-kasi-orange focus:border-kasi-orange transition-all"
                  placeholder="e.g., Mon-Fri, Mon-Sun"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Opening Time
                  </label>
                  <input
                    type="time"
                    value={formData.open_time}
                    onChange={(e) => setFormData({ ...formData, open_time: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-kasi-orange focus:border-kasi-orange transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Closing Time
                  </label>
                  <input
                    type="time"
                    value={formData.close_time}
                    onChange={(e) => setFormData({ ...formData, close_time: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-kasi-orange focus:border-kasi-orange transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Banking Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Banking Details</h3>
                <p className="text-gray-400 mb-6">
                  Set up your banking information to receive payments
                </p>
              </div>

              <div className="bg-blue-900/20 border border-blue-700 rounded-xl p-4">
                <p className="text-sm text-blue-300">
                  💡 Your banking details are secure and will only be used for weekly payouts
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Bank Name *
                </label>
                <select
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-kasi-orange focus:border-kasi-orange transition-all"
                  required
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
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-kasi-orange focus:border-kasi-orange transition-all"
                  placeholder="Full name on bank account"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    value={formData.account_number}
                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-kasi-orange focus:border-kasi-orange transition-all font-mono"
                    placeholder="1234567890"
                    maxLength={16}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Account Type *
                  </label>
                  <select
                    value={formData.account_type}
                    onChange={(e) => setFormData({ ...formData, account_type: e.target.value as any })}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-kasi-orange focus:border-kasi-orange transition-all"
                    required
                  >
                    <option value="">Select type</option>
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
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-kasi-orange focus:border-kasi-orange transition-all font-mono"
                  placeholder="123456"
                  maxLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Some banks use a universal branch code (e.g., Capitec: 470010)
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Review & Confirm */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Review & Confirm</h3>
                <p className="text-gray-400 mb-6">
                  Please review your information before completing setup
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                  <h4 className="font-semibold text-kasi-orange mb-3">Basic Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Description:</span>
                      <span className="text-white text-right max-w-xs">{formData.description || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Phone:</span>
                      <span className="text-white">{formData.phone_number || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Hours:</span>
                      <span className="text-white">{formData.open_time} - {formData.close_time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Days:</span>
                      <span className="text-white">{formData.operating_days}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                  <h4 className="font-semibold text-kasi-orange mb-3">Banking Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Bank:</span>
                      <span className="text-white">{formData.bank_name || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Account Holder:</span>
                      <span className="text-white">{formData.account_holder_name || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Account Number:</span>
                      <span className="text-white font-mono">{formData.account_number || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Account Type:</span>
                      <span className="text-white capitalize">{formData.account_type || 'Not provided'}</span>
                    </div>
                    {formData.branch_code && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Branch Code:</span>
                        <span className="text-white font-mono">{formData.branch_code}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-green-900/20 border border-green-700 rounded-xl p-4">
                <p className="text-sm text-green-300">
                  ✅ You're all set! Click "Complete Setup" to finish your store profile.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-900 border-t border-gray-800 px-6 py-4 flex justify-between gap-4">
          {currentStep > 1 ? (
            <button
              onClick={handleBack}
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition-all"
            >
              ← Back
            </button>
          ) : (
            <div></div>
          )}

          {currentStep < 3 ? (
            <button
              onClick={handleNext}
              disabled={currentStep === 1 ? !isStep1Valid : !isStep2Valid}
              className="px-6 py-3 bg-gradient-to-r from-kasi-orange to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-kasi-orange/30 hover:shadow-xl hover:shadow-kasi-orange/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white font-bold rounded-xl shadow-lg shadow-green-600/30 hover:shadow-xl hover:shadow-green-600/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {saving ? 'Saving...' : '✓ Complete Setup'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
