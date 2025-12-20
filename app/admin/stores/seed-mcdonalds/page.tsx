'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface CreatedStore {
  id: string
  name: string
}

export default function SeedMcDonaldsPage() {
  const [creating, setCreating] = useState(false)
  const [store, setStore] = useState<CreatedStore | null>(null)
  const [message, setMessage] = useState<string>('')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    checkExisting()
  }, [])

  const checkExisting = async () => {
    setError('')
    setMessage('')
    const { data, error } = await supabase
      .from('stores')
      .select('id, name')
      .eq('name', "McDonald's Modimolle")
      .eq('town', 'modimolle')
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error(error)
      setError('Failed to check existing store.')
      return
    }
    if (data) setStore({ id: data.id, name: data.name })
  }

  const seedStoreAndMenu = async () => {
    setCreating(true)
    setError('')
    setMessage('')
    try {
      // 1) Ensure store exists
      let storeId = store?.id
      if (!storeId) {
        const { data: created, error: storeError } = await supabase
          .from('stores')
          .insert([
            {
              name: "McDonald's Modimolle",
              category: 'restaurant',
              phone_number: '010 123 4567',
              description: 'McDonald\'s Modimolle – burgers, meals, and more.',
              street_address: 'Modimolle (Nylstroom) Town Centre',
              township: 'Modimolle',
              town: 'modimolle',
              operating_days: 'Mon-Sun',
              open_time: '07:00',
              close_time: '23:00',
              status: 'active',
              custom_orders_only: false
            }
          ])
          .select('id, name')
          .single()

        if (storeError) throw storeError
        storeId = created.id
        setStore(created)
      }

      // 2) Seed a starter menu
      const products = [
        { name: 'Big Mac Meal', price: 79.90, category: 'Meals', description: 'Big Mac, medium fries, medium drink' },
        { name: 'Quarter Pounder with Cheese Meal', price: 89.90, category: 'Meals', description: 'QP w/ Cheese, medium fries, medium drink' },
        { name: 'McChicken Meal', price: 69.90, category: 'Meals', description: 'McChicken, medium fries, medium drink' },
        { name: 'Chicken McNuggets (10pc)', price: 69.90, category: 'Chicken', description: '10pc nuggets with choice of sauce' },
        { name: 'Medium Fries', price: 24.90, category: 'Sides', description: 'Golden fries' },
        { name: 'Coca-Cola (500ml)', price: 19.90, category: 'Drinks', description: '500ml bottle' },
        { name: 'Oreo McFlurry', price: 34.90, category: 'Desserts', description: 'Soft serve with Oreo' }
      ]

      // Upsert-like: avoid duplicate names for this store
      const { data: existingProducts, error: loadErr } = await supabase
        .from('products')
        .select('id, name')
        .eq('store_id', storeId as string)

      if (loadErr) throw loadErr
      const existingNames = new Set((existingProducts || []).map(p => p.name))

      const inserts = products
        .filter(p => !existingNames.has(p.name))
        .map(p => ({
          store_id: storeId as string,
          name: p.name,
          description: p.description,
          price: p.price,
          category: p.category,
          available: true
        }))

      if (inserts.length > 0) {
        const { error: insertErr } = await supabase
          .from('products')
          .insert(inserts)
        if (insertErr) throw insertErr
      }

      setMessage('McDonald\'s Modimolle seeded successfully. You can edit items and prices anytime in Admin.')
    } catch (e: any) {
      console.error(e)
      setError('Failed to seed store/menu. Please try again or use the SQL seed.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-kasi-black">
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-display font-bold">
              <span className="text-kasi-blue">TSA</span>{' '}
              <span className="text-kasi-orange">KASi</span>
            </h1>
            <span className="text-gray-400 text-sm">Admin • Seed McDonald\'s</span>
          </div>
          <Link href="/admin/stores" className="text-gray-300 hover:text-kasi-blue font-medium">← Back to Stores</Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-2">Seed McDonald\'s Modimolle</h2>
          <p className="text-gray-400 mb-4">This creates the store and a starter menu in Supabase. Adjust prices and items later.</p>

          {store ? (
            <div className="mb-4 text-sm text-gray-300">Existing store found: <span className="font-semibold">{store.name}</span></div>
          ) : (
            <div className="mb-4 text-sm text-gray-300">No existing store found. A new one will be created.</div>
          )}

          {message && (
            <div className="mb-4 p-3 bg-green-900/30 border border-green-700 text-green-300 rounded">{message}</div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-700 text-red-300 rounded">{error}</div>
          )}

          <button
            onClick={seedStoreAndMenu}
            disabled={creating}
            className="px-6 py-3 bg-kasi-orange text-white rounded-lg hover:bg-opacity-90 transition font-semibold disabled:opacity-50"
          >
            {creating ? 'Seeding…' : 'Seed Store + Menu'}
          </button>

          <div className="mt-6 text-xs text-gray-400">
            Note: Avoid scraping McDonald\'s website directly. Mirror the menu here and keep it updated.
          </div>
        </div>
      </main>
    </div>
  )
}
