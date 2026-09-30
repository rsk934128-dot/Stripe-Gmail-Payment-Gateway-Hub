import { getAccessToken } from '../firebase';

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  snippet?: string;
  subject?: string;
  from?: string;
  to?: string;
  date?: string;
  labelIds?: string[];
  isStripeReceipt?: boolean;
  stripeHeaders?: {
    stripeAccount?: string;
    stripeEvent?: string;
    messageId?: string;
    feedbackId?: string;
  };
}

export interface GmailLabel {
  id: string;
  name: string;
  type?: string;
  messagesTotal?: number;
  messagesUnread?: number;
  color?: {
    textColor?: string;
    backgroundColor?: string;
  };
}

export interface PaymentReceiptEmailData {
  recipientEmail: string;
  customerName?: string;
  amount: number;
  currency: string;
  paymentIntentId: string;
  description?: string;
  paymentMethod?: string;
  date?: string;
  planName?: string;
  status: string;
}

/**
 * Encodes a string to RFC 4648 Base64URL
 */
function base64UrlEncode(str: string): string {
  // UTF-8 safe base64 encoding
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Creates professional HTML email template for Stripe Payment Receipt
 */
export function generateReceiptHtml(data: PaymentReceiptEmailData): string {
  const formattedAmount = (data.amount / (data.currency.toUpperCase() === 'JPY' ? 1 : 100)).toFixed(2);
  const cur = data.currency.toUpperCase();
  const dateStr = data.date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }
    .card { max-width: 580px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.4); }
    .header { background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
    .content { padding: 32px 24px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; background-color: #10b981; color: #ffffff; }
    .amount-box { margin: 24px 0; padding: 20px; background-color: #0f172a; border-radius: 12px; border: 1px solid #334155; text-align: center; }
    .amount { font-size: 36px; font-weight: 800; color: #38bdf8; margin: 8px 0; }
    .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #334155; font-size: 14px; }
    .label { color: #94a3b8; }
    .val { font-weight: 600; color: #f1f5f9; text-align: right; word-break: break-all; }
    .footer { padding: 20px; background-color: #0f172a; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #334155; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px; font-weight: 800;">Stripe Payment Receipt</h1>
      <p style="margin: 6px 0 0; opacity: 0.9; font-size: 14px;">Official Payment Confirmation</p>
    </div>
    <div class="content">
      <div style="text-align: center; margin-bottom: 16px;">
        <span class="badge">Payment ${data.status.toUpperCase()}</span>
      </div>

      <div class="amount-box">
        <div style="font-size: 13px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">Total Amount Paid</div>
        <div class="amount">${formattedAmount} ${cur}</div>
        <div style="font-size: 13px; color: #10b981;">Processed securely via Stripe Gateway</div>
      </div>

      <div style="margin-top: 24px;">
        <div class="row">
          <span class="label">Transaction ID</span>
          <span class="val" style="font-family: monospace;">${data.paymentIntentId}</span>
        </div>
        <div class="row">
          <span class="label">Customer Email</span>
          <span class="val">${data.recipientEmail}</span>
        </div>
        ${data.planName ? `
        <div class="row">
          <span class="label">Plan / Item</span>
          <span class="val">${data.planName}</span>
        </div>` : ''}
        ${data.description ? `
        <div class="row">
          <span class="label">Description</span>
          <span class="val">${data.description}</span>
        </div>` : ''}
        <div class="row">
          <span class="label">Payment Method</span>
          <span class="val">${data.paymentMethod || 'Credit / Debit Card (Stripe Elements)'}</span>
        </div>
        <div class="row" style="border-bottom: none;">
          <span class="label">Date & Time</span>
          <span class="val">${dateStr}</span>
        </div>
      </div>
    </div>
    <div class="footer">
      This is an automated receipt generated by Stripe &amp; Gmail Payment Gateway Hub.<br/>
      Keep this email for your accounting and billing records.
    </div>
  </div>
</body>
</html>`;
}

/**
 * Sends a real payment receipt email using the Gmail REST API (users.messages.send)
 */
export async function sendGmailReceipt(data: PaymentReceiptEmailData): Promise<{ id: string; threadId: string }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Gmail API এক্সেস টোকেন পাওয়া যায়নি। অনুগ্রহ করে Google অ্যাকাউন্ট সাইন ইন করুন।');
  }

  const subject = `Receipt for your payment of ${(data.amount / 100).toFixed(2)} ${data.currency.toUpperCase()} [${data.paymentIntentId.slice(0, 14)}]`;
  const htmlBody = generateReceiptHtml(data);

  // Construct RFC 2822 email format
  const rawEmail = [
    `To: ${data.recipientEmail}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    htmlBody,
  ].join('\r\n');

  const encodedMessage = base64UrlEncode(rawEmail);

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: encodedMessage,
    }),
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || `Gmail API ত্রুটি (${response.status})`);
  }

  return await response.json();
}

/**
 * List recent billing and receipt emails from user's Gmail.
 * Scans incoming transaction receipts for Stripe-specific headers (e.g. X-Stripe-Account,
 * X-Stripe-Event, stripe.com sender/ID) and automatically applies the 'Payments' label
 * to those messages upon fetching, simplifying inbox organization.
 */
export async function listBillingEmails(autoApplyPaymentLabel: boolean = true): Promise<GmailMessageSummary[]> {
  const token = await getAccessToken();
  if (!token) return [];

  const query = encodeURIComponent('receipt OR invoice OR stripe OR payment');
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=10`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    console.error('Failed to list Gmail messages:', res.statusText);
    return [];
  }

  const data = await res.json();
  if (!data.messages || !Array.isArray(data.messages)) {
    return [];
  }

  // Fetch headers for each message (including Stripe-specific headers)
  const details: GmailMessageSummary[] = await Promise.all(
    data.messages.slice(0, 10).map(async (msg: { id: string; threadId: string }) => {
      try {
        const itemRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date&metadataHeaders=X-Stripe-Account&metadataHeaders=X-Stripe-Event&metadataHeaders=Message-ID&metadataHeaders=Feedback-ID`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!itemRes.ok) return { id: msg.id, threadId: msg.threadId };

        const item = await itemRes.json();
        const headers: Record<string, string> = {};
        item.payload?.headers?.forEach((h: any) => {
          headers[h.name.toLowerCase()] = h.value;
        });

        const subject = headers['subject'] || '(No Subject)';
        const from = headers['from'] || 'Unknown Sender';
        const snippet = item.snippet || '';
        const stripeAccount = headers['x-stripe-account'];
        const stripeEvent = headers['x-stripe-event'];
        const messageId = headers['message-id'];
        const feedbackId = headers['feedback-id'];

        const hasStripeHeader =
          Boolean(stripeAccount) ||
          Boolean(stripeEvent) ||
          from.toLowerCase().includes('stripe.com') ||
          Boolean(messageId && messageId.toLowerCase().includes('stripe.com')) ||
          Boolean(feedbackId && feedbackId.toLowerCase().includes('stripe'));

        const isStripe =
          hasStripeHeader ||
          subject.toLowerCase().includes('stripe') ||
          snippet.toLowerCase().includes('stripe');

        return {
          id: msg.id,
          threadId: msg.threadId,
          snippet,
          subject,
          from,
          to: headers['to'] || '',
          date: headers['date'] || '',
          labelIds: item.labelIds || [],
          isStripeReceipt: isStripe,
          stripeHeaders: {
            stripeAccount,
            stripeEvent,
            messageId,
            feedbackId,
          },
        };
      } catch (err) {
        return { id: msg.id, threadId: msg.threadId };
      }
    })
  );

  // Automatically apply 'Payments' label to Stripe receipt messages upon fetching
  if (autoApplyPaymentLabel) {
    try {
      const stripeMessages = details.filter((d) => d.isStripeReceipt);
      if (stripeMessages.length > 0) {
        const paymentsLabel = await ensurePaymentLabelExists();
        if (paymentsLabel?.id) {
          const unlabelledStripeIds = stripeMessages
            .filter((d) => !(d.labelIds || []).includes(paymentsLabel.id))
            .map((d) => d.id);

          if (unlabelledStripeIds.length > 0) {
            await applyLabelToMessages(unlabelledStripeIds, paymentsLabel.id);
            // Update in-memory labelIds so returned messages immediately reflect the 'Payments' label
            details.forEach((d) => {
              if (unlabelledStripeIds.includes(d.id)) {
                d.labelIds = [...(d.labelIds || []), paymentsLabel.id];
              }
            });
          }
        }
      }
    } catch (err) {
      console.warn('Could not auto-apply Payments label upon fetching:', err);
    }
  }

  return details;
}

export interface StripeReceiptScanResult {
  totalScanned: number;
  stripeMatched: number;
  newlyOrganized: number;
  alreadyOrganized: number;
  labelId: string;
  matchedMessages: GmailMessageSummary[];
}

/**
 * Scans incoming transaction receipts for Stripe-specific headers and automatically
 * applies the 'Payments' label to these messages.
 */
export async function autoOrganizeStripeReceipts(): Promise<StripeReceiptScanResult> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Gmail API এক্সেস টোকেন পাওয়া যায়নি।');
  }

  // 1. Ensure 'Payments' label exists
  const paymentsLabel = await ensurePaymentLabelExists();
  const labelId = paymentsLabel.id;

  // 2. Query recent receipt / transaction messages
  const query = encodeURIComponent('receipt OR invoice OR stripe OR payment');
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=20`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error('রসিদ অনুসন্ধান করতে ব্যর্থ হয়েছে');
  }

  const data = await res.json();
  const messageItems = data.messages || [];
  if (messageItems.length === 0) {
    return {
      totalScanned: 0,
      stripeMatched: 0,
      newlyOrganized: 0,
      alreadyOrganized: 0,
      labelId,
      matchedMessages: [],
    };
  }

  const matchedMessages: GmailMessageSummary[] = [];
  const toLabelIds: string[] = [];
  let alreadyOrganizedCount = 0;

  // 3. Inspect headers for Stripe-specific markers
  await Promise.all(
    messageItems.slice(0, 15).map(async (msg: { id: string; threadId: string }) => {
      try {
        const itemRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date&metadataHeaders=X-Stripe-Account&metadataHeaders=X-Stripe-Event&metadataHeaders=Message-ID&metadataHeaders=Feedback-ID`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!itemRes.ok) return;

        const item = await itemRes.json();
        const headers: Record<string, string> = {};
        item.payload?.headers?.forEach((h: any) => {
          headers[h.name.toLowerCase()] = h.value;
        });

        const subject = headers['subject'] || '(No Subject)';
        const from = headers['from'] || 'Unknown Sender';
        const snippet = item.snippet || '';
        const stripeAccount = headers['x-stripe-account'];
        const stripeEvent = headers['x-stripe-event'];
        const messageId = headers['message-id'];
        const feedbackId = headers['feedback-id'];

        const hasStripeHeader =
          Boolean(stripeAccount) ||
          Boolean(stripeEvent) ||
          from.toLowerCase().includes('stripe.com') ||
          Boolean(messageId && messageId.toLowerCase().includes('stripe.com')) ||
          Boolean(feedbackId && feedbackId.toLowerCase().includes('stripe'));

        const isStripe =
          hasStripeHeader ||
          subject.toLowerCase().includes('stripe') ||
          snippet.toLowerCase().includes('stripe');

        if (isStripe) {
          const currentLabels: string[] = item.labelIds || [];
          const hasPaymentsLabel = currentLabels.includes(labelId);

          const summary: GmailMessageSummary = {
            id: msg.id,
            threadId: msg.threadId,
            snippet,
            subject,
            from,
            to: headers['to'] || '',
            date: headers['date'] || '',
            labelIds: currentLabels,
            isStripeReceipt: true,
            stripeHeaders: {
              stripeAccount,
              stripeEvent,
              messageId,
              feedbackId,
            },
          };

          matchedMessages.push(summary);

          if (!hasPaymentsLabel) {
            toLabelIds.push(msg.id);
          } else {
            alreadyOrganizedCount++;
          }
        }
      } catch (err) {
        console.error('Error scanning message headers:', err);
      }
    })
  );

  // 4. Automatically apply 'Payments' label to unlabelled Stripe receipts
  let newlyOrganized = 0;
  if (toLabelIds.length > 0) {
    const modifyRes = await applyLabelToMessages(toLabelIds, labelId);
    newlyOrganized = modifyRes.successCount;
    // update matchedMessages with new label
    matchedMessages.forEach((m) => {
      if (toLabelIds.includes(m.id)) {
        m.labelIds = [...(m.labelIds || []), labelId];
      }
    });
  }

  return {
    totalScanned: messageItems.length,
    stripeMatched: matchedMessages.length,
    newlyOrganized,
    alreadyOrganized: alreadyOrganizedCount,
    labelId,
    matchedMessages,
  };
}

/**
 * Lists user's labels in Gmail
 */
export async function listGmailLabels(): Promise<GmailLabel[]> {
  const token = await getAccessToken();
  if (!token) return [];

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/labels', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    console.error('Failed to list labels:', res.statusText);
    return [];
  }

  const data = await res.json();
  return data.labels || [];
}

/**
 * Automates the creation of a dedicated 'Payments' label in the user's Gmail account using the Gmail API.
 * If the label already exists, it retrieves and returns it. Otherwise, it creates the label and returns the newly created label.
 */
export async function ensurePaymentLabelExists(): Promise<GmailLabel & { created: boolean; label: GmailLabel }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Gmail API এক্সেস টোকেন পাওয়া যায়নি। অনুগ্রহ করে Google অ্যাকাউন্টে সাইন ইন করুন।');
  }

  // 1. Check existing labels in user's Gmail
  const existingLabels = await listGmailLabels();
  const existing = existingLabels.find(
    (l) => l.name.toLowerCase() === 'payments'
  );
  if (existing) {
    return Object.assign({}, existing, { created: false, label: existing });
  }

  // 2. Automate creation of 'Payments' label via Gmail API
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/labels', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Payments',
      labelListVisibility: 'labelShow',
      messageListVisibility: 'show',
    }),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || `'Payments' লেবেল তৈরি করতে ব্যর্থ হয়েছে (${res.status})`);
  }

  const newLabel: GmailLabel = await res.json();
  return Object.assign({}, newLabel, { created: true, label: newLabel });
}

/**
 * Automates the creation of the 'Payments' label in the user's Gmail account (alias).
 */
export const createPaymentsLabel = ensurePaymentLabelExists;

/**
 * Creates a generic label in user's Gmail inbox
 */
export async function createGmailLabel(name: string = 'Payments'): Promise<GmailLabel> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Gmail API এক্সেস টোকেন পাওয়া যায়নি।');
  }

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/labels', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      labelListVisibility: 'labelShow',
      messageListVisibility: 'show',
    }),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || `লেবেল তৈরি করতে ব্যর্থ হয়েছে (${res.status})`);
  }

  return await res.json();
}

/**
 * Applies a label to multiple messages (organizing transaction receipts)
 */
export async function applyLabelToMessages(
  messageIds: string[],
  labelId: string
): Promise<{ successCount: number; errors: string[] }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Gmail API এক্সেস টোকেন পাওয়া যায়নি।');
  }

  let successCount = 0;
  const errors: string[] = [];

  for (const id of messageIds) {
    try {
      const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/modify`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          addLabelIds: [labelId],
        }),
      });

      if (res.ok) {
        successCount++;
      } else {
        const errJson = await res.json().catch(() => ({}));
        errors.push(errJson?.error?.message || `Failed to modify message ${id}`);
      }
    } catch (err: any) {
      errors.push(err.message || `Error modifying message ${id}`);
    }
  }

  return { successCount, errors };
}

/**
 * Removes a label from a message
 */
export async function removeLabelFromMessage(messageId: string, labelId: string): Promise<boolean> {
  const token = await getAccessToken();
  if (!token) return false;

  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      removeLabelIds: [labelId],
    }),
  });

  return res.ok;
}
