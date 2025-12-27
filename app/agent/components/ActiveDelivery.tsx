'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { OrderWithDetails } from '@/types'
import { 
  Package, 
  Store, 
  MapPin, 
  Phone, 
  Navigation, 
  CheckCircle2, 
  Camera,
  Clock,
  ChevronRight
} from 'lucide-react'

interface ActiveDeliveryProps {
  agentId: string
}

type DeliveryStep = 'pickup' | 'deliver'

export default function ActiveDelivery({ agentId }: ActiveDeliveryProps) {
  const [activeJob, setActiveJob] = useState<OrderWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState<DeliveryStep>('pickup')
  const [copied, setCopied] = useState(false)
  const [deliveryPhoto, setDeliveryPhoto] = useState<File | null>(null)

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
      
      const job = (data && data[0]) || null
      setActiveJob(job)
      
      // Determine current step based on status
      if (job) {
        if (job.status === 'assigned' || job.status === 'pending') {
          setCurrentStep('pickup')
        } else {
          setCurrentStep('deliver')
        }
      }
    } catch (error) {
      console.error('Error loading active job:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePickedUp = async () => {
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

      setCurrentStep('deliver')
      await loadActiveJob()
    } catch (error: any) {
      console.error('Error marking picked up:', error)
      alert('Failed to update status: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelivered = async () => {
    if (!activeJob) return
    setActionLoading(true)

    try {
      let deliveryPhotoUrl = null
      if (deliveryPhoto) {
        deliveryPhotoUrl = await uploadFile(deliveryPhoto)
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
      alert('🎉 Delivery complete! Earnings added to your account.')
    } catch (error: any) {
      console.error('Error marking delivered:', error)
      alert('Failed to mark as delivered: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    
    const { error: uploadError } = await supabase.storage
      .from('delivery-photos')
      .upload(fileName, file)

    if (uploadError) throw uploadError

    const { data } = supabase.storage.from('delivery-photos').getPublicUrl(fileName)
    return data.publicUrl
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

  const openInMaps = (address: string) => {
    const encoded = encodeURIComponent(address)
    window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, '_blank')
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!activeJob) {
    return (
      <div className="text-center py-12">
        <div className="mb-4 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-gray-500" />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-gray-100 mb-2">No Active Delivery</h3>
        <p className="text-gray-400">Accept a job to get started</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Progress Steps */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-2 ${currentStep === 'pickup' ? 'text-secondary-400' : 'text-green-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === 'pickup' ? 'bg-secondary-500' : 'bg-green-500'
            }`}>
              {currentStep === 'pickup' ? '1' : <CheckCircle2 className="w-5 h-5" />}
            </div>
            <span className="font-medium">Pickup</span>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-600" />
          <div className={`flex items-center gap-2 ${currentStep === 'deliver' ? 'text-secondary-400' : 'text-gray-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === 'deliver' ? 'bg-secondary-500' : 'bg-gray-700'
            }`}>
              2
            </div>
            <span className="font-medium">Deliver</span>
          </div>
        </div>
      </div>

      {/* Order Info Card */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="bg-gray-800/50 px-4 py-3 border-b border-gray-800">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-white">
              Order #{activeJob.id.slice(0, 8).toUpperCase()}
            </span>
            <span className="text-sm text-green-400 font-medium">
              +R{(activeJob.delivery_fee || 15).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Order Summary */}
        <div className="p-4 border-b border-gray-800">
          <h4 className="text-sm text-gray-500 uppercase tracking-wide mb-2">Order Summary</h4>
          <div className="space-y-2">
            {activeJob.items && activeJob.items.length > 0 ? (
              activeJob.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-gray-300">
                    {item.quantity}x {item.product_name}
                  </span>
                  <span className="text-gray-400">R{Number(item.subtotal || 0).toFixed(2)}</span>
                </div>
              ))
            ) : activeJob.custom_request_text ? (
              <p className="text-gray-300 text-sm">{activeJob.custom_request_text}</p>
            ) : (
              <p className="text-gray-500 text-sm">No items specified</p>
            )}
          </div>
        </div>

        {/* Pickup Section */}
        {currentStep === 'pickup' && (
          <div className="p-4 bg-secondary-900/20 border-b border-gray-800">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-secondary-500/30 flex items-center justify-center flex-shrink-0">
                <Store className="w-5 h-5 text-secondary-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-secondary-400 uppercase tracking-wide">Pickup Location</p>
                <p className="font-semibold text-white">{activeJob.store?.name}</p>
                <p className="text-sm text-gray-400">{activeJob.store?.street_address}</p>
              </div>
            </div>

            {/* Store Contact & Directions */}
            <div className="flex gap-2 mb-4">
              {activeJob.store?.phone_number && (
                <a
                  href={`tel:${activeJob.store.phone_number}`}
                  className="flex-1 py-2 px-3 bg-gray-800 rounded-lg text-gray-300 text-sm flex items-center justify-center gap-2 hover:bg-gray-700"
                >
                  <Phone className="w-4 h-4" />
                  Call Store
                </a>
              )}
              <button
                onClick={() => openInMaps(activeJob.store?.street_address || '')}
                className="flex-1 py-2 px-3 bg-gray-800 rounded-lg text-gray-300 text-sm flex items-center justify-center gap-2 hover:bg-gray-700"
              >
                <Navigation className="w-4 h-4" />
                Directions
              </button>
            </div>

            {/* Store Hours */}
            {activeJob.store?.open_time && activeJob.store?.close_time && (
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                <Clock className="w-4 h-4" />
                <span>Hours: {activeJob.store.open_time} - {activeJob.store.close_time}</span>
              </div>
            )}

            {/* Pickup Instructions */}
            {activeJob.store_notes && (
              <div className="p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg mb-4">
                <p className="text-sm text-yellow-200">
                  <strong>Note:</strong> {activeJob.store_notes}
                </p>
              </div>
            )}

            {/* Picked Up Button */}
            <button
              onClick={handlePickedUp}
              disabled={actionLoading}
              className="w-full py-4 bg-secondary-500 hover:bg-secondary-400 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {actionLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Package className="w-5 h-5" />
                  Picked Up
                </>
              )}
            </button>
          </div>
        )}

        {/* Delivery Section */}
        {currentStep === 'deliver' && (
          <div className="p-4 bg-green-900/20">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-500/30 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-green-400 uppercase tracking-wide">Delivery Location</p>
                <p className="font-semibold text-white">{activeJob.delivery_address}</p>
                <p className="text-sm text-gray-400 capitalize">{activeJob.delivery_township}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => copyAddress(`${activeJob.delivery_address}, ${activeJob.delivery_township}`)}
                className="flex-1 py-2 px-3 bg-gray-800 rounded-lg text-gray-300 text-sm flex items-center justify-center gap-2 hover:bg-gray-700"
              >
                {copied ? 'Copied!' : 'Copy Address'}
              </button>
              <button
                onClick={() => openInMaps(`${activeJob.delivery_address}, ${activeJob.delivery_township}`)}
                className="flex-1 py-2 px-3 bg-gray-800 rounded-lg text-gray-300 text-sm flex items-center justify-center gap-2 hover:bg-gray-700"
              >
                <Navigation className="w-4 h-4" />
                Directions
              </button>
            </div>

            {/* Customer Notes */}
            {activeJob.notes && (
              <div className="p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg mb-4">
                <p className="text-sm text-yellow-200">
                  <strong>Customer Note:</strong> {activeJob.notes}
                </p>
              </div>
            )}

            {/* Optional Photo */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">
                <Camera className="w-4 h-4 inline mr-1" />
                Delivery Photo (optional)
              </label>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => setDeliveryPhoto(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-gray-700 file:text-gray-300"
              />
              {deliveryPhoto && (
                <p className="text-sm text-green-400 mt-1">✓ {deliveryPhoto.name}</p>
              )}
            </div>

            {/* Delivered Button */}
            <button
              onClick={handleDelivered}
              disabled={actionLoading}
              className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {actionLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Delivered
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
