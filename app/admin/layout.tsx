'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Store, 
  Users, 
  FileText, 
  Settings, 
  LogOut,
  Menu,
  X
} from 'lucide-react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    // Skip auth check for login and signup pages
    if (pathname === '/admin/login' || pathname === '/admin/signup') {
      return
    }

    // Check Supabase session and admin role
    ;(async () => {
      try {
        const { data: auth } = await supabase.auth.getUser()
        if (!auth.user) {
          router.push('/admin/login')
          return
        }

        const { data: profile } = await supabase
          .from('users')
          .select('id, email, full_name, role, status')
          .eq('id', auth.user.id)
          .maybeSingle()

        if (!profile || profile.role !== 'admin') {
          router.push('/admin/login')
          return
        }

        const adminUser = {
          id: auth.user.id,
          email: auth.user.email,
          // Only use full_name if it's different from email, otherwise show 'Admin'
          full_name: (profile.full_name && profile.full_name !== auth.user.email) 
            ? profile.full_name 
            : 'Admin',
          role: 'admin',
        }
        setUser(adminUser)
        try {
          localStorage.setItem('admin_user', JSON.stringify(adminUser))
        } catch {}
      } catch {
        router.push('/admin/login')
      }
    })()
  }, [router, pathname, mounted])

  const handleLogout = () => {
    localStorage.removeItem('admin_user')
    supabase.auth.signOut()
    router.push('/admin/login')
  }

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
    { name: 'Stores', href: '/admin/stores', icon: Store },
    { name: 'Agents', href: '/admin/agents', icon: Users },
    { name: 'Reports', href: '/admin/reports', icon: FileText },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ]

  // Render login/signup pages without layout
  if (pathname === '/admin/login' || pathname === '/admin/signup') {
    return <>{children}</>
  }

  // Show loading or redirect for unauthenticated users
  if (!user || !mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-kasi-black border-r border-gray-800 text-white transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-gray-800">
            <div className="leading-tight">
              <h1 className="text-2xl font-display font-bold">
                <span className="text-kasi-blue">TSA</span>{' '}
                <span className="text-kasi-orange">KASi</span>
              </h1>
              <div className="text-xs text-kasi-orange font-semibold tracking-wide">Deliveries</div>
              <p className="text-sm text-gray-400 mt-1">Admin Portal</p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white hover:text-primary-200"
            >
              <X size={24} />
            </button>
          </div>

          {/* User Info */}
          <div className="px-6 py-4 bg-gray-900 border-b border-gray-800 min-w-0">
            <p className="text-sm text-gray-400">Logged in as</p>
            <p className="font-semibold text-white w-full truncate" title={user.full_name}>{user.full_name}</p>
            <p className="text-xs text-gray-500 w-full truncate" title={user.email}>{user.email}</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 rounded-lg transition ${
                    isActive
                      ? 'bg-kasi-orange text-white'
                      : 'text-gray-300 hover:bg-gray-900 hover:text-white'
                  }`}
                >
                  <Icon size={20} className="mr-3" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="px-4 py-6 border-t border-gray-800">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-gray-300 hover:bg-gray-900 hover:text-white rounded-lg transition"
            >
              <LogOut size={20} className="mr-3" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-200 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
        {/* Top Bar */}
        <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-white lg:hidden"
            >
              <Menu size={24} />
            </button>
            <div className="flex-1 lg:hidden"></div>
            <div className="text-sm text-gray-400">
              {new Date().toLocaleDateString('en-ZA', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-3 sm:p-6 bg-gray-950 min-h-screen">
          {children}
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  )
}
