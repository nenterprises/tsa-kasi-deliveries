import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// TEST ONLY - Manually mark orders as paid
export async function POST(request: NextRequest) {
  try {
    const { orderIds } = await request.json()

    if (!orderIds || orderIds.length === 0) {
      return NextResponse.json({ error: 'No order IDs provided' }, { status: 400 })
    }

    const { error } = await supabase
      .from('orders')
      .update({ 
        payment_status: 'paid',
        updated_at: new Date().toISOString()
      })
      .in('id', orderIds)

    if (error) throw error

    return NextResponse.json({ 
      success: true, 
      updated: orderIds.length,
      message: 'Orders marked as paid' 
    })
  } catch (error: any) {
    console.error('Error updating orders:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET - Mark all pending orders from last 5 minutes as paid
export async function GET() {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

    const { data: orders } = await supabase
      .from('orders')
      .select('id')
      .eq('payment_status', 'pending')
      .eq('payment_method', 'yoco')
      .gte('created_at', fiveMinutesAgo)

    if (!orders || orders.length === 0) {
      return NextResponse.json({ message: 'No recent pending orders found' })
    }

    const orderIds = orders.map(o => o.id)

    const { error } = await supabase
      .from('orders')
      .update({ 
        payment_status: 'paid',
        updated_at: new Date().toISOString()
      })
      .in('id', orderIds)

    if (error) throw error

    return NextResponse.json({ 
      success: true, 
      updated: orderIds.length,
      orderIds,
      message: `Marked ${orderIds.length} recent order(s) as paid` 
    })
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
