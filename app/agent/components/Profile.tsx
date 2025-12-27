'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { User, AgentProfile as AgentProfileType } from '@/types'
import { Camera, Award, Package, CheckCircle, XCircle } from 'lucide-react'

interface ProfileProps {
  agentId: string
  agent: User | null
  onUpdate: () => void
}

export default function Profile({ agentId, agent, onUpdate }: ProfileProps) {
  const [profile, setProfile] = useState<AgentProfileType | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Editable fields
  const [homeArea, setHomeArea] = useState('')
  const [township, setTownship] = useState('')

  useEffect(() => {
    loadProfile()
  }, [agentId])

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_profiles')
        .select('*')
        .eq('agent_id', agentId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error)
      }

      if (data) {
        setProfile(data)
        setHomeArea(data.home_area || '')
        setTownship(data.township || '')
      } else {
        // Create profile if doesn't exist
        const { data: newProfile } = await supabase
          .from('agent_profiles')
          .insert({ agent_id: agentId })
          .select()
          .single()

        if (newProfile) {
          setProfile(newProfile)
        }
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const { error } = await supabase
        .from('agent_profiles')
        .update({
          home_area: homeArea,
          township: township
        })
        .eq('agent_id', agentId)

      if (error) throw error

      setSuccess('Profile updated!')
      setTimeout(() => setSuccess(''), 3000)
      loadProfile()
      onUpdate()
    } catch (err: any) {
      setError(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }

    setUploading(true)
    setError('')

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${agentId}-${Date.now()}.${fileExt}`
      const filePath = `agent-photos/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('agent-profiles')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('agent-profiles')
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('agent_profiles')
        .update({ profile_photo_url: publicUrl })
        .eq('agent_id', agentId)

      if (updateError) throw updateError

      setSuccess('Photo uploaded!')
      setTimeout(() => setSuccess(''), 3000)
      loadProfile()
    } catch (err: any) {
      setError(err.message || 'Failed to upload photo')
    } finally {
      setUploading(false)
    }
  }

  const getReliabilityRating = () => {
    if (!profile) return { label: 'New', color: 'text-gray-400', bg: 'bg-gray-800', stars: 0 }
    
    const total = profile.orders_completed + profile.orders_cancelled
    if (total < 5) return { label: 'New', color: 'text-gray-400', bg: 'bg-gray-800', stars: 0 }
    
    const completionRate = profile.orders_completed / total
    
    if (completionRate >= 0.95) {
      return { label: 'Excellent', color: 'text-green-400', bg: 'bg-green-900/30', stars: 5 }
    } else if (completionRate >= 0.85) {
      return { label: 'Good', color: 'text-blue-400', bg: 'bg-blue-900/30', stars: 4 }
    } else if (completionRate >= 0.7) {
      return { label: 'Fair', color: 'text-yellow-400', bg: 'bg-yellow-900/30', stars: 3 }
    } else {
      return { label: 'Needs Work', color: 'text-red-400', bg: 'bg-red-900/30', stars: 2 }
    }
  }

  const reliability = getReliabilityRating()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex flex-col items-center text-center">
          {/* Profile Photo */}
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full bg-gray-800 border-4 border-gray-700 overflow-hidden flex items-center justify-center">
              {profile?.profile_photo_url ? (
                <img
                  src={profile.profile_photo_url}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl text-gray-500">👤</span>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-8 h-8 bg-secondary-600 hover:bg-secondary-500 rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>

          {/* Name & Status */}
          <h2 className="text-xl font-bold text-white">{agent?.full_name || 'Agent'}</h2>
          <p className="text-gray-400 text-sm mt-1">{agent?.phone_number || 'No phone'}</p>
          
          {/* Reliability Badge */}
          <div className={`mt-3 px-4 py-2 rounded-full ${reliability.bg} ${reliability.color} flex items-center gap-2`}>
            <Award className="w-4 h-4" />
            <span className="font-medium">{reliability.label}</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-white">{profile?.orders_completed || 0}</p>
          <p className="text-sm text-gray-400">Completed</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <XCircle className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-white">{profile?.orders_cancelled || 0}</p>
          <p className="text-sm text-gray-400">Cancelled</p>
        </div>
      </div>

      {/* Edit Profile Form */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Edit Profile</h3>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
            {success}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Home Area
            </label>
            <input
              type="text"
              value={homeArea}
              onChange={(e) => setHomeArea(e.target.value)}
              placeholder="e.g., Section B, Zone 3"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-secondary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Township
            </label>
            <select
              value={township}
              onChange={(e) => setTownship(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-secondary-500"
            >
              <option value="">Select Township</option>
              <option value="modimolle">Modimolle</option>
              <option value="phagameng">Phagameng</option>
              <option value="leseding">Leseding</option>
              <option value="bela_bela">Bela Bela</option>
            </select>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-secondary-600 hover:bg-secondary-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Account Info</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Email</span>
            <span className="text-white">{agent?.email || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Phone</span>
            <span className="text-white">{agent?.phone_number || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Member Since</span>
            <span className="text-white">
              {agent?.created_at 
                ? new Date(agent.created_at).toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })
                : '-'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
