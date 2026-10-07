import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Download, CheckCircle2, Share, PlusSquare, 
  MoreVertical, Smartphone, QrCode, Copy, Check, ExternalLink, 
  Home, Sparkles, ShieldCheck, Zap, Layers
} from 'lucide-react';
import QRCode from 'qrcode';
import { motion, AnimatePresence } from 'framer-motion';

// Primary live canonical HTTPS URL for Pitchly app
const LIVE_APP_BASE_URL = 'https://ais-pre-e35syz3bvfqlhjdx424sss-248959928861.europe-west2.run.app';

export const Install: React.FC = () => {
  const navigate = useNavigate();

  // Install Prompt & State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isPrompting, setIsPrompting] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState<'ios' | 'android'>('android');

  // QR Code States
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrHighResUrl, setQrHighResUrl] = useState<string>('');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [downloadingQR, setDownloadingQR] = useState(false);

  // Compute exact target install URL
  const targetInstallUrl = useMemo(() => {
    if (typeof window !== 'undefined' && window.location.origin) {
      const origin = window.location.origin;
      // If hosted on live HTTPS cloud run domain, use current origin
      if (origin.startsWith('https://') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        return `${origin}/install`;
      }
    }
    return `${LIVE_APP_BASE_URL}/install`;
  }, []);

  // 1. Detect Standalone, iOS, and PWA install events
  useEffect(() => {
    // Check if app is already running in standalone display mode
    const checkIsStandalone = () => {
      let standalone = false;
      try {
        if (typeof window !== 'undefined') {
          if (window.matchMedia('(display-mode: standalone)').matches) {
            standalone = true;
          } else if ((window.navigator as any)?.standalone === true) {
            standalone = true;
          }
        }
      } catch (e) {
        standalone = false;
      }
      return standalone;
    };

    const standaloneState = checkIsStandalone();
    setIsInstalled(standaloneState);

    // Detect iOS
    let isAppleIOS = false;
    try {
      const ua = (window.navigator?.userAgent || '').toLowerCase();
      const isIPhoneIPad = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
      const isIPadOS = window.navigator?.platform === 'MacIntel' && (window.navigator?.maxTouchPoints || 0) > 1;
      isAppleIOS = isIPhoneIPad || isIPadOS;
    } catch (e) {
      isAppleIOS = false;
    }
    setIsIOS(isAppleIOS);
    if (isAppleIOS) {
      setActiveGuideTab('ios');
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      console.log('[PWA] beforeinstallprompt event captured and stored.');
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      setInstalledSuccess(true);
      console.log('[PWA] appinstalled event fired.');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Watch for display-mode changes
    let mql: MediaQueryList | null = null;
    try {
      mql = window.matchMedia('(display-mode: standalone)');
      const handleDisplayModeChange = (e: MediaQueryListEvent) => {
        setIsInstalled(e.matches);
      };
      if (mql.addEventListener) {
        mql.addEventListener('change', handleDisplayModeChange);
      }
    } catch (e) {}

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // 2. Generate QR code in the browser via qrcode package
  useEffect(() => {
    let isMounted = true;
    const generateQRs = async () => {
      try {
        // Display QR (380px)
        const displayQR = await QRCode.toDataURL(targetInstallUrl, {
          width: 380,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
          errorCorrectionLevel: 'H',
        });

        // High-res printable QR (1024x1024 with margin for posters and flyers)
        const highResQR = await QRCode.toDataURL(targetInstallUrl, {
          width: 1024,
          margin: 4,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
          errorCorrectionLevel: 'H',
        });

        if (isMounted) {
          setQrDataUrl(displayQR);
          setQrHighResUrl(highResQR);
        }
      } catch (err) {
        console.error('[PWA] Error generating QR code:', err);
      }
    };

    generateQRs();
    return () => {
      isMounted = false;
    };
  }, [targetInstallUrl]);

  // Handle "Download App" button tap
  const handleInstallApp = async () => {
    if (!deferredPrompt) {
      if (isIOS) {
        setActiveGuideTab('ios');
      }
      return;
    }

    try {
      setIsPrompting(true);
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      console.log('[PWA] User choice outcome:', choiceResult.outcome);
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        setInstalledSuccess(true);
        setDeferredPrompt(null);
        setIsInstallable(false);
      } else {
        console.log('[PWA] User dismissed the install prompt');
      }
    } catch (err) {
      console.warn('[PWA] Error invoking install prompt:', err);
    } finally {
      setIsPrompting(false);
    }
  };

  // Handle "Download QR Code" button tap (1024x1024 PNG)
  const handleDownloadQR = async () => {
    try {
      setDownloadingQR(true);
      const dataUrl = qrHighResUrl || await QRCode.toDataURL(targetInstallUrl, {
        width: 1024,
        margin: 4,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'H',
      });

      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'pitchly-install-qr-1024x1024.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('[PWA] Failed to download QR image:', err);
    } finally {
      setTimeout(() => setDownloadingQR(false), 500);
    }
  };

  // Copy target link
  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(targetInstallUrl).then(() => {
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
      });
    }
  };

  return (
    <div className="min-h-screen bg-app-base text-text-primary selection:bg-primary-lime selection:text-accent-text flex flex-col justify-between">
      {/* Top App Bar */}
      <header className="sticky top-0 z-30 bg-app-base/90 backdrop-blur-md border-b border-border-subtle/80 px-4 py-3 sm:px-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate('/home');
              }
            }}
            className="w-10 h-10 rounded-full bg-surface-card border border-border-subtle flex items-center justify-center hover:bg-surface-raised transition-colors cursor-pointer text-text-primary"
            title="Go back"
            aria-label="Go back"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="flex items-center gap-2">
            <img src="/icon-192.png" alt="Pitchly" className="w-6 h-6 rounded-md object-cover" />
            <span className="font-extrabold text-sm tracking-tight text-text-primary">Install Pitchly</span>
          </div>

          <button
            onClick={() => navigate('/home')}
            className="w-10 h-10 rounded-full bg-surface-card border border-border-subtle flex items-center justify-center hover:bg-surface-raised transition-colors cursor-pointer text-text-secondary hover:text-text-primary"
            title="Go to Home"
            aria-label="Go to Home"
          >
            <Home size={18} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* App Branding Card */}
        <div className="text-center space-y-3 pt-2">
          <div className="relative inline-block mx-auto">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-surface-card border-2 border-primary-lime/40 p-1.5 shadow-2xl shadow-primary-lime/10 flex items-center justify-center mx-auto">
              <img
                src="/icon-192.png"
                alt="Pitchly App Icon"
                className="w-full h-full rounded-2xl object-cover shadow-sm"
              />
            </div>
            <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-primary-lime text-accent-text text-[10px] font-black uppercase tracking-wider shadow-md">
              PWA
            </span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
              Pitchly
            </h1>
            <p className="text-text-secondary text-xs sm:text-sm mt-1 max-w-md mx-auto leading-relaxed">
              The ultimate football ecosystem. Discover turfs, book matches, manage teams, and challenge other squads.
            </p>
          </div>

          {/* Standalone Status Badge */}
          <div className="pt-1 flex justify-center">
            {isInstalled ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                <CheckCircle2 size={13} />
                <span>Installed &amp; Running as Standalone App</span>
              </span>
            ) : isInstallable ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-lime/15 text-primary-lime border border-primary-lime/30 text-xs font-bold">
                <Sparkles size={13} />
                <span>Progressive Web App Ready to Install</span>
              </span>
            ) : isIOS ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-raised text-text-secondary border border-border-subtle text-xs font-semibold">
                <Smartphone size={13} />
                <span>iOS Safari Web App Available</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-raised text-text-secondary border border-border-subtle text-xs font-semibold">
                <Layers size={13} />
                <span>Install for Instant Offline Access</span>
              </span>
            )}
          </div>
        </div>

        {/* Success notification banner if installed */}
        {installedSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-center space-y-2"
          >
            <div className="flex items-center justify-center gap-2 font-bold text-sm">
              <CheckCircle2 size={18} className="text-emerald-400" />
              <span>Installed successfully!</span>
            </div>
            <p className="text-xs text-emerald-200/80">
              Pitchly is now saved on your home screen and ready for instant access.
            </p>
            <div className="pt-1">
              <button
                onClick={() => navigate('/home')}
                className="px-5 py-2 rounded-xl bg-emerald-500 text-black font-extrabold text-xs shadow-md cursor-pointer hover:bg-emerald-400 transition-colors"
              >
                Launch App
              </button>
            </div>
          </motion.div>
        )}

        {/* PRIMARY ACTION / INSTALL LOGIC SECTION */}
        <div className="bg-surface-card rounded-2xl border border-border-subtle p-5 sm:p-6 shadow-sm space-y-4">
          {/* CASE A: Already Installed */}
          {isInstalled ? (
            <div className="text-center space-y-3 py-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">App already installed</h3>
                <p className="text-text-secondary text-xs mt-0.5">
                  You are already enjoying Pitchly as an installed application.
                </p>
              </div>
              <button
                onClick={() => navigate('/home')}
                className="w-full py-3.5 bg-primary-lime hover:bg-[#96E600] text-accent-text font-black text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-primary-lime/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
              >
                <span>Open App</span>
                <ExternalLink size={16} />
              </button>
            </div>
          ) : deferredPrompt ? (
            /* CASE B: beforeinstallprompt is ready to fire */
            <div className="space-y-3">
              <button
                onClick={handleInstallApp}
                disabled={isPrompting}
                className="w-full py-4 bg-primary-lime hover:bg-[#96E600] text-accent-text font-black text-base uppercase tracking-wider rounded-2xl shadow-xl shadow-primary-lime/25 flex items-center justify-center gap-2.5 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-60"
              >
                <Download size={20} strokeWidth={2.5} />
                <span>{isPrompting ? 'Opening Prompt...' : 'Download App'}</span>
              </button>
              <div className="flex items-center justify-center gap-3 text-[11px] text-text-tertiary">
                <span className="flex items-center gap-1">
                  <Zap size={12} className="text-primary-lime" /> Fast 1-Tap Install
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <ShieldCheck size={12} className="text-primary-lime" /> Zero App Store Fees
                </span>
                <span>•</span>
                <span>Works Offline</span>
              </div>
            </div>
          ) : (
            /* CASE C: beforeinstallprompt hasn't fired (iOS Safari or unsupported browser) -> Step-by-step instructions */
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border-subtle/80 pb-3">
                <h3 className="text-sm font-bold text-text-primary">
                  How to Install on Your Phone
                </h3>

                {/* Tabs to toggle iOS vs Android instructions */}
                <div className="flex items-center bg-surface-raised rounded-lg p-0.5 border border-border-subtle">
                  <button
                    onClick={() => setActiveGuideTab('ios')}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors cursor-pointer ${
                      activeGuideTab === 'ios'
                        ? 'bg-primary-lime text-accent-text'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    iOS Safari
                  </button>
                  <button
                    onClick={() => setActiveGuideTab('android')}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors cursor-pointer ${
                      activeGuideTab === 'android'
                        ? 'bg-primary-lime text-accent-text'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Android / Chrome
                  </button>
                </div>
              </div>

              {/* iOS Instructions */}
              {activeGuideTab === 'ios' && (
                <div className="space-y-3 pt-1">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-raised/50 border border-border-subtle/50">
                    <div className="w-7 h-7 rounded-lg bg-primary-lime/10 text-primary-lime font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                      1
                    </div>
                    <div className="text-xs text-text-secondary leading-relaxed">
                      In <strong className="text-text-primary">Safari</strong>, tap the <strong className="text-text-primary">Share</strong> icon in the bottom menu bar:
                      <div className="inline-flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded bg-surface-raised text-primary-lime font-semibold">
                        <Share size={12} /> Share
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-raised/50 border border-border-subtle/50">
                    <div className="w-7 h-7 rounded-lg bg-primary-lime/10 text-primary-lime font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                      2
                    </div>
                    <div className="text-xs text-text-secondary leading-relaxed">
                      Scroll down through the share options and tap:
                      <div className="inline-flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded bg-surface-raised text-text-primary font-bold">
                        <PlusSquare size={12} className="text-primary-lime" /> Add to Home Screen
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-raised/50 border border-border-subtle/50">
                    <div className="w-7 h-7 rounded-lg bg-primary-lime/10 text-primary-lime font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                      3
                    </div>
                    <div className="text-xs text-text-secondary leading-relaxed">
                      Tap <strong className="text-text-primary">Add</strong> in the top-right corner. Pitchly will appear on your home screen like a native app.
                    </div>
                  </div>
                </div>
              )}

              {/* Android Instructions */}
              {activeGuideTab === 'android' && (
                <div className="space-y-3 pt-1">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-raised/50 border border-border-subtle/50">
                    <div className="w-7 h-7 rounded-lg bg-primary-lime/10 text-primary-lime font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                      1
                    </div>
                    <div className="text-xs text-text-secondary leading-relaxed">
                      In Chrome, tap the <strong className="text-text-primary">browser menu</strong> icon in the top-right corner:
                      <div className="inline-flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded bg-surface-raised text-primary-lime font-semibold">
                        <MoreVertical size={12} /> Menu (⋮)
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-raised/50 border border-border-subtle/50">
                    <div className="w-7 h-7 rounded-lg bg-primary-lime/10 text-primary-lime font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                      2
                    </div>
                    <div className="text-xs text-text-secondary leading-relaxed">
                      Select <strong className="text-text-primary">"Install app"</strong> or <strong className="text-text-primary">"Add to Home screen"</strong> from the menu options.
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-raised/50 border border-border-subtle/50">
                    <div className="w-7 h-7 rounded-lg bg-primary-lime/10 text-primary-lime font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                      3
                    </div>
                    <div className="text-xs text-text-secondary leading-relaxed">
                      Confirm by tapping <strong className="text-text-primary">"Install"</strong> when prompted. The app will be added directly to your home launcher.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. QR CODE SECTION */}
        <div className="bg-surface-card rounded-2xl border border-border-subtle p-5 sm:p-6 shadow-sm space-y-4">
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 text-primary-lime text-xs font-bold uppercase tracking-wider mb-0.5">
              <QrCode size={14} />
              <span>Mobile QR Scanner</span>
            </div>
            <h2 className="text-lg font-bold text-text-primary">
              Scan to install the app
            </h2>
            <p className="text-text-secondary text-xs max-w-sm mx-auto">
              Scan this QR code with your mobile camera to open and install Pitchly on your phone.
            </p>
          </div>

          {/* QR Display Card */}
          <div className="flex flex-col items-center justify-center pt-2">
            <div className="p-4 bg-white rounded-2xl shadow-xl shadow-black/40 border-4 border-primary-lime/30 inline-block">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Pitchly Install QR Code"
                  className="w-48 h-48 sm:w-56 sm:h-56 block object-contain"
                />
              ) : (
                <div className="w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center text-neutral-400">
                  <div className="animate-pulse text-xs font-mono">Generating QR...</div>
                </div>
              )}
            </div>

            {/* URL Display Chip */}
            <div className="mt-3.5 w-full max-w-sm flex items-center justify-between gap-2 p-2 rounded-xl bg-surface-raised border border-border-subtle text-xs">
              <span className="font-mono text-[11px] text-text-secondary truncate select-all px-1">
                {targetInstallUrl}
              </span>
              <button
                onClick={handleCopyLink}
                className="px-2.5 py-1 rounded-lg bg-surface-card hover:bg-border-subtle text-text-primary hover:text-primary-lime text-[11px] font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                title="Copy install link"
              >
                {copiedUrl ? (
                  <>
                    <Check size={12} className="text-primary-lime" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Download QR Code Button (1024x1024 High-Res PNG) */}
          <div className="pt-2">
            <button
              onClick={handleDownloadQR}
              disabled={downloadingQR || !qrDataUrl}
              className="w-full py-3 bg-surface-raised hover:bg-border-subtle border border-border-subtle text-text-primary font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Download size={15} className="text-primary-lime" />
              <span>{downloadingQR ? 'Preparing High-Res PNG...' : 'Download QR Code (1024x1024 PNG)'}</span>
            </button>
            <p className="text-[11px] text-text-tertiary text-center mt-1.5">
              High-resolution 1024x1024 format with margins, ready for flyers, posters, and pitch sidelines.
            </p>
          </div>
        </div>

        {/* 4. Why Install Pitchly? Features Showcase */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3.5 rounded-xl bg-surface-card border border-border-subtle space-y-1 text-center sm:text-left">
            <div className="w-8 h-8 rounded-lg bg-primary-lime/10 text-primary-lime flex items-center justify-center mx-auto sm:mx-0 font-bold">
              <Zap size={16} />
            </div>
            <h4 className="text-xs font-bold text-text-primary">Instant Launch</h4>
            <p className="text-[11px] text-text-secondary leading-snug">
              Launches instantly from your home screen without loading delays.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-card border border-border-subtle space-y-1 text-center sm:text-left">
            <div className="w-8 h-8 rounded-lg bg-primary-lime/10 text-primary-lime flex items-center justify-center mx-auto sm:mx-0 font-bold">
              <ShieldCheck size={16} />
            </div>
            <h4 className="text-xs font-bold text-text-primary">Offline Support</h4>
            <p className="text-[11px] text-text-secondary leading-snug">
              Browse pitches, match vouchers, and tournament fixtures offline.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-card border border-border-subtle space-y-1 text-center sm:text-left">
            <div className="w-8 h-8 rounded-lg bg-primary-lime/10 text-primary-lime flex items-center justify-center mx-auto sm:mx-0 font-bold">
              <Sparkles size={16} />
            </div>
            <h4 className="text-xs font-bold text-text-primary">Native Feel</h4>
            <p className="text-[11px] text-text-secondary leading-snug">
              Immersive full-screen experience with no browser address bars.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 border-t border-border-subtle/50 text-xs text-text-tertiary">
        <p>Pitchly PWA • Version 1.0.0 • Verified Progressive Web App</p>
      </footer>
    </div>
  );
};
