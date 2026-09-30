import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2, Share2, PlusSquare } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  lang?: 'bn' | 'en';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ lang = 'bn' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showDesktopHelp, setShowDesktopHelp] = useState(false);

  // If already running as an installed standalone PWA, show compact installed badge or hide
  if (isInstalled) {
    return (
      <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        <span>{lang === 'bn' ? 'PWA ইনস্টলড' : 'App Installed'}</span>
      </span>
    );
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      setShowDesktopHelp(true);
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-indigo-950/40 flex items-center gap-1.5 transition cursor-pointer"
        title={lang === 'bn' ? 'ডিভাইসে অ্যাপ হিসেবে ইনস্টল করুন' : 'Install as Native App'}
      >
        <Download className="w-3.5 h-3.5 text-indigo-200" />
        <span>{lang === 'bn' ? 'অ্যাপ ইনস্টল' : 'Install App'}</span>
      </button>

      {/* iOS Safari Guided Install Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-left space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <img
                  src="/app-logo.png"
                  alt="App Logo"
                  className="w-8 h-8 rounded-xl object-cover border border-indigo-500/30"
                  referrerPolicy="no-referrer"
                />
                <h3 className="text-sm font-bold text-white">
                  {lang === 'bn' ? 'iPhone / iPad-এ ইনস্টল করুন' : 'Install on iPhone / iPad'}
                </h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {lang === 'bn'
                ? 'Apple iOS Safari ব্রাউজারে অ্যাপ ইনস্টল করার নিয়ম:'
                : 'Follow these simple steps in Safari to add to your Home Screen:'}
            </p>

            <div className="space-y-3 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80 text-xs text-slate-300">
              <div className="flex items-start gap-2.5">
                <div className="p-1 rounded-lg bg-indigo-500/20 text-indigo-300 shrink-0">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-white">১. Safari টুলবারের</span> Share বাটনে চাপ দিন।
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="p-1 rounded-lg bg-indigo-500/20 text-indigo-300 shrink-0">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-white">২. নিচে স্ক্রোল করে</span> &apos;Add to Home Screen&apos; সিলেক্ট করুন।
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition cursor-pointer"
            >
              {lang === 'bn' ? 'বুঝেছি (Close)' : 'Got it'}
            </button>
          </div>
        </div>
      )}

      {/* Desktop / Fallback Prompt Modal */}
      {showDesktopHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-left space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <img
                  src="/app-logo.png"
                  alt="App Logo"
                  className="w-8 h-8 rounded-xl object-cover border border-indigo-500/30"
                  referrerPolicy="no-referrer"
                />
                <h3 className="text-sm font-bold text-white">
                  {lang === 'bn' ? 'ব্রাউজারে অ্যাপ ইনস্টল' : 'Install Web App'}
                </h3>
              </div>
              <button
                onClick={() => setShowDesktopHelp(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {lang === 'bn'
                ? 'আপনার ব্রাউজারের অ্যাড্রেস বারের ডানে ইনস্টল (Install icon ⊕) আইকনে ক্লিক করে অথবা ব্রাউজার মেনু (⋮) থেকে "Install Stripe & Gmail Hub" সিলেক্ট করুন।'
                : 'Click the install icon (⊕) in your browser address bar or select "Install Stripe & Gmail Hub" from the browser menu to install this app on your desktop or mobile.'}
            </p>

            <button
              onClick={() => setShowDesktopHelp(false)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 text-xs font-bold text-white transition cursor-pointer"
            >
              {lang === 'bn' ? 'ঠিক আছে' : 'OK'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
