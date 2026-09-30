import React, { useState } from 'react';
import { Layers, Mail, CheckCircle2, ShieldCheck, RefreshCw, FileText, ArrowRight, UserPlus, CreditCard } from 'lucide-react';
import { SubscriptionItem } from '../types';
import { PaymentReceiptEmailData } from '../services/gmail';

interface SubscriptionTabProps {
  manualSecretKey: string;
  onDispatchReceiptModal: (data: PaymentReceiptEmailData) => void;
  isGmailConnected: boolean;
  lang?: 'bn' | 'en';
}

const PRESET_PLANS = [
  { name: 'Starter Plan', priceId: 'price_starter_test', amount: 900, interval: 'month' as const, desc: 'বেসিক প্রজেক্টের জন্য উপযুক্ত' },
  { name: 'Professional Plan', priceId: 'price_pro_test', amount: 2900, interval: 'month' as const, desc: 'জনপ্রিয় ও সম্পূর্ণ ফিচারসহ' },
  { name: 'Enterprise Plan', priceId: 'price_ent_test', amount: 9900, interval: 'month' as const, desc: 'অসীম ট্রাফিক ও প্রায়োরিটি সাপোর্ট' },
];

export const SubscriptionTab: React.FC<SubscriptionTabProps> = ({
  manualSecretKey,
  onDispatchReceiptModal,
  isGmailConnected,
  lang = 'bn',
}) => {
  const [email, setEmail] = useState<string>('rubelbank92@gmail.com');
  const [selectedPlan, setSelectedPlan] = useState<typeof PRESET_PLANS[0]>(PRESET_PLANS[1]);
  const [customPriceId, setCustomPriceId] = useState<string>('');
  const [useCustomPrice, setUseCustomPrice] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([
    {
      id: 'sub_1QkL294Ztest928',
      customerId: 'cus_R839d092',
      customerEmail: 'alex.developer@example.com',
      planName: 'Professional Plan ($29/mo)',
      priceId: 'price_pro_test',
      amount: 2900,
      currency: 'usd',
      interval: 'month',
      status: 'active',
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      latestInvoiceId: 'in_1QkL294ZtestInvoice01',
    },
  ]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const priceId = useCustomPrice && customPriceId ? customPriceId : selectedPlan.priceId;
    const planName = useCustomPrice ? `Custom Plan (${priceId})` : selectedPlan.name;
    const amount = useCustomPrice ? 2900 : selectedPlan.amount;

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (manualSecretKey) {
        headers['x-stripe-secret-key'] = manualSecretKey.trim();
      }

      const res = await fetch('/api/create-subscription', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email,
          priceId,
          planName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'সাবস্ক্রিপশন তৈরি ব্যর্থ হয়েছে');
      }

      const newSub: SubscriptionItem = {
        id: data.subscriptionId || 'sub_sim_' + Math.random().toString(36).substring(2, 9),
        customerId: data.customerId || 'cus_sim_' + Math.random().toString(36).substring(2, 9),
        customerEmail: email,
        planName,
        priceId,
        amount,
        currency: 'usd',
        interval: 'month',
        status: (data.status as any) || 'active',
        createdAt: new Date().toISOString(),
        latestInvoiceId: 'in_sim_' + Math.random().toString(36).substring(2, 8),
      };

      setSubscriptions([newSub, ...subscriptions]);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = (id: string, newStatus: SubscriptionItem['status']) => {
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
    );
  };

  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-purple-400" />
          {lang === 'bn' ? 'সাবস্ক্রিপশন ও ইনভয়েস ম্যানেজার' : 'Subscription & Invoice Manager'}
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          {lang === 'bn'
            ? 'Stripe Products, Price ID ও গ্রাহক বিলিং সাবস্ক্রিপশন পরিচালনা এবং Gmail ইনভয়েস টেস্ট করুন'
            : 'Manage Stripe subscriptions, pricing plans, automated invoices, and Gmail invoice notices'}
        </p>
      </div>

      {/* Visual Recurring Billing Showcase Banner */}
      <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-r from-slate-900 via-purple-950/25 to-slate-900 p-4 sm:p-5 flex flex-col md:flex-row items-center gap-5 overflow-hidden relative shadow-lg">
        <div className="flex-1 space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
            <span>SaaS Billing &amp; Automated Invoicing</span>
          </div>
          <h3 className="text-base font-bold text-white">
            {lang === 'bn' ? 'সাবস্ক্রিপশন লাইফসাইকেল ও রিকারিং চার্জেস' : 'Automated Recurring Billing Lifecycle'}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
            {lang === 'bn'
              ? 'গ্রাহকের জন্য মাসিক বা বাৎসরিক বিলিং প্ল্যান তৈরি করুন, অ্যাক্টিভ ও পাস্ট ডিউ স্ট্যাটাস সিমুলেট করুন এবং ইনভয়েস ট্র্যাক করুন।'
              : 'Simulate full customer subscription lifecycles, automated renewals, invoice generation, and Gmail payment alerts.'}
          </p>
        </div>

        <div className="w-full md:w-64 h-28 rounded-xl overflow-hidden border border-purple-500/30 shadow-md relative shrink-0 group">
          <img
            src="/src/assets/images/subscription_billing_banner_1790807157156.jpg"
            alt="Subscription Billing Banner"
            className="w-full h-full object-cover object-center transform group-hover:scale-105 transition duration-500"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />
          <span className="absolute bottom-1.5 left-2 text-[10px] font-mono text-purple-300 font-semibold bg-slate-950/80 px-2 py-0.5 rounded border border-purple-500/30">
            Tiered Billing Active
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Plan Selector & Subscribe Form */}
        <div className="lg:col-span-5 space-y-4">
          <form onSubmit={handleSubscribe} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-purple-400" />
              {lang === 'bn' ? 'নতুন সাবস্ক্রিপশন তৈরি' : 'Create New Subscription'}
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {lang === 'bn' ? 'গ্রাহক ইমেইল অ্যাড্রেস' : 'Customer Email'}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  {lang === 'bn' ? 'সাবস্ক্রিপশন প্ল্যান নির্বাচন' : 'Select Plan'}
                </label>
                <button
                  type="button"
                  onClick={() => setUseCustomPrice(!useCustomPrice)}
                  className="text-[11px] text-purple-400 hover:text-purple-300 underline"
                >
                  {useCustomPrice
                    ? lang === 'bn'
                      ? 'প্রিসেট প্ল্যান দেখুন'
                      : 'Show Presets'
                    : lang === 'bn'
                    ? 'কাস্টম Price ID দিন'
                    : 'Custom Price ID'}
                </button>
              </div>

              {!useCustomPrice ? (
                <div className="space-y-2">
                  {PRESET_PLANS.map((plan) => (
                    <div
                      key={plan.priceId}
                      onClick={() => setSelectedPlan(plan)}
                      className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                        selectedPlan.priceId === plan.priceId
                          ? 'bg-purple-950/30 border-purple-500 text-white'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-xs text-slate-200">{plan.name}</div>
                        <div className="text-[10px] text-slate-400">{plan.desc}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-sm text-purple-400">${plan.amount / 100}</div>
                        <div className="text-[10px] text-slate-500">/{plan.interval}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    value={customPriceId}
                    onChange={(e) => setCustomPriceId(e.target.value)}
                    placeholder="price_1N..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Stripe Dashboard &gt; Products থেকে প্রাপ্ত Price ID দিন
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  {lang === 'bn' ? 'তৈরি করা হচ্ছে...' : 'Creating Subscription...'}
                </>
              ) : (
                <>
                  <CreditCard className="w-3.5 h-3.5" />
                  {lang === 'bn' ? 'সাবস্ক্রিপশন সম্পন্ন করুন' : 'Confirm Subscription'}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Col: Active Subscriptions & Invoicing */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" />
                {lang === 'bn' ? 'সক্রিয় সাবস্ক্রিপশন তালিকা' : 'Active Subscriptions'}
              </h3>
              <span className="text-[11px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                {subscriptions.length} {lang === 'bn' ? 'টি রেকর্ড' : 'records'}
              </span>
            </div>

            <div className="space-y-3">
              {subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-3 hover:border-slate-700 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-white">{sub.planName}</span>
                        <span
                          className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                            sub.status === 'active'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : sub.status === 'past_due'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{sub.customerEmail}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm text-emerald-400">
                        ${(sub.amount / 100).toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">{sub.id.slice(0, 14)}...</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-900 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 text-[10px]">স্ট্যাটাস পরিবর্তন:</span>
                      <select
                        value={sub.status}
                        onChange={(e) => handleUpdateStatus(sub.id, e.target.value as any)}
                        className="bg-slate-900 border border-slate-800 text-[11px] rounded-md px-1.5 py-0.5 text-slate-300 focus:outline-none"
                      >
                        <option value="active">Active</option>
                        <option value="past_due">Past Due</option>
                        <option value="canceled">Canceled</option>
                        <option value="trialing">Trialing</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onDispatchReceiptModal({
                          recipientEmail: sub.customerEmail,
                          amount: sub.amount,
                          currency: sub.currency,
                          paymentIntentId: sub.latestInvoiceId || sub.id,
                          planName: sub.planName,
                          description: `Recurring Invoice for ${sub.planName}`,
                          status: sub.status,
                        })
                      }
                      className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 hover:text-white border border-indigo-500/30 font-semibold text-[11px] flex items-center gap-1 cursor-pointer transition"
                    >
                      <Mail className="w-3 h-3 text-red-400" />
                      {lang === 'bn' ? 'Gmail এ ইনভয়েস পাঠান' : 'Dispatch Gmail Invoice'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
