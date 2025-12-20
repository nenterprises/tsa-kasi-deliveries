'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function CustomerPage() {
  const router = useRouter()

  useEffect(() => {
    checkAuthAndRedirect()
  }, [])

  const checkAuthAndRedirect = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // Check if user is a customer
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (userData?.role === 'customer') {
        router.push('/customer/stores')
      } else {
        // Not a customer, sign out and go to login
        await supabase.auth.signOut()
        router.push('/customer/login')
      }
    } else {
      // Not logged in, redirect to login
      router.push('/customer/login')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p>Redirecting...</p>
      </div>
    </div>
  )
}
