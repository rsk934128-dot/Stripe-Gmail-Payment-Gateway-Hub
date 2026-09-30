import React, { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  RefreshCw,
  CheckCircle2,
  Inbox,
  Search,
  Tag,
  Plus,
  FolderPlus,
  Sparkles,
  Check,
  AlertCircle,
  Filter,
  Zap,
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  listBillingEmails,
  listGmailLabels,
  createGmailLabel,
  ensurePaymentLabelExists,
  createPaymentsLabel,
  autoOrganizeStripeReceipts,
  applyLabelToMessages,
  removeLabelFromMessage,
  GmailMessageSummary,
  GmailLabel,
  PaymentReceiptEmailData,
} from '../services/gmail';
import { ConfirmLabelModal } from './ConfirmLabelModal';

interface GmailInboxTabProps {
  user: FirebaseUser | null;
  onDispatchReceiptModal: (data: PaymentReceiptEmailData) => void;
  lang?: 'bn' | 'en';
}

export const GmailInboxTab: React.FC<GmailInboxTabProps> = ({
  user,
  onDispatchReceiptModal,
  lang = 'bn',
}) => {
  const [messages, setMessages] = useState<GmailMessageSummary[]>([]);
  const [labels, setLabels] = useState<GmailLabel[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOnlyPayments, setFilterOnlyPayments] = useState(false);

  // Label Confirmation Modal State
  const [confirmLabelModalOpen, setConfirmLabelModalOpen] = useState(false);
  const [labelActionType, setLabelActionType] = useState<'create_label' | 'organize_receipts'>('create_label');
  const [isProcessingLabel, setIsProcessingLabel] = useState(false);
  const [isCreatingPaymentsLabel, setIsCreatingPaymentsLabel] = useState(false);
  const [isScanningStripe, setIsScanningStripe] = useState(false);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Custom Receipt Form
  const [recipient, setRecipient] = useState('');
  const [customerName, setCustomerName] = useState('Client');
  const [amount, setAmount] = useState(49);
  const [currency, setCurrency] = useState('usd');
  const [description, setDescription] = useState('Software Engineering Services Invoice');

  // Check if "Payments" label exists
  const paymentsLabel = labels.find((l) => l.name.toLowerCase() === 'payments');

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [fetchedMessages, fetchedLabels] = await Promise.all([
        listBillingEmails(),
        listGmailLabels(),
      ]);
      setMessages(fetchedMessages);
      setLabels(fetchedLabels);
    } catch (err) {
      console.error('Failed to load Gmail data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
      if (!recipient && user.email) {
        setRecipient(user.email);
      }
    }
  }, [user]);

  // Trigger automate creation of dedicated 'Payments' label via ensurePaymentLabelExists
  const handleEnsurePaymentLabel = async () => {
    setIsCreatingPaymentsLabel(true);
    try {
      const res = await ensurePaymentLabelExists();
      const label = res.label || res;
      const created = res.created !== false;

      setLabels((prev) => {
        if (prev.some((l) => l.id === label.id)) return prev;
        return [...prev, label];
      });

      setStatusNotification(
        created
          ? lang === 'bn'
            ? "🎉 সফল হয়েছে! 'Payments' লেবেল সফলভাবে তৈরি করা হয়েছে।"
            : "🎉 Success! Dedicated 'Payments' label created in your Gmail inbox."
          : lang === 'bn'
          ? "'Payments' লেবেল ইতিমধ্যে আপনার জিমেইলে সক্রিয় রয়েছে।"
          : "'Payments' label already exists and is active in your Gmail inbox."
      );
      setTimeout(() => setStatusNotification(null), 5000);
    } catch (err: any) {
      alert(err.message || 'লেবেল তৈরি করা যায়নি');
    } finally {
      setIsCreatingPaymentsLabel(false);
    }
  };

  // Scan incoming transaction receipts for Stripe-specific headers and auto-apply 'Payments' label
  const handleAutoOrganizeStripeReceipts = async () => {
    setIsScanningStripe(true);
    try {
      const res = await autoOrganizeStripeReceipts();
      await loadData();
      setStatusNotification(
        lang === 'bn'
          ? `⚡ Stripe স্ক্যান সম্পন্ন: ${res.stripeMatched}টি Stripe রসিদ সনাক্ত হয়েছে এবং ${res.newlyOrganized}টি নতুন রসিদ 'Payments' লেবেলে সাজানো হয়েছে!`
          : `⚡ Stripe Scan Complete: ${res.stripeMatched} Stripe receipt(s) detected, ${res.newlyOrganized} newly organized under 'Payments' label!`
      );
      setTimeout(() => setStatusNotification(null), 6000);
    } catch (err: any) {
      alert(err.message || 'Stripe রসিদ স্ক্যান করা যায়নি');
    } finally {
      setIsScanningStripe(false);
    }
  };

  // Trigger Create Payments Label Confirmation
  const handleOpenCreateLabelModal = () => {
    setLabelActionType('create_label');
    setConfirmLabelModalOpen(true);
  };

  // Trigger Organize Receipts Confirmation
  const handleOpenOrganizeReceiptsModal = () => {
    if (!paymentsLabel) return;
    setLabelActionType('organize_receipts');
    setConfirmLabelModalOpen(true);
  };

  // Perform Label Operation after user confirms
  const handleConfirmLabelAction = async () => {
    setIsProcessingLabel(true);
    try {
      if (labelActionType === 'create_label') {
        const newLabel = await createGmailLabel('Payments');
        setLabels((prev) => [...prev, newLabel]);
        setStatusNotification(
          lang === 'bn'
            ? "'Payments' লেবেল সফলভাবে তৈরি করা হয়েছে!"
            : "Successfully created 'Payments' label in your Gmail inbox!"
        );
      } else if (labelActionType === 'organize_receipts' && paymentsLabel) {
        // Find messages not yet tagged with paymentsLabel.id
        const unlabelledIds = messages
          .filter((m) => !(m.labelIds || []).includes(paymentsLabel.id))
          .map((m) => m.id);

        if (unlabelledIds.length === 0) {
          setStatusNotification(
            lang === 'bn'
              ? 'সবগুলো রসিদ ইতিমধ্যেই Payments লেবেলে সংরক্ষিত রয়েছে।'
              : 'All recent receipts are already organized under Payments.'
          );
        } else {
          const res = await applyLabelToMessages(unlabelledIds, paymentsLabel.id);
          // Update local messages state
          setMessages((prev) =>
            prev.map((m) =>
              unlabelledIds.includes(m.id)
                ? { ...m, labelIds: [...(m.labelIds || []), paymentsLabel.id] }
                : m
            )
          );
          setStatusNotification(
            lang === 'bn'
              ? `${res.successCount}টি রসিদ সফলভাবে 'Payments' লেবেলে সাজানো হয়েছে!`
              : `Organized ${res.successCount} receipt(s) into 'Payments' label!`
          );
        }
      }
      setConfirmLabelModalOpen(false);
      setTimeout(() => setStatusNotification(null), 5000);
    } catch (err: any) {
      alert(err.message || 'লেবেল অপারেশন সম্পন্ন করা যায়নি');
    } finally {
      setIsProcessingLabel(false);
    }
  };

  const handleToggleMessageLabel = async (message: GmailMessageSummary) => {
    if (!paymentsLabel) return;
    const hasLabel = (message.labelIds || []).includes(paymentsLabel.id);

    try {
      if (hasLabel) {
        await removeLabelFromMessage(message.id, paymentsLabel.id);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === message.id
              ? { ...m, labelIds: (m.labelIds || []).filter((id) => id !== paymentsLabel.id) }
              : m
          )
        );
      } else {
        await applyLabelToMessages([message.id], paymentsLabel.id);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === message.id
              ? { ...m, labelIds: [...(m.labelIds || []), paymentsLabel.id] }
              : m
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenReceiptModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient) return;

    onDispatchReceiptModal({
      recipientEmail: recipient,
      customerName,
      amount: Math.round(amount * 100),
      currency,
      paymentIntentId: 'pi_' + Math.random().toString(36).substring(2, 14),
      description,
      status: 'succeeded',
    });
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto my-8 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-2xl overflow-hidden">
        <div className="w-full h-44 sm:h-52 rounded-2xl overflow-hidden border border-red-500/20 shadow-lg relative group">
          <img
            src="/src/assets/images/gmail_receipt_banner_1790807180762.jpg"
            alt="Gmail Receipt Automation"
            className="w-full h-full object-cover object-center transform group-hover:scale-105 transition duration-500"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent pointer-events-none" />
          <span className="absolute bottom-3 left-4 text-xs font-semibold text-white bg-red-950/80 px-3 py-1 rounded-full border border-red-500/30 backdrop-blur-xs flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-red-400" />
            <span>Google Workspace Verified API</span>
          </span>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-white">
            {lang === 'bn' ? 'Gmail ইন্টিগ্রেশন চালু করতে সাইন ইন করুন' : 'Sign in to access Gmail features'}
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            {lang === 'bn'
              ? 'আপনার অনুমতি নিয়ে Stripe পেমেন্ট রসিদ এবং ইনভয়েস ইমেইল সরাসরি Gmail API এর মাধ্যমে পাঠাতে এবং বিলিং ইমেইল দেখতে উপরে "Gmail দিয়ে সাইন ইন" বাটনে ক্লিক করুন।'
              : 'To dispatch payment receipts directly through Gmail API and inspect billing receipts with your explicit permission, please sign in with Google above.'}
          </p>
        </div>
      </div>
    );
  }

  // Filter messages
  const filteredMessages = messages.filter((m) => {
    const matchesSearch =
      (m.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.snippet || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterOnlyPayments && paymentsLabel) {
      return matchesSearch && (m.labelIds || []).includes(paymentsLabel.id);
    }
    return matchesSearch;
  });

  const taggedCount = paymentsLabel
    ? messages.filter((m) => (m.labelIds || []).includes(paymentsLabel.id)).length
    : 0;

  const unlabelledReceiptsCount = paymentsLabel
    ? messages.filter((m) => !(m.labelIds || []).includes(paymentsLabel.id)).length
    : messages.length;

  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto">
      {/* Status Notification Toast */}
      {statusNotification && (
        <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusNotification}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-red-400" />
            {lang === 'bn' ? 'Gmail বিলিং নোটিফিকেশন ও রসিদ হাব' : 'Gmail Receipt & Billing Hub'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {lang === 'bn'
              ? "Gmail API দিয়ে ইনবক্সে 'Payments' লেবেল তৈরি করুন এবং লেনদেনের রসিদগুলো গুছিয়ে রাখুন"
              : "Organize incoming transaction receipts with a dedicated 'Payments' label via Gmail API"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {lang === 'bn' ? 'রিফ্রেশ' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Visual Gmail Receipt Automation Banner */}
      <div className="rounded-2xl border border-red-500/20 bg-gradient-to-r from-slate-900 via-rose-950/20 to-slate-900 p-4 sm:p-5 flex flex-col md:flex-row items-center gap-5 overflow-hidden relative shadow-lg">
        <div className="flex-1 space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/10 text-red-300 border border-red-500/20">
            <span>Official Google Workspace Integration</span>
          </div>
          <h3 className="text-base font-bold text-white">
            {lang === 'bn' ? 'স্বয়ংক্রিয় রসিদ প্রেরণ ও ইনবক্স অর্গানাইজেশন' : 'Automated Receipt Dispatch & Inbox Triage'}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
            {lang === 'bn'
              ? 'ইনকামিং পেমেন্ট ইমেইলগুলোকে স্বয়ংক্রিয়ভাবে Payments লেবেল দিয়ে ফিল্টার করুন এবং এক-ক্লিকে কাস্টমার রসিদ প্রেরণ করুন।'
              : 'Direct integration with Gmail REST API to identify Stripe headers, organize invoices under a Payments label, and dispatch branded HTML receipts.'}
          </p>
        </div>

        <div className="w-full md:w-64 h-28 rounded-xl overflow-hidden border border-red-500/30 shadow-md relative shrink-0 group">
          <img
            src="/src/assets/images/gmail_receipt_banner_1790807180762.jpg"
            alt="Gmail Receipt Banner"
            className="w-full h-full object-cover object-center transform group-hover:scale-105 transition duration-500"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />
          <span className="absolute bottom-1.5 left-2 text-[10px] font-mono text-red-300 font-semibold bg-slate-950/80 px-2 py-0.5 rounded border border-red-500/30">
            ✉️ Inbox Synced
          </span>
        </div>
      </div>

      {/* NEW: Payments Label Organizer Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300">
                <Tag className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <span>{lang === 'bn' ? "ইনবক্স 'Payments' লেবেল ম্যানেজার" : "Inbox 'Payments' Label Organizer"}</span>
                {paymentsLabel ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-400" />
                    {lang === 'bn' ? 'লেবেল তৈরি আছে' : 'Label Active'}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {lang === 'bn' ? 'লেবেল প্রয়োজন' : 'Not Created Yet'}
                  </span>
                )}
              </h3>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl">
              {paymentsLabel
                ? lang === 'bn'
                  ? `আপনার Gmail ইনবক্সে 'Payments' লেবেল সক্রিয় রয়েছে। ইনকামিং পেমেন্ট রসিদ এবং ইনভয়েসগুলো এই লেবেলের অধীনে স্বয়ংক্রিয়ভাবে সাজানো যায়।`
                  : `'Payments' label is active in your Gmail. You can automatically group and tag incoming transaction receipts under this label.`
                : lang === 'bn'
                ? `ইনকামিং সব পেমেন্ট রসিদ স্বয়ংক্রিয়ভাবে আলাদা ফোল্ডারে গুছিয়ে রাখতে আপনার জিমেইলে একটি 'Payments' লেবেল তৈরি করুন।`
                : `Create a dedicated 'Payments' label in your inbox to automatically categorize incoming Stripe receipts and invoices.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleAutoOrganizeStripeReceipts}
              disabled={isScanningStripe}
              className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-violet-950/40 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              title={lang === 'bn' ? 'Stripe হেডার স্ক্যান করে স্বয়ংক্রিয়ভাবে Payments লেবেল দিন' : 'Scan Stripe headers and auto-label receipts'}
            >
              {isScanningStripe ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{lang === 'bn' ? 'Stripe স্ক্যান হচ্ছে...' : 'Scanning Stripe...'}</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>{lang === 'bn' ? 'Stripe হেডার অটো-স্ক্যান' : 'Auto-Organize Stripe Receipts'}</span>
                </>
              )}
            </button>

            {!paymentsLabel ? (
              <button
                type="button"
                onClick={handleEnsurePaymentLabel}
                disabled={isCreatingPaymentsLabel}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                {isCreatingPaymentsLabel ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{lang === 'bn' ? 'লেবেল নিশ্চিত করা হচ্ছে...' : 'Checking / Creating Label...'}</span>
                  </>
                ) : (
                  <>
                    <FolderPlus className="w-3.5 h-3.5 text-emerald-200" />
                    <span>
                      {lang === 'bn'
                        ? "'Payments' লেবেল নিশ্চিত / তৈরি করুন"
                        : "Ensure 'Payments' Label Exists"}
                    </span>
                  </>
                )}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleEnsurePaymentLabel}
                  disabled={isCreatingPaymentsLabel}
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  title={lang === 'bn' ? 'লেবেল নিশ্চিত / পুনঃযাচাই করুন' : "Verify or re-ensure 'Payments' label via ensurePaymentLabelExists"}
                >
                  <Tag className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{lang === 'bn' ? "'Payments' লেবেল নিশ্চিত করুন" : "Ensure 'Payments' Label Exists"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenOrganizeReceiptsModal}
                  disabled={unlabelledReceiptsCount === 0}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-indigo-950/40 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>
                    {lang === 'bn'
                      ? `রসিদগুলো গুছিয়ে ফেলুন (${unlabelledReceiptsCount})`
                      : `Organize Receipts (${unlabelledReceiptsCount})`}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Custom Receipt Dispatcher */}
        <div className="lg:col-span-5 space-y-4">
          <form onSubmit={handleOpenReceiptModal} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Send className="w-4 h-4 text-red-400" />
                {lang === 'bn' ? 'কাস্টম রসিদ প্রেরণ (Gmail)' : 'Dispatch Custom Receipt'}
              </h3>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-semibold">
                OAuth Active
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {lang === 'bn' ? 'প্রাপকের ইমেইল (Recipient Email)' : 'Recipient Email'}
              </label>
              <input
                type="email"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {lang === 'bn' ? 'গ্রাহকের নাম (Customer Name)' : 'Customer Name'}
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === 'bn' ? 'অ্যামাউন্ট' : 'Amount'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === 'bn' ? 'কারেন্সি' : 'Currency'}
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none uppercase font-semibold"
                >
                  <option value="usd">USD ($)</option>
                  <option value="eur">EUR (€)</option>
                  <option value="gbp">GBP (£)</option>
                  <option value="bdt">BDT (৳)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {lang === 'bn' ? 'সার্ভিস বা প্রোডাক্ট বিবরণ' : 'Product / Service Description'}
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-indigo-600 hover:from-red-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-red-950/40 flex items-center justify-center gap-2 cursor-pointer transition"
            >
              <Mail className="w-3.5 h-3.5" />
              {lang === 'bn' ? 'রসিদ ইমেইল রিভিউ ও সেন্ড' : 'Review & Send Receipt'}
            </button>
          </form>
        </div>

        {/* Right Column: Gmail Billing Messages Viewer & Label Filter */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4 text-red-400" />
                <h3 className="text-sm font-bold text-slate-200">
                  {lang === 'bn' ? 'সাম্প্রতিক বিলিং ও রসিদ ইমেইল' : 'Recent Billing Emails'}
                </h3>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
                <input
                  type="text"
                  placeholder="খুঁজুন (Search)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-xs rounded-xl pl-8 pr-3 py-1.5 text-slate-200 focus:outline-none w-full sm:w-44 focus:border-indigo-500 transition"
                />
              </div>
            </div>

            {/* Filter Toggle Segment Control */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 bg-slate-950 border border-slate-800 rounded-xl">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setFilterOnlyPayments(false)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    !filterOnlyPayments
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Inbox className="w-3.5 h-3.5 text-slate-400" />
                  <span>{lang === 'bn' ? 'সকল রসিদ' : 'All Receipts'}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700/80 text-slate-300 font-mono font-bold">
                    {messages.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilterOnlyPayments(true)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    filterOnlyPayments
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/50'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Tag className={`w-3.5 h-3.5 ${filterOnlyPayments ? 'text-white' : 'text-emerald-400'}`} />
                  <span>{lang === 'bn' ? 'শুধু Payments লেবেল' : "Only 'Payments'"}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      filterOnlyPayments
                        ? 'bg-white/25 text-white'
                        : 'bg-emerald-950/70 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {taggedCount}
                  </span>
                </button>
              </div>

              {/* Status summary pill */}
              <div className="text-[11px] text-slate-400 hidden sm:flex items-center gap-2 pr-2">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="text-emerald-300 font-semibold">{taggedCount}</span> ট্যাগড
                </span>
                <span>•</span>
                <span className="text-slate-500">{unlabelledReceiptsCount} আনট্যাগড</span>
              </div>
            </div>

            {/* Filter Active Notification Banner */}
            {filterOnlyPayments && (
              <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 animate-in fade-in duration-150">
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    {lang === 'bn'
                      ? `ফিল্টার সক্রিয়: শুধুমাত্র 'Payments' লেবেলযুক্ত ${filteredMessages.length}টি ইমেইল প্রদর্শিত হচ্ছে`
                      : `Filter active: Showing ${filteredMessages.length} email(s) with 'Payments' label`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFilterOnlyPayments(false)}
                  className="text-[11px] font-bold underline hover:text-white cursor-pointer ml-2"
                >
                  {lang === 'bn' ? 'ফিল্টার মুছুন' : 'Clear Filter'}
                </button>
              </div>
            )}

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-400" />
                <p>{lang === 'bn' ? 'Gmail থেকে ইমেইল লোড হচ্ছে...' : 'Loading messages from Gmail...'}</p>
              </div>
            ) : filteredMessages.length > 0 ? (
              <div className="space-y-3">
                {filteredMessages.map((msg) => {
                  const isTaggedWithPayments =
                    paymentsLabel && (msg.labelIds || []).includes(paymentsLabel.id);

                  return (
                    <div
                      key={msg.id}
                      className={`rounded-xl p-3.5 space-y-2.5 transition text-left border ${
                        isTaggedWithPayments
                          ? 'border-l-4 border-l-emerald-500 border-emerald-500/30 bg-gradient-to-r from-emerald-950/20 via-slate-950 to-slate-950 shadow-md shadow-emerald-950/30'
                          : 'border-l-4 border-l-slate-700 border-slate-800/80 bg-slate-950 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-xs text-slate-200 block truncate max-w-[240px] sm:max-w-[340px]">
                            {msg.subject}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate max-w-[200px]">
                            {msg.from}
                          </span>
                        </div>

                        {/* Top-Right Visual Indicators */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {msg.isStripeReceipt && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/40"
                              title={lang === 'bn' ? 'Stripe হেডার সনাক্ত হয়েছে' : 'Stripe-specific headers detected'}
                            >
                              <Zap className="w-2.5 h-2.5 text-amber-400" />
                              <span>Stripe</span>
                            </span>
                          )}

                          {isTaggedWithPayments ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs shadow-emerald-950">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              <Tag className="w-3 h-3 text-emerald-400" />
                              <span>Payments</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-900 text-slate-400 border border-slate-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                              <span>{lang === 'bn' ? 'আনট্যাগড' : 'Untagged'}</span>
                            </span>
                          )}

                          <span className="text-[10px] text-slate-500 font-mono">
                            {msg.date ? new Date(msg.date).toLocaleDateString() : ''}
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {msg.snippet}
                      </p>

                      {/* Bottom Action & Status Footer */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-[10px]">
                        <span className="font-mono text-slate-600 text-[9px]">ID: {msg.id.slice(0, 12)}</span>

                        {paymentsLabel && (
                          <button
                            type="button"
                            onClick={() => handleToggleMessageLabel(msg)}
                            className={`px-2.5 py-1 rounded-lg font-semibold text-[10px] border transition cursor-pointer flex items-center gap-1.5 ${
                              isTaggedWithPayments
                                ? 'bg-emerald-950/30 hover:bg-rose-950/40 text-emerald-300 hover:text-rose-300 border-emerald-500/30 hover:border-rose-500/30'
                                : 'bg-slate-900 hover:bg-emerald-950/40 text-slate-300 hover:text-emerald-300 border-slate-700 hover:border-emerald-500/40'
                            }`}
                          >
                            {isTaggedWithPayments ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>{lang === 'bn' ? 'Payments ট্যাগড (ক্লিক করে সরান)' : 'Payments Tagged (Remove)'}</span>
                              </>
                            ) : (
                              <>
                                <Tag className="w-3 h-3 text-indigo-400" />
                                <span>{lang === 'bn' ? "+ 'Payments' লেবেল দিন" : "+ Tag with Payments"}</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                <Inbox className="w-8 h-8 mx-auto text-slate-700 mb-1" />
                <p className="font-medium text-slate-400">
                  {filterOnlyPayments
                    ? lang === 'bn'
                      ? "'Payments' লেবেলযুক্ত কোনো রসিদ পাওয়া যায়নি।"
                      : "No emails found with 'Payments' label."
                    : lang === 'bn'
                    ? 'কোনো বিলিং ইমেইল পাওয়া যায়নি।'
                    : 'No billing or receipt messages found.'}
                </p>
                {filterOnlyPayments && (
                  <button
                    type="button"
                    onClick={() => setFilterOnlyPayments(false)}
                    className="text-xs text-emerald-400 font-semibold underline hover:text-emerald-300 cursor-pointer"
                  >
                    {lang === 'bn' ? 'সকল ইমেইল দেখতে ফিল্টার রিসেট করুন' : 'Show All Emails'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Label Operations */}
      <ConfirmLabelModal
        isOpen={confirmLabelModalOpen}
        actionType={labelActionType}
        labelName="Payments"
        affectedCount={unlabelledReceiptsCount}
        onConfirm={handleConfirmLabelAction}
        onCancel={() => setConfirmLabelModalOpen(false)}
        isProcessing={isProcessingLabel}
        lang={lang}
      />
    </div>
  );
};
