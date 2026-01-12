'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, Navigation, Loader2 } from 'lucide-react'
import { Address, MapboxFeature, parseMapboxFeature } from '@/lib/mapbox'

interface AddressAutocompleteProps {
  onAddressSelect: (address: Address) => void
  initialValue?: string
  placeholder?: string
  className?: string
}

export default function AddressAutocomplete({
  onAddressSelect,
  initialValue = '',
  placeholder = 'Start typing your address...',
  className = ''
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState(initialValue)
  const [suggestions, setSuggestions] = useState<MapboxFeature[]>([])
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [gettingLocation, setGettingLocation] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (query.length < 3) {
      setSuggestions([])
      return
    }

    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(async () => {
      await searchAddresses(query)
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query])

  const searchAddresses = async (searchQuery: string) => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/mapbox/search?q=${encodeURIComponent(searchQuery)}&limit=5`
      )
      
      if (!response.ok) throw new Error('Search failed')
      
      const data = await response.json()
      setSuggestions(data.features || [])
      setShowSuggestions(true)
    } catch (error) {
      console.error('Address search error:', error)
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelectSuggestion = (feature: MapboxFeature) => {
    const address = parseMapboxFeature(feature)
    setQuery(address.formatted)
    setSuggestions([])
    setShowSuggestions(false)
    onAddressSelect(address)
  }

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }

    setGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        
        try {
          // Reverse geocode
          const response = await fetch(
            `/api/mapbox/geocode/reverse?lat=${latitude}&lng=${longitude}`
          )
          
          if (!response.ok) throw new Error('Reverse geocoding failed')
          
          const data = await response.json()
          
          if (data.features && data.features.length > 0) {
            const address = parseMapboxFeature(data.features[0])
            setQuery(address.formatted)
            onAddressSelect(address)
          }
        } catch (error) {
          console.error('Reverse geocoding error:', error)
          alert('Failed to get address from your location')
        } finally {
          setGettingLocation(false)
        }
      },
      (error) => {
        console.error('Geolocation error:', error)
        alert('Failed to get your location. Please enter address manually.')
        setGettingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className={`w-full pl-10 pr-10 py-3 bg-gray-800/50 border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-kasi-orange focus:border-kasi-orange transition-all ${className}`}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-kasi-orange animate-spin" size={20} />
        )}
      </div>

      {/* Use Current Location Button */}
      <button
        type="button"
        onClick={handleUseCurrentLocation}
        disabled={gettingLocation}
        className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-800/50 border border-gray-700 text-white rounded-xl hover:bg-gray-700 transition-all disabled:opacity-50"
      >
        {gettingLocation ? (
          <Loader2 className="animate-spin" size={18} />
        ) : (
          <Navigation size={18} />
        )}
        <span>{gettingLocation ? 'Getting location...' : 'Use my current location'}</span>
      </button>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              className={`w-full text-left px-4 py-3 hover:bg-gray-800 transition-colors border-b border-gray-800 last:border-b-0 ${
                index === selectedIndex ? 'bg-gray-800' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <MapPin className="text-kasi-orange mt-1 flex-shrink-0" size={18} />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{suggestion.text}</p>
                  <p className="text-gray-400 text-sm truncate">{suggestion.place_name}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {showSuggestions && !loading && query.length >= 3 && suggestions.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-4">
          <p className="text-gray-400 text-sm text-center">
            No addresses found. Try a different search.
          </p>
        </div>
      )}
    </div>
  )
}
