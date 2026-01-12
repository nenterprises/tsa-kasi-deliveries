'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Product } from '@/types'

interface ProductSlideshowProps {
  products: Product[]
  onProductClick?: (product: Product) => void
}

export default function ProductSlideshow({ products, onProductClick }: ProductSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  // Auto-advance slideshow
  useEffect(() => {
    if (!isAutoPlaying || products.length === 0) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % products.length)
    }, 4000) // Change slide every 4 seconds

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

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false)
    setCurrentIndex(index)
  }

  if (products.length === 0) return null

  const currentProduct = products[currentIndex]

  return (
    <div className="relative bg-gray-900 rounded-xl border border-gray-800 overflow-hidden group">
      {/* Main Slide */}
      <div className="relative h-64 sm:h-80 md:h-96 bg-gray-800">
        {currentProduct.image_url ? (
          <img
            src={currentProduct.image_url}
            alt={currentProduct.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-600 text-lg">No image</span>
          </div>
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Product Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
          <div className="max-w-2xl">
            <span className="inline-block px-2 py-1 bg-kasi-orange/90 text-white text-xs font-semibold rounded mb-2">
              {currentProduct.category || 'Product'}
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {currentProduct.name}
            </h3>
            {currentProduct.description && (
              <p className="text-gray-200 text-sm sm:text-base mb-3 line-clamp-2">
                {currentProduct.description}
              </p>
            )}
            <div className="flex items-center gap-3">
              <span className="text-3xl sm:text-4xl font-bold text-kasi-orange">
                R{currentProduct.price.toFixed(2)}
              </span>
              {onProductClick && (
                <button
                  onClick={() => onProductClick(currentProduct)}
                  className="px-4 py-2 bg-kasi-orange text-white rounded-lg hover:bg-opacity-90 transition font-semibold text-sm sm:text-base"
                >
                  + Add to Cart
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        {products.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition opacity-0 group-hover:opacity-100"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition opacity-0 group-hover:opacity-100"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </>
        )}
      </div>

      {/* Dots Navigation */}
      {products.length > 1 && (
        <div className="absolute bottom-20 sm:bottom-24 left-0 right-0 flex justify-center gap-2 px-4">
          {products.slice(0, 10).map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-1.5 rounded-full transition-all ${
                index === currentIndex
                  ? 'w-8 bg-kasi-orange'
                  : 'w-1.5 bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
          {products.length > 10 && (
            <span className="text-white/50 text-xs">+{products.length - 10}</span>
          )}
        </div>
      )}

      {/* Slide Counter */}
      <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-xs sm:text-sm">
        {currentIndex + 1} / {products.length}
      </div>
    </div>
  )
}
