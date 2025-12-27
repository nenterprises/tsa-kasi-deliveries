'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { OrderWithDetails } from '@/types'
import { DollarSign, TrendingUp, Package, Calendar, ChevronRight } from 'lucide-react'

interface EarningsProps {
  agentId: string
}

interface EarningsSummary {
  totalEarnings: number
  todayEarnings: number
  weekEarnings: number
  deliveriesCompleted: number
  todayDeliveries: number
}

export default function Earnings({ agentId }: EarningsProps) {
  const [summary, setSummary] = useState<EarningsSummary>({
    totalEarnings: 0,
    todayEarnings: 0,
    weekEarnings: 0,
    deliveriesCompleted: 0,
    todayDeliveries: 0
  })
  const [recentDeliveries, setRecentDeliveries] = useState<OrderWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEarnings()
  }, [agentId])

  const loadEarnings = async () => {
    if (!agentId) return
    
    try {
      // Get all delivered orders
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          store:stores(name)
        `)
        .eq('agent_id', agentId)
        .eq('status', 'delivered')
        .order('updated_at', { ascending: false })

      if (error) throw error

      const now = new Date()
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const startOfWeek = new Date(startOfToday)
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())

      let totalEarnings = 0
      let todayEarnings = 0
      let weekEarnings = 0
      let todayDeliveries = 0

      orders?.forEach(order => {
        const fee = order.delivery_fee || 0
        const orderDate = new Date(order.updated_at)
        
        totalEarnings += fee
        
        if (orderDate >= startOfToday) {
          todayEarnings += fee
          todayDeliveries++
        }
        
        if (orderDate >= startOfWeek) {
          weekEarnings += fee
        }
      })

      setSummary({
        totalEarnings,
        todayEarnings,
        weekEarnings,
        deliveriesCompleted: orders?.length || 0,
        todayDeliveries
      })

      setRecentDeliveries(orders?.slice(0, 10) || [])
    } catch (error) {
      console.error('Error loading earnings:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) {
      return date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
    } else if (days === 1) {
      return 'Yesterday'
    } else if (days < 7) {
      return date.toLocaleDateString('en-ZA', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading earnings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main Earnings Card */}
      <div className="bg-gradient-to-br from-green-900/40 to-green-800/20 rounded-2xl border border-green-700/30 p-6">
        <div className="text-center">
          <p className="text-green-400 text-sm font-medium mb-1">Total Earnings</p>
          <p className="text-5xl font-bold text-white mb-2">
            R{summary.totalEarnings.toFixed(2)}
          </p>
          <p className="text-gray-400 text-sm">
            From {summary.deliveriesCompleted} completed deliveries
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-green-400" />
            </div>
            <span className="text-gray-400 text-sm">Today</span>
          </div>
          <p className="text-2xl font-bold text-white">R{summary.todayEarnings.toFixed(2)}</p>
          <p className="text-xs text-gray-500">{summary.todayDeliveries} deliveries</p>
        </div>

        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-secondary-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-secondary-400" />
            </div>
            <span className="text-gray-400 text-sm">This Week</span>
          </div>
          <p className="text-2xl font-bold text-white">R{summary.weekEarnings.toFixed(2)}</p>
        </div>
      </div>

      {/* Recent Deliveries */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800">
          <h3 className="font-semibold text-white">Recent Deliveries</h3>
        </div>
        
        {recentDeliveries.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-3">
              <Package className="w-6 h-6 text-gray-500" />
            </div>
            <p className="text-gray-400">No completed deliveries yet</p>
            <p className="text-gray-500 text-sm mt-1">Start delivering to earn!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {recentDeliveries.map((delivery) => (
              <div key={delivery.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Package className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white text-sm">
                      {delivery.store?.name || 'Store'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(delivery.updated_at)}
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-green-400">
                  +R{(delivery.delivery_fee || 0).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-secondary-900/20 border border-secondary-700/50 rounded-xl p-4">
        <h4 className="font-medium text-secondary-200 mb-2">💰 How Earnings Work</h4>
        <ul className="text-sm text-secondary-200/80 space-y-1">
          <li>• You earn R15-R25 per delivery (varies by distance)</li>
          <li>• Earnings are added immediately after delivery</li>
          <li>• No deductions, no hidden fees</li>
          <li>• Weekly payouts to your bank account</li>
        </ul>
      </div>
    </div>
  )
}
