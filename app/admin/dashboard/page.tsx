'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Store, Package, Bike, Wallet, MapPin, ClipboardList, UserCog } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStores: 0,
    activeOrders: 0,
    totalAgents: 0,
    todayRevenue: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      // Get total stores
      const { count: storesCount } = await supabase
        .from('stores')
        .select('*', { count: 'exact', head: true })

      // Get active orders
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'received', 'purchased', 'on_the_way'])

      // Get total agents (drivers)
      const { count: agentsCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'driver')

      // Get today's revenue
      const today = new Date().toISOString().split('T')[0]
      const { data: todayOrders } = await supabase
        .from('orders')
        .select('total_amount')
        .gte('created_at', today)
        .eq('payment_status', 'paid')

      const revenue = todayOrders?.reduce((sum, order) => sum + parseFloat(order.total_amount || '0'), 0) || 0

      setStats({
        totalStores: storesCount || 0,
        activeOrders: ordersCount || 0,
        totalAgents: agentsCount || 0,
        todayRevenue: revenue
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      name: 'Total Stores',
      value: stats.totalStores,
      icon: Store,
      iconBg: 'bg-gradient-to-br from-kasi-blue to-blue-600',
      textColor: 'text-white',
      cardBorder: 'border-kasi-blue/30'
    },
    {
      name: 'Active Orders',
      value: stats.activeOrders,
      icon: Package,
      iconBg: 'bg-gradient-to-br from-kasi-orange to-orange-600',
      textColor: 'text-white',
      cardBorder: 'border-kasi-orange/30'
    },
    {
      name: 'Active Agents',
      value: stats.totalAgents,
      icon: Bike,
      iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
      textColor: 'text-white',
      cardBorder: 'border-emerald-500/30'
    },
    {
      name: "Today's Revenue",
      value: `R${stats.todayRevenue.toFixed(2)}`,
      icon: Wallet,
      iconBg: 'bg-gradient-to-br from-amber-500 to-yellow-600',
      textColor: 'text-white',
      cardBorder: 'border-amber-500/30'
    }
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">Welcome to Tsa Kasi Deliveries Admin Portal</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className={`bg-gray-900 border ${stat.cardBorder} rounded-lg p-5 hover:scale-[1.02] transition-transform`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-lg ${stat.iconBg} shadow-lg`}> 
                  <Icon className={stat.textColor} size={22} />
                </div>
              </div>
              <p className="text-gray-400 text-sm">{stat.name}</p>
              <p className="text-2xl font-bold text-white mt-1">
                {loading ? '...' : stat.value}
              </p>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
        <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <a
            href="/admin/stores"
            className="flex items-center justify-center px-5 py-4 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition border border-gray-700"
          >
            <MapPin size={20} className="mr-2 text-kasi-blue" />
            <span className="font-semibold">Manage Stores</span>
          </a>
          <a
            href="/admin/orders"
            className="flex items-center justify-center px-5 py-4 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition border border-gray-700"
          >
            <ClipboardList size={20} className="mr-2 text-kasi-orange" />
            <span className="font-semibold">View Orders</span>
          </a>
          <a
            href="/admin/agents"
            className="flex items-center justify-center px-5 py-4 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition border border-gray-700"
          >
            <UserCog size={20} className="mr-2 text-kasi-blue" />
            <span className="font-semibold">Manage Agents</span>
          </a>
        </div>
      </div>
    </div>
  )
}
