import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Wallet,
  ArrowUpRight,
  PlusCircle,
  Lock,
  Unlock,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Smartphone,
  Globe,
  ShoppingCart,
  Send,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Zap,
  Info,
  DollarSign,
  ArrowDownLeft,
  ChevronRight,
} from 'lucide-react';
import {
  VirtualCardDetails,
  CardTransaction,
  getVirtualCard,
  getCardTransactions,
  topupCardBalance,
  toggleCardFreeze,
  generateNewVirtualCard,
  authorizeCardPayment,
} from '../services/virtualCard';

interface VirtualCardTabProps {
  lang?: 'bn' | 'en';
}

export const VirtualCardTab: React.FC<VirtualCardTabProps> = ({ lang = 'bn' }) => {
  const [card, setCard] = useState<VirtualCardDetails>(getVirtualCard());
  const [transactions, setTransactions] = useState<CardTransaction[]>(getCardTransactions());
  const [revealCard, setRevealCard] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Topup State
  const [showTopupModal, setShowTopupModal] = useState<boolean>(false);
  const [topupAmount, setTopupAmount] = useState<number>(50);
  const [isProcessingTopup, setIsProcessingTopup] = useState<boolean>(false);

  // Issue New Card State
  const [showIssueModal, setShowIssueModal] = useState<boolean>(false);
  const [newCardNetwork, setNewCardNetwork] = useState<'visa' | 'mastercard'>('visa');
  const [newCardHolderName, setNewCardHolderName] = useState<string>('RUBEL BANK USER');

  // Gateway / bKash / Platform Payment Simulator State
  const [activePlatform, setActivePlatform] = useState<'bkash' | 'nagad' | 'meta_google' | 'international_gateway' | 'custom'>('bkash');
  const [simTargetAccount, setSimTargetAccount] = useState<string>('01712345678');
  const [simAmountBdt, setSimAmountBdt] = useState<number>(1225); // ~$10 USD
  const [simAmountUsd, setSimAmountUsd] = useState<number>(10);
  const [simMerchantName, setSimMerchantName] = useState<string>('bKash Card-to-Wallet Add Money');
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [showOtpChallenge, setShowOtpChallenge] = useState<boolean>(false);
  const [otpCode, setOtpCode] = useState<string>('729481');
  const [paymentFeedback, setPaymentFeedback] = useState<{ success: boolean; msg: string; remaining?: number } | null>(null);

  useEffect(() => {
    setCard(getVirtualCard());
    setTransactions(getCardTransactions());
  }, []);

  const copyText = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleToggleFreeze = () => {
    const updated = toggleCardFreeze();
    setCard(updated);
  };

  const handleTopup = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingTopup(true);
    setTimeout(() => {
      const { card: updatedCard, tx } = topupCardBalance(topupAmount, 'Stripe Gateway Wallet Top-up');
      setCard(updatedCard);
      setTransactions((prev) => [tx, ...prev]);
      setIsProcessingTopup(false);
      setShowTopupModal(false);
      setPaymentFeedback({
        success: true,
        msg:
          lang === 'bn'
            ? `কার্ডে $${topupAmount} (৳${(topupAmount * updatedCard.exchangeRateBdt).toLocaleString()}) সফলভাবে লোড হয়েছে!`
            : `Successfully added $${topupAmount} to your virtual card balance!`,
      });
      setTimeout(() => setPaymentFeedback(null), 5000);
    }, 600);
  };

  const handleIssueNewCard = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = generateNewVirtualCard(newCardNetwork, newCardHolderName);
    setCard(updated);
    setShowIssueModal(false);
    setPaymentFeedback({
      success: true,
      msg:
        lang === 'bn'
          ? `নতুন ভার্চুয়াল ${newCardNetwork.toUpperCase()} কার্ড সফলভাবে ইস্যু করা হয়েছে!`
          : `New Virtual ${newCardNetwork.toUpperCase()} card successfully issued!`,
    });
    setTimeout(() => setPaymentFeedback(null), 5000);
  };

  const handlePlatformSelect = (plat: typeof activePlatform) => {
    setActivePlatform(plat);
    if (plat === 'bkash') {
      setSimMerchantName('bKash Card-to-Wallet Add Money');
      setSimTargetAccount('01712345678');
      setSimAmountBdt(1225);
      setSimAmountUsd(10);
    } else if (plat === 'nagad') {
      setSimMerchantName('Nagad Card-to-Wallet Add Money');
      setSimTargetAccount('01887654321');
      setSimAmountBdt(1500);
      setSimAmountUsd(12.24);
    } else if (plat === 'meta_google') {
      setSimMerchantName('Meta Ads Manager (Facebook)');
      setSimTargetAccount('ACT-92819481029');
      setSimAmountUsd(25);
      setSimAmountBdt(Math.round(25 * card.exchangeRateBdt));
    } else if (plat === 'international_gateway') {
      setSimMerchantName('Google Cloud / Stripe Merchant Checkout');
      setSimTargetAccount('MERCH-ONLINE-CHECKOUT');
      setSimAmountUsd(15);
      setSimAmountBdt(Math.round(15 * card.exchangeRateBdt));
    } else {
      setSimMerchantName('Custom A-to-Z Platform Checkout');
      setSimTargetAccount('ANY-GATEWAY-ACCOUNT');
      setSimAmountUsd(20);
      setSimAmountBdt(Math.round(20 * card.exchangeRateBdt));
    }
  };

  const handleTriggerPaymentOrOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (card.isFrozen) {
      setPaymentFeedback({
        success: false,
        msg: lang === 'bn' ? 'কার্ডটি লক (Frozen) করা রয়েছে! আনলক করে পেমেন্ট করুন।' : 'Card is currently frozen! Please unfreeze to transact.',
      });
      return;
    }

    if (card.balanceUsd < simAmountUsd) {
      setPaymentFeedback({
        success: false,
        msg:
          lang === 'bn'
            ? `কার্ডে পর্যাপ্ত ব্যালেন্স নেই। প্রয়োজন: $${simAmountUsd.toFixed(2)} (৳${simAmountBdt.toLocaleString()}), ব্যালেন্স আছে: $${card.balanceUsd.toFixed(2)}`
            : `Insufficient balance. Required: $${simAmountUsd.toFixed(2)}, Available: $${card.balanceUsd.toFixed(2)}`,
      });
      return;
    }

    // Trigger 3D Secure / OTP Simulation challenge
    setShowOtpChallenge(true);
  };

  const handleConfirmOtpAndAuthorize = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      const res = authorizeCardPayment({
        merchant: simMerchantName,
        platformCategory: activePlatform === 'custom' ? 'other' : activePlatform,
        amountUsd: simAmountUsd,
        amountBdt: simAmountBdt,
        referenceNo: `REF-${activePlatform.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`,
        providedCardNumber: card.rawCardNumber,
        providedCvv: card.cvv,
      });

      setCard(res.updatedCard);
      setTransactions((prev) => [res.transaction, ...prev]);
      setShowOtpChallenge(false);
      setIsProcessingPayment(false);

      setPaymentFeedback({
        success: res.success,
        msg: res.message,
        remaining: res.updatedCard.balanceUsd,
      });

      setTimeout(() => setPaymentFeedback(null), 8000);
    }, 700);
  };

  const maskedCardNumber = `${card.cardNumber.slice(0, 4)} •••• •••• ${card.cardNumber.slice(-4)}`;

  return (
    <div className="space-y-6 text-left max-w-6xl mx-auto">
      {/* Toast Feedback */}
      {paymentFeedback && (
        <div
          className={`border px-4 py-3 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-2xl animate-in fade-in duration-200 ${
            paymentFeedback.success
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500/40 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {paymentFeedback.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{paymentFeedback.msg}</span>
          </div>
          {paymentFeedback.remaining !== undefined && (
            <span className="text-[11px] font-mono bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30 text-emerald-300 font-bold shrink-0">
              New Balance: ${paymentFeedback.remaining.toFixed(2)}
            </span>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-400" />
            {lang === 'bn' ? 'নিজস্ব ভার্চুয়াল কার্ড ও ওয়ালেট ব্যালেন্স' : 'Virtual Card Issuing & Digital Wallet'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {lang === 'bn'
              ? 'আমাদের ভার্চুয়াল কার্ড দিয়ে বিকাশ, নগদ, ফেসবুক অ্যাডস এবং যেকোনো গেটওয়েতে পেমেন্ট করুন—কার্ড থেকে সরাসরি ব্যালেন্স কাটবে'
              : 'Use your virtual card number to pay or add money on bKash, Nagad, Meta Ads, and international gateways'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowTopupModal(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-950/40 flex items-center gap-1.5 transition cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'কার্ডে টাকা লোড করুন' : 'Top-up Balance'}</span>
          </button>

          <button
            type="button"
            onClick={handleToggleFreeze}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition cursor-pointer ${
              card.isFrozen
                ? 'bg-rose-950/60 border-rose-500/40 text-rose-300 hover:bg-rose-900/60'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
            }`}
          >
            {card.isFrozen ? (
              <>
                <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                <span>{lang === 'bn' ? 'কার্ড আনলক করুন' : 'Unfreeze Card'}</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>{lang === 'bn' ? 'কার্ড লক করুন (Freeze)' : 'Freeze Card'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Top 3-Metric Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card Available Balance */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{lang === 'bn' ? 'কার্ডে বর্তমান ব্যালেন্স' : 'Available Card Balance'}</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-extrabold text-white font-mono">
              ${card.balanceUsd.toFixed(2)}
            </span>
            <span className="text-xs font-semibold text-emerald-400 font-mono">
              ৳{(card.balanceUsd * card.exchangeRateBdt).toLocaleString()} BDT
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            {lang === 'bn' ? `লাইভ কনভার্শন: $1 = ৳${card.exchangeRateBdt}` : `Rate: 1 USD = ${card.exchangeRateBdt} BDT`}
          </p>
          <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Card Status & Security */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{lang === 'bn' ? 'কার্ডের স্ট্যাটাস' : 'Card Status & Security'}</span>
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="pt-1 flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                card.isFrozen
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              }`}
            >
              {card.isFrozen ? (lang === 'bn' ? 'লক করা (FROZEN)' : 'FROZEN') : (lang === 'bn' ? 'সক্রিয় (ACTIVE)' : 'ACTIVE')}
            </span>
            <span className="text-xs text-slate-400">
              {card.network === 'visa' ? 'Visa Platinum' : 'Mastercard World'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            {lang === 'bn' ? '3DS2 বায়োমেট্রিক ও ওটিপি সুরক্ষিত' : '3D Secure OTP & SCA mandates verified'}
          </p>
          <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Monthly Spending Limit */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-1.5 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{lang === 'bn' ? 'মাসিক স্পেন্ডিং লিমিট' : 'Monthly Spending Limit'}</span>
            <TrendingDown className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-base font-bold text-white font-mono">
              ${card.spentThisMonth.toFixed(2)}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              / ${card.spendingLimitMonthly.toFixed(2)} limit
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (card.spentThisMonth / card.spendingLimitMonthly) * 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500">
            {lang === 'bn'
              ? `অবশিষ্ট লিমিট: $${(card.spendingLimitMonthly - card.spentThisMonth).toFixed(2)}`
              : `Available limit: $${(card.spendingLimitMonthly - card.spentThisMonth).toFixed(2)}`}
          </p>
        </div>
      </div>

      {/* Main 2-Column: Left Virtual Card Graphic & Details, Right Live Payment & Gateway Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Physical Virtual Card View & Credentials (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Card Showcase Graphic */}
          <div
            className={`relative rounded-3xl p-6 sm:p-7 shadow-2xl transition-all duration-300 overflow-hidden border ${
              card.isFrozen
                ? 'bg-gradient-to-br from-slate-900 via-rose-950/40 to-slate-950 border-rose-500/40 opacity-90'
                : 'bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 border-indigo-500/40 shadow-indigo-950/60'
            }`}
          >
            {/* Background Decorative Glow */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Top Bar: Bank Brand & Network */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/30 flex items-center justify-center font-extrabold text-white text-xs border border-indigo-400/30">
                  ⚡
                </div>
                <div>
                  <span className="font-extrabold text-sm tracking-wider text-white block">
                    PAYMENTHUB
                  </span>
                  <span className="text-[9px] uppercase tracking-widest text-indigo-300 block -mt-1 font-semibold">
                    Virtual Debit
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {card.isFrozen && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    FROZEN
                  </span>
                )}
                <span className="text-xs font-black tracking-widest text-white uppercase bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-700">
                  {card.network.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Chip & Contactless */}
            <div className="my-6 flex items-center justify-between relative z-10">
              <div className="w-11 h-8 rounded-md bg-gradient-to-tr from-amber-300 via-amber-200 to-yellow-500 border border-amber-600/40 shadow-inner flex items-center justify-center">
                <div className="w-9 h-6 border-y border-amber-800/40 opacity-70" />
              </div>
              <span className="text-white/60 font-mono text-sm tracking-widest">
                📶
              </span>
            </div>

            {/* Card Number */}
            <div className="space-y-1 relative z-10">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                Card Number
              </span>
              <div className="flex items-center justify-between">
                <span className="font-mono text-lg sm:text-xl font-bold tracking-widest text-white drop-shadow-md">
                  {revealCard ? card.cardNumber : maskedCardNumber}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setRevealCard(!revealCard)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/50 transition cursor-pointer"
                    title={revealCard ? 'Hide card number' : 'Show card number'}
                  >
                    {revealCard ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => copyText(card.rawCardNumber, 'card_num')}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/50 transition cursor-pointer"
                    title="Copy 16-digit card number"
                  >
                    {copiedField === 'card_num' ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom: Cardholder, Expiry, CVV */}
            <div className="mt-6 pt-3 border-t border-slate-700/60 flex items-center justify-between relative z-10 text-xs">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-semibold">
                  Cardholder
                </span>
                <span className="font-bold text-white tracking-wide uppercase truncate max-w-[140px] block">
                  {card.cardholderName}
                </span>
              </div>

              <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-semibold">
                  Expires
                </span>
                <div className="flex items-center gap-1">
                  <span className="font-mono font-bold text-white">{card.expiryDate}</span>
                  <button
                    type="button"
                    onClick={() => copyText(card.expiryDate, 'exp')}
                    className="text-slate-400 hover:text-white p-0.5"
                    title="Copy expiry"
                  >
                    {copiedField === 'exp' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-semibold">
                  CVV / CVC
                </span>
                <div className="flex items-center gap-1">
                  <span className="font-mono font-bold text-white">
                    {revealCard ? card.cvv : '•••'}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyText(card.cvv, 'cvv')}
                    className="text-slate-400 hover:text-white p-0.5"
                    title="Copy CVV"
                  >
                    {copiedField === 'cvv' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Card Credentials Quick Copy Box */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                {lang === 'bn' ? 'কার্ড ক্রেডেনশিয়াল (পেমেন্ট বা টাকা এডের জন্য কপি করুন)' : 'Card Credentials for Payments / Add Money'}
              </h3>
              <button
                type="button"
                onClick={() => setShowIssueModal(true)}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold underline cursor-pointer"
              >
                {lang === 'bn' ? 'নতুন কার্ড ইস্যু করুন' : 'Issue New Card'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">16-Digit Number</span>
                  <span className="font-mono text-slate-200 font-semibold text-xs">
                    {revealCard ? card.rawCardNumber : `${card.rawCardNumber.slice(0, 4)}...${card.rawCardNumber.slice(-4)}`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => copyText(card.rawCardNumber, 'raw_num')}
                  className="p-1 hover:text-white text-slate-400 cursor-pointer"
                  title="Copy Card Number"
                >
                  {copiedField === 'raw_num' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">CVV Code</span>
                  <span className="font-mono text-slate-200 font-semibold text-xs">{revealCard ? card.cvv : '•••'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyText(card.cvv, 'cvv2')}
                  className="p-1 hover:text-white text-slate-400 cursor-pointer"
                  title="Copy CVV"
                >
                  {copiedField === 'cvv2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5 text-[11px] text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Billing Address:</span>
                <span className="text-slate-300 font-medium">{card.billingAddress.street}, {card.billingAddress.city}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Postal Code / Country:</span>
                <span className="text-slate-300 font-medium">{card.billingAddress.postalCode}, {card.billingAddress.country}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Gateway Payment & bKash / Nagad Add Money Engine (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  {lang === 'bn' ? 'গেটওয়ে পেমেন্ট ও প্ল্যাটফর্মে টাকা এড ইঞ্জিন' : 'Gateway Payment & Platform Add Money Engine'}
                </h3>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold">
                  Card Linked
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {lang === 'bn'
                  ? 'আপনার ভার্চুয়াল কার্ড নাম্বার ব্যবহার করে বিকাশ, নগদ বা যেকোনো গেটওয়েতে টাকা লোড/পেমেন্ট করুন। অনুমোদিত হলে কার্ড ব্যালেন্স থেকে স্বয়ংক্রিয়ভাবে টাকা কেটে নেওয়া হবে।'
                  : 'Simulate paying with or adding money from your card to bKash, Nagad, Meta Ads, and international gateways.'}
              </p>
            </div>

            {/* Platform Selector Segment Buttons */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                {lang === 'bn' ? 'টার্গেট প্ল্যাটফর্ম বেছে নিন (Select Platform):' : 'Select Target Platform:'}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handlePlatformSelect('bkash')}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    activePlatform === 'bkash'
                      ? 'bg-rose-950/40 border-rose-500/50 shadow-md shadow-rose-950/40 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-bold text-xs text-rose-400">bKash (বিকাশ)</span>
                    <Smartphone className="w-3.5 h-3.5 text-rose-400" />
                  </div>
                  <span className="text-[10px] text-slate-400">Card to bKash</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePlatformSelect('nagad')}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    activePlatform === 'nagad'
                      ? 'bg-orange-950/40 border-orange-500/50 shadow-md shadow-orange-950/40 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-bold text-xs text-orange-400">Nagad (নগদ)</span>
                    <Smartphone className="w-3.5 h-3.5 text-orange-400" />
                  </div>
                  <span className="text-[10px] text-slate-400">Card to Nagad</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePlatformSelect('meta_google')}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    activePlatform === 'meta_google'
                      ? 'bg-blue-950/40 border-blue-500/50 shadow-md shadow-blue-950/40 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-bold text-xs text-blue-400">Meta / Google</span>
                    <Globe className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <span className="text-[10px] text-slate-400">Ads & Cloud Pay</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePlatformSelect('custom')}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    activePlatform === 'custom'
                      ? 'bg-indigo-950/40 border-indigo-500/50 shadow-md shadow-indigo-950/40 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-bold text-xs text-indigo-400">A-to-Z গেটওয়ে</span>
                    <ShoppingCart className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <span className="text-[10px] text-slate-400">Custom Gateway</span>
                </button>
              </div>
            </div>

            {/* Payment / Add Money Simulation Form */}
            <form onSubmit={handleTriggerPaymentOrOtp} className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {activePlatform === 'bkash' || activePlatform === 'nagad'
                      ? lang === 'bn'
                        ? 'ওয়ালেট নাম্বার (Wallet Number)'
                        : 'bKash/Nagad Mobile Number'
                      : lang === 'bn'
                      ? 'মার্চেন্ট / একাউন্ট রেফারেন্স'
                      : 'Merchant Reference / ID'}
                  </label>
                  <input
                    type="text"
                    value={simTargetAccount}
                    onChange={(e) => setSimTargetAccount(e.target.value)}
                    required
                    placeholder="e.g. 017XXXXXXXX"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {lang === 'bn' ? 'মার্চেন্ট / সার্ভিস নাম' : 'Service / Gateway Name'}
                  </label>
                  <input
                    type="text"
                    value={simMerchantName}
                    onChange={(e) => setSimMerchantName(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Amount dual input (USD & BDT) */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">
                    {lang === 'bn' ? 'কাটার পরিমাণ (Deduction Amount):' : 'Amount to Deduct from Card:'}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Available: <strong className="text-emerald-400">${card.balanceUsd.toFixed(2)}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Amount in USD ($)
                    </label>
                    <div className="relative">
                      <DollarSign className="w-4 h-4 text-slate-500 absolute left-2.5 top-2.5" />
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        value={simAmountUsd}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setSimAmountUsd(val);
                          setSimAmountBdt(Math.round(val * card.exchangeRateBdt));
                        }}
                        required
                        className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl pl-8 pr-3 py-2 text-sm text-white font-mono focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Equivalent in BDT (৳)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs font-bold text-slate-500">৳</span>
                      <input
                        type="number"
                        min="50"
                        value={simAmountBdt}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setSimAmountBdt(val);
                          setSimAmountUsd(Math.round((val / card.exchangeRateBdt) * 100) / 100);
                        }}
                        required
                        className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl pl-8 pr-3 py-2 text-sm text-white font-mono focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Quick preset chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-500 mr-1">Quick Select:</span>
                  {[5, 10, 20, 50, 100].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setSimAmountUsd(amt);
                        setSimAmountBdt(Math.round(amt * card.exchangeRateBdt));
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500 text-[11px] font-mono text-slate-300 hover:text-white transition cursor-pointer"
                    >
                      ${amt} (৳{Math.round(amt * card.exchangeRateBdt).toLocaleString()})
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={card.isFrozen || card.balanceUsd < simAmountUsd}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-bold text-sm shadow-xl shadow-indigo-950/50 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CreditCard className="w-4 h-4" />
                <span>
                  {activePlatform === 'bkash'
                    ? lang === 'bn'
                      ? `কার্ড থেকে বিকাশ-এ ৳${simAmountBdt.toLocaleString()} ($${simAmountUsd.toFixed(2)}) এড করুন`
                      : `Add ৳${simAmountBdt.toLocaleString()} ($${simAmountUsd.toFixed(2)}) to bKash`
                    : activePlatform === 'nagad'
                    ? lang === 'bn'
                      ? `কার্ড থেকে নগদ-এ ৳${simAmountBdt.toLocaleString()} ($${simAmountUsd.toFixed(2)}) এড করুন`
                      : `Add ৳${simAmountBdt.toLocaleString()} ($${simAmountUsd.toFixed(2)}) to Nagad`
                    : lang === 'bn'
                    ? `কার্ড দিয়ে $${simAmountUsd.toFixed(2)} পেমেন্ট অনুমোদন করুন`
                    : `Authorize $${simAmountUsd.toFixed(2)} Deduction via Card`}
                </span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Real-Time Transaction Ledger / History */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-emerald-400" />
              {lang === 'bn' ? 'কার্ড লেনদেন ইতিহাস ও কর্তন লগ' : 'Virtual Card Transaction & Deduction Ledger'}
            </h3>
            <p className="text-xs text-slate-400">
              {lang === 'bn'
                ? 'বিকাশ, নগদ, আন্তর্জাতিক গেটওয়ে বা যেকোনো প্ল্যাটফর্ম থেকে টাকা কর্তনের রিয়েল-টাইম স্টেটমেন্ট'
                : 'Real-time statement of every transaction deducted directly from your virtual card'}
            </p>
          </div>

          <span className="text-xs font-mono text-slate-400">
            Total records: <strong className="text-slate-200">{transactions.length}</strong>
          </span>
        </div>

        {transactions.length > 0 ? (
          <div className="divide-y divide-slate-800/80">
            {transactions.map((tx) => (
              <div key={tx.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.type === 'topup'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : tx.status === 'approved'
                        ? 'bg-indigo-500/20 text-indigo-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {tx.type === 'topup' ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : tx.status === 'approved' ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200">{tx.merchant}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${
                          tx.status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {tx.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                      <span>Ref: {tx.referenceNo}</span>
                      <span>•</span>
                      <span>Auth: {tx.authCode}</span>
                      <span>•</span>
                      <span>{new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {tx.declineReason && (
                      <span className="text-[10px] text-rose-400 block">{tx.declineReason}</span>
                    )}
                  </div>
                </div>

                <div className="text-right sm:shrink-0 font-mono">
                  <span
                    className={`font-extrabold text-sm block ${
                      tx.type === 'topup' ? 'text-emerald-400' : 'text-slate-100'
                    }`}
                  >
                    {tx.type === 'topup' ? '+' : '-'}${tx.amountUsd.toFixed(2)}
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    {tx.type === 'topup' ? '+' : '-'}৳{tx.amountBdt.toLocaleString()} BDT
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Balance: ${tx.remainingBalanceUsd.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-500">
            {lang === 'bn' ? 'এখনো কোনো লেনদেন রেকর্ড নেই।' : 'No transactions recorded yet.'}
          </div>
        )}
      </div>

      {/* 3DS / OTP Authentication Modal */}
      {showOtpChallenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center gap-2.5 text-indigo-400 border-b border-slate-800 pb-3">
              <div className="p-2 bg-indigo-500/20 rounded-xl">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">
                  {lang === 'bn' ? '3D Secure ওটিপি ভেরিফিকেশন' : '3D Secure 2 OTP Verification'}
                </h3>
                <p className="text-xs text-slate-400">
                  {activePlatform === 'bkash' ? 'bKash Card Add Money' : simMerchantName}
                </p>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Card:</span>
                <span className="text-slate-200">•••• {card.rawCardNumber.slice(-4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Deduction Amount:</span>
                <span className="text-emerald-400 font-bold">${simAmountUsd.toFixed(2)} (৳{simAmountBdt.toLocaleString()} BDT)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Merchant / Platform:</span>
                <span className="text-slate-300">{simMerchantName}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                {lang === 'bn' ? 'আপনার ফোনে পাঠানো 6-সংখ্যার ওটিপি কোড:' : 'Enter 6-digit verification code:'}
              </label>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                maxLength={6}
                className="w-full bg-slate-950 border border-indigo-500 rounded-xl px-4 py-2.5 text-center text-lg font-mono font-bold tracking-widest text-emerald-300 focus:outline-none"
              />
              <span className="text-[11px] text-slate-400 block text-center">
                {lang === 'bn' ? 'টেস্ট কোড: 729481 (স্বয়ংক্রিয়ভাবে পূর্ণ)' : 'Test OTP: 729481 (Auto-filled)'}
              </span>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowOtpChallenge(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isProcessingPayment}
                onClick={handleConfirmOtpAndAuthorize}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-xs font-bold text-white shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                {isProcessingPayment ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{lang === 'bn' ? 'টাকা কাটা হচ্ছে...' : 'Deducting...'}</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{lang === 'bn' ? 'অনুমোদন ও টাকা কাটুন' : 'Approve & Deduct'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top-up Balance Modal */}
      {showTopupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                {lang === 'bn' ? 'কার্ডে ব্যালেন্স টপ-আপ করুন' : 'Top-up Card Balance'}
              </h3>
              <button
                type="button"
                onClick={() => setShowTopupModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleTopup} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  {lang === 'bn' ? 'টাকার পরিমাণ (USD $):' : 'Amount in USD ($):'}
                </label>
                <input
                  type="number"
                  min="5"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(Number(e.target.value) || 0)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  ≈ ৳{(topupAmount * card.exchangeRateBdt).toLocaleString()} BDT
                </span>
              </div>

              <div className="flex gap-2">
                {[20, 50, 100, 200].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTopupAmount(amt)}
                    className="flex-1 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono hover:border-emerald-500 text-slate-300"
                  >
                    ${amt}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTopupModal(false)}
                  className="flex-1 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isProcessingTopup}
                  className="flex-1 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md cursor-pointer"
                >
                  {isProcessingTopup ? (lang === 'bn' ? 'লোড হচ্ছে...' : 'Loading...') : (lang === 'bn' ? 'যোগ করুন' : 'Confirm Top-up')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue New Card Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                {lang === 'bn' ? 'নতুন ভার্চুয়াল কার্ড তৈরি করুন' : 'Issue New Virtual Card'}
              </h3>
              <button
                type="button"
                onClick={() => setShowIssueModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleIssueNewCard} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  {lang === 'bn' ? 'কার্ড নেটওয়ার্ক:' : 'Card Network:'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewCardNetwork('visa')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                      newCardNetwork === 'visa'
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    Visa Platinum
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCardNetwork('mastercard')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                      newCardNetwork === 'mastercard'
                        ? 'bg-purple-600 text-white border-purple-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    Mastercard World
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  {lang === 'bn' ? 'কার্ডহোল্ডারের নাম:' : 'Cardholder Name:'}
                </label>
                <input
                  type="text"
                  value={newCardHolderName}
                  onChange={(e) => setNewCardHolderName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-white uppercase focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="flex-1 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md cursor-pointer"
                >
                  {lang === 'bn' ? 'কার্ড ইস্যু করুন' : 'Issue Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
