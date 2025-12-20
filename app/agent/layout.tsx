'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { User } from '@/types'

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [agent, setAgent] = useState<User | null>(null)

  const isLoginRoute = pathname === '/agent/login' || pathname === '/agent/signup'

  useEffect(() => {
    if (isLoginRoute) {
      // Skip auth guard on login route
      setLoading(false)
      return
    }
    checkAuth()
  }, [isLoginRoute])

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/agent/login')
        return
      }

      // Verify user is an agent
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .eq('role', 'agent')
        .single()

      if (error || !userData) {
        await supabase.auth.signOut()
        router.push('/agent/login')
        return
      }

      if (userData.status !== 'active') {
        await supabase.auth.signOut()
        router.push('/agent/login')
        return
      }

      setAgent(userData)
    } catch (error) {
      console.error('Auth error:', error)
      router.push('/agent/login')
    } finally {
      setLoading(false)
    }
  }

  // Allow login/signup pages to render without guard
  if (isLoginRoute) {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!agent) {
    return null
  }

  return <>{children}</>
}
