'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { User, AgentWallet, OrderWithDetails } from '@/types'
import AvailableJobs from '@/app/agent/components/AvailableJobs'
import MyActiveJob from '@/app/agent/components/MyActiveJob'
import CashWallet from '@/app/agent/components/CashWallet'
import History from '@/app/agent/components/History'
import Profile from '@/app/agent/components/Profile'
import BrandMark from '@/components/BrandMark'

type Tab = 'available' | 'active' | 'wallet' | 'history' | 'profile'

export default function AgentHomePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<Tab>('available')
  const [agent, setAgent] = useState<User | null>(null)
  const [wallet, setWallet] = useState<AgentWallet | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeCount, setActiveCount] = useState<number>(0)

  useEffect(() => {
    loadAgentData()
  }, [])

  // Read tab from query (?tab=active)
  useEffect(() => {
    const t = searchParams?.get('tab') as Tab | null
    if (t && ['available','active','wallet','history','profile'].includes(t)) {
      setActiveTab(t)
    }
  }, [searchParams])

  useEffect(() => {
    if (!agent?.id) return
    const load = async () => {
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agent.id)
        .not('status', 'in', '(delivered,cancelled)')
      setActiveCount(count || 0)
    }
    load()

    const channel = supabase
      .channel('agent-active-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `agent_id=eq.${agent.id}` }, load)
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

        // Get agent wallet
        const { data: walletData } = await supabase
          .from('agent_wallets')
          .select('*')
          .eq('agent_id', userData.id)
          .single()

        setWallet(walletData)
      }
    } catch (error) {
      console.error('Error loading agent data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
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
    <div className="min-h-screen bg-kasi-black">
      {/* Header */}
      <header className="bg-gray-900/80 backdrop-blur border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-10 md:gap-16 lg:gap-20">
              <BrandMark size="sm" />
              <div>
                <h1 className="text-2xl font-bold text-white">Agent Portal</h1>
                <p className="text-sm text-gray-400">{agent?.full_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-gray-400">Company Cash</p>
                <p className="text-lg font-bold text-green-400">
                  R{wallet?.company_cash_balance?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="h-8 w-px bg-gray-700"></div>
              <button
                onClick={() => setActiveTab('profile')}
                className="w-10 h-10 rounded-full bg-gray-800 border-2 border-gray-700 hover:border-secondary-500 overflow-hidden flex items-center justify-center transition-colors"
                title="Profile"
              >
                {agent?.full_name ? (
                  <span className="text-lg font-semibold text-white">
                    {agent.full_name.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <span className="text-lg">👤</span>
                )}
              </button>
              <button
                onClick={handleLogout}
                className="px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('available')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'available'
                  ? 'border-secondary-500 text-secondary-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
              }`}
            >
              Available Jobs
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'active'
                  ? 'border-secondary-500 text-secondary-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
              }`}
            >
              My Active Job
              {activeCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center text-xs font-semibold bg-secondary-600 text-white rounded-full h-5 min-w-[1.25rem] px-1">
                  {activeCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('wallet')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'wallet'
                  ? 'border-secondary-500 text-secondary-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
              }`}
            >
              Cash Wallet
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'history'
                  ? 'border-secondary-500 text-secondary-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
              }`}
            >
              History
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'available' && <AvailableJobs agentId={agent?.id || ''} />}
        {activeTab === 'active' && <MyActiveJob agentId={agent?.id || ''} />}
        {activeTab === 'wallet' && <CashWallet agentId={agent?.id || ''} wallet={wallet} onUpdate={loadAgentData} />}
        {activeTab === 'history' && <History agentId={agent?.id || ''} />}
        {activeTab === 'profile' && <Profile agentId={agent?.id || ''} agent={agent} wallet={wallet} onUpdate={loadAgentData} />}
      </main>
    </div>
  )
}
