import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  MapPin,
  Star,
  SlidersHorizontal,
  X,
  RefreshCw,
  Zap,
  Layers,
  Compass,
  Trophy,
  Moon,
  QrCode,
  Heart,
  ArrowDown,
  Check,
  Clock,
  Sparkles,
  Flame,
  ShieldCheck,
  ChevronRight,
  Filter,
  Users,
  Presentation,
  ExternalLink,
  ArrowUp,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Layout } from "../components/Layout";
import { useUser } from "../context/UserContext";
import { useInteractiveWalkthrough } from "../context/InteractiveWalkthroughContext";
import { OwnerOverview } from "../components/owner/OwnerOverview";
import { useNavigate, Navigate } from "react-router-dom";
import { pitchService } from "../services/pitchService";
import { bookingService } from "../services/bookingService";
import { Pitch, Booking } from "../types/firebase";
import { PitchStatus, BookingStatus } from "../types";
import { PlayerAvatar } from "../components/PlayerAvatars";
import { Skeleton, PitchCardSkeleton, SpotlightCardSkeleton } from "../components/ui/Skeleton";
import { GettingStartedGuide } from "../components/onboarding/GettingStartedGuide";
import { FirstTimeUserTourModal } from "../components/onboarding/FirstTimeUserTourModal";
import { SmartDashboard } from "../components/dashboard/SmartDashboard";
import { HomeGamificationSummaryCard } from "../components/dashboard/HomeGamificationSummaryCard";
import { HomeActionGrid } from "../components/dashboard/HomeActionGrid";
import { HomeCommunityPickups } from "../components/dashboard/HomeCommunityPickups";

// Fallback high quality football pitches around Kampala
const DEFAULT_FALLBACK_PITCHES: Partial<Pitch>[] = [
  {
    id: "pitch-lugogo-1",
    name: "Lugogo AstroTurf Grounds",
    location: "Lugogo Bypass, Kampala",
    pricePerHour: 120000,
    pitchFormats: ["11-a-side", "Football", "Artificial Turf", "Floodlit"],
    images: ["https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=600&q=80"],
    status: PitchStatus.ACTIVE,
    latitude: 0.328,
    longitude: 32.602,
    amenities: ["Floodlights", "Changing rooms", "Parking", "Cafeteria"],
  },
  {
    id: "pitch-kansanga-2",
    name: "Kansanga Football Arena",
    location: "Ggaba Road, Kansanga, Kampala",
    pricePerHour: 80000,
    pitchFormats: ["7-a-side", "Football", "Floodlit"],
    images: ["https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=600&q=80"],
    status: PitchStatus.ACTIVE,
    latitude: 0.292,
    longitude: 32.608,
    amenities: ["Floodlights", "Locker room", "Cafeteria", "Parking"],
  },
  {
    id: "pitch-naguru-3",
    name: "Naguru Floodlit Turf Pitch",
    location: "Naguru Hill Road, Kampala",
    pricePerHour: 65000,
    pitchFormats: ["7-a-side", "Football", "Floodlit"],
    images: ["https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=600&q=80"],
    status: PitchStatus.ACTIVE,
    latitude: 0.345,
    longitude: 32.608,
    amenities: ["Synthetic grass", "Night floodlights", "Water station"],
  },
  {
    id: "pitch-kyanja-4",
    name: "Kyanja Mini Football Pitch",
    location: "Kyanja Ring Road, Kampala",
    pricePerHour: 50000,
    pitchFormats: ["5-a-side", "Football", "Artificial Turf"],
    images: ["https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=600&q=80"],
    status: PitchStatus.ACTIVE,
    latitude: 0.381,
    longitude: 32.615,
    amenities: ["5-a-side cages", "Water station", "Parking"],
  },
  {
    id: "pitch-munyonyo-5",
    name: "Munyonyo Synthetic Turf Ground",
    location: "Munyonyo Environs, Kampala",
    pricePerHour: 75000,
    pitchFormats: ["7-a-side", "Football", "Artificial Turf", "Floodlit"],
    images: ["https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=600&q=80"],
    status: PitchStatus.ACTIVE,
    latitude: 0.258,
    longitude: 32.628,
    amenities: ["High quality fiber", "Night lights", "Locker room"],
  },
  {
    id: "pitch-nakawa-6",
    name: "Nakawa Premier Football Stadium",
    location: "Jinja Road, Nakawa, Kampala",
    pricePerHour: 140000,
    pitchFormats: ["11-a-side", "Football", "Natural Turf"],
    images: ["https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?auto=format&fit=crop&w=600&q=80"],
    status: PitchStatus.ACTIVE,
    latitude: 0.332,
    longitude: 32.618,
    amenities: ["Natural grass", "Stadium seating", "Changing rooms", "Parking"],
  },
  {
    id: "pitch-tal-olympic-7",
    name: "Tal Olympic Arena",
    location: "Munyonyo Environs, Kampala",
    pricePerHour: 85000,
    pitchFormats: ["7-a-side", "5-a-side", "Football", "Floodlit"],
    images: ["https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=600&q=80"],
    status: PitchStatus.ACTIVE,
    latitude: 0.254,
    longitude: 32.625,
    amenities: ["Floodlights", "Changing rooms", "Parking", "Cafeteria"],
  },
];

// Kampala Hubs
const KAMPALA_HUBS = [
  "All Kampala",
  "Lugogo",
  "Naguru",
  "Kansanga",
  "Kyanja",
  "Munyonyo",
  "Nakawa",
  "Kololo",
];

const AMENITIES_LIST = [
  "Floodlights",
  "Changing rooms",
  "Parking",
  "Cafeteria",
  "Water station",
];

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile, user, role, loading, stats } = useUser();
  const { startWalkthrough } = useInteractiveWalkthrough();

  // State
  const [realPitches, setRealPitches] = useState<Pitch[]>([]);
  const [loadingPitches, setLoadingPitches] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<string>("All");
  const [selectedHub, setSelectedHub] = useState<string>("All Kampala");
  const [activeCollectionTab, setActiveCollectionTab] = useState<
    "all" | "trending" | "budget" | "floodlit" | "favorites"
  >("all");
  const [sortBy, setSortBy] = useState<"nearest" | "price-asc" | "price-desc" | "rating">("nearest");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [maxPriceFilter, setMaxPriceFilter] = useState(200000);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [userUpcomingBooking, setUserUpcomingBooking] = useState<Booking | null>(null);
  const [showTourModal, setShowTourModal] = useState(false);
  const [showGettingStarted, setShowGettingStarted] = useState<boolean>(() => {
    try {
      return localStorage.getItem("hasDismissedGettingStarted") !== "true";
    } catch {
      return true;
    }
  });

  const [favorites, setFavorites] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("pitchly_favorites");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Fetch Firestore pitches & user's upcoming match
  const fetchPitches = async () => {
    setLoadingPitches(true);
    try {
      const pitches = await pitchService.listPublic();
      setRealPitches(pitches);
    } catch (err) {
      console.warn("Failed to load real pitches, using fallbacks", err);
    } finally {
      setLoadingPitches(false);
    }
  };

  const fetchUserUpcomingBooking = async () => {
    if (!user) return;
    try {
      const bookings = await bookingService.listByUser(user.uid);
      const active = bookings.find((b) => {
        return (
          b.status === BookingStatus.CONFIRMED ||
          b.status === BookingStatus.PENDING_PAYMENT ||
          b.status === BookingStatus.PAYMENT_SUBMITTED ||
          b.status === BookingStatus.PENDING
        );
      });
      setUserUpcomingBooking(active || null);
    } catch (err) {
      console.warn("Could not fetch user booking for home screen", err);
    }
  };

  useEffect(() => {
    if (!loading) {
      fetchPitches();
      fetchUserUpcomingBooking();
    }
  }, [loading, user]);

  // Pull to refresh & live status state
  const [startY, setStartY] = useState(0);
  const [pullY, setPullY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [justUpdated, setJustUpdated] = useState(false);

  // Helper to determine if scroll position is at the very top
  const isScrolledToTop = () => {
    const mainEl = document.querySelector("main");
    const mainScroll = mainEl ? mainEl.scrollTop : 0;
    const winScroll = window.scrollY || document.documentElement.scrollTop || 0;
    return mainScroll <= 2 && winScroll <= 2;
  };

  // Trigger full refresh of pitches & user match data
  const handleManualOrPullRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    setPullY(54);
    try {
      await Promise.all([
        fetchPitches(),
        fetchUserUpcomingBooking(),
        new Promise((resolve) => setTimeout(resolve, 500)),
      ]);
      setJustUpdated(true);
      setTimeout(() => setJustUpdated(false), 1200);
    } catch (err) {
      console.warn("Refresh error:", err);
    } finally {
      setTimeout(() => {
        setRefreshing(false);
        setPullY(0);
      }, 300);
    }
  };

  // Pull to refresh touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isScrolledToTop() && !refreshing) {
      setStartY(e.touches[0].clientY);
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || refreshing) return;
    const currentY = e.touches[0].clientY;
    const dy = currentY - startY;
    if (dy > 0 && isScrolledToTop()) {
      const resistedDistance = Math.min(Math.pow(dy, 0.82) * 1.8, 72);
      setPullY(resistedDistance);
    } else {
      setPullY(0);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling) return;
    setIsPulling(false);
    if (pullY >= 46 && !refreshing) {
      await handleManualOrPullRefresh();
    } else {
      setPullY(0);
    }
  };

  // Smooth scroll & active section tracking for modern page navigation
  const [activeSection, setActiveSection] = useState<string>("radar");
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  // Smooth scroll handler with offset for sticky headers & padding
  const smoothScrollToSection = (sectionId: string, offset = 14) => {
    const el = document.getElementById(sectionId);
    if (!el) return;

    const scrollContainer =
      document.getElementById("main-content-scroll") ||
      document.querySelector("main.overflow-y-auto") ||
      window;

    if (scrollContainer && scrollContainer !== window) {
      const container = scrollContainer as HTMLElement;
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const targetY = container.scrollTop + (elRect.top - containerRect.top) - offset;

      container.scrollTo({
        top: Math.max(0, targetY),
        behavior: "smooth",
      });
    } else {
      const yOffset = -offset;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    }
  };

  // Monitor scroll position to update active section pill and show back-to-top button
  useEffect(() => {
    const sectionList = [
      { id: "walkthrough-radar-card", key: "radar" },
      { id: "walkthrough-format-categories", key: "categories" },
      { id: "featured-pitches-section", key: "recommended" },
      { id: "booking-section", key: "booking" },
      { id: "popular-section", key: "popular" },
    ];

    const scrollContainer =
      document.getElementById("main-content-scroll") ||
      document.querySelector("main.overflow-y-auto") ||
      window;

    const handleScroll = () => {
      const scrollY =
        scrollContainer === window
          ? window.scrollY
          : (scrollContainer as HTMLElement).scrollTop;

      setShowScrollTop(scrollY > 260);

      const containerTop =
        scrollContainer === window
          ? 0
          : (scrollContainer as HTMLElement).getBoundingClientRect().top;

      let current = "radar";
      for (const sec of sectionList) {
        const el = document.getElementById(sec.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          // Element has scrolled into upper viewing area
          if (rect.top - containerTop <= 180) {
            current = sec.key;
          }
        }
      }
      setActiveSection(current);
    };

    if (scrollContainer === window) {
      window.addEventListener("scroll", handleScroll, { passive: true });
    } else {
      (scrollContainer as HTMLElement).addEventListener("scroll", handleScroll, {
        passive: true,
      });
    }

    return () => {
      if (scrollContainer === window) {
        window.removeEventListener("scroll", handleScroll);
      } else {
        (scrollContainer as HTMLElement).removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  // Combine real pitches with fallback data
  const allPitches = useMemo(() => {
    if (realPitches.length > 0) {
      return realPitches.map((p, idx) => ({
        ...p,
        images: p.images?.length
          ? p.images
          : [DEFAULT_FALLBACK_PITCHES[idx % DEFAULT_FALLBACK_PITCHES.length]?.images?.[0] || ""],
        pitchFormats: p.pitchFormats?.length
          ? p.pitchFormats
          : [DEFAULT_FALLBACK_PITCHES[idx % DEFAULT_FALLBACK_PITCHES.length]?.pitchFormats?.[0] || "Football"],
        status: p.status || PitchStatus.ACTIVE,
        rating: (p as any).rating !== undefined && (p as any).rating !== null ? (p as any).rating : (4.8 + ((idx % 3) * 0.1)),
        reviewsCount: 20 + ((idx * 7) % 35),
      }));
    }
    return DEFAULT_FALLBACK_PITCHES as Pitch[];
  }, [realPitches]);

  // Spotlight pitches for carousel (all active pitches)
  const spotlightPitches = useMemo(() => {
    return allPitches.slice(0, 8);
  }, [allPitches]);

  // Time Greeting in Sentence Case
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  // User First Name
  const firstName = useMemo(() => {
    if (userProfile?.name) {
      return userProfile.name.trim().split(" ")[0];
    }
    if (user?.displayName) {
      return user.displayName.trim().split(" ")[0];
    }
    return "Player";
  }, [userProfile, user]);

  // Toggle favorites
  const toggleFavorite = (pitchId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const updated = { ...prev, [pitchId]: !prev[pitchId] };
      try {
        localStorage.setItem("pitchly_favorites", JSON.stringify(updated));
      } catch (err) {
        console.warn("Could not save favorites to localStorage", err);
      }
      return updated;
    });
  };

  // Check if a pitch has floodlights
  const hasFloodlight = (p: Partial<Pitch>) => {
    const formats = (p.pitchFormats || []).join(" ").toLowerCase();
    const amenities = (p.amenities || []).join(" ").toLowerCase();
    const name = (p.name || "").toLowerCase();
    return (
      formats.includes("flood") ||
      formats.includes("night") ||
      amenities.includes("flood") ||
      amenities.includes("night") ||
      amenities.includes("light") ||
      name.includes("floodlit")
    );
  };

  // Filter & Sort Pitches
  const filteredPitches = useMemo(() => {
    return allPitches
      .filter((pitch) => {
        // Search query
        const query = searchQuery.toLowerCase().trim();
        const matchesQuery =
          !query ||
          pitch.name?.toLowerCase().includes(query) ||
          pitch.location?.toLowerCase().includes(query) ||
          pitch.formattedAddress?.toLowerCase().includes(query) ||
          pitch.pitchFormats?.some((f) => f.toLowerCase().includes(query));

        // Hub / Area
        let matchesHub = true;
        if (selectedHub !== "All Kampala") {
          const h = selectedHub.toLowerCase();
          const locStr = (pitch.location || "" + " " + (pitch.formattedAddress || "")).toLowerCase();
          const nameStr = (pitch.name || "").toLowerCase();
          matchesHub = locStr.includes(h) || nameStr.includes(h);
        }

        // Format
        let matchesFormat = true;
        if (selectedFormat !== "All") {
          const f = selectedFormat.toLowerCase();
          const formatsStr = (pitch.pitchFormats || []).join(" ").toLowerCase();
          const nameStr = (pitch.name || "").toLowerCase();

          if (f.includes("5-a-side")) {
            matchesFormat = formatsStr.includes("5-a-side") || nameStr.includes("5") || nameStr.includes("cage");
          } else if (f.includes("7-a-side")) {
            matchesFormat = formatsStr.includes("7-a-side") || nameStr.includes("7") || nameStr.includes("arena");
          } else if (f.includes("11-a-side")) {
            matchesFormat = formatsStr.includes("11-a-side") || nameStr.includes("11") || nameStr.includes("stadium");
          } else if (f.includes("night") || f.includes("floodlit")) {
            matchesFormat = hasFloodlight(pitch);
          } else if (f.includes("turf") || f.includes("weather") || f.includes("artificial")) {
            matchesFormat =
              formatsStr.includes("artificial") ||
              formatsStr.includes("turf") ||
              nameStr.includes("turf") ||
              formatsStr.includes("astro");
          }
        }

        // Collection tab
        let matchesCollection = true;
        if (activeCollectionTab === "trending") {
          matchesCollection = ((pitch as any).rating || 4.8) >= 4.8;
        } else if (activeCollectionTab === "budget") {
          matchesCollection = (pitch.pricePerHour || 0) <= 80000;
        } else if (activeCollectionTab === "floodlit") {
          matchesCollection = hasFloodlight(pitch);
        } else if (activeCollectionTab === "favorites") {
          matchesCollection = !!favorites[pitch.id || ""];
        }

        // Price
        const matchesPrice = (pitch.pricePerHour || 0) <= maxPriceFilter;

        // Amenities filter
        let matchesAmenities = true;
        if (selectedAmenities.length > 0) {
          const pitchAmenities = (pitch.amenities || []).map((a) => a.toLowerCase());
          matchesAmenities = selectedAmenities.every((req) =>
            pitchAmenities.some((pa) => pa.includes(req.toLowerCase()))
          );
        }

        return (
          matchesQuery &&
          matchesHub &&
          matchesFormat &&
          matchesCollection &&
          matchesPrice &&
          matchesAmenities
        );
      })
      .sort((a, b) => {
        if (sortBy === "price-asc") {
          return (a.pricePerHour || 0) - (b.pricePerHour || 0);
        }
        if (sortBy === "price-desc") {
          return (b.pricePerHour || 0) - (a.pricePerHour || 0);
        }
        if (sortBy === "rating") {
          return ((b as any).rating || 4.8) - ((a as any).rating || 4.8);
        }
        return 0;
      });
  }, [
    allPitches,
    searchQuery,
    selectedHub,
    selectedFormat,
    activeCollectionTab,
    maxPriceFilter,
    selectedAmenities,
    sortBy,
    favorites,
  ]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedFormat !== "All") count++;
    if (selectedHub !== "All Kampala") count++;
    if (maxPriceFilter < 200000) count++;
    if (selectedAmenities.length > 0) count += selectedAmenities.length;
    if (sortBy !== "nearest") count++;
    return count;
  }, [selectedFormat, selectedHub, maxPriceFilter, selectedAmenities, sortBy]);

  // Customer Discover Screen View
  const DiscoverScreen = () => {
    return (
      <div
        className="min-h-[100dvh] bg-app-base text-text-primary pb-28 font-sans"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Pull to refresh interactive indicator banner */}
        <div
          className="flex flex-col justify-center items-center overflow-hidden transition-all duration-200 pointer-events-none"
          style={{
            height: `${pullY}px`,
            opacity: pullY > 8 || refreshing || justUpdated ? 1 : 0,
          }}
          aria-live="polite"
        >
          <div className="bg-surface-card rounded-full px-3 py-1.5 border border-border-subtle shadow-xs flex items-center gap-2 my-1">
            {justUpdated ? (
              <>
                <div className="w-4 h-4 rounded-full bg-primary-lime/20 text-primary-lime flex items-center justify-center shrink-0">
                  <Check size={11} strokeWidth={3} />
                </div>
                <span className="text-[11px] font-medium text-text-primary">
                  Availability up to date
                </span>
              </>
            ) : refreshing ? (
              <>
                <RefreshCw size={13} className="text-primary-lime animate-spin shrink-0" />
                <span className="text-[11px] font-medium text-primary-lime">
                  Checking live pitches...
                </span>
              </>
            ) : pullY >= 46 ? (
              <>
                <div className="w-4 h-4 rounded-full bg-primary-lime text-accent-text flex items-center justify-center shrink-0">
                  <ArrowDown
                    size={11}
                    strokeWidth={2.5}
                    className="rotate-180 transition-transform duration-200"
                  />
                </div>
                <span className="text-[11px] font-medium text-primary-lime">
                  Release to refresh
                </span>
              </>
            ) : (
              <>
                <ArrowDown
                  size={13}
                  className="text-text-tertiary transition-transform shrink-0"
                  style={{ transform: `rotate(${Math.min((pullY / 46) * 180, 180)}deg)` }}
                />
                <span className="text-[11px] font-medium text-text-secondary">
                  Pull to refresh
                </span>
              </>
            )}
          </div>
        </div>

        <main className="max-w-4xl mx-auto px-4 py-4 pb-24 space-y-6">
          {/* 1. WELCOME HERO & SEARCH */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-xs font-semibold text-text-secondary">
                  {new Date().getHours() < 12
                    ? "Good morning"
                    : new Date().getHours() < 17
                    ? "Good afternoon"
                    : "Good evening"}
                  , {userProfile?.name ? userProfile.name.split(" ")[0] : user?.displayName ? user.displayName.split(" ")[0] : "Player"} ⚡
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight font-display">
                  Find your matchday turf
                </h1>
              </div>

              <button
                onClick={() => navigate("/explore-map")}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-card hover:bg-surface-raised border border-border-subtle hover:border-border-prominent text-xs font-bold text-text-primary transition-all shadow-xs cursor-pointer shrink-0"
                title="View Kampala Map"
              >
                <MapPin size={14} className="text-primary-lime shrink-0" />
                <span>Map</span>
              </button>
            </div>

            {/* Search bar */}
            <section aria-label="Search" className="flex items-center gap-2.5">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Search pitch name or area (Lugogo, Naguru...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-surface-card text-[13px] text-text-primary placeholder-[#94949E] focus:outline-none focus:border-primary-lime/50 transition-colors border border-border-subtle"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary p-1 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowFilterModal(true)}
                className="w-11 h-11 rounded-xl bg-surface-raised hover:bg-border-subtle border border-border-subtle flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-xs cursor-pointer text-text-primary relative"
                title="Open filters"
              >
                <SlidersHorizontal size={16} className="text-text-primary" />
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary-lime text-accent-text text-[9px] font-black flex items-center justify-center shadow-xs">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </section>

            {/* Format Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {[
                { id: "All", label: "All Turfs" },
                { id: "5-a-side", label: "5-A-Side" },
                { id: "7-a-side", label: "7-A-Side" },
                { id: "11-a-side", label: "11-A-Side" },
                { id: "Outdoor", label: "Floodlit / Outdoor" },
              ].map((format) => {
                const isActive = selectedFormat === format.id;
                return (
                  <button
                    key={format.id}
                    type="button"
                    onClick={() => {
                      setSelectedFormat(format.id);
                      setSearchQuery("");
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      isActive
                        ? "bg-primary-lime text-accent-text font-bold shadow-xs"
                        : "bg-surface-card hover:bg-surface-raised border border-border-subtle text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {format.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. CORE QUICK ACTIONS */}
          <HomeActionGrid
            onExplorePitches={() => smoothScrollToSection("featured-pitches-section", 16)}
          />

          {/* 3. SMART MATCHDAY HUB */}
          <SmartDashboard 
            upcomingBooking={userUpcomingBooking}
            onExplorePitches={() => smoothScrollToSection("featured-pitches-section", 16)}
          />

          {/* 4. FEATURED & AVAILABLE TURFS */}
          <motion.section 
            id="featured-pitches-section" 
            aria-label="Available Turfs" 
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-20px" }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="space-y-4 scroll-mt-20"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-text-primary">
                  Available Turf Grounds
                </h2>
                <p className="text-xs text-text-secondary">
                  Verified artificial and grass pitches across Kampala
                </p>
              </div>
              <button 
                onClick={() => navigate("/explore-map")}
                className="text-xs font-bold text-primary-lime hover:underline transition-colors cursor-pointer flex items-center gap-0.5"
              >
                <span>View all ({filteredPitches.length})</span>
                <ChevronRight size={13} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {loadingPitches ? (
                Array.from({ length: 4 }).map((_, idx) => <PitchCardSkeleton key={idx} />)
              ) : filteredPitches.length > 0 ? (
                filteredPitches.slice(0, 6).map((pitch) => {
                  const firstImg = pitch.images?.[0] || DEFAULT_FALLBACK_PITCHES[0].images?.[0];
                  const isFav = !!favorites[pitch.id || ""];
                  const formatDetail = pitch.pitchFormats?.[0] || "5-A-Side";

                  return (
                    <article
                      key={pitch.id}
                      onClick={() => pitch.id && navigate(`/turf/${pitch.id}`)}
                      className="bg-surface-card rounded-2xl p-4 shadow-xs border border-border-subtle cursor-pointer group hover:border-border-prominent hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                    >
                      <div>
                        {/* Image */}
                        <div className="relative w-full h-[150px] rounded-xl overflow-hidden mb-3 bg-surface-raised">
                          <img
                            src={firstImg}
                            alt={pitch.name || "Football pitch"}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          
                          {/* Overlay: Verified */}
                          <div className="absolute top-2.5 left-2.5 bg-white/90 dark:bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-md flex items-center gap-1 text-[9.5px] font-bold text-text-primary border border-border-subtle shadow-xs">
                            <Flame size={11} className="text-amber-500 fill-amber-400" />
                            Verified
                          </div>

                          {/* Top Right: Heart */}
                          <button
                            type="button"
                            onClick={(e) => {
                              if (pitch.id) toggleFavorite(pitch.id, e);
                              e.stopPropagation();
                            }}
                            className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 dark:bg-black/75 backdrop-blur-md flex items-center justify-center text-text-tertiary hover:text-primary-lime border border-border-subtle transition-colors shadow-xs"
                          >
                            <Heart
                              size={14}
                              className={isFav ? "fill-primary-lime text-primary-lime" : ""}
                            />
                          </button>
                          
                          {/* Overlay: Rating */}
                          <div className="absolute bottom-2.5 right-2.5 bg-white/90 dark:bg-black/80 backdrop-blur-md px-2.5 py-0.5 rounded-md flex items-center gap-1 text-[11px] font-bold text-text-primary border border-border-subtle shadow-xs">
                            <Star size={11} className="fill-amber-400 text-amber-500" />
                            {(pitch as any).rating || 4.7}
                          </div>
                        </div>

                        {/* Content Structure */}
                        <div className="px-0.5 pb-1">
                          <div className="flex justify-between items-start mb-1.5">
                            <h3 className="text-[14px] font-bold text-text-primary leading-tight truncate pr-2 group-hover:text-primary-lime transition-colors">
                              {pitch.name}
                            </h3>
                            <div className="text-right flex flex-col shrink-0 ml-1">
                              <span className="text-[8.5px] text-text-tertiary uppercase tracking-wider leading-none">From</span>
                              <span className="text-[13px] font-black text-primary-lime leading-tight">
                                UGX {(pitch.pricePerHour || 50000).toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-text-secondary text-xs font-medium mb-3">
                            <div className="flex items-center gap-1 truncate">
                              <MapPin size={12} className="text-primary-lime shrink-0" />
                              <span className="truncate">{pitch.location || "Kampala, Uganda"}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Facilities Chips */}
                      <div className="flex items-center gap-1.5 pt-2.5 border-t border-border-subtle overflow-x-auto no-scrollbar">
                        <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40 whitespace-nowrap">
                          <span>{formatDetail}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40 whitespace-nowrap">
                          <Zap size={10} className="text-amber-500 fill-amber-400 shrink-0" />
                          <span>Floodlights</span>
                        </div>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="col-span-full py-12 text-center text-text-tertiary text-xs bg-surface-card rounded-2xl border border-border-subtle">
                  No pitches found matching your criteria.
                </div>
              )}
            </div>
          </motion.section>

          {/* 5. COMMUNITY OPEN PICKUPS */}
          <HomeCommunityPickups />

          {/* FLOATING SMOOTH SCROLL TO TOP BUTTON */}
          <AnimatePresence>
            {showScrollTop && (
              <motion.button
                type="button"
                initial={{ opacity: 0, scale: 0.8, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 15 }}
                transition={{ duration: 0.2 }}
                onClick={() => smoothScrollToSection("main-top-anchor", 0)}
                className="fixed bottom-20 lg:bottom-8 right-5 z-40 w-10 h-10 rounded-full bg-surface-card/95 hover:bg-surface-raised text-primary-lime border border-border-subtle shadow-lg flex items-center justify-center cursor-pointer active:scale-90 transition-all backdrop-blur-md"
                aria-label="Scroll to top"
                title="Smooth scroll to top"
              >
                <ArrowUp size={18} strokeWidth={2.5} />
              </motion.button>
            )}
          </AnimatePresence>
        </main>

        {/* 8. MODERN FILTER MODAL SHEET */}
        {showFilterModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-surface-card border border-border-subtle rounded-2xl max-w-md w-full p-4 space-y-4 text-text-primary relative shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-lime/15 text-primary-lime flex items-center justify-center border border-primary-lime/30">
                    <SlidersHorizontal size={15} />
                  </div>
                  <h3 className="text-sm font-semibold text-text-primary">
                    Filter Pitch Grounds
                  </h3>
                </div>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="w-7 h-7 rounded-full hover:bg-surface-raised flex items-center justify-center text-text-tertiary hover:text-text-primary"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Price filter */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-secondary font-medium">
                    Maximum Hourly Rate
                  </span>
                  <span className="text-primary-lime font-bold">
                    UGX {maxPriceFilter.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min="30000"
                  max="200000"
                  step="5000"
                  value={maxPriceFilter}
                  onChange={(e) => setMaxPriceFilter(Number(e.target.value))}
                  className="w-full accent-[#A8FF00] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-text-tertiary">
                  <span>UGX 30k</span>
                  <span>UGX 100k</span>
                  <span>UGX 200k</span>
                </div>
              </div>

              {/* Kampala Hubs */}
              <div className="space-y-2 pt-2 border-t border-border-subtle">
                <label className="text-xs text-text-secondary font-medium block">
                  Kampala Neighborhood Hub
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {KAMPALA_HUBS.map((hub) => (
                    <button
                      key={hub}
                      onClick={() => setSelectedHub(hub)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-medium text-center truncate transition-colors cursor-pointer ${
                        selectedHub === hub
                          ? "bg-primary-lime text-accent-text font-bold shadow-sm"
                          : "bg-surface-raised border border-border-subtle text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      {hub}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amenities checkboxes */}
              <div className="space-y-2 pt-2 border-t border-border-subtle">
                <label className="text-xs text-text-secondary font-medium block">
                  Required Amenities
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {AMENITIES_LIST.map((amenity) => {
                    const isChecked = selectedAmenities.includes(amenity);
                    return (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => {
                          if (isChecked) {
                            setSelectedAmenities(selectedAmenities.filter((a) => a !== amenity));
                          } else {
                            setSelectedAmenities([...selectedAmenities, amenity]);
                          }
                        }}
                        className={`p-2 rounded-xl border text-xs flex items-center gap-2 text-left transition-colors cursor-pointer ${
                          isChecked
                            ? "bg-primary-lime/10 border-primary-lime text-primary-lime font-medium"
                            : "bg-surface-raised border-border-subtle text-text-secondary hover:text-text-primary"
                        }`}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded flex items-center justify-center ${
                            isChecked ? "bg-primary-lime text-accent-text" : "border border-[#71717A]"
                          }`}
                        >
                          {isChecked && <Check size={10} strokeWidth={3} />}
                        </div>
                        <span className="truncate">{amenity}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sort selector */}
              <div className="space-y-2 pt-2 border-t border-border-subtle">
                <label className="text-xs text-text-secondary font-medium block">
                  Sort Results
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: "nearest", label: "Featured" },
                    { id: "rating", label: "Highest Rated" },
                    { id: "price-asc", label: "Lowest Price" },
                    { id: "price-desc", label: "Highest Price" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSortBy(s.id as any)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        sortBy === s.id
                          ? "bg-primary-lime text-accent-text font-bold"
                          : "bg-surface-raised border border-border-subtle text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 flex items-center gap-2 border-t border-border-subtle">
                <button
                  onClick={() => {
                    setMaxPriceFilter(200000);
                    setSelectedFormat("All");
                    setSelectedHub("All Kampala");
                    setSelectedAmenities([]);
                    setSortBy("nearest");
                    setSearchQuery("");
                  }}
                  className="flex-1 h-11 rounded-full border border-border-subtle text-[12px] font-medium text-text-secondary hover:bg-surface-raised hover:text-text-primary cursor-pointer"
                >
                  Reset all
                </button>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="flex-1 h-11 rounded-full bg-primary-lime hover:bg-[#96E600] text-accent-text text-[12px] font-bold transition-colors shadow-xs cursor-pointer"
                >
                  Show {filteredPitches.length} Pitches
                </button>
              </div>
            </div>
          </div>
        )}

        {/* First Time User Maneuver Tour Modal */}
        <FirstTimeUserTourModal
          isOpen={showTourModal}
          onClose={() => setShowTourModal(false)}
          role={role?.toLowerCase() || "player"}
        />
      </div>
    );
  };

  return (
    <Layout>
      {(() => {
        if (role === "PLAYER") return <DiscoverScreen />;
        if (role === "OWNER") {
          return (
            <div className="p-4">
              <OwnerOverview />
            </div>
          );
        }
        if (role === "ADMIN" || role === "admin" || role === "super_admin") {
          return <Navigate to="/admin/overview" replace />;
        }
        return <Navigate to="/auth" replace />;
      })()}
    </Layout>
  );
};

export default Home;
