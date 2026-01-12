import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    
    console.log('Yoco webhook received:', payload)

    // Verify webhook signature (if Yoco provides one)
    // const signature = request.headers.get('x-yoco-signature')
    // Implement signature verification here

    const { type, payload: eventPayload } = payload

    if (type === 'payment.succeeded' || type === 'checkout.succeeded') {
      const { id, amount, currency, metadata } = eventPayload

      // Extract order IDs from metadata
      const orderIds = metadata?.orderIds || []
      
      if (orderIds.length > 0) {
        // Update all orders to paid status
        const { error: updateError } = await supabase
          .from('orders')
          .update({ 
            payment_status: 'paid',
            updated_at: new Date().toISOString()
          })
          .in('id', orderIds)

        if (updateError) {
          console.error('Error updating order payment status:', updateError)
          throw updateError
        }

        console.log(`Updated ${orderIds.length} order(s) to paid status`)
      }

      return NextResponse.json({ received: true, processed: orderIds.length })
    }

    if (type === 'payment.failed' || type === 'checkout.failed') {
      const { metadata } = eventPayload
      const orderIds = metadata?.orderIds || []

      if (orderIds.length > 0) {
        const { error: updateError } = await supabase
          .from('orders')
          .update({ 
            payment_status: 'failed',
            updated_at: new Date().toISOString()
          })
          .in('id', orderIds)

        if (updateError) {
          console.error('Error updating order payment status:', updateError)
        }
      }

      return NextResponse.json({ received: true })
    }

    // For other event types, just acknowledge receipt
    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
