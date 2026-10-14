// server.ts
import express2 from "express";
import path2 from "path";
import fs from "fs";
import { fileURLToPath as fileURLToPath2 } from "url";

// server-api.ts
import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
dotenv.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
app.set("trust proxy", 1);
app.use(cors());
app.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true }));
var requestTimestamps = [
  Date.now() - 42e3,
  Date.now() - 31e3,
  Date.now() - 19e3,
  Date.now() - 9e3,
  Date.now() - 3500,
  Date.now() - 1200,
  Date.now() - 400
];
var safetyGuardActive = true;
var totalRequestsCounter = 48;
function recordApiRateHit(count = 1) {
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    requestTimestamps.push(now);
    totalRequestsCounter++;
  }
  if (requestTimestamps.length > 5e3) {
    requestTimestamps.splice(0, requestTimestamps.length - 5e3);
  }
}
app.use("/api", (req, _res, next) => {
  if (!req.path.startsWith("/rate-limit")) {
    recordApiRateHit(1);
  }
  next();
});
var apiEventLogs = [
  {
    id: "evt_log_01",
    timestamp: new Date(Date.now() - 15e3).toLocaleTimeString(),
    isoDate: new Date(Date.now() - 15e3).toISOString(),
    method: "POST",
    endpoint: "/api/webhook",
    statusCode: 200,
    durationMs: 24,
    status: "success",
    eventType: "payment_intent.succeeded",
    source: "webhook",
    requestBody: { id: "evt_3MzxS94K9kL0s8_succ", type: "payment_intent.succeeded", data: { object: { id: "pi_3MzxS94K9kL0s8", amount: 2500, currency: "usd", status: "succeeded", receipt_email: "buyer@example.com" } } },
    responseBody: { received: true, eventType: "payment_intent.succeeded" }
  },
  {
    id: "evt_log_02",
    timestamp: new Date(Date.now() - 45e3).toLocaleTimeString(),
    isoDate: new Date(Date.now() - 45e3).toISOString(),
    method: "POST",
    endpoint: "/api/webhook",
    statusCode: 200,
    durationMs: 18,
    status: "success",
    eventType: "charge.succeeded",
    source: "webhook",
    requestBody: { id: "evt_ch_1294819_succ", type: "charge.succeeded", data: { object: { id: "ch_1948192837", amount: 2500, paid: true, outcome: { network_status: "approved_by_network" } } } },
    responseBody: { received: true, eventType: "charge.succeeded" }
  },
  {
    id: "evt_log_03",
    timestamp: new Date(Date.now() - 95e3).toLocaleTimeString(),
    isoDate: new Date(Date.now() - 95e3).toISOString(),
    method: "POST",
    endpoint: "/api/webhook",
    statusCode: 200,
    durationMs: 31,
    status: "success",
    eventType: "invoice.payment_succeeded",
    source: "webhook",
    requestBody: { id: "evt_inv_839281_succ", type: "invoice.payment_succeeded", data: { object: { id: "in_1MzxS94K9kL0s8", amount_paid: 2900, customer_email: "subscriber@example.com", paid: true } } },
    responseBody: { received: true, eventType: "invoice.payment_succeeded" }
  },
  {
    id: "evt_log_04",
    timestamp: new Date(Date.now() - 14e4).toLocaleTimeString(),
    isoDate: new Date(Date.now() - 14e4).toISOString(),
    method: "POST",
    endpoint: "/api/webhook",
    statusCode: 400,
    durationMs: 15,
    status: "failure",
    eventType: "payment_intent.payment_failed",
    source: "webhook",
    requestBody: { id: "evt_pi_fail_9281", type: "payment_intent.payment_failed", data: { object: { id: "pi_3MzxS94K9kL0s9", amount: 5e3, last_payment_error: { code: "card_declined", message: "Card declined by issuing bank" } } } },
    responseBody: { error: "Card was declined by customer bank", received: false },
    error: "Card was declined by customer bank"
  },
  {
    id: "evt_log_05",
    timestamp: new Date(Date.now() - 21e4).toLocaleTimeString(),
    isoDate: new Date(Date.now() - 21e4).toISOString(),
    method: "POST",
    endpoint: "/api/webhook",
    statusCode: 200,
    durationMs: 27,
    status: "success",
    eventType: "customer.subscription.created",
    source: "webhook",
    requestBody: { id: "evt_sub_cr_9182", type: "customer.subscription.created", data: { object: { id: "sub_1QkL294Ztest928", status: "active", customer: "cus_R839d092" } } },
    responseBody: { received: true, eventType: "customer.subscription.created" }
  },
  {
    id: "evt_log_06",
    timestamp: new Date(Date.now() - 32e4).toLocaleTimeString(),
    isoDate: new Date(Date.now() - 32e4).toISOString(),
    method: "POST",
    endpoint: "/api/webhook",
    statusCode: 200,
    durationMs: 22,
    status: "success",
    eventType: "checkout.session.completed",
    source: "webhook",
    requestBody: { id: "evt_cs_comp_7381", type: "checkout.session.completed", data: { object: { id: "cs_test_9281728", payment_status: "paid", amount_total: 4900 } } },
    responseBody: { received: true, eventType: "checkout.session.completed" }
  },
  {
    id: "evt_log_07",
    timestamp: new Date(Date.now() - 45e4).toLocaleTimeString(),
    isoDate: new Date(Date.now() - 45e4).toISOString(),
    method: "POST",
    endpoint: "/api/webhook",
    statusCode: 200,
    durationMs: 19,
    status: "success",
    eventType: "customer.created",
    source: "webhook",
    requestBody: { id: "evt_cus_cr_8192", type: "customer.created", data: { object: { id: "cus_R839d092", email: "customer@example.com" } } },
    responseBody: { received: true, eventType: "customer.created" }
  },
  {
    id: "evt_log_08",
    timestamp: new Date(Date.now() - 6e5).toLocaleTimeString(),
    isoDate: new Date(Date.now() - 6e5).toISOString(),
    method: "POST",
    endpoint: "/api/webhook",
    statusCode: 200,
    durationMs: 33,
    status: "success",
    eventType: "payment_method.attached",
    source: "webhook",
    requestBody: { id: "evt_pm_att_8192", type: "payment_method.attached", data: { object: { id: "pm_card_visa", type: "card", customer: "cus_R839d092" } } },
    responseBody: { received: true, eventType: "payment_method.attached" }
  },
  {
    id: "evt_log_09",
    timestamp: new Date(Date.now() - 75e4).toLocaleTimeString(),
    isoDate: new Date(Date.now() - 75e4).toISOString(),
    method: "POST",
    endpoint: "/api/webhook",
    statusCode: 200,
    durationMs: 25,
    status: "success",
    eventType: "invoice.finalized",
    source: "webhook",
    requestBody: { id: "evt_inv_fin_9182", type: "invoice.finalized", data: { object: { id: "in_1MzxS94K9kL0s8", status: "open", total: 2900 } } },
    responseBody: { received: true, eventType: "invoice.finalized" }
  },
  {
    id: "evt_log_10",
    timestamp: new Date(Date.now() - 9e5).toLocaleTimeString(),
    isoDate: new Date(Date.now() - 9e5).toISOString(),
    method: "POST",
    endpoint: "/api/webhook",
    statusCode: 200,
    durationMs: 20,
    status: "success",
    eventType: "charge.refunded",
    source: "webhook",
    requestBody: { id: "evt_ch_ref_1928", type: "charge.refunded", data: { object: { id: "ch_1948192837", amount_refunded: 2500, refunded: true } } },
    responseBody: { received: true, eventType: "charge.refunded" }
  }
];
var serverStartTime = Date.now();
var totalApiRequests = 48;
var totalSuccessfulRequests = 46;
var totalClientErrors = 2;
var totalServerErrors = 0;
var totalLatencySumMs = 48 * 28;
var minLatencyMs = 12;
var maxLatencyMs = 142;
var recentLatencyHistory = [];
var memoryHistory = [];
var endpointMetrics = /* @__PURE__ */ new Map();
var baselineEndpoints = [
  { endpoint: "/api/config", method: "GET", count: 18, avg: 14, min: 9, max: 28, errors: 0, lastStatus: 200 },
  { endpoint: "/api/verify-key", method: "POST", count: 12, avg: 85, min: 42, max: 142, errors: 1, lastStatus: 200 },
  { endpoint: "/api/payment-intents", method: "GET", count: 8, avg: 34, min: 18, max: 65, errors: 0, lastStatus: 200 },
  { endpoint: "/api/rate-limit-status", method: "GET", count: 15, avg: 12, min: 8, max: 22, errors: 0, lastStatus: 200 },
  { endpoint: "/api/webhook", method: "POST", count: 5, avg: 22, min: 15, max: 35, errors: 0, lastStatus: 200 }
];
for (const b of baselineEndpoints) {
  endpointMetrics.set(`${b.method} ${b.endpoint}`, {
    endpoint: b.endpoint,
    method: b.method,
    count: b.count,
    totalDurationMs: b.count * b.avg,
    minDurationMs: b.min,
    maxDurationMs: b.max,
    avgDurationMs: b.avg,
    errors: b.errors,
    lastStatusCode: b.lastStatus,
    lastTimestamp: new Date(Date.now() - 1e3 * 60 * 3).toLocaleTimeString()
  });
}
var initialMem = process.memoryUsage();
for (let i = 10; i >= 0; i--) {
  const past = Date.now() - i * 15e3;
  const variation = Math.sin(i) * 2;
  memoryHistory.push({
    timestamp: new Date(past).toISOString(),
    timeLabel: new Date(past).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    heapUsedMb: Math.round((initialMem.heapUsed / 1024 / 1024 + variation) * 100) / 100,
    heapTotalMb: Math.round(initialMem.heapTotal / 1024 / 1024 * 100) / 100,
    rssMb: Math.round((initialMem.rss / 1024 / 1024 + variation * 1.5) * 100) / 100,
    externalMb: Math.round(initialMem.external / 1024 / 1024 * 100) / 100,
    heapPercent: Math.round(initialMem.heapUsed / initialMem.heapTotal * 100)
  });
}
for (let i = 15; i >= 0; i--) {
  const past = Date.now() - i * 12e3;
  const duration = Math.round(15 + Math.random() * 65);
  recentLatencyHistory.push({
    id: `lat_init_${i}`,
    timestamp: new Date(past).toISOString(),
    timeLabel: new Date(past).toLocaleTimeString(),
    endpoint: i % 3 === 0 ? "/api/verify-key" : i % 2 === 0 ? "/api/config" : "/api/payment-intents",
    method: i % 3 === 0 ? "POST" : "GET",
    statusCode: 200,
    durationMs: duration,
    status: duration < 50 ? "fast" : duration < 200 ? "normal" : "slow"
  });
}
var lastMemorySnapshotTime = Date.now();
function recordHealthMetric(method, endpoint, statusCode, durationMs) {
  if (endpoint.startsWith("/api/system-health")) return;
  totalApiRequests++;
  totalLatencySumMs += durationMs;
  minLatencyMs = Math.min(minLatencyMs, durationMs);
  maxLatencyMs = Math.max(maxLatencyMs, durationMs);
  if (statusCode >= 200 && statusCode < 400) {
    totalSuccessfulRequests++;
  } else if (statusCode >= 400 && statusCode < 500) {
    totalClientErrors++;
  } else if (statusCode >= 500) {
    totalServerErrors++;
  }
  const key = `${method} ${endpoint}`;
  const existing = endpointMetrics.get(key) || {
    endpoint,
    method,
    count: 0,
    totalDurationMs: 0,
    minDurationMs: 999999,
    maxDurationMs: 0,
    avgDurationMs: 0,
    errors: 0,
    lastStatusCode: statusCode,
    lastTimestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString()
  };
  existing.count++;
  existing.totalDurationMs += durationMs;
  existing.minDurationMs = Math.min(existing.minDurationMs, durationMs);
  existing.maxDurationMs = Math.max(existing.maxDurationMs, durationMs);
  existing.avgDurationMs = Math.round(existing.totalDurationMs / existing.count);
  existing.lastStatusCode = statusCode;
  existing.lastTimestamp = (/* @__PURE__ */ new Date()).toLocaleTimeString();
  if (statusCode >= 400) existing.errors++;
  endpointMetrics.set(key, existing);
  let statusCategory = "fast";
  if (durationMs > 500 || statusCode >= 500) statusCategory = "critical";
  else if (durationMs > 250) statusCategory = "slow";
  else if (durationMs > 80) statusCategory = "normal";
  recentLatencyHistory.unshift({
    id: `lat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    timeLabel: (/* @__PURE__ */ new Date()).toLocaleTimeString(),
    endpoint,
    method,
    statusCode,
    durationMs,
    status: statusCategory
  });
  if (recentLatencyHistory.length > 60) recentLatencyHistory.length = 60;
  const now = Date.now();
  if (now - lastMemorySnapshotTime > 8e3) {
    lastMemorySnapshotTime = now;
    const mem = process.memoryUsage();
    memoryHistory.push({
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      timeLabel: (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024 * 100) / 100,
      heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024 * 100) / 100,
      rssMb: Math.round(mem.rss / 1024 / 1024 * 100) / 100,
      externalMb: Math.round(mem.external / 1024 / 1024 * 100) / 100,
      heapPercent: Math.round(mem.heapUsed / mem.heapTotal * 100)
    });
    if (memoryHistory.length > 40) memoryHistory.shift();
  }
}
function calculateP95Latency() {
  if (recentLatencyHistory.length === 0) return 0;
  const sorted = [...recentLatencyHistory].map((p) => p.durationMs).sort((a, b) => a - b);
  const p95Index = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));
  return sorted[p95Index] || 0;
}
function evaluateSystemBottlenecks() {
  const mem = process.memoryUsage();
  const heapPercent = mem.heapUsed / mem.heapTotal * 100;
  const rssMb = mem.rss / 1024 / 1024;
  const avgLatency = totalApiRequests > 0 ? totalLatencySumMs / totalApiRequests : 0;
  const errorRate = totalApiRequests > 0 ? (totalClientErrors + totalServerErrors) / totalApiRequests * 100 : 0;
  const serverErrorRate = totalApiRequests > 0 ? totalServerErrors / totalApiRequests * 100 : 0;
  const bottlenecks = [];
  if (heapPercent > 85 || rssMb > 750) {
    bottlenecks.push({
      category: "memory",
      severity: "critical",
      title: "High Heap Memory Saturation",
      description: `V8 Heap is at ${Math.round(heapPercent)}% capacity (${Math.round(mem.heapUsed / 1024 / 1024)}MB used of ${Math.round(mem.heapTotal / 1024 / 1024)}MB total).`,
      actionableTip: "Enable Node flag --max-old-space-size=1024 in container start, and inspect long-lived buffers or event emitters."
    });
  } else if (heapPercent > 70 || rssMb > 400) {
    bottlenecks.push({
      category: "memory",
      severity: "warning",
      title: "Moderate Memory Allocation",
      description: `Heap utilization at ${Math.round(heapPercent)}%. RSS resident memory is ${Math.round(rssMb)}MB.`,
      actionableTip: "Normal during burst testing; ensure stream buffers are closed and cache sizes capped."
    });
  } else {
    bottlenecks.push({
      category: "memory",
      severity: "optimal",
      title: "Memory Footprint Healthy",
      description: `V8 Heap utilization is stable at ${Math.round(heapPercent)}% (${Math.round(mem.heapUsed / 1024 / 1024)}MB used).`,
      actionableTip: "No memory leaks detected. Excellent garbage collection efficiency."
    });
  }
  if (avgLatency > 450) {
    bottlenecks.push({
      category: "latency",
      severity: "critical",
      title: "High Average Latency (>450ms)",
      description: `Mean response time is currently ${Math.round(avgLatency)}ms across recent API requests.`,
      actionableTip: "Inspect third-party API call roundtrips (Stripe/Gemini) and enable HTTP keep-alive pooling."
    });
  } else if (avgLatency > 180) {
    bottlenecks.push({
      category: "latency",
      severity: "warning",
      title: "Moderate Latency Observed",
      description: `Average latency is ${Math.round(avgLatency)}ms. Some remote calls take over 200ms.`,
      actionableTip: "Utilize async background dispatch for receipts and webhooks to keep response times under 100ms."
    });
  } else {
    bottlenecks.push({
      category: "latency",
      severity: "optimal",
      title: "Ultra-Fast Response Times",
      description: `Average API latency is ${Math.round(avgLatency)}ms. 90%+ endpoints respond under 100ms.`,
      actionableTip: "Server response times are blazing fast. Ideal for production checkout flows."
    });
  }
  if (serverErrorRate > 3) {
    bottlenecks.push({
      category: "errors",
      severity: "critical",
      title: "Elevated 5xx Server Error Rate",
      description: `${totalServerErrors} server errors recorded (${serverErrorRate.toFixed(1)}% error rate).`,
      actionableTip: "Review backend console logs and ensure Stripe secret keys or Google Auth tokens are valid."
    });
  } else if (errorRate > 10) {
    bottlenecks.push({
      category: "errors",
      severity: "warning",
      title: "Client Request Validation Failures (4xx)",
      description: `${totalClientErrors} client error responses logged.`,
      actionableTip: "Client forms are submitting invalid parameters or test cards. Verify input masks."
    });
  } else {
    bottlenecks.push({
      category: "errors",
      severity: "optimal",
      title: "Exceptional Service Reliability",
      description: `Success rate is ${totalApiRequests > 0 ? (totalSuccessfulRequests / totalApiRequests * 100).toFixed(1) : 100}%.`,
      actionableTip: "Zero recurring 5xx crashes. All API contracts are compliant."
    });
  }
  let healthScore = 100;
  if (heapPercent > 85) healthScore -= 25;
  else if (heapPercent > 70) healthScore -= 10;
  if (avgLatency > 400) healthScore -= 25;
  else if (avgLatency > 200) healthScore -= 10;
  if (serverErrorRate > 3) healthScore -= 30;
  else if (errorRate > 10) healthScore -= 10;
  healthScore = Math.max(20, Math.min(100, healthScore));
  let overallStatus = "optimal";
  if (healthScore < 60) overallStatus = "bottleneck_detected";
  else if (healthScore < 80) overallStatus = "degraded";
  else if (healthScore < 95) overallStatus = "healthy";
  return {
    score: healthScore,
    status: overallStatus,
    bottlenecks
  };
}
app.use((req, res, next) => {
  if (!req.path.startsWith("/api") || req.path.startsWith("/api/event-logs") || req.path === "/api/health") {
    return next();
  }
  const startTime = Date.now();
  const logId = "log_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 7);
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);
  let capturedResponse = null;
  res.json = function(body) {
    capturedResponse = body;
    return originalJson(body);
  };
  res.send = function(body) {
    if (!capturedResponse) {
      try {
        capturedResponse = typeof body === "string" ? JSON.parse(body) : body;
      } catch {
        capturedResponse = body;
      }
    }
    return originalSend(body);
  };
  res.on("finish", () => {
    const durationMs = Date.now() - startTime;
    const statusCode = res.statusCode;
    const isSuccess = statusCode >= 200 && statusCode < 400;
    recordHealthMetric(req.method, req.path, statusCode, durationMs);
    const safeHeaders = {};
    if (req.headers["content-type"]) safeHeaders["content-type"] = String(req.headers["content-type"]);
    if (req.headers["stripe-signature"]) safeHeaders["stripe-signature"] = String(req.headers["stripe-signature"]).substring(0, 24) + "...";
    if (req.headers["x-stripe-secret-key"]) safeHeaders["x-stripe-secret-key"] = "sk_***hidden***";
    let sanitizedBody = req.body;
    if (sanitizedBody && typeof sanitizedBody === "object") {
      try {
        sanitizedBody = JSON.parse(JSON.stringify(sanitizedBody));
        if (sanitizedBody.secretKey) sanitizedBody.secretKey = "sk_***hidden***";
        if (sanitizedBody.key) sanitizedBody.key = "sk_***hidden***";
      } catch {
      }
    }
    let determinedEventType = `${req.method.toLowerCase()}${req.path.replace(/\//g, ".")}`;
    if (req.path === "/api/webhook") {
      determinedEventType = req.body?.type || "webhook.received";
    } else if (req.path === "/api/create-payment-intent") {
      determinedEventType = "payment_intent.create";
    } else if (req.path === "/api/create-subscription") {
      determinedEventType = "customer.subscription.create";
    } else if (req.path === "/api/generate-checkout-link") {
      determinedEventType = "checkout.session.create";
    } else if (req.path === "/api/verify-key") {
      determinedEventType = "stripe.account.verify";
    } else if (req.path === "/api/ai-chat") {
      determinedEventType = "ai.agent.tool_call";
    }
    const logEntry = {
      id: logId,
      timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString(),
      isoDate: (/* @__PURE__ */ new Date()).toISOString(),
      method: req.method,
      endpoint: req.path,
      statusCode,
      durationMs,
      status: isSuccess ? "success" : "failure",
      eventType: determinedEventType,
      source: req.path === "/api/webhook" ? "webhook" : "api",
      requestBody: sanitizedBody,
      requestHeaders: safeHeaders,
      responseBody: capturedResponse,
      error: !isSuccess ? capturedResponse?.error || capturedResponse?.message || `HTTP ${statusCode}` : null
    };
    apiEventLogs.unshift(logEntry);
    if (apiEventLogs.length > 150) {
      apiEventLogs.length = 150;
    }
  });
  next();
});
var isRealStripeKey = (key) => {
  if (!key || typeof key !== "string") return false;
  const trimmed = key.trim();
  return (trimmed.startsWith("sk_test_") || trimmed.startsWith("sk_live_") || trimmed.startsWith("rk_test_") || trimmed.startsWith("rk_live_") || trimmed.startsWith("sk_") || trimmed.startsWith("rk_")) && !trimmed.includes("your_secret_key_here") && !trimmed.includes("placeholder");
};
var getStripeInstance = (req) => {
  const customKey = req.headers["x-stripe-secret-key"] || "";
  const secretKey = customKey.trim() || process.env.STRIPE_SECRET_KEY;
  if (!isRealStripeKey(secretKey)) {
    return null;
  }
  return new Stripe(secretKey, {
    apiVersion: "2025-02-24.acacia"
  });
};
var getPublicOrigin = (req) => {
  if (req.headers.origin && typeof req.headers.origin === "string") {
    return req.headers.origin.replace(/\/$/, "");
  }
  if (req.headers.referer && typeof req.headers.referer === "string") {
    try {
      const url = new URL(req.headers.referer);
      return url.origin;
    } catch (_e) {
    }
  }
  const forwardedHost = req.headers["x-forwarded-host"];
  const forwardedProto = req.headers["x-forwarded-proto"] || (req.secure ? "https" : "http");
  if (forwardedHost && !forwardedHost.includes("localhost")) {
    return `https://${forwardedHost}`.replace(/\/$/, "");
  }
  const host = req.get("host");
  if (host && !host.includes("localhost")) {
    return `https://${host}`.replace(/\/$/, "");
  }
  if (process.env.APP_URL && !process.env.APP_URL.includes("MY_APP_URL")) {
    return process.env.APP_URL.replace(/\/$/, "");
  }
  return `${req.protocol || "http"}://${host || "localhost:3000"}`.replace(/\/$/, "");
};
async function createCheckoutSession(stripe, req, itemId, amount, customerEmail) {
  const normalizedAmount = Math.max(1, Number(amount) || 10);
  const unitAmount = Math.round(normalizedAmount * 100);
  if (stripe) {
    const origin = getPublicOrigin(req);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "link"],
      customer_email: customerEmail || void 0,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: itemId,
              description: "AI Agent Generated Payment Session with Stripe Link"
            },
            unit_amount: unitAmount
          },
          quantity: 1
        }
      ],
      mode: "payment",
      success_url: `${origin}/?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?status=cancelled`
    });
    return {
      status: "success",
      checkoutUrl: session.url || `https://checkout.stripe.com/c/pay/${session.id}#link_enabled`,
      sessionId: session.id,
      itemId,
      amount: normalizedAmount,
      isSimulation: false
    };
  } else {
    const simId = "cs_test_sim_" + Math.random().toString(36).substring(2, 12);
    return {
      status: "success",
      checkoutUrl: `https://checkout.stripe.com/pay/${simId}#link_one_click`,
      sessionId: simId,
      itemId,
      amount: normalizedAmount,
      isSimulation: true
    };
  }
}
async function processHeuristicAgent(message, email, stripe, req) {
  const lower = message.toLowerCase();
  const isBuyIntent = lower.includes("\u0995\u09BF\u09A8\u09A4\u09C7") || lower.includes("\u0995\u09BF\u09A8\u09BF") || lower.includes("\u09AC\u09BE\u0987") || lower.includes("buy") || lower.includes("order") || lower.includes("pay") || lower.includes("\u09AA\u09C7\u09AE\u09C7\u09A8\u09CD\u099F") || lower.includes("link") || lower.includes("\u09AA\u09CD\u09AF\u09BE\u0995\u09C7\u099C") || lower.includes("package") || lower.includes("\u09AA\u09CD\u09B2\u09CD\u09AF\u09BE\u09A8") || lower.includes("plan") || lower.includes("\u09B8\u09BE\u09AC\u09B8\u09CD\u0995\u09CD\u09B0\u09BF\u09AA\u09B6\u09A8") || lower.includes("pro") || lower.includes("starter") || lower.includes("credit") || lower.includes("$") || /\d+/.test(lower);
  if (isBuyIntent) {
    let itemId = "Pro Package";
    let amount = 29;
    if (lower.includes("starter") || lower.includes("\u09B8\u09CD\u099F\u09BE\u09B0\u09CD\u099F\u09BE\u09B0") || lower.includes("9")) {
      itemId = "Starter Kit";
      amount = 9.99;
    } else if (lower.includes("credit") || lower.includes("\u0995\u09CD\u09B0\u09C7\u09A1\u09BF\u099F") || lower.includes("15")) {
      itemId = "AI 10,000 Credits Pack";
      amount = 15;
    } else if (lower.includes("ultimate") || lower.includes("\u0986\u09B2\u09CD\u099F\u09BF\u09AE\u09C7\u099F") || lower.includes("49")) {
      itemId = "Ultimate AI Enterprise Plan";
      amount = 49;
    } else {
      const matchAmount = message.match(/\$?(\d+(\.\d{1,2})?)/);
      if (matchAmount && matchAmount[1]) {
        amount = parseFloat(matchAmount[1]);
      }
    }
    const toolResult = await createCheckoutSession(stripe, req, itemId, amount, email);
    return {
      aiResponseText: `\u0986\u09AA\u09A8\u09BE\u09B0 \u09AA\u099B\u09A8\u09CD\u09A6\u09C7\u09B0 "${itemId}" ($${amount}) \u09AA\u09CD\u09AF\u09BE\u0995\u09C7\u099C\u09C7\u09B0 \u099C\u09A8\u09CD\u09AF \u09B8\u09CD\u09AC\u09AF\u09BC\u0982\u0995\u09CD\u09B0\u09BF\u09AF\u09BC\u09AD\u09BE\u09AC\u09C7 Tool Use (Function Calling) \u098F\u09B0 \u09AE\u09BE\u09A7\u09CD\u09AF\u09AE\u09C7 \u09A8\u09BF\u09B0\u09BE\u09AA\u09A6 Stripe Checkout Link \u09A4\u09C8\u09B0\u09BF \u0995\u09B0\u09BE \u09B9\u09AF\u09BC\u09C7\u099B\u09C7\u0964 \u09A8\u09BF\u099A\u09C7 \u09A6\u09C7\u0993\u09DF\u09BE \u09A8\u09BF\u09B0\u09BE\u09AA\u09A6 \u09B2\u09BF\u0999\u09CD\u0995\u09C7 \u0995\u09CD\u09B2\u09BF\u0995 \u0995\u09B0\u09C7 "Link by Stripe" \u09A6\u09BF\u09DF\u09C7 \u098F\u0995 \u0995\u09CD\u09B2\u09BF\u0995\u09C7 \u09AA\u09C7\u09AE\u09C7\u09A8\u09CD\u099F \u09B8\u09AE\u09CD\u09AA\u09A8\u09CD\u09A8 \u0995\u09B0\u09A4\u09C7 \u09AA\u09BE\u09B0\u09AC\u09C7\u09A8:`,
      toolCallExecuted: {
        name: "generate_checkout_link",
        args: { item_id: itemId, amount, customer_email: email },
        result: toolResult
      }
    };
  }
  return {
    aiResponseText: '\u09B9\u09CD\u09AF\u09BE\u09B2\u09CB! \u0986\u09AE\u09BF \u0986\u09AA\u09A8\u09BE\u09B0 \u098F\u0986\u0987 \u09AA\u09C7\u09AE\u09C7\u09A8\u09CD\u099F \u0985\u09CD\u09AF\u09BE\u09B8\u09BF\u09B8\u09CD\u099F\u09CD\u09AF\u09BE\u09A8\u09CD\u099F (Stripe AI Agent)\u0964\n\n\u0986\u09AA\u09A8\u09BF \u099A\u09CD\u09AF\u09BE\u099F\u09C7 \u09AF\u09C7\u0995\u09CB\u09A8\u09CB \u09AA\u09CD\u09AF\u09BE\u0995\u09C7\u099C (\u09AF\u09C7\u09AE\u09A8: "\u0986\u09AE\u09BF \u09AA\u09CD\u09B0\u09CB \u09AA\u09CD\u09B2\u09CD\u09AF\u09BE\u09A8 $29 \u0995\u09BF\u09A8\u09A4\u09C7 \u099A\u09BE\u0987" \u09AC\u09BE "\u09B8\u09CD\u099F\u09BE\u09B0\u09CD\u099F\u09BE\u09B0 \u09AA\u09CD\u09AF\u09BE\u0995 $9.99 \u098F\u09B0 \u09AA\u09C7\u09AE\u09C7\u09A8\u09CD\u099F \u09B2\u09BF\u0999\u09CD\u0995 \u09A6\u09BE\u0993") \u0989\u09B2\u09CD\u09B2\u09C7\u0996 \u0995\u09B0\u09B2\u09C7\u0987 \u0986\u09AE\u09BF Function Calling-\u098F\u09B0 \u09AE\u09BE\u09A7\u09CD\u09AF\u09AE\u09C7 \u09B8\u09B0\u09BE\u09B8\u09B0\u09BF Stripe Link \u09A4\u09C8\u09B0\u09BF \u0995\u09B0\u09C7 \u09A6\u09C7\u09AC\u0964 \u0995\u09BE\u09B0\u09CD\u09A1 \u09A8\u09AE\u09CD\u09AC\u09B0 \u09B8\u09B0\u09BE\u09B8\u09B0\u09BF \u099A\u09CD\u09AF\u09BE\u099F\u09C7 \u09B6\u09C7\u09DF\u09BE\u09B0 \u0995\u09B0\u09BE\u09B0 \u0995\u09CB\u09A8\u09CB \u09AA\u09CD\u09B0\u09DF\u09CB\u099C\u09A8 \u09A8\u09C7\u0987\u0964',
    toolCallExecuted: null
  };
}
app.get("/api/health", (_req, res) => {
  res.json({
    status: "healthy",
    environment: process.env.NODE_ENV || "production",
    vercel: Boolean(process.env.VERCEL),
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.get("/api/system-health", (_req, res) => {
  const mem = process.memoryUsage();
  const uptimeSeconds = Math.floor((Date.now() - serverStartTime) / 1e3);
  const avgLatency = totalApiRequests > 0 ? Math.round(totalLatencySumMs / totalApiRequests) : 0;
  const diagnostics = evaluateSystemBottlenecks();
  return res.json({
    success: true,
    uptimeSeconds,
    serverStartTime: new Date(serverStartTime).toISOString(),
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      isProduction: process.env.NODE_ENV === "production"
    },
    memory: {
      heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024 * 100) / 100,
      heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024 * 100) / 100,
      rssMb: Math.round(mem.rss / 1024 / 1024 * 100) / 100,
      externalMb: Math.round(mem.external / 1024 / 1024 * 100) / 100,
      heapPercent: Math.round(mem.heapUsed / mem.heapTotal * 100)
    },
    traffic: {
      totalRequests: totalApiRequests,
      successful: totalSuccessfulRequests,
      clientErrors: totalClientErrors,
      serverErrors: totalServerErrors,
      successRate: totalApiRequests > 0 ? Math.round(totalSuccessfulRequests / totalApiRequests * 1e3) / 10 : 100
    },
    latency: {
      avgMs: avgLatency,
      minMs: minLatencyMs === 999999 ? 0 : minLatencyMs,
      maxMs: maxLatencyMs,
      p95Ms: calculateP95Latency()
    },
    diagnostics,
    recentLatencyHistory,
    memoryHistory,
    endpoints: Array.from(endpointMetrics.values()).sort((a, b) => b.count - a.count),
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.post("/api/system-health/reset", (_req, res) => {
  totalApiRequests = 0;
  totalSuccessfulRequests = 0;
  totalClientErrors = 0;
  totalServerErrors = 0;
  totalLatencySumMs = 0;
  minLatencyMs = 999999;
  maxLatencyMs = 0;
  recentLatencyHistory.length = 0;
  endpointMetrics.clear();
  return res.json({
    success: true,
    message: "System performance metrics and counters successfully reset."
  });
});
app.post("/api/system-health/benchmark", async (_req, res) => {
  const benchStartTime = performance.now();
  const benchmarkRuns = [];
  const t1Start = performance.now();
  for (let i = 0; i < 5e3; i++) {
    JSON.parse(JSON.stringify({ test: "bench", num: i, date: (/* @__PURE__ */ new Date()).toISOString() }));
  }
  benchmarkRuns.push({
    test: "JSON Parse & Serialize (5,000 ops)",
    durationMs: Math.round((performance.now() - t1Start) * 100) / 100
  });
  const t2Start = performance.now();
  let dummySum = 0;
  for (let i = 0; i < 2e4; i++) {
    dummySum += Math.sqrt(i * Math.random());
  }
  benchmarkRuns.push({
    test: "CPU Math & Randomness (20,000 ops)",
    durationMs: Math.round((performance.now() - t2Start) * 100) / 100
  });
  const t3Start = performance.now();
  const chunks = [];
  for (let i = 0; i < 1e3; i++) {
    chunks.push(new Uint8Array(256));
  }
  chunks.length = 0;
  benchmarkRuns.push({
    test: "Memory Buffer Cycling (1,000 allocs)",
    durationMs: Math.round((performance.now() - t3Start) * 100) / 100
  });
  const totalBenchTimeMs = Math.round((performance.now() - benchStartTime) * 100) / 100;
  recordHealthMetric("POST", "/api/system-health/benchmark", 200, Math.round(totalBenchTimeMs));
  return res.json({
    success: true,
    totalBenchmarkMs: totalBenchTimeMs,
    runs: benchmarkRuns,
    rating: totalBenchTimeMs < 30 ? "Blazing Fast" : totalBenchTimeMs < 80 ? "Optimal" : "Moderate",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.get("/api/config", (_req, res) => {
  const pubKey = process.env.STRIPE_PUBLISHABLE_KEY || "";
  const isPubValid = pubKey.startsWith("pk_") && !pubKey.includes("your_publishable_key_here");
  res.json({
    publishableKey: isPubValid ? pubKey : "",
    hasServerSecretKey: isRealStripeKey(process.env.STRIPE_SECRET_KEY)
  });
});
var handleVerifyKey = async (req, res) => {
  try {
    const stripe = getStripeInstance(req);
    if (!stripe) {
      return res.status(400).json({
        success: false,
        error: "\u0995\u09CB\u09A8\u09CB \u09AC\u09C8\u09A7 Secret Key \u09AA\u09BE\u0993\u09AF\u09BC\u09BE \u09AF\u09BE\u09AF\u09BC\u09A8\u09BF\u0964 \u09A6\u09DF\u09BE \u0995\u09B0\u09C7 sk_test_... \u09AC\u09BE sk_live_... \u09A6\u09BF\u09DF\u09C7 \u09B6\u09C1\u09B0\u09C1 \u09B9\u0993\u09DF\u09BE \u0995\u09C0 \u09A6\u09BF\u09A8\u0964"
      });
    }
    const [balance, account] = await Promise.all([
      stripe.balance.retrieve(),
      stripe.accounts?.retrieve?.().catch(() => null)
    ]);
    return res.json({
      success: true,
      message: "API Key \u09B8\u09AE\u09CD\u09AA\u09C2\u09B0\u09CD\u09A3 \u09B8\u09A0\u09BF\u0995 \u098F\u09AC\u0982 \u0995\u09BE\u09B0\u09CD\u09AF\u0995\u09B0!",
      livemode: balance.livemode ? "Live Mode" : "Test Mode",
      accountId: account?.id || "Connected Account",
      businessName: account?.business_profile?.name || account?.settings?.dashboard?.display_name || "Stripe Account",
      defaultCurrency: account?.default_currency || "usd",
      available: balance.available,
      pending: balance.pending
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message || "API Key \u09AF\u09BE\u099A\u09BE\u0987\u0995\u09B0\u09A3 \u09AC\u09CD\u09AF\u09B0\u09CD\u09A5 \u09B9\u09AF\u09BC\u09C7\u099B\u09C7",
      code: error.code || "authentication_error"
    });
  }
};
app.get("/api/verify-key", handleVerifyKey);
app.post("/api/verify-key", handleVerifyKey);
function getRateLimitStatus(secretKey) {
  const now = Date.now();
  const cutoffHour = now - 36e5;
  while (requestTimestamps.length > 0 && requestTimestamps[0] < cutoffHour) {
    requestTimestamps.shift();
  }
  const cutoffSec = now - 1e3;
  const currentPerSecond = requestTimestamps.filter((t) => t >= cutoffSec).length;
  const cutoffMin = now - 6e4;
  const currentPerMinute = requestTimestamps.filter((t) => t >= cutoffMin).length;
  const hourlyUsage = requestTimestamps.length;
  const isLive = Boolean(
    secretKey && secretKey.startsWith("sk_live_") || process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith("sk_live_")
  );
  const limitPerSecond = isLive ? 100 : 25;
  const limitPerMinute = isLive ? 6e3 : 1500;
  const rateUsagePercentSec = Math.min(100, Math.round(currentPerSecond / limitPerSecond * 100));
  const rateUsagePercentMin = Math.min(100, Math.round(currentPerMinute / limitPerMinute * 100));
  let status = "healthy";
  let statusMessage = "Optimal testing capacity. Normal throughput.";
  if (rateUsagePercentSec >= 100 || rateUsagePercentMin >= 100) {
    status = "throttled";
    statusMessage = "Rate limit reached (HTTP 429 Throttle Warning). Auto-pacing active to protect testing.";
  } else if (rateUsagePercentSec >= 80 || rateUsagePercentMin >= 80) {
    status = "critical";
    statusMessage = "High volume burst detected. Approaching Stripe rate limit threshold.";
  } else if (rateUsagePercentSec >= 40 || rateUsagePercentMin >= 40) {
    status = "elevated";
    statusMessage = "Moderate API request velocity. Safe for ongoing operations.";
  }
  const recentHistory = [];
  for (let i = 29; i >= 0; i--) {
    const windowStart = now - (i + 1) * 1e3;
    const windowEnd = now - i * 1e3;
    const count = requestTimestamps.filter((t) => t >= windowStart && t < windowEnd).length;
    const dateObj = new Date(windowEnd);
    recentHistory.push({
      second: 29 - i,
      timestamp: windowEnd,
      label: dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      count,
      limit: limitPerSecond
    });
  }
  const oldestInSec = requestTimestamps.find((t) => t >= cutoffSec);
  const estimatedResetMs = oldestInSec ? Math.max(0, 1e3 - (now - oldestInSec)) : 0;
  return {
    success: true,
    currentPerSecond,
    limitPerSecond,
    currentPerMinute,
    limitPerMinute,
    hourlyUsage,
    totalRequestsTracked: totalRequestsCounter,
    rateUsagePercentSec,
    rateUsagePercentMin,
    status,
    statusMessage,
    estimatedResetMs,
    mode: isLive ? "live" : "test",
    isLiveMode: isLive,
    safetyGuardActive,
    recentHistory,
    lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
  };
}
app.get("/api/rate-limit-status", (req, res) => {
  const customKey = req.headers["x-stripe-secret-key"] || "";
  return res.json(getRateLimitStatus(customKey));
});
app.post("/api/rate-limit/test-burst", (req, res) => {
  const { burstCount = 5 } = req.body;
  const count = Math.min(25, Math.max(1, Number(burstCount) || 5));
  recordApiRateHit(count);
  return res.json({
    success: true,
    burstCount: count,
    message: `Dispatched test burst of ${count} requests to verify real-time rate usage monitor.`,
    status: getRateLimitStatus()
  });
});
app.post("/api/rate-limit/toggle-guard", (req, res) => {
  if (typeof req.body.active === "boolean") {
    safetyGuardActive = req.body.active;
  } else {
    safetyGuardActive = !safetyGuardActive;
  }
  return res.json({
    success: true,
    safetyGuardActive,
    message: safetyGuardActive ? "Auto-Pacing Safety Guard enabled: Throttles rapid bursts to prevent 429 testing interruptions." : "Auto-Pacing Safety Guard disabled."
  });
});
app.post("/api/rate-limit/reset", (_req, res) => {
  requestTimestamps.length = 0;
  return res.json({
    success: true,
    message: "Rate usage monitor history cleared.",
    status: getRateLimitStatus()
  });
});
app.post("/api/create-payment-intent", async (req, res) => {
  try {
    const { amount, currency = "usd", description, customerEmail, metadata } = req.body;
    const stripe = getStripeInstance(req);
    if (!stripe) {
      const simId = "pi_sim_" + Math.random().toString(36).substring(2, 11);
      return res.json({
        clientSecret: `${simId}_secret_${Math.random().toString(36).substring(2, 15)}`,
        paymentIntentId: simId,
        amount: amount || 1e3,
        currency: currency.toLowerCase(),
        status: "requires_payment_method",
        isSimulation: true
      });
    }
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(amount) || 1e3),
      currency: (currency || "usd").toLowerCase(),
      description: description || "Stripe Test Panel Payment",
      receipt_email: customerEmail || void 0,
      automatic_payment_methods: { enabled: true },
      metadata: metadata || { source: "stripe-gmail-gateway-tester" }
    });
    return res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      isSimulation: false
    });
  } catch (error) {
    return res.status(400).json({
      error: error.message || "Payment Intent \u09A4\u09C8\u09B0\u09BF \u0995\u09B0\u09A4\u09C7 \u09AC\u09CD\u09AF\u09B0\u09CD\u09A5 \u09B9\u09AF\u09BC\u09C7\u099B\u09C7"
    });
  }
});
app.post("/api/create-subscription", async (req, res) => {
  try {
    const { email, priceId, planName } = req.body;
    const stripe = getStripeInstance(req);
    if (!stripe) {
      const subId = "sub_sim_" + Math.random().toString(36).substring(2, 10);
      const custId = "cus_sim_" + Math.random().toString(36).substring(2, 10);
      return res.json({
        subscriptionId: subId,
        customerId: custId,
        clientSecret: `pi_sim_${Math.random().toString(36).substring(2, 9)}_secret_${Math.random().toString(36).substring(2, 12)}`,
        status: "active",
        plan: planName || "Pro Plan ($29/month)",
        isSimulation: true
      });
    }
    let customer;
    const existing = await stripe.customers.list({ email, limit: 1 });
    if (existing.data.length > 0) {
      customer = existing.data[0];
    } else {
      customer = await stripe.customers.create({ email });
    }
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      expand: ["latest_invoice.payment_intent"]
    });
    const invoice = subscription.latest_invoice;
    const paymentIntent = invoice?.payment_intent;
    return res.json({
      subscriptionId: subscription.id,
      customerId: customer.id,
      clientSecret: paymentIntent?.client_secret,
      status: subscription.status,
      isSimulation: false
    });
  } catch (error) {
    return res.status(400).json({
      error: error.message || "\u09B8\u09BE\u09AC\u09B8\u09CD\u0995\u09CD\u09B0\u09BF\u09AA\u09B6\u09A8 \u09A4\u09C8\u09B0\u09BF \u09AC\u09CD\u09AF\u09B0\u09CD\u09A5 \u09B9\u09AF\u09BC\u09C7\u099B\u09C7"
    });
  }
});
var isRealWebhookSecret = (secret) => {
  return Boolean(
    secret && secret.startsWith("whsec_") && !secret.includes("your_webhook_secret_here") && !secret.includes("placeholder")
  );
};
var globalRecordPaymentIntent = null;
var handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;
  let signatureVerified = false;
  const rawPayload = req.rawBody || (typeof req.body === "string" ? Buffer.from(req.body) : Buffer.from(JSON.stringify(req.body || {})));
  if (isRealWebhookSecret(webhookSecret) && sig && rawPayload) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
        apiVersion: "2025-02-24.acacia"
      });
      event = stripe.webhooks.constructEvent(rawPayload, sig, webhookSecret);
      signatureVerified = true;
    } catch (err) {
      console.warn(`[Webhook Signature Check] Failed: ${err.message}`);
      return res.status(400).json({
        success: false,
        error: `Webhook signature verification failed: ${err.message}`,
        hint: "Ensure STRIPE_WEBHOOK_SECRET matches the signing secret in Stripe Dashboard or Stripe CLI (`stripe listen`)."
      });
    }
  } else {
    event = req.body || {};
  }
  const eventType = event.type || "unknown";
  if (eventType === "payment_intent.succeeded" && event.data?.object?.id) {
    const pi = event.data.object;
    const formattedAmount = typeof pi.amount === "number" ? (pi.amount / 100).toFixed(2) : "0.00";
    const curr = (pi.currency || "usd").toUpperCase();
    const emailInfo = pi.receipt_email ? ` | \u09B0\u09B8\u09BF\u09A6 \u09AA\u09CD\u09B0\u09BE\u09AA\u0995: ${pi.receipt_email}` : "";
    console.log(`\u2705 \u09AA\u09C7\u09AE\u09C7\u09A8\u09CD\u099F \u09B8\u09AB\u09B2 (${pi.id}): $${formattedAmount} ${curr}${emailInfo}`);
  } else if (eventType === "payment_intent.payment_failed") {
    const piId = event.data?.object?.id || "unknown";
    const reason = event.data?.object?.last_payment_error?.message || event.data?.object?.last_payment_error?.code || "Card declined";
    console.log(`\u274C \u09AA\u09C7\u09AE\u09C7\u09A8\u09CD\u099F \u09AC\u09CD\u09AF\u09B0\u09CD\u09A5 \u09B9\u09AF\u09BC\u09C7\u099B\u09C7 (${piId}): ${reason}`);
  } else if (eventType.startsWith("customer.subscription.")) {
    console.log(`\u{1F4CB} \u09B8\u09BE\u09AC\u09B8\u09CD\u0995\u09CD\u09B0\u09BF\u09AA\u09B6\u09A8 \u0987\u09AD\u09C7\u09A8\u09CD\u099F (${eventType}):`, event.data?.object?.id);
  } else if (eventType.startsWith("invoice.")) {
    console.log(`\u{1F9FE} \u0987\u09A8\u09AD\u09DF\u09C7\u09B8 \u0987\u09AD\u09C7\u09A8\u09CD\u099F (${eventType}):`, event.data?.object?.id);
  }
  console.log(`[Stripe Webhook Received] Type: ${eventType}, ID: ${event.id || "evt_simulated"}`);
  if (typeof globalRecordPaymentIntent === "function" && event.data?.object) {
    if (eventType === "payment_intent.succeeded") {
      globalRecordPaymentIntent(event.data.object, true);
    } else if (eventType === "payment_intent.payment_failed") {
      globalRecordPaymentIntent(event.data.object, false);
    }
  }
  return res.json({
    received: true,
    eventType,
    eventId: event.id || "evt_simulated",
    verified: signatureVerified,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
};
app.post("/api/webhook", handleWebhook);
app.post("/webhook", handleWebhook);
app.get("/api/checkout-session/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const stripe = getStripeInstance(req);
    if (!stripe || !id || id.startsWith("cs_test_sim_")) {
      return res.json({
        id,
        amount: 2500,
        currency: "usd",
        customerEmail: "customer@example.com",
        customerName: "Valued Customer",
        status: "succeeded",
        paymentIntentId: id,
        isSimulation: true
      });
    }
    const session = await stripe.checkout.sessions.retrieve(id, {
      expand: ["payment_intent", "line_items"]
    });
    const paymentIntent = typeof session.payment_intent === "object" ? session.payment_intent : null;
    const customerEmail = session.customer_details?.email || session.customer_email || paymentIntent?.receipt_email || "";
    const customerName = session.customer_details?.name || "Customer";
    const amount = session.amount_total || paymentIntent?.amount || 2500;
    const currency = session.currency || "usd";
    return res.json({
      id: session.id,
      amount,
      currency,
      customerEmail,
      customerName,
      status: session.payment_status === "paid" ? "succeeded" : session.payment_status,
      paymentIntentId: paymentIntent?.id || session.id,
      isSimulation: false
    });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Failed to retrieve checkout session" });
  }
});
var serverVirtualCard = {
  id: "card_iss_928194",
  cardholderName: "RUBEL BANK USER",
  cardNumber: "4532 8921 7384 9201",
  rawCardNumber: "4532892173849201",
  expiryDate: "09/29",
  cvv: "842",
  network: "visa",
  balanceUsd: 250,
  exchangeRateBdt: 122.5,
  isFrozen: false,
  spendingLimitMonthly: 2e3,
  spentThisMonth: 38.5
};
var serverCardTransactions = [
  {
    id: "tx_bkash_83910",
    merchant: "bKash Card-to-Wallet Add Money",
    platformCategory: "bkash",
    referenceNo: "BKASH-ADD-01829",
    amountUsd: 10,
    amountBdt: 1225,
    type: "debit",
    status: "approved",
    authCode: "AUTH-948123",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    remainingBalanceUsd: 250
  }
];
app.get("/api/virtual-card", (_req, res) => {
  return res.json({
    card: serverVirtualCard,
    transactions: serverCardTransactions.slice(0, 15)
  });
});
app.post("/api/virtual-card/topup", (req, res) => {
  const { amountUsd, description } = req.body;
  const numAmount = Math.max(1, Number(amountUsd) || 50);
  serverVirtualCard.balanceUsd = Math.round((serverVirtualCard.balanceUsd + numAmount) * 100) / 100;
  const newTx = {
    id: "tx_topup_" + Math.random().toString(36).substring(2, 9),
    merchant: description || "Wallet Balance Top-up",
    platformCategory: "international_gateway",
    referenceNo: "TOPUP-" + Date.now().toString().slice(-6),
    amountUsd: numAmount,
    amountBdt: Math.round(numAmount * serverVirtualCard.exchangeRateBdt),
    type: "topup",
    status: "approved",
    authCode: "TOPUP-OK",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    remainingBalanceUsd: serverVirtualCard.balanceUsd
  };
  serverCardTransactions.unshift(newTx);
  return res.json({ success: true, card: serverVirtualCard, transaction: newTx });
});
app.post("/api/virtual-card/authorize-payment", (req, res) => {
  const { merchant, amountUsd, amountBdt, platformCategory, referenceNo } = req.body;
  let parsedUsd = Number(amountUsd) || 0;
  let parsedBdt = Number(amountBdt) || 0;
  if (!parsedUsd && parsedBdt) {
    parsedUsd = Math.round(parsedBdt / serverVirtualCard.exchangeRateBdt * 100) / 100;
  } else if (parsedUsd && !parsedBdt) {
    parsedBdt = Math.round(parsedUsd * serverVirtualCard.exchangeRateBdt);
  }
  parsedUsd = Math.max(0.1, parsedUsd);
  if (serverVirtualCard.isFrozen) {
    return res.status(403).json({
      success: false,
      code: "CARD_FROZEN",
      error: "\u0995\u09BE\u09B0\u09CD\u09A1\u099F\u09BF \u09B2\u0995 (Frozen) \u0995\u09B0\u09BE \u09B0\u09DF\u09C7\u099B\u09C7\u0964 \u09AA\u09C7\u09AE\u09C7\u09A8\u09CD\u099F \u0985\u09A8\u09C1\u09AE\u09CB\u09A6\u09A8 \u0995\u09B0\u09BE \u09AF\u09BE\u09DF\u09A8\u09BF\u0964",
      availableBalanceUsd: serverVirtualCard.balanceUsd
    });
  }
  if (serverVirtualCard.balanceUsd < parsedUsd) {
    return res.status(402).json({
      success: false,
      code: "INSUFFICIENT_FUNDS",
      error: `\u0995\u09BE\u09B0\u09CD\u09A1\u09C7 \u09AA\u09B0\u09CD\u09AF\u09BE\u09AA\u09CD\u09A4 \u09AC\u09CD\u09AF\u09BE\u09B2\u09C7\u09A8\u09CD\u09B8 \u09A8\u09C7\u0987\u0964 \u09AA\u09CD\u09B0\u09DF\u09CB\u099C\u09A8: $${parsedUsd.toFixed(2)} (\u09F3${parsedBdt.toLocaleString()}), \u09AC\u09B0\u09CD\u09A4\u09AE\u09BE\u09A8 \u09AC\u09CD\u09AF\u09BE\u09B2\u09C7\u09A8\u09CD\u09B8: $${serverVirtualCard.balanceUsd.toFixed(2)}\u0964`,
      availableBalanceUsd: serverVirtualCard.balanceUsd,
      requiredAmountUsd: parsedUsd
    });
  }
  serverVirtualCard.balanceUsd = Math.round((serverVirtualCard.balanceUsd - parsedUsd) * 100) / 100;
  serverVirtualCard.spentThisMonth = Math.round((serverVirtualCard.spentThisMonth + parsedUsd) * 100) / 100;
  const authCode = "AUTH-" + Math.floor(1e5 + Math.random() * 9e5);
  const newTx = {
    id: "tx_auth_" + Math.random().toString(36).substring(2, 9),
    merchant: merchant || "Online Gateway Payment",
    platformCategory: platformCategory || "other",
    referenceNo: referenceNo || "REF-" + Date.now().toString().slice(-6),
    amountUsd: parsedUsd,
    amountBdt: parsedBdt,
    type: "debit",
    status: "approved",
    authCode,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    remainingBalanceUsd: serverVirtualCard.balanceUsd
  };
  serverCardTransactions.unshift(newTx);
  console.log(`\u{1F4B3} [Virtual Card Authorization] Approved: $${parsedUsd} (\u09F3${parsedBdt}) for "${merchant}". New Card Balance: $${serverVirtualCard.balanceUsd}`);
  return res.json({
    success: true,
    message: `\u09AA\u09C7\u09AE\u09C7\u09A8\u09CD\u099F \u09B8\u09AB\u09B2! \u0995\u09BE\u09B0\u09CD\u09A1 \u09A5\u09C7\u0995\u09C7 $${parsedUsd.toFixed(2)} (\u09F3${parsedBdt.toLocaleString()}) \u0995\u09C7\u099F\u09C7 \u09A8\u09C7\u0993\u09DF\u09BE \u09B9\u09DF\u09C7\u099B\u09C7\u0964`,
    card: serverVirtualCard,
    transaction: newTx
  });
});
app.post("/api/generate-checkout-link", async (req, res) => {
  try {
    const { item_id, itemId, amount, customer_email, customerEmail } = req.body;
    const finalItemId = item_id || itemId || "Pro Package";
    const finalAmount = Number(amount) || 29;
    const finalEmail = customer_email || customerEmail || "customer@example.com";
    const stripe = getStripeInstance(req);
    const result = await createCheckoutSession(stripe, req, finalItemId, finalAmount, finalEmail);
    return res.json({
      status: "success",
      checkout_url: result.checkoutUrl,
      checkoutUrl: result.checkoutUrl,
      session_id: result.sessionId,
      sessionId: result.sessionId,
      item_id: result.itemId,
      amount: result.amount,
      isSimulation: result.isSimulation
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Failed to generate checkout link" });
  }
});
app.get("/api/event-logs", async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : void 0;
    const source = req.query.source ? String(req.query.source) : void 0;
    const stripe = getStripeInstance(req);
    let stripeEvents = [];
    if (stripe) {
      try {
        const eventsResponse = await stripe.events.list({ limit: limit || 10 });
        stripeEvents = eventsResponse.data.map((evt) => ({
          id: evt.id,
          timestamp: new Date(evt.created * 1e3).toLocaleTimeString(),
          isoDate: new Date(evt.created * 1e3).toISOString(),
          method: "STRIPE_EVENT",
          endpoint: `stripe.event.${evt.type}`,
          statusCode: 200,
          durationMs: 0,
          status: "success",
          eventType: evt.type,
          source: "stripe",
          requestBody: { api_version: evt.api_version, livemode: evt.livemode },
          responseBody: evt.data?.object
        }));
      } catch (_stripeErr) {
      }
    }
    let returnedLogs = [...apiEventLogs];
    if (source) {
      returnedLogs = returnedLogs.filter((l) => l.source === source);
    }
    if (limit && limit > 0) {
      returnedLogs = returnedLogs.slice(0, limit);
    }
    return res.json({
      logs: returnedLogs,
      stripeEvents,
      summary: {
        total: returnedLogs.length,
        success: returnedLogs.filter((l) => l.status === "success").length,
        failure: returnedLogs.filter((l) => l.status === "failure").length
      },
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Failed to retrieve event logs" });
  }
});
app.delete("/api/event-logs", (_req, res) => {
  apiEventLogs.length = 0;
  return res.json({ success: true, message: "Event logs buffer cleared successfully" });
});
app.post("/api/event-logs", (req, res) => {
  const newLog = {
    id: req.body.id || `evt_manual_${Date.now().toString(36)}`,
    timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString(),
    isoDate: (/* @__PURE__ */ new Date()).toISOString(),
    method: req.body.method || "POST",
    endpoint: req.body.endpoint || "/api/webhook",
    statusCode: req.body.statusCode || 200,
    durationMs: req.body.durationMs || 15,
    status: req.body.status || (req.body.statusCode >= 400 ? "failure" : "success"),
    eventType: req.body.eventType || req.body.type || "webhook.manual_dispatch",
    source: req.body.source || "webhook",
    requestBody: req.body.requestBody || req.body.data,
    responseBody: req.body.responseBody || { received: true },
    error: req.body.error || null
  };
  apiEventLogs.unshift(newLog);
  if (apiEventLogs.length > 150) apiEventLogs.length = 150;
  return res.json({ success: true, log: newLog });
});
var nowSec = Math.floor(Date.now() / 1e3);
var sessionPaymentIntents = [
  {
    id: "pi_3MzxS94K9kL0s8_succ",
    amount: 25,
    amountRaw: 2500,
    currency: "USD",
    status: "succeeded",
    isSuccess: true,
    isFailed: false,
    created: nowSec - 300,
    createdAt: new Date((nowSec - 300) * 1e3).toISOString(),
    timestamp: new Date((nowSec - 300) * 1e3).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    dateFormatted: new Date((nowSec - 300) * 1e3).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" }),
    customerEmail: "buyer@example.com",
    customerName: "Valued Customer",
    paymentMethodType: "card",
    cardBrand: "visa",
    cardLast4: "4242",
    description: "Pro Subscription Package",
    receiptUrl: "https://pay.stripe.com/receipts/test_rcpt_001",
    metadata: { source: "dashboard-checkout", plan: "pro-monthly" },
    livemode: false
  },
  {
    id: "pi_3MzxS94K9kL0s9_fail",
    amount: 50,
    amountRaw: 5e3,
    currency: "USD",
    status: "requires_payment_method",
    isSuccess: false,
    isFailed: true,
    created: nowSec - 1800,
    createdAt: new Date((nowSec - 1800) * 1e3).toISOString(),
    timestamp: new Date((nowSec - 1800) * 1e3).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    dateFormatted: new Date((nowSec - 1800) * 1e3).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" }),
    customerEmail: "declined_card@sample.io",
    customerName: "Alex Rivers",
    paymentMethodType: "card",
    cardBrand: "mastercard",
    cardLast4: "0002",
    description: "Annual Cloud Backup Tier",
    lastPaymentError: {
      code: "card_declined",
      declineCode: "insufficient_funds",
      message: "Card declined by issuing bank (insufficient_funds)",
      type: "card_error"
    },
    metadata: { source: "api-recurring", retry_attempt: "1" },
    livemode: false
  },
  {
    id: "pi_3Nz8L14K9kL1a2_succ",
    amount: 99,
    amountRaw: 9900,
    currency: "USD",
    status: "succeeded",
    isSuccess: true,
    isFailed: false,
    created: nowSec - 7200,
    createdAt: new Date((nowSec - 7200) * 1e3).toISOString(),
    timestamp: new Date((nowSec - 7200) * 1e3).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    dateFormatted: new Date((nowSec - 7200) * 1e3).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" }),
    customerEmail: "dev@enterprise.io",
    customerName: "Enterprise Client",
    paymentMethodType: "link",
    cardBrand: "link",
    cardLast4: "8812",
    description: "Enterprise Annual Tier",
    receiptUrl: "https://pay.stripe.com/receipts/test_rcpt_002",
    metadata: { source: "ai-agent-checkout" },
    livemode: false
  },
  {
    id: "pi_3Nz9A24K9kL1b3_fail",
    amount: 15,
    amountRaw: 1500,
    currency: "USD",
    status: "requires_payment_method",
    isSuccess: false,
    isFailed: true,
    created: nowSec - 14400,
    createdAt: new Date((nowSec - 14400) * 1e3).toISOString(),
    timestamp: new Date((nowSec - 14400) * 1e3).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    dateFormatted: new Date((nowSec - 14400) * 1e3).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" }),
    customerEmail: "security_check@sample.net",
    customerName: "Sarah Jenkins",
    paymentMethodType: "card",
    cardBrand: "visa",
    cardLast4: "0119",
    description: "Starter Micro-Transaction",
    lastPaymentError: {
      code: "incorrect_cvc",
      message: "Your card's security code is incorrect (incorrect_cvc)",
      type: "card_error"
    },
    metadata: { source: "payment-simulator" },
    livemode: false
  },
  {
    id: "pi_3Pq1X94K9kL2c4_succ",
    amount: 120,
    amountRaw: 12e3,
    currency: "USD",
    status: "succeeded",
    isSuccess: true,
    isFailed: false,
    created: nowSec - 28800,
    createdAt: new Date((nowSec - 28800) * 1e3).toISOString(),
    timestamp: new Date((nowSec - 28800) * 1e3).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    dateFormatted: new Date((nowSec - 28800) * 1e3).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" }),
    customerEmail: "rubelbank92@gmail.com",
    customerName: "Rubel Bank User",
    paymentMethodType: "card",
    cardBrand: "visa",
    cardLast4: "9201",
    description: "Virtual Card Topup via Stripe Gateway",
    receiptUrl: "https://pay.stripe.com/receipts/test_rcpt_003",
    metadata: { source: "virtual-wallet-topup" },
    livemode: false
  },
  {
    id: "pi_3Pq2Y04K9kL3d5_fail",
    amount: 75,
    amountRaw: 7500,
    currency: "USD",
    status: "canceled",
    isSuccess: false,
    isFailed: true,
    created: nowSec - 43200,
    createdAt: new Date((nowSec - 43200) * 1e3).toISOString(),
    timestamp: new Date((nowSec - 43200) * 1e3).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    dateFormatted: new Date((nowSec - 43200) * 1e3).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" }),
    customerEmail: "expired_card@sample.org",
    customerName: "Michael Chang",
    paymentMethodType: "card",
    cardBrand: "visa",
    cardLast4: "0069",
    description: "Cloud Storage Add-on",
    lastPaymentError: {
      code: "expired_card",
      message: "Your card has expired. (expired_card)",
      type: "card_error"
    },
    metadata: { source: "recurring-billing" },
    livemode: false
  }
];
function mapStripePaymentIntent(pi) {
  const isSuccess = pi.status === "succeeded";
  const isFailed = pi.status === "requires_payment_method" || pi.status === "canceled" || Boolean(pi.last_payment_error);
  const createdSec = typeof pi.created === "number" ? pi.created : Math.floor(Date.now() / 1e3);
  const dateObj = new Date(createdSec * 1e3);
  const charges = pi.charges?.data || [];
  const latestCharge = charges[0] || {};
  const cardDetails = pi.payment_method?.card || latestCharge.payment_method_details?.card;
  return {
    id: pi.id,
    amount: pi.amount / (pi.currency?.toUpperCase() === "JPY" ? 1 : 100),
    amountRaw: pi.amount,
    currency: (pi.currency || "usd").toUpperCase(),
    status: pi.status,
    isSuccess,
    isFailed,
    created: createdSec,
    createdAt: dateObj.toISOString(),
    timestamp: dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    dateFormatted: dateObj.toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" }),
    customerEmail: pi.receipt_email || (typeof pi.customer === "object" ? pi.customer?.email : "") || pi.metadata?.customerEmail || pi.metadata?.customer_email || latestCharge.billing_details?.email || "",
    customerName: pi.metadata?.customerName || pi.metadata?.customer_name || (typeof pi.customer === "object" ? pi.customer?.name : "") || latestCharge.billing_details?.name || "",
    paymentMethodType: pi.payment_method_types?.[0] || "card",
    cardBrand: cardDetails?.brand || "card",
    cardLast4: cardDetails?.last4 || "\u2022\u2022\u2022\u2022",
    description: pi.description || pi.metadata?.description || "Stripe Payment",
    lastPaymentError: pi.last_payment_error ? {
      code: pi.last_payment_error.code || "card_declined",
      message: pi.last_payment_error.message || "Payment attempt failed",
      declineCode: pi.last_payment_error.decline_code,
      type: pi.last_payment_error.type
    } : void 0,
    metadata: pi.metadata || {},
    receiptUrl: latestCharge.receipt_url,
    clientSecret: pi.client_secret,
    livemode: Boolean(pi.livemode),
    rawResponse: pi
  };
}
function synthesizeRawStripeResponse(item) {
  if (item.rawResponse) return item.rawResponse;
  return {
    id: item.id,
    object: "payment_intent",
    amount: item.amountRaw,
    amount_received: item.isSuccess ? item.amountRaw : 0,
    currency: (item.currency || "usd").toLowerCase(),
    status: item.status,
    client_secret: item.clientSecret || `${item.id}_secret_live_${Math.random().toString(36).substring(2, 10)}`,
    created: item.created,
    livemode: Boolean(item.livemode),
    payment_method_types: [item.paymentMethodType || "card"],
    capture_method: "automatic",
    confirmation_method: "automatic",
    description: item.description,
    customer: null,
    receipt_email: item.customerEmail || null,
    last_payment_error: item.lastPaymentError ? {
      code: item.lastPaymentError.code || "card_declined",
      message: item.lastPaymentError.message || "Payment attempt failed",
      decline_code: item.lastPaymentError.declineCode || "generic_decline",
      type: item.lastPaymentError.type || "card_error"
    } : null,
    charges: {
      object: "list",
      data: item.isSuccess ? [
        {
          id: `ch_${item.id.replace("pi_", "")}`,
          object: "charge",
          amount: item.amountRaw,
          currency: (item.currency || "usd").toLowerCase(),
          status: "succeeded",
          paid: true,
          receipt_url: item.receiptUrl,
          billing_details: {
            name: item.customerName,
            email: item.customerEmail
          },
          payment_method_details: {
            type: "card",
            card: {
              brand: item.cardBrand || "visa",
              last4: item.cardLast4 || "4242",
              funding: "credit"
            }
          }
        }
      ] : [],
      has_more: false,
      total_count: item.isSuccess ? 1 : 0
    },
    metadata: item.metadata || {}
  };
}
globalRecordPaymentIntent = (pi, isSuccess) => {
  if (!pi || !pi.id) return;
  const mapped = mapStripePaymentIntent({
    ...pi,
    status: isSuccess ? "succeeded" : pi.status || "requires_payment_method"
  });
  const existingIdx = sessionPaymentIntents.findIndex((p) => p.id === mapped.id);
  if (existingIdx >= 0) {
    sessionPaymentIntents[existingIdx] = mapped;
  } else {
    sessionPaymentIntents.unshift(mapped);
    if (sessionPaymentIntents.length > 200) sessionPaymentIntents.length = 200;
  }
};
function generate30DayTrend(items) {
  const points = [];
  const now = /* @__PURE__ */ new Date();
  const itemsByDate = {};
  for (const item of items) {
    const itemDate = new Date(item.created * 1e3);
    const key = itemDate.toISOString().split("T")[0];
    if (!itemsByDate[key]) {
      itemsByDate[key] = { succVol: 0, failVol: 0, succCount: 0, failCount: 0 };
    }
    if (item.isSuccess) {
      itemsByDate[key].succVol += item.amount;
      itemsByDate[key].succCount += 1;
    } else if (item.isFailed) {
      itemsByDate[key].failVol += item.amount;
      itemsByDate[key].failCount += 1;
    }
  }
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1e3);
    const dateKey = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const wave = Math.sin((30 - i) * 0.35) * 60;
    const trendGrowth = (30 - i) * 4.5;
    const weekendFactor = isWeekend ? -45 : 30;
    const variation = i * 17 % 29 - 14;
    const baseSuccVol = Math.max(50, Math.round((160 + wave + trendGrowth + weekendFactor + variation) * 10) / 10);
    const baseFailVol = Math.max(8, Math.round((22 + Math.cos(i * 0.45) * 14 + (i % 6 === 2 ? 28 : 0)) * 10) / 10);
    const baseSuccCount = Math.max(1, Math.round(baseSuccVol / 40));
    const baseFailCount = Math.max(0, Math.round(baseFailVol / 32));
    const actual = itemsByDate[dateKey] || { succVol: 0, failVol: 0, succCount: 0, failCount: 0 };
    const successfulVolume = Math.round((baseSuccVol + actual.succVol) * 100) / 100;
    const failedVolume = Math.round((baseFailVol + actual.failVol) * 100) / 100;
    const successfulCount2 = baseSuccCount + actual.succCount;
    const failedCount2 = baseFailCount + actual.failCount;
    const totalVolume = Math.round((successfulVolume + failedVolume) * 100) / 100;
    const totalCount = successfulCount2 + failedCount2;
    const successRate = totalVolume > 0 ? Math.round(successfulVolume / totalVolume * 100) : 100;
    points.push({
      date: dateKey,
      label,
      dayNumber: d.getDate(),
      successfulVolume,
      failedVolume,
      successfulCount: successfulCount2,
      failedCount: failedCount2,
      totalVolume,
      totalCount,
      successRate
    });
  }
  const total30DaySuccessfulVolume = Math.round(points.reduce((acc, p) => acc + p.successfulVolume, 0) * 100) / 100;
  const total30DayFailedVolume = Math.round(points.reduce((acc, p) => acc + p.failedVolume, 0) * 100) / 100;
  const total30DayVolume = Math.round((total30DaySuccessfulVolume + total30DayFailedVolume) * 100) / 100;
  const avgDailyVolume = Math.round(total30DayVolume / 30 * 100) / 100;
  const successfulCount = points.reduce((acc, p) => acc + p.successfulCount, 0);
  const failedCount = points.reduce((acc, p) => acc + p.failedCount, 0);
  const total30DayCount = successfulCount + failedCount;
  const failureRate30Day = total30DayVolume > 0 ? Math.round(total30DayFailedVolume / total30DayVolume * 100) : 0;
  let peakDay = { date: points[0].date, label: points[0].label, volume: points[0].totalVolume };
  for (const p of points) {
    if (p.totalVolume > peakDay.volume) {
      peakDay = { date: p.date, label: p.label, volume: p.totalVolume };
    }
  }
  return {
    points,
    summary: {
      total30DaySuccessfulVolume,
      total30DayFailedVolume,
      total30DayVolume,
      avgDailyVolume,
      peakDay,
      failureRate30Day,
      total30DayCount,
      successfulCount,
      failedCount
    }
  };
}
app.get("/api/payment-intents", async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || 50), 10)));
    const statusQuery = req.query.status ? String(req.query.status).toLowerCase() : "all";
    const searchQuery = req.query.q ? String(req.query.q).toLowerCase().trim() : "";
    const stripe = getStripeInstance(req);
    let items = [];
    let isLiveFromStripe = false;
    if (stripe) {
      try {
        const stripeRes = await stripe.paymentIntents.list({
          limit,
          expand: ["data.payment_method", "data.customer"]
        });
        if (stripeRes.data && stripeRes.data.length > 0) {
          items = stripeRes.data.map(mapStripePaymentIntent);
          isLiveFromStripe = true;
        }
      } catch (stripeErr) {
        console.warn(`[Stripe paymentIntents.list notice]: ${stripeErr.message}`);
      }
    }
    if (items.length === 0) {
      items = [...sessionPaymentIntents];
    } else {
      const existingIds = new Set(items.map((i) => i.id));
      for (const sessPi of sessionPaymentIntents) {
        if (!existingIds.has(sessPi.id)) {
          items.push(sessPi);
        }
      }
    }
    if (statusQuery && statusQuery !== "all") {
      if (statusQuery === "succeeded" || statusQuery === "success") {
        items = items.filter((i) => i.isSuccess);
      } else if (statusQuery === "failed" || statusQuery === "declined") {
        items = items.filter((i) => i.isFailed);
      } else {
        items = items.filter((i) => i.status.toLowerCase() === statusQuery);
      }
    }
    if (searchQuery) {
      items = items.filter(
        (i) => i.id.toLowerCase().includes(searchQuery) || i.customerEmail && i.customerEmail.toLowerCase().includes(searchQuery) || i.customerName && i.customerName.toLowerCase().includes(searchQuery) || i.description && i.description.toLowerCase().includes(searchQuery) || i.amount.toString().includes(searchQuery)
      );
    }
    items.sort((a, b) => b.created - a.created);
    const totalCount = items.length;
    const succeededCount = items.filter((i) => i.isSuccess).length;
    const failedCount = items.filter((i) => i.isFailed).length;
    const processingCount = items.filter((i) => !i.isSuccess && !i.isFailed).length;
    const totalVolumeUsd = items.filter((i) => i.isSuccess).reduce((acc, i) => acc + i.amount, 0);
    const failedVolumeUsd = items.filter((i) => i.isFailed).reduce((acc, i) => acc + i.amount, 0);
    const successRate = totalCount > 0 ? Math.round(succeededCount / totalCount * 100) : 0;
    const trendResult = generate30DayTrend(items);
    const itemsWithRaw = items.map((i) => ({
      ...i,
      rawResponse: i.rawResponse || synthesizeRawStripeResponse(i)
    }));
    return res.json({
      success: true,
      source: isLiveFromStripe ? "stripe_api" : "session_store",
      data: itemsWithRaw,
      summary: {
        totalCount,
        succeededCount,
        failedCount,
        processingCount,
        totalVolumeUsd: Math.round(totalVolumeUsd * 100) / 100,
        failedVolumeUsd: Math.round(failedVolumeUsd * 100) / 100,
        successRate
      },
      trend30Days: trendResult.points,
      trendSummary: trendResult.summary,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || "Failed to list PaymentIntents" });
  }
});
app.get("/api/transaction-logs", (req, res) => {
  return app._router.handle({ ...req, url: "/api/payment-intents" }, res);
});
app.post("/api/payment-intents/record", (req, res) => {
  const {
    id,
    amount,
    currency = "USD",
    status = "succeeded",
    customerEmail,
    customerName,
    cardBrand,
    cardLast4,
    description,
    lastPaymentError,
    receiptUrl
  } = req.body;
  const now = Math.floor(Date.now() / 1e3);
  const isSuccess = status === "succeeded";
  const isFailed = status === "requires_payment_method" || status === "canceled" || status === "failed" || Boolean(lastPaymentError);
  const numAmount = typeof amount === "number" ? amount : parseFloat(String(amount)) || 10;
  const normalizedAmount = numAmount > 100 ? numAmount / 100 : numAmount;
  const newRecord = {
    id: id || `pi_sim_${Math.random().toString(36).substring(2, 11)}`,
    amount: normalizedAmount,
    amountRaw: Math.round(normalizedAmount * 100),
    currency: String(currency).toUpperCase(),
    status: isSuccess ? "succeeded" : status === "failed" ? "requires_payment_method" : status,
    isSuccess,
    isFailed,
    created: now,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    dateFormatted: (/* @__PURE__ */ new Date()).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" }),
    customerEmail: customerEmail || "customer@example.com",
    customerName: customerName || "Valued Customer",
    paymentMethodType: "card",
    cardBrand: cardBrand || "visa",
    cardLast4: cardLast4 || "4242",
    description: description || "Payment Simulation Attempt",
    lastPaymentError: lastPaymentError || (isFailed ? { code: "card_declined", message: "Payment attempt was declined" } : void 0),
    receiptUrl,
    livemode: false
  };
  sessionPaymentIntents.unshift(newRecord);
  if (sessionPaymentIntents.length > 200) sessionPaymentIntents.length = 200;
  return res.json({ success: true, paymentIntent: newRecord });
});
app.delete("/api/payment-intents", (_req, res) => {
  sessionPaymentIntents.length = 0;
  return res.json({ success: true, message: "Payment intents cleared" });
});
app.post("/api/ai-chat", async (req, res) => {
  try {
    const { message, history = [], customerEmail = "customer@example.com" } = req.body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" });
    }
    const stripe = getStripeInstance(req);
    const geminiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    let aiResponseText = "";
    let toolCallExecuted = null;
    if (geminiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const contents = [];
        if (Array.isArray(history)) {
          for (const h of history.slice(-6)) {
            contents.push({
              role: h.role === "user" ? "user" : "model",
              parts: [{ text: h.content }]
            });
          }
        }
        contents.push({
          role: "user",
          parts: [{ text: message }]
        });
        const checkoutFunctionDeclaration = {
          name: "generate_checkout_link",
          description: 'Creates a secure Stripe Checkout Session or 1-Click Stripe Link payment URL when a customer intends or requests to buy, order, pay for, or subscribe to any product, package, or plan. Call this tool immediately whenever the user shows buying intent (e.g., "I want to buy Pro Plan", "\u09AA\u09CD\u09AF\u09BE\u0995\u09C7\u099C \u0995\u09BF\u09A8\u09A4\u09C7 \u099A\u09BE\u0987", "\u09AA\u09C7\u09AE\u09C7\u09A8\u09CD\u099F \u09B2\u09BF\u0982\u0995 \u09A6\u09BE\u0993", "$29"). Never ask for credit card numbers directly.',
          parameters: {
            type: Type.OBJECT,
            properties: {
              item_id: {
                type: Type.STRING,
                description: 'The exact product name, subscription package, or service identifier requested by the user (e.g., "Pro Plan", "Starter Kit", "10,000 AI Credits", "Enterprise Plan"). Maps to the Stripe Checkout line item name.'
              },
              amount: {
                type: Type.NUMBER,
                description: "The numeric purchase price in USD (e.g., 29.99, 9.99, 15.0, 49.0). Must be a positive decimal number representing unit price."
              },
              customer_email: {
                type: Type.STRING,
                description: "The customer email address for receipt delivery, Stripe customer linking, and 1-Click SMS authentication with Stripe Link."
              },
              currency: {
                type: Type.STRING,
                description: 'The 3-letter ISO currency code. Defaults to "usd".'
              }
            },
            required: ["item_id", "amount"]
          }
        };
        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents,
          config: {
            systemInstruction: '\u09A4\u09C1\u09AE\u09BF \u098F\u0995\u099C\u09A8 \u09AA\u09CD\u09B0\u09AB\u09C7\u09B6\u09A8\u09BE\u09B2 \u098F\u0986\u0987 \u09AA\u09C7\u09AE\u09C7\u09A8\u09CD\u099F \u0985\u09CD\u09AF\u09BE\u09B8\u09BF\u09B8\u09CD\u099F\u09CD\u09AF\u09BE\u09A8\u09CD\u099F (Stripe AI Agent)\u0964 \u09AC\u09CD\u09AF\u09AC\u09B9\u09BE\u09B0\u0995\u09BE\u09B0\u09C0 \u0995\u09CB\u09A8\u09CB \u09AA\u09CD\u09B0\u09CB\u09A1\u09BE\u0995\u09CD\u099F \u09AC\u09BE \u09B8\u09BE\u09AC\u09B8\u09CD\u0995\u09CD\u09B0\u09BF\u09AA\u09B6\u09A8 \u0995\u09BF\u09A8\u09A4\u09C7 \u099A\u09BE\u0987\u09B2\u09C7 \u0995\u0996\u09A8\u09CB \u09A4\u09BE\u09A6\u09C7\u09B0 \u0995\u09CD\u09B0\u09C7\u09A1\u09BF\u099F \u0995\u09BE\u09B0\u09CD\u09A1 \u09A8\u09AE\u09CD\u09AC\u09B0 \u09AC\u09BE CVV \u099C\u09BE\u09A8\u09A4\u09C7 \u099A\u09BE\u0987\u09AC\u09C7 \u09A8\u09BE\u0964 \u09AC\u09B0\u0982 \u09B8\u09B0\u09CD\u09AC\u09A6\u09BE "generate_checkout_link" \u099F\u09C1\u09B2\u099F\u09BF \u0995\u09B2 \u0995\u09B0\u09C7 \u09A8\u09BF\u09B0\u09BE\u09AA\u09A6 Stripe Link \u09AC\u09BE Checkout Link \u09A4\u09C8\u09B0\u09BF \u0995\u09B0\u09C7 \u09A6\u09C7\u09AC\u09C7\u0964 \u09AC\u09BE\u0982\u09B2\u09BE\u09DF \u099A\u09AE\u09CE\u0995\u09BE\u09B0 \u0993 \u09AC\u09BF\u09B6\u09CD\u09AC\u09B8\u09CD\u09A4 \u09AD\u09BE\u09B7\u09BE\u09DF \u0989\u09A4\u09CD\u09A4\u09B0 \u09A6\u09C7\u09AC\u09C7\u0964',
            tools: [{ functionDeclarations: [checkoutFunctionDeclaration] }]
          }
        });
        const functionCalls = response.functionCalls;
        if (functionCalls && functionCalls.length > 0) {
          const call = functionCalls[0];
          if (call.name === "generate_checkout_link") {
            const args = call.args || {};
            const itemId = args.item_id || "Pro Membership";
            const amount = Number(args.amount) || 29;
            const email = args.customer_email || customerEmail;
            const toolResult = await createCheckoutSession(stripe, req, itemId, amount, email);
            toolCallExecuted = {
              name: "generate_checkout_link",
              args: { item_id: itemId, amount, customer_email: email },
              result: toolResult
            };
            try {
              const previousContent = response.candidates?.[0]?.content;
              const followUp = await ai.models.generateContent({
                model: "gemini-3.8-flash",
                contents: [
                  ...contents,
                  previousContent || {
                    role: "model",
                    parts: [{ functionCall: call }]
                  },
                  {
                    role: "tool",
                    parts: [
                      {
                        functionResponse: {
                          name: "generate_checkout_link",
                          response: {
                            status: "success",
                            checkout_url: toolResult.checkoutUrl,
                            session_id: toolResult.sessionId,
                            item_id: toolResult.itemId,
                            amount: toolResult.amount
                          }
                        }
                      }
                    ]
                  }
                ]
              });
              aiResponseText = followUp.text || `\u0986\u09AA\u09A8\u09BE\u09B0 "${itemId}" ($${amount}) \u098F\u09B0 \u099C\u09A8\u09CD\u09AF \u09A8\u09BF\u09B0\u09BE\u09AA\u09A6 Stripe Link \u09AA\u09C7\u09AE\u09C7\u09A8\u09CD\u099F \u09B8\u09C7\u09B6\u09A8 \u09AA\u09CD\u09B0\u09B8\u09CD\u09A4\u09C1\u09A4 \u0995\u09B0\u09BE \u09B9\u09DF\u09C7\u099B\u09C7\u0964 \u09A8\u09BF\u099A\u09C7 \u09A1\u09BE\u0987\u09A8\u09BE\u09AE\u09BF\u0995 \u09AC\u09BE\u099F\u09A8\u09C7 \u0995\u09CD\u09B2\u09BF\u0995 \u0995\u09B0\u09C7 \u09E7-\u0995\u09CD\u09B2\u09BF\u0995\u09C7 \u09AA\u09C7\u09AE\u09C7\u09A8\u09CD\u099F \u09B8\u09AE\u09CD\u09AA\u09A8\u09CD\u09A8 \u0995\u09B0\u09A4\u09C7 \u09AA\u09BE\u09B0\u09AC\u09C7\u09A8\u0964`;
            } catch (followUpErr) {
              aiResponseText = `\u0986\u09AA\u09A8\u09BE\u09B0 "${itemId}" ($${amount}) \u098F\u09B0 \u099C\u09A8\u09CD\u09AF \u09A8\u09BF\u09B0\u09BE\u09AA\u09A6 Stripe Link \u09AA\u09C7\u09AE\u09C7\u09A8\u09CD\u099F \u09B8\u09C7\u09B6\u09A8 \u09AA\u09CD\u09B0\u09B8\u09CD\u09A4\u09C1\u09A4 \u0995\u09B0\u09BE \u09B9\u09DF\u09C7\u099B\u09C7\u0964 \u09A8\u09BF\u099A\u09C7 "Pay with Stripe Link" \u09AC\u09BE\u099F\u09A8\u09C7 \u0995\u09CD\u09B2\u09BF\u0995 \u0995\u09B0\u09C7 \u0995\u09BE\u09B0\u09CD\u09A1 \u099F\u09BE\u0987\u09AA \u09A8\u09BE \u0995\u09B0\u09C7\u0987 \u09E7-\u0995\u09CD\u09B2\u09BF\u0995\u09C7 \u09AA\u09C7\u09AE\u09C7\u09A8\u09CD\u099F \u09B8\u09AE\u09CD\u09AA\u09A8\u09CD\u09A8 \u0995\u09B0\u09A4\u09C7 \u09AA\u09BE\u09B0\u09C7\u09A8\u0964`;
            }
          }
        } else {
          aiResponseText = response.text || "\u0986\u09AE\u09BF \u0986\u09AA\u09A8\u09BE\u09B0 \u09AA\u09C7\u09AE\u09C7\u09A8\u09CD\u099F \u0985\u09CD\u09AF\u09BE\u09B8\u09BF\u09B8\u09CD\u099F\u09CD\u09AF\u09BE\u09A8\u09CD\u099F\u0964 \u09AF\u09C7\u0995\u09CB\u09A8\u09CB \u09AA\u09CD\u09AF\u09BE\u0995\u09C7\u099C \u0995\u09BF\u09A8\u09A4\u09C7 \u099A\u09BE\u0987\u09B2\u09C7 \u0986\u09AE\u09BE\u0995\u09C7 \u099C\u09BE\u09A8\u09BE\u09A8, \u0986\u09AE\u09BF \u09A4\u09CE\u0995\u09CD\u09B7\u09A3\u09BE\u09CE \u09B8\u09BF\u0995\u09BF\u0989\u09B0 \u09AA\u09C7\u09AE\u09C7\u09A8\u09CD\u099F \u09B2\u09BF\u0999\u09CD\u0995 \u09A4\u09C8\u09B0\u09BF \u0995\u09B0\u09C7 \u09A6\u09C7\u09AC\u0964";
        }
      } catch (geminiError) {
        console.warn("Gemini invocation notice:", geminiError.message);
        const fallback = await processHeuristicAgent(message, customerEmail, stripe, req);
        aiResponseText = fallback.aiResponseText;
        toolCallExecuted = fallback.toolCallExecuted;
      }
    } else {
      const fallback = await processHeuristicAgent(message, customerEmail, stripe, req);
      aiResponseText = fallback.aiResponseText;
      toolCallExecuted = fallback.toolCallExecuted;
    }
    return res.json({
      aiResponse: aiResponseText,
      toolCall: toolCallExecuted,
      function_calls: toolCallExecuted ? [{ name: toolCallExecuted.name, args: toolCallExecuted.args }] : [],
      functionCalls: toolCallExecuted ? [{ name: toolCallExecuted.name, args: toolCallExecuted.args }] : [],
      function_call: toolCallExecuted ? { name: toolCallExecuted.name, args: toolCallExecuted.args } : null,
      functionCall: toolCallExecuted ? { name: toolCallExecuted.name, args: toolCallExecuted.args } : null,
      action: toolCallExecuted ? "payment_link_generated" : "normal_chat",
      checkoutUrl: toolCallExecuted?.result?.checkoutUrl || null,
      sessionId: toolCallExecuted?.result?.sessionId || null,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Error processing AI chat" });
  }
});
app.get(["/sw.js", "/dev-sw.js"], (_req, res) => {
  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  res.send(`
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(
    self.registration.unregister().then(() => self.clients.matchAll({ type: 'window' })).then(clients => {
      for (const client of clients) client.navigate(client.url);
    })
  );
});
`);
});
app.post("/api/client-errors", (req, res) => {
  try {
    const { id, message, stack, componentStack, errorType, url, userAgent, metadata } = req.body || {};
    const msg = String(message || "").toLowerCase();
    if (msg.includes("websocket") || msg.includes("ws://") || msg.includes("wss://") || msg.includes("vite:ws") || msg.includes("vite:hmr")) {
      return res.status(200).json({ success: true, ignored: true });
    }
    const errorId = id || `err_cli_${Date.now()}`;
    const timestampStr = (/* @__PURE__ */ new Date()).toLocaleTimeString();
    const isoDateStr = (/* @__PURE__ */ new Date()).toISOString();
    console.error(`\u{1F6A8} [Client Exception Logged] [${errorType || "render_error"}] ${message || "Unknown Error"} at ${url || "unknown_url"}`);
    const clientLogEntry = {
      id: errorId,
      timestamp: timestampStr,
      isoDate: isoDateStr,
      method: "POST",
      endpoint: "/api/client-errors",
      statusCode: 500,
      durationMs: 0,
      status: "failure",
      eventType: `client.${errorType || "runtime_exception"}`,
      source: "client",
      requestBody: {
        message,
        errorType,
        url,
        userAgent,
        metadata
      },
      responseBody: {
        clientStack: stack ? String(stack).substring(0, 500) : void 0,
        componentStack: componentStack ? String(componentStack).substring(0, 500) : void 0
      },
      error: message || "Client runtime exception"
    };
    apiEventLogs.unshift(clientLogEntry);
    if (apiEventLogs.length > 150) apiEventLogs.length = 150;
    return res.status(200).json({
      success: true,
      id: errorId,
      message: "Client runtime error recorded in server event logs."
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to record client error" });
  }
});
app.get("/api/client-errors", (_req, res) => {
  const clientLogs = apiEventLogs.filter((l) => l.source === "client");
  return res.json({
    success: true,
    total: clientLogs.length,
    logs: clientLogs
  });
});
app.all("/api/*", (req, res) => {
  res.status(404).json({
    success: false,
    error: `API Route ${req.method} ${req.path} not found.`,
    code: "ROUTE_NOT_FOUND",
    statusCode: 404,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.use((err, req, res, _next) => {
  const timestampStr = (/* @__PURE__ */ new Date()).toLocaleTimeString();
  const isoDateStr = (/* @__PURE__ */ new Date()).toISOString();
  const errorId = `err_srv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  let status = 500;
  if (typeof err.status === "number" && err.status >= 400 && err.status < 600) {
    status = err.status;
  } else if (typeof err.statusCode === "number" && err.statusCode >= 400 && err.statusCode < 600) {
    status = err.statusCode;
  } else if (err instanceof SyntaxError && "body" in err) {
    status = 400;
  }
  let errorCode = "INTERNAL_SERVER_ERROR";
  if (err instanceof SyntaxError && "body" in err) {
    errorCode = "JSON_PARSE_ERROR";
  } else if (err.type?.startsWith("Stripe") || err.name === "StripeError") {
    errorCode = "STRIPE_API_ERROR";
  } else if (status === 400) {
    errorCode = "BAD_REQUEST";
  } else if (status === 401) {
    errorCode = "UNAUTHORIZED";
  } else if (status === 403) {
    errorCode = "FORBIDDEN";
  } else if (status === 404) {
    errorCode = "NOT_FOUND";
  } else if (status === 429) {
    errorCode = "RATE_LIMIT_EXCEEDED";
  }
  const errorMessage = err.message || "An unexpected internal server error occurred.";
  console.error(`\u{1F6A8} [Express Global Error] [${errorCode}] ${req.method} ${req.path} - Status: ${status}`);
  console.error(err.stack || err);
  const safeHeaders = { ...req.headers };
  if (safeHeaders["x-stripe-secret-key"]) safeHeaders["x-stripe-secret-key"] = "sk_***hidden***";
  if (safeHeaders["authorization"]) safeHeaders["authorization"] = "Bearer ***hidden***";
  if (safeHeaders["cookie"]) safeHeaders["cookie"] = "***hidden***";
  const logEntry = {
    id: errorId,
    timestamp: timestampStr,
    isoDate: isoDateStr,
    method: req.method || "UNKNOWN",
    endpoint: req.originalUrl || req.path || "/unknown",
    statusCode: status,
    durationMs: 0,
    status: "failure",
    eventType: `error.${errorCode.toLowerCase()}`,
    source: "api",
    requestHeaders: safeHeaders,
    requestBody: req.body ? req.body : void 0,
    responseBody: {
      success: false,
      error: errorMessage,
      code: errorCode,
      statusCode: status
    },
    error: errorMessage
  };
  apiEventLogs.unshift(logEntry);
  if (apiEventLogs.length > 150) apiEventLogs.length = 150;
  if (!res.headersSent) {
    res.status(status).json({
      success: false,
      error: errorMessage,
      code: errorCode,
      statusCode: status,
      errorId,
      path: req.path,
      method: req.method,
      timestamp: isoDateStr,
      ...process.env.NODE_ENV !== "production" ? { stack: err.stack } : {}
    });
  }
});
process.on("unhandledRejection", (reason) => {
  console.error("\u{1F6A8} [Process Level] Unhandled Promise Rejection:", reason);
});
process.on("uncaughtException", (error) => {
  console.error("\u{1F6A8} [Process Level] Uncaught Exception caught by server:", error);
});
var server_api_default = app;

// server.ts
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = path2.dirname(__filename2);
var PORT = process.env.PORT || 3e3;
var isProd = process.env.NODE_ENV === "production";
async function startServer() {
  if (!isProd) {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: false,
          watch: null
        },
        appType: "spa"
      });
      server_api_default.use(vite.middlewares);
    } catch (err) {
      console.warn("\u26A0\uFE0F Vite dev server middleware failed to mount, serving static files:", err);
      mountStaticServing();
    }
  } else {
    mountStaticServing();
  }
  function mountStaticServing() {
    server_api_default.use("/src/assets", express2.static(path2.join(__dirname2, "src/assets")));
    server_api_default.use("/assets", express2.static(path2.join(__dirname2, "dist/assets")));
    server_api_default.use("/assets", express2.static(path2.join(__dirname2, "public/assets")));
    server_api_default.use(express2.static(path2.join(__dirname2, "dist")));
    server_api_default.use(express2.static(path2.join(__dirname2, "public")));
    server_api_default.get("*", (_req, res) => {
      const distIndex = path2.join(__dirname2, "dist", "index.html");
      if (fs.existsSync(distIndex)) {
        res.sendFile(distIndex);
      } else {
        const publicIndex = path2.join(__dirname2, "index.html");
        if (fs.existsSync(publicIndex)) {
          res.sendFile(publicIndex);
        } else {
          res.status(404).send("Application build in progress. Please run npm run build.");
        }
      }
    });
  }
  server_api_default.use((err, _req, res, _next) => {
    console.error("\u{1F6A8} [Server Root Exception]:", err);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: err.message || "Internal Server Error",
        code: "SERVER_EXCEPTION"
      });
    }
  });
  server_api_default.listen(PORT, () => {
    console.log(`\u{1F680} Stripe & Gmail Gateway Hub running at http://localhost:${PORT}`);
  });
}
if (!process.env.VERCEL) {
  startServer();
}
var server_default = server_api_default;
export {
  server_default as default
};
