'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { OrderWithDetails } from '@/types'
import { Phone, Clock, Truck, Check, CheckCircle2 } from 'lucide-react'

interface MyActiveJobProps {
  agentId: string
}

export default function MyActiveJob({ agentId }: MyActiveJobProps) {
  const [activeJob, setActiveJob] = useState<OrderWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  
  // Form states for different actions
  const [cashAmount, setCashAmount] = useState('')
  const [actualAmount, setActualAmount] = useState('')
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [deliveryPhoto, setDeliveryPhoto] = useState<File | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'company_cash' | 'company_card'>('company_cash')

  useEffect(() => {
    if (!agentId) return
    loadActiveJob()
    
    const subscription = supabase
      .channel('active-job')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders', filter: `agent_id=eq.${agentId}` },
        () => loadActiveJob()
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [agentId])

  const loadActiveJob = async () => {
    try {
      if (!agentId) return
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          store:stores(*),
          items:order_items(*, product:products(image_url,name))
        `)
        .eq('agent_id', agentId)
        .not('status', 'in', '(delivered,cancelled)')
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) throw error
      setActiveJob((data && data[0]) || null)
    } catch (error) {
      console.error('Error loading active job:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRequestCash = async () => {
    if (!activeJob || !cashAmount) return
    setActionLoading(true)

    try {
      const amount = parseFloat(cashAmount)
      
      // Get agent wallet
      const { data: wallet } = await supabase
        .from('agent_wallets')
        .select('*')
        .eq('agent_id', agentId)
        .single()

      if (!wallet) throw new Error('Wallet not found')
      
      // Check limits
      if (wallet.company_cash_balance + amount > wallet.max_cash_limit) {
        alert(`Cash request exceeds limit. Current: R${wallet.company_cash_balance}, Limit: R${wallet.max_cash_limit}`)
        return
      }

      // Update wallet balance
      const newBalance = wallet.company_cash_balance + amount
      await supabase
        .from('agent_wallets')
        .update({ company_cash_balance: newBalance })
        .eq('agent_id', agentId)

      // Create transaction record
      await supabase
        .from('agent_transactions')
        .insert({
          agent_id: agentId,
          order_id: activeJob.id,
          transaction_type: 'cash_released',
          amount: amount,
          balance_before: wallet.company_cash_balance,
          balance_after: newBalance,
          description: `Cash released for Order #${activeJob.id.slice(0, 8)}`
        })

      // Update order
      await supabase
        .from('orders')
        .update({
          status: 'cash_approved',
          cash_released: amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', activeJob.id)

      setCashAmount('')
      await loadActiveJob()
      alert('Cash approved! You can now proceed to purchase.')
    } catch (error: any) {
      console.error('Error requesting cash:', error)
      alert('Failed to request cash: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const uploadFile = async (file: File, bucket: string): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file)

    if (uploadError) throw uploadError

    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)
    return data.publicUrl
  }

  const handleMarkPurchased = async () => {
    if (!activeJob || !actualAmount || !receiptFile) {
      alert('Please enter amount and upload receipt')
      return
    }
    setActionLoading(true)

    try {
      const amount = parseFloat(actualAmount)
      
      // Upload receipt
      const receiptUrl = await uploadFile(receiptFile, 'receipts')

      // Get agent wallet
      const { data: wallet } = await supabase
        .from('agent_wallets')
        .select('*')
        .eq('agent_id', agentId)
        .single()

      if (!wallet) throw new Error('Wallet not found')

      // For CPO: Deduct from wallet
      if (activeJob.purchase_type === 'CPO') {
        const newBalance = wallet.company_cash_balance - amount

        await supabase
          .from('agent_wallets')
          .update({ company_cash_balance: newBalance })
          .eq('agent_id', agentId)

        await supabase
          .from('agent_transactions')
          .insert({
            agent_id: agentId,
            order_id: activeJob.id,
            transaction_type: 'purchase_made',
            amount: -amount,
            balance_before: wallet.company_cash_balance,
            balance_after: newBalance,
            description: `Purchase for Order #${activeJob.id.slice(0, 8)}`
          })
      }

      // Update order
      await supabase
        .from('orders')
        .update({
          status: 'purchased',
          actual_amount: amount,
          proof_of_purchase_url: receiptUrl,
          payment_method: activeJob.purchase_type === 'CPO' ? 'company_cash' : selectedPaymentMethod,
          updated_at: new Date().toISOString()
        })
        .eq('id', activeJob.id)

      setActualAmount('')
      setReceiptFile(null)
      await loadActiveJob()
      alert('Purchase confirmed! Now deliver the order.')
    } catch (error: any) {
      console.error('Error marking purchased:', error)
      alert('Failed to mark as purchased: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleMarkOnTheWay = async () => {
    if (!activeJob) return
    setActionLoading(true)

    try {
      await supabase
        .from('orders')
        .update({
          status: 'on_the_way',
          updated_at: new Date().toISOString()
        })
        .eq('id', activeJob.id)

      await loadActiveJob()
    } catch (error: any) {
      console.error('Error updating status:', error)
      alert('Failed to update status: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleMarkDelivered = async () => {
    if (!activeJob) return
    setActionLoading(true)

    try {
      let deliveryPhotoUrl = null
      if (deliveryPhoto) {
        deliveryPhotoUrl = await uploadFile(deliveryPhoto, 'delivery-photos')
      }

      await supabase
        .from('orders')
        .update({
          status: 'delivered',
          delivery_photo_url: deliveryPhotoUrl,
          payment_status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', activeJob.id)

      setDeliveryPhoto(null)
      await loadActiveJob()
      alert('Order delivered successfully! Great job!')
    } catch (error: any) {
      console.error('Error marking delivered:', error)
      alert('Failed to mark as delivered: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const copyAddress = async (text: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        const ta = document.createElement('textarea')
        ta.value = text
        ta.style.position = 'fixed'
        ta.style.left = '-9999px'
        document.body.appendChild(ta)
        ta.focus()
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (e) {
      alert('Failed to copy address')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading active job...</p>
        </div>
      </div>
    )
  }

  if (!activeJob) {
    return (
      <div className="text-center py-12">
        <div className="mb-4 flex items-center justify-center">
          <CheckCircle2 className="w-16 h-16 text-gray-500" />
        </div>
        <h3 className="text-xl font-semibold text-gray-100 mb-2">No Active Job</h3>
        <p className="text-gray-400">Accept a job from the Available Jobs tab to get started</p>
      </div>
    )
  }

  const isCPO = activeJob.purchase_type === 'CPO'
  const isAPO = activeJob.purchase_type === 'APO' || !isCPO

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold text-gray-100 mb-6">My Active Job</h2>

      <div className="bg-gray-900 rounded-lg border border-gray-800 shadow-sm p-6">
        {/* Order Header */}
        <div className="flex justify-between items-start mb-6 pb-6 border-b border-gray-800">
          <div>
            <h3 className="text-2xl font-bold text-gray-100 mb-2">
              Order #{activeJob.id.slice(0, 8).toUpperCase()}
            </h3>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${
              isCPO
                ? 'bg-secondary-900/30 text-secondary-300 border-secondary-700'
                : 'bg-primary-900/30 text-primary-300 border-primary-700'
            }`}>
              {isCPO ? '🔵 CASH PURCHASE (CPO)' : '🟠 ASSISTED PURCHASE (APO)'}
            </span>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Status</p>
            <p className="text-lg font-semibold text-secondary-400 capitalize">
              {activeJob.status.replace('_', ' ')}
            </p>
          </div>
        </div>

        {/* Items List */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-100 mb-3">Items</h4>
          <div className="bg-gray-800 rounded-lg p-4">
            {activeJob.items && activeJob.items.length > 0 ? (
              <ul className="space-y-3">
                {activeJob.items.map((item, idx) => (
                  <li key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {item.product?.image_url ? (
                        <img
                          src={item.product.image_url}
                          alt={item.product_name}
                          className="w-20 h-20 rounded object-cover border border-gray-700"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded bg-gray-700 border border-gray-600 flex items-center justify-center text-sm text-gray-300">
                          IMG
                        </div>
                      )}
                      <span className="text-gray-100">
                        {item.product_name} <span className="text-gray-400">x{item.quantity}</span>
                      </span>
                    </div>
                    <span className="font-medium">R{Number(item.subtotal || 0).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            ) : activeJob.custom_request_text ? (
              <p className="text-gray-100">{activeJob.custom_request_text}</p>
            ) : (
              <p className="text-gray-500">No items listed</p>
            )}
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="flex justify-between font-semibold">
                <span>Estimated Total:</span>
                <span>R{(activeJob.estimated_amount || activeJob.total_amount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Store Details */}
        <div className="mb-6 p-4 bg-secondary-900/20 rounded-lg border border-secondary-700">
          <h4 className="font-semibold text-gray-100 mb-2">Store Details</h4>
          <p className="font-medium text-gray-100">{activeJob.store?.name}</p>
          <p className="text-sm text-gray-400">{activeJob.store?.street_address}</p>
          {activeJob.store?.phone_number && (
            <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
              <Phone className="w-4 h-4" /> {activeJob.store.phone_number}
            </p>
          )}
          {activeJob.store?.open_time && activeJob.store?.close_time && (
            <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
              <Clock className="w-4 h-4" /> {activeJob.store.open_time} - {activeJob.store.close_time}
            </p>
          )}
          {activeJob.store_notes && (
            <p className="text-sm text-yellow-200 mt-2 bg-yellow-900/20 border border-yellow-700 p-2 rounded">
              <strong>Note:</strong> {activeJob.store_notes}
            </p>
          )}
        </div>

        {/* CPO Flow: Step 1 - Request Cash */}
        {isCPO && activeJob.status === 'assigned' && (
          <div className="mb-6 p-6 bg-green-900/20 rounded-lg border border-green-700">
            <h4 className="font-semibold text-gray-100 mb-3">Step 1: Request Cash</h4>
            <p className="text-sm text-gray-400 mb-4">
              Request company cash to make the purchase. This will be added to your wallet.
            </p>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cash Amount (R)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  placeholder="100.00"
                  className="w-full px-4 py-2 border border-gray-700 bg-gray-800 text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500"
                  disabled={actionLoading}
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleRequestCash}
                  disabled={actionLoading || !cashAmount}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                  {actionLoading ? 'Processing...' : 'REQUEST CASH'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CPO Flow: Step 2 - Mark as Purchased */}
        {isCPO && activeJob.status === 'cash_approved' && (
          <div className="mb-6 p-6 bg-secondary-900/20 rounded-lg border border-secondary-700">
            <h4 className="font-semibold text-gray-100 mb-3">Step 2: Purchase Confirmation</h4>
            <p className="text-sm text-gray-400 mb-4">
              After purchasing the items, enter the actual amount spent and upload the receipt.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Amount Spent (R)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={actualAmount}
                  onChange={(e) => setActualAmount(e.target.value)}
                  placeholder="92.50"
                  className="w-full px-4 py-2 border border-gray-700 bg-gray-800 text-gray-100 rounded-lg focus:ring-2 focus:ring-secondary-500"
                  disabled={actionLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Upload Receipt
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border border-gray-700 bg-gray-800 text-gray-100 rounded-lg focus:ring-2 focus:ring-secondary-500"
                  disabled={actionLoading}
                />
                {receiptFile && (
                  <p className="text-sm text-green-400 mt-1">✓ {receiptFile.name}</p>
                )}
              </div>
              <button
                onClick={handleMarkPurchased}
                disabled={actionLoading || !actualAmount || !receiptFile}
                className="w-full px-6 py-3 bg-secondary-500 hover:bg-secondary-600 text-white font-semibold rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Processing...' : 'MARK AS PURCHASED'}
              </button>
            </div>
          </div>
        )}

        {/* APO Flow: Purchase Confirmation */}
        {isAPO && activeJob.status === 'assigned' && (
          <div className="mb-6 p-6 bg-primary-900/20 rounded-lg border border-primary-700">
            <h4 className="font-semibold text-gray-100 mb-3">Purchase Confirmation</h4>
            <p className="text-sm text-gray-400 mb-4">
              Select payment method, enter amount spent, and upload receipt.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Payment Method
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="company_cash"
                      checked={selectedPaymentMethod === 'company_cash'}
                      onChange={(e) => setSelectedPaymentMethod(e.target.value as any)}
                      className="mr-2"
                    />
                    Company Cash
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="company_card"
                      checked={selectedPaymentMethod === 'company_card'}
                      onChange={(e) => setSelectedPaymentMethod(e.target.value as any)}
                      className="mr-2"
                    />
                    Company Card
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Amount Spent (R)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={actualAmount}
                  onChange={(e) => setActualAmount(e.target.value)}
                  placeholder="42.50"
                  className="w-full px-4 py-2 border border-gray-700 bg-gray-800 text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500"
                  disabled={actionLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Upload Receipt
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border border-gray-700 bg-gray-800 text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500"
                  disabled={actionLoading}
                />
                {receiptFile && (
                  <p className="text-sm text-green-400 mt-1">✓ {receiptFile.name}</p>
                )}
              </div>
              <button
                onClick={handleMarkPurchased}
                disabled={actionLoading || !actualAmount || !receiptFile}
                className="w-full px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Processing...' : 'MARK AS PURCHASED'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: On The Way */}
        {activeJob.status === 'purchased' && (
          <div className="mb-6">
            <button
              onClick={handleMarkOnTheWay}
              disabled={actionLoading}
              className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              {actionLoading ? 'Processing...' : (
                <span className="inline-flex items-center gap-2">
                  <Truck className="w-4 h-4" /> MARK AS ON THE WAY
                </span>
              )}
            </button>
          </div>
        )}

        {/* Step 4: Deliver */}
        {activeJob.status === 'on_the_way' && (
          <div className="mb-6 p-6 bg-green-900/20 rounded-lg border border-green-700">
            <h4 className="font-semibold text-gray-100 mb-3">Delivery</h4>
            <p className="text-sm text-gray-400 mb-4">
              Optionally upload a delivery photo, then mark as delivered.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Delivery Photo (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setDeliveryPhoto(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border border-gray-700 bg-gray-800 text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500"
                  disabled={actionLoading}
                />
                {deliveryPhoto && (
                  <p className="text-sm text-green-400 mt-1">✓ {deliveryPhoto.name}</p>
                )}
              </div>
              <button
                onClick={handleMarkDelivered}
                disabled={actionLoading}
                className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Processing...' : (
                  <span className="inline-flex items-center gap-2">
                    <Check className="w-4 h-4" /> MARK AS DELIVERED
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Delivery Address */}
        <div className="mt-6 p-4 bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-100">Delivery Address</h4>
            <button
              type="button"
              onClick={() => copyAddress(`${activeJob.delivery_address || ''}${activeJob.delivery_township ? `, ${activeJob.delivery_township}` : ''}`)}
              className="text-xs text-blue-300 hover:text-blue-200"
            >
              {copied ? 'Copied!' : 'Copy address'}
            </button>
          </div>
          <p className="text-gray-100">{activeJob.delivery_address}</p>
          <p className="text-sm text-gray-400">{activeJob.delivery_township}</p>
        </div>

        {/* Customer Notes */}
        {activeJob.notes && (
          <div className="mt-4 p-4 bg-yellow-900/20 rounded-lg border border-yellow-700">
            <h4 className="font-semibold text-gray-100 mb-2">Customer Notes</h4>
            <p className="text-gray-100">{activeJob.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
