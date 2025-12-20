'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type StatBuckets = {
  total: number
  byStatus: Record<string, number>
  revenue: number
  avgMinutesToDeliver: number | null
}

const STAT_STATUSES = ['pending','assigned','purchased','on_the_way','delivered','cancelled']

export default function OrdersPage() {
  const [loading, setLoading] = useState(true)
  const [allTime, setAllTime] = useState<StatBuckets>({ total: 0, byStatus: {}, revenue: 0, avgMinutesToDeliver: null })
  const [last7d, setLast7d] = useState<StatBuckets>({ total: 0, byStatus: {}, revenue: 0, avgMinutesToDeliver: null })
  const [today, setToday] = useState<StatBuckets>({ total: 0, byStatus: {}, revenue: 0, avgMinutesToDeliver: null })
  const [activeOrders, setActiveOrders] = useState<any[]>([])
  const [historyOrders, setHistoryOrders] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyPage, setHistoryPage] = useState(0)
  const [hasMoreHistory, setHasMoreHistory] = useState(true)
  const HISTORY_PAGE_SIZE = 20

  useEffect(() => {
    const load = async () => {
      try {
        const startOfToday = new Date(); startOfToday.setHours(0,0,0,0)
        const start7d = new Date(); start7d.setDate(start7d.getDate()-7); start7d.setHours(0,0,0,0)

        // Base fetch for last 7d and today (client aggregates)
        const { data: last7Data } = await supabase
          .from('orders')
          .select('id,status,total_amount,delivery_fee,created_at,updated_at')
          .gte('created_at', start7d.toISOString())

        const { data: todayData } = await supabase
          .from('orders')
          .select('id,status,total_amount,delivery_fee,created_at,updated_at')
          .gte('created_at', startOfToday.toISOString())

        const { data: allData } = await supabase
          .from('orders')
          .select('id,status,total_amount,delivery_fee,created_at,updated_at')

        const { data: activeRows, error: activeErr } = await supabase
          .from('orders')
          .select(`
            *,
            store:stores(*)
          `)
          .order('created_at', { ascending: false })
          .not('status', 'in', '(delivered,cancelled)')
          .limit(50)
        if (activeErr) {
          console.error('Active orders fetch error:', activeErr)
        }

        // Fetch delivered orders for history (initial page)
        const { data: historyRows, error: historyErr } = await supabase
          .from('orders')
          .select(`
            *,
            store:stores(*)
          `)
          .eq('status', 'delivered')
          .order('updated_at', { ascending: false })
          .range(0, 19)

        if (historyErr) {
          console.error('History orders fetch error:', historyErr)
        }

        const agg = (rows: any[] | null): StatBuckets => {
          const r: StatBuckets = { total: 0, byStatus: {}, revenue: 0, avgMinutesToDeliver: null }
          if (!rows || rows.length === 0) return r
          r.total = rows.length
          for (const s of STAT_STATUSES) r.byStatus[s] = 0
          let deliveredCount = 0
          let totalMinutes = 0
          rows.forEach(o => {
            const key = (o.status === 'received') ? 'assigned' : (o.status === 'cash_approved' || o.status === 'cash_requested') ? 'assigned' : o.status
            r.byStatus[key] = (r.byStatus[key] || 0) + 1
            if (key === 'delivered') {
              const created = new Date(o.created_at).getTime()
              const updated = new Date(o.updated_at).getTime()
              const minutes = Math.max(0, (updated - created) / 60000)
              totalMinutes += minutes
              deliveredCount += 1
              const total = Number(o.total_amount || 0) + Number(o.delivery_fee || 0)
              r.revenue += total
            }
          })
          if (deliveredCount > 0) r.avgMinutesToDeliver = Math.round((totalMinutes / deliveredCount) * 10) / 10
          r.revenue = Math.round(r.revenue * 100) / 100
          return r
        }

        setLast7d(agg(last7Data))
        setToday(agg(todayData))
        setAllTime(agg(allData))
        setActiveOrders(activeRows || [])
        setHistoryOrders(historyRows || [])
        setHasMoreHistory((historyRows?.length || 0) >= 20)
      } finally {
        setLoading(false)
      }
    }
    load()

    // Realtime updates for progress
    const channel = supabase
      .channel('admin-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, load)
      .subscribe()

    return () => { channel.unsubscribe() }
  }, [])

  const loadMoreHistory = async () => {
    if (historyLoading || !hasMoreHistory) return
    setHistoryLoading(true)
    try {
      const nextPage = historyPage + 1
      const from = nextPage * HISTORY_PAGE_SIZE
      const to = from + HISTORY_PAGE_SIZE - 1

      const { data: moreHistory } = await supabase
        .from('orders')
        .select(`
          *,
          store:stores(*)
        `)
        .eq('status', 'delivered')
        .order('updated_at', { ascending: false })
        .range(from, to)

      if (moreHistory && moreHistory.length > 0) {
        setHistoryOrders(prev => [...prev, ...moreHistory])
        setHistoryPage(nextPage)
        setHasMoreHistory(moreHistory.length >= HISTORY_PAGE_SIZE)
      } else {
        setHasMoreHistory(false)
      }
    } finally {
      setHistoryLoading(false)
    }
  }

  const StatCard = ({ title, value, sub }: { title: string, value: string | number, sub?: string }) => (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <p className="text-gray-400 text-sm">{title}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Orders</h1>
        <p className="text-gray-400 mt-1">Live stats and recent performance</p>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard title="Orders Today" value={loading ? '—' : today.total} sub={`Delivered: ${today.byStatus.delivered || 0}`} />
        <StatCard title="Orders Last 7 Days" value={loading ? '—' : last7d.total} sub={`Delivered: ${last7d.byStatus.delivered || 0}`} />
        <StatCard title="All-Time Orders" value={loading ? '—' : allTime.total} sub={`Delivered: ${allTime.byStatus.delivered || 0}`} />
      </div>

      {/* Revenue & SLA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard title="Revenue Today" value={loading ? '—' : `R${today.revenue.toFixed(2)}`} />
        <StatCard title="Revenue 7 Days" value={loading ? '—' : `R${last7d.revenue.toFixed(2)}`} />
        <StatCard title="Avg Delivery Time (7d)" value={loading ? '—' : (last7d.avgMinutesToDeliver ? `${last7d.avgMinutesToDeliver}m` : '—')} />
      </div>

      {/* Status Breakdown (7d) */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Status Breakdown (Last 7 Days)</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {STAT_STATUSES.map(s => (
            <div key={s} className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-400 capitalize">{s.replace('_',' ')}</p>
              <p className="text-xl font-bold text-white">{loading ? '—' : (last7d.byStatus[s] || 0)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Active Orders with Tracking */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mt-6">
        <h3 className="text-lg font-semibold text-white mb-4">Active Orders</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400">
                <th className="py-2 pr-4">Order</th>
                <th className="py-2 pr-4">Store</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Address</th>
                <th className="py-2 pr-4">Customer</th>
                <th className="py-2 pr-4">Agent</th>
                <th className="py-2 pr-4">Progress</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Total</th>
                <th className="py-2 pr-4">Created</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeOrders.map((o) => {
                const steps = ['pending','assigned','purchased','on_the_way','delivered']
                const normalize = (s: string) => s === 'received' || s === 'cash_approved' || s === 'cash_requested' ? 'assigned' : s
                const cur = normalize(o.status)
                const idx = steps.indexOf(cur)
                const pct = `${Math.max(0, idx) / (steps.length - 1) * 100}%`
                const total = Number(o.total_amount || 0) + Number(o.delivery_fee || 0)
                const pt = (o.purchase_type as string | null)
                const typeLabel = pt === 'CPO' ? 'CPO' : pt === 'APO' ? 'APO' : 'APO'
                const typeClass = pt === 'CPO'
                  ? 'bg-secondary-900/30 text-secondary-300 border-secondary-700'
                  : 'bg-primary-900/30 text-primary-300 border-primary-700'
                return (
                  <tr key={o.id} className="border-t border-gray-800">
                    <td className="py-3 pr-4 text-white">#{String(o.id).slice(0,8)}</td>
                    <td className="py-3 pr-4 text-gray-300">{o.store?.name || '—'}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold border ${typeClass}`}>
                        {typeLabel}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-gray-400">{o.delivery_address}, {o.delivery_township}</td>
                    <td className="py-3 pr-4 text-gray-300">{o.customer?.full_name || '—'}</td>
                    <td className="py-3 pr-4 text-gray-300">{o.agent?.full_name || '—'}</td>
                    <td className="py-3 pr-4">
                      <div className="relative w-40">
                        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 bg-gray-700" />
                        <div className="absolute top-1/2 -translate-y-1/2 left-0 h-1 bg-kasi-orange" style={{ width: pct }} />
                        <div className="flex justify-between relative">
                          {steps.map((s, i) => (
                            <span key={s} className={`w-3 h-3 rounded-full ${i <= idx ? 'bg-kasi-orange' : 'bg-gray-600'}`} />
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-gray-300 capitalize">{cur.replace('_',' ')}</td>
                    <td className="py-3 pr-4 text-white">R{total.toFixed(2)}</td>
                    <td className="py-3 pr-4 text-gray-400">{new Date(o.created_at).toLocaleString()}</td>
                    <td className="py-3 pr-4">
                      <Link href={`/admin/orders/${o.id}`} className="text-kasi-blue hover:opacity-90">View</Link>
                    </td>
                  </tr>
                )
              })}
              {activeOrders.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-6 text-center text-gray-500">No active orders</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Orders History */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Orders History</h3>
            <p className="text-sm text-gray-400">Successfully delivered orders</p>
          </div>
          <span className="text-sm text-gray-500">{historyOrders.length} orders shown</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400">
                <th className="py-2 pr-4">Order</th>
                <th className="py-2 pr-4">Store</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Address</th>
                <th className="py-2 pr-4">Total</th>
                <th className="py-2 pr-4">Created</th>
                <th className="py-2 pr-4">Delivered</th>
                <th className="py-2 pr-4">Duration</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {historyOrders.map((o) => {
                const total = Number(o.total_amount || 0) + Number(o.delivery_fee || 0)
                const pt = (o.purchase_type as string | null)
                const typeLabel = pt === 'CPO' ? 'CPO' : pt === 'APO' ? 'APO' : 'APO'
                const typeClass = pt === 'CPO'
                  ? 'bg-secondary-900/30 text-secondary-300 border-secondary-700'
                  : 'bg-primary-900/30 text-primary-300 border-primary-700'
                const created = new Date(o.created_at)
                const delivered = new Date(o.updated_at)
                const durationMins = Math.round((delivered.getTime() - created.getTime()) / 60000)
                const durationStr = durationMins < 60 
                  ? `${durationMins}m` 
                  : `${Math.floor(durationMins / 60)}h ${durationMins % 60}m`
                return (
                  <tr key={o.id} className="border-t border-gray-800">
                    <td className="py-3 pr-4 text-white">#{String(o.id).slice(0,8)}</td>
                    <td className="py-3 pr-4 text-gray-300">{o.store?.name || '—'}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold border ${typeClass}`}>
                        {typeLabel}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-gray-400">{o.delivery_address}, {o.delivery_township}</td>
                    <td className="py-3 pr-4 text-white">R{total.toFixed(2)}</td>
                    <td className="py-3 pr-4 text-gray-400">{created.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="py-3 pr-4 text-green-400">{delivered.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="py-3 pr-4 text-gray-300">{durationStr}</td>
                    <td className="py-3 pr-4">
                      <Link href={`/admin/orders/${o.id}`} className="text-kasi-blue hover:opacity-90">View</Link>
                    </td>
                  </tr>
                )
              })}
              {historyOrders.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-gray-500">No delivered orders yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {hasMoreHistory && historyOrders.length > 0 && (
          <div className="mt-4 text-center">
            <button
              onClick={loadMoreHistory}
              disabled={historyLoading}
              className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {historyLoading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
