import { getAccessToken } from '../firebase';
import {
  getSavedReceiptTemplate,
  interpolateVariables,
  renderTemplateToHtml,
  ReceiptTemplate,
} from './receiptTemplate';

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
  customSubject?: string;
  templateOverride?: ReceiptTemplate;
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
 * Creates professional HTML email template for Stripe Payment Receipt using active or custom template
 */
export function generateReceiptHtml(data: PaymentReceiptEmailData): string {
  const template = data.templateOverride || getSavedReceiptTemplate();
  return renderTemplateToHtml(template, data);
}

/**
 * Sends a real payment receipt email using the Gmail REST API (users.messages.send)
 */
export async function sendGmailReceipt(data: PaymentReceiptEmailData): Promise<{ id: string; threadId: string }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Gmail API এক্সেস টোকেন পাওয়া যায়নি। অনুগ্রহ করে Google অ্যাকাউন্ট সাইন ইন করুন।');
  }

  const template = data.templateOverride || getSavedReceiptTemplate();
  const subject = data.customSubject
    ? interpolateVariables(data.customSubject, data)
    : interpolateVariables(template.subject, data);
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
