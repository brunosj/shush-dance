import { NextRequest, NextResponse } from 'next/server';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, currency = 'eur', customerData } = body;

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        customerEmail: customerData?.email,
        customerName: `${customerData?.firstName} ${customerData?.lastName}`,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
