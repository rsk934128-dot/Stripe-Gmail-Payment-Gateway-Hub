import React, { useState, useEffect } from 'react';
import {
  X,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Globe,
  Radio,
  Server,
  Copy,
  Check,
  Sparkles,
  Zap,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { StripeKeyStatus } from '../types';

interface LiveConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  manualSecretKey: string;
  setManualSecretKey: (k: string) => void;
  publishableKey: string;
  setPublishableKey: (k: string) => void;
  keyStatus: StripeKeyStatus | null;
  setKeyStatus: (s: StripeKeyStatus | null) => void;
  serverKeyConfigured: boolean;
  lang?: 'bn' | 'en';
}

export const LiveConnectionModal: React.FC<LiveConnectionModalProps> = ({
  isOpen,
  onClose,
  manualSecretKey,
  setManualSecretKey,
  publishableKey,
  setPublishableKey,
  keyStatus,
  setKeyStatus,
  serverKeyConfigured,
  lang = 'bn',
}) => {
  const [inputSecretKey, setInputSecretKey] = useState(manualSecretKey);
  const [inputPublishableKey, setInputPublishableKey] = useState(publishableKey);
  const [showSecret, setShowSecret] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    setInputSecretKey(manualSecretKey);
  }, [manualSecretKey]);

  useEffect(() => {
    setInputPublishableKey(publishableKey);
  }, [publishableKey]);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const webhookUrl = `${currentOrigin}/api/webhook`;

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleTestAndSave = async () => {
    setIsVerifying(true);
    setVerifyError(null);

    const trimmedSecret = inputSecretKey.trim();
    const trimmedPub = inputPublishableKey.trim();

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (trimmedSecret) {
        headers['x-stripe-secret-key'] = trimmedSecret;
      }

      const res = await fetch('/api/verify-key', {
        method: 'POST',
        headers,
      });

      const data = await res.json();

      if (!res.ok || data.success === false) {
        throw new Error(data.error || 'Stripe API কী ভেরিফাই করা সম্ভব হয়নি। দয়া করে কী সঠিক কিনা যাচাই করুন।');
      }

      // Update parent states
      setManualSecretKey(trimmedSecret);
      setPublishableKey(trimmedPub);
      setKeyStatus(data);

      // Persist to localStorage
      if (trimmedSecret) {
        localStorage.setItem('stripe_manual_secret_key', trimmedSecret);
      } else {
        localStorage.removeItem('stripe_manual_secret_key');
      }

      if (trimmedPub) {
        localStorage.setItem('stripe_publishable_key', trimmedPub);
      } else {
        localStorage.removeItem('stripe_publishable_key');
      }

      localStorage.setItem('stripe_key_status', JSON.stringify(data));
      setIsVerifying(false);
    } catch (err: any) {
      setVerifyError(err.message || 'সংযোগ স্থাপন ব্যর্থ হয়েছে');
      setIsVerifying(false);
    }
  };

  const handleClearKeys = () => {
    setInputSecretKey('');
    setInputPublishableKey('');
    setManualSecretKey('');
    setPublishableKey('');
    setKeyStatus(null);
    localStorage.removeItem('stripe_manual_secret_key');
    localStorage.removeItem('stripe_publishable_key');
    localStorage.removeItem('stripe_key_status');
    setVerifyError(null);
  };

  const isLive = inputSecretKey.startsWith('sk_live_') || inputSecretKey.startsWith('rk_live_') || keyStatus?.livemode === true || keyStatus?.livemode === 'Live Mode';
  const isTest = inputSecretKey.startsWith('sk_test_') || inputSecretKey.startsWith('rk_test_') || keyStatus?.livemode === false || keyStatus?.livemode === 'Test Mode';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${isLive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : isTest ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'}`}>
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">
                  {lang === 'bn' ? 'লাইভ ও টেস্ট গেটওয়ে সংযোগ' : 'Live & Test Gateway Connection'}
                </h3>
                {isLive ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    LIVE MODE
                  </span>
                ) : isTest ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    TEST MODE
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    SIMULATION SANDBOX
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {lang === 'bn'
                  ? 'অ্যাপটি লাইভ হোস্টিং বা শেয়ার করার পর নিরবচ্ছিন্নভাবে ব্যবহার করতে আপনার Stripe কী কানেক্ট করুন।'
                  : 'Connect Stripe API keys to process real or sandbox payments uninterruptedly after deployment.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Status Box */}
          {keyStatus && keyStatus.success ? (
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <p className="font-bold text-emerald-300">
                  {lang === 'bn' ? '✅ Stripe গেটওয়ে সফলভাবে কানেক্টেড!' : '✅ Stripe Gateway Successfully Connected!'}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-300 font-mono text-[11px] pt-1">
                  <span>মোড: <strong className={isLive ? 'text-emerald-400' : 'text-amber-400'}>{keyStatus.livemode || 'Connected'}</strong></span>
                  {keyStatus.accountId && <span>অ্যাকাউন্ট: <strong>{keyStatus.accountId}</strong></span>}
                  {keyStatus.businessName && <span>নাম: <strong>{keyStatus.businessName}</strong></span>}
                </div>
              </div>
            </div>
          ) : serverKeyConfigured ? (
            <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 flex items-center gap-3 text-xs text-indigo-300">
              <Server className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>
                {lang === 'bn'
                  ? 'সার্ভারের .env থেকে ডিফল্ট কী লোড করা হয়েছে। কাস্টম কী দিলে সেটি প্রাধান্য পাবে।'
                  : 'Default key loaded from server environment. Custom key will override it.'}
              </span>
            </div>
          ) : null}

          {verifyError && (
            <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/30 flex items-start gap-3 text-xs text-rose-300">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-200">
                  {lang === 'bn' ? 'কী যাচাইকরণ ব্যর্থ হয়েছে:' : 'Verification Failed:'}
                </p>
                <p className="mt-0.5">{verifyError}</p>
              </div>
            </div>
          )}

          {/* Form Inputs */}
          <div className="space-y-4 bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
            {/* Secret Key Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                  Stripe Secret Key (sk_test_... / sk_live_... / rk_...)
                </span>
                <span className="text-[11px] text-slate-400 font-normal">
                  {lang === 'bn' ? 'সার্ভার সাইড পেমেন্ট ও ট্রানজাকশন' : 'Server operations'}
                </span>
              </label>
              <div className="relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={inputSecretKey}
                  onChange={(e) => setInputSecretKey(e.target.value)}
                  placeholder="sk_test_... বা sk_live_..."
                  className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono pr-10 focus:outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Publishable Key Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-400" />
                  Stripe Publishable Key (pk_test_... / pk_live_...)
                </span>
                <span className="text-[11px] text-slate-400 font-normal">
                  {lang === 'bn' ? 'ফ্রন্টএন্ড কার্ড এলিমেন্ট' : 'Client checkout'}
                </span>
              </label>
              <input
                type="text"
                value={inputPublishableKey}
                onChange={(e) => setInputPublishableKey(e.target.value)}
                placeholder="pk_test_... বা pk_live_..."
                className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:outline-none transition"
              />
            </div>
          </div>

          {/* Hosting / Deployment Status Info */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                {lang === 'bn' ? 'লাইভ ডিপ্লয়মেন্ট ও ওয়েবহুক ডায়াগনস্টিক' : 'Live Deployment Diagnostics'}
              </span>
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Proxy Active (HTTPS)
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <div className="truncate mr-2">
                  <span className="text-slate-400 block text-[10px]">Stripe Webhook URL (ড্যাশবোর্ডে যোগ করুন):</span>
                  <code className="text-indigo-300 font-mono text-[11px] select-all truncate block">
                    {webhookUrl}
                  </code>
                </div>
                <button
                  onClick={() => copyToClipboard(webhookUrl, 'webhook')}
                  className="px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-[11px] font-semibold flex items-center gap-1 shrink-0 transition"
                >
                  {copiedField === 'webhook' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedField === 'webhook' ? 'কপি হয়েছে' : 'কপি'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between gap-3">
          <button
            onClick={handleClearKeys}
            className="px-3.5 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'কী মুছুন' : 'Clear Keys'}</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition cursor-pointer"
            >
              {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
            </button>
            <button
              onClick={handleTestAndSave}
              disabled={isVerifying}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
            >
              {isVerifying ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5" />
              )}
              <span>
                {isVerifying
                  ? lang === 'bn'
                    ? 'যাচাই করা হচ্ছে...'
                    : 'Verifying...'
                  : lang === 'bn'
                  ? 'কানেক্ট ও সেভ করুন'
                  : 'Connect & Save'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
