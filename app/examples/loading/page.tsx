"use client"

import { useEffect, useState } from 'react'
import Spinner from '../../../components/Spinner'

export default function LoadingExamplePage() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 1500)
    return () => clearTimeout(t)
  }, [])

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Spinner Example</h1>
      <p style={{ marginBottom: 12 }}>Below is a simulated loading state:</p>

      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Spinner size="lg" />
        </div>
      ) : (
        <div>Loaded content!</div>
      )}

      <hr style={{ margin: '24px 0' }} />

      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <Spinner size="sm" label="Loading" />
        </div>
        <div>
          <Spinner size="md" label="Loading" />
        </div>
        <div>
          <Spinner size="lg" label="Loading" />
        </div>
        <div>
          <Spinner variant="text" label="Loading" />
        </div>
      </div>
    </main>
  )
}
