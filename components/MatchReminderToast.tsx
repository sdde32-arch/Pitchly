import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, MapPin, X, ArrowRight, Bell, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMatchReminder } from '../context/MatchReminderContext';

export const MatchReminderToast: React.FC = () => {
  const { activeToast, dismissToast, hasBrowserPermission, requestBrowserPermission } = useMatchReminder();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);

  const AUTO_DISMISS_TIME = 12000; // 12 seconds

  useEffect(() => {
    if (!activeToast) {
      setProgress(100);
      return;
    }

    if (isPaused) return;

    const intervalTime = 100;
    const decrement = (intervalTime / AUTO_DISMISS_TIME) * 100;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          dismissToast();
          return 0;
        }
        return prev - decrement;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [activeToast, isPaused, dismissToast]);

  return (
    <AnimatePresence>
      {activeToast && (
        <motion.div
          key={activeToast.id}
          initial={{ opacity: 0, y: -40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 450, damping: 30 }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="fixed top-4 sm:top-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-[9999] pointer-events-auto"
          id="pitchly-1hr-match-toast"
          role="alert"
          aria-live="assertive"
        >
          <div className="relative overflow-hidden rounded-2xl bg-[#0D0D11]/95 backdrop-blur-2xl border border-primary-lime/40 shadow-[0_20px_60px_-15px_rgba(168,255,0,0.25)] p-4 sm:p-5 text-white">
            {/* Ambient Background Gradient Accent */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-primary-lime/10 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />

            {/* Header: Label, Countdown, and Close button */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-lime/15 border border-primary-lime/30 text-[10px] font-black tracking-widest text-primary-lime uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-lime animate-ping" />
                  1-Hour Match Alert
                </span>
                <span className="text-[11px] font-bold text-[#A1A1AA] flex items-center gap-1">
                  <Clock size={12} className="text-primary-lime" />
                  Kickoff in ~{activeToast.minutesLeft} mins
                </span>
              </div>

              <button
                onClick={dismissToast}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
                aria-label="Dismiss notification"
              >
                <X size={14} />
              </button>
            </div>

            {/* Main Content Area */}
            <div className="flex items-start gap-3.5 mb-3.5">
              {/* Glowing Pulse Football Icon */}
              <div className="relative shrink-0 mt-0.5">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-lime/20 to-primary-lime/5 border border-primary-lime/40 flex items-center justify-center shadow-[0_0_15px_rgba(168,255,0,0.2)]">
                  <span className="text-lg select-none">⚽</span>
                </div>
              </div>

              {/* Match Details */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm sm:text-base font-extrabold text-white leading-tight truncate">
                  {activeToast.turfName}
                </h4>
                <p className="text-xs text-[#D4D4D8] font-medium mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <span className="text-primary-lime font-bold">Today at {activeToast.time}</span>
                  {activeToast.pitchName && (
                    <>
                      <span className="opacity-40">•</span>
                      <span className="opacity-80 truncate">{activeToast.pitchName}</span>
                    </>
                  )}
                </p>
                {activeToast.isTest && (
                  <span className="inline-block text-[9px] font-bold text-zinc-400 bg-white/5 px-2 py-0.5 rounded mt-1">
                    Demo preview triggered from Settings
                  </span>
                )}
              </div>
            </div>

            {/* Interactive Action Buttons */}
            <div className="flex items-center gap-2 pt-1 border-t border-white/10">
              {activeToast.mapUrl && (
                <a
                  href={activeToast.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-primary-lime hover:bg-[#b5ff1a] text-black font-extrabold text-xs tracking-tight transition-all active:scale-[0.98] shadow-md cursor-pointer"
                >
                  <MapPin size={13} className="text-black" />
                  <span>Get Directions</span>
                </a>
              )}

              <button
                onClick={() => {
                  dismissToast();
                  navigate('/bookings');
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs tracking-tight transition-all active:scale-[0.98] border border-white/10 cursor-pointer"
              >
                <span>View Booking</span>
                <ArrowRight size={13} className="text-zinc-400" />
              </button>
            </div>

            {/* Prompt to enable browser notifications if not granted */}
            {!hasBrowserPermission && (
              <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Bell size={11} className="text-primary-lime" />
                  Enable lock screen notifications?
                </span>
                <button
                  onClick={async () => {
                    await requestBrowserPermission();
                  }}
                  className="text-primary-lime hover:underline font-bold text-[11px] cursor-pointer"
                >
                  Turn On
                </button>
              </div>
            )}

            {/* Progress Bar for Auto-dismiss */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
              <motion.div
                className="h-full bg-gradient-to-r from-primary-lime to-[#84CC16]"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.1, ease: 'linear' }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
