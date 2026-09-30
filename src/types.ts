export interface StripeConfig {
  publishableKey: string;
  hasServerSecretKey: boolean;
}

export interface StripeKeyStatus {
  success: boolean;
  message?: string;
  error?: string;
  livemode?: boolean;
  mode?: string;
  accountId?: string;
  businessName?: string;
  defaultCurrency?: string;
  available?: Array<{ amount: number; currency: string }>;
  pending?: Array<{ amount: number; currency: string }>;
  verifiedAt?: string;
}

export interface PaymentSimulationResult {
  paymentIntentId: string;
  clientSecret: string;
  amount: number;
  currency: string;
  customerEmail: string;
  description: string;
  status: 'succeeded' | 'requires_action' | 'failed' | 'processing';
  failureReason?: string;
  createdAt: string;
  receiptSent?: boolean;
  receiptMessageId?: string;
  isSimulation?: boolean;
}

export interface SubscriptionItem {
  id: string;
  customerId: string;
  customerEmail: string;
  planName: string;
  priceId: string;
  amount: number;
  currency: string;
  interval: 'month' | 'year';
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  createdAt: string;
  latestInvoiceId?: string;
}

export interface WebhookEventRecord {
  id: string;
  type: string;
  timestamp: string;
  source: 'simulated' | 'incoming' | 'manual';
  data: any;
  status: 'delivered' | 'failed' | 'pending';
  httpStatus?: number;
}
