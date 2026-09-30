import React from 'react';
import { Mail, AlertCircle, ShieldAlert, X } from 'lucide-react';
import { PaymentReceiptEmailData } from '../services/gmail';

interface ConfirmEmailModalProps {
  isOpen: boolean;
  data: PaymentReceiptEmailData | null;
  onConfirm: () => void;
  onCancel: () => void;
  isSending: boolean;
  lang?: 'bn' | 'en';
}

export const ConfirmEmailModal: React.FC<ConfirmEmailModalProps> = ({
  isOpen,
  data,
  onConfirm,
  onCancel,
  isSending,
  lang = 'bn',
}) => {
  if (!isOpen || !data) return null;

  const formattedAmount = (data.amount / (data.currency.toUpperCase() === 'JPY' ? 1 : 100)).toFixed(2);
  const cur = data.currency.toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl shadow-indigo-950/50 space-y-4 text-left">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-indigo-400">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-lg">
                {lang === 'bn' ? 'Gmail ইমেইল নিশ্চিতকরণ' : 'Confirm Gmail Dispatch'}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'bn'
                  ? 'আপনার অনুমতি নিয়ে Gmail দ্বারা রসিদ প্রেরণ করা হবে'
                  : 'Sending receipt using your Gmail account with your explicit permission'}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isSending}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3 flex gap-3 text-xs text-amber-200">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block mb-0.5">
              {lang === 'bn' ? 'অনুমতি এবং সুরক্ষা বার্তা' : 'Permission & Safety Notice'}
            </span>
            {lang === 'bn'
              ? 'এই অ্যাকশনটি আপনার সংযুক্ত Gmail অ্যাকাউন্টের মাধ্যমে প্রাপকের কাছে একটি অফিসিয়াল পেমেন্ট কনফার্মেশন ইমেইল পাঠাবে।'
              : 'This action will dispatch an official payment confirmation email to the recipient using your linked Gmail account.'}
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2.5 text-xs">
          <div className="flex justify-between border-b border-slate-800/80 pb-2">
            <span className="text-slate-400">{lang === 'bn' ? 'প্রাপকের ইমেইল:' : 'Recipient Email:'}</span>
            <span className="font-medium text-slate-100 select-all font-mono">{data.recipientEmail}</span>
          </div>
          <div className="flex justify-between border-b border-slate-800/80 pb-2">
            <span className="text-slate-400">{lang === 'bn' ? 'পেমেন্ট অ্যামাউন্ট:' : 'Payment Amount:'}</span>
            <span className="font-bold text-emerald-400">{formattedAmount} {cur}</span>
          </div>
          <div className="flex justify-between border-b border-slate-800/80 pb-2">
            <span className="text-slate-400">{lang === 'bn' ? 'ট্রানজ্যাকশন আইডি:' : 'Transaction ID:'}</span>
            <span className="font-mono text-slate-300">{data.paymentIntentId}</span>
          </div>
          {data.planName && (
            <div className="flex justify-between border-b border-slate-800/80 pb-2">
              <span className="text-slate-400">{lang === 'bn' ? 'প্ল্যান বা আইটেম:' : 'Plan / Item:'}</span>
              <span className="text-indigo-300 font-semibold">{data.planName}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-400">{lang === 'bn' ? 'ইমেইল সাবজেক্ট:' : 'Email Subject:'}</span>
            <span className="text-slate-300 truncate max-w-[260px]">
              Receipt for payment of {formattedAmount} {cur}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSending}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            {lang === 'bn' ? 'বাতিল করুন' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSending}
            className="px-5 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition"
          >
            {isSending ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>{lang === 'bn' ? 'পাঠানো হচ্ছে...' : 'Sending...'}</span>
              </>
            ) : (
              <>
                <Mail className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'হ্যাঁ, ইমেইল পাঠান' : 'Yes, Send Email'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
