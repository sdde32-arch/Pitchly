import React, { useState, useEffect, useMemo, useRef, useCallback, Suspense } from "react";
import { Layout } from "../components/Layout";
import {
  OwnerToday,
  countWaitingOwnerBookings,
} from "../components/owner/OwnerToday";
import { BookingManager } from "../components/owner/BookingManager";
import { FinanceManager } from "../components/owner/FinanceManager";
import { BusinessSettings } from "../components/owner/BusinessSettings";
import { StaffManager } from "../components/owner/StaffManager";
import { OwnerInbox } from "../components/owner/OwnerInbox";
import { OwnerGuide } from "../components/owner/OwnerGuide";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  CalendarCheck, 
  CalendarDays,
  Building2, 
  Wallet, 
  Settings, 
  Users,
  MessageSquare,
  Plus,
  Compass,
  TrendingUp,
  Loader2
} from "lucide-react";
import { useInteractiveWalkthrough } from "../context/InteractiveWalkthroughContext";
import { useUser } from "../context/UserContext";
import { bookingService } from "../services/bookingService";
import { Booking } from "../types/firebase";

const SOUND_PREF_STORAGE_KEY = "pitchly_owner_booking_sound";

const LazyOwnerOverview = React.lazy(() =>
  import("../components/owner/OwnerOverview").then((m) => ({
    default: m.OwnerOverview,
  }))
);

const LazyOwnerAnalyticsDashboard = React.lazy(() =>
  import("../components/owner/OwnerAnalyticsDashboard").then((m) => ({
    default: m.OwnerAnalyticsDashboard,
  }))
);

const LazyTabFallback: React.FC = () => (
  <div className="w-full py-16 flex flex-col items-center justify-center gap-3 text-text-secondary">
    <Loader2 size={24} className="animate-spin text-primary-lime" />
    <span className="text-sm font-semibold">Loading reports...</span>
  </div>
);

const normalizeOwnerTab = (rawTab: string | null): string => {
  if (!rawTab) return "Today";
  if (rawTab === "Dashboard") return "Reports";
  return rawTab;
};

function readSoundPreference(): boolean {
  try {
    const stored = window.localStorage.getItem(SOUND_PREF_STORAGE_KEY);
    if (stored === "off") return false;
  } catch {
    // Ignore storage access failures in private/restricted browsers
  }
  return true;
}

export const OwnerDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { openWalkthrough } = useInteractiveWalkthrough();
  const { user, userProfile, loading: authLoading } = useUser();
  const ownerId = userProfile?.id || user?.uid || "";

  const queryParams = new URLSearchParams(location.search);
  const initialTab = normalizeOwnerTab(queryParams.get("tab"));
  const [activeTab, setActiveTab] = useState(initialTab);

  // Single live bookings subscription shared with OwnerToday & alert logic
  const [ownerBookings, setOwnerBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState<boolean>(true);
  const [bookingsError, setBookingsError] = useState<boolean>(false);
  const [bookingsRetryKey, setBookingsRetryKey] = useState<number>(0);

  const [soundEnabled, setSoundEnabled] = useState<boolean>(readSoundPreference);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const hasLoadedInitialBookingsRef = useRef<boolean>(false);
  const prevWaitingCountRef = useRef<number>(0);
  const originalTitleRef = useRef<string>(
    typeof document !== "undefined" ? document.title : "Pitchly"
  );

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    setActiveTab(normalizeOwnerTab(tab));
  }, [location.search]);

  // Unlock/resume Web Audio on first user interaction inside the dashboard
  const ensureAudioContext = useCallback(() => {
    try {
      const AudioCtor =
        window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) return null;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtor();
      }
      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume().catch(() => {});
      }
      return audioCtxRef.current;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const handleFirstInteraction = () => {
      ensureAudioContext();
    };
    window.addEventListener("pointerdown", handleFirstInteraction, { once: true });
    window.addEventListener("keydown", handleFirstInteraction, { once: true });
    return () => {
      window.removeEventListener("pointerdown", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
    };
  }, [ensureAudioContext]);

  const playNewBookingBeep = useCallback(() => {
    try {
      const ctx = ensureAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const playTone = (freq: number, startOffset: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + startOffset);
        gain.gain.setValueAtTime(0.001, now + startOffset);
        gain.gain.exponentialRampToValueAtTime(0.18, now + startOffset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + startOffset + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + startOffset);
        osc.stop(now + startOffset + duration + 0.02);
      };

      playTone(660, 0, 0.14);
      playTone(880, 0.16, 0.22);
    } catch {
      // Ignore browsers that block or lack Web Audio
    }
  }, [ensureAudioContext]);

  const handleToggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SOUND_PREF_STORAGE_KEY, next ? "on" : "off");
      } catch {
        // Ignore storage failures
      }
      if (next) {
        ensureAudioContext();
      }
      return next;
    });
  }, [ensureAudioContext]);

  // Single live listener for all owner bookings (cleaned up on unmount)
  useEffect(() => {
    hasLoadedInitialBookingsRef.current = false;
    prevWaitingCountRef.current = 0;

    if (authLoading) return;
    if (!ownerId) {
      setOwnerBookings([]);
      setLoadingBookings(false);
      return;
    }

    setLoadingBookings(true);
    setBookingsError(false);

    const unsubscribe = bookingService.subscribeByOwner(
      ownerId,
      (list) => {
        setOwnerBookings(list);
        setLoadingBookings(false);
      },
      () => {
        setBookingsError(true);
        setLoadingBookings(false);
      }
    );

    return () => unsubscribe();
  }, [ownerId, authLoading, bookingsRetryKey]);

  const waitingCount = useMemo(
    () => countWaitingOwnerBookings(ownerBookings),
    [ownerBookings]
  );

  // Alert with Web Audio beep + vibration when waiting count increases AFTER initial load
  useEffect(() => {
    if (loadingBookings) return;

    if (!hasLoadedInitialBookingsRef.current) {
      hasLoadedInitialBookingsRef.current = true;
      prevWaitingCountRef.current = waitingCount;
      return;
    }

    if (waitingCount > prevWaitingCountRef.current) {
      if (soundEnabled) {
        playNewBookingBeep();
      }
      try {
        if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
          navigator.vibrate([200, 100, 200]);
        }
      } catch {
        // Ignore vibration failures
      }
    }

    prevWaitingCountRef.current = waitingCount;
  }, [waitingCount, loadingBookings, soundEnabled, playNewBookingBeep]);

  // Update browser tab title while bookings are waiting; restore on 0 or unmount
  useEffect(() => {
    const baseTitle = originalTitleRef.current || "Pitchly";
    if (waitingCount > 0) {
      document.title = `(${waitingCount}) Pitchly`;
    } else {
      document.title = baseTitle;
    }
    return () => {
      document.title = baseTitle;
    };
  }, [waitingCount]);

  const handleRetryBookings = useCallback(() => {
    setBookingsError(false);
    setLoadingBookings(true);
    setBookingsRetryKey((k) => k + 1);
  }, []);

  const handleTabChange = (tab: string) => {
    if (tab === "Facilities") {
      navigate("/owner/pitches");
      return;
    }
    setActiveTab(tab);
    navigate(`/owner?tab=${tab}`);
  };

  const navTabs = [
    { id: "Today", label: "Today", icon: CalendarDays },
    { id: "Reports", label: "Reports", icon: LayoutDashboard },
    { id: "Analytics", label: "Analytics", icon: TrendingUp },
    { id: "Bookings", label: "Bookings", icon: CalendarCheck },
    { id: "Messages", label: "Messages", icon: MessageSquare },
    { id: "Facilities", label: "Facilities", icon: Building2 },
    { id: "Finances", label: "Finances", icon: Wallet },
    { id: "Staff", label: "Staff", icon: Users },
    { id: "Settings", label: "Settings", icon: Settings },
    { id: "Guide", label: "Guide", icon: Compass },
  ];

  const tabMetadata: Record<string, { title: string; label: string; desc: string }> = {
    Today: {
      label: "Today",
      title: "Today's Schedule",
      desc: "See every time slot, who booked, and confirm or decline requests."
    },
    Reports: {
      label: "Reports",
      title: "Reports & Facility Overview",
      desc: "Live slot control, weekly occupancy, and monthly revenue summary."
    },
    Analytics: {
      label: "Analytics",
      title: "Performance Analytics & Demand Trends",
      desc: "Visual charts for peak booking hours and monthly revenue trends."
    },
    Bookings: {
      label: "Bookings",
      title: "Match Bookings & Approvals",
      desc: "Manage player match requests, confirm slots, and handle check-ins."
    },
    Messages: {
      label: "Messages",
      title: "Player Inquiries & Pitch Inbox",
      desc: "Chat directly with players asking about pitch availability and bookings."
    },
    Facilities: {
      label: "Facilities",
      title: "Turf Grounds & Pitches",
      desc: "View and edit pitch specifications, turf formats, and photos."
    },
    Finances: {
      label: "Finances",
      title: "Revenue & MoMo Payouts",
      desc: "Track completed matches, MTN & Airtel MoMo payouts, and statements."
    },
    Staff: {
      label: "Staff",
      title: "Pitch Marshals & Ground Staff",
      desc: "Manage venue staff, assign pitch roles, and grant booking permissions."
    },
    Settings: {
      label: "Settings",
      title: "Business & Venue Settings",
      desc: "Update venue contact information, operating rules, and policies."
    },
    Guide: {
      label: "Guide",
      title: "Owner Guide",
      desc: "Short lessons for running your pitch"
    }
  };

  const currentMeta = tabMetadata[activeTab] || tabMetadata.Today;

  const renderTodayTab = () => (
    <OwnerToday
      bookings={ownerBookings}
      loadingBookings={loadingBookings}
      bookingsError={bookingsError}
      onRetryBookings={handleRetryBookings}
      soundEnabled={soundEnabled}
      onToggleSound={handleToggleSound}
    />
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "Today":
        return renderTodayTab();
      case "Reports":
      case "Dashboard":
        return (
          <Suspense fallback={<LazyTabFallback />}>
            <LazyOwnerOverview />
          </Suspense>
        );
      case "Analytics":
        return (
          <Suspense fallback={<LazyTabFallback />}>
            <LazyOwnerAnalyticsDashboard />
          </Suspense>
        );
      case "Bookings":
        return <BookingManager />;
      case "Messages":
        return <OwnerInbox />;
      case "Finances":
        return <FinanceManager />;
      case "Staff":
        return <StaffManager />;
      case "Settings":
        return <BusinessSettings />;
      case "Guide":
        return <OwnerGuide />;
      default:
        return renderTodayTab();
    }
  };

  return (
    <Layout ownerWaitingCount={waitingCount}>
      <div className="w-full bg-app-base text-text-primary font-sans min-h-[calc(100vh-4rem)]">
        {/* Responsive Executive Header / Sub-Header */}
        <div className="sticky top-0 z-20 bg-app-base/95 backdrop-blur-md border-b border-border-subtle px-3 sm:px-5 lg:px-8 py-3.5 shadow-sm">
          <div className="max-w-7xl mx-auto flex flex-col gap-3">
            {/* Desktop & Tablet Top Tier: Title, Status Badge, and Primary Action Bar */}
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[11px] sm:text-xs font-bold text-text-tertiary uppercase tracking-wider">
                  <span>Venue Operations</span>
                  <span className="text-border-prominent">/</span>
                  <span className="text-primary-lime">{currentMeta.label}</span>
                </div>
                <div className="flex items-center gap-2.5 mt-0.5">
                  <h1 className="text-lg sm:text-2xl font-extrabold text-text-primary tracking-tight truncate">
                    {currentMeta.title}
                  </h1>
                  <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                    Live · Kampala Hub
                  </span>
                </div>
              </div>

              {/* Action Buttons: Add Pitch & Tour */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => openWalkthrough()}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 bg-surface-card hover:bg-surface-raised text-text-secondary hover:text-text-primary border border-border-subtle rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95"
                  title="How it works"
                >
                  <Compass size={15} className="text-primary-lime" />
                  <span className="hidden md:inline">How it works</span>
                </button>

                <button
                  onClick={() => navigate("/owner/add-pitch")}
                  className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-primary-lime hover:bg-[#96E600] text-accent-text font-extrabold uppercase tracking-wider text-xs rounded-xl transition-all cursor-pointer active:scale-95 shadow-sm shadow-primary-lime/20"
                >
                  <Plus size={15} strokeWidth={2.5} />
                  <span>New Pitch</span>
                </button>
              </div>
            </div>

            {/* Navigation Tabs Bar: Optimized for Desktop, Tablet, and Mobile */}
            <div className="flex items-center justify-between border-t border-border-subtle/60 pt-2.5">
              {/* Touch-scrollable & Desktop Segmented Control */}
              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1 w-full lg:w-auto">
                {navTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  const showWaitingBadge = tab.id === "Today" && waitingCount > 0;
                  return (
                    <button
                      key={tab.id}
                      id={`owner-tab-${tab.id.toLowerCase()}`}
                      onClick={() => handleTabChange(tab.id)}
                      className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer select-none active:scale-95 min-h-[38px] ${
                        isActive
                          ? "bg-primary-lime text-accent-text shadow-sm shadow-primary-lime/20 font-extrabold"
                          : "bg-surface-card text-text-secondary hover:bg-surface-raised hover:text-text-primary border border-border-subtle"
                      }`}
                    >
                      <Icon 
                        size={14} 
                        strokeWidth={isActive ? 2.5 : 2} 
                        className={isActive ? "text-accent-text" : "text-text-tertiary"} 
                      />
                      <span>{tab.label}</span>
                      {showWaitingBadge && (
                        <span
                          aria-label={`${waitingCount} waiting for approval`}
                          className="ml-0.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#EF4444] text-white text-xs font-extrabold tabular-nums leading-none"
                        >
                          {waitingCount > 99 ? "99+" : waitingCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Desktop Subtitle text for context */}
              <div className="hidden lg:block text-xs text-text-tertiary font-medium">
                {currentMeta.desc}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content Container */}
        <main className="w-full max-w-7xl mx-auto px-3 sm:px-5 lg:px-8 py-5 sm:py-7 pb-28 sm:pb-12">
          <div className="animate-fadeIn w-full">
            {renderTabContent()}
          </div>
        </main>
      </div>
    </Layout>
  );
};
