'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { OrderWithDetails } from '@/types'
import { Inbox, MapPin, Store, Navigation, Banknote, X, Check } from 'lucide-react'
import { useToast, ToastContainer } from '@/lib/useRealtime'

interface AvailableJobsProps {
  agentId: string
  isOnline: boolean
  onJobAccepted: () => void
}

export default function AvailableJobs({ agentId, isOnline, onJobAccepted }: AvailableJobsProps) {
  const [jobs, setJobs] = useState<OrderWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState<string | null>(null)
  const [declining, setDeclining] = useState<string | null>(null)
  const { toasts, showToast } = useToast()

  useEffect(() => {
    loadAvailableJobs()
    
    // Subscribe to real-time updates
    const subscription = supabase
      .channel('available-jobs')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            showToast('🆕 New delivery job available!', 'success')
          }
          loadAvailableJobs()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [showToast])

  const loadAvailableJobs = async () => {
    try {
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          *,
          store:stores(*),
          items:order_items(*, product:products(image_url,name))
        `)
        .in('status', ['pending'])
        .is('agent_id', null)
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
    if (!isOnline) {
      alert('Please go online to accept jobs')
      return
    }
    
    setAccepting(orderId)
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          agent_id: agentId,
          status: 'assigned',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .is('agent_id', null) // Only accept if not already taken

      if (error) throw error

      // Refresh and navigate
      await loadAvailableJobs()
      onJobAccepted()
    } catch (error: any) {
      console.error('Error accepting job:', error)
      alert('Failed to accept job. It may have been taken by another agent.')
    } finally {
      setAccepting(null)
    }
  }

  const handleDeclineJob = (orderId: string) => {
    // For MVP, just hide the job from this agent's view (no database change)
    // In production, you might track declined jobs
    setDeclining(orderId)
    setTimeout(() => {
      setJobs(prev => prev.filter(j => j.id !== orderId))
      setDeclining(null)
    }, 300)
  }

  if (!isOnline) {
    return (
      <>
        <ToastContainer toasts={toasts} />
        <div className="text-center py-12">
          <div className="mb-4 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
              <Inbox className="w-8 h-8 text-gray-500" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-100 mb-2">You&apos;re Offline</h3>
          <p className="text-gray-400">Go online to see available jobs</p>
        </div>
      </>
    )
  }

  if (loading) {
    return (
      <>
        <ToastContainer toasts={toasts} />
        <div className="flex justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading available jobs...</p>
          </div>
        </div>
      </>
    )
  }

  if (jobs.length === 0) {
    return (
      <>
        <ToastContainer toasts={toasts} />
        <div className="text-center py-12">
          <div className="mb-4 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
              <Inbox className="w-8 h-8 text-gray-500" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-100 mb-2">No Available Jobs</h3>
          <p className="text-gray-400">Check back soon for new delivery opportunities</p>
        </div>
      </>
    )
  }

  return (
    <>
      <ToastContainer toasts={toasts} />
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-100 mb-4">
          Available Jobs ({jobs.length})
        </h2>

      <div className="space-y-4">
        {jobs.map((job) => (
          <div
            key={job.id}
            className={`bg-gray-900 rounded-xl border border-gray-800 shadow-lg overflow-hidden transition-all ${
              declining === job.id ? 'opacity-0 transform scale-95' : ''
            }`}
          >
            {/* Job Header */}
            <div className="bg-gray-800/50 px-4 py-3 border-b border-gray-800">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">
                  Order #{job.id.slice(0, 8).toUpperCase()}
                </span>
                <span className="text-lg font-bold text-green-400">
                  R{(job.delivery_fee || 15).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Store Info - Pickup */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary-500/20 flex items-center justify-center flex-shrink-0">
                  <Store className="w-5 h-5 text-secondary-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Pickup</p>
                  <p className="font-semibold text-white">{job.store?.name || 'Unknown Store'}</p>
                  <p className="text-sm text-gray-400">{job.store?.street_address}</p>
                </div>
              </div>

              {/* Delivery Location */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Drop-off</p>
                  <p className="font-medium text-white">{job.delivery_address}</p>
                  <p className="text-sm text-gray-400 capitalize">{job.delivery_township}</p>
                </div>
              </div>

              {/* Distance & Fee Summary */}
              <div className="flex items-center gap-4 py-3 px-4 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-300">~3km</span>
                </div>
                <div className="h-4 w-px bg-gray-700"></div>
                <div className="flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium text-green-400">
                    R{(job.delivery_fee || 15).toFixed(2)} delivery fee
                  </span>
                </div>
              </div>

              {/* Order Items Preview */}
              <div className="text-sm text-gray-400">
                {job.items && job.items.length > 0 ? (
                  <p>
                    {job.items.length} item{job.items.length > 1 ? 's' : ''} • 
                    R{(job.total_amount || 0).toFixed(2)} order value
                  </p>
                ) : job.custom_request_text ? (
                  <p className="line-clamp-1">{job.custom_request_text}</p>
                ) : (
                  <p>Custom order</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => handleDeclineJob(job.id)}
                  disabled={accepting === job.id}
                  className="flex-1 py-3 px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                  Decline
                </button>
                <button
                  onClick={() => handleAcceptJob(job.id)}
                  disabled={accepting === job.id}
                  className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {accepting === job.id ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Accepting...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Accept
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      </div>
    </>
  )
}
