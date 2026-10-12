import React, { useState } from 'react';
import {
  Radio,
  Terminal,
  Send,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  Code2,
  Activity,
  Layers,
  ListFilter,
  Table as TableIcon,
} from 'lucide-react';
import { WebhookEventRecord } from '../types';
import webhookEventBanner from '../assets/images/webhook_event_banner_1790807169907.jpg';
import { StripeEventLogs } from './StripeEventLogs';
import { StripeEventLogsViewer } from './StripeEventLogsViewer';

export { StripeEventLogs, StripeEventLogsViewer };

interface WebhookStudioTabProps {
  lang?: 'bn' | 'en';
}

const EVENT_TEMPLATES = [
  {
    type: 'payment_intent.succeeded',
    name: 'পেমেন্ট সফল (Payment Intent Succeeded)',
    description: 'গ্রাহকের কার্ড চার্জ সফল হলে ট্রিগার হয়',
    samplePayload: {
      id: 'evt_test_pi_succ_' + Math.random().toString(36).substring(2, 8),
      object: 'event',
      type: 'payment_intent.succeeded',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: 'pi_3MzxS94K9kL0s8',
          object: 'payment_intent',
          amount: 2500,
          currency: 'usd',
          status: 'succeeded',
          customer: 'cus_R839d092',
          receipt_email: 'customer@example.com',
          created: Math.floor(Date.now() / 1000),
        },
      },
    },
  },
  {
    type: 'payment_intent.payment_failed',
    name: 'পেমেন্ট ব্যর্থ (Payment Intent Failed)',
    description: 'অপর্যাপ্ত ব্যালেন্স বা কার্ড ডিক্লাইন হলে আসে',
    samplePayload: {
      id: 'evt_test_pi_fail_' + Math.random().toString(36).substring(2, 8),
      object: 'event',
      type: 'payment_intent.payment_failed',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: 'pi_3MzxS94K9kL0s9',
          object: 'payment_intent',
          amount: 5000,
          currency: 'usd',
          status: 'requires_payment_method',
          last_payment_error: {
            code: 'card_declined',
            message: 'Your card was declined by the issuing bank.',
          },
        },
      },
    },
  },
  {
    type: 'customer.subscription.deleted',
    name: 'সাবস্ক্রিপশন বাতিল (Subscription Deleted)',
    description: 'ইউজার সাবস্ক্রিপশন ক্যান্সেল করলে আসে',
    samplePayload: {
      id: 'evt_test_sub_del_' + Math.random().toString(36).substring(2, 8),
      object: 'event',
      type: 'customer.subscription.deleted',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: 'sub_1QkL294Ztest928',
          object: 'subscription',
          status: 'canceled',
          customer: 'cus_R839d092',
          cancel_at_period_end: false,
        },
      },
    },
  },
  {
    type: 'invoice.payment_succeeded',
    name: 'ইনভয়েস পরিশোধিত (Invoice Payment Succeeded)',
    description: 'সাবস্ক্রিপশন অটো-রিনিউ হওয়ার সময় জেনারেট হয়',
    samplePayload: {
      id: 'evt_test_inv_succ_' + Math.random().toString(36).substring(2, 8),
      object: 'event',
      type: 'invoice.payment_succeeded',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: 'in_1MzxS94K9kL0s8',
          object: 'invoice',
          amount_paid: 2900,
          currency: 'usd',
          customer_email: 'subscriber@example.com',
          paid: true,
          hosted_invoice_url: 'https://invoice.stripe.com/i/acct_test/invst_test',
        },
      },
    },
  },
];

export const WebhookStudioTab: React.FC<WebhookStudioTabProps> = ({ lang = 'bn' }) => {
  // Navigation sub-tabs: 'last10' | 'table' | 'simulator' | 'cli'
  const [subTab, setSubTab] = useState<'last10' | 'table' | 'simulator' | 'cli'>('last10');

  // Simulator state
  const [selectedEvent, setSelectedEvent] = useState(EVENT_TEMPLATES[0]);
  const [targetEndpoint, setTargetEndpoint] = useState('/api/webhook');
  const [isSending, setIsSending] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  // Dispatch Webhook from simulator
  const handleDispatchWebhook = async () => {
    setIsSending(true);
    try {
      const payload = {
        ...selectedEvent.samplePayload,
        id: `evt_sim_${Date.now()}`,
        created: Math.floor(Date.now() / 1000),
      };

      await fetch(targetEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': `t=${Math.floor(Date.now() / 1000)},v1=simulated_sig_${Math.random().toString(36).substring(2, 12)}`,
        },
        body: JSON.stringify(payload),
      });

      // Switch to last 10 webhook viewer so user immediately sees the entry
      setSubTab('last10');
    } catch (err: any) {
      console.error('Webhook dispatch error:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Copy helper
  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6 text-left max-w-6xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-indigo-400 animate-pulse" />
            {lang === 'bn' ? 'Stripe Event Logs & Webhook Studio' : 'Stripe Event Logs & Webhook Studio'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {lang === 'bn'
              ? 'সাম্প্রতিক ১০টি Stripe ওয়েবহুক ইভেন্ট তালিকা, স্ট্যাটাস কোড ও সঠিক টাইমস্ট্যাম্প পর্যবেক্ষণ (প্রতি ৩০ সেকেন্ডে স্বয়ংক্রিয় রিফ্রেশ)'
              : 'Monitor recent Stripe webhook events in a scrollable list viewer with status codes and timestamps (auto-polls every 30 seconds)'}
          </p>
        </div>

        {/* Polling Interval Indicator */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{lang === 'bn' ? '৩০ সেকেন্ড পোলিং সক্রিয়' : '30s Polling Active'}</span>
          </div>
        </div>
      </div>

      {/* Visual Webhook Event Stream Showcase Banner */}
      <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-slate-900 via-indigo-950/25 to-slate-900 p-4 sm:p-5 flex flex-col md:flex-row items-center gap-5 overflow-hidden relative shadow-lg">
        <div className="flex-1 space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
            <Activity className="w-3 h-3 text-cyan-400" />
            <span>Stripe Webhook Telemetry &amp; Ingestion Studio</span>
          </div>
          <h3 className="text-base font-bold text-white">
            {lang === 'bn' ? 'রিয়েল-টাইম Stripe Event Logs ভিউয়ার' : 'Real-time Stripe Event Logs Viewer'}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
            {lang === 'bn'
              ? 'ব্যাকএন্ড থেকে স্বয়ংক্রিয়ভাবে সর্বশেষ ১০টি Stripe ওয়েবহুক ইভেন্ট ফেচ করে স্ক্রোলযোগ্য তালিকায় প্রতিটি রিকোয়েস্টের ইভেন্ট টাইপ, স্ট্যাটাস কোড ও টাইমস্ট্যাম্প প্রদর্শন করা হয়।'
              : 'Fetches the last 10 Stripe webhook events from the backend and displays them in a scrollable list, including the event type, status code, and timestamp for each request.'}
          </p>
        </div>

        <div className="w-full md:w-64 h-28 rounded-xl overflow-hidden border border-cyan-500/30 shadow-md relative shrink-0 group">
          <img
            src={webhookEventBanner}
            onError={(e) => {
              e.currentTarget.src = '/assets/images/webhook_event_banner_1790807169907.jpg';
            }}
            alt="Webhook Events Banner"
            className="w-full h-full object-cover object-center transform group-hover:scale-105 transition duration-500"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />
          <span className="absolute bottom-1.5 left-2 text-[10px] font-mono text-cyan-300 font-semibold bg-slate-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
            ⚡ Telemetry Stream Active
          </span>
        </div>
      </div>

      {/* Sub-Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => setSubTab('last10')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
            subTab === 'last10'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>{lang === 'bn' ? 'Stripe Event Logs (সর্বশেষ ১০টি)' : 'Stripe Event Logs (Last 10)'}</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('table')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
            subTab === 'table'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <TableIcon className="w-3.5 h-3.5" />
          <span>{lang === 'bn' ? 'সকল রিকোয়েস্ট টেবিল' : 'All Requests Table'}</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('simulator')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
            subTab === 'simulator'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>{lang === 'bn' ? 'Webhook Simulator' : 'Webhook Simulator'}</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('cli')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
            subTab === 'cli'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>{lang === 'bn' ? 'Stripe CLI গাইড' : 'Stripe CLI Setup'}</span>
        </button>
      </div>

      {/* TAB 1: STRIPE EVENT LOGS VIEWER (LAST 10 WEBHOOK EVENTS SCROLLABLE LIST) */}
      {subTab === 'last10' && (
        <div className="animate-in fade-in duration-200">
          <StripeEventLogsViewer lang={lang} pollingInterval={30000} />
        </div>
      )}

      {/* TAB 2: ALL REQUESTS FULL TABLE */}
      {subTab === 'table' && (
        <div className="animate-in fade-in duration-200">
          <StripeEventLogs lang={lang} pollingInterval={30000} />
        </div>
      )}

      {/* TAB 3: WEBHOOK SIMULATOR */}
      {subTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
          {/* Left Column: Event Generator */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Send className="w-4 h-4 text-indigo-400" />
                {lang === 'bn' ? 'টেস্ট ইভেন্ট প্রেরণ' : 'Dispatch Test Event'}
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === 'bn' ? 'Webhook Endpoint URL' : 'Target Endpoint URL'}
                </label>
                <input
                  type="text"
                  value={targetEndpoint}
                  onChange={(e) => setTargetEndpoint(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  {lang === 'bn' ? 'ইভেন্ট ধরণ নির্বাচন করুন' : 'Select Event Template'}
                </label>
                <div className="space-y-2">
                  {EVENT_TEMPLATES.map((tmpl) => (
                    <div
                      key={tmpl.type}
                      onClick={() => setSelectedEvent(tmpl)}
                      className={`p-3 rounded-xl border cursor-pointer transition text-xs ${
                        selectedEvent.type === tmpl.type
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-inner'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-semibold text-slate-200">{tmpl.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{tmpl.type}</div>
                      <div className="text-[10px] text-slate-500 mt-1">{tmpl.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleDispatchWebhook}
                disabled={isSending}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-900/30 flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    {lang === 'bn' ? 'ইভেন্ট পাঠানো হচ্ছে...' : 'Sending Webhook...'}
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    {lang === 'bn' ? 'Webhook ট্রিগার ও স্ক্রোল তালিকায় দেখুন' : 'Trigger Webhook & View in List'}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Active Webhook Template Payload */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-indigo-400" />
                  {lang === 'bn' ? 'নির্বাচিত পে-লোড প্রিভিউ' : 'Template Payload Preview'}
                </h3>
                <button
                  onClick={() => copyText(JSON.stringify(selectedEvent.samplePayload, null, 2), 'sim-payload')}
                  className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                >
                  {copiedIndex === 'sim-payload' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>কপি হয়েছে</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>JSON কপি করুন</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 max-h-[460px] overflow-y-auto font-mono text-[11px] text-slate-200">
                <pre>{JSON.stringify(selectedEvent.samplePayload, null, 2)}</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: STRIPE CLI SETUP */}
      {subTab === 'cli' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {lang === 'bn' ? 'Stripe CLI দিয়ে রিয়েল ইভেন্ট লোকালহোস্টে ফরওয়ার্ড করুন' : 'Forward Real Stripe Events with Stripe CLI'}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'bn'
                  ? 'আপনার আসল Stripe Dashboard থেকে লাইভ টেস্ট ইভেন্টগুলো লোকালহোস্টে ফরোয়ার্ড করার সহজ ধাপ'
                  : 'Follow these 3 simple commands to stream webhook events from Stripe cloud to your local development server'}
              </p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <p className="font-semibold text-slate-300">
                {lang === 'bn' ? 'ধাপ ১: Stripe CLI ইনস্টল করুন' : 'Step 1: Install Stripe CLI'}
              </p>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-emerald-300 flex items-center justify-between">
                <code>brew install stripe/stripe-cli/stripe # or via npm/scoop</code>
                <button
                  onClick={() => copyText('brew install stripe/stripe-cli/stripe', 'cli-inst')}
                  className="p-1 hover:text-white text-slate-400 cursor-pointer"
                >
                  {copiedIndex === 'cli-inst' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="font-semibold text-slate-300">
                {lang === 'bn' ? 'ধাপ ২: আপনার Stripe একাউন্টে লগইন করুন' : 'Step 2: Login to your Stripe Account'}
              </p>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-emerald-300 flex items-center justify-between">
                <code>stripe login</code>
                <button
                  onClick={() => copyText('stripe login', 'cli-login')}
                  className="p-1 hover:text-white text-slate-400 cursor-pointer"
                >
                  {copiedIndex === 'cli-login' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="font-semibold text-slate-300">
                {lang === 'bn' ? 'ধাপ ৩: ক্লাউড বা লোকালহোস্ট ওয়েবহুক এন্ডপয়েন্টে ইভেন্ট শুনুন' : 'Step 3: Webhook Endpoint URL'}
              </p>
              <div className="text-xs text-slate-400 mb-1">
                {lang === 'bn' ? 'সরাসরি ক্লাউড লাইভ এন্ডপয়েন্ট (Stripe Dashboard-এ যুক্ত করতে):' : 'Live Cloud Endpoint (for Stripe Dashboard):'}
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-cyan-300 flex items-center justify-between mb-2">
                <code className="truncate mr-2">{typeof window !== 'undefined' ? `${window.location.origin}/api/webhook` : '/api/webhook'}</code>
                <button
                  onClick={() => copyText(typeof window !== 'undefined' ? `${window.location.origin}/api/webhook` : '/api/webhook', 'cloud-url')}
                  className="p-1 hover:text-white text-slate-400 cursor-pointer shrink-0"
                >
                  {copiedIndex === 'cloud-url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="text-xs text-slate-400 mb-1">
                {lang === 'bn' ? 'অথবা নিজের কম্পিউটারে Stripe CLI চালালে:' : 'Or for local machine development via Stripe CLI:'}
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-emerald-300 flex items-center justify-between">
                <code>stripe listen --forward-to localhost:3000/api/webhook</code>
                <button
                  onClick={() => copyText('stripe listen --forward-to localhost:3000/api/webhook', 'cli-listen')}
                  className="p-1 hover:text-white text-slate-400 cursor-pointer shrink-0"
                >
                  {copiedIndex === 'cli-listen' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
