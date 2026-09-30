import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Support raw body for webhook verification
app.use(express.json({
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true }));

// Helper to get active Stripe instance
const getStripeInstance = (req: Request): Stripe | null => {
  const secretKey = (req.headers['x-stripe-secret-key'] as string) || process.env.STRIPE_SECRET_KEY;
  if (!secretKey || !secretKey.startsWith('sk_')) {
    return null;
  }
  return new Stripe(secretKey, {
    apiVersion: '2025-02-24.acacia' as any,
  });
};

// 1. Config endpoint
app.get('/api/config', (_req: Request, res: Response) => {
  res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    hasServerSecretKey: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_')),
  });
});

// 2. Verify Stripe Secret Key
app.post('/api/verify-key', async (req: Request, res: Response) => {
  try {
    const stripe = getStripeInstance(req);
    if (!stripe) {
      return res.status(400).json({
        success: false,
        error: 'কোনো বৈধ Secret Key পাওয়া যায়নি। দয়া করে sk_test_... বা sk_live_... দিয়ে শুরু হওয়া কী দিন।',
      });
    }

    const [balance, account] = await Promise.all([
      stripe.balance.retrieve(),
      (stripe as any).accounts?.retrieve?.().catch(() => null),
    ]);

    return res.json({
      success: true,
      message: 'API Key সম্পূর্ণ সঠিক এবং সক্রিয়!',
      livemode: balance.livemode,
      mode: balance.livemode ? 'Live Mode' : 'Test Mode',
      accountId: account?.id || 'Connected Account',
      businessName: account?.business_profile?.name || account?.settings?.dashboard?.display_name || 'Stripe Account',
      defaultCurrency: account?.default_currency || 'usd',
      available: balance.available,
      pending: balance.pending,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error.message || 'API Key যাচাইকরণ ব্যর্থ হয়েছে',
      code: error.code || 'authentication_error',
    });
  }
});

// 3. Create Payment Intent
app.post('/api/create-payment-intent', async (req: Request, res: Response) => {
  try {
    const { amount, currency = 'usd', description, customerEmail, metadata } = req.body;
    const stripe = getStripeInstance(req);

    if (!stripe) {
      // Return simulated intent if no valid key provided
      const simId = 'pi_sim_' + Math.random().toString(36).substring(2, 11);
      return res.json({
        clientSecret: `${simId}_secret_${Math.random().toString(36).substring(2, 15)}`,
        paymentIntentId: simId,
        amount: amount || 1000,
        currency: currency.toLowerCase(),
        status: 'requires_payment_method',
        isSimulation: true,
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(amount) || 1000),
      currency: (currency || 'usd').toLowerCase(),
      description: description || 'Stripe Test Panel Payment',
      receipt_email: customerEmail || undefined,
      automatic_payment_methods: { enabled: true },
      metadata: metadata || { source: 'stripe-gmail-gateway-tester' },
    });

    return res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      isSimulation: false,
    });
  } catch (error: any) {
    return res.status(400).json({
      error: error.message || 'Payment Intent তৈরি করতে ব্যর্থ হয়েছে',
    });
  }
});

// 4. Create Subscription
app.post('/api/create-subscription', async (req: Request, res: Response) => {
  try {
    const { email, priceId, planName } = req.body;
    const stripe = getStripeInstance(req);

    if (!stripe) {
      const subId = 'sub_sim_' + Math.random().toString(36).substring(2, 10);
      const custId = 'cus_sim_' + Math.random().toString(36).substring(2, 10);
      return res.json({
        subscriptionId: subId,
        customerId: custId,
        clientSecret: `pi_sim_${Math.random().toString(36).substring(2, 9)}_secret_${Math.random().toString(36).substring(2, 12)}`,
        status: 'active',
        plan: planName || 'Pro Plan ($29/month)',
        isSimulation: true,
      });
    }

    // 1. Create or retrieve customer
    let customer;
    const existing = await stripe.customers.list({ email, limit: 1 });
    if (existing.data.length > 0) {
      customer = existing.data[0];
    } else {
      customer = await stripe.customers.create({ email });
    }

    // 2. Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    const invoice = subscription.latest_invoice as any;
    const paymentIntent = invoice?.payment_intent as Stripe.PaymentIntent | undefined;

    return res.json({
      subscriptionId: subscription.id,
      customerId: customer.id,
      clientSecret: paymentIntent?.client_secret,
      status: subscription.status,
      isSimulation: false,
    });
  } catch (error: any) {
    return res.status(400).json({
      error: error.message || 'সাবস্ক্রিপশন তৈরি ব্যর্থ হয়েছে',
    });
  }
});

// 5. Stripe Webhook Listener
app.post('/api/webhook', async (req: any, res: Response) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: any;

  if (webhookSecret && sig && req.rawBody) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
        apiVersion: '2025-02-24.acacia' as any,
      });
      event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
    } catch (err: any) {
      console.error(`⚠️ Webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  } else {
    // Simulated or direct event payload
    event = req.body;
  }

  const eventType = event.type || 'unknown';
  console.log(`[Stripe Webhook Received] Type: ${eventType}, ID: ${event.id}`);

  return res.json({
    received: true,
    eventType,
    eventId: event.id || 'evt_simulated',
    timestamp: new Date().toISOString(),
  });
});

// Vite Middleware integration in dev or static files in prod
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`🚀 Stripe & Gmail Gateway Hub running at http://localhost:${PORT}`);
  });
}

startServer();
