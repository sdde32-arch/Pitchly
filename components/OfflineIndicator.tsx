import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff, Wifi, CheckCircle2, Database, ChevronDown, ChevronUp } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { offlineCacheService } from '../services/offlineCacheService';
import { useUser } from '../context/UserContext';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, wasOffline } = useOnlineStatus();
  const { user } = useUser();
  const [showDetails, setShowDetails] = useState(false);
  const [cacheStats, setCacheStats] = useState({ pitchesCount: 0, userBookingsCount: 0 });

  useEffect(() => {
    if (!isOnline) {
      const summary = offlineCacheService.getSummary(user?.uid);
      setCacheStats({
        pitchesCount: summary.pitchesCount,
        userBookingsCount: summary.userBookingsCount,
      });
    }
  }, [isOnline, user]);

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-50 pointer-events-auto flex flex-col items-end">
      <AnimatePresence>
        {/* Reconnected confirmation toast */}
        {isOnline && wasOffline && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#14532D] text-white border border-[#22C55E]/40 shadow-xl shadow-black/40 text-xs font-semibold backdrop-blur-md mb-2"
          >
            <div className="w-2 h-2 rounded-full bg-[#4ADE80] animate-pulse" />
            <Wifi size={14} className="text-[#4ADE80]" />
            <span>Back online — Latest pitches & slots synced</span>
          </motion.div>
        )}

        {/* Offline status banner */}
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="w-80 max-w-[calc(100vw-2rem)] rounded-2xl bg-[#18181B]/95 border border-amber-500/30 text-white shadow-2xl shadow-black/60 backdrop-blur-xl overflow-hidden"
          >
            <div className="p-3 flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400">
                  <WifiOff size={15} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    <p className="text-xs font-bold text-white tracking-tight">Offline Mode</p>
                  </div>
                  <p className="text-[11px] text-zinc-400 truncate">
                    Using cached pitches & booking data
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowDetails(!showDetails)}
                className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                title="Toggle offline data details"
              >
                {showDetails ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </button>
            </div>

            {showDetails && (
              <div className="px-3 pb-3 pt-1 border-t border-zinc-800/80 bg-black/20 text-[11px] space-y-2">
                <div className="flex items-center justify-between text-zinc-300">
                  <span className="flex items-center gap-1.5 text-zinc-400">
                    <Database size={12} className="text-primary-lime" />
                    Cached Pitches
                  </span>
                  <span className="font-semibold text-white">
                    {cacheStats.pitchesCount > 0 ? `${cacheStats.pitchesCount} available` : 'Pre-cached'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-zinc-300">
                  <span className="flex items-center gap-1.5 text-zinc-400">
                    <CheckCircle2 size={12} className="text-primary-lime" />
                    Offline Navigation
                  </span>
                  <span className="font-semibold text-emerald-400">Active</span>
                </div>
                <p className="text-[10px] text-zinc-500 leading-relaxed pt-1">
                  Service worker is active. App shell, styles, and cached data remain fully responsive without internet.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
