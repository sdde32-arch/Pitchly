import React, { useState, useMemo, useEffect, useCallback } from "react";
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
  Navigation,
  Loader2,
  Radio,
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
import { NoPitchesCard } from "../components/home/NoPitchesCard";
import { Skeleton, PitchCardSkeleton } from "../components/ui/Skeleton";
import { FirstTimeUserTourModal } from "../components/onboarding/FirstTimeUserTourModal";
import { SmartDashboard } from "../components/dashboard/SmartDashboard";
import { HomeCommunityPickups } from "../components/dashboard/HomeCommunityPickups";
import { MatchdayDateStrip } from "../components/home/MatchdayDateStrip";
import { FootballPitchCard } from "../components/home/FootballPitchCard";
import { MatchdayBanner } from "../components/home/MatchdayBanner";
import { TournamentBanner } from "../components/home/TournamentBanner";
import { QuickBookingModal } from "../components/home/QuickBookingModal";
import { ActivityFeed } from "../components/home/ActivityFeed";
import { calculateHaversineDistanceKm, getPitchCoordinates, formatDistanceKm } from "../utils/distance";

// Kampala Neighborhood Hubs
const KAMPALA_HUBS = [
  "All Kampala",
  "Kololo",
  "Bugolobi",
  "Lugogo",
  "Naguru",
  "Nsambya",
  "Kabalagala",
  "Ntinda",
  "Muyenga",
  "Kyanja",
  "Munyonyo",
  "Ggaba",
];

const AMENITIES_LIST = [
  "Floodlights",
  "Changing Rooms",
  "Showers",
  "Secure Parking",
  "Cafeteria",
  "Free WiFi",
];

// Sort Options with clean labels including Proximity (Nearest to Farthest)
export type SortOptionId = "proximity" | "recommended" | "rating" | "price-asc" | "price-desc";

const SORT_OPTIONS: { id: SortOptionId; label: string; shortLabel: string }[] = [
  { id: "proximity", label: "Nearest to Me (Proximity)", shortLabel: "Nearest" },
  { id: "recommended", label: "Recommended", shortLabel: "Recommended" },
  { id: "rating", label: "Top Rated", shortLabel: "Top Rated" },
  { id: "price-asc", label: "Price: Low to High", shortLabel: "Lowest Price" },
  { id: "price-desc", label: "Price: High to Low", shortLabel: "Highest Price" },
];

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile, user, role, isAdmin, isOwner, loading } = useUser();

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
  const [sortBy, setSortBy] = useState<SortOptionId>("proximity");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = React.useRef<HTMLDivElement>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [maxPriceFilter, setMaxPriceFilter] = useState(150000);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  // Geolocation & Proximity state (default to Kampala central if permission pending)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isPreciseLocation, setIsPreciseLocation] = useState(false);

  // Request user coordinates via browser navigator.geolocation
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      // Fallback to Kampala city center (near Nakasero/Lugogo)
      setUserCoords({ lat: 0.3176, lng: 32.5825 });
      setIsPreciseLocation(false);
      return;
    }
    setLocationLoading(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setIsPreciseLocation(true);
        setLocationLoading(false);
      },
      (err) => {
        console.warn("Geolocation permission error or unavailable, using Kampala center default:", err.message);
        // Kampala Central coordinates fallback
        setUserCoords({ lat: 0.3176, lng: 32.5825 });
        setIsPreciseLocation(false);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }, []);

  // Request location automatically on mount so proximity sorting is instantaneous
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  // Quick Booking Modal state
  const [quickBookingPitch, setQuickBookingPitch] = useState<Partial<Pitch> | null>(null);
  const [quickBookingSlot, setQuickBookingSlot] = useState<string>("19:00");
  const [showQuickBookingModal, setShowQuickBookingModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);

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

  // Real Firestore pitches
  const allPitches = useMemo(() => {
    return realPitches.map((p, idx) => ({
      ...p,
      images: p.images?.length ? p.images : [],
      pitchFormats: p.pitchFormats?.length ? p.pitchFormats : ["7-a-side"],
      status: p.status || PitchStatus.ACTIVE,
      rating: (p as any).rating || 4.8,
      reviewsCount: (p as any).reviewsCount || 0,
      distance: (p as any).distance || `${(1.2 + (idx * 0.7) % 4).toFixed(1)} km`,
    }));
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
      .map((pitch) => {
        // Calculate distance in kilometers based on user coordinates
        const coords = getPitchCoordinates(pitch);
        let distKm: number | null = null;
        if (coords && userCoords) {
          const [pitchLat, pitchLon] = coords;
          distKm = calculateHaversineDistanceKm(
            userCoords.lat,
            userCoords.lng,
            pitchLat,
            pitchLon
          );
        }
        return {
          ...pitch,
          _computedDistanceKm: distKm,
        };
      })
      .sort((a, b) => {
        if (sortBy === "proximity") {
          // Sort strictly from nearest to farthest
          const distA = a._computedDistanceKm !== null ? a._computedDistanceKm : Infinity;
          const distB = b._computedDistanceKm !== null ? b._computedDistanceKm : Infinity;
          return distA - distB;
        }
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
    userCoords,
  ]);

  // First three pitches assigned based on proximity, followed by remaining pitches
  const firstThreePitches = useMemo(() => {
    return filteredPitches.slice(0, 3);
  }, [filteredPitches]);

  const remainingPitches = useMemo(() => {
    return filteredPitches.slice(3);
  }, [filteredPitches]);

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
  const renderDiscoverScreen = () => {
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
          <div id="matchday-hero-header" className="space-y-4 scroll-mt-24">
            <div className="space-y-1.5 min-w-0">
              {/* Hero Title - Refined High-Appeal Greeting */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight font-display text-text-primary scroll-mt-24">
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
            <div className="lg:col-span-8 space-y-6 sm:space-y-7 min-w-0">
              {/* Available Pitches & Direct Slot Booking (CORE PURPOSE) */}
              <section
                id="pitches-booking-section"
                aria-label="Available Football Grounds"
                className="space-y-4 sm:space-y-5 scroll-mt-24"
              >
                {/* Section Heading & Pulse Control - Realigned, Clean, and Spacious */}
                <div className="flex items-center justify-between gap-4 pt-1 border-b border-border-subtle/70 pb-4">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-primary-lime shrink-0 shadow-[0_0_10px_rgba(163,230,53,0.6)]" />
                      <h2 id="heading-available-pitches" className="text-xl sm:text-2xl font-black text-text-primary tracking-tight font-display scroll-mt-24 truncate">
                        Available Pitches
                      </h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-text-secondary">
                      <span className="font-semibold text-text-primary font-mono tabular-nums">
                        {filteredPitches.length} {filteredPitches.length === 1 ? "ground" : "grounds"}
                      </span>
                      <span className="text-text-tertiary" aria-hidden="true">·</span>
                      <span>Assigned by proximity</span>
                      <button
                        id="geolocation-toggle-btn"
                        type="button"
                        onClick={requestLocation}
                        title={
                          isPreciseLocation
                            ? "Using your real-time GPS location (Click to refresh)"
                            : "Using Kampala City default location (Click to acquire GPS)"
                        }
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-lime hover:underline cursor-pointer ml-0.5"
                      >
                        {locationLoading ? (
                          <Loader2 size={11} className="animate-spin text-primary-lime" />
                        ) : (
                          <Navigation size={11} />
                        )}
                        <span>{isPreciseLocation ? "GPS Active" : "Detect GPS"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Community Pulse Pop-up Trigger - Clean Sole Action */}
                  <div className="shrink-0">
                    <button
                      id="open-community-activity-btn"
                      type="button"
                      onClick={() => setShowActivityModal(true)}
                      className="h-9 sm:h-10 px-3.5 sm:px-4 rounded-xl border border-border-subtle hover:border-primary-lime/40 bg-surface-card hover:bg-surface-raised flex items-center gap-2 text-xs font-bold text-text-secondary hover:text-text-primary transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
                      title="View live community match results and updates"
                    >
                      <Radio size={14} className="text-primary-lime animate-pulse shrink-0" />
                      <span className="font-bold">Pulse</span>
                    </button>
                  </div>
                </div>

                {/* Available Pitches Grid (Continuous, Uninterrupted Discovery) */}
                <div>
                  {loadingPitches ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 items-stretch">
                      {Array.from({ length: 6 }).map((_, idx) => (
                        <PitchCardSkeleton key={idx} />
                      ))}
                    </div>
                  ) : filteredPitches.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 items-stretch">
                      {filteredPitches.map((pitch) => (
                        <FootballPitchCard
                          key={pitch.id}
                          pitch={pitch}
                          isFavorite={!!favorites[pitch.id || ""]}
                          onToggleFavorite={toggleFavorite}
                          onSelectSlot={handleOpenQuickBooking}
                          selectedDate={selectedDate}
                          distanceKm={(pitch as any)._computedDistanceKm}
                        />
                      ))}
                    </div>
                  ) : realPitches.length === 0 ? (
                    <NoPitchesCard />
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
                          setSortBy("proximity");
                        }}
                        className="px-4 py-2 rounded-xl bg-primary-lime text-accent-text text-xs font-black transition-transform active:scale-95 cursor-pointer shadow-sm"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* DASHBOARD COMPANION RAIL: UPCOMING TICKET & FIXTURE HUB (4 cols on desktop) */}
            <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-4 min-w-0">
              {/* Smart Matchday Hub (Next Matchday / Active Upcoming Booking Ticket) */}
              <SmartDashboard
                upcomingBooking={userUpcomingBooking}
                loading={loadingBooking}
                onExplorePitches={() => smoothScrollToSection("pitches-booking-section", 16)}
              />

              {/* Compact Community Pulse Snapshot Trigger */}
              <div className="bg-surface-card rounded-2xl border border-border-subtle p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                  <div className="flex items-center gap-2">
                    <Radio size={14} className="text-primary-lime animate-pulse" />
                    <h4 className="font-display text-xs font-bold uppercase tracking-wider text-text-primary">
                      Community Activity
                    </h4>
                  </div>
                  <span className="text-[10px] text-text-tertiary font-medium">Live scores</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Real-time matchday results, upcoming bookings, and team updates across Kampala pitches.
                </p>
                <button
                  type="button"
                  onClick={() => setShowActivityModal(true)}
                  className="w-full py-2.5 rounded-xl bg-surface-raised hover:bg-border-subtle border border-border-subtle text-xs font-bold text-text-primary flex items-center justify-center gap-2 transition-colors cursor-pointer active:scale-95"
                >
                  <span>Open Community Feed</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>

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

        {/* Live Community Activity Pop-up Modal */}
        {showActivityModal && (
          <div
            id="community-activity-modal-backdrop"
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
            onClick={() => setShowActivityModal(false)}
          >
            <div
              id="community-activity-modal-content"
              className="bg-surface-card border border-border-subtle rounded-3xl max-w-2xl w-full p-4 sm:p-6 text-text-primary relative shadow-2xl max-h-[92vh] overflow-y-auto space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary-lime/15 text-primary-lime flex items-center justify-center border border-primary-lime/30">
                    <Radio size={16} className="text-primary-lime animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-text-primary">
                      Community Activity &amp; Live Scores
                    </h3>
                    <p className="text-[11px] text-text-secondary">Kampala grassroot football pulse</p>
                  </div>
                </div>
                <button
                  id="community-activity-modal-close-btn"
                  onClick={() => setShowActivityModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-surface-raised flex items-center justify-center text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <ActivityFeed onSelectSlot={handleOpenQuickBooking} />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Layout>
      {(() => {
        if (isOwner || role === "OWNER" || role === "owner") {
          return (
            <div className="p-4">
              <OwnerOverview />
            </div>
          );
        }
        return (
          <>
            {(isAdmin || role === "ADMIN" || role === "admin" || role === "super_admin") && (
              <div className="bg-primary-lime/10 border-b border-primary-lime/25 px-4 py-2 flex items-center justify-between text-xs">
                <span className="text-primary-lime font-bold">Viewing Player Portal (Admin Account)</span>
                <button
                  onClick={() => navigate("/admin/overview")}
                  className="px-2.5 py-1 rounded-lg bg-primary-lime text-black font-black text-[11px] hover:bg-[#96E600] transition-colors cursor-pointer"
                >
                  Admin Portal &rarr;
                </button>
              </div>
            )}
            {renderDiscoverScreen()}
          </>
        );
      })()}
    </Layout>
  );
};

export default Home;
