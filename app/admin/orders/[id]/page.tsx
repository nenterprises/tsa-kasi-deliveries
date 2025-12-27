"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function AdminOrderDetail({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<any | null>(null)
  const [customer, setCustomer] = useState<any | null>(null)
  const [agent, setAgent] = useState<any | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const paramId = params.id

        // Try exact UUID first
        let { data, error } = await supabase
          .from('orders')
          .select(`*, store:stores(*), items:order_items(*, product:products(image_url,name))`)
          .eq('id', paramId)
          .single()

        // Fallback: support short ID (first 8 chars) by scanning recent orders
        if ((error || !data) && paramId.length <= 8) {
          const { data: list } = await supabase
            .from('orders')
            .select('id')
            .order('created_at', { ascending: false })
            .limit(200)

          const match = (list || []).find(o => String(o.id).startsWith(paramId))
          if (match) {
            const { data: full } = await supabase
              .from('orders')
              .select(`*, store:stores(*), items:order_items(*, product:products(image_url,name))`)
              .eq('id', match.id)
              .single()
            data = full || null
          }
        }

        if (data) {
          setOrder(data)
          // Fetch related profiles separately to avoid fragile relationship aliases
          if (data.customer_id) {
            const { data: cust } = await supabase
              .from('users')
              .select('id, full_name, phone_number')
              .eq('id', data.customer_id)
              .single()
            setCustomer(cust || null)
          } else {
            setCustomer(null)
          }
          if (data.agent_id) {
            const { data: ag } = await supabase
              .from('users')
              .select('id, full_name, phone_number')
              .eq('id', data.agent_id)
              .single()
            setAgent(ag || null)
          } else {
            setAgent(null)
          }
        } else {
          setOrder(null)
          setCustomer(null)
          setAgent(null)
        }
      } finally {
        setLoading(false)
      }
    }

    load()

    // Basic realtime: reload on any order change
    const channel = supabase
      .channel('admin-order-detail')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, load)
      .subscribe()

    return () => { channel.unsubscribe() }
  }, [params.id])

  const normalize = (s: string) => (s === 'received') ? 'assigned' : s

  if (loading) {
    return (
      <div className="min-h-screen bg-kasi-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kasi-blue mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading order...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-kasi-black">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <Link href="/admin/orders" className="text-kasi-blue">← Back to Orders</Link>
          <div className="mt-6 bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-300">Order not found</p>
          </div>
        </div>
      </div>
    )
  }

  const steps = ['pending','assigned','picked_up','on_the_way','delivered']
  const cur = normalize(order.status)
  const idx = steps.indexOf(cur)
  const pct = `${Math.max(0, idx) / (steps.length - 1) * 100}%`
  const total = Number(order.total_amount || 0) + Number(order.delivery_fee || 0)

  return (
    <div className="min-h-screen bg-kasi-black">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Order #{String(order.id).slice(0,8)}</h1>
            <p className="text-gray-400">{new Date(order.created_at).toLocaleString()}</p>
          </div>
          <Link href="/admin/orders" className="text-kasi-blue">← Back to Orders</Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-400">Store</p>
                  <p className="font-semibold text-white">{order.store?.name || '—'}</p>
                  <p className="text-sm text-gray-400">{order.store?.street_address}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Status</p>
                  <p className="font-semibold text-white capitalize">{cur.replace('_',' ')}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Delivery</p>
                  <p className="font-medium text-white">{order.delivery_address}</p>
                  <p className="text-sm text-gray-400">{order.delivery_township}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Customer</p>
                  <p className="font-medium text-white">{customer?.full_name || '—'}</p>
                  {customer?.phone_number && (
                    <p className="text-sm text-gray-400">📞 {customer.phone_number}</p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm text-gray-400">Agent</p>
                <p className="font-medium text-white">{agent?.full_name || 'Unassigned'}</p>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h3 className="font-semibold text-white mb-3">Tracking</h3>
              <div className="relative">
                <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 bg-gray-700" />
                <div className="absolute top-1/2 -translate-y-1/2 left-0 h-1 bg-kasi-orange" style={{ width: pct }} />
                <div className="flex justify-between relative">
                  {steps.map((s, i) => (
                    <span key={s} className={`w-4 h-4 rounded-full ${i <= idx ? 'bg-kasi-orange' : 'bg-gray-600'}`} />
                  ))}
                </div>
                <div className="flex justify-between mt-3">
                  {steps.map((s) => (
                    <span key={s} className="text-xs text-gray-400 capitalize">{s.replace('_',' ')}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h3 className="font-semibold text-white mb-3">Items</h3>
              {order.items && order.items.length > 0 ? (
                <div className="space-y-3">
                  {order.items.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        {item.product?.image_url ? (
                          <img
                            src={item.product.image_url}
                            alt={item.product_name}
                            className="w-16 h-16 rounded object-cover border border-gray-700"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded bg-gray-800 border border-gray-700 flex items-center justify-center text-xs text-gray-400">
                            IMG
                          </div>
                        )}
                        <span className="text-gray-300">{item.quantity}x {item.product_name}</span>
                      </div>
                      <span className="text-white">R{Number(item.subtotal || 0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No items</p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h3 className="font-semibold text-white mb-3">Summary</h3>
              <div className="space-y-1">
                <div className="flex justify-between text-sm text-gray-300">
                  <span>Subtotal</span>
                  <span>R{Number(order.total_amount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-300">
                  <span>Delivery Fee</span>
                  <span>R{Number(order.delivery_fee || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-white pt-2 border-t border-gray-700">
                  <span>Total</span>
                  <span>R{total.toFixed(2)}</span>
                </div>
              </div>
              {order.proof_of_purchase_url && (
                <div className="mt-4">
                  <a href={order.proof_of_purchase_url} target="_blank" rel="noopener noreferrer" className="text-kasi-blue">
                    📄 View Proof of Purchase
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}