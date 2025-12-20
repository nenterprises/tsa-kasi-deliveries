"use client"

import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export function useActiveOrdersCount() {
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isCancelled = false

    const fetchCount = async () => {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          if (!isCancelled) {
            setCount(0)
            setLoading(false)
          }
          return
        }

        const { count: c, error } = await supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('customer_id', user.id)
          .not('status', 'in', '("delivered","cancelled")')

        if (error) {
          console.error('Error fetching active orders count:', error)
          if (!isCancelled) setCount(0)
        } else if (!isCancelled) {
          setCount(c || 0)
        }
      } catch (e) {
        console.error('Unexpected error fetching active orders count:', e)
        if (!isCancelled) setCount(0)
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    fetchCount()

    return () => {
      isCancelled = true
    }
  }, [])

  return { count, loading }
}
