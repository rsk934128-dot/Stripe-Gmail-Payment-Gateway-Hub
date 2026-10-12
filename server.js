require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const Stripe = require('stripe');

const app = express();

// Helper to get active Stripe client safely
const getStripe = (req) => {
  const key = (req && req.headers && req.headers['x-stripe-secret-key']) || process.env.STRIPE_SECRET_KEY;
  if (!key || !key.startsWith('sk_') || key.includes('your_secret_key_here')) {
    return null;
  }
  return Stripe(key);
};

app.use(cors());
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'dist')));

// ১. ফ্রন্টএন্ডে Publishable Key পাঠানোর রাউট
app.get('/api/config', (req, res) => {
  const pubKey = process.env.STRIPE_PUBLISHABLE_KEY || '';
  const isPubValid = pubKey.startsWith('pk_') && !pubKey.includes('your_publishable_key_here');
  res.json({
    publishableKey: isPubValid ? pubKey : '',
    hasServerSecretKey: Boolean(getStripe(req)),
  });
});

// ২. Secret Key যাচাইকরণ রাউট (GET & POST)
const handleVerifyKey = async (req, res) => {
  try {
    const stripe = getStripe(req);
    if (!stripe) {
      return res.status(400).json({
        success: false,
        error: 'কোনো বৈধ Secret Key পাওয়া যায়নি। দয়া করে sk_test_... বা sk_live_... দিয়ে শুরু হওয়া কী দিন।',
      });
    }

    const balance = await stripe.balance.retrieve();
    res.json({
      success: true,
      message: 'API Key সম্পূর্ণ সঠিক এবং কার্যকর!',
      livemode: balance.livemode ? 'Live Mode' : 'Test Mode',
      available: balance.available,
      pending: balance.pending,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
app.get('/api/verify-key', handleVerifyKey);
app.post('/api/verify-key', handleVerifyKey);

// ৩. Payment Intent তৈরি
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency, description, customerEmail } = req.body;
    const stripe = getStripe(req);

    if (!stripe) {
      // Simulation mode fallback
      const simId = 'pi_sim_' + Math.random().toString(36).substring(2, 11);
      return res.json({
        clientSecret: `${simId}_secret_${Math.random().toString(36).substring(2, 15)}`,
        paymentIntentId: simId,
        amount: amount || 1000,
        currency: currency || 'usd',
        status: 'requires_payment_method',
        isSimulation: true,
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(amount) || 1000),
      currency: (currency || 'usd').toLowerCase(),
      description: description || 'PaymentHub Charge',
      receipt_email: customerEmail || undefined,
      automatic_payment_methods: { enabled: true },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      isSimulation: false,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ৪. সাবস্ক্রিপশন তৈরি
app.post('/api/create-subscription', async (req, res) => {
  try {
    const { email, priceId, planName } = req.body;
    const stripe = getStripe(req);

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

    const customer = await stripe.customers.create({ email });
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    const invoice = subscription.latest_invoice;
    const paymentIntent = invoice && invoice.payment_intent;

    res.json({
      subscriptionId: subscription.id,
      customerId: customer.id,
      clientSecret: paymentIntent ? paymentIntent.client_secret : null,
      status: subscription.status,
      isSimulation: false,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Helper to validate genuine Stripe webhook secret format
const isRealWebhookSecret = (secret) => {
  return Boolean(
    secret &&
    secret.startsWith('whsec_') &&
    !secret.includes('your_webhook_secret_here') &&
    !secret.includes('placeholder')
  );
};

// ৫. Webhook লিসেনার (POST /webhook ও POST /api/webhook)
const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event = req.body;
  let signatureVerified = false;

  const rawPayload = req.rawBody || (typeof req.body === 'string' ? Buffer.from(req.body) : Buffer.from(JSON.stringify(req.body || {})));

  if (isRealWebhookSecret(webhookSecret) && sig && rawPayload) {
    try {
      const stripe = getStripe(req) || Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');
      event = stripe.webhooks.constructEvent(rawPayload, sig, webhookSecret);
      signatureVerified = true;
    } catch (err) {
      console.warn(`[Webhook Notice] Signature check notice: ${err.message}`);
      return res.status(400).json({
        success: false,
        error: `Webhook signature verification failed: ${err.message}`,
        hint: 'Ensure STRIPE_WEBHOOK_SECRET matches the signing secret in Stripe Dashboard or Stripe CLI (`stripe listen`).',
      });
    }
  }

  if (event && event.type === 'payment_intent.succeeded') {
    const pi = event.data && event.data.object ? event.data.object : {};
    const formattedAmount = typeof pi.amount === 'number' ? (pi.amount / 100).toFixed(2) : '0.00';
    const curr = (pi.currency || 'usd').toUpperCase();
    const emailInfo = pi.receipt_email ? ` | রসিদ প্রাপক: ${pi.receipt_email}` : '';
    console.log(`✅ পেমেন্ট সফল (${pi.id || 'unknown'}): $${formattedAmount} ${curr}${emailInfo}`);
  } else if (event && event.type === 'payment_intent.payment_failed') {
    const objId = event.data && event.data.object ? event.data.object.id : 'unknown';
    const reason = event.data?.object?.last_payment_error?.message || event.data?.object?.last_payment_error?.code || 'Card declined';
    console.log(`❌ পেমেন্ট ব্যর্থ হয়েছে (${objId}): ${reason}`);
  }

  res.json({
    received: true,
    eventType: event ? event.type : 'unknown',
    verified: signatureVerified,
  });
};

app.post('/webhook', handleWebhook);
app.post('/api/webhook', handleWebhook);

// Retrieve checkout session details
app.get('/api/checkout-session/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const stripe = getStripe(req) || Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');
    const session = await stripe.checkout.sessions.retrieve(id, {
      expand: ['payment_intent', 'line_items'],
    });

    const paymentIntent = typeof session.payment_intent === 'object' ? session.payment_intent : null;
    const customerEmail = session.customer_details && session.customer_details.email ? session.customer_details.email : (session.customer_email || '');
    const customerName = session.customer_details && session.customer_details.name ? session.customer_details.name : 'Customer';
    const amount = session.amount_total || (paymentIntent ? paymentIntent.amount : 2500);

    res.json({
      id: session.id,
      amount,
      currency: session.currency || 'usd',
      customerEmail,
      customerName,
      status: session.payment_status === 'paid' ? 'succeeded' : session.payment_status,
      paymentIntentId: paymentIntent ? paymentIntent.id : session.id,
      isSimulation: false,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

let serverVirtualCard = {
  id: 'card_iss_928194',
  cardholderName: 'RUBEL BANK USER',
  cardNumber: '4532 8921 7384 9201',
  rawCardNumber: '4532892173849201',
  expiryDate: '09/29',
  cvv: '842',
  network: 'visa',
  balanceUsd: 250.00,
  exchangeRateBdt: 122.50,
  isFrozen: false,
};

let serverCardTransactions = [];

app.get('/api/virtual-card', (req, res) => {
  res.json({ card: serverVirtualCard, transactions: serverCardTransactions });
});

app.post('/api/virtual-card/authorize-payment', (req, res) => {
  const { merchant, amountUsd, amountBdt, platformCategory, referenceNo } = req.body;
  let parsedUsd = Number(amountUsd) || 0;
  let parsedBdt = Number(amountBdt) || 0;

  if (!parsedUsd && parsedBdt) {
    parsedUsd = Math.round((parsedBdt / serverVirtualCard.exchangeRateBdt) * 100) / 100;
  } else if (parsedUsd && !parsedBdt) {
    parsedBdt = Math.round(parsedUsd * serverVirtualCard.exchangeRateBdt);
  }

  if (serverVirtualCard.isFrozen) {
    return res.status(403).json({ success: false, error: 'কার্ডটি লক (Frozen) করা রয়েছে।' });
  }

  if (serverVirtualCard.balanceUsd < parsedUsd) {
    return res.status(402).json({
      success: false,
      error: `কার্ডে পর্যাপ্ত ব্যালেন্স নেই। প্রয়োজন: $${parsedUsd.toFixed(2)} (৳${parsedBdt.toLocaleString()}), বর্তমান ব্যালেন্স: $${serverVirtualCard.balanceUsd.toFixed(2)}।`,
    });
  }

  serverVirtualCard.balanceUsd = Math.round((serverVirtualCard.balanceUsd - parsedUsd) * 100) / 100;
  const newTx = {
    id: 'tx_' + Math.random().toString(36).substring(2, 9),
    merchant: merchant || 'Online Gateway Payment',
    platformCategory: platformCategory || 'other',
    referenceNo: referenceNo || 'REF-' + Date.now().toString().slice(-6),
    amountUsd: parsedUsd,
    amountBdt: parsedBdt,
    type: 'debit',
    status: 'approved',
    timestamp: new Date().toISOString(),
    remainingBalanceUsd: serverVirtualCard.balanceUsd,
  };
  serverCardTransactions.unshift(newTx);

  res.json({ success: true, card: serverVirtualCard, transaction: newTx });
});

app.get('/api/payment-intents', async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || 50), 10)));
    const stripe = getStripe(req) || Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');
    let items = [];
    if (stripe) {
      try {
        const stripeRes = await stripe.paymentIntents.list({ limit });
        if (stripeRes && stripeRes.data) {
          items = stripeRes.data.map((pi) => {
            const isSuccess = pi.status === 'succeeded';
            const isFailed = pi.status === 'requires_payment_method' || pi.status === 'canceled' || Boolean(pi.last_payment_error);
            const createdSec = pi.created || Math.floor(Date.now() / 1000);
            const dateObj = new Date(createdSec * 1000);
            return {
              id: pi.id,
              amount: pi.amount / 100,
              amountRaw: pi.amount,
              currency: (pi.currency || 'usd').toUpperCase(),
              status: pi.status,
              isSuccess,
              isFailed,
              created: createdSec,
              createdAt: dateObj.toISOString(),
              timestamp: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              dateFormatted: dateObj.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' }),
              customerEmail: pi.receipt_email || (pi.metadata && pi.metadata.customerEmail) || '',
              customerName: (pi.metadata && pi.metadata.customerName) || 'Customer',
              description: pi.description || 'Stripe Payment Intent',
              lastPaymentError: pi.last_payment_error ? {
                code: pi.last_payment_error.code,
                message: pi.last_payment_error.message,
                declineCode: pi.last_payment_error.decline_code,
              } : null,
              livemode: Boolean(pi.livemode),
            };
          });
        }
      } catch (err) {
        console.warn('Stripe list error:', err.message);
      }
    }
    const totalCount = items.length;
    const succeededCount = items.filter((i) => i.isSuccess).length;
    const failedCount = items.filter((i) => i.isFailed).length;
    const totalVolumeUsd = items.filter((i) => i.isSuccess).reduce((acc, i) => acc + i.amount, 0);

    res.json({
      success: true,
      data: items,
      summary: {
        totalCount,
        succeededCount,
        failedCount,
        totalVolumeUsd,
        successRate: totalCount > 0 ? Math.round((succeededCount / totalCount) * 100) : 0,
      },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/transaction-logs', (req, res) => {
  return app._router.handle({ ...req, url: '/api/payment-intents' }, res);
});

// SPA Fallback for static builds
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'), (err) => {
    if (err) {
      res.sendFile(path.join(__dirname, 'public', 'index.html'), (err2) => {
        if (err2) res.send('PaymentHub Server Running');
      });
    }
  });
});

const PORT = process.env.PORT || 3000;
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`✅ সার্ভার চালু হয়েছে: http://localhost:${PORT}`);
  });
}

module.exports = app;
