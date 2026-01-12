import { NextRequest, NextResponse } from 'next/server'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

/**
 * GET /api/mapbox/geocode/forward
 * Convert address to GPS coordinates
 * 
 * Query params:
 * - address: string (required)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')
  
  if (!address) {
    return NextResponse.json(
      { error: 'Address parameter is required' },
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
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?` +
      new URLSearchParams({
        access_token: MAPBOX_TOKEN,
        country: 'ZA',
        types: 'address,place',
        limit: '1'
      })
    )
    
    if (!response.ok) {
      throw new Error('Mapbox API error')
    }
    
    const data = await response.json()
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Forward geocoding error:', error)
    return NextResponse.json(
      { error: 'Failed to geocode address' },
      { status: 500 }
    )
  }
}
