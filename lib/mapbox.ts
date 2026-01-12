/**
 * Mapbox Integration Utilities
 * Free tier: 100,000 requests/month
 * Better pricing than Google Maps
 */

export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ''

// Default center: Modimolle, South Africa
export const DEFAULT_CENTER: [number, number] = [28.4206, -24.6958]
export const DEFAULT_ZOOM = 13

export interface MapboxFeature {
  id: string
  type: string
  place_type: string[]
  relevance: number
  properties: {
    accuracy?: string
    address?: string
  }
  text: string
  place_name: string
  center: [number, number]
  geometry: {
    type: string
    coordinates: [number, number]
  }
  context?: Array<{
    id: string
    text: string
    short_code?: string
  }>
}

export interface MapboxGeocodingResponse {
  type: string
  query: string[]
  features: MapboxFeature[]
  attribution: string
}

export interface Address {
  formatted: string
  street?: string
  streetNumber?: string
  locality?: string // City/Town
  region?: string // Province
  postalCode?: string
  country?: string
  latitude: number
  longitude: number
}

/**
 * Search for addresses using Mapbox Geocoding API
 * @param query - Address search query
 * @param proximity - Bias results near this location [lng, lat]
 * @param bbox - Bounding box to limit search area [minLng, minLat, maxLng, maxLat]
 */
export async function searchAddresses(
  query: string,
  options?: {
    proximity?: [number, number]
    bbox?: [number, number, number, number]
    limit?: number
  }
): Promise<MapboxFeature[]> {
  const { proximity = DEFAULT_CENTER, bbox, limit = 5 } = options || {}
  
  const params = new URLSearchParams({
    access_token: MAPBOX_TOKEN,
    limit: limit.toString(),
    country: 'ZA', // Limit to South Africa
    types: 'address,place', // Allow addresses and places
    proximity: proximity.join(','),
  })
  
  if (bbox) {
    params.append('bbox', bbox.join(','))
  }
  
  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params}`
  )
  
  if (!response.ok) {
    throw new Error('Failed to search addresses')
  }
  
  const data: MapboxGeocodingResponse = await response.json()
  return data.features
}

/**
 * Reverse geocode: Convert GPS coordinates to address
 * @param longitude 
 * @param latitude 
 */
export async function reverseGeocode(
  longitude: number,
  latitude: number
): Promise<Address | null> {
  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}&types=address&limit=1`
  )
  
  if (!response.ok) {
    throw new Error('Failed to reverse geocode')
  }
  
  const data: MapboxGeocodingResponse = await response.json()
  
  if (data.features.length === 0) {
    return null
  }
  
  return parseMapboxFeature(data.features[0])
}

/**
 * Forward geocode: Convert address to GPS coordinates
 * @param address - Address string
 */
export async function forwardGeocode(address: string): Promise<Address | null> {
  const features = await searchAddresses(address, { limit: 1 })
  
  if (features.length === 0) {
    return null
  }
  
  return parseMapboxFeature(features[0])
}

/**
 * Parse Mapbox feature into standardized Address format
 */
export function parseMapboxFeature(feature: MapboxFeature): Address {
  const [longitude, latitude] = feature.center
  
  // Extract address components from context
  let street = feature.text
  let streetNumber = ''
  let locality = ''
  let region = ''
  let postalCode = ''
  let country = 'South Africa'
  
  // Check if properties has address (street number)
  if (feature.properties?.address) {
    streetNumber = feature.properties.address
  }
  
  // Parse context for locality, region, postcode
  if (feature.context) {
    feature.context.forEach(ctx => {
      if (ctx.id.startsWith('place')) {
        locality = ctx.text
      } else if (ctx.id.startsWith('region')) {
        region = ctx.text
      } else if (ctx.id.startsWith('postcode')) {
        postalCode = ctx.text
      } else if (ctx.id.startsWith('country')) {
        country = ctx.text
      }
    })
  }
  
  return {
    formatted: feature.place_name,
    street,
    streetNumber,
    locality,
    region,
    postalCode,
    country,
    latitude,
    longitude
  }
}

/**
 * Calculate distance between two GPS coordinates (Haversine formula)
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  
  return distance
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Get delivery fee based on distance
 * Customize these rates as needed
 */
export function calculateDeliveryFee(distanceKm: number): number {
  if (distanceKm <= 2) return 15 // R15 for <= 2km
  if (distanceKm <= 5) return 25 // R25 for <= 5km
  if (distanceKm <= 10) return 40 // R40 for <= 10km
  if (distanceKm <= 15) return 60 // R60 for <= 15km
  return 60 + Math.ceil(distanceKm - 15) * 5 // R5 per km after 15km
}

/**
 * Bounding box for Modimolle area
 * [minLng, minLat, maxLng, maxLat]
 */
export const MODIMOLLE_BBOX: [number, number, number, number] = [
  28.30, -24.80, // Southwest
  28.55, -24.60  // Northeast
]

/**
 * Check if coordinates are within service area
 */
export function isWithinServiceArea(
  latitude: number,
  longitude: number,
  bbox = MODIMOLLE_BBOX
): boolean {
  const [minLng, minLat, maxLng, maxLat] = bbox
  return (
    longitude >= minLng &&
    longitude <= maxLng &&
    latitude >= minLat &&
    latitude <= maxLat
  )
}
