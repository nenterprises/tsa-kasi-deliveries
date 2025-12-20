'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { OrderWithDetails } from '@/types'
import { Inbox } from 'lucide-react'

interface AvailableJobsProps {
  agentId: string
}

export default function AvailableJobs({ agentId }: AvailableJobsProps) {
  const router = useRouter()
  const [jobs, setJobs] = useState<OrderWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    loadAvailableJobs()
    
    // Subscribe to real-time updates
    const subscription = supabase
      .channel('available-jobs')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' },
        () => loadAvailableJobs()
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const loadAvailableJobs = async () => {
    try {
      // Get orders that are pending (not yet assigned to any agent)
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          *,
          store:stores(*),
          items:order_items(*, product:products(image_url,name))
        `)
        .in('status', ['pending'])
        .is('agent_id', null)
        .or('purchase_type.in.(CPO,APO),purchase_type.is.null')
        .order('created_at', { ascending: false })

      if (error) throw error

      setJobs(ordersData || [])
    } catch (error) {
      console.error('Error loading jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptJob = async (orderId: string) => {
    setAccepting(orderId)
    try {
      // Fetch current purchase_type and default to APO if missing
      const { data: orderRow } = await supabase
        .from('orders')
        .select('purchase_type')
        .eq('id', orderId)
        .single()

      const payload: any = {
        agent_id: agentId,
        status: 'assigned',
        updated_at: new Date().toISOString()
      }
      if (!orderRow?.purchase_type) payload.purchase_type = 'APO'

      const { error } = await supabase
        .from('orders')
        .update(payload)
        .eq('id', orderId)
        .is('agent_id', null) // Only accept if not already taken

      if (error) throw error

      // Refresh the list
      await loadAvailableJobs()
      
      // Show success message or redirect
      router.push('/agent?tab=active')
    } catch (error: any) {
      console.error('Error accepting job:', error)
      alert('Failed to accept job. It may have been taken by another agent.')
    } finally {
      setAccepting(null)
    }
  }

  const getPurchaseTypeDisplay = (type?: string) => {
    if (type === 'CPO') return { label: 'CASH PURCHASE', color: 'blue' }
    // Default missing/other to APO for agent flows
    return { label: 'ASSISTED PURCHASE', color: 'orange' }
  }

  const copyAddress = async (orderId: string, text: string) => {
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
      setCopied(orderId)
      setTimeout(() => setCopied(null), 1500)
    } catch (e) {
      alert('Failed to copy address')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading available jobs...</p>
        </div>
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mb-4 flex items-center justify-center">
          <Inbox className="w-16 h-16 text-gray-500" />
        </div>
        <h3 className="text-xl font-semibold text-gray-100 mb-2">No Available Jobs</h3>
        <p className="text-gray-400">Check back soon for new delivery opportunities</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-100 mb-4">
        Available Jobs ({jobs.length})
      </h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => {
          const purchaseType = getPurchaseTypeDisplay(job.purchase_type)
          
          return (
            <div
              key={job.id}
              className="bg-gray-900 rounded-lg border border-gray-800 shadow-sm hover:shadow-md transition-shadow p-6"
            >
              {/* Order Number */}
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-gray-100">
                  Order #{job.id.slice(0, 8).toUpperCase()}
                </h3>
                <span className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-300 border border-gray-700">
                  {purchaseType.label}
                </span>
              </div>

              {/* Order Type Badge */}
              <div className="mb-4">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${
                  purchaseType.color === 'blue' 
                    ? 'bg-secondary-900/30 text-secondary-300 border-secondary-700' 
                    : purchaseType.color === 'orange'
                    ? 'bg-primary-900/30 text-primary-300 border-primary-700'
                    : 'bg-gray-800 text-gray-300 border-gray-700'
                }`}>
                  {purchaseType.label}
                </span>
              </div>

              {/* Store Info */}
              <div className="mb-4">
                <p className="text-sm text-gray-400">Store</p>
                <p className="font-medium text-gray-100">{job.store?.name || 'Unknown Store'}</p>
                <p className="text-sm text-gray-400">{job.store?.street_address}</p>
              </div>

              {/* Delivery Info */}
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-400">Delivery</p>
                  <button
                    type="button"
                    onClick={() => copyAddress(job.id, `${job.delivery_address || ''}${job.delivery_township ? `, ${job.delivery_township}` : ''}`)}
                    className="text-xs text-blue-300 hover:text-blue-200"
                  >
                    {copied === job.id ? 'Copied!' : 'Copy address'}
                  </button>
                </div>
                <p className="font-medium text-gray-100">{job.delivery_address}</p>
                <p className="text-sm text-gray-400 capitalize">{job.delivery_township}</p>
              </div>

              {/* Items */}
              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-1">Items</p>
                {job.items && job.items.length > 0 ? (
                  <div className="space-y-2">
                    {job.items.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        {item.product?.image_url ? (
                          <img
                            src={item.product.image_url}
                            alt={item.product_name}
                            className="w-16 h-16 rounded object-cover border border-gray-700"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded bg-gray-800 border border-gray-700 flex items-center justify-center text-sm text-gray-400">
                            IMG
                          </div>
                        )}
                        <div className="text-sm text-gray-100">
                          {item.product_name} <span className="text-gray-400">x{item.quantity}</span>
                        </div>
                      </div>
                    ))}
                    {job.items.length > 3 && (
                      <p className="text-gray-500">+ {job.items.length - 3} more...</p>
                    )}
                  </div>
                ) : job.custom_request_text ? (
                  <p className="text-sm text-gray-100">{job.custom_request_text}</p>
                ) : (
                  <p className="text-sm text-gray-500">No items specified</p>
                )}
              </div>

              {/* Estimated Amount */}
              <div className="mb-4">
                <p className="text-sm text-gray-400">Estimated Amount</p>
                <p className="text-lg font-bold text-gray-100">
                  R{(job.estimated_amount || job.total_amount || 0).toFixed(2)}
                </p>
              </div>

              {/* Distance (placeholder - would need geolocation calculation) */}
              <div className="mb-4">
                <p className="text-sm text-gray-400">Distance</p>
                <p className="text-sm text-gray-100">{job.distance || '~'}km</p>
              </div>

              {/* Notes */}
              {job.store_notes && (
                <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                  <p className="text-xs text-yellow-200">
                    <strong>Note:</strong> {job.store_notes}
                  </p>
                </div>
              )}

              {/* Accept Button */}
              <button
                onClick={() => handleAcceptJob(job.id)}
                disabled={accepting === job.id}
                className="w-full bg-secondary-500 hover:bg-secondary-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
              >
                {accepting === job.id ? 'Accepting...' : 'ACCEPT JOB'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
