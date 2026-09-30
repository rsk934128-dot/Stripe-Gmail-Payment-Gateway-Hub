import React, { useState } from 'react';
import { BookOpen, Copy, Check, Terminal, ExternalLink, ShieldCheck, Download, Code, Globe } from 'lucide-react';

interface DeploymentGuideTabProps {
  lang?: 'bn' | 'en';
}

const SERVER_JS_CODE = `require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const Stripe = require('stripe');

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ১. ফ্রন্টএন্ডে Publishable Key পাঠানোর রাউট
app.get('/api/config', (req, res) => {
  res.json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY });
});

// ২. Secret Key যাচাইকরণ রাউট
app.get('/api/verify-key', async (req, res) => {
  try {
    const balance = await stripe.balance.retrieve();
    res.json({
      success: true,
      message: 'API Key সম্পূর্ণ সঠিক এবং কার্যকর!',
      livemode: balance.livemode ? 'Live Mode' : 'Test Mode',
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ৩. Payment Intent তৈরি
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency } = req.body;
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount || 1000,
      currency: currency || 'usd',
      automatic_payment_methods: { enabled: true },
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ৪. সাবস্ক্রিপশন তৈরি
app.post('/api/create-subscription', async (req, res) => {
  try {
    const { email, priceId } = req.body;
    const customer = await stripe.customers.create({ email });
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });
    res.json({
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ৫. Webhook লিসেনার
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(\`Webhook Error: \${err.message}\`);
  }

  if (event.type === 'payment_intent.succeeded') {
    console.log('✅ পেমেন্ট সফল:', event.data.object.id);
  }
  res.json({ received: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`✅ সার্ভার চালু হয়েছে: http://localhost:\${PORT}\`);
});
module.exports = app;`;

const VERCEL_JSON_CODE = `{
  "version": 2,
  "builds": [
    { "src": "server.js", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "server.js" },
    { "src": "/(.*)", "dest": "public/$1" }
  ]
}`;

const ENV_CODE = `# Stripe Secret Key
STRIPE_SECRET_KEY=sk_test_your_secret_key_here

# Stripe Publishable Key
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# Stripe Webhook Secret
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

PORT=3000`;

export const DeploymentGuideTab: React.FC<DeploymentGuideTabProps> = ({ lang = 'bn' }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            {lang === 'bn' ? 'প্রোজেক্ট ডেপ্লয়মেন্ট ও কোড রেফারেন্স' : 'Deployment & Export Assistant'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {lang === 'bn'
              ? 'লোকালহোস্ট, Vercel ও PWABuilder ডেপ্লয়মেন্টের জন্য পূর্ণাঙ্গ কোড ও গাইড'
              : 'Complete code snippets and setup commands for Localhost, Vercel, and PWABuilder'}
          </p>
        </div>
      </div>

      {/* Visual Multi-Device PWA & Store Packaging Banner */}
      <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-slate-900 via-indigo-950/25 to-slate-900 p-4 sm:p-5 flex flex-col md:flex-row items-center gap-5 overflow-hidden relative shadow-lg">
        <div className="flex-1 space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            <span>Microsoft PWABuilder &amp; Store Packaging</span>
          </div>
          <h3 className="text-base font-bold text-white">
            {lang === 'bn' ? 'PWABuilder দিয়ে গুগল প্লে ও উইন্ডোজ স্টোরে প্রকাশ' : 'Export & Package to App Stores via PWABuilder'}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
            {lang === 'bn'
              ? 'ওয়েব অ্যাপ ম্যানিফেস্ট এবং অফলাইন সার্ভিস ওয়ার্কার প্রস্তুত রয়েছে। pwabuilder.com-এ এক ক্লিকে Google Play TWA, Windows MSIX বা iOS অ্যাপ বান্ডল তৈরি করুন।'
              : 'The Web App Manifest, maskable icons, and Workbox offline service worker are 100% compliant for instant export to Google Play, Windows Store, and iOS.'}
          </p>
        </div>

        <div className="w-full md:w-64 h-28 rounded-xl overflow-hidden border border-indigo-500/30 shadow-md relative shrink-0 group">
          <img
            src="/src/assets/images/pwa_mobile_showcase_1790806977280.jpg"
            alt="PWA Mobile Showcase"
            className="w-full h-full object-cover object-center transform group-hover:scale-105 transition duration-500"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />
          <span className="absolute bottom-1.5 left-2 text-[10px] font-mono text-emerald-300 font-semibold bg-slate-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
            PWABuilder 100%
          </span>
        </div>
      </div>

      {/* Guide Steps */}
      <div className="space-y-6">
        {/* Step 1: Local Terminal Setup */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">1</span>
              {lang === 'bn' ? 'ডিপেনডেন্সি ইনস্টলেশন (Terminal Setup)' : 'Project & Dependency Setup'}
            </h3>
            <button
              onClick={() => handleCopy('npm install express stripe dotenv cors', 'step1')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              {copiedKey === 'step1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedKey === 'step1' ? 'কপি হয়েছে' : 'কপি করুন'}
            </button>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-indigo-300">
            <code>npm install express stripe dotenv cors</code>
          </div>
        </div>

        {/* Step 2: .env */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">2</span>
              {lang === 'bn' ? '.env ফাইল কনফিগারেশন' : '.env Configuration'}
            </h3>
            <button
              onClick={() => handleCopy(ENV_CODE, 'env')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              {copiedKey === 'env' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedKey === 'env' ? 'কপি হয়েছে' : 'কপি করুন'}
            </button>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-300 max-h-48 overflow-y-auto">
            <pre>{ENV_CODE}</pre>
          </div>
        </div>

        {/* Step 3: server.js */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">3</span>
              {lang === 'bn' ? 'Express ব্যাকএন্ড কোড (server.js)' : 'Express Backend (server.js)'}
            </h3>
            <button
              onClick={() => handleCopy(SERVER_JS_CODE, 'serverjs')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              {copiedKey === 'serverjs' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedKey === 'serverjs' ? 'কপি হয়েছে' : 'কপি করুন'}
            </button>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-300 max-h-64 overflow-y-auto">
            <pre>{SERVER_JS_CODE}</pre>
          </div>
        </div>

        {/* Step 4: vercel.json */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">4</span>
              {lang === 'bn' ? 'Vercel ডেপ্লয়মেন্ট কনফিগারেশন (vercel.json)' : 'Vercel Config (vercel.json)'}
            </h3>
            <button
              onClick={() => handleCopy(VERCEL_JSON_CODE, 'verceljson')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              {copiedKey === 'verceljson' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedKey === 'verceljson' ? 'কপি হয়েছে' : 'কপি করুন'}
            </button>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-300 max-h-48 overflow-y-auto">
            <pre>{VERCEL_JSON_CODE}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};
