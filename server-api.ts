import express, { Request, Response } from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();

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

// Helper to create Stripe Checkout Session with 'link' enabled
async function createCheckoutSession(
  stripe: Stripe | null,
  req: Request,
  itemId: string,
  amount: number,
  customerEmail?: string
) {
  const normalizedAmount = Math.max(1, Number(amount) || 10);
  const unitAmount = Math.round(normalizedAmount * 100);

  if (stripe) {
    const origin = `${req.protocol}://${req.get('host') || 'localhost:3000'}`;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'link'],
      customer_email: customerEmail || undefined,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: itemId,
              description: 'AI Agent Generated Payment Session with Stripe Link',
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?status=cancelled`,
    });

    return {
      status: 'success',
      checkoutUrl: session.url || `https://checkout.stripe.com/c/pay/${session.id}#link_enabled`,
      sessionId: session.id,
      itemId,
      amount: normalizedAmount,
      isSimulation: false,
    };
  } else {
    const simId = 'cs_test_sim_' + Math.random().toString(36).substring(2, 12);
    return {
      status: 'success',
      checkoutUrl: `https://checkout.stripe.com/pay/${simId}#link_one_click`,
      sessionId: simId,
      itemId,
      amount: normalizedAmount,
      isSimulation: true,
    };
  }
}

// Fallback intelligent agent when external API key is in simulation mode
async function processHeuristicAgent(message: string, email: string, stripe: Stripe | null, req: Request) {
  const lower = message.toLowerCase();
  const isBuyIntent =
    lower.includes('কিনতে') ||
    lower.includes('কিনি') ||
    lower.includes('বাই') ||
    lower.includes('buy') ||
    lower.includes('order') ||
    lower.includes('pay') ||
    lower.includes('পেমেন্ট') ||
    lower.includes('link') ||
    lower.includes('প্যাকেজ') ||
    lower.includes('package') ||
    lower.includes('প্ল্যান') ||
    lower.includes('plan') ||
    lower.includes('সাবস্ক্রিপশন') ||
    lower.includes('pro') ||
    lower.includes('starter') ||
    lower.includes('credit') ||
    lower.includes('$') ||
    /\d+/.test(lower);

  if (isBuyIntent) {
    let itemId = 'Pro Package';
    let amount = 29;

    if (lower.includes('starter') || lower.includes('স্টার্টার') || lower.includes('9')) {
      itemId = 'Starter Kit';
      amount = 9.99;
    } else if (lower.includes('credit') || lower.includes('ক্রেডিট') || lower.includes('15')) {
      itemId = 'AI 10,000 Credits Pack';
      amount = 15;
    } else if (lower.includes('ultimate') || lower.includes('আল্টিমেট') || lower.includes('49')) {
      itemId = 'Ultimate AI Enterprise Plan';
      amount = 49;
    } else {
      const matchAmount = message.match(/\$?(\d+(\.\d{1,2})?)/);
      if (matchAmount && matchAmount[1]) {
        amount = parseFloat(matchAmount[1]);
      }
    }

    const toolResult = await createCheckoutSession(stripe, req, itemId, amount, email);
    return {
      aiResponseText: `আপনার পছন্দের "${itemId}" ($${amount}) প্যাকেজের জন্য স্বয়ংক্রিয়ভাবে Tool Use (Function Calling) এর মাধ্যমে নিরাপদ Stripe Checkout Link তৈরি করা হয়েছে। নিচে দেওয়া নিরাপদ লিঙ্কে ক্লিক করে "Link by Stripe" দিয়ে এক ক্লিকে পেমেন্ট সম্পন্ন করতে পারবেন:`,
      toolCallExecuted: {
        name: 'generate_checkout_link',
        args: { item_id: itemId, amount, customer_email: email },
        result: toolResult,
      },
    };
  }

  return {
    aiResponseText:
      'হ্যালো! আমি আপনার এআই পেমেন্ট অ্যাসিস্ট্যান্ট (Stripe AI Agent)।\n\nআপনি চ্যাটে যেকোনো প্যাকেজ (যেমন: "আমি প্রো প্ল্যান $29 কিনতে চাই" বা "স্টার্টার প্যাক $9.99 এর পেমেন্ট লিঙ্ক দাও") উল্লেখ করলেই আমি Function Calling-এর মাধ্যমে সরাসরি Stripe Link তৈরি করে দেব। কার্ড নম্বর সরাসরি চ্যাটে শেয়ার করার কোনো প্রয়োজন নেই।',
    toolCallExecuted: null,
  };
}

// Health check endpoint for Vercel / server monitoring
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    environment: process.env.NODE_ENV || 'production',
    vercel: Boolean(process.env.VERCEL),
    timestamp: new Date().toISOString(),
  });
});

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

// 5b. Dedicated Backend Endpoint for 'generate_checkout_link' Tool Call
app.post('/api/generate-checkout-link', async (req: Request, res: Response) => {
  try {
    const { item_id, itemId, amount, customer_email, customerEmail } = req.body;
    const finalItemId = item_id || itemId || 'Pro Package';
    const finalAmount = Number(amount) || 29;
    const finalEmail = customer_email || customerEmail || 'customer@example.com';

    const stripe = getStripeInstance(req);
    const result = await createCheckoutSession(stripe, req, finalItemId, finalAmount, finalEmail);

    return res.json({
      status: 'success',
      checkout_url: result.checkoutUrl,
      checkoutUrl: result.checkoutUrl,
      session_id: result.sessionId,
      sessionId: result.sessionId,
      item_id: result.itemId,
      amount: result.amount,
      isSimulation: result.isSimulation,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to generate checkout link' });
  }
});

// 6. AI Agent Chat with Function Calling (Stripe Link / Checkout)
app.post('/api/ai-chat', async (req: Request, res: Response) => {
  try {
    const { message, history = [], customerEmail = 'customer@example.com' } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const stripe = getStripeInstance(req);
    const geminiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

    let aiResponseText = '';
    let toolCallExecuted: any = null;

    if (geminiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const contents: any[] = [];
        if (Array.isArray(history)) {
          for (const h of history.slice(-6)) {
            contents.push({
              role: h.role === 'user' ? 'user' : 'model',
              parts: [{ text: h.content }],
            });
          }
        }
        contents.push({
          role: 'user',
          parts: [{ text: message }],
        });

        const checkoutFunctionDeclaration = {
          name: 'generate_checkout_link',
          description:
            'Creates a secure Stripe Checkout Session or 1-Click Stripe Link payment URL when a customer intends or requests to buy, order, pay for, or subscribe to any product, package, or plan. Call this tool immediately whenever the user shows buying intent (e.g., "I want to buy Pro Plan", "প্যাকেজ কিনতে চাই", "পেমেন্ট লিংক দাও", "$29"). Never ask for credit card numbers directly.',
          parameters: {
            type: Type.OBJECT,
            properties: {
              item_id: {
                type: Type.STRING,
                description:
                  'The exact product name, subscription package, or service identifier requested by the user (e.g., "Pro Plan", "Starter Kit", "10,000 AI Credits", "Enterprise Plan"). Maps to the Stripe Checkout line item name.',
              },
              amount: {
                type: Type.NUMBER,
                description:
                  'The numeric purchase price in USD (e.g., 29.99, 9.99, 15.0, 49.0). Must be a positive decimal number representing unit price.',
              },
              customer_email: {
                type: Type.STRING,
                description:
                  'The customer email address for receipt delivery, Stripe customer linking, and 1-Click SMS authentication with Stripe Link.',
              },
              currency: {
                type: Type.STRING,
                description: 'The 3-letter ISO currency code. Defaults to "usd".',
              },
            },
            required: ['item_id', 'amount'],
          },
        };

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            systemInstruction:
              'তুমি একজন প্রফেশনাল এআই পেমেন্ট অ্যাসিস্ট্যান্ট (Stripe AI Agent)। ব্যবহারকারী কোনো প্রোডাক্ট বা সাবস্ক্রিপশন কিনতে চাইলে কখনো তাদের ক্রেডিট কার্ড নম্বর বা CVV জানতে চাইবে না। বরং সর্বদা "generate_checkout_link" টুলটি কল করে নিরাপদ Stripe Link বা Checkout Link তৈরি করে দেবে। বাংলায় চমৎকার ও বিশ্বস্ত ভাষায় উত্তর দেবে।',
            tools: [{ functionDeclarations: [checkoutFunctionDeclaration] }],
          },
        });

        const functionCalls = response.functionCalls;
        if (functionCalls && functionCalls.length > 0) {
          const call = functionCalls[0];
          if (call.name === 'generate_checkout_link') {
            const args = (call.args as any) || {};
            const itemId = args.item_id || 'Pro Membership';
            const amount = Number(args.amount) || 29;
            const email = args.customer_email || customerEmail;

            const toolResult = await createCheckoutSession(stripe, req, itemId, amount, email);
            toolCallExecuted = {
              name: 'generate_checkout_link',
              args: { item_id: itemId, amount, customer_email: email },
              result: toolResult,
            };

            // Complete Gemini Function Calling Round-Trip Protocol:
            // Feed the tool's functionResponse back to the model for natural final synthesis
            try {
              const previousContent = response.candidates?.[0]?.content;
              const followUp = await ai.models.generateContent({
                model: 'gemini-3.8-flash',
                contents: [
                  ...contents,
                  previousContent || {
                    role: 'model',
                    parts: [{ functionCall: call }],
                  },
                  {
                    role: 'tool',
                    parts: [
                      {
                        functionResponse: {
                          name: 'generate_checkout_link',
                          response: {
                            status: 'success',
                            checkout_url: toolResult.checkoutUrl,
                            session_id: toolResult.sessionId,
                            item_id: toolResult.itemId,
                            amount: toolResult.amount,
                          },
                        },
                      },
                    ],
                  },
                ],
              });

              aiResponseText =
                followUp.text ||
                `আপনার "${itemId}" ($${amount}) এর জন্য নিরাপদ Stripe Link পেমেন্ট সেশন প্রস্তুত করা হয়েছে। নিচে ডাইনামিক বাটনে ক্লিক করে ১-ক্লিকে পেমেন্ট সম্পন্ন করতে পারবেন।`;
            } catch (followUpErr) {
              aiResponseText = `আপনার "${itemId}" ($${amount}) এর জন্য নিরাপদ Stripe Link পেমেন্ট সেশন প্রস্তুত করা হয়েছে। নিচে "Pay with Stripe Link" বাটনে ক্লিক করে কার্ড টাইপ না করেই ১-ক্লিকে পেমেন্ট সম্পন্ন করতে পারেন।`;
            }
          }
        } else {
          aiResponseText =
            response.text ||
            'আমি আপনার পেমেন্ট অ্যাসিস্ট্যান্ট। যেকোনো প্যাকেজ কিনতে চাইলে আমাকে জানান, আমি তৎক্ষণাৎ সিকিউর পেমেন্ট লিঙ্ক তৈরি করে দেব।';
        }
      } catch (geminiError: any) {
        console.warn('Gemini invocation notice:', geminiError.message);
        const fallback = await processHeuristicAgent(message, customerEmail, stripe, req);
        aiResponseText = fallback.aiResponseText;
        toolCallExecuted = fallback.toolCallExecuted;
      }
    } else {
      const fallback = await processHeuristicAgent(message, customerEmail, stripe, req);
      aiResponseText = fallback.aiResponseText;
      toolCallExecuted = fallback.toolCallExecuted;
    }

    return res.json({
      aiResponse: aiResponseText,
      toolCall: toolCallExecuted,
      function_calls: toolCallExecuted ? [{ name: toolCallExecuted.name, args: toolCallExecuted.args }] : [],
      functionCalls: toolCallExecuted ? [{ name: toolCallExecuted.name, args: toolCallExecuted.args }] : [],
      function_call: toolCallExecuted ? { name: toolCallExecuted.name, args: toolCallExecuted.args } : null,
      functionCall: toolCallExecuted ? { name: toolCallExecuted.name, args: toolCallExecuted.args } : null,
      action: toolCallExecuted ? 'payment_link_generated' : 'normal_chat',
      checkoutUrl: toolCallExecuted?.result?.checkoutUrl || null,
      sessionId: toolCallExecuted?.result?.sessionId || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Error processing AI chat' });
  }
});

// Service worker kill-switch for development/preview to unregister any stale SW
app.get(['/sw.js', '/dev-sw.js'], (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.send(`
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(
    self.registration.unregister().then(() => self.clients.matchAll({ type: 'window' })).then(clients => {
      for (const client of clients) client.navigate(client.url);
    })
  );
});
`);
});

export default app;
