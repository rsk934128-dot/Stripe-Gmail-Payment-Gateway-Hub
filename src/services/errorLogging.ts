/**
 * Centralized Client-Side Error Logging & Diagnostic Service
 * Catches, structures, persists, and relays runtime exceptions to backend.
 */

export interface ClientRuntimeError {
  id: string;
  timestamp: string;
  isoDate: string;
  message: string;
  name?: string;
  stack?: string;
  componentStack?: string;
  errorType: 'render_error' | 'unhandled_rejection' | 'window_error' | 'network_error' | 'manual_log';
  url: string;
  userAgent: string;
  online: boolean;
  metadata?: Record<string, any>;
}

const STORAGE_KEY = 'stripe_hub_client_runtime_errors';
const MAX_STORED_ERRORS = 25;

// Memory cache fallback if storage unavailable
let inMemoryErrorLogs: ClientRuntimeError[] = [];

/**
 * Retrieve cached client-side runtime errors
 */
export function getClientRuntimeErrors(): ClientRuntimeError[] {
  try {
    if (typeof window !== 'undefined') {
      const raw = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    }
  } catch (_e) {
    // ignore parsing failure
  }
  return inMemoryErrorLogs;
}

/**
 * Clear cached client-side runtime errors
 */
export function clearClientRuntimeErrors(): void {
  inMemoryErrorLogs = [];
  try {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (_e) {
    // ignore storage removal failure
  }
}

/**
 * Store an error in the rolling client error log
 */
function storeErrorLocally(errorRecord: ClientRuntimeError): void {
  try {
    const existing = getClientRuntimeErrors();
    const updated = [errorRecord, ...existing.filter((e) => e.id !== errorRecord.id)].slice(0, MAX_STORED_ERRORS);
    inMemoryErrorLogs = updated;

    if (typeof window !== 'undefined') {
      const serialized = JSON.stringify(updated);
      try {
        sessionStorage.setItem(STORAGE_KEY, serialized);
      } catch (_e) {
        // Fallback to localStorage if sessionStorage quota exceeded
        try {
          localStorage.setItem(STORAGE_KEY, serialized);
        } catch (_e2) {}
      }
    }
  } catch (_err) {
    inMemoryErrorLogs.unshift(errorRecord);
  }
}

/**
 * Determines whether an error is external browser noise (e.g. extension injects, ResizeObserver)
 */
function isIgnorableNoise(message: string, stack?: string): boolean {
  const text = `${message} ${stack || ''}`.toLowerCase();
  return (
    text.includes('websocket closed without opened') ||
    text.includes('websocket') ||
    text.includes('ws://') ||
    text.includes('wss://') ||
    text.includes('vite:ws') ||
    text.includes('vite:hmr') ||
    text.includes('[vite]') ||
    text.includes('resizeobserver loop') ||
    text.includes('resizeobserver loop completed with undelivered notifications') ||
    text.includes('popup-closed-by-user') ||
    text.includes('cancelled-popup-request') ||
    text.includes('chrome-extension://') ||
    text.includes('moz-extension://') ||
    text.includes('safari-extension://') ||
    text.includes('grammarly') ||
    text.includes('lastpass')
  );
}

/**
 * Core function to report and log runtime errors
 */
export async function logClientError(
  error: Error | any,
  context?: {
    componentStack?: string;
    errorType?: ClientRuntimeError['errorType'];
    metadata?: Record<string, any>;
  }
): Promise<ClientRuntimeError | null> {
  const errorMessage = error?.message || (typeof error === 'string' ? error : 'Unknown runtime exception');
  const errorStack = error?.stack || undefined;
  const errorName = error?.name || 'Error';

  // Suppress harmless browser noise
  if (isIgnorableNoise(errorMessage, errorStack)) {
    return null;
  }

  const errorRecord: ClientRuntimeError = {
    id: `err_cli_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toLocaleTimeString(),
    isoDate: new Date().toISOString(),
    message: errorMessage,
    name: errorName,
    stack: errorStack,
    componentStack: context?.componentStack,
    errorType: context?.errorType || 'render_error',
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,
    metadata: context?.metadata,
  };

  // 1. Store locally in browser session
  storeErrorLocally(errorRecord);

  // 2. Broadcast custom event for in-app toast / debug indicators
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent('app:runtime-error', {
          detail: errorRecord,
        })
      );
    } catch (_e) {}
  }

  // 3. Dispatch to backend server endpoint
  try {
    const payload = JSON.stringify(errorRecord);
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      // sendBeacon is non-blocking and safe during page unload/crashes
      const blob = new Blob([payload], { type: 'application/json' });
      const sent = navigator.sendBeacon('/api/client-errors', blob);
      if (!sent) {
        fetch('/api/client-errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    } else {
      fetch('/api/client-errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  } catch (_networkErr) {
    // Network is offline or unreachable; error is safely stored locally
  }

  return errorRecord;
}

/**
 * Global window error listeners to capture asynchronous rejections and unhandled errors
 */
let handlersInitialized = false;

export function initGlobalErrorHandlers(): () => void {
  if (typeof window === 'undefined' || handlersInitialized) {
    return () => {};
  }

  handlersInitialized = true;

  const handleWindowError = (event: ErrorEvent) => {
    const errorMsg = String(event.error?.message || event.message || '');
    if (isIgnorableNoise(errorMsg, event.error?.stack)) {
      event.preventDefault();
      return;
    }

    logClientError(event.error || event.message, {
      errorType: 'window_error',
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  };

  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    const errorMsg = String(reason?.message || reason || '');
    if (isIgnorableNoise(errorMsg, reason?.stack)) {
      event.preventDefault();
      return;
    }

    logClientError(reason instanceof Error ? reason : new Error(String(reason)), {
      errorType: 'unhandled_rejection',
      metadata: {
        promise: 'Promise rejected without catch handler',
      },
    });
  };

  window.addEventListener('error', handleWindowError);
  window.addEventListener('unhandledrejection', handleUnhandledRejection);

  return () => {
    window.removeEventListener('error', handleWindowError);
    window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    handlersInitialized = false;
  };
}
