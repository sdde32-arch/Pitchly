import React, { useState, useEffect } from 'react';
import { Clock, Lock, Pause, Play, RefreshCw, X } from 'lucide-react';
import { AppTheme } from '../../tokens';

export interface CountdownBannerProps {
  theme?: AppTheme;
  initialSeconds?: number; // e.g. 600 (10 minutes)
  title?: string;
  description?: string;
  onExpire?: () => void;
  onCancel?: () => void;
  className?: string;
}

export const CountdownBanner: React.FC<CountdownBannerProps> = ({
  theme = 'dark',
  initialSeconds = 600,
  title = 'Slot Held For You',
  description = 'Your selected time slot is locked for 10:00 minutes while you complete your booking.',
  onExpire,
  onCancel,
  className = '',
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(initialSeconds);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  useEffect(() => {
    if (isPaused || secondsLeft <= 0) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onExpire?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, secondsLeft, onExpire]);

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = (secondsLeft / initialSeconds) * 100;

  const handleReset = () => {
    setSecondsLeft(initialSeconds);
    setIsPaused(false);
  };

  const cardBg = 'bg-surface-card border border-primary-lime/40 shadow-2xl shadow-primary-lime/10 text-text-primary';
  const badgeBg = 'bg-surface-raised border border-[#383838]';
  const btnBg = 'bg-surface-raised hover:bg-border-subtle border border-[#383838] text-text-secondary hover:text-text-primary';

  return (
    <div
      className={`relative w-full rounded-[28px] p-4 overflow-hidden transition-all ${cardBg} ${className}`}
    >
      {/* Background ambient lime accent line */}
      <div
        className="absolute top-0 left-0 h-1 bg-primary-lime transition-all duration-1000"
        style={{ width: `${progressPercent}%` }}
      />

      <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-4">
        
        {/* Left Section: Icon + Text */}
        <div className="flex items-center gap-4">
          {/* Lock / Clock Icon Circle */}
          <div className="w-12 h-12 rounded-2xl bg-primary-lime/15 border border-primary-lime/40 flex items-center justify-center text-primary-lime shrink-0 font-bold">
            <Lock size={22} className="animate-pulse text-primary-lime" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-display font-bold tracking-tight text-text-primary">
                {title}
              </h4>
              <span className="px-2 py-0.5 rounded-full bg-primary-lime text-accent-text text-[10px] font-black uppercase tracking-wider shadow-sm">
                Hold Active
              </span>
            </div>
            <p className="text-xs font-medium mt-1 leading-relaxed max-w-md text-text-secondary">
              {description}
            </p>
          </div>
        </div>

        {/* Right Section: Circular Timer & Controls */}
        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
          
          {/* Timer Display Badge */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl ${badgeBg}`}>
            <Clock size={16} className="text-primary-lime" />
            <span className="font-mono font-black text-base text-primary-lime tracking-wider">
              {formatTime(secondsLeft)}
            </span>
          </div>

          {/* Pause / Play Toggle */}
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            className={`p-2.5 rounded-2xl transition-all ${btnBg}`}
            title={isPaused ? 'Resume Timer' : 'Pause Timer'}
          >
            {isPaused ? <Play size={16} className="text-primary-lime" /> : <Pause size={16} />}
          </button>

          {/* Reset Timer */}
          <button
            type="button"
            onClick={handleReset}
            className={`p-2.5 rounded-2xl transition-all ${btnBg}`}
            title="Reset Hold Timer"
          >
            <RefreshCw size={16} />
          </button>

          {/* Cancel / Dismiss */}
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="p-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 transition-all"
              title="Cancel Hold"
            >
              <X size={16} />
            </button>
          )}

        </div>

      </div>
    </div>
  );
};
