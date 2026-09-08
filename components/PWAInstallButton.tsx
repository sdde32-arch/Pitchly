import React from 'react';
import { Download, Share2, Smartphone, X, Check } from 'lucide-react';
import { usePWA } from '../context/PWAContext';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'full' | 'sidebar';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { isInstalled, isInstallable, isIOS, installApp, showIOSGuide, setShowIOSGuide } = usePWA();

  // If app is already installed and running as standalone, don't show the button
  if (isInstalled) {
    return null;
  }

  // If not installable and not on iOS, hide
  if (!isInstallable && !isIOS) {
    return null;
  }

  return (
    <>
      {variant === 'sidebar' ? (
        <button
          onClick={installApp}
          className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-primary-lime/10 hover:bg-primary-lime/20 border border-primary-lime/30 text-primary-lime transition-all cursor-pointer group ${className}`}
          title="Install Pitchly app"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-primary-lime/20 flex items-center justify-center shrink-0">
              <Download size={13} className="text-primary-lime" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-xs font-bold text-text-primary group-hover:text-primary-lime transition-colors">
                Install App
              </p>
              <p className="text-[10px] text-text-tertiary truncate">
                {isIOS ? 'Add to iOS Home Screen' : 'Offline & fast launch'}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary-lime/20 text-primary-lime shrink-0">
            PWA
          </span>
        </button>
      ) : variant === 'full' ? (
        <div className={`p-4 rounded-2xl bg-surface-card border border-border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${className}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-lime/15 border border-primary-lime/30 flex items-center justify-center text-primary-lime shrink-0">
              <Smartphone size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary">Install Pitchly App</p>
              <p className="text-xs text-text-secondary">
                Work offline, browse cached pitches, and get instant access from your home screen.
              </p>
            </div>
          </div>
          <button
            onClick={installApp}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-lime text-black font-extrabold text-xs shadow-md shadow-primary-lime/25 hover:bg-primary-lime-hover transition-all cursor-pointer shrink-0"
          >
            <Download size={15} />
            <span>Install Now</span>
          </button>
        </div>
      ) : (
        <button
          onClick={installApp}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary-lime/10 hover:bg-primary-lime/20 text-primary-lime border border-primary-lime/30 text-xs font-bold transition-all cursor-pointer ${className}`}
        >
          <Download size={13} />
          <span>Install App</span>
        </button>
      )}

      {/* Guided iOS Safari Instructions Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-surface-card border border-border-subtle p-5 shadow-2xl text-text-primary relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-raised cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary-lime/15 border border-primary-lime/30 flex items-center justify-center text-primary-lime shrink-0">
                <Smartphone size={20} />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-text-primary">Install on iPhone / iPad</h3>
                <p className="text-xs text-text-tertiary">Quick 2-step setup in Safari</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-text-secondary bg-surface-raised/70 p-3 rounded-xl border border-border-subtle">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-primary-lime/20 text-primary-lime flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  1
                </div>
                <p>
                  Tap the <strong className="text-text-primary">Share</strong> button <Share2 size={12} className="inline ml-0.5 text-primary-lime" /> in Safari's bottom toolbar.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-primary-lime/20 text-primary-lime flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  2
                </div>
                <p>
                  Scroll down and tap <strong className="text-text-primary">Add to Home Screen</strong>.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-4 w-full py-2.5 rounded-xl bg-primary-lime text-black font-extrabold text-xs shadow-sm hover:bg-primary-lime-hover transition-all cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
