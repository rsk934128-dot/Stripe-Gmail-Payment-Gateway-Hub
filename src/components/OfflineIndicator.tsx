import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500/95 border border-amber-400/50 px-3.5 py-2 text-xs font-semibold text-slate-950 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-2 duration-200">
      <WifiOff className="w-4 h-4 text-slate-950 shrink-0" />
      <span>অফলাইন মোড — ক্যাশ করা লোকাল ডাটা প্রদর্শিত হচ্ছে (Offline Mode)</span>
    </div>
  );
};
