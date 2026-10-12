import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Save,
  RotateCcw,
  Sparkles,
  Eye,
  Send,
  Check,
  Copy,
  Info,
  HelpCircle,
  Tag,
  Palette,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Mail,
  Smartphone,
  Monitor,
  Plus,
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  ReceiptTemplate,
  DEFAULT_RECEIPT_TEMPLATE,
  TEMPLATE_PRESETS,
  AVAILABLE_PLACEHOLDERS,
  getSavedReceiptTemplate,
  saveReceiptTemplate,
  resetReceiptTemplate,
  interpolateVariables,
  renderTemplateToHtml,
} from '../services/receiptTemplate';
import { PaymentReceiptEmailData, sendGmailReceipt } from '../services/gmail';

interface ReceiptTemplateCustomizerProps {
  user: FirebaseUser | null;
  lang?: 'bn' | 'en';
  onTemplateSaved?: () => void;
}

export const ReceiptTemplateCustomizer: React.FC<ReceiptTemplateCustomizerProps> = ({
  user,
  lang = 'bn',
  onTemplateSaved,
}) => {
  const [template, setTemplate] = useState<ReceiptTemplate>(getSavedReceiptTemplate());
  const [activePreset, setActivePreset] = useState<string>('default');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [copiedTag, setCopiedTag] = useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [previewTab, setPreviewTab] = useState<'visual' | 'html'>('visual');
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);
  const [testSendStatus, setTestSendStatus] = useState<{ success: boolean; msg: string } | null>(null);

  // Active input ref tracking for inserting placeholders at cursor
  const [lastFocusedField, setLastFocusedField] = useState<'subject' | 'headerTitle' | 'messageBody' | 'footerText'>('messageBody');
  const subjectInputRef = useRef<HTMLInputElement>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const footerInputRef = useRef<HTMLInputElement>(null);

  // Sample data used for real-time live preview
  const [sampleData, setSampleData] = useState<PaymentReceiptEmailData>({
    recipientEmail: user?.email || 'customer@example.com',
    customerName: user?.displayName || 'Rubel Bank User',
    amount: 4900,
    currency: 'usd',
    paymentIntentId: 'pi_3MzxS94K9kL0s8_succ',
    description: 'Pro Developer Plan Subscription',
    planName: 'Cloud Gateway Pro (Monthly)',
    paymentMethod: 'Visa ending in 4242',
    date: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    status: 'succeeded',
  });

  useEffect(() => {
    setTemplate(getSavedReceiptTemplate());
  }, []);

  const handleFieldChange = (field: keyof ReceiptTemplate, value: string) => {
    setTemplate((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleApplyPreset = (presetId: string) => {
    const found = TEMPLATE_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setActivePreset(presetId);
      setTemplate({ ...found.template });
      setSavedSuccess(false);
    }
  };

  const handleSave = () => {
    saveReceiptTemplate(template);
    setSavedSuccess(true);
    if (onTemplateSaved) onTemplateSaved();
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleReset = () => {
    const defaultTpl = resetReceiptTemplate();
    setTemplate(defaultTpl);
    setActivePreset('default');
    setSavedSuccess(true);
    if (onTemplateSaved) onTemplateSaved();
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleInsertPlaceholder = (placeholderTag: string) => {
    if (lastFocusedField === 'subject') {
      const input = subjectInputRef.current;
      if (input) {
        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;
        const val = template.subject;
        const newVal = val.substring(0, start) + placeholderTag + val.substring(end);
        handleFieldChange('subject', newVal);
        setTimeout(() => {
          input.focus();
          input.setSelectionRange(start + placeholderTag.length, start + placeholderTag.length);
        }, 10);
      } else {
        handleFieldChange('subject', template.subject + ' ' + placeholderTag);
      }
    } else if (lastFocusedField === 'messageBody') {
      const textarea = bodyTextareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart || 0;
        const end = textarea.selectionEnd || 0;
        const val = template.messageBody;
        const newVal = val.substring(0, start) + placeholderTag + val.substring(end);
        handleFieldChange('messageBody', newVal);
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + placeholderTag.length, start + placeholderTag.length);
        }, 10);
      } else {
        handleFieldChange('messageBody', template.messageBody + '\n' + placeholderTag);
      }
    } else if (lastFocusedField === 'headerTitle') {
      handleFieldChange('headerTitle', template.headerTitle + ' ' + placeholderTag);
    } else if (lastFocusedField === 'footerText') {
      handleFieldChange('footerText', template.footerText + ' ' + placeholderTag);
    }

    // Flash copied indicator
    setCopiedTag(placeholderTag);
    setTimeout(() => setCopiedTag(null), 1500);
  };

  const handleSendTestEmail = async () => {
    if (!user) {
      setTestSendStatus({
        success: false,
        msg: lang === 'bn' ? 'টেস্ট ইমেইল পাঠাতে প্রথমে Google দিয়ে সাইন ইন করুন।' : 'Please sign in with Google to send a test email.',
      });
      return;
    }

    setIsSendingTest(true);
    setTestSendStatus(null);

    try {
      const targetEmail = user.email || sampleData.recipientEmail;
      await sendGmailReceipt({
        ...sampleData,
        recipientEmail: targetEmail,
        templateOverride: template,
      });

      setTestSendStatus({
        success: true,
        msg:
          lang === 'bn'
            ? `টেস্ট রসিদ সফলভাবে ${targetEmail}-এ পাঠানো হয়েছে!`
            : `Test receipt successfully dispatched to ${targetEmail}!`,
      });
    } catch (err: any) {
      setTestSendStatus({
        success: false,
        msg: err.message || (lang === 'bn' ? 'টেস্ট ইমেইল পাঠাতে ব্যর্থ হয়েছে' : 'Failed to send test email'),
      });
    } finally {
      setIsSendingTest(false);
      setTimeout(() => setTestSendStatus(null), 7000);
    }
  };

  const previewSubject = interpolateVariables(template.subject, sampleData);
  const previewHtml = renderTemplateToHtml(template, sampleData);

  return (
    <div className="space-y-6 text-left">
      {/* Notification Toast */}
      {savedSuccess && (
        <div className="bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xl animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              {lang === 'bn'
                ? 'টেমপ্লেট সফলভাবে সংরক্ষিত হয়েছে! এখন থেকে এই ফরম্যাটেই প্রতিটি পেমেন্ট রসিদ পাঠানো হবে।'
                : 'Template saved successfully! All payment receipts will now be dispatched using this custom template.'}
            </span>
          </div>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
            Active
          </span>
        </div>
      )}

      {testSendStatus && (
        <div
          className={`border px-4 py-3 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xl animate-in fade-in duration-200 ${
            testSendStatus.success
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500/40 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {testSendStatus.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{testSendStatus.msg}</span>
          </div>
        </div>
      )}

      {/* Preset Toolbar & Quick Actions */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-slate-100 text-sm">
              {lang === 'bn' ? 'টেমপ্লেট প্রিসেট (Presets)' : 'Template Presets'}
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            {lang === 'bn'
              ? 'তৈরি করা যেকোনো প্রিসেট বেছে নিন বা নিজের মতো এডিট করে কাস্টমাইজ করুন'
              : 'Choose a pre-designed layout or customize subject & body to fit your brand'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {TEMPLATE_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleApplyPreset(p.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                activePreset === p.id
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-950/50'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
              }`}
            >
              {lang === 'bn' ? p.nameBn : p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main 2-Column Workspace: Left Editor, Right Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Template Editor Form (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Placeholders Toolbar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-indigo-400" />
                {lang === 'bn' ? 'ব্যবহারযোগ্য ভেরিয়েবলসমূহ (Click to insert):' : 'Available Placeholders (Click to insert):'}
              </span>
              <span className="text-[11px] text-slate-400">
                {lang === 'bn' ? 'কার্সরে যোগ করতে চাপুন' : 'Click to insert into field'}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_PLACEHOLDERS.map((item) => (
                <button
                  key={item.tag}
                  type="button"
                  onClick={() => handleInsertPlaceholder(item.tag)}
                  title={lang === 'bn' ? item.descBn : item.desc}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500 hover:bg-indigo-950/30 text-indigo-300 font-mono text-[11px] flex items-center gap-1 transition cursor-pointer group"
                >
                  <span>{item.tag}</span>
                  {copiedTag === item.tag ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Plus className="w-3 h-3 text-slate-500 group-hover:text-indigo-400" />
                  )}
                </button>
              ))}
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
              <Info className="w-3 h-3 text-indigo-400 shrink-0" />
              <span>
                {lang === 'bn'
                  ? 'ইমেইল পাঠানোর সময় এই ট্যাগগুলো আসল গ্রাহকের নাম, টাকার পরিমাণ এবং ট্রানজ্যাকশন আইডি দ্বারা প্রতিস্থাপিত হবে।'
                  : 'Placeholders are automatically replaced with real customer details and payment amounts when sending.'}
              </span>
            </div>
          </div>

          {/* Form Fields Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            {/* Subject Template */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-red-400" />
                  {lang === 'bn' ? 'ইমেইল সাবজেক্ট টেমপ্লেট (Email Subject Template)' : 'Email Subject Template'}
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {lang === 'bn' ? 'যেমন: {amount} {customerName}' : 'supports variables'}
                </span>
              </div>
              <input
                ref={subjectInputRef}
                type="text"
                value={template.subject}
                onFocus={() => setLastFocusedField('subject')}
                onChange={(e) => handleFieldChange('subject', e.target.value)}
                placeholder="Receipt for payment of {amount} {currency} - {customerName}"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none font-mono"
              />
            </div>

            {/* Header Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                {lang === 'bn' ? 'রসিদের শিরোনাম (Receipt Banner Title)' : 'Receipt Header Title'}
              </label>
              <input
                ref={headerInputRef}
                type="text"
                value={template.headerTitle}
                onFocus={() => setLastFocusedField('headerTitle')}
                onChange={(e) => handleFieldChange('headerTitle', e.target.value)}
                placeholder="Official Payment Receipt"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none"
              />
            </div>

            {/* Message Body Template */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  {lang === 'bn' ? 'রসিদের মূল বার্তা (Email Body Template)' : 'Email Body Message Template'}
                </label>
                <span className="text-[10px] text-slate-400">
                  {lang === 'bn' ? 'প্যারাগ্রাফ ও তালিকা সাপোর্ট করে' : 'Plain text & Line breaks'}
                </span>
              </div>
              <textarea
                ref={bodyTextareaRef}
                rows={9}
                value={template.messageBody}
                onFocus={() => setLastFocusedField('messageBody')}
                onChange={(e) => handleFieldChange('messageBody', e.target.value)}
                placeholder="Dear {customerName},\n\nThank you for your payment of {amount} {currency}..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-3.5 text-xs text-white focus:outline-none font-sans leading-relaxed resize-y"
              />
            </div>

            {/* Footer Text */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                {lang === 'bn' ? 'ফুটার নোট (Receipt Footer Text)' : 'Receipt Footer Notice'}
              </label>
              <input
                ref={footerInputRef}
                type="text"
                value={template.footerText}
                onFocus={() => setLastFocusedField('footerText')}
                onChange={(e) => handleFieldChange('footerText', e.target.value)}
                placeholder="Processed securely via Stripe Gateway. Keep for accounting."
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            {/* Action Buttons: Save & Reset */}
            <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>{lang === 'bn' ? 'ডিফল্ট টেমপ্লেটে রিসেট' : 'Reset to Default'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={isSendingTest || !user}
                  title={!user ? (lang === 'bn' ? 'প্রথমে সাইন ইন করুন' : 'Sign in to send test') : ''}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                >
                  {isSendingTest ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>{lang === 'bn' ? 'পাঠানো হচ্ছে...' : 'Sending Test...'}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{lang === 'bn' ? 'টেস্ট রসিদ পাঠান' : 'Send Test Receipt'}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'টেমপ্লেট সংরক্ষণ করুন (Save)' : 'Save Template'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Email Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-slate-200 text-sm">
                  {lang === 'bn' ? 'লাইভ প্রিভিউ (Live Preview)' : 'Real-time Live Preview'}
                </h3>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    previewDevice === 'desktop' ? 'bg-slate-800 text-indigo-300' : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title="Desktop View"
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    previewDevice === 'mobile' ? 'bg-slate-800 text-indigo-300' : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title="Mobile View"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Subject Line Pill */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                {lang === 'bn' ? 'গ্রাহক যে সাবজেক্ট দেখতে পাবে (Subject Line):' : 'Recipient Subject Line:'}
              </span>
              <p className="text-xs font-semibold text-slate-100 font-mono truncate" title={previewSubject}>
                {previewSubject || 'No Subject'}
              </p>
            </div>

            {/* Email Canvas Preview */}
            <div
              className={`rounded-2xl border border-slate-800 bg-[#0f172a] overflow-hidden shadow-2xl transition-all duration-300 ${
                previewDevice === 'mobile' ? 'max-w-[320px] mx-auto text-[11px]' : 'w-full'
              }`}
            >
              {/* Fake Email Client Header */}
              <div className="bg-slate-950 px-3 py-2 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full bg-red-400"></span>
                  <span className="font-semibold text-slate-300 truncate">Gmail Inbox Simulation</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Just now</span>
              </div>

              {/* Rendered Template Card */}
              <div className="p-3 sm:p-4 max-h-[500px] overflow-y-auto space-y-3">
                {/* Header Banner */}
                <div className="rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-4 text-center text-white shadow-md">
                  <h4 className="font-bold text-sm leading-tight">
                    {interpolateVariables(template.headerTitle, sampleData)}
                  </h4>
                  <p className="text-[10px] opacity-90 mt-0.5">Official Payment Confirmation &amp; Tax Receipt</p>
                </div>

                {/* Status Badge */}
                <div className="text-center">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Payment Succeeded
                  </span>
                </div>

                {/* Amount Box */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Amount Paid</span>
                  <span className="text-xl font-extrabold text-sky-400 font-mono block">
                    {(sampleData.amount / 100).toFixed(2)} {sampleData.currency.toUpperCase()}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium block">✓ Verified via Stripe</span>
                </div>

                {/* Customer Message Box */}
                <div className="bg-slate-900/80 border-l-3 border-indigo-500 rounded-r-xl p-3 text-xs text-slate-200 leading-relaxed space-y-2 whitespace-pre-line font-sans">
                  {interpolateVariables(template.messageBody, sampleData)}
                </div>

                {/* Meta details list */}
                <div className="bg-slate-900/50 rounded-xl p-2.5 border border-slate-800/80 space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-slate-400">
                    <span>Transaction ID:</span>
                    <span className="font-mono text-slate-200 truncate max-w-[130px]">{sampleData.paymentIntentId}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Customer:</span>
                    <span className="text-slate-200">{sampleData.customerName}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Email:</span>
                    <span className="text-slate-200 truncate max-w-[140px]">{sampleData.recipientEmail}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Date:</span>
                    <span className="text-slate-300">{sampleData.date}</span>
                  </div>
                </div>

                {/* Footer text */}
                <div className="text-[10px] text-slate-500 text-center leading-relaxed pt-2 border-t border-slate-800/80">
                  {interpolateVariables(template.footerText, sampleData)}
                </div>
              </div>
            </div>

            {/* Quick Sample Data Switcher */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 block">
                {lang === 'bn' ? 'প্রিভিউ টেস্ট ডাটা পরিবর্তন (Customize Sample Data):' : 'Customize Preview Sample Values:'}
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-500 block">Name</label>
                  <input
                    type="text"
                    value={sampleData.customerName}
                    onChange={(e) => setSampleData((prev) => ({ ...prev, customerName: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 text-[11px]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block">Amount ($)</label>
                  <input
                    type="number"
                    value={sampleData.amount / 100}
                    onChange={(e) => setSampleData((prev) => ({ ...prev, amount: Number(e.target.value) * 100 }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 text-[11px] font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
