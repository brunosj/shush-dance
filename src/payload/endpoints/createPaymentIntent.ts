import { Endpoint } from 'payload/config';
import Stripe from 'stripe';

export const createPaymentIntentEndpoint: Endpoint = {
  path: '/create-payment-intent',
  method: 'post',
  handler: async (req, res) => {
    try {
      console.log('Payload endpoint: POST /api/create-payment-intent called');

      // Check environment variable
      if (!process.env.STRIPE_SECRET_KEY) {
        console.error('STRIPE_SECRET_KEY not found');
        return res.status(500).json({
          error: 'Stripe configuration missing',
        });
      }

      // Initialize Stripe
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

      const { amount, currency = 'eur', customerData } = req.body;

      console.log('Request data:', {
        hasAmount: !!amount,
        amount: amount,
        currency: currency,
      });

      // Validate required fields
      if (!amount || typeof amount !== 'number' || amount <= 0) {
        console.error('Invalid amount:', amount);
        return res.status(400).json({
          error: 'Valid amount is required',
        });
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

      return res.status(200).json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    } catch (error: any) {
      console.error('Stripe payment intent error:', error);
      return res.status(500).json({
        error: 'Failed to create payment intent',
        details: error.message,
      });
    }
  },
};
