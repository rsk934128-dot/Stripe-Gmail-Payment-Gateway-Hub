import { PaymentReceiptEmailData } from './gmail';

export interface ReceiptTemplate {
  subject: string;
  headerTitle: string;
  messageBody: string;
  footerText: string;
}

export const TEMPLATE_STORAGE_KEY = 'stripe_hub_receipt_template_v1';

export const DEFAULT_RECEIPT_TEMPLATE: ReceiptTemplate = {
  subject: 'Receipt for payment of {amount} {currency} - {customerName} [{paymentIntentId}]',
  headerTitle: 'Official Payment Receipt',
  messageBody: `Dear {customerName},

Thank you for your business! Your payment of {amount} {currency} has been successfully processed and verified.

Here is a summary of your transaction:
• Transaction ID: {paymentIntentId}
• Product / Service: {description}
• Date & Time: {date}
• Account: {recipientEmail}

Keep this receipt for your records. If you have any billing inquiries or need assistance, simply reply directly to this email.`,
  footerText: 'Processed securely via Stripe & Gmail Payment Gateway Hub. Keep this email for your records.',
};

export const TEMPLATE_PRESETS: { id: string; name: string; nameBn: string; template: ReceiptTemplate }[] = [
  {
    id: 'default',
    name: 'Standard Business',
    nameBn: 'স্ট্যান্ডার্ড বিজনেস',
    template: DEFAULT_RECEIPT_TEMPLATE,
  },
  {
    id: 'minimal',
    name: 'Minimal & Clean',
    nameBn: 'মিনিমাল ও ক্লিন',
    template: {
      subject: 'Payment Confirmation: {amount} {currency} ({paymentIntentId})',
      headerTitle: 'Payment Received',
      messageBody: `Hello {customerName},

We received your payment of {amount} {currency}.

Transaction ID: {paymentIntentId}
Date: {date}
Item: {description}

Thank you for choosing our service!`,
      footerText: 'Thank you for your purchase. Stripe Gateway Verified.',
    },
  },
  {
    id: 'bangla',
    name: 'Bangla / বাংলা রশিদ',
    nameBn: 'বাংলা অফিসিয়াল রশিদ',
    template: {
      subject: '{customerName}-এর পেমেন্ট রসিদ: {amount} {currency} [{paymentIntentId}]',
      headerTitle: 'পেমেন্ট গ্রহণের অফিসিয়াল রসিদ',
      messageBody: `সম্মানিত {customerName},

আপনার {amount} {currency} টাকার পেমেন্ট সফলভাবে সম্পন্ন হয়েছে।

লেনদেনের তথ্য:
• ট্রানজ্যাকশন আইডি: {paymentIntentId}
• বিবরণ: {description}
• তারিখ: {date}
• গ্রাহকের ইমেইল: {recipientEmail}

আমাদের সাথে থাকার জন্য ধন্যবাদ! কোনো তথ্য জানার থাকলে এই ইমেইলে উত্তর দিন।`,
      footerText: 'Stripe ও Gmail গেটওয়ে হাব দ্বারা সুরক্ষিতভাবে প্রসেসকৃত। হিসাব সংরক্ষণের জন্য এটি নিরাপদে রাখুন।',
    },
  },
  {
    id: 'saas',
    name: 'SaaS / Subscription Pro',
    nameBn: 'সাবস্ক্রিপশন ও সফটওয়্যার',
    template: {
      subject: 'Your {description} subscription is active ({amount} {currency})',
      headerTitle: 'Subscription Invoice & Receipt',
      messageBody: `Hi {customerName},

Your subscription payment of {amount} {currency} has been approved. Your Pro features are now fully unlocked.

Subscription Details:
• Plan: {planName}
• Invoice Reference: {paymentIntentId}
• Billing Account: {recipientEmail}
• Renewal Date: {date}

You can manage your billing preferences anytime from your customer portal.`,
      footerText: 'Powered by Stripe Billing Engine. Instant account activation.',
    },
  },
];

export const AVAILABLE_PLACEHOLDERS = [
  { tag: '{customerName}', desc: 'Customer full name (e.g. John Doe)', descBn: 'গ্রাহকের পুরো নাম' },
  { tag: '{amount}', desc: 'Formatted amount (e.g. 49.00)', descBn: 'পেমেন্ট অ্যামাউন্ট' },
  { tag: '{currency}', desc: 'Currency code (e.g. USD)', descBn: 'কারেন্সি কোড' },
  { tag: '{recipientEmail}', desc: 'Customer email address', descBn: 'গ্রাহকের ইমেইল' },
  { tag: '{paymentIntentId}', desc: 'Stripe transaction ID', descBn: 'Stripe ট্রানজ্যাকশন আইডি' },
  { tag: '{description}', desc: 'Product / service description', descBn: 'সার্ভিস বা প্রোডাক্ট বিবরণ' },
  { tag: '{date}', desc: 'Transaction date & time', descBn: 'লেনদেনের তারিখ ও সময়' },
  { tag: '{planName}', desc: 'Plan name or product item', descBn: 'প্ল্যান বা প্রোডাক্টের নাম' },
];

/**
 * Retrieve saved template from localStorage with fallback to default
 */
export function getSavedReceiptTemplate(): ReceiptTemplate {
  if (typeof window === 'undefined') return DEFAULT_RECEIPT_TEMPLATE;
  try {
    const raw = localStorage.getItem(TEMPLATE_STORAGE_KEY);
    if (!raw) return DEFAULT_RECEIPT_TEMPLATE;
    const parsed = JSON.parse(raw);
    return {
      subject: parsed.subject || DEFAULT_RECEIPT_TEMPLATE.subject,
      headerTitle: parsed.headerTitle || DEFAULT_RECEIPT_TEMPLATE.headerTitle,
      messageBody: parsed.messageBody || DEFAULT_RECEIPT_TEMPLATE.messageBody,
      footerText: parsed.footerText || DEFAULT_RECEIPT_TEMPLATE.footerText,
    };
  } catch (_e) {
    return DEFAULT_RECEIPT_TEMPLATE;
  }
}

/**
 * Save customized template to localStorage
 */
export function saveReceiptTemplate(template: ReceiptTemplate): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(template));
  } catch (err) {
    console.warn('Failed to save receipt template:', err);
  }
}

/**
 * Reset template to default
 */
export function resetReceiptTemplate(): ReceiptTemplate {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(TEMPLATE_STORAGE_KEY);
    } catch (_e) {}
  }
  return DEFAULT_RECEIPT_TEMPLATE;
}

/**
 * Replace all placeholders in a template string with actual payment data values
 */
export function interpolateVariables(templateStr: string, data: PaymentReceiptEmailData): string {
  if (!templateStr) return '';

  const formattedAmount = (data.amount / (data.currency.toUpperCase() === 'JPY' ? 1 : 100)).toFixed(2);
  const cur = data.currency.toUpperCase();
  const dateStr =
    data.date ||
    new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const replacements: Record<string, string> = {
    '{customerName}': data.customerName || 'Valued Customer',
    '{amount}': formattedAmount,
    '{currency}': cur,
    '{recipientEmail}': data.recipientEmail || 'customer@example.com',
    '{paymentIntentId}': data.paymentIntentId || 'pi_test',
    '{description}': data.description || 'Stripe Gateway Payment',
    '{date}': dateStr,
    '{planName}': data.planName || data.description || 'Premium Service',
  };

  let result = templateStr;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.split(key).join(value);
  }

  return result;
}

/**
 * Renders complete HTML email document based on a template and payment data
 */
export function renderTemplateToHtml(template: ReceiptTemplate, data: PaymentReceiptEmailData): string {
  const interpolatedHeader = interpolateVariables(template.headerTitle || 'Official Payment Receipt', data);
  const interpolatedBody = interpolateVariables(template.messageBody, data);
  const interpolatedFooter = interpolateVariables(template.footerText, data);

  const formattedAmount = (data.amount / (data.currency.toUpperCase() === 'JPY' ? 1 : 100)).toFixed(2);
  const cur = data.currency.toUpperCase();
  const dateStr =
    data.date ||
    new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  // Convert plain text body newlines into paragraphs or line breaks safely
  const formattedBodyHtml = interpolatedBody
    .split('\n\n')
    .map((paragraph) => `<p style="margin: 0 0 14px 0; line-height: 1.6;">${paragraph.replace(/\n/g, '<br/>')}</p>`)
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${interpolatedHeader}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }
    .card { max-width: 580px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.4); }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
    .content { padding: 32px 24px; }
    .badge { display: inline-block; padding: 4px 14px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; background-color: #10b981; color: #ffffff; }
    .amount-box { margin: 20px 0; padding: 20px; background-color: #0f172a; border-radius: 12px; border: 1px solid #334155; text-align: center; }
    .amount { font-size: 36px; font-weight: 800; color: #38bdf8; margin: 6px 0; }
    .custom-message { background-color: #0f172a/70; border-left: 4px solid #6366f1; padding: 16px 18px; margin: 20px 0; border-radius: 0 12px 12px 0; font-size: 14px; color: #e2e8f0; }
    .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #334155; font-size: 13px; }
    .label { color: #94a3b8; }
    .val { font-weight: 600; color: #f1f5f9; text-align: right; word-break: break-all; }
    .footer { padding: 20px; background-color: #0f172a; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #334155; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em;">${interpolatedHeader}</h1>
      <p style="margin: 6px 0 0; opacity: 0.9; font-size: 13px;">Official Payment Confirmation &amp; Tax Receipt</p>
    </div>
    <div class="content">
      <div style="text-align: center; margin-bottom: 16px;">
        <span class="badge">Payment ${data.status ? data.status.toUpperCase() : 'SUCCEEDED'}</span>
      </div>

      <div class="amount-box">
        <div style="font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">Total Amount Paid</div>
        <div class="amount">${formattedAmount} ${cur}</div>
        <div style="font-size: 12px; color: #10b981;">✓ Processed securely via Stripe Gateway</div>
      </div>

      <!-- Personalized Customer Message -->
      <div class="custom-message">
        ${formattedBodyHtml}
      </div>

      <!-- Verified Transaction Meta Table -->
      <div style="margin-top: 22px;">
        <div class="row">
          <span class="label">Transaction ID</span>
          <span class="val" style="font-family: monospace; color: #818cf8;">${data.paymentIntentId}</span>
        </div>
        <div class="row">
          <span class="label">Customer Name</span>
          <span class="val">${data.customerName || 'Valued Customer'}</span>
        </div>
        <div class="row">
          <span class="label">Customer Email</span>
          <span class="val">${data.recipientEmail}</span>
        </div>
        ${data.description ? `
        <div class="row">
          <span class="label">Description</span>
          <span class="val">${data.description}</span>
        </div>` : ''}
        ${data.planName ? `
        <div class="row">
          <span class="label">Plan / Item</span>
          <span class="val">${data.planName}</span>
        </div>` : ''}
        <div class="row">
          <span class="label">Payment Method</span>
          <span class="val">${data.paymentMethod || 'Credit / Debit Card (Stripe Elements)'}</span>
        </div>
        <div class="row" style="border-bottom: none;">
          <span class="label">Date &amp; Time</span>
          <span class="val">${dateStr}</span>
        </div>
      </div>
    </div>
    <div class="footer">
      ${interpolatedFooter}<br/>
      Payment verified by Stripe API &amp; Google Workspace Gmail Services.
    </div>
  </div>
</body>
</html>`;
}
