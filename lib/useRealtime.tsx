'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface ToastProps {
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  duration?: number
}

export function useToast() {
  const [toasts, setToasts] = useState<(ToastProps & { id: number })[]>([])

  const showToast = ({ message, type, duration = 3000 }: ToastProps) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type, duration }])
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }

  return { toasts, showToast }
}

export function ToastContainer({ toasts }: { toasts: (ToastProps & { id: number })[] }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-lg shadow-lg animate-slide-in-right ${
            toast.type === 'success' ? 'bg-green-600 text-white' :
            toast.type === 'error' ? 'bg-red-600 text-white' :
            toast.type === 'warning' ? 'bg-yellow-600 text-white' :
            'bg-blue-600 text-white'
          }`}
        >
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
      ))}
    </div>
  )
}

// Real-time order updates hook
export function useOrderUpdates(orderId: string | null, onUpdate: (order: any) => void) {
  useEffect(() => {
    if (!orderId) return

    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        (payload) => {
          onUpdate(payload.new)
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [orderId, onUpdate])
}

// Real-time orders list hook
export function useOrdersListUpdates(userId: string | null, userType: 'customer' | 'agent' | 'store', onUpdate: () => void) {
  useEffect(() => {
    if (!userId) return

    const filterMap = {
      customer: `customer_id=eq.${userId}`,
      agent: `agent_id=eq.${userId}`,
      store: `store_id=eq.${userId}`
    }

    const channel = supabase
      .channel(`orders-list-${userType}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: filterMap[userType]
        },
        () => {
          onUpdate()
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [userId, userType, onUpdate])
}
