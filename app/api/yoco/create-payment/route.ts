import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { amount, currency = 'ZAR', metadata } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    // Check if Yoco secret key is configured
    const secretKey = process.env.YOCO_SECRET_KEY
    console.log('YOCO_SECRET_KEY exists:', !!secretKey)
    console.log('YOCO_SECRET_KEY starts with sk_test:', secretKey?.startsWith('sk_test_'))
    
    if (!secretKey) {
      console.error('YOCO_SECRET_KEY is not configured')
      return NextResponse.json(
        { error: 'Payment service not configured. Please check environment variables.' },
        { status: 500 }
      )
    }

    console.log('Creating Yoco payment for amount:', amount)

    const response = await fetch('https://payments.yoco.com/api/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        metadata,
        successUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/customer/orders?success=true`,
        cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/customer/checkout`,
        failureUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/customer/checkout?error=payment_failed`,
      }),
    })

    const data = await response.json()
    
    console.log('Yoco response status:', response.status)
    console.log('Yoco response:', JSON.stringify(data, null, 2))

    if (!response.ok) {
      console.error('Yoco error:', data)
      throw new Error(data.message || JSON.stringify(data) || 'Failed to create payment')
    }

    return NextResponse.json({
      checkoutId: data.id,
      redirectUrl: data.redirectUrl,
    })
  } catch (error: any) {
    console.error('Yoco payment creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create payment' },
      { status: 500 }
    )
  }
}
