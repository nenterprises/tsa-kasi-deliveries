'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Store, Package, Bike, Wallet, MapPin, ClipboardList, UserCog, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStores: 0,
    activeOrders: 0,
    pendingOrders: 0,
    completedToday: 0,
    totalAgents: 0,
    onlineAgents: 0,
    todayRevenue: 0,
    weekRevenue: 0
  })
  const [loading, setLoading] = useState(true)
  const [recentOrders, setRecentOrders] = useState<any[]>([])

  useEffect(() => {
    loadStats()
    loadRecentOrders()
    
    // Real-time updates
    const channel = supabase
      .channel('admin-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadStats()
        loadRecentOrders()
      })
      .subscribe()

    return () => { channel.unsubscribe() }
  }, [])

  const loadStats = async () => {
    try {
      // Get total stores
      const { count: storesCount } = await supabase
        .from('stores')
        .select('*', { count: 'exact', head: true })

      // Get pending orders
      const { count: pendingCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      // Get active orders (in progress)
      const { count: activeCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['assigned', 'picked_up', 'on_the_way'])

      // Get completed today
      const today = new Date().toISOString().split('T')[0]
      const { count: completedCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'delivered')
        .gte('updated_at', today)

      // Get total agents (drivers)
      const { count: agentsCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'driver')

      // Get online agents
      const { count: onlineCount } = await supabase
        .from('agent_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_online', true)

      // Get today's revenue
      const { data: todayOrders } = await supabase
        .from('orders')
        .select('total_amount, delivery_fee')
        .gte('created_at', today)
        .eq('status', 'delivered')

      const todayRev = todayOrders?.reduce((sum, order) => 
        sum + parseFloat(order.total_amount || '0') + (order.delivery_fee || 0), 0) || 0

      // Get week revenue
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const { data: weekOrders } = await supabase
        .from('orders')
        .select('total_amount, delivery_fee')
        .gte('created_at', weekAgo.toISOString())
        .eq('status', 'delivered')

      const weekRev = weekOrders?.reduce((sum, order) => 
        sum + parseFloat(order.total_amount || '0') + (order.delivery_fee || 0), 0) || 0

      setStats({
        totalStores: storesCount || 0,
        activeOrders: activeCount || 0,
        pendingOrders: pendingCount || 0,
        completedToday: completedCount || 0,
        totalAgents: agentsCount || 0,
        onlineAgents: onlineCount || 0,
        todayRevenue: todayRev,
        weekRevenue: weekRev
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadRecentOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('id, status, total_amount, delivery_fee, created_at, delivery_address')
      .order('created_at', { ascending: false })
      .limit(5)
    
    setRecentOrders(data || [])
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'assigned': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'picked_up':
      case 'on_the_way': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'delivered': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">Welcome to Tsa Kasi Deliveries Admin Portal</p>
        </div>
        <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full self-start sm:self-auto">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-green-400 text-xs sm:text-sm font-medium">{stats.onlineAgents} Agents Online</span>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Pending Orders */}
        <Link href="/admin/orders?status=pending" className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6 hover:border-yellow-500/50 transition-all hover:scale-[1.02]">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white">{loading ? '...' : stats.pendingOrders}</p>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">Pending Orders</p>
        </Link>

        {/* Active Orders */}
        <Link href="/admin/orders?status=active" className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6 hover:border-blue-500/50 transition-all hover:scale-[1.02]">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Package className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white">{loading ? '...' : stats.activeOrders}</p>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">In Progress</p>
        </Link>

        {/* Completed Today */}
        <Link href="/admin/orders?status=delivered" className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6 hover:border-green-500/50 transition-all hover:scale-[1.02]">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-green-400">{loading ? '...' : stats.completedToday}</p>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">Completed Today</p>
        </Link>

        {/* Today's Revenue */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-secondary-500/20 flex items-center justify-center">
              <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-secondary-400" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-secondary-400">R{loading ? '...' : stats.todayRevenue.toFixed(0)}</p>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">Today's Revenue</p>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Stores */}
        <Link href="/admin/stores" className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 hover:border-secondary-500/50 transition-all hover:scale-[1.02]">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-secondary-500 to-secondary-600 flex items-center justify-center shadow-lg shadow-secondary-500/20">
            <Store className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold text-white">{loading ? '...' : stats.totalStores}</p>
            <p className="text-gray-400 text-xs sm:text-sm">Active Stores</p>
          </div>
        </Link>

        {/* Agents */}
        <Link href="/admin/agents" className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 hover:border-secondary-500/50 transition-all hover:scale-[1.02]">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Bike className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold text-white">{loading ? '...' : stats.totalAgents}</p>
            <p className="text-gray-400 text-xs sm:text-sm">Total Agents</p>
          </div>
        </Link>

        {/* Week Revenue */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold text-white">R{loading ? '...' : stats.weekRevenue.toFixed(0)}</p>
            <p className="text-gray-400 text-xs sm:text-sm">This Week</p>
          </div>
        </div>
      </div>

      {/* Quick Actions & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Quick Actions */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-2 sm:gap-3">
            <Link
              href="/admin/stores"
              className="flex items-center p-3 sm:p-4 bg-gray-800 rounded-xl hover:bg-gray-700 transition border border-gray-700 hover:border-secondary-500/50"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-secondary-500/20 flex items-center justify-center mr-3 sm:mr-4">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-secondary-400" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-white text-sm sm:text-base">Manage Stores</span>
                <p className="text-xs sm:text-sm text-gray-400 truncate">Add or edit store listings</p>
              </div>
            </Link>
            
            <Link
              href="/admin/orders"
              className="flex items-center p-3 sm:p-4 bg-gray-800 rounded-xl hover:bg-gray-700 transition border border-gray-700 hover:border-secondary-500/50"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-blue-500/20 flex items-center justify-center mr-3 sm:mr-4">
                <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-white text-sm sm:text-base">View All Orders</span>
                <p className="text-xs sm:text-sm text-gray-400 truncate">Monitor and manage orders</p>
              </div>
            </Link>
            
            <Link
              href="/admin/agents"
              className="flex items-center p-3 sm:p-4 bg-gray-800 rounded-xl hover:bg-gray-700 transition border border-gray-700 hover:border-secondary-500/50"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-green-500/20 flex items-center justify-center mr-3 sm:mr-4">
                <UserCog className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-white text-sm sm:text-base">Manage Agents</span>
                <p className="text-xs sm:text-sm text-gray-400 truncate">View agent status and performance</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-white">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs sm:text-sm text-secondary-400 hover:text-secondary-300">
              View All →
            </Link>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {recentOrders.length === 0 ? (
              <p className="text-gray-400 text-center py-6 sm:py-8 text-sm">No orders yet</p>
            ) : (
              recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="flex items-center justify-between p-2.5 sm:p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-xs sm:text-sm truncate">
                      {order.delivery_address || 'No address'}
                    </p>
                    <p className="text-gray-400 text-[10px] sm:text-xs">
                      {new Date(order.created_at).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <span className="text-secondary-400 font-semibold text-xs sm:text-sm">
                      R{(parseFloat(order.total_amount || '0') + (order.delivery_fee || 0)).toFixed(0)}
                    </span>
                    <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
