import React, { useState } from 'react';
import { KeyRound, ShieldCheck, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Lock, Eye, EyeOff, Server, Terminal, HelpCircle } from 'lucide-react';
import { StripeKeyStatus } from '../types';

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

  const handleVerify = async () => {
    setLoading(true);
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

      const data = await res.json();
      setKeyStatus(data);
    } catch (err: any) {
      setKeyStatus({
        success: false,
        error: err.message || 'সার্ভার যোগাযোগে ত্রুটি ঘটেছে',
      });
    } finally {
      setLoading(false);
    }
  };

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
              src="/src/assets/images/key_vault_banner_1790807145182.jpg"
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
