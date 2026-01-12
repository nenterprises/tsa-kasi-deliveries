import { NextRequest, NextResponse } from 'next/server'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

/**
 * GET /api/mapbox/search
 * Search for addresses with autocomplete
 * 
 * Query params:
 * - q: string (required) - search query
 * - proximity: string (optional) - lng,lat for biasing results
 * - limit: number (optional) - max results (default: 5)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const proximity = searchParams.get('proximity')
  const limit = searchParams.get('limit') || '5'
  
  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter is required' },
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
    const params = new URLSearchParams({
      access_token: MAPBOX_TOKEN,
      country: 'ZA', // South Africa only
      types: 'address,place',
      limit,
      autocomplete: 'true'
    })
    
    if (proximity) {
      params.append('proximity', proximity)
    }
    
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params}`
    )
    
    if (!response.ok) {
      throw new Error('Mapbox API error')
    }
    
    const data = await response.json()
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Address search error:', error)
    return NextResponse.json(
      { error: 'Failed to search addresses' },
      { status: 500 }
    )
  }
}
