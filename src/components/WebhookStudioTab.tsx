import React, { useState } from 'react';
import { Radio, Terminal, Send, Copy, Check, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, Code2, ExternalLink } from 'lucide-react';
import { WebhookEventRecord } from '../types';

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
            message: 'Your card was declined.',
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
  const [selectedEvent, setSelectedEvent] = useState(EVENT_TEMPLATES[0]);
  const [targetEndpoint, setTargetEndpoint] = useState('/api/webhook');
  const [isSending, setIsSending] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const [eventLogs, setEventLogs] = useState<WebhookEventRecord[]>([
    {
      id: 'evt_init_demo_01',
      type: 'payment_intent.succeeded',
      timestamp: new Date().toLocaleTimeString(),
      source: 'simulated',
      status: 'delivered',
      httpStatus: 200,
      data: EVENT_TEMPLATES[0].samplePayload,
    },
  ]);

  const [activeLog, setActiveLog] = useState<WebhookEventRecord>(eventLogs[0]);

  const handleDispatchWebhook = async () => {
    setIsSending(true);
    try {
      const payload = {
        ...selectedEvent.samplePayload,
        id: `evt_sim_${Date.now()}`,
        created: Math.floor(Date.now() / 1000),
      };

      const res = await fetch(targetEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': `t=${Math.floor(Date.now() / 1000)},v1=simulated_sig_${Math.random().toString(36).substring(2, 12)}`,
        },
        body: JSON.stringify(payload),
      });

      const newRecord: WebhookEventRecord = {
        id: payload.id,
        type: payload.type,
        timestamp: new Date().toLocaleTimeString(),
        source: 'manual',
        status: res.ok ? 'delivered' : 'failed',
        httpStatus: res.status,
        data: payload,
      };

      setEventLogs([newRecord, ...eventLogs]);
      setActiveLog(newRecord);
    } catch (err: any) {
      const failedRecord: WebhookEventRecord = {
        id: `evt_err_${Date.now()}`,
        type: selectedEvent.type,
        timestamp: new Date().toLocaleTimeString(),
        source: 'manual',
        status: 'failed',
        httpStatus: 500,
        data: { error: err.message },
      };
      setEventLogs([failedRecord, ...eventLogs]);
      setActiveLog(failedRecord);
    } finally {
      setIsSending(false);
    }
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Radio className="w-5 h-5 text-indigo-400 animate-pulse" />
          {lang === 'bn' ? 'Stripe Webhook Studio & Inspector' : 'Webhook Studio & Inspector'}
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          {lang === 'bn'
            ? 'পেমেন্ট ইভেন্ট, সিগনেচার যাচাই ও লোকালহোস্ট টেস্ট সিমুলেশন'
            : 'Simulate Stripe webhook events, test signatures, and inspect payload payloads in real-time'}
        </p>
      </div>

      {/* Visual Webhook Event Stream Showcase Banner */}
      <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-slate-900 via-indigo-950/25 to-slate-900 p-4 sm:p-5 flex flex-col md:flex-row items-center gap-5 overflow-hidden relative shadow-lg">
        <div className="flex-1 space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
            <span>Real-time Event Ingestion &amp; Signature Validation</span>
          </div>
          <h3 className="text-base font-bold text-white">
            {lang === 'bn' ? 'লাইভ ওয়েবহুক ইভেন্ট সিমুলেশন' : 'Live Webhook Event Ingestion Studio'}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
            {lang === 'bn'
              ? 'লোকাল সার্ভারে Stripe সিগনেচার সিক্রেট যাচাই, ইভেন্ট ট্র্যাকিং এবং পেমেন্ট সফল বা রিফান্ড ইভেন্টের রিয়েল-টাইম ডাটা পরীক্ষা করুন।'
              : 'Trigger and monitor asynchronous Stripe webhook payloads, HMAC-SHA256 signatures, and inspect headers in real-time.'}
          </p>
        </div>

        <div className="w-full md:w-64 h-28 rounded-xl overflow-hidden border border-cyan-500/30 shadow-md relative shrink-0 group">
          <img
            src="/src/assets/images/webhook_event_banner_1790807169907.jpg"
            alt="Webhook Events Banner"
            className="w-full h-full object-cover object-center transform group-hover:scale-105 transition duration-500"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />
          <span className="absolute bottom-1.5 left-2 text-[10px] font-mono text-cyan-300 font-semibold bg-slate-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
            ⚡ Webhook Stream Active
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
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
                        ? 'bg-indigo-600/20 border-indigo-500 text-white'
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
                  {lang === 'bn' ? 'Webhook ট্রিগার করুন' : 'Trigger Webhook'}
                </>
              )}
            </button>
          </div>

          {/* Stripe CLI Guide Box */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              {lang === 'bn' ? 'লোকাল Stripe CLI সেটআপ' : 'Stripe CLI Local Setup'}
            </h4>
            <p className="text-[11px] text-slate-400">
              {lang === 'bn'
                ? 'Stripe ড্যাশবোর্ড থেকে রিয়েল ইভেন্ট লোকাল সার্ভারে ফরোয়ার্ড করার জন্য টার্মিনালে লিখুন:'
                : 'Forward real events from Stripe Dashboard to localhost:'}
            </p>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-emerald-300 flex items-center justify-between">
              <code>stripe listen --forward-to localhost:3000/api/webhook</code>
              <button
                onClick={() =>
                  copyText('stripe listen --forward-to localhost:3000/api/webhook', 'cli-cmd')
                }
                className="p-1 hover:text-white text-slate-400"
              >
                {copiedIndex === 'cli-cmd' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Webhook Log Stream & Payload Inspector */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-indigo-400" />
                {lang === 'bn' ? 'Webhook ইভেন্ট হিস্ট্রি ও ইন্সপেক্টর' : 'Event Stream & Payload Inspector'}
              </h3>
              <span className="text-[11px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                {eventLogs.length} Events
              </span>
            </div>

            {/* Event Logs list pills */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {eventLogs.map((log) => (
                <button
                  key={log.id}
                  onClick={() => setActiveLog(log)}
                  className={`px-3 py-1.5 rounded-xl text-left border shrink-0 transition text-xs flex items-center gap-2 ${
                    activeLog?.id === log.id
                      ? 'bg-indigo-600/30 border-indigo-500 text-white'
                      : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      log.status === 'delivered' ? 'bg-emerald-400' : 'bg-rose-400'
                    }`}
                  ></span>
                  <span className="font-mono text-[11px]">{log.type}</span>
                  <span className="text-[10px] text-slate-500">{log.timestamp}</span>
                </button>
              ))}
            </div>

            {/* Active Payload Display */}
            {activeLog && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-mono text-[11px]">{activeLog.id}</span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        activeLog.status === 'delivered'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      HTTP {activeLog.httpStatus || 200}
                    </span>
                  </div>
                  <button
                    onClick={() => copyText(JSON.stringify(activeLog.data, null, 2), 'payload-json')}
                    className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    {copiedIndex === 'payload-json' ? (
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

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 max-h-96 overflow-y-auto font-mono text-[11px] text-slate-300">
                  <pre>{JSON.stringify(activeLog.data, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
