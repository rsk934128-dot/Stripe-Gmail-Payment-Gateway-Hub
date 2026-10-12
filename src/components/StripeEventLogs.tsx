import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Activity,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Trash2,
  Download,
  Terminal,
  Zap,
  Layers,
  ArrowUpRight,
  ExternalLink,
  Code2,
  Timer,
  RotateCw,
  X,
} from 'lucide-react';
import { ApiEventLog } from '../types';

interface StripeEventLogsProps {
  lang?: 'bn' | 'en';
  pollingInterval?: number; // In milliseconds, default 30000 (30s)
}

export const StripeEventLogs: React.FC<StripeEventLogsProps> = ({
  lang = 'bn',
  pollingInterval = 30000,
}) => {
  const [logs, setLogs] = useState<ApiEventLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(true);
  const [countdown, setCountdown] = useState<number>(Math.round(pollingInterval / 1000));
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failure'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'api' | 'webhook' | 'stripe'>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [replayingId, setReplayingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Fetch recent Stripe events & API logs from backend
  const fetchLogs = useCallback(async (isBackground = false) => {
    if (!isBackground) setIsLoading(true);
    try {
      const res = await fetch('/api/event-logs');
      if (res.ok) {
        const data = await res.json();
        const combined: ApiEventLog[] = [
          ...(data.logs || []),
          ...(data.stripeEvents || []),
        ];
        setLogs(combined);
      }
    } catch (err) {
      console.error('Failed to poll Stripe event logs:', err);
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Polling hook (30 seconds) with countdown
  useEffect(() => {
    if (!isPolling) return;
    const totalSeconds = Math.max(1, Math.round(pollingInterval / 1000));
    setCountdown(totalSeconds);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchLogs(true);
          return totalSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPolling, pollingInterval, fetchLogs]);

  // Clear logs handler
  const handleClearLogs = async () => {
    try {
      await fetch('/api/event-logs', { method: 'DELETE' });
      setLogs([]);
      setExpandedLogId(null);
    } catch (err) {
      console.error('Failed to clear logs:', err);
    }
  };

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

  // Replay past webhook / API event
  const handleReplayEvent = async (log: ApiEventLog, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setReplayingId(log.id);

    try {
      let payload = log.requestBody;
      if (!payload || Object.keys(payload).length === 0) {
        payload = log.responseBody;
      }

      if (!payload || typeof payload !== 'object' || Object.keys(payload).length === 0) {
        payload = {
          id: `evt_replay_${Math.random().toString(36).substring(2, 9)}`,
          type: log.eventType || 'payment_intent.succeeded',
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
        log.endpoint && log.endpoint.startsWith('/api')
          ? log.endpoint
          : '/api/webhook';

      const res = await fetch(replayEndpoint, {
        method: log.method || 'POST',
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
          ? `✅ [${log.eventType || log.endpoint}] সফলভাবে পুনরায় পাঠানো হয়েছে (HTTP 200)!`
          : `✅ Replayed [${log.eventType || log.endpoint}] payload successfully!`,
        'success'
      );

      await fetchLogs(true);
      setCountdown(Math.round(pollingInterval / 1000));
    } catch (err: any) {
      console.error('Replay failed:', err);
      showToast(
        lang === 'bn' ? `❌ রিপ্লে ব্যর্থ হয়েছে: ${err.message}` : `❌ Replay failed: ${err.message}`,
        'error'
      );
    } finally {
      setReplayingId(null);
    }
  };

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (statusFilter === 'success' && log.status !== 'success') return false;
      if (statusFilter === 'failure' && log.status !== 'failure') return false;
      if (sourceFilter !== 'all' && log.source !== sourceFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          log.id.toLowerCase().includes(q) ||
          log.endpoint.toLowerCase().includes(q) ||
          log.eventType.toLowerCase().includes(q) ||
          String(log.statusCode).includes(q) ||
          (log.error && log.error.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [logs, statusFilter, sourceFilter, searchQuery]);

  // Summary counts
  const summary = useMemo(() => {
    const total = logs.length;
    const success = logs.filter((l) => l.status === 'success').length;
    const failure = logs.filter((l) => l.status === 'failure').length;
    const rate = total > 0 ? Math.round((success / total) * 100) : 100;
    return { total, success, failure, rate };
  }, [logs]);

  // Generate curl replay snippet
  const getCurlSnippet = (log: ApiEventLog) => {
    const origin = window.location.origin;
    const url = log.endpoint.startsWith('http') ? log.endpoint : `${origin}${log.endpoint}`;
    let snippet = `curl -X ${log.method || 'POST'} "${url}" \\\n  -H "Content-Type: application/json"`;
    if (log.source === 'webhook') {
      snippet += ` \\\n  -H "stripe-signature: t=${Math.floor(Date.now() / 1000)},v1=test_sig"`;
    }
    if (log.requestBody && Object.keys(log.requestBody).length > 0) {
      snippet += ` \\\n  -d '${JSON.stringify(log.requestBody)}'`;
    }
    return snippet;
  };

  return (
    <div className="space-y-4 text-left relative">
      {/* Replay Toast Notification */}
      {toastMessage && (
        <div className="px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top-2 duration-200 backdrop-blur-md bg-indigo-950/90 border-indigo-500/40 text-indigo-200 shadow-xl">
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

      {/* Top Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
        {/* Left: Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              lang === 'bn'
                ? 'ইভেন্ট নাম, রুট (/api/...) বা স্ট্যাটাস কোড খুঁজুন...'
                : 'Filter by event name, endpoint or status...'
            }
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

        {/* Center: Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 cursor-pointer transition ${
              statusFilter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {lang === 'bn' ? 'সকল' : 'All'} ({summary.total})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('success')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 cursor-pointer transition flex items-center gap-1.5 ${
              statusFilter === 'success'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-950 border border-slate-800 text-emerald-400 hover:bg-emerald-500/10'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Success ({summary.success})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('failure')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 cursor-pointer transition flex items-center gap-1.5 ${
              statusFilter === 'failure'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-950 border border-slate-800 text-rose-400 hover:bg-rose-500/10'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span>Failed ({summary.failure})</span>
          </button>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 shrink-0"
          >
            <option value="all">{lang === 'bn' ? 'সকল সোর্স' : 'All Sources'}</option>
            <option value="api">API Requests</option>
            <option value="webhook">Webhooks</option>
            <option value="stripe">Stripe Cloud</option>
          </select>
        </div>

        {/* Right: Polling Toggle & Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPolling(!isPolling)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition cursor-pointer shrink-0 ${
              isPolling
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title={lang === 'bn' ? 'স্বয়ংক্রিয় পোলিং টগল' : 'Toggle live polling'}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isPolling ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'
              }`}
            />
            {isPolling ? (
              <span className="flex items-center gap-1 font-mono text-emerald-300">
                <Timer className="w-3 h-3 text-emerald-400" />
                <span className="font-bold">{countdown}s</span>
                <span className="hidden sm:inline font-sans text-emerald-400">(30s Poll)</span>
              </span>
            ) : (
              <span>{lang === 'bn' ? 'পোলিং বন্ধ' : 'Polling OFF'}</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => fetchLogs()}
            disabled={isLoading}
            className="p-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            title={lang === 'bn' ? 'তাত্ক্ষণিক রিফ্রেশ' : 'Fetch Now'}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleClearLogs}
            disabled={logs.length === 0}
            className="p-1.5 rounded-xl bg-slate-950 border border-slate-800 text-rose-400 hover:bg-rose-500/10 transition cursor-pointer disabled:opacity-50"
            title={lang === 'bn' ? 'লগ মুছুন' : 'Clear Logs'}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Events Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">{lang === 'bn' ? 'স্ট্যাটাস ব্যাজ' : 'Status Badge'}</th>
                <th className="py-3 px-4">{lang === 'bn' ? 'ইভেন্ট / রুট' : 'Event / Route'}</th>
                <th className="py-3 px-4 hidden sm:table-cell">{lang === 'bn' ? 'সোর্স' : 'Source'}</th>
                <th className="py-3 px-4 hidden md:table-cell">{lang === 'bn' ? 'লেটেন্সি' : 'Latency'}</th>
                <th className="py-3 px-4">{lang === 'bn' ? 'টাইমস্ট্যাম্প' : 'Timestamp'}</th>
                <th className="py-3 px-4 text-right">{lang === 'bn' ? 'বিস্তারিত' : 'Details'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-sans">
                    <Activity className="w-8 h-8 text-slate-600 mx-auto mb-2 animate-pulse" />
                    <p className="text-xs font-semibold text-slate-300">
                      {lang === 'bn' ? 'কোনো Stripe ইভেন্ট পাওয়া যায়নি' : 'No Stripe events recorded yet'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {lang === 'bn'
                        ? 'পেমেন্ট টেস্ট করুন বা Webhook ট্রিগার করলে এখানে লাইভ ইভেন্ট জমা হবে।'
                        : 'Trigger a payment or dispatch a webhook to see live events streamed here.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  const isSuccess = log.status === 'success';

                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className={`hover:bg-slate-800/40 cursor-pointer transition ${
                          isExpanded ? 'bg-indigo-950/20' : ''
                        }`}
                      >
                        {/* Status Badge */}
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
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
                            <span>{log.statusCode || (isSuccess ? 200 : 500)}</span>
                            <span>{isSuccess ? 'OK' : 'FAIL'}</span>
                          </span>
                        </td>

                        {/* Event Name & Method */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold">
                              {log.method || 'POST'}
                            </span>
                            <span className="font-semibold text-white text-xs truncate max-w-[200px] sm:max-w-xs">
                              {log.eventType || log.endpoint}
                            </span>
                          </div>
                          {log.error && (
                            <div className="text-[10px] text-rose-400 font-sans truncate mt-0.5 max-w-xs">
                              ⚠️ {log.error}
                            </div>
                          )}
                        </td>

                        {/* Source */}
                        <td className="py-3 px-4 hidden sm:table-cell">
                          <span className="text-[11px] text-slate-400 font-sans">
                            {log.source === 'webhook' ? (
                              <span className="text-cyan-400 font-semibold">⚡ Webhook</span>
                            ) : log.source === 'stripe' ? (
                              <span className="text-indigo-400 font-semibold">☁️ Stripe Event</span>
                            ) : (
                              <span className="text-slate-300 font-semibold">🔌 API Call</span>
                            )}
                          </span>
                        </td>

                        {/* Latency */}
                        <td className="py-3 px-4 hidden md:table-cell text-slate-400 text-[11px]">
                          {log.durationMs > 0 ? (
                            <span className="text-cyan-300 font-semibold">{log.durationMs}ms</span>
                          ) : (
                            <span className="text-slate-600">instant</span>
                          )}
                        </td>

                        {/* Timestamp */}
                        <td className="py-3 px-4 text-slate-300 text-[11px] whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>{log.timestamp}</span>
                          </div>
                        </td>

                        {/* Actions / Replay & Expand Toggle */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => handleReplayEvent(log, e)}
                              disabled={replayingId === log.id}
                              className="px-2 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 hover:text-white transition flex items-center gap-1 text-[11px] font-semibold cursor-pointer disabled:opacity-50"
                              title={lang === 'bn' ? 'এই পে-লোড পুনরায় পাঠান' : 'Replay this event payload'}
                            >
                              <RotateCw
                                className={`w-3 h-3 text-indigo-400 ${
                                  replayingId === log.id ? 'animate-spin' : ''
                                }`}
                              />
                              <span className="hidden sm:inline">
                                {replayingId === log.id
                                  ? (lang === 'bn' ? 'রিপ্লে...' : 'Replaying...')
                                  : (lang === 'bn' ? 'Replay' : 'Replay')}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedLogId(isExpanded ? null : log.id);
                              }}
                              className="p-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Inspector Detail Row */}
                      {isExpanded && (
                        <tr className="bg-slate-950/80 border-b border-slate-800">
                          <td colSpan={6} className="p-4 sm:p-5">
                            <div className="space-y-4 font-sans text-xs">
                              {/* Header info */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-slate-400 text-xs">Log ID: {log.id}</span>
                                  <span className="text-slate-600">•</span>
                                  <span className="font-mono text-indigo-400 text-xs">{log.endpoint}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleReplayEvent(log)}
                                    disabled={replayingId === log.id}
                                    className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition shadow-sm"
                                    title="Replay this event"
                                  >
                                    <RotateCw className={`w-3 h-3 ${replayingId === log.id ? 'animate-spin' : ''}`} />
                                    <span>{lang === 'bn' ? 'পে-লোড পুনরায় পাঠান' : 'Replay Payload'}</span>
                                  </button>

                                  <button
                                    onClick={() => copyText(getCurlSnippet(log), `curl-${log.id}`)}
                                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-[11px] font-mono flex items-center gap-1 cursor-pointer"
                                  >
                                    {copiedKey === `curl-${log.id}` ? (
                                      <>
                                        <Check className="w-3 h-3 text-emerald-400" />
                                        <span>Copied cURL</span>
                                      </>
                                    ) : (
                                      <>
                                        <Terminal className="w-3 h-3" />
                                        <span>Copy cURL</span>
                                      </>
                                    )}
                                  </button>

                                  <button
                                    onClick={() =>
                                      copyText(
                                        JSON.stringify(
                                          {
                                            id: log.id,
                                            endpoint: log.endpoint,
                                            statusCode: log.statusCode,
                                            request: log.requestBody,
                                            response: log.responseBody,
                                          },
                                          null,
                                          2
                                        ),
                                        `json-${log.id}`
                                      )
                                    }
                                    className="px-2.5 py-1 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:text-white text-[11px] font-mono flex items-center gap-1 cursor-pointer"
                                  >
                                    {copiedKey === `json-${log.id}` ? (
                                      <>
                                        <Check className="w-3 h-3 text-emerald-400" />
                                        <span>Copied</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3 h-3" />
                                        <span>Copy JSON</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>

                              {/* Request & Response Split Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Request Payload */}
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold">
                                    <span>{lang === 'bn' ? 'রিকোয়েস্ট পে-লোড (Request)' : 'Request Payload'}</span>
                                  </div>
                                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 max-h-56 overflow-y-auto font-mono text-[11px] text-slate-300">
                                    <pre>
                                      {JSON.stringify(log.requestBody || { message: 'No body' }, null, 2)}
                                    </pre>
                                  </div>
                                </div>

                                {/* Response Output */}
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold">
                                    <span>{lang === 'bn' ? 'রেসপন্স আউটপুট (Response)' : 'Response Body'}</span>
                                  </div>
                                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 max-h-56 overflow-y-auto font-mono text-[11px] text-slate-200">
                                    <pre>
                                      {JSON.stringify(log.responseBody || { status: 'OK' }, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
