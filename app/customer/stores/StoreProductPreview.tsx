'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Product } from '@/types'
import Link from 'next/link'

interface StoreProductPreviewProps {
  storeId: string
  products: Product[]
}

export default function StoreProductPreview({ storeId, products }: StoreProductPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  // Auto-advance slideshow
  useEffect(() => {
    if (!isAutoPlaying || products.length === 0) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % products.length)
    }, 3000) // Change every 3 seconds

    return () => clearInterval(interval)
  }, [isAutoPlaying, products.length])

  const goToPrevious = () => {
    setIsAutoPlaying(false)
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length)
  }

  const goToNext = () => {
    setIsAutoPlaying(false)
    setCurrentIndex((prev) => (prev + 1) % products.length)
  }

  if (products.length === 0) return null

  const currentProduct = products[currentIndex]

  return (
    <div className="mt-3">
      <div className="relative bg-gray-800 rounded-lg overflow-hidden group">
        {/* Product Image */}
        <div className="relative h-32 bg-white">
        {currentProduct.image_url ? (
          <img
            src={currentProduct.image_url}
            alt={currentProduct.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-400 text-xs">No image</span>
          </div>
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Product Info */}
        <div className="absolute bottom-0 left-0 right-0 p-2">
          <p className="text-white text-xs font-semibold line-clamp-1 mb-0.5">
            {currentProduct.name}
          </p>
          <p className="text-kasi-orange text-sm font-bold">
            R{currentProduct.price.toFixed(2)}
          </p>
        </div>

        {/* Navigation Buttons */}
        {products.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full transition opacity-0 group-hover:opacity-100"
              aria-label="Previous"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full transition opacity-0 group-hover:opacity-100"
              aria-label="Next"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </>
        )}

        {/* Counter */}
        <div className="absolute top-1 right-1 bg-black/60 text-white px-1.5 py-0.5 rounded text-[10px]">
          {currentIndex + 1}/{products.length}
        </div>
      </div>

      {/* Dots */}
      {products.length > 1 && (
        <div className="flex justify-center gap-1 py-1.5 bg-gray-900">
          {products.slice(0, 8).map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setIsAutoPlaying(false)
                setCurrentIndex(index)
              }}
              className={`h-1 rounded-full transition-all ${
                index === currentIndex
                  ? 'w-4 bg-kasi-orange'
                  : 'w-1 bg-gray-600 hover:bg-gray-500'
              }`}
              aria-label={`View product ${index + 1}`}
            />
          ))}
          {products.length > 8 && (
            <span className="text-gray-500 text-[9px] ml-0.5">+{products.length - 8}</span>
          )}
        </div>
      )}
      </div>
      
      {/* View Full Menu Button */}
      <Link
        href={`/customer/store/${storeId}`}
        className="block w-full text-center bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-2 px-4 rounded-lg transition duration-200 text-xs mt-2 border border-gray-700"
      >
        View Full Menu
      </Link>
    </div>
  )
}
