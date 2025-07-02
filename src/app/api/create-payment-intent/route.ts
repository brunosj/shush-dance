import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  console.log('POST /api/create-payment-intent called');

  try {
    // Check environment variable
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY not found');
      return NextResponse.json(
        { error: 'Stripe configuration missing' },
        { status: 500 }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Parse request body
    let requestData;
    try {
      requestData = await request.json();
      console.log('Request data parsed:', {
        hasAmount: !!requestData?.amount,
        amount: requestData?.amount,
        currency: requestData?.currency,
      });
    } catch (error) {
      console.error('JSON parse error:', error);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { amount, currency = 'eur', customerData } = requestData;

    // Validate required fields
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      console.error('Invalid amount:', amount);
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      );
    }

    // Create payment intent
    console.log('Creating Stripe payment intent...');
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        customerEmail: customerData?.email || '',
        customerName:
          `${customerData?.firstName || ''} ${customerData?.lastName || ''}`.trim(),
      },
    });

    console.log('Payment intent created successfully:', paymentIntent.id);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    console.error('Stripe payment intent error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create payment intent',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
