'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { User } from '@/types'
import AvailableJobs from '@/app/agent/components/AvailableJobs'
import ActiveDelivery from '@/app/agent/components/ActiveDelivery'
import Earnings from '@/app/agent/components/Earnings'
import Profile from '@/app/agent/components/Profile'
import BrandMark from '@/components/BrandMark'
import { Power, Package, DollarSign, User as UserIcon, Briefcase } from 'lucide-react'

type Tab = 'home' | 'jobs' | 'active' | 'earnings' | 'profile'

export default function AgentHomePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [agent, setAgent] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(false)
  const [togglingStatus, setTogglingStatus] = useState(false)
  const [activeJobCount, setActiveJobCount] = useState<number>(0)
  const [availableJobCount, setAvailableJobCount] = useState<number>(0)
  const [totalEarnings, setTotalEarnings] = useState<number>(0)

  useEffect(() => {
    loadAgentData()
  }, [])

  // Read tab from query (?tab=active)
  useEffect(() => {
    const t = searchParams?.get('tab') as Tab | null
    if (t && ['home', 'jobs', 'active', 'earnings', 'profile'].includes(t)) {
      setActiveTab(t)
    }
  }, [searchParams])

  // Load counts
  useEffect(() => {
    if (!agent?.id) return
    const loadCounts = async () => {
      // Active jobs count
      const { count: activeCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agent.id)
        .not('status', 'in', '(delivered,cancelled)')
      setActiveJobCount(activeCount || 0)

      // Available jobs count
      const { count: availableCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending'])
        .is('agent_id', null)
      setAvailableJobCount(availableCount || 0)

      // Total earnings
      const { data: earnings } = await supabase
        .from('orders')
        .select('delivery_fee')
        .eq('agent_id', agent.id)
        .eq('status', 'delivered')
      
      const total = earnings?.reduce((sum, o) => sum + (o.delivery_fee || 0), 0) || 0
      setTotalEarnings(total)
    }
    loadCounts()

    const channel = supabase
      .channel('agent-counts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, loadCounts)
      .subscribe()

    return () => { channel.unsubscribe() }
  }, [agent?.id])

  const loadAgentData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/agent/login')
        return
      }

      // Get agent details
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (userData) {
        setAgent(userData)
        
        // Get agent online status
        const { data: profileData } = await supabase
          .from('agent_profiles')
          .select('is_online')
          .eq('agent_id', userData.id)
          .single()
        
        setIsOnline(profileData?.is_online || false)
      }
    } catch (error) {
      console.error('Error loading agent data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleOnline = async () => {
    if (!agent?.id) return
    setTogglingStatus(true)
    
    try {
      const newStatus = !isOnline
      
      const { error } = await supabase
        .from('agent_profiles')
        .upsert({ 
          agent_id: agent.id,
          is_online: newStatus,
          last_active_at: new Date().toISOString()
        }, { onConflict: 'agent_id' })

      if (error) throw error
      
      setIsOnline(newStatus)
      
      // Auto-navigate to jobs when going online
      if (newStatus && availableJobCount > 0) {
        setActiveTab('jobs')
      }
    } catch (error) {
      console.error('Error toggling status:', error)
      alert('Failed to update status')
    } finally {
      setTogglingStatus(false)
    }
  }

  const handleLogout = async () => {
    // Set offline before logout
    if (agent?.id) {
      await supabase
        .from('agent_profiles')
        .update({ is_online: false })
        .eq('agent_id', agent.id)
    }
    await supabase.auth.signOut()
    router.push('/agent/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-kasi-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-kasi-black pb-20">
      {/* Header */}
      <header className="bg-gray-900/80 backdrop-blur border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4 gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <BrandMark size="sm" />
              <div className="min-w-0">
                <h1 className="text-sm sm:text-lg font-bold text-white">Agent Portal</h1>
                <p className="text-xs sm:text-sm text-gray-400 truncate">{agent?.full_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* Online Status Indicator */}
              <div className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium ${
                isOnline 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-gray-800 text-gray-400 border border-gray-700'
              }`}>
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
                <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {activeTab === 'home' && (
          <div className="space-y-6">
            {/* Go Online/Offline Button */}
            <div className="flex flex-col items-center justify-center py-6 sm:py-8">
              <button
                onClick={handleToggleOnline}
                disabled={togglingStatus}
                className={`w-32 h-32 sm:w-40 sm:h-40 rounded-full flex flex-col items-center justify-center transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl ${
                  isOnline
                    ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-green-500/30'
                    : 'bg-gradient-to-br from-gray-700 to-gray-800 text-gray-300 shadow-gray-900/50 hover:from-secondary-500 hover:to-secondary-600 hover:text-white hover:shadow-secondary-500/30'
                }`}
              >
                <Power className={`w-10 h-10 sm:w-12 sm:h-12 mb-2 ${togglingStatus ? 'animate-pulse' : ''}`} />
                <span className="text-base sm:text-lg font-bold">
                  {togglingStatus ? '...' : isOnline ? 'Go Offline' : 'Go Online'}
                </span>
              </button>
              <p className="mt-4 text-gray-400 text-xs sm:text-sm text-center px-4">
                {isOnline 
                  ? 'You are visible to the system and can receive jobs' 
                  : 'Tap to start accepting delivery jobs'}
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <button
                onClick={() => setActiveTab('jobs')}
                className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6 text-left hover:border-secondary-500 transition-colors"
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-secondary-500/20 flex items-center justify-center">
                    <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-secondary-400" />
                  </div>
                  <span className="text-2xl sm:text-3xl font-bold text-white">{availableJobCount}</span>
                </div>
                <p className="text-gray-400 text-xs sm:text-sm">Available Jobs</p>
              </button>

              <button
                onClick={() => setActiveTab('active')}
                className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6 text-left hover:border-secondary-500 transition-colors"
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Package className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                  </div>
                  <span className="text-2xl sm:text-3xl font-bold text-white">{activeJobCount}</span>
                </div>
                <p className="text-gray-400 text-xs sm:text-sm">Active Deliveries</p>
              </button>

              <button
                onClick={() => setActiveTab('earnings')}
                className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6 text-left hover:border-secondary-500 transition-colors col-span-2"
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                  </div>
                  <span className="text-2xl sm:text-3xl font-bold text-green-400">R{totalEarnings.toFixed(2)}</span>
                </div>
                <p className="text-gray-400 text-xs sm:text-sm">Total Earnings</p>
              </button>
            </div>

            {/* Tips Card */}
            {!isOnline && (
              <div className="bg-secondary-900/20 border border-secondary-700 rounded-xl p-6">
                <h3 className="font-semibold text-secondary-200 mb-3">💡 Ready to earn?</h3>
                <ul className="text-sm text-secondary-200/80 space-y-2">
                  <li>• Tap "Go Online" to start receiving jobs</li>
                  <li>• Accept jobs that work for you</li>
                  <li>• Pick up from store, deliver to customer</li>
                  <li>• Get paid for each delivery!</li>
                </ul>
              </div>
            )}

            {isOnline && availableJobCount > 0 && (
              <div className="bg-green-900/20 border border-green-700 rounded-xl p-6">
                <h3 className="font-semibold text-green-200 mb-2">🎉 Jobs Available!</h3>
                <p className="text-sm text-green-200/80 mb-4">
                  There {availableJobCount === 1 ? 'is' : 'are'} {availableJobCount} job{availableJobCount > 1 ? 's' : ''} waiting for you.
                </p>
                <button
                  onClick={() => setActiveTab('jobs')}
                  className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-colors"
                >
                  View Available Jobs
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'jobs' && <AvailableJobs agentId={agent?.id || ''} isOnline={isOnline} onJobAccepted={() => setActiveTab('active')} />}
        {activeTab === 'active' && <ActiveDelivery agentId={agent?.id || ''} />}
        {activeTab === 'earnings' && <Earnings agentId={agent?.id || ''} />}
        {activeTab === 'profile' && <Profile agentId={agent?.id || ''} agent={agent} onUpdate={loadAgentData} />}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-20 safe-area-pb">
        <div className="max-w-lg mx-auto flex justify-around">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center py-2 sm:py-3 px-2 sm:px-4 transition-colors ${
              activeTab === 'home' ? 'text-secondary-400' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Power className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-[10px] sm:text-xs mt-1">Home</span>
          </button>
          
          <button
            onClick={() => setActiveTab('jobs')}
            className={`flex flex-col items-center py-2 sm:py-3 px-2 sm:px-4 transition-colors relative ${
              activeTab === 'jobs' ? 'text-secondary-400' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Briefcase className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-[10px] sm:text-xs mt-1">Jobs</span>
            {availableJobCount > 0 && (
              <span className="absolute top-1 sm:top-2 right-0 sm:right-2 w-4 h-4 sm:w-5 sm:h-5 bg-secondary-500 text-white text-[10px] sm:text-xs rounded-full flex items-center justify-center">
                {availableJobCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('active')}
            className={`flex flex-col items-center py-2 sm:py-3 px-2 sm:px-4 transition-colors relative ${
              activeTab === 'active' ? 'text-secondary-400' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Package className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-[10px] sm:text-xs mt-1">Active</span>
            {activeJobCount > 0 && (
              <span className="absolute top-1 sm:top-2 right-0 sm:right-2 w-4 h-4 sm:w-5 sm:h-5 bg-blue-500 text-white text-[10px] sm:text-xs rounded-full flex items-center justify-center">
                {activeJobCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('earnings')}
            className={`flex flex-col items-center py-2 sm:py-3 px-2 sm:px-4 transition-colors ${
              activeTab === 'earnings' ? 'text-secondary-400' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-[10px] sm:text-xs mt-1">Earnings</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center py-2 sm:py-3 px-2 sm:px-4 transition-colors ${
              activeTab === 'profile' ? 'text-secondary-400' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <UserIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-[10px] sm:text-xs mt-1">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
