'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

interface StoreSession {
  storeId: string
  storeName: string
  accessCode: string
  loginTime: string
}

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const [storeSession, setStoreSession] = useState<StoreSession | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Check if user is logged in
    const sessionData = localStorage.getItem('store_session')
    
    if (!sessionData && pathname !== '/store/login') {
      router.push('/store/login')
      return
    }

    if (sessionData) {
      setStoreSession(JSON.parse(sessionData))
    }
    
    setLoading(false)
  }, [router, pathname])

  const handleLogout = () => {
    localStorage.removeItem('store_session')
    router.push('/store/login')
  }

  // Don't show layout on login page
  if (pathname === '/store/login' || loading) {
    return <>{children}</>
  }

  const navItems = [
    { href: '/store/dashboard', label: 'Dashboard' },
    { href: '/store/orders', label: 'Orders' },
    { href: '/store/menu', label: 'Menu' },
    { href: '/store/history', label: 'History' },
    { href: '/store/settings', label: 'Settings' },
  ]

  return (
    <div className="min-h-screen bg-kasi-black pb-20">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            {/* Mobile: Centered branding */}
            <div className="flex-1 flex justify-center sm:hidden">
              <div className="text-center leading-tight">
                <h1 className="text-lg font-display font-bold">
                  <span className="text-kasi-blue">TSA</span>{' '}
                  <span className="text-kasi-orange">KASi</span>
                </h1>
                <div className="text-xs text-kasi-orange font-semibold tracking-wide">Deliveries</div>
              </div>
            </div>

            {/* Desktop: Left aligned with store info */}
            <div className="hidden sm:flex items-center gap-4 min-w-0 flex-1">
              <div className="leading-tight">
                <h1 className="text-xl sm:text-2xl font-display font-bold">
                  <span className="text-kasi-blue">TSA</span>{' '}
                  <span className="text-kasi-orange">KASi</span>
                </h1>
                <div className="text-xs text-kasi-orange font-semibold tracking-wide">Deliveries</div>
              </div>
              <div className="h-8 w-px bg-gray-700"></div>
              <div className="min-w-0">
                <p className="text-sm text-gray-400 font-medium">Store Portal</p>
                <p className="font-bold text-white text-lg truncate" title={storeSession?.storeName}>{storeSession?.storeName}</p>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="absolute right-4 sm:relative sm:right-0 p-2 sm:px-4 sm:py-2 text-sm text-red-400 hover:bg-red-900/20 rounded-lg transition-all border border-red-900/30 hover:border-red-800 flex items-center gap-2 flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>

          {/* Mobile: Store name below header */}
          <div className="sm:hidden pb-3 text-center border-t border-gray-800 pt-2 mt-2">
            <p className="text-xs text-gray-400 font-medium">Store Portal</p>
            <p className="font-bold text-white text-sm truncate px-12" title={storeSession?.storeName}>{storeSession?.storeName}</p>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-gray-900/50 backdrop-blur border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto hide-scrollbar py-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium whitespace-nowrap rounded-lg transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-kasi-orange to-orange-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {children}
      </main>
    </div>
  )
}
