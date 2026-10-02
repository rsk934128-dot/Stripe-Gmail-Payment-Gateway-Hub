import React, { useState } from 'react';
import {
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Lock,
  Eye,
  EyeOff,
  Server,
  Terminal,
  HelpCircle,
  Activity,
  Clock,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileText,
  Copy,
  Check,
} from 'lucide-react';
import { StripeKeyStatus } from '../types';
import keyVaultBanner from '../assets/images/key_vault_banner_1790807145182.jpg';

export interface KeyValidationLog {
  id: string;
  timestamp: string;
  method: string;
  endpoint: string;
  statusCode: number;
  statusText: string;
  durationMs: number;
  source: string;
  success: boolean;
  message: string;
  details?: Record<string, any>;
}

interface KeyVerifierTabProps {
  serverKeyConfigured: boolean;
  manualSecretKey: string;
  setManualSecretKey: (k: string) => void;
  publishableKey: string;
  setPublishableKey: (k: string) => void;
  keyStatus: StripeKeyStatus | null;
  setKeyStatus: (s: StripeKeyStatus | null) => void;
  lang?: 'bn' | 'en';
}

export const KeyVerifierTab: React.FC<KeyVerifierTabProps> = ({
  serverKeyConfigured,
  manualSecretKey,
  setManualSecretKey,
  publishableKey,
  setPublishableKey,
  keyStatus,
  setKeyStatus,
  lang = 'bn',
}) => {
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [useManualKey, setUseManualKey] = useState(false);
  const [logFilter, setLogFilter] = useState<'all' | 'success' | 'error'>('all');
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);

  // Real-time API validation logs state
  const [logs, setLogs] = useState<KeyValidationLog[]>([
    {
      id: 'log_init_01',
      timestamp: new Date(Date.now() - 1000 * 60 * 2).toLocaleTimeString(),
      method: 'POST',
      endpoint: '/api/verify-key',
      statusCode: 200,
      statusText: '200 OK',
      durationMs: 138,
      source: serverKeyConfigured ? '.env (Server)' : 'Simulation Mode',
      success: true,
      message: serverKeyConfigured
        ? 'Stripe secret key & balance verified'
        : 'Sandbox simulation engine active and verified',
      details: {
        success: true,
        message: 'API Key সম্পূর্ণ সঠিক এবং সক্রিয়!',
        mode: 'Test Mode',
        accountId: 'acct_test_sandbox_92',
        businessName: 'Stripe Gateway Hub',
        defaultCurrency: 'usd',
      },
    },
  ]);

  const handleVerify = async () => {
    setLoading(true);
    const startTime = performance.now();
    const sourceLabel = useManualKey ? 'Custom Key' : '.env (Server)';
    const timestampStr = new Date().toLocaleTimeString();
    const tempId = `log_${Date.now()}`;

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (useManualKey && manualSecretKey) {
        headers['x-stripe-secret-key'] = manualSecretKey.trim();
      }

      const res = await fetch('/api/verify-key', {
        method: 'POST',
        headers,
      });

      const durationMs = Math.round(performance.now() - startTime);
      const data = await res.json();
      setKeyStatus(data);

      const isSuccess = data.success ?? (res.status === 200);
      const newLog: KeyValidationLog = {
        id: tempId,
        timestamp: timestampStr,
        method: 'POST',
        endpoint: '/api/verify-key',
        statusCode: res.status,
        statusText: res.status === 200 ? '200 OK' : `${res.status} ${res.statusText || 'Bad Request'}`,
        durationMs,
        source: sourceLabel,
        success: isSuccess,
        message: data.message || data.error || (isSuccess ? 'API Key verified successfully' : 'Verification failed'),
        details: data,
      };

      setLogs((prev) => [newLog, ...prev]);
    } catch (err: any) {
      const durationMs = Math.round(performance.now() - startTime);
      const errorMsg = err.message || 'সার্ভার যোগাযোগে ত্রুটি ঘটেছে';
      setKeyStatus({
        success: false,
        error: errorMsg,
      });

      const failedLog: KeyValidationLog = {
        id: tempId,
        timestamp: timestampStr,
        method: 'POST',
        endpoint: '/api/verify-key',
        statusCode: 0,
        statusText: 'NET_ERR',
        durationMs,
        source: sourceLabel,
        success: false,
        message: errorMsg,
        details: { error: errorMsg },
      };

      setLogs((prev) => [failedLog, ...prev]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearLogs = () => {
    setLogs([]);
    setSelectedLogId(null);
  };

  const handleCopyLog = (log: KeyValidationLog) => {
    const text = JSON.stringify(log, null, 2);
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
    setCopiedLogId(log.id);
    setTimeout(() => setCopiedLogId(null), 2000);
  };

  const successCount = logs.filter((l) => l.success).length;
  const errorCount = logs.filter((l) => !l.success).length;

  const filteredLogs = logs.filter((log) => {
    if (logFilter === 'success') return log.success;
    if (logFilter === 'error') return !log.success;
    return true;
  });

  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto">
      {/* Intro Header with Graphic Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex-1 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Lock className="w-3.5 h-3.5" />
              {lang === 'bn' ? '১০০% নিরাপদ লোকাল কী চেকার' : '100% Private Local Key Checker'}
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              {lang === 'bn' ? 'Stripe API Key ভেরিফিকেশন প্যানেল' : 'Stripe API Key Verification Panel'}
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              {lang === 'bn'
                ? 'বাইরের কোনো থার্ড-পার্টি ওয়েবসাইটে API Key শেয়ার না করে আপনার নিজস্ব সুরক্ষিত ব্যাকএন্ডের মাধ্যমে কী সঠিক ও সক্রিয় কি না পরীক্ষা করুন।'
                : 'Test and verify your Stripe API keys directly through your own secure backend proxy without leaking secrets to third-party services.'}
            </p>

            <div className="pt-2">
              <button
                onClick={handleVerify}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {loading
                  ? lang === 'bn'
                    ? 'যাচাই করা হচ্ছে...'
                    : 'Verifying...'
                  : lang === 'bn'
                  ? 'এখনই টেস্ট করুন'
                  : 'Verify API Key'}
              </button>
            </div>
          </div>

          {/* Visual Key Vault Banner */}
          <div className="w-full sm:w-80 lg:w-72 h-40 rounded-2xl overflow-hidden border border-indigo-500/30 shadow-xl relative shrink-0 group">
            <img
              src={keyVaultBanner}
              onError={(e) => {
                e.currentTarget.src = '/assets/images/key_vault_banner_1790807145182.jpg';
              }}
              alt="Secure Key Vault"
              className="w-full h-full object-cover object-center transform group-hover:scale-105 transition duration-500"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent pointer-events-none" />
            <span className="absolute bottom-2.5 left-3 text-[10px] font-mono text-indigo-300 font-semibold bg-slate-950/80 px-2.5 py-1 rounded-full border border-indigo-500/30 backdrop-blur-xs flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Encrypted Sandbox</span>
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form & Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-indigo-400" />
                {lang === 'bn' ? 'API Key কনফিগারেশন' : 'API Key Configuration'}
              </h3>
              <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                <button
                  onClick={() => setUseManualKey(false)}
                  className={`px-3 py-1 rounded-md font-medium transition ${
                    !useManualKey ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  .env Environment
                </button>
                <button
                  onClick={() => setUseManualKey(true)}
                  className={`px-3 py-1 rounded-md font-medium transition ${
                    useManualKey ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Custom Key Input
                </button>
              </div>
            </div>

            {/* Secret Key Input / Mode */}
            {!useManualKey ? (
              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-semibold text-slate-300">
                      STRIPE_SECRET_KEY (.env)
                    </span>
                    {serverKeyConfigured ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        DETECTED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        SIMULATION READY
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    {serverKeyConfigured
                      ? (lang === 'bn' ? 'সার্ভারের .env ফাইল থেকে কী লোড হচ্ছে।' : 'Server is loading secret key from .env file.')
                      : (lang === 'bn' ? '.env এ কোনো কী পাওয়া যায়নি। আপনি চাইলে নিচের বাটনে চাপ দিয়ে ম্যানুয়ালি টেস্ট কী ইনপুট দিতে পারেন।' : 'No server key detected. Switch to "Custom Key Input" to test sk_test_...')}
                  </p>
                </div>
                <div className="font-mono text-xs text-slate-500 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                  sk_test_••••••••••••••••
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>{lang === 'bn' ? 'Stripe Secret Key (sk_test_...)' : 'Stripe Secret Key'}</span>
                  <span className="text-[11px] text-slate-400">
                    {lang === 'bn' ? 'শুধুমাত্র sk_test_ দিয়ে শুরু হওয়া টেস্ট কী দিন' : 'Use test mode key starting with sk_test_'}
                  </span>
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={manualSecretKey}
                    onChange={(e) => setManualSecretKey(e.target.value)}
                    placeholder="sk_test_51Mz..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 font-mono pr-10 focus:outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Publishable Key */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>{lang === 'bn' ? 'Stripe Publishable Key (pk_test_...)' : 'Stripe Publishable Key'}</span>
                <span className="text-[11px] text-emerald-400 font-normal">
                  {lang === 'bn' ? 'ফ্রন্টএন্ড কার্ড এলিমেন্টে ব্যবহৃত হয়' : 'Client-side elements'}
                </span>
              </label>
              <input
                type="text"
                value={publishableKey}
                onChange={(e) => setPublishableKey(e.target.value)}
                placeholder="pk_test_51Mz..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 font-mono focus:outline-none transition"
              />
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                {lang === 'bn' ? 'কোনো কী ব্রাউজারের বাইরে অনিরাপদ স্থানে সংরক্ষিত হয় না।' : 'Keys never leave your personal secure environment.'}
              </span>
              <button
                onClick={handleVerify}
                disabled={loading}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 underline"
              >
                {lang === 'bn' ? 'পুনরায় চেক করুন →' : 'Recheck Status →'}
              </button>
            </div>
          </div>

          {/* Key Verification Result Box */}
          {keyStatus && (
            <div
              className={`rounded-2xl border p-6 shadow-xl transition-all ${
                keyStatus.success
                  ? 'bg-emerald-950/20 border-emerald-500/30'
                  : 'bg-rose-950/20 border-rose-500/30'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-xl shrink-0 ${
                    keyStatus.success ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  }`}
                >
                  {keyStatus.success ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                </div>

                <div className="space-y-3 flex-1">
                  <div>
                    <h4 className="font-bold text-base text-slate-100 flex items-center gap-2">
                      {keyStatus.success
                        ? lang === 'bn'
                          ? 'ভেরিফিকেশন সফল হয়েছে!'
                          : 'Verification Successful!'
                        : lang === 'bn'
                        ? 'ভেরিফিকেশন ব্যর্থ হয়েছে'
                        : 'Verification Failed'}
                      {keyStatus.success && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                          {keyStatus.mode || 'Test Mode'}
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-300 mt-1">
                      {keyStatus.message || keyStatus.error}
                    </p>
                  </div>

                  {keyStatus.success && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Account ID</span>
                        <span className="text-xs font-mono text-slate-200 truncate block">
                          {keyStatus.accountId || 'acct_test'}
                        </span>
                      </div>
                      <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Business Name</span>
                        <span className="text-xs font-medium text-slate-200 truncate block">
                          {keyStatus.businessName || 'Stripe Test User'}
                        </span>
                      </div>
                      <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Available Balance</span>
                        <span className="text-xs font-bold text-emerald-400 block">
                          {keyStatus.available?.[0]
                            ? `${(keyStatus.available[0].amount / 100).toFixed(2)} ${keyStatus.available[0].currency.toUpperCase()}`
                            : '$0.00 USD'}
                        </span>
                      </div>
                      <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Pending Balance</span>
                        <span className="text-xs font-medium text-amber-300 block">
                          {keyStatus.pending?.[0]
                            ? `${(keyStatus.pending[0].amount / 100).toFixed(2)} ${keyStatus.pending[0].currency.toUpperCase()}`
                            : '$0.00 USD'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* New Real-Time API Validation Logs Section */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            {/* Header with Title, Live Status & Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Activity className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">
                      {lang === 'bn' ? 'API ভ্যালিডেশন রিয়েল-টাইম লগস' : 'Key Validation API Logs'}
                    </h3>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live Stream
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {lang === 'bn'
                      ? 'কী পরীক্ষার প্রতিটি API কলের টাইমস্ট্যাম্প, স্ট্যাটাস কোড ও রেসপন্স লেটেন্সি'
                      : 'Live trace of /api/verify-key requests, status codes, and network latency'}
                  </p>
                </div>
              </div>

              {/* Filters and Clear Button */}
              <div className="flex items-center gap-2">
                <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center text-[11px]">
                  <button
                    type="button"
                    onClick={() => setLogFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                      logFilter === 'all'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All ({logs.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogFilter('success')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                      logFilter === 'success'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    2xx ({successCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogFilter('error')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                      logFilter === 'error'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Err ({errorCount})
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleClearLogs}
                  disabled={logs.length === 0}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-rose-300 text-xs font-medium transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                  title="Clear all logs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{lang === 'bn' ? 'ক্লিয়ার' : 'Clear'}</span>
                </button>
              </div>
            </div>

            {/* Logs List Table / Cards */}
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 px-4 border border-dashed border-slate-800 rounded-xl bg-slate-950/40 space-y-2">
                <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">
                  {lang === 'bn' ? 'কোনো ভ্যালিডেশন লগ রেকর্ড নেই।' : 'No validation logs recorded for this view.'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {lang === 'bn'
                    ? 'উপরের "এখনই টেস্ট করুন" বাটনে চাপলে নতুন রিয়েল-টাইম লগ এখানে জমা হবে।'
                    : 'Click "Verify API Key" above to generate a new live log entry.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredLogs.map((log) => {
                  const isExpanded = selectedLogId === log.id;
                  const isSuccess = log.success;
                  const isCopied = copiedLogId === log.id;

                  return (
                    <div
                      key={log.id}
                      className={`border rounded-xl transition-all duration-200 overflow-hidden ${
                        isExpanded
                          ? 'border-indigo-500/50 bg-slate-950 shadow-lg'
                          : 'border-slate-800/80 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-950'
                      }`}
                    >
                      {/* Summary Row */}
                      <div
                        onClick={() => setSelectedLogId(isExpanded ? null : log.id)}
                        className="p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
                          {/* Status Code Badge */}
                          <span
                            className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-bold border flex items-center gap-1 ${
                              isSuccess
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isSuccess ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                            {log.statusText}
                          </span>

                          {/* HTTP Method */}
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono font-bold text-indigo-300">
                            {log.method}
                          </span>

                          {/* Endpoint */}
                          <span className="font-mono text-xs text-slate-200 font-semibold truncate">
                            {log.endpoint}
                          </span>

                          {/* Source Tag */}
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
                            {log.source}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto text-xs text-slate-400">
                          {/* Latency */}
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-400">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {log.durationMs}ms
                          </span>

                          {/* Timestamp */}
                          <span className="font-mono text-[11px] text-slate-500">
                            {log.timestamp}
                          </span>

                          {/* Expand chevron */}
                          <button
                            type="button"
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
                            aria-label="Toggle details"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Log Message Preview Line */}
                      <div className="px-3 sm:px-4 pb-2.5 text-[11px] text-slate-400 truncate flex items-center gap-1.5 border-t border-slate-900/60 pt-1.5">
                        <span className="text-slate-500 text-[10px] uppercase font-mono font-semibold shrink-0">
                          Response:
                        </span>
                        <span className="truncate text-slate-300">{log.message}</span>
                      </div>

                      {/* Expanded Details Section */}
                      {isExpanded && (
                        <div className="border-t border-slate-800/80 bg-slate-900/60 p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                              Payload &amp; Response Inspector
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyLog(log);
                              }}
                              className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] font-mono border border-slate-800 flex items-center gap-1.5 transition cursor-pointer"
                            >
                              {isCopied ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3 text-slate-400" />
                                  <span>Copy Log JSON</span>
                                </>
                              )}
                            </button>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                              <span className="text-slate-500 block text-[10px]">Status Code</span>
                              <span className="font-mono font-bold text-white text-xs">{log.statusCode}</span>
                            </div>
                            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                              <span className="text-slate-500 block text-[10px]">Round-Trip Time</span>
                              <span className="font-mono font-bold text-indigo-300 text-xs">{log.durationMs} ms</span>
                            </div>
                            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                              <span className="text-slate-500 block text-[10px]">Verification Target</span>
                              <span className="font-medium text-slate-200 text-xs truncate block">{log.source}</span>
                            </div>
                            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                              <span className="text-slate-500 block text-[10px]">Verdict</span>
                              <span className={`font-semibold text-xs ${isSuccess ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {isSuccess ? 'Valid & Active' : 'Failed / Rejected'}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-500 uppercase font-mono font-semibold block">
                              Raw JSON Response Body
                            </span>
                            <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-[11px] font-mono text-indigo-200 overflow-x-auto max-h-48 leading-relaxed">
                              {JSON.stringify(log.details || { message: log.message }, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Security Best Practices & Fast Commands */}
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              {lang === 'bn' ? 'কেন এটি সবচেয়ে নিরাপদ?' : 'Why is this 100% Safe?'}
            </h4>
            <ul className="text-xs text-slate-400 space-y-3">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></span>
                <span>
                  <strong className="text-slate-200">
                    {lang === 'bn' ? 'কী কোথাও যাচ্ছে না: ' : 'Zero Leakage: '}
                  </strong>
                  {lang === 'bn'
                    ? 'আপনার Secret Key শুধুমাত্র লোকালহোস্টের সার্ভারে ব্যবহৃত হয়।'
                    : 'Secret keys are kept purely inside the local server process.'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></span>
                <span>
                  <strong className="text-slate-200">
                    {lang === 'bn' ? 'সম্পূর্ণ নিয়ন্ত্রণ: ' : 'Complete Control: '}
                  </strong>
                  {lang === 'bn'
                    ? 'কোড পরিবর্তন করে প্রতিটি ইভেন্টের রেসপন্স বিশ্লেষণ করতে পারবেন।'
                    : 'Inspect full Stripe API responses and test errors locally.'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></span>
                <span>
                  <strong className="text-slate-200">
                    {lang === 'bn' ? 'প্রাইভেসি নিশ্চয়তা: ' : 'Strict Privacy: '}
                  </strong>
                  {lang === 'bn'
                    ? 'কোনো থার্ড-পার্টি ট্র্যাকিং বা অডিট লগ সংগৃহীত হয় না।'
                    : 'No telemetry or third party telemetry analytics.'}
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-400" />
              {lang === 'bn' ? 'লোকাল রান কমান্ড' : 'Quick Run Command'}
            </h4>
            <p className="text-[11px] text-slate-400">
              {lang === 'bn'
                ? 'আপনার টার্মিনালে নিচের কমান্ডটি চালিয়ে টেস্ট সার্ভার রান করুন:'
                : 'Start your server with Node / TSX:'}
            </p>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-indigo-300 flex items-center justify-between">
              <code>npm run dev</code>
              <span className="text-[10px] text-slate-500">Port 3000</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
