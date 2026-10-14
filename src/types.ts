export interface StripeConfig {
  publishableKey: string;
  hasServerSecretKey: boolean;
}

export interface StripeKeyStatus {
  success: boolean;
  message?: string;
  error?: string;
  livemode?: boolean | string;
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

export interface ApiEventLog {
  id: string;
  timestamp: string;
  isoDate: string;
  method: string;
  endpoint: string;
  statusCode: number;
  durationMs: number;
  status: 'success' | 'failure';
  eventType: string;
  source: 'api' | 'webhook' | 'stripe' | 'simulation' | 'client';
  requestBody?: any;
  requestHeaders?: Record<string, any>;
  responseBody?: any;
  error?: string | null;
}

export interface PaymentIntentLogItem {
  id: string; // pi_...
  amount: number; // e.g. 25.00
  amountRaw: number; // e.g. 2500
  currency: string; // e.g. 'USD'
  status: 'succeeded' | 'requires_payment_method' | 'canceled' | 'requires_action' | 'processing' | string;
  isSuccess: boolean;
  isFailed: boolean;
  created: number; // unix timestamp in seconds
  createdAt: string; // ISO date
  timestamp: string; // formatted time e.g. 10:24:12 AM
  dateFormatted: string; // formatted date e.g. Oct 12, 2026
  customerEmail?: string;
  customerName?: string;
  paymentMethodType?: string; // 'card', 'link', etc.
  cardBrand?: string; // 'visa', 'mastercard', etc.
  cardLast4?: string;
  description?: string;
  lastPaymentError?: {
    code?: string;
    message?: string;
    declineCode?: string;
    type?: string;
  };
  metadata?: Record<string, string>;
  receiptUrl?: string;
  clientSecret?: string;
  livemode?: boolean;
  rawResponse?: any;
}

export interface TransactionLogsSummary {
  totalCount: number;
  succeededCount: number;
  failedCount: number;
  processingCount: number;
  totalVolumeUsd: number;
  failedVolumeUsd: number;
  successRate: number;
}

export interface DailyTrendPoint {
  date: string; // '2026-10-12'
  label: string; // 'Oct 12'
  dayNumber: number; // 12
  successfulVolume: number; // e.g. 320.50
  failedVolume: number; // e.g. 45.00
  successfulCount: number; // e.g. 8
  failedCount: number; // e.g. 2
  totalVolume: number; // e.g. 365.50
  totalCount: number; // e.g. 10
  successRate: number; // percentage 0-100
}

export interface TrendSummary {
  total30DaySuccessfulVolume: number;
  total30DayFailedVolume: number;
  total30DayVolume: number;
  avgDailyVolume: number;
  peakDay: { date: string; label: string; volume: number };
  failureRate30Day: number;
  total30DayCount: number;
  successfulCount: number;
  failedCount: number;
}

export interface TransactionLogsApiResponse {
  success: boolean;
  source: 'stripe_api' | 'session_store';
  data: PaymentIntentLogItem[];
  summary: TransactionLogsSummary;
  trend30Days?: DailyTrendPoint[];
  trendSummary?: TrendSummary;
  timestamp: string;
  error?: string;
}

export interface RateLimitHistoryPoint {
  second: number;
  timestamp: number;
  label: string;
  count: number;
  limit: number;
}

export interface RateLimitStatus {
  success: boolean;
  currentPerSecond: number;
  limitPerSecond: number;
  currentPerMinute: number;
  limitPerMinute: number;
  hourlyUsage: number;
  totalRequestsTracked: number;
  rateUsagePercentSec: number;
  rateUsagePercentMin: number;
  status: 'healthy' | 'elevated' | 'critical' | 'throttled';
  statusMessage: string;
  estimatedResetMs: number;
  mode: 'test' | 'live';
  isLiveMode: boolean;
  safetyGuardActive: boolean;
  recentHistory: RateLimitHistoryPoint[];
  lastUpdated: string;
}

export interface SystemHealthMemory {
  heapUsedMb: number;
  heapTotalMb: number;
  rssMb: number;
  externalMb: number;
  heapPercent: number;
}

export interface SystemHealthTraffic {
  totalRequests: number;
  successful: number;
  clientErrors: number;
  serverErrors: number;
  successRate: number;
}

export interface SystemHealthLatency {
  avgMs: number;
  minMs: number;
  maxMs: number;
  p95Ms: number;
}

export interface SystemHealthBottleneck {
  category: 'memory' | 'latency' | 'errors' | 'concurrency';
  severity: 'optimal' | 'warning' | 'critical';
  title: string;
  description: string;
  actionableTip: string;
}

export interface SystemHealthDiagnostics {
  score: number;
  status: 'optimal' | 'healthy' | 'degraded' | 'bottleneck_detected';
  bottlenecks: SystemHealthBottleneck[];
}

export interface EndpointHealthMetric {
  endpoint: string;
  method: string;
  count: number;
  totalDurationMs: number;
  minDurationMs: number;
  maxDurationMs: number;
  avgDurationMs: number;
  errors: number;
  lastStatusCode: number;
  lastTimestamp: string;
}

export interface LatencyHistoryPoint {
  id: string;
  timestamp: string;
  timeLabel: string;
  endpoint: string;
  method: string;
  statusCode: number;
  durationMs: number;
  status: 'fast' | 'normal' | 'slow' | 'critical';
}

export interface MemoryHistoryPoint {
  timestamp: string;
  timeLabel: string;
  heapUsedMb: number;
  heapTotalMb: number;
  rssMb: number;
  externalMb: number;
  heapPercent: number;
}

export interface SystemHealthResponse {
  success: boolean;
  uptimeSeconds: number;
  serverStartTime: string;
  environment: {
    nodeVersion: string;
    platform: string;
    arch: string;
    pid: number;
    isProduction: boolean;
  };
  memory: SystemHealthMemory;
  traffic: SystemHealthTraffic;
  latency: SystemHealthLatency;
  diagnostics: SystemHealthDiagnostics;
  recentLatencyHistory: LatencyHistoryPoint[];
  memoryHistory: MemoryHistoryPoint[];
  endpoints: EndpointHealthMetric[];
  timestamp: string;
}

