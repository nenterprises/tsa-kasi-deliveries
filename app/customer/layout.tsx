'use client'

import { CartProvider } from '@/lib/CartContext'

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CartProvider>
      {children}
    </CartProvider>
  )
}
