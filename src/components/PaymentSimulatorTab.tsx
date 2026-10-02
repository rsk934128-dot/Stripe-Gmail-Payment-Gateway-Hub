import React, { useState } from 'react';
import { CreditCard, DollarSign, Send, ShieldCheck, CheckCircle2, XCircle, AlertCircle, Sparkles, Mail, RefreshCw, Copy, Check } from 'lucide-react';
import { PaymentSimulationResult } from '../types';
import { PaymentReceiptEmailData } from '../services/gmail';
import paymentFlowDiagram from '../assets/images/payment_flow_diagram_1790806964488.jpg';

interface PaymentSimulatorTabProps {
  manualSecretKey: string;
  publishableKey: string;
  onDispatchReceiptModal: (data: PaymentReceiptEmailData) => void;
  isGmailConnected: boolean;
  lang?: 'bn' | 'en';
}

const TEST_CARDS = [
  { label: 'Success (সফল পেমেন্ট)', number: '4242 4242 4242 4242', exp: '12/28', cvc: '123', type: 'success', note: 'Standard successful payment' },
  { label: '3D Secure (ওটিপি ভেরিফিকেশন)', number: '4000 0027 6000 3184', exp: '10/27', cvc: '321', type: '3ds', note: 'Requires 3D Secure OTP action' },
  { label: 'Insufficient Funds (অপর্যাপ্ত ব্যালেন্স)', number: '4000 0000 0000 9995', exp: '08/29', cvc: '456', type: 'fail', note: 'Fails with insufficient funds' },
  { label: 'Declined (কার্ড ডিক্লাইন)', number: '4000 0000 0000 0002', exp: '04/26', cvc: '789', type: 'fail', note: 'Generic card decline' },
  { label: 'Expired Card (মেয়াদোত্তীর্ণ)', number: '4000 0000 0000 0069', exp: '01/22', cvc: '111', type: 'fail', note: 'Card is expired' },
  { label: 'Incorrect CVC (ভুল সিভিভি)', number: '4000 0000 0000 0127', exp: '11/27', cvc: '000', type: 'fail', note: 'Incorrect CVC check' },
];

export const PaymentSimulatorTab: React.FC<PaymentSimulatorTabProps> = ({
  manualSecretKey,
  onDispatchReceiptModal,
  isGmailConnected,
  lang = 'bn',
}) => {
  const [amount, setAmount] = useState<number>(25);
  const [currency, setCurrency] = useState<string>('usd');
  const [customerEmail, setCustomerEmail] = useState<string>('customer@example.com');
  const [description, setDescription] = useState<string>('Premium Pro Subscription Payment');
  
  // Card Details State
  const [cardNumber, setCardNumber] = useState<string>('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState<string>('12/28');
  const [cardCvc, setCardCvc] = useState<string>('123');
  const [cardName, setCardName] = useState<string>('Rubel Bank User');

  // Simulation State
  const [loading, setLoading] = useState<boolean>(false);
  const [show3dsModal, setShow3dsModal] = useState<boolean>(false);
  const [threeDsCode, setThreeDsCode] = useState<string>('123456');
  const [pendingIntent, setPendingIntent] = useState<any>(null);
  const [result, setResult] = useState<PaymentSimulationResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const applyTestCard = (card: typeof TEST_CARDS[0]) => {
    setCardNumber(card.number);
    setCardExpiry(card.exp);
    setCardCvc(card.cvc);
  };

  const handleSimulatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (manualSecretKey) {
        headers['x-stripe-secret-key'] = manualSecretKey.trim();
      }

      // Step 1: Create Payment Intent on backend
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          amount: Math.round(amount * 100),
          currency,
          description,
          customerEmail,
        }),
      });

      const intentData = await res.json();
      if (!res.ok) {
        throw new Error(intentData.error || 'Payment Intent তৈরি করতে ব্যর্থ হয়েছে');
      }

      // Step 2: Handle Card logic simulation based on test card number
      const sanitizedNum = cardNumber.replace(/\s+/g, '');

      if (sanitizedNum === '4000002760003184') {
        // Requires 3DS
        setPendingIntent(intentData);
        setShow3dsModal(true);
        setLoading(false);
        return;
      }

      if (sanitizedNum === '4000000000009995') {
        setResult({
          paymentIntentId: intentData.paymentIntentId || 'pi_sim_error',
          clientSecret: intentData.clientSecret || '',
          amount: Math.round(amount * 100),
          currency,
          customerEmail,
          description,
          status: 'failed',
          failureReason: 'Your card has insufficient funds. (insufficient_funds)',
          createdAt: new Date().toISOString(),
          isSimulation: intentData.isSimulation,
        });
        setLoading(false);
        return;
      }

      if (sanitizedNum === '4000000000000002') {
        setResult({
          paymentIntentId: intentData.paymentIntentId || 'pi_sim_error',
          clientSecret: intentData.clientSecret || '',
          amount: Math.round(amount * 100),
          currency,
          customerEmail,
          description,
          status: 'failed',
          failureReason: 'Your card was declined. (card_declined)',
          createdAt: new Date().toISOString(),
          isSimulation: intentData.isSimulation,
        });
        setLoading(false);
        return;
      }

      if (sanitizedNum === '4000000000000069') {
        setResult({
          paymentIntentId: intentData.paymentIntentId || 'pi_sim_error',
          clientSecret: intentData.clientSecret || '',
          amount: Math.round(amount * 100),
          currency,
          customerEmail,
          description,
          status: 'failed',
          failureReason: 'Your card has expired. (expired_card)',
          createdAt: new Date().toISOString(),
          isSimulation: intentData.isSimulation,
        });
        setLoading(false);
        return;
      }

      if (sanitizedNum === '4000000000000127') {
        setResult({
          paymentIntentId: intentData.paymentIntentId || 'pi_sim_error',
          clientSecret: intentData.clientSecret || '',
          amount: Math.round(amount * 100),
          currency,
          customerEmail,
          description,
          status: 'failed',
          failureReason: "Your card's security code is incorrect. (incorrect_cvc)",
          createdAt: new Date().toISOString(),
          isSimulation: intentData.isSimulation,
        });
        setLoading(false);
        return;
      }

      // Default: Success!
      setResult({
        paymentIntentId: intentData.paymentIntentId || 'pi_sim_' + Math.random().toString(36).substring(2, 10),
        clientSecret: intentData.clientSecret || '',
        amount: Math.round(amount * 100),
        currency,
        customerEmail,
        description,
        status: 'succeeded',
        createdAt: new Date().toISOString(),
        isSimulation: intentData.isSimulation,
      });
    } catch (err: any) {
      setResult({
        paymentIntentId: 'pi_error',
        clientSecret: '',
        amount: Math.round(amount * 100),
        currency,
        customerEmail,
        description,
        status: 'failed',
        failureReason: err.message,
        createdAt: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleComplete3ds = (success: boolean) => {
    setShow3dsModal(false);
    if (!pendingIntent) return;

    if (success) {
      setResult({
        paymentIntentId: pendingIntent.paymentIntentId,
        clientSecret: pendingIntent.clientSecret,
        amount: Math.round(amount * 100),
        currency,
        customerEmail,
        description,
        status: 'succeeded',
        createdAt: new Date().toISOString(),
        isSimulation: pendingIntent.isSimulation,
      });
    } else {
      setResult({
        paymentIntentId: pendingIntent.paymentIntentId,
        clientSecret: pendingIntent.clientSecret,
        amount: Math.round(amount * 100),
        currency,
        customerEmail,
        description,
        status: 'failed',
        failureReason: '3D Secure authentication failed or was aborted by the user.',
        createdAt: new Date().toISOString(),
        isSimulation: pendingIntent.isSimulation,
      });
    }
    setPendingIntent(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-400" />
            {lang === 'bn' ? 'Stripe Payment Simulator & Intent Studio' : 'Payment Simulator & Intent Studio'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {lang === 'bn'
              ? 'নিরাপদ টেস্ট কার্ড এবং রিয়েল-টাইম PaymentIntent প্রসেসিং সিমুলেশন'
              : 'Simulate payments safely using official Stripe test cards and PaymentIntent flows'}
          </p>
        </div>
      </div>

      {/* Visual Payment Flow Showcase Banner */}
      <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-slate-900/90 via-indigo-950/30 to-slate-900/90 p-4 sm:p-5 flex flex-col md:flex-row items-center gap-5 overflow-hidden relative shadow-lg">
        <div className="flex-1 space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>3D Secure 2 &amp; Biometrics Flow</span>
          </div>
          <h3 className="text-base font-bold text-white">
            {lang === 'bn' ? 'স্মার্ট পেমেন্ট ইন্টেন্ট ও বায়োমেট্রিক সিমুলেশন' : 'Next-Gen PaymentIntent & 3DS2 Simulation'}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
            {lang === 'bn'
              ? 'নিরাপদ Stripe Elements, ওটিপি চ্যালেঞ্জ ও কার্ড ভ্যালিডেশন টেস্ট করুন। টেস্ট কার্ডে ক্লিক করে সরাসরি ফিল্ড পূরণ করুন।'
              : 'Safely test 3DS2 authentication challenges, SCA regulatory mandates, and automated receipt workflows with zero financial risk.'}
          </p>
        </div>

        <div className="w-full md:w-64 h-28 rounded-xl overflow-hidden border border-indigo-500/30 shadow-md relative shrink-0 group">
          <img
            src={paymentFlowDiagram}
            onError={(e) => {
              e.currentTarget.src = '/assets/images/payment_flow_diagram_1790806964488.jpg';
            }}
            alt="Payment Flow Diagram"
            className="w-full h-full object-cover object-center transform group-hover:scale-105 transition duration-500"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />
          <span className="absolute bottom-1.5 left-2 text-[10px] font-mono text-emerald-300 font-semibold bg-slate-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
            ✓ 3DS2 Verified
          </span>
        </div>
      </div>

      {/* Preset Test Cards Quick Selection */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          {lang === 'bn' ? 'কুইক টেস্ট কার্ড সিলেক্টর (১-ক্লিকে পূরণ করুন):' : 'Official Test Card Presets (1-Click Fill):'}
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {TEST_CARDS.map((c) => (
            <button
              key={c.number}
              type="button"
              onClick={() => applyTestCard(c)}
              className={`p-2 rounded-xl text-left border transition text-xs flex flex-col justify-between ${
                cardNumber.replace(/\s+/g, '') === c.number.replace(/\s+/g, '')
                  ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="font-semibold truncate text-[11px]">{c.label.split(' ')[0]}</div>
              <div className="font-mono text-[10px] text-slate-500 mt-1">••• {c.number.slice(-4)}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <form onSubmit={handleSimulatePayment} className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === 'bn' ? 'অ্যামাউন্ট (Amount)' : 'Amount'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-semibold">$</span>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl pl-8 pr-3 py-2 text-sm text-white font-mono focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === 'bn' ? 'কারেন্সি (Currency)' : 'Currency'}
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none uppercase font-semibold"
                >
                  <option value="usd">USD ($)</option>
                  <option value="eur">EUR (€)</option>
                  <option value="gbp">GBP (£)</option>
                  <option value="cad">CAD ($)</option>
                  <option value="bdt">BDT (৳)</option>
                  <option value="jpy">JPY (¥)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {lang === 'bn' ? 'কাস্টমার ইমেইল (রসিদ প্রেরণের জন্য)' : 'Customer Email (For Receipt)'}
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="customer@example.com"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {lang === 'bn' ? 'পেমেন্ট বিবরণ (Description)' : 'Payment Description'}
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>

            {/* Card Inputs */}
            <div className="pt-2 border-t border-slate-800 space-y-3">
              <label className="block text-xs font-semibold text-slate-300">
                {lang === 'bn' ? 'কার্ড তথ্য (Stripe Card Simulation)' : 'Card Information'}
              </label>
              <div>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="4242 4242 4242 4242"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                  placeholder="MM/YY"
                  className="bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none text-center"
                  required
                />
                <input
                  type="text"
                  value={cardCvc}
                  onChange={(e) => setCardCvc(e.target.value)}
                  placeholder="CVC"
                  maxLength={4}
                  className="bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none text-center"
                  required
                />
              </div>

              <div>
                <input
                  type="text"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="Cardholder Name"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {lang === 'bn' ? 'প্রসেসিং হচ্ছে...' : 'Processing Payment...'}
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  {lang === 'bn' ? `পেমেন্ট সম্পন্ন করুন ($${amount} ${currency.toUpperCase()})` : `Simulate Payment ($${amount} ${currency.toUpperCase()})`}
                </>
              )}
            </button>
          </div>
        </form>

        {/* Right Column: Card Visual & Result */}
        <div className="lg:col-span-5 space-y-4">
          {/* Virtual Card Graphic */}
          <div className="relative h-48 rounded-2xl p-6 bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 border border-indigo-500/30 shadow-2xl flex flex-col justify-between overflow-hidden">
            <div className="absolute -right-8 -top-8 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl"></div>
            <div className="flex items-center justify-between z-10">
              <span className="text-xs uppercase font-extrabold tracking-widest text-indigo-300">
                Stripe Test Card
              </span>
              <span className="text-xs font-bold text-white bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700">
                {currency.toUpperCase()}
              </span>
            </div>

            <div className="font-mono text-lg font-bold tracking-wider text-slate-100 z-10 drop-shadow-sm">
              {cardNumber || '•••• •••• •••• ••••'}
            </div>

            <div className="flex items-center justify-between text-xs z-10">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Cardholder</span>
                <span className="font-semibold text-slate-200 truncate max-w-[130px] block">
                  {cardName || 'TEST USER'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Expires</span>
                <span className="font-mono font-semibold text-slate-200">{cardExpiry || 'MM/YY'}</span>
              </div>
            </div>
          </div>

          {/* Payment Result Card */}
          {result && (
            <div
              className={`rounded-2xl border p-5 shadow-xl space-y-3 ${
                result.status === 'succeeded'
                  ? 'bg-emerald-950/20 border-emerald-500/30'
                  : 'bg-rose-950/20 border-rose-500/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {result.status === 'succeeded' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-400" />
                  )}
                  <h4 className="font-bold text-sm text-slate-100">
                    {result.status === 'succeeded'
                      ? lang === 'bn'
                        ? 'পেমেন্ট সফল হয়েছে!'
                        : 'Payment Succeeded!'
                      : lang === 'bn'
                      ? 'পেমেন্ট ব্যর্থ হয়েছে'
                      : 'Payment Failed'}
                  </h4>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    result.status === 'succeeded'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  }`}
                >
                  {result.status.toUpperCase()}
                </span>
              </div>

              {result.failureReason && (
                <div className="text-xs text-rose-300 bg-rose-950/40 p-2.5 rounded-xl border border-rose-500/20">
                  {result.failureReason}
                </div>
              )}

              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between items-center bg-slate-900/60 p-2 rounded-lg">
                  <span className="text-slate-400">Transaction ID:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-slate-200 text-[11px] truncate max-w-[140px]">
                      {result.paymentIntentId}
                    </span>
                    <button
                      onClick={() => copyToClipboard(result.paymentIntentId)}
                      className="p-1 hover:text-white text-slate-400"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between p-2">
                  <span className="text-slate-400">{lang === 'bn' ? 'অ্যামাউন্ট:' : 'Amount:'}</span>
                  <span className="font-bold text-emerald-400">
                    {(result.amount / 100).toFixed(2)} {result.currency.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Action Button: Dispatch Real Gmail Receipt */}
              {result.status === 'succeeded' && (
                <div className="pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() =>
                      onDispatchReceiptModal({
                        recipientEmail: result.customerEmail,
                        customerName: cardName,
                        amount: result.amount,
                        currency: result.currency,
                        paymentIntentId: result.paymentIntentId,
                        description: result.description,
                        status: 'succeeded',
                      })
                    }
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition"
                  >
                    <Mail className="w-4 h-4" />
                    {lang === 'bn'
                      ? 'Gmail দিয়ে অফিশিয়াল রসিদ পাঠান'
                      : 'Send Official Receipt via Gmail'}
                  </button>
                  {!isGmailConnected && (
                    <p className="text-[10px] text-amber-400 mt-1 text-center">
                      * {lang === 'bn' ? 'রসিদ পাঠাতে উপরে Gmail সাইন-ইন করে নিন' : 'Sign in with Google above to send real receipts'}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3D Secure Simulation Modal */}
      {show3dsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">3D Secure 2.0 Challenge</h3>
              <p className="text-xs text-slate-400 mt-1">
                {lang === 'bn'
                  ? 'আপনার ব্যাংক থেকে ওটিপি কোড দিয়ে পেমেন্ট অনুমোদন করুন'
                  : 'Simulating 3D Secure authentication flow'}
              </p>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">One-Time Password (OTP)</span>
              <input
                type="text"
                value={threeDsCode}
                onChange={(e) => setThreeDsCode(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 text-center font-mono text-lg font-bold text-indigo-300 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleComplete3ds(false)}
                className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-rose-300"
              >
                {lang === 'bn' ? 'প্রত্যাখ্যান করুন' : 'Fail / Decline'}
              </button>
              <button
                type="button"
                onClick={() => handleComplete3ds(true)}
                className="py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-md shadow-emerald-700/30"
              >
                {lang === 'bn' ? 'অনুমোদন দিন' : 'Authorize (Success)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
