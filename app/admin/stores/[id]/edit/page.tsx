'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Store } from '@/types'

export default function EditStoreAdminPage() {
  const params = useParams()
  const router = useRouter()
  const storeId = params?.id as string
  const [store, setStore] = useState<Store | null>(null)
  const [initialStore, setInitialStore] = useState<Store | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [authUserEmail, setAuthUserEmail] = useState<string | null>(null)

  useEffect(() => {
    if (!storeId) return
    ;(async () => {
      const { data: auth } = await supabase.auth.getUser()
      setAuthUserEmail(auth.user?.email ?? null)
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .single()
      if (!error && data) {
        setStore(data as Store)
        setInitialStore(data as Store)
      }
    })()
  }, [storeId])

  const hasChanges = () => {
    if (!store || !initialStore) return false
    const fields: (keyof Store)[] = [
      'name', 'phone_number', 'description', 'street_address', 'township', 'town',
      'open_time', 'close_time', 'operating_days', 'logo_url', 'status', 'custom_orders_only'
    ]
    return fields.some((f) => (store as any)[f] !== (initialStore as any)[f])
  }

  const handleSave = async () => {
    if (!store) return
    if (!hasChanges()) {
      setMessage('No changes to save.')
      return
    }
    setSaving(true)
    setError('')
    setMessage('')
    const { error } = await supabase
      .from('stores')
      .update({
        name: store.name,
        phone_number: store.phone_number,
        description: store.description,
        street_address: store.street_address,
        township: store.township,
        town: store.town,
        open_time: store.open_time ? store.open_time : null,
        close_time: store.close_time ? store.close_time : null,
        operating_days: store.operating_days,
        logo_url: store.logo_url,
        status: store.status,
        custom_orders_only: store.custom_orders_only,
      })
      .eq('id', store.id)

    if (error) {
      setError('Failed to save.')
    } else {
      setMessage('Saved.')
      setInitialStore(store)
    }
    setSaving(false)
  }

  const handleLogoUpload = async (file: File) => {
    if (!store) return
    setUploadingLogo(true)
    try {
      const ext = file.name.split('.').pop()
      const fileName = `${store.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('store-logos')
        .upload(fileName, file)
      if (uploadErr) throw uploadErr
      const { data: { publicUrl } } = supabase.storage
        .from('store-logos')
        .getPublicUrl(fileName)
      setStore({ ...store, logo_url: publicUrl })
      setMessage('Logo uploaded. Click Save to persist.')
    } catch (e: any) {
      console.error(e)
      setError('Logo upload failed. Ensure bucket "store-logos" exists and is Public.')
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleDelete = async () => {
    if (!store) return
    const confirmed = window.confirm(
      'Are you sure you want to delete this store? This action cannot be undone.'
    )
    if (!confirmed) return
    setDeleting(true)
    setError('')
    setMessage('')
    try {
      const { count, error: countErr } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store.id)
      if (countErr) throw countErr
      if ((count ?? 0) > 0) {
        setError('Cannot delete store with existing orders. Set status to Inactive instead.')
        return
      }

      const { error: delErr } = await supabase
        .from('stores')
        .delete()
        .eq('id', store.id)
      if (delErr) throw delErr

      setMessage('Store deleted. Redirecting…')
      setTimeout(() => router.push('/admin/stores'), 700)
    } catch (e: any) {
      setError(e?.message || 'Failed to delete store')
    } finally {
      setDeleting(false)
    }
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-kasi-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Loading store…</p>
          <Link href="/admin/stores" className="text-kasi-blue hover:underline mt-4 inline-block">
            Back to Stores
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-kasi-black">
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-display font-bold">
              <span className="text-kasi-blue">TSA</span>{' '}
              <span className="text-kasi-orange">KASi</span>
            </h1>
            <span className="text-gray-400 text-sm">Admin • Edit {store.name}</span>
          </div>
          <Link href="/admin/stores" className="text-gray-300 hover:text-kasi-blue font-medium">← Back</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          {!authUserEmail && (
            <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-700 text-yellow-300 rounded">
              Not signed in. Storage uploads require authentication. Please sign in via Admin Login.
            </div>
          )}
          {message && <div className="mb-4 p-3 bg-green-900/30 border border-green-700 text-green-300 rounded">{message}</div>}
          {error && <div className="mb-4 p-3 bg-red-900/30 border border-red-700 text-red-300 rounded">{error}</div>}
          {!hasChanges() ? (
            <div className="mb-4 p-3 bg-gray-800 border border-gray-700 text-gray-300 rounded">No changes to save</div>
          ) : (
            <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-700 text-yellow-300 rounded">Unsaved changes</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Name</label>
              <input
                value={store.name}
                onChange={(e) => setStore({ ...store, name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Phone</label>
              <input
                value={store.phone_number}
                onChange={(e) => setStore({ ...store, phone_number: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-300 mb-1">Description</label>
              <textarea
                value={store.description || ''}
                onChange={(e) => setStore({ ...store, description: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded"
              />
            </div>
            {/* Address */}
            <div className="md:col-span-2 mt-2">
              <h4 className="text-white font-semibold mb-2">Address</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Street Address</label>
                  <input
                    value={store.street_address}
                    onChange={(e) => setStore({ ...store, street_address: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Township/Area</label>
                  <input
                    value={store.township}
                    onChange={(e) => setStore({ ...store, township: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Town</label>
                  <select
                    value={store.town}
                    onChange={(e) => setStore({ ...store, town: e.target.value as any })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded"
                  >
                    <option value="modimolle">Modimolle</option>
                    <option value="phagameng">Phagameng</option>
                    <option value="leseding">Leseding</option>
                    <option value="bela_bela">Bela-Bela</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Operating Hours */}
            <div className="md:col-span-2 mt-2">
              <h4 className="text-white font-semibold mb-2">Operating Hours</h4>
                <div className="mb-3 flex items-center gap-3">
                  <input
                    id="open24"
                    type="checkbox"
                    checked={Boolean(store.open_time?.startsWith('00:00')) && Boolean(store.close_time?.startsWith('23:59'))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setStore({ ...store, open_time: '00:00', close_time: '23:59' })
                      } else {
                        setStore({ ...store, open_time: '', close_time: '' } as any)
                      }
                    }}
                  />
                  <label htmlFor="open24" className="text-gray-300 text-sm">Open 24 hours</label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Open Time</label>
                  <input
                    type="time"
                    value={store.open_time ? store.open_time.slice(0,5) : ''}
                      onChange={(e) => setStore({ ...store, open_time: e.target.value })}
                      disabled={Boolean(store.open_time?.startsWith('00:00')) && Boolean(store.close_time?.startsWith('23:59'))}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Close Time</label>
                  <input
                    type="time"
                    value={store.close_time ? store.close_time.slice(0,5) : ''}
                      onChange={(e) => setStore({ ...store, close_time: e.target.value })}
                      disabled={Boolean(store.open_time?.startsWith('00:00')) && Boolean(store.close_time?.startsWith('23:59'))}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Operating Days</label>
                  <input
                    value={store.operating_days || ''}
                    onChange={(e) => setStore({ ...store, operating_days: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded"
                    placeholder="Mon-Sun"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Status</label>
              <select
                value={store.status}
                onChange={(e) => setStore({ ...store, status: e.target.value as Store['status'] })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded"
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Logo URL</label>
              <input
                value={store.logo_url || ''}
                onChange={(e) => setStore({ ...store, logo_url: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded"
                placeholder="https://..."
              />
              <div className="text-xs text-gray-400 mt-1">Tip: Use a public image URL or upload to a public bucket.</div>
              <div className="mt-3">
                <label className="block text-sm text-gray-300 mb-1">Upload Logo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleLogoUpload(f)
                  }}
                  className="w-full text-sm text-gray-300"
                />
                <div className="text-xs text-gray-400 mt-1">Uploads go to Supabase bucket: store-logos (must be Public).</div>
                {store.logo_url && (
                  <div className="mt-3 h-24 w-24 rounded border border-gray-700 overflow-hidden bg-gray-800">
                    <img src={store.logo_url} alt="Store logo" className="w-full h-full object-cover" />
                  </div>
                )}
                {uploadingLogo && <div className="text-xs text-gray-400 mt-2">Uploading…</div>}
              </div>
            </div>
            <div className="md:col-span-2 flex items-center gap-3 mt-2">
              <input
                id="customOrdersOnly"
                type="checkbox"
                checked={store.custom_orders_only}
                onChange={(e) => setStore({ ...store, custom_orders_only: e.target.checked })}
              />
              <label htmlFor="customOrdersOnly" className="text-gray-300">Custom Orders Only</label>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges()}
              className="px-6 py-2 bg-kasi-orange text-white rounded-lg hover:bg-opacity-90 transition font-semibold disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <Link href={`/admin/stores/${store.id}/products`} className="px-6 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 hover:bg-gray-700">View Products</Link>
            <Link href={`/customer/store/${store.id}`} className="px-6 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 hover:bg-gray-700">Customer View</Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
            >
              {deleting ? 'Deleting…' : 'Delete Store'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
