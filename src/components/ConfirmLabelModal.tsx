import React from 'react';
import { Tag, ShieldAlert, X, CheckCircle2 } from 'lucide-react';

interface ConfirmLabelModalProps {
  isOpen: boolean;
  actionType: 'create_label' | 'organize_receipts';
  labelName: string;
  affectedCount?: number;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing: boolean;
  lang?: 'bn' | 'en';
}

export const ConfirmLabelModal: React.FC<ConfirmLabelModalProps> = ({
  isOpen,
  actionType,
  labelName,
  affectedCount = 0,
  onConfirm,
  onCancel,
  isProcessing,
  lang = 'bn',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full p-6 shadow-2xl shadow-indigo-950/50 space-y-4 text-left">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-indigo-400">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <Tag className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">
                {actionType === 'create_label'
                  ? lang === 'bn'
                    ? "Gmail-এ 'Payments' লেবেল তৈরি নিশ্চিতকরণ"
                    : "Confirm Creating 'Payments' Label"
                  : lang === 'bn'
                  ? "রসিদসমূহ 'Payments' লেবেলে সংযুক্তিকরণ"
                  : "Organize Receipts into 'Payments' Label"}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'bn'
                  ? 'আপনার অনুমতি নিয়ে Gmail ইনবক্স পরিবর্তন করা হবে'
                  : "Modifying Gmail inbox settings with your explicit permission"}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-xl p-3 flex gap-3 text-xs text-indigo-200">
          <ShieldAlert className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block mb-0.5">
              {lang === 'bn' ? 'অনুমতি বিজ্ঞপ্তি (Permission Notice)' : 'Workspace Permission Notice'}
            </span>
            {actionType === 'create_label'
              ? lang === 'bn'
                ? `এই অ্যাকশনটি আপনার সংযুক্ত Gmail অ্যাকাউন্টে '${labelName}' নামের একটি নতুন লেবেল/ফোল্ডার তৈরি করবে।`
                : `This action will create a new label named '${labelName}' in your authenticated Gmail inbox.`
              : lang === 'bn'
                ? `এই অ্যাকশনটি আপনার ইনবক্সের ${affectedCount}টি পেমেন্ট ও রসিদ সংক্রান্ত ইমেইলে '${labelName}' লেবেল যুক্ত করবে।`
                : `This action will attach the '${labelName}' label to ${affectedCount} detected payment/receipt message(s).`}
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2 text-xs">
          <div className="flex justify-between border-b border-slate-800/80 pb-2">
            <span className="text-slate-400">{lang === 'bn' ? 'অ্যাকশন:' : 'Action:'}</span>
            <span className="font-bold text-slate-200">
              {actionType === 'create_label' ? 'Create Custom Label' : 'Tag & Organize Messages'}
            </span>
          </div>
          <div className="flex justify-between border-b border-slate-800/80 pb-2">
            <span className="text-slate-400">{lang === 'bn' ? 'লেবেলের নাম:' : 'Target Label:'}</span>
            <span className="font-mono font-semibold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
              {labelName}
            </span>
          </div>
          {actionType === 'organize_receipts' && (
            <div className="flex justify-between">
              <span className="text-slate-400">{lang === 'bn' ? 'প্রভাবিত ইমেইল সংখ্যা:' : 'Affected Emails:'}</span>
              <span className="font-bold text-indigo-300">{affectedCount} Messages</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            {lang === 'bn' ? 'বাতিল করুন' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className="px-5 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition"
          >
            {isProcessing ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>{lang === 'bn' ? 'প্রসেসিং হচ্ছে...' : 'Processing...'}</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'হ্যাঁ, নিশ্চিত করুন' : 'Yes, Confirm'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
