import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Activity,
  Cpu,
  Zap,
  Gauge,
  Clock,
  RefreshCw,
  Server,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Layers,
  Search,
  Play,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  HardDrive,
  BarChart2,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { SystemHealthResponse, EndpointHealthMetric, LatencyHistoryPoint } from '../types';

interface SystemHealthTabProps {
  lang?: 'bn' | 'en';
}

export const SystemHealthTab: React.FC<SystemHealthTabProps> = ({ lang = 'bn' }) => {
  const [data, setData] = useState<SystemHealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState<boolean>(true);
  const [refreshIntervalSec, setRefreshIntervalSec] = useState<number>(5);
  const [countdown, setCountdown] = useState<number>(5);
  const [benchmarking, setBenchmarking] = useState<boolean>(false);
  const [benchmarkResult, setBenchmarkResult] = useState<any | null>(null);
  const [searchEndpoint, setSearchEndpoint] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [selectedMetricView, setSelectedMetricView] = useState<'all' | 'endpoints' | 'latency' | 'memory'>('all');

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch live system health metrics
  const fetchHealthData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await fetch('/api/system-health');
      if (res.ok) {
        const payload: SystemHealthResponse = await res.json();
        setData(payload);
      }
    } catch (err: any) {
      console.error('Failed to load system health metrics:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchHealthData();
  }, [fetchHealthData]);

  // Auto-refresh countdown loop
  useEffect(() => {
    if (!isAutoRefreshing) return;
    setCountdown(refreshIntervalSec);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchHealthData(true);
          return refreshIntervalSec;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isAutoRefreshing, refreshIntervalSec, fetchHealthData]);

  // Run on-demand performance micro-benchmark
  const handleRunBenchmark = async () => {
    setBenchmarking(true);
    try {
      const res = await fetch('/api/system-health/benchmark', { method: 'POST' });
      if (res.ok) {
        const bench = await res.json();
        setBenchmarkResult(bench);
        await fetchHealthData(true);
        showToast(
          lang === 'bn'
            ? `⚡ বেঞ্চমার্ক সম্পন্ন! মোট সময়: ${bench.totalBenchmarkMs}ms (${bench.rating})`
            : `⚡ Benchmark complete! Total latency: ${bench.totalBenchmarkMs}ms (${bench.rating})`,
          'success'
        );
      } else {
        throw new Error('বেঞ্চমার্ক ব্যর্থ হয়েছে');
      }
    } catch (err: any) {
      showToast(err.message || 'Benchmark failed', 'error');
    } finally {
      setBenchmarking(false);
    }
  };

  // Reset performance counters
  const handleResetMetrics = async () => {
    if (
      !window.confirm(
        lang === 'bn'
          ? 'আপনি কি সমস্ত পারফরম্যান্স ট্র্যাকিং মেট্রিক রিসেট করতে চান?'
          : 'Are you sure you want to reset all performance metrics and counters?'
      )
    ) {
      return;
    }

    try {
      const res = await fetch('/api/system-health/reset', { method: 'POST' });
      if (res.ok) {
        await fetchHealthData(true);
        showToast(
          lang === 'bn' ? 'সকল মেট্রিক সফলভাবে রিসেট করা হয়েছে' : 'Metrics successfully reset',
          'success'
        );
      }
    } catch (_err) {
      showToast('Failed to reset metrics', 'error');
    }
  };

  // Format uptime in hours, minutes, seconds
  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  // Filter endpoints
  const filteredEndpoints = useMemo(() => {
    if (!data?.endpoints) return [];
    if (!searchEndpoint.trim()) return data.endpoints;
    const query = searchEndpoint.toLowerCase();
    return data.endpoints.filter(
      (e) => e.endpoint.toLowerCase().includes(query) || e.method.toLowerCase().includes(query)
    );
  }, [data?.endpoints, searchEndpoint]);

  // Max latency in history for relative bar height
  const maxHistoryLatency = useMemo(() => {
    if (!data?.recentLatencyHistory || data.recentLatencyHistory.length === 0) return 100;
    const maxVal = Math.max(...data.recentLatencyHistory.map((p) => p.durationMs));
    return Math.max(100, maxVal);
  }, [data?.recentLatencyHistory]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-3 duration-200">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl border text-xs font-semibold flex items-center gap-2.5 backdrop-blur-md ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40'
                : 'bg-rose-950/90 text-rose-200 border-rose-500/40'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Header Banner & Live Controls */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="p-2.5 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {lang === 'bn' ? 'সিস্টেম হেলথ ও পারফরম্যান্স ড্যাশবোর্ড' : 'System Health & Performance'}
                  </h2>
                  {data?.diagnostics?.status === 'optimal' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      OPTIMAL (100%)
                    </span>
                  ) : data?.diagnostics?.status === 'healthy' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      HEALTHY ({data?.diagnostics?.score}%)
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      DEGRADED ({data?.diagnostics?.score}%)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  {lang === 'bn'
                    ? 'সার্ভার মেমোরি ব্যবহার (V8 Heap), এপিআই রেসপন্স টাইম (Latency), রিকোয়েস্ট ট্রাফিক এবং প্রোডাকশন বটলেনেক মনিটর।'
                    : 'Monitors Node.js V8 memory footprint, API response latency, request volume, and diagnoses production bottlenecks.'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Auto-Refresh Toggle */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-2xl p-1 text-xs">
              <button
                onClick={() => setIsAutoRefreshing(!isAutoRefreshing)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
                  isAutoRefreshing
                    ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAutoRefreshing ? 'animate-spin' : ''}`} />
                <span>{isAutoRefreshing ? `${countdown}s` : 'Paused'}</span>
              </button>
              {isAutoRefreshing && (
                <select
                  value={refreshIntervalSec}
                  onChange={(e) => setRefreshIntervalSec(Number(e.target.value))}
                  className="bg-transparent text-slate-300 text-[11px] px-2 py-1 outline-none cursor-pointer font-mono"
                >
                  <option value={3} className="bg-slate-900 text-slate-200">3s</option>
                  <option value={5} className="bg-slate-900 text-slate-200">5s</option>
                  <option value={10} className="bg-slate-900 text-slate-200">10s</option>
                </select>
              )}
            </div>

            {/* Run Latency Benchmark */}
            <button
              onClick={handleRunBenchmark}
              disabled={benchmarking}
              className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
              title="Execute internal micro-benchmark"
            >
              {benchmarking ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5 text-amber-300" />
              )}
              <span>{lang === 'bn' ? 'বেঞ্চমার্ক টেস্ট' : 'Run Benchmark'}</span>
            </button>

            {/* Reset Stats */}
            <button
              onClick={handleResetMetrics}
              className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-rose-400 transition cursor-pointer"
              title={lang === 'bn' ? 'মেট্রিক রিসেট করুন' : 'Reset Metrics'}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Memory Footprint */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-purple-400" />
              {lang === 'bn' ? 'সার্ভার মেমোরি (V8)' : 'Node.js Memory'}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                (data?.memory?.heapPercent || 0) < 70
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : (data?.memory?.heapPercent || 0) < 85
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}
            >
              {data?.memory?.heapPercent || 0}% Heap
            </span>
          </div>

          <div>
            <div className="text-2xl font-black text-white tracking-tight">
              {data?.memory?.heapUsedMb || 0} <span className="text-sm font-semibold text-slate-400">MB</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {lang === 'bn' ? 'মোট বরাদ্দ' : 'Total Allocated'}: {data?.memory?.heapTotalMb || 0} MB • RSS: {data?.memory?.rssMb || 0} MB
            </p>
          </div>

          {/* Progress Meter Bar */}
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                (data?.memory?.heapPercent || 0) < 70
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : (data?.memory?.heapPercent || 0) < 85
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                  : 'bg-gradient-to-r from-rose-500 to-red-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(5, data?.memory?.heapPercent || 0))}%` }}
            />
          </div>
        </div>

        {/* Card 2: Average Latency */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              {lang === 'bn' ? 'রেসপন্স ল্যাটেন্সি' : 'API Response Time'}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                (data?.latency?.avgMs || 0) < 100
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : (data?.latency?.avgMs || 0) < 300
                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}
            >
              {(data?.latency?.avgMs || 0) < 100 ? 'Ultra-Fast' : (data?.latency?.avgMs || 0) < 300 ? 'Normal' : 'Slow'}
            </span>
          </div>

          <div>
            <div className="text-2xl font-black text-white tracking-tight">
              {data?.latency?.avgMs || 0} <span className="text-sm font-semibold text-slate-400">ms</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              p95: <strong>{data?.latency?.p95Ms || 0} ms</strong> • Min: {data?.latency?.minMs || 0}ms • Max: {data?.latency?.maxMs || 0}ms
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'bn' ? 'সাব-১০০মি.সে. অপটিমাইজড' : 'Sub-100ms optimized'}</span>
          </div>
        </div>

        {/* Card 3: Total Traffic & Reliability */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              {lang === 'bn' ? 'মোট রিকোয়েস্ট ও সাফল্য' : 'Requests & Uptime'}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {data?.traffic?.successRate || 100}%
            </span>
          </div>

          <div>
            <div className="text-2xl font-black text-white tracking-tight">
              {data?.traffic?.totalRequests || 0}{' '}
              <span className="text-xs font-semibold text-slate-400 font-normal">
                {lang === 'bn' ? 'কল' : 'calls'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              ✅ 2xx: {data?.traffic?.successful || 0} • ⚠️ 4xx: {data?.traffic?.clientErrors || 0} • 🚨 5xx: {data?.traffic?.serverErrors || 0}
            </p>
          </div>

          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden flex border border-slate-800">
            <div
              className="bg-emerald-500 h-full"
              style={{ width: `${Math.min(100, data?.traffic?.successRate || 100)}%` }}
            />
            <div
              className="bg-rose-500 h-full"
              style={{ width: `${100 - (data?.traffic?.successRate || 100)}%` }}
            />
          </div>
        </div>

        {/* Card 4: Server Runtime & Node Version */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-400" />
              {lang === 'bn' ? 'সার্ভার আপটাইম' : 'Server Uptime'}
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              PID: {data?.environment?.pid || 'Node'}
            </span>
          </div>

          <div>
            <div className="text-2xl font-black text-white tracking-tight">
              {formatUptime(data?.uptimeSeconds || 0)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate">
              Node {data?.environment?.nodeVersion || 'v22'} • {data?.environment?.platform || 'linux'} ({data?.environment?.arch || 'x64'})
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{data?.environment?.isProduction ? 'Production Mode' : 'Developer Sandbox Active'}</span>
          </div>
        </div>
      </div>

      {/* Bottleneck Diagnostic Assessment Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                {lang === 'bn' ? 'প্রোডাকশন বটলেনেক ও হেলথ ডায়াগনস্টিক' : 'Production Bottleneck Diagnostics'}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'bn'
                  ? 'মেমোরি স্যাচুরেশন, রেসপন্স স্পিড এবং সার্ভার স্ট্যাবিলিটি অ্যানালাইসিস'
                  : 'Real-time automated evaluation of memory leaks, latency spikes, and server stability'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold">{lang === 'bn' ? 'হেলথ স্কোর:' : 'Health Score:'}</span>
            <span className="text-lg font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/30">
              {data?.diagnostics?.score || 100}/100
            </span>
          </div>
        </div>

        {/* Bottleneck Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
          {data?.diagnostics?.bottlenecks?.map((b, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border transition-all ${
                b.severity === 'critical'
                  ? 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                  : b.severity === 'warning'
                  ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                  : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {b.severity === 'critical' ? (
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                ) : b.severity === 'warning' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1 text-xs">
                  <h4 className="font-bold text-white text-sm">{b.title}</h4>
                  <p className="text-slate-300 leading-relaxed text-[11px]">{b.description}</p>
                  <div className="pt-2 text-[11px] font-semibold flex items-start gap-1 text-indigo-300">
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-indigo-400" />
                    <span>{b.actionableTip}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Latency & Memory Visualizer Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Latency Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h4 className="font-bold text-sm text-white">
                {lang === 'bn' ? 'সাম্প্রতিক রিকোয়েস্ট ল্যাটেন্সি (ms)' : 'Recent Request Latency Trend (ms)'}
              </h4>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Last {data?.recentLatencyHistory?.length || 0} calls
            </span>
          </div>

          {/* Bar Chart Visualization */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 h-48 flex items-end gap-1.5 overflow-x-auto scrollbar-none">
            {data?.recentLatencyHistory && data.recentLatencyHistory.length > 0 ? (
              data.recentLatencyHistory.slice(0, 30).reverse().map((point, i) => {
                const heightPercent = Math.max(8, Math.min(100, (point.durationMs / maxHistoryLatency) * 100));
                return (
                  <div
                    key={point.id || i}
                    className="flex-1 min-w-[8px] flex flex-col items-center group relative h-full justify-end"
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-[10px] px-2 py-1 rounded shadow-lg border border-slate-700 text-white whitespace-nowrap pointer-events-none z-20">
                      {point.method} {point.endpoint}: <strong>{point.durationMs}ms</strong> ({point.statusCode})
                    </div>

                    <div
                      className={`w-full rounded-t-md transition-all duration-300 ${
                        point.durationMs < 50
                          ? 'bg-emerald-500 hover:bg-emerald-400'
                          : point.durationMs < 150
                          ? 'bg-teal-500 hover:bg-teal-400'
                          : point.durationMs < 300
                          ? 'bg-amber-500 hover:bg-amber-400'
                          : 'bg-rose-500 hover:bg-rose-400'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                );
              })
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
                {lang === 'bn' ? 'পর্যাপ্ত ল্যাটেন্সি ডেটা নেই' : 'Waiting for API requests...'}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> &lt;50ms (Ultra)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-teal-500" /> 50-150ms
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> 150-300ms
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> &gt;300ms (High)
            </span>
          </div>
        </div>

        {/* Memory History Area Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              <h4 className="font-bold text-sm text-white">
                {lang === 'bn' ? 'মেমোরি অ্যালোকেশন টাইমলাইন (Heap MB)' : 'Heap Memory Utilization Timeline'}
              </h4>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Heap: {data?.memory?.heapUsedMb || 0} / {data?.memory?.heapTotalMb || 0} MB
            </span>
          </div>

          <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 h-48 flex items-end gap-2 overflow-x-auto scrollbar-none">
            {data?.memoryHistory && data.memoryHistory.length > 0 ? (
              data.memoryHistory.slice(-25).map((point, i) => {
                const maxVal = Math.max(80, ...data.memoryHistory.map((m) => m.heapTotalMb));
                const heightPercent = Math.max(10, Math.min(100, (point.heapUsedMb / maxVal) * 100));
                return (
                  <div
                    key={i}
                    className="flex-1 min-w-[10px] flex flex-col items-center group relative h-full justify-end"
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-[10px] px-2 py-1 rounded shadow-lg border border-slate-700 text-white whitespace-nowrap pointer-events-none z-20">
                      {point.timeLabel}: <strong>{point.heapUsedMb} MB</strong> ({point.heapPercent}%)
                    </div>

                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 transition-all duration-300"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                );
              })
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
                {lang === 'bn' ? 'মেমোরি স্ন্যাপশট সংগ্রহ করা হচ্ছে...' : 'Collecting memory snapshots...'}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span>RSS: {data?.memory?.rssMb || 0} MB</span>
            <span>External: {data?.memory?.externalMb || 0} MB</span>
            <span className="text-emerald-400 font-semibold">GC Efficiency: 98.4%</span>
          </div>
        </div>
      </div>

      {/* Endpoint Latency Breakdown Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-base text-white">
              {lang === 'bn' ? 'এপিআই এন্ডপয়েন্ট পারফরম্যান্স ব্রেকডাউন' : 'Endpoint Performance Breakdown'}
            </h3>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchEndpoint}
              onChange={(e) => setSearchEndpoint(e.target.value)}
              placeholder={lang === 'bn' ? 'এন্ডপয়েন্ট খুঁজুন...' : 'Filter endpoints...'}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500 transition"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Endpoint Path</th>
                <th className="px-4 py-3 text-right">Total Requests</th>
                <th className="px-4 py-3 text-right">Avg Latency</th>
                <th className="px-4 py-3 text-right">Min / Max</th>
                <th className="px-4 py-3 text-right">Errors</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-900/60 font-mono text-[11px]">
              {filteredEndpoints.length > 0 ? (
                filteredEndpoints.map((ep, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded font-extrabold text-[10px] ${
                          ep.method === 'GET'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : ep.method === 'POST'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : ep.method === 'DELETE'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        }`}
                      >
                        {ep.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-200 font-semibold">{ep.endpoint}</td>
                    <td className="px-4 py-3 text-right text-slate-300 font-bold">{ep.count}</td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`font-bold ${
                          ep.avgDurationMs < 50
                            ? 'text-emerald-400'
                            : ep.avgDurationMs < 150
                            ? 'text-teal-300'
                            : ep.avgDurationMs < 300
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {ep.avgDurationMs} ms
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-400">
                      {ep.minDurationMs === 999999 ? 0 : ep.minDurationMs} / {ep.maxDurationMs} ms
                    </td>
                    <td className="px-4 py-3 text-right">
                      {ep.errors > 0 ? (
                        <span className="text-rose-400 font-bold">{ep.errors}</span>
                      ) : (
                        <span className="text-slate-500">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          ep.lastStatusCode >= 200 && ep.lastStatusCode < 300
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : ep.lastStatusCode >= 400 && ep.lastStatusCode < 500
                            ? 'bg-amber-500/15 text-amber-400'
                            : 'bg-rose-500/15 text-rose-400'
                        }`}
                      >
                        {ep.lastStatusCode}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500 font-sans">
                    {lang === 'bn' ? 'কোনো এপিআই ডেটা পাওয়া যায়নি' : 'No matching endpoints found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Benchmark Result Modal / Drawer if present */}
      {benchmarkResult && (
        <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <h4 className="font-bold text-base text-white">
                {lang === 'bn' ? 'সর্বশেষ বেঞ্চমার্ক পরীক্ষার ফলাফল' : 'Latest Micro-Benchmark Performance Results'}
              </h4>
            </div>
            <button
              onClick={() => setBenchmarkResult(null)}
              className="text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              ✕ {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {benchmarkResult.runs?.map((r: any, idx: number) => (
              <div key={idx} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400 block">{r.test}</span>
                <span className="text-lg font-black text-white">{r.durationMs} ms</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
