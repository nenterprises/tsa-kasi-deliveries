'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { User, AgentProfile, AgentWallet, AgentWithProfile, AgentStatus } from '@/types'

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAgent, setSelectedAgent] = useState<AgentWithProfile | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState<'all' | AgentStatus>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadAgents()
  }, [])

  const loadAgents = async () => {
    try {
      // Load all agents with their profiles and wallets
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'agent')
        .order('created_at', { ascending: false })

      if (usersError) throw usersError

      // Load profiles for all agents
      const agentIds = usersData?.map(u => u.id) || []
      
      const [profilesRes, walletsRes] = await Promise.all([
        supabase.from('agent_profiles').select('*').in('agent_id', agentIds),
        supabase.from('agent_wallets').select('*').in('agent_id', agentIds)
      ])

      // Map profiles and wallets to agents
      const agentsWithData: AgentWithProfile[] = usersData?.map(user => ({
        ...user,
        profile: profilesRes.data?.find(p => p.agent_id === user.id),
        wallet: walletsRes.data?.find(w => w.agent_id === user.id)
      })) || []

      setAgents(agentsWithData)
    } catch (error) {
      console.error('Error loading agents:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateAgentStatus = async (agentId: string, newStatus: AgentStatus) => {
    try {
      const { error } = await supabase
        .from('agent_profiles')
        .update({ agent_status: newStatus })
        .eq('agent_id', agentId)

      if (error) throw error

      // Also update user status for blacklisted
      if (newStatus === 'blacklisted') {
        await supabase
          .from('users')
          .update({ status: 'suspended' })
          .eq('id', agentId)
      } else if (newStatus === 'active') {
        await supabase
          .from('users')
          .update({ status: 'active' })
          .eq('id', agentId)
      }

      loadAgents()
      setShowModal(false)
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const updateReceiptIssues = async (agentId: string, delta: number) => {
    try {
      const agent = agents.find(a => a.id === agentId)
      const currentIssues = agent?.profile?.receipt_issues || 0
      const newCount = Math.max(0, currentIssues + delta)

      const { error } = await supabase
        .from('agent_profiles')
        .update({ receipt_issues: newCount })
        .eq('agent_id', agentId)

      if (error) throw error
      loadAgents()
    } catch (error) {
      console.error('Error updating receipt issues:', error)
    }
  }

  const getStatusBadge = (status?: AgentStatus) => {
    switch (status) {
      case 'active':
        return { label: 'Active', color: 'bg-green-500/20 text-green-400 border-green-500/30' }
      case 'temporarily_suspended':
        return { label: 'Suspended', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' }
      case 'blacklisted':
        return { label: 'Blacklisted', color: 'bg-red-500/20 text-red-400 border-red-500/30' }
      default:
        return { label: 'Active', color: 'bg-green-500/20 text-green-400 border-green-500/30' }
    }
  }

  const getReliability = (profile?: AgentProfile) => {
    if (!profile) return { label: 'New', color: 'text-gray-400' }
    
    const total = profile.orders_completed + profile.orders_cancelled
    if (total < 5) return { label: 'New', color: 'text-gray-400' }
    
    const completionRate = profile.orders_completed / total
    const issueRate = profile.receipt_issues / Math.max(profile.orders_completed, 1)
    
    if (completionRate >= 0.95 && issueRate < 0.05) {
      return { label: 'Excellent', color: 'text-green-400' }
    } else if (completionRate >= 0.85 && issueRate < 0.1) {
      return { label: 'Good', color: 'text-blue-400' }
    } else if (completionRate >= 0.7) {
      return { label: 'Fair', color: 'text-yellow-400' }
    } else {
      return { label: 'Needs Improvement', color: 'text-red-400' }
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Never'
    return new Date(dateStr).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  // Filter agents
  const filteredAgents = agents.filter(agent => {
    const matchesFilter = filter === 'all' || (agent.profile?.agent_status || 'active') === filter
    const matchesSearch = searchTerm === '' || 
      agent.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.phone_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  // Stats
  const stats = {
    total: agents.length,
    active: agents.filter(a => (a.profile?.agent_status || 'active') === 'active').length,
    suspended: agents.filter(a => a.profile?.agent_status === 'temporarily_suspended').length,
    blacklisted: agents.filter(a => a.profile?.agent_status === 'blacklisted').length,
    totalOrders: agents.reduce((sum, a) => sum + (a.profile?.orders_completed || 0), 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary-500"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Agents</h1>
        <p className="text-gray-400 mt-1">Manage delivery agents and their profiles</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-2xl font-bold text-white">{stats.total}</p>
          <p className="text-sm text-gray-400">Total Agents</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-2xl font-bold text-green-400">{stats.active}</p>
          <p className="text-sm text-gray-400">Active</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-2xl font-bold text-yellow-400">{stats.suspended}</p>
          <p className="text-sm text-gray-400">Suspended</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-2xl font-bold text-red-400">{stats.blacklisted}</p>
          <p className="text-sm text-gray-400">Blacklisted</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-2xl font-bold text-blue-400">{stats.totalOrders}</p>
          <p className="text-sm text-gray-400">Total Deliveries</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-secondary-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all' ? 'bg-secondary-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'active' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('temporarily_suspended')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'temporarily_suspended' ? 'bg-yellow-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Suspended
          </button>
          <button
            onClick={() => setFilter('blacklisted')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'blacklisted' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Blacklisted
          </button>
        </div>
      </div>

      {/* Agents List */}
      {filteredAgents.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
          <div className="text-6xl mb-3">🏍️</div>
          <h3 className="text-xl font-semibold text-white mb-2">No Agents Found</h3>
          <p className="text-gray-400">
            {agents.length === 0 
              ? 'No agents have registered yet'
              : 'No agents match your search criteria'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredAgents.map(agent => {
            const statusBadge = getStatusBadge(agent.profile?.agent_status)
            const reliability = getReliability(agent.profile)
            
            return (
              <div
                key={agent.id}
                className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Photo & Basic Info */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-16 h-16 rounded-full bg-gray-800 border-2 border-gray-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {agent.profile?.profile_photo_url ? (
                        <img
                          src={agent.profile.profile_photo_url}
                          alt={agent.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl text-gray-500">👤</span>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-white">{agent.full_name}</h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${statusBadge.color}`}>
                          {statusBadge.label}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">{agent.phone_number || 'No phone'}</p>
                      <p className="text-gray-500 text-xs">{agent.email}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="text-gray-400">
                          ID: <span className="text-white">{agent.profile?.id_number || 'Not provided'}</span>
                        </span>
                        <span className="text-gray-400">
                          Area: <span className="text-white">{agent.profile?.township || agent.profile?.home_area || 'Not set'}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-4 sm:w-auto">
                    <div className="text-center">
                      <p className="text-xl font-bold text-white">{agent.profile?.orders_completed || 0}</p>
                      <p className="text-xs text-gray-400">Completed</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-white">{agent.profile?.orders_cancelled || 0}</p>
                      <p className="text-xs text-gray-400">Cancelled</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-white">{agent.profile?.receipt_issues || 0}</p>
                      <p className="text-xs text-gray-400">Issues</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-sm font-medium ${reliability.color}`}>{reliability.label}</p>
                      <p className="text-xs text-gray-400">Reliability</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 sm:flex-col">
                    <button
                      onClick={() => {
                        setSelectedAgent(agent)
                        setShowModal(true)
                      }}
                      className="flex-1 sm:flex-none px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>

                {/* Footer Info */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-800 text-xs text-gray-500">
                  <span>Last Active: {formatDate(agent.profile?.last_active_at)}</span>
                  <span>Joined: {formatDate(agent.created_at)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Agent Detail Modal */}
      {showModal && selectedAgent && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-gray-800 border-4 border-gray-700 overflow-hidden flex items-center justify-center">
                    {selectedAgent.profile?.profile_photo_url ? (
                      <img
                        src={selectedAgent.profile.profile_photo_url}
                        alt={selectedAgent.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl text-gray-500">👤</span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedAgent.full_name}</h2>
                    <p className="text-gray-400">{selectedAgent.phone_number}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusBadge(selectedAgent.profile?.agent_status).color}`}>
                      {getStatusBadge(selectedAgent.profile?.agent_status).label}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Profile Details */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 uppercase">Email</p>
                    <p className="text-white">{selectedAgent.email}</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 uppercase">ID Number</p>
                    <p className="text-white">{selectedAgent.profile?.id_number || 'Not provided'}</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 uppercase">Home Area</p>
                    <p className="text-white">{selectedAgent.profile?.home_area || 'Not set'}</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 uppercase">Township</p>
                    <p className="text-white capitalize">{selectedAgent.profile?.township?.replace('_', ' ') || 'Not set'}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-300 mb-3">Performance Stats</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-400">{selectedAgent.profile?.orders_completed || 0}</p>
                      <p className="text-xs text-gray-400">Completed</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-400">{selectedAgent.profile?.orders_cancelled || 0}</p>
                      <p className="text-xs text-gray-400">Cancelled</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yellow-400">{selectedAgent.profile?.receipt_issues || 0}</p>
                      <p className="text-xs text-gray-400">Receipt Issues</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-xl font-bold ${getReliability(selectedAgent.profile).color}`}>
                        {getReliability(selectedAgent.profile).label}
                      </p>
                      <p className="text-xs text-gray-400">Reliability</p>
                    </div>
                  </div>
                </div>

                {/* Earnings Info */}
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-300 mb-3">Earnings</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400">Total Deliveries</p>
                      <p className="text-2xl font-bold text-green-400">
                        {selectedAgent.profile?.orders_completed || 0}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Status</p>
                      <p className={`text-lg font-medium ${selectedAgent.profile?.agent_status === 'active' ? 'text-green-400' : 'text-yellow-400'}`}>
                        {selectedAgent.profile?.agent_status || 'Pending'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Receipt Issues Management */}
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-300 mb-3">Receipt Issues</h3>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => updateReceiptIssues(selectedAgent.id, 1)}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg text-sm transition-colors"
                    >
                      + Add Issue
                    </button>
                    <button
                      onClick={() => updateReceiptIssues(selectedAgent.id, -1)}
                      disabled={(selectedAgent.profile?.receipt_issues || 0) === 0}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      - Remove Issue
                    </button>
                    <span className="text-gray-400 text-sm">
                      Current: <span className="text-white font-medium">{selectedAgent.profile?.receipt_issues || 0}</span>
                    </span>
                  </div>
                </div>

                {/* Status Actions */}
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-300 mb-3">Status Management</h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => updateAgentStatus(selectedAgent.id, 'active')}
                      disabled={selectedAgent.profile?.agent_status === 'active'}
                      className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ✓ Set Active
                    </button>
                    <button
                      onClick={() => updateAgentStatus(selectedAgent.id, 'temporarily_suspended')}
                      disabled={selectedAgent.profile?.agent_status === 'temporarily_suspended'}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ⏸ Temporarily Suspend
                    </button>
                    <button
                      onClick={() => updateAgentStatus(selectedAgent.id, 'blacklisted')}
                      disabled={selectedAgent.profile?.agent_status === 'blacklisted'}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ⛔ Blacklist
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    • Temporarily Suspended: Agent cannot accept new jobs<br/>
                    • Blacklisted: Agent is permanently banned
                  </p>
                </div>

                {/* Dates */}
                <div className="flex justify-between text-xs text-gray-500 pt-4 border-t border-gray-800">
                  <span>Last Active: {formatDate(selectedAgent.profile?.last_active_at)}</span>
                  <span>Joined: {formatDate(selectedAgent.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
