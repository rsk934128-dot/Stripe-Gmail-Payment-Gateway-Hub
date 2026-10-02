import React, { useState, useMemo } from 'react';
import {
  Layers,
  Mail,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  FileText,
  ArrowRight,
  UserPlus,
  CreditCard,
  TrendingUp,
  BarChart3,
  DollarSign,
  Activity,
  ArrowUpRight,
  PieChart as PieIcon,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
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
  const [timeframe, setTimeframe] = useState<'6m' | '12m'>('6m');

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

  // Dynamic MRR & Metrics calculation based on simulated data and active subscriptions
  const liveActiveSubsMRR = useMemo(() => {
    return subscriptions
      .filter((s) => s.status === 'active')
      .reduce((acc, s) => acc + s.amount / 100, 0);
  }, [subscriptions]);

  const liveTotalSubsCount = useMemo(() => {
    return subscriptions.filter((s) => s.status === 'active').length;
  }, [subscriptions]);

  // Full 12-month simulated baseline data
  const simulatedHistory = useMemo(() => {
    const data = [
      { month: 'Nov', mrr: 1450, volume: 8200, transactions: 110, newSubs: 14 },
      { month: 'Dec', mrr: 1820, volume: 10400, transactions: 135, newSubs: 18 },
      { month: 'Jan', mrr: 2240, volume: 12900, transactions: 160, newSubs: 22 },
      { month: 'Feb', mrr: 2690, volume: 15400, transactions: 195, newSubs: 26 },
      { month: 'Mar', mrr: 3180, volume: 18800, transactions: 230, newSubs: 31 },
      { month: 'Apr', mrr: 3750, volume: 22400, transactions: 275, newSubs: 37 },
      { month: 'May', mrr: 4320, volume: 26100, transactions: 315, newSubs: 42 },
      { month: 'Jun', mrr: 4980, volume: 30800, transactions: 360, newSubs: 48 },
      { month: 'Jul', mrr: 5620, volume: 35200, transactions: 410, newSubs: 54 },
      { month: 'Aug', mrr: 6240, volume: 39600, transactions: 455, newSubs: 61 },
      { month: 'Sep', mrr: 6890, volume: 44200, transactions: 510, newSubs: 68 },
      {
        month: 'Current',
        mrr: Math.round(7450 + liveActiveSubsMRR),
        volume: Math.round(48500 + liveActiveSubsMRR * 3.5),
        transactions: 560 + liveTotalSubsCount * 2,
        newSubs: 75 + liveTotalSubsCount,
      },
    ];
    return data;
  }, [liveActiveSubsMRR, liveTotalSubsCount]);

  const activeChartData = useMemo(() => {
    return timeframe === '6m' ? simulatedHistory.slice(6) : simulatedHistory;
  }, [simulatedHistory, timeframe]);

  const latestMRR = activeChartData[activeChartData.length - 1].mrr;
  const previousMRR = activeChartData[activeChartData.length - 2]?.mrr || latestMRR;
  const mrrGrowthPct = (((latestMRR - previousMRR) / previousMRR) * 100).toFixed(1);
  const totalPeriodVolume = activeChartData.reduce((acc, d) => acc + d.volume, 0);
  const totalTransactions = activeChartData.reduce((acc, d) => acc + d.transactions, 0);
  const averageARPU = (latestMRR / (180 + liveTotalSubsCount)).toFixed(2);

  // Subscription tier distribution for PieChart
  const tierDistributionData = useMemo(() => {
    let starterCount = 85;
    let proCount = 135;
    let entCount = 35;
    let customCount = 0;

    subscriptions.forEach((sub) => {
      if (sub.status !== 'canceled') {
        const name = (sub.planName || '').toLowerCase();
        if (name.includes('starter')) starterCount += 1;
        else if (name.includes('pro')) proCount += 1;
        else if (name.includes('ent')) entCount += 1;
        else customCount += 1;
      }
    });

    const totalSubs = starterCount + proCount + entCount + customCount;

    const data = [
      {
        name: lang === 'bn' ? 'Starter ($9)' : 'Starter ($9)',
        value: starterCount,
        color: '#38bdf8',
        mrr: starterCount * 9,
        percentage: Math.round((starterCount / totalSubs) * 100),
      },
      {
        name: lang === 'bn' ? 'Professional ($29)' : 'Professional ($29)',
        value: proCount,
        color: '#a855f7',
        mrr: proCount * 29,
        percentage: Math.round((proCount / totalSubs) * 100),
      },
      {
        name: lang === 'bn' ? 'Enterprise ($99)' : 'Enterprise ($99)',
        value: entCount,
        color: '#10b981',
        mrr: entCount * 99,
        percentage: Math.round((entCount / totalSubs) * 100),
      },
    ];

    if (customCount > 0) {
      data.push({
        name: lang === 'bn' ? 'Custom Plan' : 'Custom Plan',
        value: customCount,
        color: '#f59e0b',
        mrr: customCount * 29,
        percentage: Math.round((customCount / totalSubs) * 100),
      });
    }

    return { data, totalSubs };
  }, [subscriptions, lang]);

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

      {/* Recharts Analytics: Executive KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: MRR */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 shadow-lg relative overflow-hidden group hover:border-purple-500/40 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold flex items-center gap-1.5 text-slate-300">
              <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
              <span>{lang === 'bn' ? 'বর্তমান MRR' : 'Current MRR'}</span>
            </span>
            <span className="inline-flex items-center text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
              <ArrowUpRight className="w-3 h-3" />
              +{mrrGrowthPct}%
            </span>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            ${latestMRR.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {lang === 'bn' ? 'মাসিক পুনরাবৃত্ত রেভিনিউ' : 'Monthly Recurring Revenue'}
          </div>
        </div>

        {/* KPI 2: Total Volume */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold flex items-center gap-1.5 text-slate-300">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === 'bn' ? 'মোট ভলিউম' : 'Total Volume'}</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {timeframe.toUpperCase()}
            </span>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            ${totalPeriodVolume.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {lang === 'bn' ? 'গ্রস ট্রানজেকশন ভলিউম' : 'Gross transaction throughput'}
          </div>
        </div>

        {/* KPI 3: Total Transactions */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 shadow-lg relative overflow-hidden group hover:border-cyan-500/40 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold flex items-center gap-1.5 text-slate-300">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>{lang === 'bn' ? 'ট্রানজেকশন' : 'Transactions'}</span>
            </span>
            <span className="text-[10px] text-cyan-300 font-bold bg-cyan-500/10 px-1.5 py-0.5 rounded-full border border-cyan-500/20">
              Live
            </span>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {totalTransactions.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {lang === 'bn' ? 'সফল বিলিং লেনদেন' : 'Successful billing charges'}
          </div>
        </div>

        {/* KPI 4: ARPU */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 shadow-lg relative overflow-hidden group hover:border-indigo-500/40 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold flex items-center gap-1.5 text-slate-300">
              <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
              <span>{lang === 'bn' ? 'গড় ARPU' : 'Avg. ARPU'}</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              ~{180 + liveTotalSubsCount} subs
            </span>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            ${averageARPU}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {lang === 'bn' ? 'প্রতি ইউজারে গড় রেভিনিউ' : 'Average Revenue Per User'}
          </div>
        </div>
      </div>

      {/* Dual Charts Grid: Bar Chart (Monthly Trends) + Pie Chart (Tier Distribution) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 1. Bar Chart: Monthly Trends (MRR & Transaction Volume) */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-400" />
                {lang === 'bn'
                  ? 'মাসিক ট্রেন্ডস: MRR ও ট্রানজেকশন ভলিউম'
                  : 'Monthly Trends: MRR & Transaction Volume'}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {lang === 'bn'
                  ? 'বার চার্টের মাধ্যমে রেভিনিউ ও পেমেন্ট ভলিউম পর্যবেক্ষণ'
                  : 'Grouped bar chart visualizing MRR and gross volume over time'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setTimeframe('6m')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                    timeframe === '6m'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  6M
                </button>
                <button
                  type="button"
                  onClick={() => setTimeframe('12m')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                    timeframe === '12m'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  12M
                </button>
              </div>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full pt-1 min-h-[250px] min-w-0">
            <ResponsiveContainer width="100%" height={260} minWidth={100} minHeight={200}>
              <BarChart data={activeChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  yAxisId="left"
                  stroke="#a855f7"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#06b6d4"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900/95 border border-slate-700/80 p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs space-y-1.5">
                          <p className="font-bold text-slate-200 border-b border-slate-800 pb-1 flex items-center justify-between gap-4">
                            <span>{label}</span>
                            <span className="text-[10px] text-slate-400 font-mono">Monthly Bar Trend</span>
                          </p>
                          {payload.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between gap-6">
                              <span className="flex items-center gap-1.5 text-slate-300">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                {item.name}:
                              </span>
                              <span className="font-mono font-bold text-white">
                                ${Number(item.value).toLocaleString()}
                              </span>
                            </div>
                          ))}
                          <div className="flex items-center justify-between gap-6 text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                            <span>Transactions:</span>
                            <span className="font-mono font-semibold text-slate-300">
                              {payload[0]?.payload?.transactions}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="mrr"
                  name="MRR ($)"
                  fill="#a855f7"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
                <Bar
                  yAxisId="right"
                  dataKey="volume"
                  name="Total Volume ($)"
                  fill="#06b6d4"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Pie Chart: Subscription Tier Distribution */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3 flex flex-col justify-between">
          <div className="border-b border-slate-800/80 pb-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-indigo-400" />
                {lang === 'bn'
                  ? 'সাবস্ক্রিপশন টিয়ার বিন্যাস'
                  : 'Subscription Tier Distribution'}
              </h3>
              <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                {tierDistributionData.totalSubs} {lang === 'bn' ? 'ইউজার' : 'subs'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {lang === 'bn'
                ? 'প্ল্যানভিত্তিক গ্রাহক সংখ্যা এবং শতাংশের পাই চার্ট'
                : 'Pie chart visualizing subscriber proportions and plan share'}
            </p>
          </div>

          {/* Donut / Pie Chart */}
          <div className="h-44 sm:h-48 w-full relative flex items-center justify-center min-h-[180px] min-w-0">
            <ResponsiveContainer width="100%" height={180} minWidth={100} minHeight={160}>
              <PieChart>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900/95 border border-slate-700/80 p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs space-y-1">
                          <div className="font-bold text-white flex items-center gap-1.5 pb-1 border-b border-slate-800">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
                            <span>{data.name}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 text-slate-300 pt-0.5">
                            <span>Subscribers:</span>
                            <span className="font-mono font-bold text-white">{data.value}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 text-slate-300">
                            <span>Share:</span>
                            <span className="font-mono font-bold text-emerald-400">{data.percentage}%</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 text-slate-300">
                            <span>Monthly Yield:</span>
                            <span className="font-mono font-bold text-purple-300">${data.mrr.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Pie
                  data={tierDistributionData.data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  stroke="#0f172a"
                  strokeWidth={2}
                >
                  {tierDistributionData.data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Center Donut Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[11px] text-slate-400 font-medium">
                {lang === 'bn' ? 'মোট গ্রাহক' : 'Total'}
              </span>
              <span className="text-base font-black text-white font-mono">
                {tierDistributionData.totalSubs}
              </span>
            </div>
          </div>

          {/* Tier breakdown badges list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
            {tierDistributionData.data.map((tier) => (
              <div
                key={tier.name}
                className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: tier.color }} />
                  <span className="text-slate-300 font-medium text-[11px] truncate">{tier.name}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 pl-2">
                  <span className="font-mono font-bold text-white text-[11px]">{tier.value}</span>
                  <span className="text-[10px] text-slate-400">({tier.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
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
