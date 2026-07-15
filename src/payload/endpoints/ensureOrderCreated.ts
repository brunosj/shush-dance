import { Endpoint } from 'payload/config';
import Stripe from 'stripe';
import { processStripeOrderSuccess } from '../utils/processStripeOrder';
import { readValidatedOrderDataFromMetadata } from '../utils/validateOrderData';

let stripeInstance: Stripe | null = null;
const getStripeInstance = (): Stripe => {
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-08-27.basil',
      maxNetworkRetries: 3,
      timeout: 10000,
    });
  }
  return stripeInstance;
};

export const ensureOrderCreatedEndpoint: Endpoint = {
  path: '/ensure-order-created',
  method: 'post',
  handler: async (req, res) => {
    try {
      const { paymentIntentId } = req.body;

      if (!paymentIntentId) {
        return res.status(400).json({
          error: 'Payment intent ID required',
        });
      }

      console.log(
        `🔍 Fallback: Checking if order exists for payment intent: ${paymentIntentId}`
      );

      const stripe = getStripeInstance();
      let paymentMethodType = 'unknown';
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== 'succeeded') {
        return res.json({
          success: true,
          message: `Payment not yet completed (status: ${paymentIntent.status})`,
          webhookWorked: true,
          deferred: true,
        });
      }

      const validatedOrderData = readValidatedOrderDataFromMetadata(
        paymentIntent.metadata
      );
      const expectedAmount = Math.round(validatedOrderData.totals.total * 100);
      if (
        paymentIntent.currency !== 'eur' ||
        paymentIntent.amount_received !== expectedAmount
      ) {
        return res.status(400).json({
          error: 'Paid amount or currency does not match validated order',
        });
      }

      if (paymentIntent.payment_method) {
        const paymentMethod = await stripe.paymentMethods.retrieve(
          paymentIntent.payment_method as string
        );
        paymentMethodType = paymentMethod.type;
      }
      const detectedPaymentMethod =
        paymentMethodType === 'paypal' ? 'paypal' : 'stripe';
      const orderNumber = `SHUSH-ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const result = await processStripeOrderSuccess(
        req.payload,
        paymentIntentId,
        validatedOrderData,
        detectedPaymentMethod,
        orderNumber,
        { emailSubjectSuffix: ' (Fallback)' }
      );

      console.log('🎉 Fallback order creation completed successfully');

      return res.json({
        success: true,
        message: result.created
          ? 'Fallback order created successfully'
          : 'Order already exists',
        webhookWorked: !result.created,
      });
    } catch (error: any) {
      console.error('❌ Fallback order creation failed:', error);
      return res.status(500).json({
        error: 'Failed to ensure order creation',
        details: error.message,
      });
    }
  },
};
