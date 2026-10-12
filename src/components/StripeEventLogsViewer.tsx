import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Activity,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Terminal,
  Zap,
  Layers,
  ArrowUpRight,
  Code2,
  Send,
  X,
  Timer,
  RotateCw,
} from 'lucide-react';
import { ApiEventLog } from '../types';

interface StripeEventLogsViewerProps {
  lang?: 'bn' | 'en';
  pollingInterval?: number; // In milliseconds, default 30000 (30 seconds)
  onSelectEvent?: (event: ApiEventLog) => void;
}

export const StripeEventLogsViewer: React.FC<StripeEventLogsViewerProps> = ({
  lang = 'bn',
  pollingInterval = 30000,
  onSelectEvent,
}) => {
  const [events, setEvents] = useState<ApiEventLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(true);
  const [countdown, setCountdown] = useState<number>(Math.round(pollingInterval / 1000));
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failure'>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isInjectingSample, setIsInjectingSample] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>(new Date().toLocaleTimeString());
  const [replayingId, setReplayingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Fetch the last 10 Stripe webhook events from backend
  const fetchRecentWebhookEvents = useCallback(async (isBackground = false) => {
    if (!isBackground) setIsLoading(true);
    try {
      const res = await fetch('/api/event-logs?source=webhook&limit=10');
      if (res.ok) {
        const data = await res.json();
        // Extract webhook events and guarantee last 10
        const webhookEvents: ApiEventLog[] = (data.logs || [])
          .filter((l: ApiEventLog) => l.source === 'webhook' || l.endpoint === '/api/webhook')
          .slice(0, 10);
        setEvents(webhookEvents);
        setLastRefreshedAt(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error('Failed to fetch last 10 Stripe webhook events:', err);
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchRecentWebhookEvents();
  }, [fetchRecentWebhookEvents]);

  // 30-Second Polling & Countdown Mechanism
  useEffect(() => {
    if (!isPolling) return;

    // Reset countdown whenever polling starts or interval changes
    const totalSeconds = Math.max(1, Math.round(pollingInterval / 1000));
    setCountdown(totalSeconds);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Trigger the 30-second background fetch
          fetchRecentWebhookEvents(true);
          return totalSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPolling, pollingInterval, fetchRecentWebhookEvents]);

  // Copy helper
  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Replay a specific past webhook event with identical payload
  const handleReplayEvent = async (event: ApiEventLog, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setReplayingId(event.id);

    try {
      let payload = event.requestBody;
      if (!payload || Object.keys(payload).length === 0) {
        payload = event.responseBody;
      }

      if (!payload || typeof payload !== 'object' || Object.keys(payload).length === 0) {
        payload = {
          id: `evt_replay_${Math.random().toString(36).substring(2, 9)}`,
          type: event.eventType || 'payment_intent.succeeded',
          created: Math.floor(Date.now() / 1000),
          data: {
            object: {
              id: `obj_replay_${Math.random().toString(36).substring(2, 9)}`,
              amount: 2500,
              currency: 'usd',
              status: 'succeeded',
            },
          },
        };
      }

      const replayEndpoint =
        event.endpoint && event.endpoint.startsWith('/api')
          ? event.endpoint
          : '/api/webhook';

      const res = await fetch(replayEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': `t=${Math.floor(Date.now() / 1000)},v1=sig_replay_${Math.random().toString(36).substring(2, 10)}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status} Replay failed`);
      }

      showToast(
        lang === 'bn'
          ? `✅ [${event.eventType}] পে-লোড সফলভাবে পুনরায় পাঠানো হয়েছে (HTTP 200 OK)!`
          : `✅ Replayed [${event.eventType}] payload successfully (HTTP 200 OK)!`,
        'success'
      );

      // Immediately refetch logs so the replayed webhook appears at top
      await fetchRecentWebhookEvents(true);
      setCountdown(Math.round(pollingInterval / 1000));
    } catch (err: any) {
      console.error('Replay failed:', err);
      showToast(
        lang === 'bn'
          ? `❌ রিপ্লে ব্যর্থ হয়েছে: ${err.message}`
          : `❌ Replay failed: ${err.message}`,
        'error'
      );
    } finally {
      setReplayingId(null);
    }
  };

  // Dispatch a quick test event to see it immediately appear at the top of the 10 events
  const handleTriggerQuickWebhook = async () => {
    setIsInjectingSample(true);
    try {
      const sampleTypes = [
        'payment_intent.succeeded',
        'charge.succeeded',
        'invoice.payment_succeeded',
        'customer.subscription.created',
        'checkout.session.completed',
      ];
      const randomType = sampleTypes[Math.floor(Math.random() * sampleTypes.length)];
      const simId = 'evt_live_' + Math.random().toString(36).substring(2, 9);

      await fetch('/api/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': `t=${Math.floor(Date.now() / 1000)},v1=sig_${Math.random().toString(36).substring(2, 10)}`,
        },
        body: JSON.stringify({
          id: simId,
          type: randomType,
          created: Math.floor(Date.now() / 1000),
          data: {
            object: {
              id: 'obj_' + Math.random().toString(36).substring(2, 9),
              amount: 2500,
              currency: 'usd',
              status: 'succeeded',
            },
          },
        }),
      });

      // Refetch immediately and reset 30s countdown
      await fetchRecentWebhookEvents(true);
      setCountdown(Math.round(pollingInterval / 1000));
    } catch (err) {
      console.error('Failed to inject sample webhook:', err);
    } finally {
      setIsInjectingSample(false);
    }
  };

  // Filtered events
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (statusFilter === 'success' && ev.status !== 'success') return false;
      if (statusFilter === 'failure' && ev.status !== 'failure') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          ev.eventType.toLowerCase().includes(q) ||
          ev.id.toLowerCase().includes(q) ||
          String(ev.statusCode).includes(q) ||
          (ev.error && ev.error.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [events, statusFilter, searchQuery]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden text-left space-y-4 p-5 relative">
      {/* Replay Toast Notification */}
      {toastMessage && (
        <div className="mb-3 px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top-2 duration-200 backdrop-blur-md bg-indigo-950/90 border-indigo-500/40 text-indigo-200 shadow-xl">
          <div className="flex items-center gap-2">
            <RotateCw className="w-4 h-4 text-indigo-400" />
            <span>{toastMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Viewer Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Activity className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-white">
              {lang === 'bn' ? 'Stripe Event Logs (সর্বশেষ ১০টি ওয়েবহুক)' : 'Stripe Event Logs (Last 10 Webhooks)'}
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {events.length} / 10 Events
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-slate-400">
              {lang === 'bn'
                ? 'ব্যাকএন্ড থেকে প্রতি ৩০ সেকেন্ডে স্বয়ংক্রিয়ভাবে ইভেন্ট লগ আপডেট হচ্ছে'
                : 'Automatically updates Stripe event logs every 30 seconds to keep history current.'}
            </p>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
              {lang === 'bn' ? `সর্বশেষ আপডেট: ${lastRefreshedAt}` : `Last: ${lastRefreshedAt}`}
            </span>
          </div>
        </div>

        {/* Polling & Action Controls */}
        <div className="flex items-center gap-2">
          {/* Quick trigger button */}
          <button
            type="button"
            onClick={handleTriggerQuickWebhook}
            disabled={isInjectingSample}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-indigo-900/30 flex items-center gap-1.5 cursor-pointer transition disabled:opacity-50"
            title={lang === 'bn' ? 'টেস্ট ওয়েবহুক ইভেন্ট পাঠান' : 'Dispatch quick test event'}
          >
            {isInjectingSample ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>{lang === 'bn' ? 'টেস্ট ইভেন্ট' : 'Test Event'}</span>
          </button>

          {/* 30-Second Polling Status & Countdown Badge */}
          <button
            type="button"
            onClick={() => setIsPolling(!isPolling)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              isPolling
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title={lang === 'bn' ? '৩০ সেকেন্ড পোলিং চালু/বন্ধ করুন' : 'Toggle 30-second auto-polling'}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isPolling ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'
              }`}
            />
            {isPolling ? (
              <span className="flex items-center gap-1">
                <Timer className="w-3 h-3 text-emerald-400" />
                <span className="font-mono text-emerald-300 font-bold">{countdown}s</span>
                <span className="hidden md:inline">{lang === 'bn' ? '(৩০সে. পোলিং)' : '(30s Poll)'}</span>
              </span>
            ) : (
              <span>{lang === 'bn' ? 'পোলিং বন্ধ' : 'Polling Paused'}</span>
            )}
          </button>

          {/* Manual Fetch Now button */}
          <button
            type="button"
            onClick={() => {
              fetchRecentWebhookEvents();
              setCountdown(Math.round(pollingInterval / 1000));
            }}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            title={lang === 'bn' ? 'তাত্ক্ষণিক রিফ্রেশ করুন' : 'Refresh Now'}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              lang === 'bn'
                ? 'ইভেন্ট টাইপ (e.g. payment_intent.succeeded) বা আইডি দিয়ে খুঁজুন...'
                : 'Search by event type or ID...'
            }
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Status filter pills */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition ${
              statusFilter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({events.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('success')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1 ${
              statusFilter === 'success'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-950 border border-slate-800 text-emerald-400'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Success</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('failure')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center gap-1 ${
              statusFilter === 'failure'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-950 border border-slate-800 text-rose-400'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span>Failed</span>
          </button>
        </div>
      </div>

      {/* Scrollable List Container (Displays the last 10 Stripe webhook events) */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60 shadow-inner">
        <div className="max-h-[460px] overflow-y-auto divide-y divide-slate-800/80 pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {filteredEvents.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Activity className="w-8 h-8 text-slate-600 mx-auto animate-pulse" />
              <p className="text-xs font-semibold text-slate-300">
                {lang === 'bn' ? 'কোনো ওয়েবহুক ইভেন্ট পাওয়া যায়নি' : 'No webhook events found'}
              </p>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                {lang === 'bn'
                  ? 'উপরের "টেস্ট ইভেন্ট" বাটনে ক্লিক করে তাত্ক্ষণিক নতুন ওয়েবহুক ট্রিগার করুন।'
                  : 'Click the "Test Event" button above to simulate a new Stripe webhook event.'}
              </p>
            </div>
          ) : (
            filteredEvents.map((event, index) => {
              const isExpanded = expandedId === event.id;
              const isSuccess = event.status === 'success';

              return (
                <div
                  key={event.id}
                  className={`p-3.5 transition hover:bg-slate-900/60 cursor-pointer ${
                    isExpanded ? 'bg-indigo-950/20' : ''
                  }`}
                  onClick={() => {
                    setExpandedId(isExpanded ? null : event.id);
                    if (onSelectEvent) onSelectEvent(event);
                  }}
                >
                  {/* Event summary header row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    {/* Left: Index, Status Badge, Event Type */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Numeric Index Pill (#1 to #10) */}
                      <span className="w-5 h-5 rounded-md bg-slate-800/80 text-slate-400 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                        #{index + 1}
                      </span>

                      {/* Status Code Badge */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-extrabold shrink-0 ${
                          isSuccess
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSuccess ? 'bg-emerald-400' : 'bg-rose-400'
                          }`}
                        />
                        <span>{event.statusCode || (isSuccess ? 200 : 400)}</span>
                        <span>{isSuccess ? 'OK' : 'ERR'}</span>
                      </span>

                      {/* Event Type (Primary Label) */}
                      <div className="min-w-0">
                        <div className="font-mono text-xs font-bold text-white truncate flex items-center gap-1.5">
                          <span className="text-indigo-400">⚡</span>
                          <span className="hover:underline">{event.eventType}</span>
                        </div>
                        <div className="font-mono text-[10px] text-slate-500 truncate">
                          ID: {event.id}
                        </div>
                      </div>
                    </div>

                    {/* Right: Latency & Timestamp */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      {event.durationMs > 0 && (
                        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/20">
                          {event.durationMs}ms
                        </span>
                      )}

                      {/* Timestamp */}
                      <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{event.timestamp}</span>
                      </div>

                      {/* Replay Button next to each event */}
                      <button
                        type="button"
                        onClick={(e) => handleReplayEvent(event, e)}
                        disabled={replayingId === event.id}
                        className="px-2.5 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 hover:border-indigo-500/50 text-indigo-300 hover:text-white transition flex items-center gap-1.5 text-[11px] font-semibold cursor-pointer disabled:opacity-50 shrink-0 shadow-sm"
                        title={lang === 'bn' ? 'এই ওয়েবহুক ইভেন্ট পুনরায় পাঠান' : 'Replay this webhook payload again'}
                      >
                        <RotateCw
                          className={`w-3 h-3 text-indigo-400 ${
                            replayingId === event.id ? 'animate-spin' : ''
                          }`}
                        />
                        <span>
                          {replayingId === event.id
                            ? (lang === 'bn' ? 'রিপ্লে হচ্ছে...' : 'Replaying...')
                            : (lang === 'bn' ? 'Replay' : 'Replay')}
                        </span>
                      </button>

                      {/* Expand / Collapse Chevron */}
                      <div className="p-1 text-slate-400 hover:text-white">
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 text-indigo-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Error banner if any */}
                  {event.error && (
                    <div className="mt-2 text-[10px] font-mono text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">
                      ⚠️ Error: {event.error}
                    </div>
                  )}

                  {/* Expanded Details Drawer */}
                  {isExpanded && (
                    <div
                      className="mt-3.5 pt-3 border-t border-slate-800/80 space-y-3 font-mono text-xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-sans font-semibold text-slate-300">
                          {lang === 'bn' ? 'ওয়েবহুক পে-লোড ডাটা:' : 'Webhook Payload Data:'}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => handleReplayEvent(event, e)}
                            disabled={replayingId === event.id}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 shadow-sm"
                            title="Replay this exact webhook payload"
                          >
                            <RotateCw
                              className={`w-3 h-3 ${
                                replayingId === event.id ? 'animate-spin' : ''
                              }`}
                            />
                            <span>{lang === 'bn' ? 'পে-লোড পুনরায় পাঠান' : 'Replay Payload'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              copyText(
                                JSON.stringify(event.requestBody || event.responseBody || {}, null, 2),
                                `event-json-${event.id}`
                              )
                            }
                            className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition text-[10px]"
                          >
                            {copiedKey === `event-json-${event.id}` ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>কপি হয়েছে</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>JSON কপি</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 max-h-56 overflow-y-auto text-[11px] text-slate-200">
                        <pre>
                          {JSON.stringify(
                            event.requestBody || event.responseBody || { status: 'Received' },
                            null,
                            2
                          )}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
