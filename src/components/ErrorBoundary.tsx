import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  ArrowRight,
  Terminal,
} from 'lucide-react';
import { logClientError, ClientRuntimeError } from '../services/errorLogging';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  lang?: 'bn' | 'en';
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  loggedRecord: ClientRuntimeError | null;
  showDetails: boolean;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    loggedRecord: null,
    showDetails: false,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    try {
      const record = await logClientError(error, {
        componentStack: errorInfo.componentStack || undefined,
        errorType: 'render_error',
        metadata: {
          component: this.props.componentName || 'RootComponent',
        },
      });
      if (record) {
        this.setState({ loggedRecord: record });
      }
    } catch (_e) {
      // Fallback if logging fails
    }
  }

  public handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      loggedRecord: null,
      showDetails: false,
      copied: false,
    });
  };

  public handleReload = () => {
    // Unregister any stale service workers and reload
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const reg of regs) {
          reg.unregister();
        }
        window.location.reload();
      });
    } else if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  public handleCopyReport = () => {
    const { error, errorInfo, loggedRecord } = this.state;
    const report = {
      errorId: loggedRecord?.id || 'err_unknown',
      timestamp: loggedRecord?.timestamp || new Date().toISOString(),
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    };

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(JSON.stringify(report, null, 2));
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2500);
    }
  };

  public render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      const lang = this.props.lang || (typeof localStorage !== 'undefined' && localStorage.getItem('app_lang') === 'en' ? 'en' : 'bn');
      const isBn = lang === 'bn';

      return (
        <div className="min-h-screen bg-[#060a12] text-slate-100 flex items-center justify-center p-4 sm:p-6 font-sans">
          <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Header Icon & Title */}
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-950/40">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 mb-2">
                  <ShieldAlert className="w-3 h-3" />
                  <span>{isBn ? 'রানটাইম এক্সেপশন ডিটেক্টেড' : 'Runtime Exception Detected'}</span>
                </div>
                <h2 className="text-xl font-extrabold text-white">
                  {isBn ? 'অ্যাপ্লিকেশন প্রদর্শনে সমস্যা হয়েছে' : 'Application Encountered an Error'}
                </h2>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  {isBn
                    ? 'একটি অপ্রত্যাশিত ত্রুটি ধরা পড়েছে এবং সার্ভার সেন্ট্রালাইজড লগ সার্ভিসে পাঠানো হয়েছে।'
                    : 'An unexpected runtime error was caught and dispatched to the centralized server log.'}
                </p>
              </div>
            </div>

            {/* Error Message Box */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                  {isBn ? 'ত্রুটির বিবরণ:' : 'Exception Message:'}
                </span>
                {this.state.loggedRecord?.id && (
                  <span className="font-mono text-[10px] text-slate-500">
                    ID: {this.state.loggedRecord.id}
                  </span>
                )}
              </div>
              <div className="font-mono text-xs text-rose-300 break-words bg-rose-950/20 p-3 rounded-xl border border-rose-900/30 select-all">
                {this.state.error.message || 'Unknown runtime error'}
              </div>
            </div>

            {/* Collapsible Technical Stack Details */}
            <div className="border border-slate-800 rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                className="w-full px-4 py-3 bg-slate-950/60 hover:bg-slate-950 flex items-center justify-between text-xs font-semibold text-slate-300 transition cursor-pointer"
              >
                <span>{isBn ? 'কারিগরী বিবরণ (Stack Trace)' : 'Technical Details & Stack Trace'}</span>
                {this.state.showDetails ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {this.state.showDetails && (
                <div className="p-4 bg-slate-950 border-t border-slate-800/80 space-y-3">
                  {this.state.error.stack && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Error Stack:</span>
                      <pre className="font-mono text-[10px] text-slate-300 bg-slate-900 p-2.5 rounded-lg overflow-x-auto max-h-40 leading-relaxed whitespace-pre-wrap select-all">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}

                  {this.state.errorInfo?.componentStack && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Component Stack:</span>
                      <pre className="font-mono text-[10px] text-slate-400 bg-slate-900 p-2.5 rounded-lg overflow-x-auto max-h-32 leading-relaxed whitespace-pre-wrap select-all">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <ArrowRight className="w-4 h-4 text-indigo-400" />
                  <span>{isBn ? 'পুনরায় চেষ্টা করুন' : 'Try Again'}</span>
                </button>

                <button
                  type="button"
                  onClick={this.handleCopyReport}
                  className="py-3 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {this.state.copied ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-400" />
                  )}
                  <span>
                    {this.state.copied
                      ? isBn
                        ? 'রিপোর্ট কপি হয়েছে!'
                        : 'Report Copied!'
                      : isBn
                      ? 'রিপোর্ট কপি করুন'
                      : 'Copy Error Report'}
                  </span>
                </button>
              </div>

              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-extrabold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/25"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{isBn ? 'ক্যাশ মুছে রিলোড করুন (Clean Reload)' : 'Clear Cache & Reload Application'}</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
