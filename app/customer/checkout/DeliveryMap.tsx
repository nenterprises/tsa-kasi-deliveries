'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '@/lib/mapbox'

interface DeliveryMapProps {
  storeLocation?: { latitude: number; longitude: number; name?: string }
  deliveryLocation?: { latitude: number; longitude: number; address?: string }
  className?: string
}

export default function DeliveryMap({
  storeLocation,
  deliveryLocation,
  className = ''
}: DeliveryMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [mapError, setMapError] = useState<string | null>(null)

  useEffect(() => {
    if (!mapContainer.current) return
    
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
    
    if (!token) {
      setMapError('Mapbox token not configured')
      return
    }

    mapboxgl.accessToken = token

    try {
      // Initialize map
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11', // Dark theme
        center: deliveryLocation 
          ? [deliveryLocation.longitude, deliveryLocation.latitude]
          : storeLocation
          ? [storeLocation.longitude, storeLocation.latitude]
          : DEFAULT_CENTER,
        zoom: deliveryLocation || storeLocation ? 14 : DEFAULT_ZOOM,
        attributionControl: false
      })

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

      // Add markers when map loads
      map.current.on('load', () => {
        // Add store marker
        if (storeLocation) {
          const storeMarkerEl = document.createElement('div')
          storeMarkerEl.className = 'store-marker'
          storeMarkerEl.innerHTML = '🏪'
          storeMarkerEl.style.fontSize = '32px'
          storeMarkerEl.style.cursor = 'pointer'

          new mapboxgl.Marker(storeMarkerEl)
            .setLngLat([storeLocation.longitude, storeLocation.latitude])
            .setPopup(
              new mapboxgl.Popup({ offset: 25 })
                .setHTML(`
                  <div style="padding: 8px;">
                    <strong>${storeLocation.name || 'Store'}</strong>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">Pickup location</p>
                  </div>
                `)
            )
            .addTo(map.current!)
        }

        // Add delivery marker
        if (deliveryLocation) {
          const deliveryMarkerEl = document.createElement('div')
          deliveryMarkerEl.className = 'delivery-marker'
          deliveryMarkerEl.innerHTML = '📍'
          deliveryMarkerEl.style.fontSize = '32px'
          deliveryMarkerEl.style.cursor = 'pointer'

          new mapboxgl.Marker(deliveryMarkerEl)
            .setLngLat([deliveryLocation.longitude, deliveryLocation.latitude])
            .setPopup(
              new mapboxgl.Popup({ offset: 25 })
                .setHTML(`
                  <div style="padding: 8px;">
                    <strong>Delivery Location</strong>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">${deliveryLocation.address || 'Your address'}</p>
                  </div>
                `)
            )
            .addTo(map.current!)

          // If both locations exist, draw a route line and fit bounds
          if (storeLocation) {
            const bounds = new mapboxgl.LngLatBounds()
            bounds.extend([storeLocation.longitude, storeLocation.latitude])
            bounds.extend([deliveryLocation.longitude, deliveryLocation.latitude])
            
            map.current!.fitBounds(bounds, {
              padding: 80,
              maxZoom: 15
            })

            // Add a simple line between store and delivery
            map.current!.addSource('route', {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates: [
                    [storeLocation.longitude, storeLocation.latitude],
                    [deliveryLocation.longitude, deliveryLocation.latitude]
                  ]
                }
              }
            })

            map.current!.addLayer({
              id: 'route',
              type: 'line',
              source: 'route',
              layout: {
                'line-join': 'round',
                'line-cap': 'round'
              },
              paint: {
                'line-color': '#FF6B35',
                'line-width': 4,
                'line-opacity': 0.8
              }
            })
          }
        }
      })
    } catch (error) {
      console.error('Map initialization error:', error)
      setMapError('Failed to load map')
    }

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [storeLocation, deliveryLocation])

  if (mapError) {
    return (
      <div className={`bg-gray-800 border border-gray-700 rounded-xl flex items-center justify-center ${className}`}>
        <p className="text-gray-400 text-sm">{mapError}</p>
      </div>
    )
  }

  return (
    <div 
      ref={mapContainer} 
      className={`rounded-xl overflow-hidden ${className}`}
      style={{ minHeight: '300px' }}
    />
  )
}
