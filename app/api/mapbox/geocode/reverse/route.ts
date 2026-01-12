import { NextRequest, NextResponse } from 'next/server'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

/**
 * GET /api/mapbox/geocode/reverse
 * Convert GPS coordinates to address
 * 
 * Query params:
 * - lng: number (required)
 * - lat: number (required)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const lng = searchParams.get('lng')
  const lat = searchParams.get('lat')
  
  if (!lng || !lat) {
    return NextResponse.json(
      { error: 'Longitude and latitude parameters are required' },
      { status: 400 }
    )
  }
  
  if (!MAPBOX_TOKEN) {
    return NextResponse.json(
      { error: 'Mapbox token not configured' },
      { status: 500 }
    )
  }
  
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?` +
      new URLSearchParams({
        access_token: MAPBOX_TOKEN,
        types: 'address',
        limit: '1'
      })
    )
    
    if (!response.ok) {
      throw new Error('Mapbox API error')
    }
    
    const data = await response.json()
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    return NextResponse.json(
      { error: 'Failed to reverse geocode coordinates' },
      { status: 500 }
    )
  }
}
