import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  MapPin,
  Star,
  SlidersHorizontal,
  X,
  RefreshCw,
  Zap,
  Clock,
  Check,
  ArrowDown,
  ShieldCheck,
  ChevronRight,
  Filter,
  ArrowUp,
  ChevronDown,
  Calendar,
  Sparkles,
  Trophy,
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
import { TURFS } from "../constants";
import { Skeleton, PitchCardSkeleton } from "../components/ui/Skeleton";
import { FirstTimeUserTourModal } from "../components/onboarding/FirstTimeUserTourModal";
import { SmartDashboard } from "../components/dashboard/SmartDashboard";
import { HomeCommunityPickups } from "../components/dashboard/HomeCommunityPickups";
import { MatchdayDateStrip } from "../components/home/MatchdayDateStrip";
import { FootballPitchCard } from "../components/home/FootballPitchCard";
import { MatchdayBanner } from "../components/home/MatchdayBanner";
import { QuickBookingModal } from "../components/home/QuickBookingModal";

// Kampala Neighborhood Hubs
const KAMPALA_HUBS = [
  "All Kampala",
  "Lugogo",
  "Naguru",
  "Bugolobi",
  "Ntinda",
  "Muyenga",
  "Kansanga",
  "Kyanja",
  "Nakawa",
  "Kololo",
];

const AMENITIES_LIST = [
  "Floodlights",
  "Changing Rooms",
  "Showers",
  "Secure Parking",
  "Cafeteria",
  "Free WiFi",
];

// Sort Options with clean labels
const SORT_OPTIONS: { id: "recommended" | "rating" | "price-asc" | "price-desc"; label: string; shortLabel: string }[] = [
  { id: "recommended", label: "Recommended", shortLabel: "Recommended" },
  { id: "rating", label: "Top Rated", shortLabel: "Top Rated" },
  { id: "price-asc", label: "Price: Low to High", shortLabel: "Lowest Price" },
  { id: "price-desc", label: "Price: High to Low", shortLabel: "Highest Price" },
];

// Fallback pitches mapped from TURFS for complete sports consistency
const FALLBACK_PITCHES: Partial<Pitch>[] = TURFS.map((t) => ({
  id: `pitch-${t.id}`,
  name: t.name,
  location: t.location,
  formattedAddress: t.formattedAddress || t.fullAddress,
  pricePerHour: t.pricePerHour,
  pitchFormats: t.pitchFormats || ["7-a-side", "Artificial Turf"],
  images: t.images && t.images.length > 0 ? t.images : [t.image || ""],
  status: t.status || PitchStatus.ACTIVE,
  latitude: t.latitude,
  longitude: t.longitude,
  amenities: t.amenities || ["Floodlights", "Changing Rooms", "Parking"],
  isVerified: true,
  rating: t.rating || 4.8,
  distance: t.distance || "1.8 km",
  surfaceType: t.name.toLowerCase().includes("grass")
    ? "Natural Grass"
    : t.name.toLowerCase().includes("futsal") || t.name.toLowerCase().includes("fusion")
    ? "Indoor Futsal Turf"
    : "FIFA Synthetic Turf",
} as any));

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile, user, role, loading } = useUser();

  // Selected Matchday date (default: today)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });

  // State for data
  const [realPitches, setRealPitches] = useState<Pitch[]>([]);
  const [loadingPitches, setLoadingPitches] = useState(true);
  const [userUpcomingBooking, setUserUpcomingBooking] = useState<Booking | null>(null);
  const [loadingBooking, setLoadingBooking] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<string>("All");
  const [selectedHub, setSelectedHub] = useState<string>("All Kampala");
  const [activeCollectionTab, setActiveCollectionTab] = useState<
    "all" | "trending" | "budget" | "floodlit" | "favorites"
  >("all");
  const [sortBy, setSortBy] = useState<"recommended" | "price-asc" | "price-desc" | "rating">("recommended");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = React.useRef<HTMLDivElement>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [maxPriceFilter, setMaxPriceFilter] = useState(150000);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  // Quick Booking Modal state
  const [quickBookingPitch, setQuickBookingPitch] = useState<Partial<Pitch> | null>(null);
  const [quickBookingSlot, setQuickBookingSlot] = useState<string>("19:00");
  const [showQuickBookingModal, setShowQuickBookingModal] = useState(false);

  // Tour modal
  const [showTourModal, setShowTourModal] = useState(false);

  // Favorites state
  const [favorites, setFavorites] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("pitchly_favorites");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Pull to refresh & status
  const [pullY, setPullY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [startY, setStartY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [justUpdated, setJustUpdated] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Fetch Firestore Pitches
  const fetchPitches = async () => {
    setLoadingPitches(true);
    try {
      const pitches = await pitchService.listPublic();
      setRealPitches(pitches);
    } catch (err) {
      console.warn("Using fallback football pitches", err);
    } finally {
      setLoadingPitches(false);
    }
  };

  // Fetch User's Upcoming Booking
  const fetchUserUpcomingBooking = async () => {
    if (!user) {
      setLoadingBooking(false);
      return;
    }
    setLoadingBooking(true);
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
      console.warn("Could not fetch user booking", err);
    } finally {
      setLoadingBooking(false);
    }
  };

  useEffect(() => {
    
    if (!loading) {
      fetchPitches();
      fetchUserUpcomingBooking();
    }
  }, [loading, user]);

  // Combine real pitches with rich fallback data
  const allPitches = useMemo(() => {
    if (realPitches.length > 0) {
      return realPitches.map((p, idx) => ({
        ...p,
        images: p.images?.length
          ? p.images
          : [FALLBACK_PITCHES[idx % FALLBACK_PITCHES.length]?.images?.[0] || ""],
        pitchFormats: p.pitchFormats?.length
          ? p.pitchFormats
          : [FALLBACK_PITCHES[idx % FALLBACK_PITCHES.length]?.pitchFormats?.[0] || "7-a-side"],
        status: p.status || PitchStatus.ACTIVE,
        rating: (p as any).rating || 4.8,
        reviewsCount: 20 + ((idx * 7) % 35),
        distance: (p as any).distance || `${(1.2 + (idx * 0.7) % 4).toFixed(1)} km`,
      }));
    }
    return FALLBACK_PITCHES as Pitch[];
  }, [realPitches]);

  // Top rated / spotlight pitches
  const spotlightPitches = useMemo(() => {
    return allPitches.slice(0, 6);
  }, [allPitches]);

  // Time Greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  // User Full Name
  const firstName = useMemo(() => {
    let name = "Player";
    if (userProfile?.name) {
      name = userProfile.name;
    } else if (user?.displayName) {
      name = user.displayName;
    }
    // Clean up "Owner " prefix if it was accidentally saved
    return name.trim().replace(/^owner\s+/i, '').trim();
  }, [userProfile, user]);

  // Toggle favorite
  const toggleFavorite = (pitchId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const updated = { ...prev, [pitchId]: !prev[pitchId] };
      try {
        localStorage.setItem("pitchly_favorites", JSON.stringify(updated));
      } catch (err) {
        console.warn("Could not save favorites", err);
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
      amenities.includes("light") ||
      name.includes("floodlit")
    );
  };

  // Open Quick Booking Sheet
  const handleOpenQuickBooking = (pitch: Partial<Pitch>, slot: string) => {
    setQuickBookingPitch(pitch);
    setQuickBookingSlot(slot);
    setShowQuickBookingModal(true);
  };

  // Smooth scroll
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
      container.scrollTo({ top: Math.max(0, targetY), behavior: "smooth" });
    } else {
      const y = el.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    }
  };

  // Scroll listener for back to top
  useEffect(() => {
    const scrollContainer =
      document.getElementById("main-content-scroll") ||
      document.querySelector("main.overflow-y-auto") ||
      window;

    const handleScroll = () => {
      const scrollY =
        scrollContainer === window
          ? window.scrollY
          : (scrollContainer as HTMLElement).scrollTop;
      setShowScrollTop(scrollY > 280);
    };

    if (scrollContainer === window) {
      window.addEventListener("scroll", handleScroll, { passive: true });
    } else {
      (scrollContainer as HTMLElement).addEventListener("scroll", handleScroll, { passive: true });
    }

    return () => {
      if (scrollContainer === window) {
        window.removeEventListener("scroll", handleScroll);
      } else {
        (scrollContainer as HTMLElement).removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  // Close sort menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setShowSortMenu(false);
      }
    };
    if (showSortMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSortMenu]);

  // Filter & Sort Pitches
  const filteredPitches = useMemo(() => {
    return allPitches
      .filter((pitch) => {
        // Query search
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
          const loc = (pitch.location || "" + " " + (pitch.formattedAddress || "")).toLowerCase();
          const name = (pitch.name || "").toLowerCase();
          matchesHub = loc.includes(h) || name.includes(h);
        }

        // Format
        let matchesFormat = true;
        if (selectedFormat !== "All") {
          const f = selectedFormat.toLowerCase();
          const formatsStr = (pitch.pitchFormats || []).join(" ").toLowerCase();
          const nameStr = (pitch.name || "").toLowerCase();

          if (f.includes("5-a-side")) {
            matchesFormat = formatsStr.includes("5-a-side") || nameStr.includes("5") || nameStr.includes("cage") || nameStr.includes("futsal");
          } else if (f.includes("7-a-side")) {
            matchesFormat = formatsStr.includes("7-a-side") || nameStr.includes("7") || nameStr.includes("arena");
          } else if (f.includes("11-a-side")) {
            matchesFormat = formatsStr.includes("11-a-side") || nameStr.includes("11") || nameStr.includes("stadium");
          } else if (f.includes("floodlit")) {
            matchesFormat = hasFloodlight(pitch);
          }
        }

        // Collection tab
        let matchesCollection = true;
        if (activeCollectionTab === "trending") {
          matchesCollection = ((pitch as any).rating || 4.8) >= 4.8;
        } else if (activeCollectionTab === "budget") {
          matchesCollection = (pitch.pricePerHour || 0) <= 75000;
        } else if (activeCollectionTab === "floodlit") {
          matchesCollection = hasFloodlight(pitch);
        } else if (activeCollectionTab === "favorites") {
          matchesCollection = !!favorites[pitch.id || ""];
        }

        // Price
        const matchesPrice = (pitch.pricePerHour || 0) <= maxPriceFilter;

        // Amenities
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
        return 0; // recommended
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
    if (maxPriceFilter < 150000) count++;
    if (selectedAmenities.length > 0) count += selectedAmenities.length;
    if (sortBy !== "recommended") count++;
    return count;
  }, [selectedFormat, selectedHub, maxPriceFilter, selectedAmenities, sortBy]);

  // Pull to refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const mainEl = document.querySelector("main");
    if ((!mainEl || mainEl.scrollTop <= 2) && !refreshing) {
      setStartY(e.touches[0].clientY);
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || refreshing) return;
    const dy = e.touches[0].clientY - startY;
    if (dy > 0) {
      setPullY(Math.min(Math.pow(dy, 0.8) * 1.8, 65));
    } else {
      setPullY(0);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling) return;
    setIsPulling(false);
    if (pullY >= 45 && !refreshing) {
      setRefreshing(true);
      await Promise.all([fetchPitches(), fetchUserUpcomingBooking()]);
      setJustUpdated(true);
      setTimeout(() => setJustUpdated(false), 1500);
      setRefreshing(false);
    }
    setPullY(0);
  };

  // Customer Player Discover View
  const DiscoverScreen = () => {
    return (
      <div
        id="home-discover-screen"
        className="min-h-full bg-app-base text-text-primary pb-28 font-sans selection:bg-primary-lime/30"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Pull To Refresh Live Banner */}
        <div
          id="pull-to-refresh-banner"
          className="flex flex-col justify-center items-center overflow-hidden transition-all duration-200 pointer-events-none"
          style={{
            height: `${pullY}px`,
            opacity: pullY > 8 || refreshing || justUpdated ? 1 : 0,
          }}
        >
          <div className="bg-surface-card rounded-full px-3 py-1.5 border border-border-subtle shadow-xs flex items-center gap-2 my-1">
            {justUpdated ? (
              <>
                <div className="w-4 h-4 rounded-full bg-primary-lime/20 text-primary-lime flex items-center justify-center">
                  <Check size={11} strokeWidth={3} />
                </div>
                <span className="text-[11px] font-bold text-text-primary">
                  Pitch availability updated
                </span>
              </>
            ) : refreshing ? (
              <>
                <RefreshCw size={13} className="text-primary-lime animate-spin" />
                <span className="text-[11px] font-bold text-primary-lime">
                  Checking live matchday slots...
                </span>
              </>
            ) : (
              <>
                <ArrowDown
                  size={13}
                  className="text-text-tertiary transition-transform"
                  style={{ transform: `rotate(${Math.min((pullY / 45) * 180, 180)}deg)` }}
                />
                <span className="text-[11px] font-medium text-text-secondary">
                  {pullY >= 45 ? "Release to refresh" : "Pull to check slots"}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6 sm:space-y-8">
          {/* 1. MATCHDAY HERO HEADER & DATE SELECTOR */}
          <div id="matchday-hero-header" className="space-y-4">
            <div className="space-y-1.5 min-w-0">
              {/* Hero Title - Refined High-Appeal Greeting */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight font-display text-text-primary">
                <span className="font-semibold text-text-secondary">{greeting}, </span>
                <span className="text-primary-lime font-black">{firstName}</span>
              </h1>
            </div>

            {/* Matchday Date Selector Strip */}
            <MatchdayDateStrip
              selectedDate={selectedDate}
              onSelectDate={(date) => setSelectedDate(date)}
            />
          </div>

          {/* 3. DUAL-COLUMN MATCHDAY DASHBOARD GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* PRIMARY COLUMN: DISCOVERY & BOOKING (8 cols on desktop) */}
            <div className="lg:col-span-8 space-y-7 sm:space-y-8 min-w-0">
              {/* Available Pitches & Direct Slot Booking (CORE PURPOSE) */}
              <motion.section
                id="pitches-booking-section"
                aria-label="Available Football Grounds"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-20px" }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="space-y-4 sm:space-y-5 scroll-mt-20"
              >
                {/* Section Heading & Sort Dropdown */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pt-1 border-b border-border-subtle pb-3.5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <div className="relative flex items-center justify-center">
                        <span className="w-2.5 h-2.5 rounded-full bg-primary-lime shrink-0 shadow-[0_0_8px_rgba(22,163,74,0.5)]" />
                        <span className="w-2.5 h-2.5 rounded-full bg-primary-lime  absolute opacity-40" />
                      </div>
                      <h2 className="text-lg sm:text-xl font-black text-text-primary tracking-tight font-display uppercase">
                        Available Pitches
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full bg-primary-lime/10 text-primary-lime border border-primary-lime/25 text-[11px] font-bold tracking-tight shadow-2xs">
                        {filteredPitches.length} {filteredPitches.length === 1 ? "ground" : "grounds"}
                      </span>
                    </div>
                  </div>

                  {/* Filters & Sort Controls */}
                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
                    {/* Filters Modal Trigger */}
                    <button
                      id="open-filters-modal-btn"
                      type="button"
                      onClick={() => setShowFilterModal(true)}
                      className={`h-9 px-3.5 sm:px-4 rounded-full border flex items-center gap-2 shrink-0 transition-all cursor-pointer font-bold text-xs active:scale-95 ${
                        activeFiltersCount > 0
                          ? "bg-primary-lime text-white border-primary-lime shadow-sm shadow-primary-lime/20"
                          : "bg-surface-card hover:bg-surface-raised border-border-subtle text-text-secondary hover:text-text-primary shadow-2xs"
                      }`}
                      title="Open pitch filters"
                    >
                      <SlidersHorizontal size={13} className={activeFiltersCount > 0 ? "text-white" : "text-text-secondary"} />
                      <span className="text-[11px] font-bold uppercase tracking-wider">Filters</span>
                      {activeFiltersCount > 0 && (
                        <span className="min-w-4 h-4 px-1 rounded-full bg-white text-primary-lime text-[10px] font-black flex items-center justify-center shadow-2xs ml-0.5">
                          {activeFiltersCount}
                        </span>
                      )}
                    </button>

                    {/* Custom Sort Dropdown */}
                    <div className="relative shrink-0" ref={sortMenuRef}>
                      <button
                        id="pitch-sort-menu-btn"
                        type="button"
                        onClick={() => setShowSortMenu((prev) => !prev)}
                        className={`h-9 px-3.5 sm:px-4 rounded-full border transition-all flex items-center gap-2 text-xs font-bold cursor-pointer shadow-2xs active:scale-95 ${
                          showSortMenu
                            ? "bg-surface-raised border-primary-lime/40 text-text-primary"
                            : "bg-surface-card hover:bg-surface-raised border-border-subtle text-text-secondary hover:text-text-primary"
                        }`}
                        aria-haspopup="true"
                        aria-expanded={showSortMenu}
                      >
                        <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">
                          Sort
                        </span>
                        <span className="w-px h-3.5 bg-border-subtle" />
                        <span className="text-text-primary font-bold text-[11px]">
                          {SORT_OPTIONS.find((o) => o.id === sortBy)?.shortLabel || "Recommended"}
                        </span>
                        <ChevronDown
                          size={13}
                          className={`text-text-tertiary transition-transform duration-200 ${
                            showSortMenu ? "rotate-180 text-primary-lime" : ""
                          }`}
                        />
                      </button>

                      {/* Hidden select for full programmatic & testing accessibility */}
                      <select
                        id="pitch-sort-select"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="sr-only"
                        aria-label="Sort pitches"
                      >
                        {SORT_OPTIONS.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        ))}
                      </select>

                      {/* Floating Dropdown Menu */}
                      <AnimatePresence>
                        {showSortMenu && (
                          <motion.div
                            initial={{ opacity: 0, y: -4, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.97 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="absolute right-0 mt-1.5 w-48 rounded-2xl bg-surface-card border border-border-subtle shadow-xl py-1.5 z-40 overflow-hidden"
                          >
                            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-text-tertiary border-b border-border-subtle/50 mb-1">
                              Sort Grounds By
                            </div>
                            {SORT_OPTIONS.map((opt) => {
                              const isSelected = sortBy === opt.id;
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => {
                                    setSortBy(opt.id);
                                    setShowSortMenu(false);
                                  }}
                                  className={`w-full px-3 py-2 text-left text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                                    isSelected
                                      ? "bg-primary-lime/10 text-primary-lime"
                                      : "text-text-primary hover:bg-surface-raised"
                                  }`}
                                >
                                  <span>{opt.label}</span>
                                  {isSelected && <Check size={14} className="text-primary-lime stroke-[2.5]" />}
                                </button>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Pitch Cards Grid with 1-Tap Slot Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {loadingPitches ? (
                    Array.from({ length: 4 }).map((_, idx) => <PitchCardSkeleton key={idx} />)
                  ) : filteredPitches.length > 0 ? (
                    filteredPitches.map((pitch) => (
                      <FootballPitchCard
                        key={pitch.id}
                        pitch={pitch}
                        isFavorite={!!favorites[pitch.id || ""]}
                        onToggleFavorite={toggleFavorite}
                        onSelectSlot={handleOpenQuickBooking}
                        selectedDate={selectedDate}
                      />
                    ))
                  ) : (
                    <div className="col-span-full py-16 text-center text-text-tertiary text-xs bg-surface-card rounded-3xl border border-border-subtle space-y-3 p-6">
                      <div className="w-12 h-12 rounded-2xl bg-surface-raised border border-border-subtle flex items-center justify-center mx-auto text-text-tertiary">
                        <Search size={22} />
                      </div>
                      <h3 className="text-sm font-bold text-text-primary">No pitches match your filters</h3>
                      <p className="max-w-xs mx-auto text-text-secondary">
                        Try adjusting your maximum price, neighborhood, or format options.
                      </p>
                      <button
                        id="reset-filters-empty-state-btn"
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedFormat("All");
                          setSelectedHub("All Kampala");
                          setActiveCollectionTab("all");
                          setMaxPriceFilter(150000);
                          setSelectedAmenities([]);
                          setSortBy("recommended");
                        }}
                        className="px-4 py-2 rounded-xl bg-primary-lime text-accent-text text-xs font-black transition-transform active:scale-95 cursor-pointer shadow-sm"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  )}
                </div>
              </motion.section>

              {/* Community Open Pickup Matches */}
              <HomeCommunityPickups loading={loadingPitches} />
            </div>

            {/* DASHBOARD COMPANION RAIL: UPCOMING TICKET, WEATHER & SPECIALS (4 cols on desktop) */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-4 min-w-0">
              {/* Smart Matchday Hub (Next Matchday / Active Upcoming Booking Ticket) */}
              <SmartDashboard
                upcomingBooking={userUpcomingBooking}
                loading={loadingBooking}
                onExplorePitches={() => smoothScrollToSection("pitches-booking-section", 16)}
              />

              {/* Matchday Promotions & Floodlight Sessions */}
              <MatchdayBanner
                onFilterFloodlit={() => {
                  setActiveCollectionTab("floodlit");
                  smoothScrollToSection("pitches-booking-section", 16);
                }}
              />
            </div>
          </div>

          {/* BACK TO TOP FLOATING BUTTON */}
          <AnimatePresence>
            {showScrollTop && (
              <motion.button
                id="floating-scroll-top-btn"
                type="button"
                initial={{ opacity: 0, scale: 0.8, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 15 }}
                transition={{ duration: 0.2 }}
                onClick={() => smoothScrollToSection("matchday-hero-header", 0)}
                className="fixed bottom-20 lg:bottom-8 right-5 z-40 w-11 h-11 rounded-full bg-surface-card/95 hover:bg-surface-raised text-primary-lime border border-border-subtle shadow-xl flex items-center justify-center cursor-pointer active:scale-90 transition-all backdrop-blur-md"
                aria-label="Scroll to top"
                title="Back to top"
              >
                <ArrowUp size={20} strokeWidth={2.5} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* 8. QUICK BOOKING SLIDE-UP MODAL */}
        <QuickBookingModal
          isOpen={showQuickBookingModal}
          onClose={() => setShowQuickBookingModal(false)}
          pitch={quickBookingPitch}
          selectedDate={selectedDate}
          initialTimeSlot={quickBookingSlot}
        />

        {/* 9. DETAILED FILTER MODAL SHEET */}
        {showFilterModal && (
          <div
            id="filter-modal-backdrop"
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          >
            <div
              id="filter-modal-content"
              className="bg-surface-card border border-border-subtle rounded-3xl max-w-md w-full p-5 space-y-4 text-text-primary relative shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary-lime/15 text-primary-lime flex items-center justify-center border border-primary-lime/30">
                    <SlidersHorizontal size={16} />
                  </div>
                  <h3 className="text-sm font-black text-text-primary uppercase tracking-tight">
                    Filter Pitches
                  </h3>
                </div>
                <button
                  id="filter-modal-close-btn"
                  onClick={() => setShowFilterModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-surface-raised flex items-center justify-center text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Price filter */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-secondary font-bold">Maximum Hourly Rate</span>
                  <span className="text-primary-lime font-black text-sm">
                    UGX {maxPriceFilter.toLocaleString()}
                  </span>
                </div>
                <input
                  id="filter-price-slider"
                  type="range"
                  min="40000"
                  max="200000"
                  step="5000"
                  value={maxPriceFilter}
                  onChange={(e) => setMaxPriceFilter(Number(e.target.value))}
                  className="w-full accent-[#A8FF00] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-text-tertiary font-bold">
                  <span>UGX 40k</span>
                  <span>UGX 100k</span>
                  <span>UGX 200k</span>
                </div>
              </div>

              {/* Kampala Hubs Grid */}
              <div className="space-y-2 pt-2 border-t border-border-subtle">
                <label className="text-xs text-text-secondary font-bold block">
                  Neighborhood Hub
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {KAMPALA_HUBS.map((hub) => (
                    <button
                      key={hub}
                      id={`hub-filter-btn-${hub}`}
                      type="button"
                      onClick={() => setSelectedHub(hub)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold text-center truncate transition-colors cursor-pointer ${
                        selectedHub === hub
                          ? "bg-primary-lime text-accent-text font-black shadow-xs"
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
                <label className="text-xs text-text-secondary font-bold block">
                  Required Amenities
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {AMENITIES_LIST.map((amenity) => {
                    const isChecked = selectedAmenities.includes(amenity);
                    return (
                      <button
                        key={amenity}
                        id={`amenity-toggle-${amenity}`}
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
                            ? "bg-primary-lime/10 border-primary-lime text-primary-lime font-bold"
                            : "bg-surface-raised border-border-subtle text-text-secondary hover:text-text-primary"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center ${
                            isChecked ? "bg-primary-lime text-accent-text" : "border border-border-prominent"
                          }`}
                        >
                          {isChecked && <Check size={11} strokeWidth={3} />}
                        </div>
                        <span className="truncate">{amenity}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 flex items-center gap-2 border-t border-border-subtle">
                <button
                  id="filter-modal-reset-btn"
                  type="button"
                  onClick={() => {
                    setMaxPriceFilter(150000);
                    setSelectedFormat("All");
                    setSelectedHub("All Kampala");
                    setSelectedAmenities([]);
                    setSortBy("recommended");
                    setSearchQuery("");
                  }}
                  className="flex-1 h-11 rounded-full border border-border-subtle text-xs font-bold text-text-secondary hover:bg-surface-raised hover:text-text-primary cursor-pointer"
                >
                  Reset all
                </button>
                <button
                  id="filter-modal-apply-btn"
                  type="button"
                  onClick={() => setShowFilterModal(false)}
                  className="flex-1 h-11 rounded-full bg-primary-lime hover:bg-[#96E600] text-accent-text text-xs font-black transition-colors shadow-xs cursor-pointer"
                >
                  Show {filteredPitches.length} Pitches
                </button>
              </div>
            </div>
          </div>
        )}

        {/* First Time User Tour Modal */}
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
