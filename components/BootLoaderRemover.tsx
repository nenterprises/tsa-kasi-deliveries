"use client"

import { useEffect } from 'react'

export default function BootLoaderRemover() {
  useEffect(() => {
    const el = document.getElementById('app-loader')
    if (el) {
      el.style.opacity = '0'
      // Don't remove from DOM - just hide it to avoid React conflicts
      window.setTimeout(() => {
        if (el) {
          el.style.display = 'none'
          el.style.pointerEvents = 'none'
        }
      }, 150)
    }
  }, [])
  return null
}
