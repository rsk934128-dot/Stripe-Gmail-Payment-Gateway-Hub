import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  KeyRound,
  CreditCard,
  Layers,
  Radio,
  Mail,
  BookOpen,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ExternalLink,
  Languages,
} from 'lucide-react';
import { initAuth } from './firebase';
import { GoogleSignInButton } from './components/GoogleSignInButton';
import { ConfirmEmailModal } from './components/ConfirmEmailModal';
import { KeyVerifierTab } from './components/KeyVerifierTab';
import { PaymentSimulatorTab } from './components/PaymentSimulatorTab';
import { AIAgentTab } from './components/AIAgentTab';
import { SubscriptionTab } from './components/SubscriptionTab';
import { WebhookStudioTab } from './components/WebhookStudioTab';
import { GmailInboxTab } from './components/GmailInboxTab';
import { DeploymentGuideTab } from './components/DeploymentGuideTab';
import { sendGmailReceipt, PaymentReceiptEmailData } from './services/gmail';
import { StripeKeyStatus } from './types';
import { PWAInstallButton } from './components/PWAInstallButton';
import { PWABuilderModal } from './components/PWABuilderModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Bot } from 'lucide-react';

type TabType = 'verifier' | 'simulator' | 'ai-agent' | 'subscriptions' | 'webhooks' | 'gmail' | 'deployment';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('verifier');
  const [lang, setLang] = useState<'bn' | 'en'>('bn');
  const [pwaModalOpen, setPwaModalOpen] = useState<boolean>(false);
  
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  
  // Stripe state
  const [serverKeyConfigured, setServerKeyConfigured] = useState<boolean>(false);
  const [manualSecretKey, setManualSecretKey] = useState<string>('');
  const [publishableKey, setPublishableKey] = useState<string>('');
  const [keyStatus, setKeyStatus] = useState<StripeKeyStatus | null>(null);

  // Email confirmation modal state
  const [emailModalOpen, setEmailModalOpen] = useState<boolean>(false);
  const [pendingEmailData, setPendingEmailData] = useState<PaymentReceiptEmailData | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    // 1. Initialize Firebase Auth state listener
    const unsubscribe = initAuth(
      (currentUser) => {
        setUser(currentUser);
      },
      () => {
        setUser(null);
      }
    );

    // 2. Fetch server stripe config
    fetch('/api/config')
      .then((r) => r.json())
      .then((data) => {
        if (data.publishableKey) setPublishableKey(data.publishableKey);
        setServerKeyConfigured(Boolean(data.hasServerSecretKey));
      })
      .catch((err) => console.log('Config load notice:', err));

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleOpenReceiptModal = (data: PaymentReceiptEmailData) => {
    setPendingEmailData(data);
    setEmailModalOpen(true);
  };

  const handleConfirmSendEmail = async () => {
    if (!pendingEmailData) return;
    setIsSendingEmail(true);
    try {
      await sendGmailReceipt(pendingEmailData);
      setEmailModalOpen(false);
      setToastMessage({
        text:
          lang === 'bn'
            ? `সফল হয়েছে! ${pendingEmailData.recipientEmail}-এ Gmail রসিদ পাঠানো হয়েছে।`
            : `Receipt successfully dispatched to ${pendingEmailData.recipientEmail} via Gmail.`,
        type: 'success',
      });
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err: any) {
      setToastMessage({
        text: err.message || (lang === 'bn' ? 'ইমেইল পাঠাতে ব্যর্থ হয়েছে' : 'Failed to send receipt'),
        type: 'error',
      });
      setTimeout(() => setToastMessage(null), 5000);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const tabs: Array<{ id: TabType; labelBn: string; labelEn: string; icon: React.ReactNode }> = [
    {
      id: 'verifier',
      labelBn: 'কী ভেরিফিকেশন',
      labelEn: 'API Key Check',
      icon: <KeyRound className="w-4 h-4" />,
    },
    {
      id: 'ai-agent',
      labelBn: 'এআই এজেন্ট পেমেন্ট',
      labelEn: 'AI Agent Pay',
      icon: <Bot className="w-4 h-4 text-purple-400" />,
    },
    {
      id: 'simulator',
      labelBn: 'পেমেন্ট সিমুলেশন',
      labelEn: 'Payment Simulator',
      icon: <CreditCard className="w-4 h-4" />,
    },
    {
      id: 'subscriptions',
      labelBn: 'সাবস্ক্রিপশন ও ইনভয়েস',
      labelEn: 'Subscriptions',
      icon: <Layers className="w-4 h-4" />,
    },
    {
      id: 'webhooks',
      labelBn: 'Webhook স্টুডিও',
      labelEn: 'Webhooks',
      icon: <Radio className="w-4 h-4" />,
    },
    {
      id: 'gmail',
      labelBn: 'Gmail রসিদ ও ইনবক্স',
      labelEn: 'Gmail Hub',
      icon: <Mail className="w-4 h-4 text-red-400" />,
    },
    {
      id: 'deployment',
      labelBn: 'ডেপ্লয়মেন্ট ও কোড',
      labelEn: 'Export & Deploy',
      icon: <BookOpen className="w-4 h-4" />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-white">
      {/* Top Notification Toast */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-3 duration-200">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl border text-xs font-semibold flex items-center gap-2.5 backdrop-blur-md ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40 shadow-emerald-950/50'
                : 'bg-rose-950/90 text-rose-200 border-rose-500/40 shadow-rose-950/50'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo / Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-emerald-400 p-0.5 shadow-lg shadow-indigo-600/30 shrink-0 group">
              <img
                src="/app-logo.png"
                alt="PaymentHub Logo"
                className="w-full h-full object-cover rounded-[14px] transform group-hover:scale-105 transition duration-300"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                  <span>Stripe</span>
                  <span className="text-indigo-400">&amp;</span>
                  <span>Gmail Hub</span>
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Local Sandbox
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate hidden md:block">
                {lang === 'bn'
                  ? 'নিরাপদ পেমেন্ট গেটওয়ে, টেস্ট প্যানেল ও Gmail রসিদ সিস্টেম'
                  : 'Safe Payment Gateway, Tester & Gmail Receipt Dispatcher'}
              </p>
            </div>
          </div>

          {/* Right Header: Language Switcher, PWA Install & Google Sign-In */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* PWABuilder Compliance Modal Trigger */}
            <button
              onClick={() => setPwaModalOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-pink-500/40 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
              title="PWABuilder Compliance & App Store Audit"
            >
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span>PWABuilder</span>
            </button>

            {/* In-App PWA Install Prompt Button */}
            <PWAInstallButton lang={lang} />

            {/* Lang Toggle */}
            <button
              onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition cursor-pointer"
              title="Change Language"
            >
              <Languages className="w-3.5 h-3.5 text-indigo-400" />
              <span>{lang === 'bn' ? 'বাংলা' : 'EN'}</span>
            </button>

            {/* Official Google Sign-In Component */}
            <GoogleSignInButton user={user} onAuthChange={setUser} lang={lang} />
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="max-w-7xl mx-auto mt-3 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 rounded-2xl border border-slate-800/80 w-max min-w-full sm:min-w-0">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  activeTab === t.id
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-950/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {t.icon}
                <span>{lang === 'bn' ? t.labelBn : t.labelEn}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'verifier' && (
          <KeyVerifierTab
            serverKeyConfigured={serverKeyConfigured}
            manualSecretKey={manualSecretKey}
            setManualSecretKey={setManualSecretKey}
            publishableKey={publishableKey}
            setPublishableKey={setPublishableKey}
            keyStatus={keyStatus}
            setKeyStatus={setKeyStatus}
            lang={lang}
          />
        )}

        {activeTab === 'ai-agent' && (
          <AIAgentTab
            serverKeyConfigured={serverKeyConfigured}
            manualSecretKey={manualSecretKey}
            lang={lang}
          />
        )}

        {activeTab === 'simulator' && (
          <PaymentSimulatorTab
            manualSecretKey={manualSecretKey}
            publishableKey={publishableKey}
            onDispatchReceiptModal={handleOpenReceiptModal}
            isGmailConnected={Boolean(user)}
            lang={lang}
          />
        )}

        {activeTab === 'subscriptions' && (
          <SubscriptionTab
            manualSecretKey={manualSecretKey}
            onDispatchReceiptModal={handleOpenReceiptModal}
            isGmailConnected={Boolean(user)}
            lang={lang}
          />
        )}

        {activeTab === 'webhooks' && <WebhookStudioTab lang={lang} />}

        {activeTab === 'gmail' && (
          <GmailInboxTab
            user={user}
            onDispatchReceiptModal={handleOpenReceiptModal}
            lang={lang}
          />
        )}

        {activeTab === 'deployment' && <DeploymentGuideTab lang={lang} />}
      </main>

      {/* Confirmation Modal before Dispatching Gmail Email (Mandatory workspace check) */}
      <ConfirmEmailModal
        isOpen={emailModalOpen}
        data={pendingEmailData}
        onConfirm={handleConfirmSendEmail}
        onCancel={() => setEmailModalOpen(false)}
        isSending={isSendingEmail}
        lang={lang}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            © {new Date().getFullYear()} Stripe &amp; Gmail Payment Gateway Hub. Local Developer Testing Suite.
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              {lang === 'bn' ? 'সম্পূর্ণ নিরাপদ লোকাল পরিবেশ' : 'Zero Remote Leakage'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-red-400" />
              {lang === 'bn' ? 'অফিসিয়াল Google Workspace API' : 'Google Workspace Verified'}
            </span>
          </div>
        </div>
      </footer>
      {/* PWABuilder Compliance Audit Modal */}
      <PWABuilderModal
        isOpen={pwaModalOpen}
        onClose={() => setPwaModalOpen(false)}
        lang={lang}
      />

      {/* Offline Connectivity Status Indicator */}
      <OfflineIndicator />
    </div>
  );
}
