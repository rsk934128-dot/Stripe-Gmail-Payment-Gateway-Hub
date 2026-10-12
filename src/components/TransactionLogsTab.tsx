import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  Terminal,
  Zap,
  CreditCard,
  Mail,
  ExternalLink,
  Code2,
  Calendar,
  DollarSign,
  ShieldAlert,
  ArrowUpRight,
  Send,
  Timer,
  BarChart3,
  Layers,
  Sparkles,
  Info,
  X,
  Play,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  PaymentIntentLogItem,
  TransactionLogsSummary,
  DailyTrendPoint,
  TrendSummary,
  TransactionLogsApiResponse,
} from '../types';
import { PaymentReceiptEmailData } from '../services/gmail';

interface TransactionLogsTabProps {
  manualSecretKey?: string;
  onDispatchReceiptModal?: (data: PaymentReceiptEmailData) => void;
  isGmailConnected?: boolean;
  lang?: 'bn' | 'en';
}

export const TransactionLogsTab: React.FC<TransactionLogsTabProps> = ({
  manualSecretKey,
  onDispatchReceiptModal,
  isGmailConnected = false,
  lang = 'bn',
}) => {
  // Data states
  const [items, setItems] = useState<PaymentIntentLogItem[]>([]);
  const [summary, setSummary] = useState<TransactionLogsSummary | null>(null);
  const [trend30Days, setTrend30Days] = useState<DailyTrendPoint[]>([]);
  const [trendSummary, setTrendSummary] = useState<TrendSummary | null>(null);
  const [dataSource, setDataSource] = useState<'stripe_api' | 'session_store'>('session_store');

  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPolling, setIsPolling] = useState<boolean>(true);
  const [pollingSeconds, setPollingSeconds] = useState<number>(30);
  const [countdown, setCountdown] = useState<number>(30);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>('');

  // Chart configuration
  const [chartMetric, setChartMetric] = useState<'volume' | 'count'>('volume');
  const [chartStyle, setChartStyle] = useState<'line' | 'area'>('line');
  const [showSuccessLine, setShowSuccessLine] = useState<boolean>(true);
  const [showFailedLine, setShowFailedLine] = useState<boolean>(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'succeeded' | 'failed'>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');

  // Modals & Inspect
  const [selectedItemForJson, setSelectedItemForJson] = useState<PaymentIntentLogItem | null>(null);
  const [showTestModal, setShowTestModal] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [testSimulating, setTestSimulating] = useState<boolean>(false);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Verbose Mode state (showing raw JSON responses alongside standard metadata)
  const [isVerboseMode, setIsVerboseMode] = useState<boolean>(false);
  const [collapsedVerboseIds, setCollapsedVerboseIds] = useState<Record<string, boolean>>({});

  const toggleRowVerbose = (id: string) => {
    setCollapsedVerboseIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Test form state
  const [testAmount, setTestAmount] = useState<number>(45);
  const [testStatus, setTestStatus] = useState<'succeeded' | 'declined' | 'insufficient_funds' | 'expired_card'>('succeeded');
  const [testCustomerEmail, setTestCustomerEmail] = useState<string>('client_test@example.com');
  const [testCustomerName, setTestCustomerName] = useState<string>('Farhan Ahmed');
  const [testDescription, setTestDescription] = useState<string>('Pro Membership Renewal');

  // Show Toast Helper
  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch Payment Intents and 30-Day Trend
  const fetchTransactionData = useCallback(async (isBackground = false) => {
    if (!isBackground) setIsLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (manualSecretKey && manualSecretKey.trim()) {
        headers['x-stripe-secret-key'] = manualSecretKey.trim();
      }

      const res = await fetch('/api/payment-intents?limit=100', { headers });
      if (res.ok) {
        const data: TransactionLogsApiResponse = await res.json();
        setItems(data.data || []);
        setSummary(data.summary || null);
        setTrend30Days(data.trend30Days || []);
        setTrendSummary(data.trendSummary || null);
        setDataSource(data.source || 'session_store');
        setLastRefreshedAt(new Date().toLocaleTimeString());
      }
    } catch (err: any) {
      console.error('Failed to load transaction logs:', err);
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  }, [manualSecretKey]);

  // Initial mount load
  useEffect(() => {
    fetchTransactionData();
  }, [fetchTransactionData]);

  // Polling countdown mechanism
  useEffect(() => {
    if (!isPolling) return;
    setCountdown(pollingSeconds);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchTransactionData(true);
          return pollingSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPolling, pollingSeconds, fetchTransactionData]);

  // Copy helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Trigger quick test attempt
  const handleSimulatePaymentAttempt = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestSimulating(true);
    try {
      const isSuccess = testStatus === 'succeeded';
      let errorObj: any = undefined;

      if (testStatus === 'declined') {
        errorObj = { code: 'card_declined', declineCode: 'generic_decline', message: 'Your card was declined by issuing bank (card_declined)', type: 'card_error' };
      } else if (testStatus === 'insufficient_funds') {
        errorObj = { code: 'card_declined', declineCode: 'insufficient_funds', message: 'Your card has insufficient funds (insufficient_funds)', type: 'card_error' };
      } else if (testStatus === 'expired_card') {
        errorObj = { code: 'expired_card', message: 'Your card has expired (expired_card)', type: 'card_error' };
      }

      const res = await fetch('/api/payment-intents/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: testAmount,
          currency: 'USD',
          status: isSuccess ? 'succeeded' : 'requires_payment_method',
          customerEmail: testCustomerEmail,
          customerName: testCustomerName,
          description: testDescription,
          cardBrand: isSuccess ? 'visa' : 'mastercard',
          cardLast4: isSuccess ? '4242' : '0002',
          lastPaymentError: errorObj,
          receiptUrl: isSuccess ? `https://pay.stripe.com/receipts/test_rcpt_${Date.now()}` : undefined,
        }),
      });

      if (res.ok) {
        setShowTestModal(false);
        await fetchTransactionData();
        showToast(
          isSuccess
            ? (lang === 'bn' ? `✅ $${testAmount} সফল পেমেন্ট রেকর্ড সম্পন্ন হয়েছে!` : `✅ $${testAmount} Successful payment recorded!`)
            : (lang === 'bn' ? `❌ ব্যর্থ পেমেন্ট প্রচেষ্টা সফলভাবে লগ করা হয়েছে` : `❌ Failed payment attempt logged successfully`),
          isSuccess ? 'success' : 'info'
        );
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to simulate payment', 'error');
    } finally {
      setTestSimulating(false);
    }
  };

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Status filter
      if (statusFilter === 'succeeded' && !item.isSuccess) return false;
      if (statusFilter === 'failed' && !item.isFailed) return false;

      // Brand filter
      if (brandFilter !== 'all' && item.cardBrand?.toLowerCase() !== brandFilter.toLowerCase()) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const idMatch = item.id.toLowerCase().includes(q);
        const emailMatch = item.customerEmail?.toLowerCase().includes(q) || false;
        const nameMatch = item.customerName?.toLowerCase().includes(q) || false;
        const descMatch = item.description?.toLowerCase().includes(q) || false;
        const amountMatch = item.amount.toString().includes(q);
        const errMatch = item.lastPaymentError?.message?.toLowerCase().includes(q) || false;
        return idMatch || emailMatch || nameMatch || descMatch || amountMatch || errMatch;
      }

      return true;
    });
  }, [items, statusFilter, brandFilter, searchQuery]);

  // Export Visible Transactions to CSV for external spreadsheet analysis
  const handleExportCsv = (onlyVisible: boolean = true) => {
    const dataset = onlyVisible ? filteredItems : items;
    if (dataset.length === 0) {
      showToast(
        lang === 'bn' ? 'এক্সপোর্ট করার মতো কোনো দৃশ্যমান লেনদেন পাওয়া যায়নি।' : 'No visible transactions available to export.',
        'info'
      );
      return;
    }

    const headers = [
      'PaymentIntent_ID',
      'Status',
      'Amount_USD',
      'Currency',
      'Is_Success',
      'Is_Failed',
      'Customer_Name',
      'Customer_Email',
      'Payment_Method',
      'Card_Brand',
      'Card_Last4',
      'Description',
      'Error_Code',
      'Error_Decline_Code',
      'Error_Message',
      'Date',
      'Time',
      'Created_ISO',
      'Created_Unix',
      'Livemode',
      'Receipt_URL',
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val);
      return `"${str.replace(/"/g, '""')}"`;
    };

    const rows = dataset.map((i) => [
      escapeCsv(i.id),
      escapeCsv(i.status),
      i.amount.toFixed(2),
      escapeCsv(i.currency),
      i.isSuccess ? 'TRUE' : 'FALSE',
      i.isFailed ? 'TRUE' : 'FALSE',
      escapeCsv(i.customerName || ''),
      escapeCsv(i.customerEmail || ''),
      escapeCsv(i.paymentMethodType || 'card'),
      escapeCsv(i.cardBrand || ''),
      escapeCsv(i.cardLast4 || ''),
      escapeCsv(i.description || ''),
      escapeCsv(i.lastPaymentError?.code || ''),
      escapeCsv(i.lastPaymentError?.declineCode || ''),
      escapeCsv(i.lastPaymentError?.message || ''),
      escapeCsv(i.dateFormatted),
      escapeCsv(i.timestamp),
      escapeCsv(i.createdAt),
      i.created,
      i.livemode ? 'TRUE' : 'FALSE',
      escapeCsv(i.receiptUrl || ''),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const filterSuffix = statusFilter !== 'all' ? `-${statusFilter}` : '';
    const filename = `stripe-transactions${filterSuffix}-${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(
      lang === 'bn'
        ? `📥 ${dataset.length}টি দৃশ্যমান লেনদেন সফলভাবে CSV ফাইলে ডাউনলোড হয়েছে!`
        : `📥 Successfully exported ${dataset.length} visible transactions to ${filename}!`,
      'success'
    );
  };

  return (
    <div className="space-y-6 text-left">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-in slide-in-from-top-4 duration-200">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl border text-xs font-semibold flex items-center gap-2.5 backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40 shadow-emerald-950/50'
                : toast.type === 'error'
                ? 'bg-rose-950/90 text-rose-200 border-rose-500/40 shadow-rose-950/50'
                : 'bg-indigo-950/90 text-indigo-200 border-indigo-500/40 shadow-indigo-950/50'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            )}
            <span>{toast.text}</span>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 lg:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-500/10 via-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
                Stripe PaymentIntents API
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                  dataSource === 'stripe_api'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                }`}
              >
                {dataSource === 'stripe_api' ? '⚡ Live Stripe Cloud Sync' : '🧪 Session Test Store'}
              </span>
            </div>

            <h2 className="text-xl lg:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
              {lang === 'bn'
                ? 'ট্রানজ্যাকশন লগ ও ৩০ দিনের ভলিউম ট্রেন্ড'
                : 'Transaction Logs & 30-Day Volume Trends'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              {lang === 'bn'
                ? 'Stripe PaymentIntents এপিআই সমন্বিত রিয়েল-টাইম লেনদেন হিস্ট্রি। গত ৩০ দিনের সফল বনাম ব্যর্থ লেনদেন ভলিউমের কম্প্যারেটিভ ট্রেন্ড লাইন অ্যানালিটিক্স।'
                : "Real-time payment attempts via Stripe PaymentIntents API. Interactive Recharts trend line of successful vs. failed transaction volumes over the last 30 days."}
            </p>
          </div>

          {/* Right Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Polling Toggle */}
            <button
              type="button"
              onClick={() => setIsPolling(!isPolling)}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                isPolling
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title={lang === 'bn' ? 'স্বয়ংক্রিয় পোলিং' : 'Toggle live auto-polling'}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isPolling ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'
                }`}
              />
              {isPolling ? (
                <span className="flex items-center gap-1 font-mono text-[11px]">
                  <Timer className="w-3 h-3 text-emerald-400" />
                  <span className="font-bold">{countdown}s</span>
                  <span className="text-slate-400">Poll</span>
                </span>
              ) : (
                <span className="text-[11px]">{lang === 'bn' ? 'পোলিং বন্ধ' : 'Poll Off'}</span>
              )}
            </button>

            {/* Manual Refresh */}
            <button
              type="button"
              onClick={() => fetchTransactionData()}
              disabled={isLoading}
              className="px-3.5 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{lang === 'bn' ? 'রিফ্রেশ' : 'Refresh'}</span>
            </button>

            {/* Simulate / Test Transaction */}
            <button
              type="button"
              onClick={() => setShowTestModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-950/40 flex items-center gap-2 transition cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-200" />
              <span>{lang === 'bn' ? 'পেমেন্ট টেস্ট করুন' : 'Simulate Payment'}</span>
            </button>

            {/* Export CSV Button (Header) */}
            <button
              type="button"
              onClick={() => handleExportCsv(true)}
              className="px-3.5 py-2 bg-slate-950 border border-slate-700/80 hover:border-emerald-500/60 hover:bg-slate-900 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-sm group"
              title={lang === 'bn' ? 'দৃশ্যমান ট্রানজ্যাকশন ডেটা CSV ফাইলে এক্সপোর্ট করুন' : 'Export visible transaction data to CSV file'}
            >
              <Download className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>{lang === 'bn' ? 'Export to CSV' : 'Export to CSV'}</span>
              <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 font-mono text-[10px] px-1.5 py-0.5 rounded-md font-bold">
                {filteredItems.length}
              </span>
            </button>
          </div>
        </div>

        {/* Polling Timestamp Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-slate-500" />
              {lang === 'bn' ? 'সর্বশেষ সিঙ্ক:' : 'Last Synced:'}
              <strong className="text-slate-300 font-mono">{lastRefreshedAt || 'Just now'}</strong>
            </span>
            <span>•</span>
            <span>
              {lang === 'bn' ? 'মোট সংরক্ষিত রেকর্ড:' : 'Total Ledger Records:'}{' '}
              <strong className="text-white font-mono">{items.length}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Success: #10b981</span>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 ml-2" />
            <span>Failed: #f43f5e</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: 30-Day Successful Volume */}
        <div className="bg-slate-900/80 border border-emerald-500/20 rounded-2xl p-4 shadow-lg relative overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              {lang === 'bn' ? '৩০ দিনের সফল ভলিউম' : '30-Day Success Volume'}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-mono font-bold">
              {trendSummary?.successfulCount || summary?.succeededCount || 0} txns
            </span>
          </div>
          <div className="text-2xl font-black text-white font-mono tracking-tight mt-1">
            ${(trendSummary?.total30DaySuccessfulVolume || summary?.totalVolumeUsd || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-emerald-400/90 mt-1 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            {lang === 'bn' ? 'সফলভাবে চার্জ সম্পন্ন' : 'Settled successfully'}
          </p>
        </div>

        {/* KPI 2: 30-Day Failed Volume */}
        <div className="bg-slate-900/80 border border-rose-500/20 rounded-2xl p-4 shadow-lg relative overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <TrendingDown className="w-4 h-4 text-rose-400" />
              {lang === 'bn' ? '৩০ দিনের ব্যর্থ ভলিউম' : '30-Day Failed Volume'}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 font-mono font-bold">
              {trendSummary?.failedCount || summary?.failedCount || 0} failed
            </span>
          </div>
          <div className="text-2xl font-black text-white font-mono tracking-tight mt-1">
            ${(trendSummary?.total30DayFailedVolume || summary?.failedVolumeUsd || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-rose-400/90 mt-1 flex items-center gap-1 font-medium">
            <AlertCircle className="w-3 h-3 text-rose-400" />
            {lang === 'bn'
              ? `ফেইলিউর রেট: ${trendSummary?.failureRate30Day || 0}%`
              : `Failure Rate: ${trendSummary?.failureRate30Day || 0}%`}
          </p>
        </div>

        {/* KPI 3: Success Rate */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg relative overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <Activity className="w-4 h-4 text-cyan-400" />
              {lang === 'bn' ? 'নেট সাকসেস রেট' : 'Overall Success Rate'}
            </span>
            <span className="text-[10px] font-mono text-cyan-400">30 Days</span>
          </div>
          <div className="text-2xl font-black text-white font-mono tracking-tight mt-1">
            {summary?.successRate ?? (trendSummary ? 100 - trendSummary.failureRate30Day : 95)}%
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-950 rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-teal-500 to-emerald-400 h-1.5 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max(0, summary?.successRate ?? (trendSummary ? 100 - trendSummary.failureRate30Day : 95)))}%`,
              }}
            />
          </div>
        </div>

        {/* KPI 4: Daily Throughput & Peak */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg relative overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <DollarSign className="w-4 h-4 text-purple-400" />
              {lang === 'bn' ? 'গড় দৈনিক ভলিউম' : 'Avg Daily Throughput'}
            </span>
            <span className="text-[10px] text-purple-400 font-mono">Daily</span>
          </div>
          <div className="text-2xl font-black text-white font-mono tracking-tight mt-1">
            ${(trendSummary?.avgDailyVolume || 285).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            {lang === 'bn' ? 'সর্বোচ্চ পিক দিন:' : 'Peak Day:'}{' '}
            <strong className="text-slate-200">{trendSummary?.peakDay?.label || 'Today'} (${trendSummary?.peakDay?.volume || 0})</strong>
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 30-DAY TREND LINE RECHARTS SECTION */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 lg:p-6 shadow-2xl space-y-4">
        {/* Chart Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>
                {lang === 'bn'
                  ? '৩০ দিনের লেনদেন ভলিউম ট্রেন্ড (সফল বনাম ব্যর্থ)'
                  : '30-Day Transaction Volume Trend: Successful vs. Failed'}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {lang === 'bn'
                ? 'দৈনিক তুলনামূলক চার্ট: সবুজ লাইন = সফল লেনদেন ($), লাল লাইন = ব্যর্থ প্রচেষ্টা ($)'
                : 'Daily comparative curve: Emerald line = Successful volume ($), Rose line = Failed attempts ($)'}
            </p>
          </div>

          {/* Metric & Style Switchers */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Metric Toggle: Volume ($) vs Count (#) */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center text-xs">
              <button
                type="button"
                onClick={() => setChartMetric('volume')}
                className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  chartMetric === 'volume'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {lang === 'bn' ? 'ভলিউম ($ USD)' : 'Volume ($ USD)'}
              </button>
              <button
                type="button"
                onClick={() => setChartMetric('count')}
                className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  chartMetric === 'count'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {lang === 'bn' ? 'সংখ্যা (# Txns)' : 'Count (# Txns)'}
              </button>
            </div>

            {/* Style Toggle: Line vs Area */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center text-xs">
              <button
                type="button"
                onClick={() => setChartStyle('line')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  chartStyle === 'line'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Line Trend"
              >
                Trend Lines
              </button>
              <button
                type="button"
                onClick={() => setChartStyle('area')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  chartStyle === 'area'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Area Wave"
              >
                Filled Area
              </button>
            </div>
          </div>
        </div>

        {/* Legend / Interactive Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setShowSuccessLine(!showSuccessLine)}
              className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                showSuccessLine
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-500 line-through opacity-60'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="font-semibold">
                {lang === 'bn' ? 'সফল ভলিউম (Successful)' : 'Successful Volume'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowFailedLine(!showFailedLine)}
              className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                showFailedLine
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : 'bg-slate-950 border-slate-800 text-slate-500 line-through opacity-60'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <span className="font-semibold">
                {lang === 'bn' ? 'ব্যর্থ ভলিউম (Failed)' : 'Failed Volume'}
              </span>
            </button>
          </div>

          <span className="text-[11px] text-slate-400 font-mono">
            {lang === 'bn' ? '৩০ দিনের সময়রেখা' : '30-Day Continuous Timeline'}
          </span>
        </div>

        {/* Recharts Chart Area */}
        <div className="h-72 sm:h-80 w-full pt-2">
          {trend30Days.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mb-2 text-indigo-400" />
              <span>Loading 30-day transaction volume trend...</span>
            </div>
          ) : chartStyle === 'line' ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend30Days} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#475569"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickLine={false}
                  interval={3}
                />
                <YAxis
                  stroke="#475569"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickLine={false}
                  tickFormatter={(val) => (chartMetric === 'volume' ? `$${val}` : `${val}`)}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const dataPoint = payload[0].payload as DailyTrendPoint;
                      return (
                        <div className="bg-slate-900/95 border border-slate-700/80 p-3.5 rounded-2xl shadow-2xl backdrop-blur-md text-xs space-y-2 min-w-[210px]">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                            <span className="font-bold text-white flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                              {dataPoint.label}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {dataPoint.date}
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-4">
                              <span className="flex items-center gap-1.5 text-emerald-300">
                                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                {lang === 'bn' ? 'সফল:' : 'Successful:'}
                              </span>
                              <span className="font-mono font-bold text-white">
                                ${dataPoint.successfulVolume.toFixed(2)}{' '}
                                <span className="text-[10px] text-slate-400">({dataPoint.successfulCount} txns)</span>
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-4">
                              <span className="flex items-center gap-1.5 text-rose-300">
                                <span className="w-2 h-2 rounded-full bg-rose-400" />
                                {lang === 'bn' ? 'ব্যর্থ:' : 'Failed:'}
                              </span>
                              <span className="font-mono font-bold text-white">
                                ${dataPoint.failedVolume.toFixed(2)}{' '}
                                <span className="text-[10px] text-slate-400">({dataPoint.failedCount} txns)</span>
                              </span>
                            </div>

                            <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                              <span>Total Vol: ${dataPoint.totalVolume.toFixed(2)}</span>
                              <span className="text-emerald-400 font-bold">
                                {dataPoint.successRate}% Success
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {showSuccessLine && (
                  <Line
                    type="monotone"
                    dataKey={chartMetric === 'volume' ? 'successfulVolume' : 'successfulCount'}
                    name={lang === 'bn' ? 'সফল ভলিউম' : 'Successful Volume'}
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: '#10b981', r: 2 }}
                    activeDot={{ r: 6, fill: '#34d399', stroke: '#064e3b', strokeWidth: 2 }}
                  />
                )}
                {showFailedLine && (
                  <Line
                    type="monotone"
                    dataKey={chartMetric === 'volume' ? 'failedVolume' : 'failedCount'}
                    name={lang === 'bn' ? 'ব্যর্থ ভলিউম' : 'Failed Volume'}
                    stroke="#f43f5e"
                    strokeWidth={2.5}
                    dot={{ fill: '#f43f5e', r: 2 }}
                    activeDot={{ r: 6, fill: '#fb7185', stroke: '#881337', strokeWidth: 2 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend30Days} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="successGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="failedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#475569"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickLine={false}
                  interval={3}
                />
                <YAxis
                  stroke="#475569"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickLine={false}
                  tickFormatter={(val) => (chartMetric === 'volume' ? `$${val}` : `${val}`)}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const dataPoint = payload[0].payload as DailyTrendPoint;
                      return (
                        <div className="bg-slate-900/95 border border-slate-700/80 p-3.5 rounded-2xl shadow-2xl backdrop-blur-md text-xs space-y-2 min-w-[200px]">
                          <div className="font-bold text-white border-b border-slate-800 pb-1 flex items-center justify-between">
                            <span>{dataPoint.label}</span>
                            <span className="font-mono text-[10px] text-slate-400">{dataPoint.date}</span>
                          </div>
                          <div className="flex justify-between items-center text-emerald-300">
                            <span>Successful:</span>
                            <span className="font-mono font-bold text-white">${dataPoint.successfulVolume.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center text-rose-300">
                            <span>Failed:</span>
                            <span className="font-mono font-bold text-white">${dataPoint.failedVolume.toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {showSuccessLine && (
                  <Area
                    type="monotone"
                    dataKey={chartMetric === 'volume' ? 'successfulVolume' : 'successfulCount'}
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#successGrad)"
                  />
                )}
                {showFailedLine && (
                  <Area
                    type="monotone"
                    dataKey={chartMetric === 'volume' ? 'failedVolume' : 'failedCount'}
                    stroke="#f43f5e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#failedGrad)"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Trend Insights Footer */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>
              {lang === 'bn' ? '৩০ দিনের পিক ভলিউম:' : '30-Day Peak Day:'}{' '}
              <strong className="text-white font-mono">{trendSummary?.peakDay?.label} (${trendSummary?.peakDay?.volume || 0})</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>
              {lang === 'bn' ? 'গড় দৈনিক ট্রানজেকশন:' : 'Average Daily:'}{' '}
              <strong className="text-white font-mono">${trendSummary?.avgDailyVolume || 0} USD</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <span>
              {lang === 'bn' ? 'মোট ৩০ দিনের টার্নওভার:' : '30-Day Gross Volume:'}{' '}
              <strong className="text-white font-mono">${trendSummary?.total30DayVolume || 0} USD</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TRANSACTION LOGS TABLE & INSPECTOR SECTION */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 lg:p-6 shadow-2xl space-y-4">
        {/* Table Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                lang === 'bn'
                  ? 'PaymentIntent ID (pi_...), গ্রাহকের ইমেইল বা কার্ড খুঁজুন...'
                  : 'Search by PaymentIntent ID, customer email, amount, or error...'
              }
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {lang === 'bn' ? 'সকল' : 'All'} ({items.length})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('succeeded')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'succeeded'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-950 border border-slate-800 text-emerald-400 hover:bg-emerald-500/10'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'সফল' : 'Succeeded'} ({summary?.succeededCount || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('failed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'failed'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-950 border border-slate-800 text-rose-400 hover:bg-rose-500/10'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'ব্যর্থ / ডিক্লাইন' : 'Failed'} ({summary?.failedCount || 0})</span>
            </button>

            {/* Brand Filter */}
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">{lang === 'bn' ? 'সকল ব্র্যান্ড' : 'All Brands'}</option>
              <option value="visa">Visa</option>
              <option value="mastercard">Mastercard</option>
              <option value="link">Stripe Link</option>
            </select>

            {/* Verbose Mode Toggle */}
            <button
              type="button"
              onClick={() => setIsVerboseMode(!isVerboseMode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer border shadow-sm ${
                isVerboseMode
                  ? 'bg-indigo-600/25 border-indigo-500 text-indigo-300 ring-2 ring-indigo-500/30'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
              title={
                lang === 'bn'
                  ? 'ভার্বোজ মোড: প্রতিটি লেনদেনের সাথে Stripe API-এর Raw JSON রেসপন্স দেখুন'
                  : 'Toggle Verbose Mode: View raw JSON responses from Stripe API calls alongside standard metadata'
              }
            >
              <Code2 className={`w-3.5 h-3.5 ${isVerboseMode ? 'text-indigo-400 animate-pulse' : 'text-slate-400'}`} />
              <span>{lang === 'bn' ? 'Verbose Mode' : 'Verbose Mode'}</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase transition ${
                  isVerboseMode
                    ? 'bg-indigo-500 text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {isVerboseMode ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Export to CSV Button in Table Controls Bar */}
            <button
              type="button"
              onClick={() => handleExportCsv(true)}
              disabled={filteredItems.length === 0}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/60 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm ml-auto sm:ml-0"
              title={lang === 'bn' ? 'বর্তমান ফিল্টারকৃত ট্রানজ্যাকশন CSV ফাইলে ডাউনলোড করুন' : 'Export visible transactions to downloadable CSV'}
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === 'bn' ? 'Export to CSV' : 'Export to CSV'}</span>
              <span className="bg-slate-950 text-emerald-300 font-mono text-[10px] px-1.5 py-0.5 rounded-full border border-slate-800 font-bold">
                {filteredItems.length}
              </span>
            </button>
          </div>
        </div>

        {/* Verbose Mode Active Banner */}
        {isVerboseMode && (
          <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-3.5 px-4 flex flex-wrap items-center justify-between text-xs text-indigo-200 backdrop-blur-sm animate-in fade-in duration-200 gap-3">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0">
                <Terminal className="w-4 h-4" />
              </span>
              <div>
                <p className="font-bold text-white flex items-center gap-2">
                  <span>{lang === 'bn' ? 'ভার্বোজ মোড সক্রিয়' : 'Verbose Mode Active'}</span>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono px-2 py-0.5 rounded-full font-semibold">
                    Stripe API Raw Payloads Inline
                  </span>
                </p>
                <p className="text-[11px] text-indigo-300/90 mt-0.5">
                  {lang === 'bn'
                    ? 'প্রতিটি ট্রানজ্যাকশন রো-এর সাথে সম্পূর্ণ Stripe API Raw JSON রেসপন্স এবং স্ট্যান্ডার্ড মেটাডাটা পাশাপাশি প্রদর্শিত হচ্ছে।'
                    : 'Displaying complete Stripe API Raw JSON responses alongside standard metadata for every transaction.'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const anyCollapsed = Object.values(collapsedVerboseIds).some(Boolean);
                  if (anyCollapsed) {
                    setCollapsedVerboseIds({});
                  } else {
                    const allCollapsed: Record<string, boolean> = {};
                    filteredItems.forEach((i) => {
                      allCollapsed[i.id] = true;
                    });
                    setCollapsedVerboseIds(allCollapsed);
                  }
                }}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-indigo-500/30 text-indigo-300 rounded-lg text-[11px] font-semibold transition cursor-pointer"
              >
                {Object.values(collapsedVerboseIds).some(Boolean)
                  ? (lang === 'bn' ? 'সব JSON প্রসারিত করুন' : 'Expand All JSON')
                  : (lang === 'bn' ? 'সব JSON সংক্ষেপ করুন' : 'Collapse All JSON')}
              </button>
              <button
                type="button"
                onClick={() => setIsVerboseMode(false)}
                className="p-1 text-indigo-400 hover:text-white rounded cursor-pointer"
                title="Exit Verbose Mode"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Transactions Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-950/60">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-semibold tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">{lang === 'bn' ? 'স্ট্যাটাস' : 'Status'}</th>
                <th className="py-3 px-4">{lang === 'bn' ? 'পরিমাণ' : 'Amount'}</th>
                <th className="py-3 px-4">{lang === 'bn' ? 'গ্রাহক ও মেথড' : 'Customer & Method'}</th>
                <th className="py-3 px-4">{lang === 'bn' ? 'বিবরণ / কারণ' : 'Description / Reason'}</th>
                <th className="py-3 px-4">{lang === 'bn' ? 'সময় ও তারিখ' : 'Timestamp'}</th>
                <th className="py-3 px-4">{lang === 'bn' ? 'PaymentIntent ID' : 'Intent ID'}</th>
                <th className="py-3 px-4 text-right">{lang === 'bn' ? 'অ্যাকশন' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    <Activity className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-50" />
                    <p className="font-medium">
                      {lang === 'bn'
                        ? 'কোনো লেনদেন রেকর্ড খুঁজে পাওয়া যায়নি।'
                        : 'No transaction attempts match your filter.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowTestModal(true)}
                      className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer underline"
                    >
                      {lang === 'bn' ? 'একটি টেস্ট পেমেন্ট তৈরি করুন' : 'Simulate a test payment attempt'}
                    </button>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isSuccess = item.isSuccess;
                  const isFailed = item.isFailed;
                  const isVerboseOpen = isVerboseMode && !collapsedVerboseIds[item.id];

                  return (
                    <React.Fragment key={item.id}>
                      <tr
                        className={`hover:bg-slate-900/40 transition group ${
                          isVerboseOpen ? 'bg-slate-900/30' : ''
                        }`}
                      >
                        {/* Status */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              isSuccess
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : isFailed
                                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {isSuccess ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            ) : isFailed ? (
                              <AlertCircle className="w-3 h-3 text-rose-400" />
                            ) : (
                              <Clock className="w-3 h-3 text-amber-400" />
                            )}
                            <span>
                              {isSuccess
                                ? (lang === 'bn' ? 'সফল' : 'Succeeded')
                                : isFailed
                                ? (lang === 'bn' ? 'ব্যর্থ' : 'Failed')
                                : item.status}
                            </span>
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-mono font-bold text-white text-sm">
                            ${item.amount.toFixed(2)}{' '}
                            <span className="text-[10px] text-slate-400 font-normal">
                              {item.currency}
                            </span>
                          </div>
                        </td>

                        {/* Customer & Method */}
                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            <p className="font-semibold text-slate-200 text-xs">
                              {item.customerName || 'Anonymous Customer'}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono truncate max-w-[170px]">
                              {item.customerEmail || 'no-email@test.stripe'}
                            </p>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-0.5">
                              <CreditCard className="w-3 h-3 text-slate-500" />
                              <span className="uppercase font-semibold text-slate-300">
                                {item.cardBrand || 'Card'}
                              </span>
                              <span>•••• {item.cardLast4 || '4242'}</span>
                            </div>
                          </div>
                        </td>

                        {/* Description / Error Reason */}
                        <td className="py-3 px-4 max-w-xs">
                          <p className="text-slate-300 text-xs truncate">
                            {item.description || 'Stripe Gateway Charge'}
                          </p>
                          {item.lastPaymentError && (
                            <div className="mt-1 flex items-start gap-1 text-[11px] text-rose-400 font-medium bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-500/20">
                              <ShieldAlert className="w-3 h-3 shrink-0 mt-0.5" />
                              <span className="truncate" title={item.lastPaymentError.message}>
                                {item.lastPaymentError.message || item.lastPaymentError.code}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Timestamp */}
                        <td className="py-3 px-4 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                          <div>{item.dateFormatted}</div>
                          <div className="text-[10px] text-slate-400">{item.timestamp}</div>
                        </td>

                        {/* Intent ID */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-mono text-xs">
                            <span className="text-indigo-400 max-w-[110px] truncate" title={item.id}>
                              {item.id}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(item.id, item.id)}
                              className="p-1 text-slate-500 hover:text-slate-300 rounded cursor-pointer"
                              title="Copy Intent ID"
                            >
                              {copiedKey === item.id ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Action buttons */}
                        <td className="py-3 px-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Send Receipt button (if success) */}
                            {isSuccess && onDispatchReceiptModal && (
                              <button
                                type="button"
                                onClick={() => {
                                  onDispatchReceiptModal({
                                    recipientEmail: item.customerEmail || 'customer@example.com',
                                    customerName: item.customerName || 'Valued Customer',
                                    amount: Math.round(item.amount * 100),
                                    currency: item.currency,
                                    paymentIntentId: item.id,
                                    description: item.description || 'Stripe Verified Payment',
                                    status: 'succeeded',
                                  });
                                }}
                                className="px-2.5 py-1 bg-red-500/15 border border-red-500/30 text-red-300 hover:bg-red-500/25 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                                title={
                                  isGmailConnected
                                    ? 'Send official receipt via Gmail'
                                    : 'Connect Gmail in Gmail Hub first'
                                }
                              >
                                <Mail className="w-3 h-3 text-red-400" />
                                <span>{lang === 'bn' ? 'রসিদ' : 'Receipt'}</span>
                              </button>
                            )}

                            {/* Verbose row expand toggle (when Verbose Mode is enabled) */}
                            {isVerboseMode && (
                              <button
                                type="button"
                                onClick={() => toggleRowVerbose(item.id)}
                                className={`p-1.5 rounded-lg border text-xs font-mono transition cursor-pointer ${
                                  isVerboseOpen
                                    ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300'
                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                                }`}
                                title={isVerboseOpen ? 'Collapse Verbose JSON' : 'Expand Verbose JSON'}
                              >
                                {isVerboseOpen ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}

                            {/* Raw JSON Inspector Modal */}
                            <button
                              type="button"
                              onClick={() => setSelectedItemForJson(item)}
                              className="p-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                              title="Inspect Raw JSON"
                            >
                              <Code2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Verbose Mode: Raw JSON response alongside standard metadata */}
                      {isVerboseOpen && (
                        <tr className="bg-slate-950/90 border-b border-indigo-950/80 animate-in fade-in duration-150">
                          <td colSpan={7} className="p-4 pt-1 pb-4">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 bg-slate-900/90 rounded-2xl border border-indigo-500/25 p-4 shadow-xl">
                              {/* Left Column: Standard Metadata Breakdown */}
                              <div className="lg:col-span-5 space-y-3">
                                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                                  <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                                    {lang === 'bn' ? 'স্ট্যান্ডার্ড মেটাডাটা' : 'Standard Metadata'}
                                  </span>
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-indigo-300 border border-indigo-500/20 font-semibold">
                                    object: payment_intent
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-[11px]">
                                  <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800/80">
                                    <span className="text-slate-500 block text-[10px]">Stripe ID</span>
                                    <span className="font-mono text-indigo-300 font-semibold truncate block" title={item.id}>
                                      {item.id}
                                    </span>
                                  </div>

                                  <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800/80">
                                    <span className="text-slate-500 block text-[10px]">Amount / Cents</span>
                                    <span className="font-mono text-white font-bold block">
                                      ${item.amount.toFixed(2)} ({item.amountRaw} {item.currency})
                                    </span>
                                  </div>

                                  <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800/80">
                                    <span className="text-slate-500 block text-[10px]">Livemode</span>
                                    <span className="font-mono text-slate-300 font-medium block">
                                      {item.livemode ? 'true (Production)' : 'false (Test Mode)'}
                                    </span>
                                  </div>

                                  <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800/80">
                                    <span className="text-slate-500 block text-[10px]">Created Epoch</span>
                                    <span className="font-mono text-slate-300 font-medium block">
                                      {item.created} ({item.timestamp})
                                    </span>
                                  </div>

                                  <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800/80">
                                    <span className="text-slate-500 block text-[10px]">Card Brand & Last4</span>
                                    <span className="font-mono text-slate-200 font-semibold uppercase block">
                                      {item.cardBrand || 'card'} •••• {item.cardLast4 || '4242'}
                                    </span>
                                  </div>

                                  <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800/80">
                                    <span className="text-slate-500 block text-[10px]">Method Types</span>
                                    <span className="font-mono text-cyan-300 block">
                                      ['{item.paymentMethodType || 'card'}']
                                    </span>
                                  </div>
                                </div>

                                {/* Customer & Description Details */}
                                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 text-[11px] space-y-1">
                                  <div className="flex justify-between items-center text-slate-400">
                                    <span>Customer:</span>
                                    <span className="text-slate-200 font-medium">{item.customerName || 'None'}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-slate-400">
                                    <span>Email:</span>
                                    <span className="text-slate-200 font-mono text-[10px]">{item.customerEmail || 'None'}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-slate-400">
                                    <span>Description:</span>
                                    <span className="text-slate-300 truncate max-w-[200px]">{item.description || 'N/A'}</span>
                                  </div>
                                  {item.receiptUrl && (
                                    <div className="flex justify-between items-center text-slate-400 pt-1 border-t border-slate-900">
                                      <span>Receipt:</span>
                                      <a
                                        href={item.receiptUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-cyan-400 hover:underline flex items-center gap-1 font-medium text-[10px]"
                                      >
                                        View Receipt <ExternalLink className="w-2.5 h-2.5" />
                                      </a>
                                    </div>
                                  )}
                                </div>

                                {/* Error Details (if failed) */}
                                {item.lastPaymentError && (
                                  <div className="bg-rose-950/30 border border-rose-500/30 p-2.5 rounded-xl text-[11px] space-y-1">
                                    <div className="flex items-center gap-1.5 text-rose-300 font-bold text-xs">
                                      <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                                      <span>Last Payment Error</span>
                                    </div>
                                    <div className="text-rose-200 font-mono text-[10px]">
                                      code: <strong className="text-rose-400">{item.lastPaymentError.code}</strong>
                                      {item.lastPaymentError.declineCode && (
                                        <> | decline_code: <strong className="text-rose-400">{item.lastPaymentError.declineCode}</strong></>
                                      )}
                                    </div>
                                    <p className="text-rose-300 text-[11px] leading-relaxed">
                                      {item.lastPaymentError.message}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* Right Column: Raw Stripe API JSON Response */}
                              <div className="lg:col-span-7 flex flex-col space-y-2">
                                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5 font-mono">
                                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                                    Raw Stripe API Response JSON
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-mono text-slate-500">
                                      HTTP {item.isSuccess ? '200 OK' : '402 Payment Required'}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleCopy(JSON.stringify(item.rawResponse || item, null, 2), `verbose-${item.id}`)}
                                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-[10px] flex items-center gap-1 transition cursor-pointer"
                                      title="Copy raw JSON"
                                    >
                                      {copiedKey === `verbose-${item.id}` ? (
                                        <>
                                          <Check className="w-3 h-3 text-emerald-400" />
                                          <span className="text-emerald-400">Copied</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-3 h-3 text-slate-400" />
                                          <span>Copy JSON</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>

                                {/* Raw JSON Code Block */}
                                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 font-mono text-[11px] text-emerald-400 leading-relaxed overflow-x-auto max-h-72 overflow-y-auto selection:bg-emerald-500/30 selection:text-white shadow-inner">
                                  <pre>{JSON.stringify(item.rawResponse || item, null, 2)}</pre>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: RAW JSON INSPECTOR */}
      {/* ========================================================================= */}
      {selectedItemForJson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white font-mono">
                  {selectedItemForJson.id}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(JSON.stringify(selectedItemForJson, null, 2), 'raw-json')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'raw-json' ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>Copy JSON</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedItemForJson(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-xs text-emerald-400 leading-relaxed">
              <pre>{JSON.stringify(selectedItemForJson, null, 2)}</pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedItemForJson(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SIMULATE PAYMENT ATTEMPT */}
      {/* ========================================================================= */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    {lang === 'bn' ? 'টেস্ট লেনদেন সিমুলেশন' : 'Simulate Payment Attempt'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {lang === 'bn'
                      ? 'সফল বা ব্যর্থ চার্জ তৈরি করুন যা তাৎক্ষণিকভাবে ট্রেন্ড লাইনে যুক্ত হবে।'
                      : 'Record a new payment to update the 30-day trend line & transaction ledger instantly.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTestModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSimulatePaymentAttempt} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  {lang === 'bn' ? 'পেমেন্ট ফলাফল (Outcome Status)' : 'Simulation Outcome'}
                </label>
                <select
                  value={testStatus}
                  onChange={(e) => setTestStatus(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-indigo-500 focus:outline-none"
                >
                  <option value="succeeded">✅ Succeeded ($25 - $250 Payment Settled)</option>
                  <option value="declined">❌ Card Declined (card_declined)</option>
                  <option value="insufficient_funds">❌ Insufficient Funds (insufficient_funds)</option>
                  <option value="expired_card">❌ Expired Card (expired_card)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">
                    {lang === 'bn' ? 'টাকার পরিমাণ ($ USD)' : 'Amount ($ USD)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5000"
                    step="0.5"
                    value={testAmount}
                    onChange={(e) => setTestAmount(parseFloat(e.target.value) || 10)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">
                    {lang === 'bn' ? 'গ্রাহকের নাম' : 'Customer Name'}
                  </label>
                  <input
                    type="text"
                    value={testCustomerName}
                    onChange={(e) => setTestCustomerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  {lang === 'bn' ? 'গ্রাহকের ইমেইল' : 'Customer Email'}
                </label>
                <input
                  type="email"
                  value={testCustomerEmail}
                  onChange={(e) => setTestCustomerEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  {lang === 'bn' ? 'লেনদেনের বিবরণ' : 'Description'}
                </label>
                <input
                  type="text"
                  value={testDescription}
                  onChange={(e) => setTestDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={testSimulating}
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 cursor-pointer disabled:opacity-50"
                >
                  {testSimulating ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5" />
                  )}
                  <span>{lang === 'bn' ? 'রেকর্ড সম্পন্ন করুন' : 'Confirm & Record'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
