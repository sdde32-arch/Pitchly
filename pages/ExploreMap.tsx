import React, { useState, useMemo, useCallback } from "react";
import { Layout } from "../components/Layout";
import { useBooking } from "../context/BookingContext";
import { GooglePitchMap, DEFAULT_CENTER } from "../components/GooglePitchMap";
import {
  Search,
  MapPin,
  ChevronLeft,
  Compass,
  Clock,
  Star,
  Navigation,
  Activity,
  SlidersHorizontal,
  Maximize2,
  Minimize2,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Zap,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Turf } from "../types";
import { RecentSearchTags } from "../components/search/RecentSearchTags";
import {
  getRecentSearches,
  saveRecentSearch,
  clearRecentSearches,
  removeRecentSearch,
} from "../utils/recentSearches";

const NEIGHBORHOODS = [
  { name: "Kampala Central", coords: [0.3476, 32.5825] as [number, number] },
  { name: "Ntinda", coords: [0.3540, 32.6180] as [number, number] },
  { name: "Lugogo", coords: [0.3300, 32.6050] as [number, number] },
  { name: "Bugolobi", coords: [0.3150, 32.6100] as [number, number] },
  { name: "Muyenga", coords: [0.2900, 32.6000] as [number, number] },
  { name: "Kisaasi", coords: [0.3700, 32.5900] as [number, number] },
  { name: "Kyambogo", coords: [0.3500, 32.6300] as [number, number] },
  { name: "Seguku", coords: [0.2500, 32.5500] as [number, number] },
];

const RADIUS_OPTIONS = [
  { label: "All Radii", value: 999 },
  { label: "< 3 km", value: 3 },
  { label: "< 5 km", value: 5 },
  { label: "< 10 km", value: 10 },
  { label: "< 15 km", value: 15 },
];

const HOUR_SLOTS = [
  "All",
  "08:00", "09:00", "10:00", "11:00", "12:00", "13:00",
  "14:00", "15:00", "16:00", "17:00", "18:00", "19:00",
  "20:00", "21:00", "22:00", "23:00"
];

export const ExploreMap: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { turfs, bookings, loading } = useBooking();

  const [searchTerm, setSearchTerm] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>(() => getRecentSearches());
  const [selectedFormat, setSelectedFormat] = useState("All");
  const [selectedHour, setSelectedHour] = useState("All");
  const [selectedRadius, setSelectedRadius] = useState<number>(999);
  const [sortBy, setSortBy] = useState("proximity");
  const [isFullscreenMap, setIsFullscreenMap] = useState(false);

  // Selected pitch for map sync
  const [selectedPitchId, setSelectedPitchId] = useState<string | null>(null);

  // Neighborhood and coordinates
  const [currentNeighborhood, setCurrentNeighborhood] = useState("Kampala Central");
  const [userCoords, setUserCoords] = useState<[number, number]>([0.3476, 32.5825]);
  const [gpsActive, setGpsActive] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Parse date query param if present
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const paramDate = searchParams.get("date");
    if (paramDate) return paramDate;
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  // Fetch real GPS
  const requestGPS = useCallback(() => {
    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords([position.coords.latitude, position.coords.longitude]);
          setCurrentNeighborhood("Current Location");
          setGpsActive(true);
          setIsLocating(false);
        },
        (error) => {
          console.warn("Geolocation failed or denied.", error);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  const handleNeighborhoodChange = (name: string, coords: [number, number]) => {
    setCurrentNeighborhood(name);
    setUserCoords(coords);
    setGpsActive(false);
  };

  // Generate next 7 days dynamically
  const next7Days = useMemo(() => {
    const list = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      
      const fullDateStr = d.toISOString().split("T")[0];
      const isToday = i === 0;

      list.push({
        dayNum: d.getDate(),
        dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
        monthName: d.toLocaleDateString("en-US", { month: "short" }),
        fullDateStr,
        isToday,
      });
    }
    return list;
  }, []);

  const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getPitchCoords = useCallback((pitch: any): [number, number] => {
    if (typeof pitch.latitude === "number" && typeof pitch.longitude === "number") {
      return [pitch.latitude, pitch.longitude];
    }
    if (Array.isArray(pitch.coordinates) && pitch.coordinates.length === 2) {
      return [pitch.coordinates[0], pitch.coordinates[1]];
    }
    const hash = (pitch.id || "").charCodeAt(0) || 0;
    return [0.3476 + (hash % 10) * 0.005, 32.5825 + (hash % 7) * 0.006];
  }, []);

  const getPitchAvailability = useMemo(() => {
    return (pitchId: string, date: string, hourStr: string) => {
      const normalizedPitchId = pitchId.replace(/^pitch-/, "");
      const pitchObj = turfs.find((t) => t.id === pitchId || t.id === normalizedPitchId || `pitch-${t.id}` === pitchId);
      if (!pitchObj) return { isAvailable: false, freeSlotsCount: 0, freeSlots: [], isClosed: false };

      if (pitchObj.blockedDates && pitchObj.blockedDates.includes(date)) {
        return { isAvailable: false, freeSlotsCount: 0, freeSlots: [], isClosed: true };
      }

      const openH = parseInt(pitchObj.openingHour?.split(":")[0] || "8");
      const closeH = parseInt(pitchObj.closingHour?.split(":")[0] || "22");

      const operatingSlots: string[] = [];
      for (let h = openH; h < closeH; h++) {
        operatingSlots.push(`${String(h).padStart(2, "0")}:00`);
      }

      const activeBookings = bookings.filter(
        (b) =>
          (b.pitchId === pitchId || b.turfId === pitchId || b.pitchId === normalizedPitchId || b.turfId === normalizedPitchId) &&
          b.date === date &&
          b.status !== "CANCELLED" &&
          b.status !== "REJECTED" &&
          (b.status as any) !== "rejected"
      );

      const bookedSlots = new Set<string>();
      activeBookings.forEach((b) => {
        if (b.slots && Array.isArray(b.slots)) {
          b.slots.forEach((s) => bookedSlots.add(s));
        } else if (b.time) {
          bookedSlots.add(b.time);
        }
      });

      const freeSlots = operatingSlots.filter((s) => !bookedSlots.has(s));

      if (hourStr !== "All") {
        return {
          isAvailable: freeSlots.includes(hourStr),
          freeSlotsCount: freeSlots.length,
          freeSlots,
          isClosed: false,
        };
      }

      return {
        isAvailable: freeSlots.length > 0,
        freeSlotsCount: freeSlots.length,
        freeSlots,
        isClosed: false,
      };
    };
  }, [turfs, bookings]);

  const dailyAvailabilityCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    next7Days.forEach((day) => {
      let count = 0;
      turfs.forEach((pitch) => {
        if (pitch.status === "ACTIVE") {
          const avail = getPitchAvailability(pitch.id, day.fullDateStr, "All");
          if (avail.isAvailable) count++;
        }
      });
      counts[day.fullDateStr] = count;
    });
    return counts;
  }, [next7Days, turfs, getPitchAvailability]);

  const processedPitches = useMemo(() => {
    return turfs
      .filter((pitch) => {
        if (pitch.status !== "ACTIVE") return false;

        const matchesSearch =
          pitch.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pitch.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pitch.amenities?.some((a) => a.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesFormat =
          selectedFormat === "All" ||
          pitch.pitchFormats?.some((f) => f.toLowerCase().includes(selectedFormat.toLowerCase())) ||
          pitch.type?.toLowerCase().includes(selectedFormat.toLowerCase());

        const [pLat, pLon] = getPitchCoords(pitch);
        const [uLat, uLon] = userCoords;
        const dist = getDistanceKm(uLat, uLon, pLat, pLon);
        const matchesRadius = dist <= selectedRadius;

        const avail = getPitchAvailability(pitch.id, selectedDate, selectedHour);
        return matchesSearch && matchesFormat && matchesRadius && avail.isAvailable;
      })
      .map((pitch) => {
        const [pLat, pLon] = getPitchCoords(pitch);
        const [uLat, uLon] = userCoords;
        const calculatedDistance = getDistanceKm(uLat, uLon, pLat, pLon);
        const avail = getPitchAvailability(pitch.id, selectedDate, selectedHour);

        return {
          ...pitch,
          latitude: pLat,
          longitude: pLon,
          computedDistance: parseFloat(calculatedDistance.toFixed(1)),
          freeSlotsCount: avail.freeSlotsCount,
          avail,
        };
      })
      .sort((a, b) => {
        if (sortBy === "proximity") return (a.computedDistance || 0) - (b.computedDistance || 0);
        if (sortBy === "rating") return (b.rating || 4.5) - (a.rating || 4.5);
        if (sortBy === "priceAsc") return a.pricePerHour - b.pricePerHour;
        if (sortBy === "priceDesc") return b.pricePerHour - a.pricePerHour;
        return 0;
      });
  }, [
    turfs,
    searchTerm,
    selectedFormat,
    selectedHour,
    selectedRadius,
    selectedDate,
    userCoords,
    sortBy,
    getPitchCoords,
    getPitchAvailability,
  ]);

  if (loading) {
    return (
      <div className="min-h-screen bg-app-base flex flex-col items-center justify-center text-text-primary gap-3">
        <Activity size={32} className="text-primary-lime animate-spin" />
        <span className="text-xs font-medium text-text-secondary">
          Connecting to Google Maps & live pitch radar...
        </span>
      </div>
    );
  }

  return (
    <Layout>
      <div className="min-h-full bg-app-base text-text-primary font-sans pb-28">
        <div className="max-w-4xl mx-auto p-4 space-y-5">
          
          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => navigate("/home")}
              className="w-11 h-11 rounded-full bg-surface-card border border-border-subtle flex items-center justify-center text-text-primary hover:bg-surface-raised transition-colors shadow-xs cursor-pointer shrink-0"
              title="Return to Home"
            >
              <ChevronLeft size={20} strokeWidth={2.5} />
            </button>
            <div className="text-center min-w-0">
              <h1 className="text-[17px] font-bold text-text-primary flex items-center justify-center gap-1.5 truncate">
                <span>Pitch Radar & Google Maps</span>
              </h1>
              <p className="text-[12px] font-medium text-text-secondary mt-0.5 truncate">
                Locating pitches near <span className="text-primary-lime font-bold">{currentNeighborhood}</span>
              </p>
            </div>
            <button
              onClick={requestGPS}
              disabled={isLocating}
              className={`w-11 h-11 rounded-full flex items-center justify-center shadow-xs transition-all cursor-pointer shrink-0 ${
                gpsActive
                  ? "bg-primary-lime text-accent-text font-bold"
                  : "bg-surface-card border border-border-subtle text-text-secondary hover:bg-surface-raised hover:text-text-primary"
              }`}
              title="Detect your live GPS position"
            >
              {isLocating ? (
                <Activity size={18} className="animate-spin text-primary-lime" />
              ) : (
                <Navigation size={18} />
              )}
            </button>
          </div>

          {/* GOOGLE MAPS INTERACTIVE CANVAS CONTAINER */}
          <div id="walkthrough-map-canvas" className="relative space-y-2 scroll-mt-24">
            <div className="flex items-center justify-between px-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-lime/10 border border-primary-lime/30 text-primary-lime font-bold text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-primary-lime animate-pulse" />
                  Google Maps Connected
                </span>
                <span className="text-text-secondary text-[11px] hidden sm:inline">
                  {processedPitches.length} pitches mapped
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFullscreenMap(!isFullscreenMap)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-card hover:bg-surface-raised border border-border-subtle text-text-secondary hover:text-text-primary text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  {isFullscreenMap ? (
                    <>
                      <Minimize2 size={12} />
                      <span>Compact Map</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 size={12} />
                      <span>Expand Map</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Google Maps Viewport */}
            <div
              className={`transition-all duration-300 ease-in-out ${
                isFullscreenMap ? "h-[70vh] sm:h-[650px]" : "h-[320px] sm:h-[400px]"
              }`}
            >
              <GooglePitchMap
                pitches={processedPitches}
                userLocation={{ lat: userCoords[0], lng: userCoords[1] }}
                selectedPitchId={selectedPitchId}
                onSelectPitch={(pitch) => setSelectedPitchId(pitch?.id || null)}
                height="100%"
                interactive={true}
                showControls={true}
              />
            </div>
          </div>

          {/* Quick Neighborhood Anchors */}
          <div className="bg-surface-card rounded-xl p-4 border border-border-subtle space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-text-primary font-bold text-[13px] sm:text-[14px]">
                <Compass size={16} className="text-primary-lime" />
                <span>Anchor Location: {currentNeighborhood}</span>
              </div>
              <span className="text-[11px] font-bold text-text-secondary font-mono">
                {userCoords[0].toFixed(3)}, {userCoords[1].toFixed(3)}
              </span>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
              {NEIGHBORHOODS.map((n) => {
                const isSelected = currentNeighborhood === n.name;
                return (
                  <button
                    key={n.name}
                    onClick={() => handleNeighborhoodChange(n.name, n.coords)}
                    className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap transition-all border cursor-pointer ${
                      isSelected
                        ? "bg-primary-lime text-accent-text border-primary-lime shadow-xs"
                        : "bg-surface-raised border-border-subtle text-text-secondary hover:text-text-primary hover:border-[#383838]"
                    }`}
                  >
                    {n.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search, Distance Radius, and Filters */}
          <div className="bg-surface-card rounded-xl p-4 border border-border-subtle space-y-3 shadow-xs">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="text"
                placeholder="Search venue name, area, or amenities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchTerm.trim()) {
                    const updated = saveRecentSearch(searchTerm);
                    setRecentSearches(updated);
                  }
                }}
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-surface-raised border border-border-subtle text-[13px] font-medium text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary-lime/50 transition-all"
              />
            </div>

            {/* Section under search bar: 3 most recent searches as clickable tags */}
            <RecentSearchTags
              searches={recentSearches}
              activeQuery={searchTerm}
              onSelectTag={(term) => {
                setSearchTerm(term);
                const updated = saveRecentSearch(term);
                setRecentSearches(updated);
              }}
              onClearAll={() => {
                clearRecentSearches();
                setRecentSearches([]);
              }}
              onRemoveTag={(term, e) => {
                e.stopPropagation();
                const updated = removeRecentSearch(term);
                setRecentSearches(updated);
              }}
            />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Proximity / Distance Radius */}
              <select
                value={selectedRadius}
                onChange={(e) => setSelectedRadius(Number(e.target.value))}
                className="h-11 px-3 rounded-xl bg-surface-raised border border-border-subtle text-[12px] font-bold text-text-primary focus:outline-none focus:border-primary-lime/50 transition-colors cursor-pointer"
              >
                {RADIUS_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value} className="bg-surface-raised text-text-primary">
                    {r.label}
                  </option>
                ))}
              </select>

              {/* Format */}
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value)}
                className="h-11 px-3 rounded-xl bg-surface-raised border border-border-subtle text-[12px] font-bold text-text-primary focus:outline-none focus:border-primary-lime/50 transition-colors cursor-pointer"
              >
                <option value="All" className="bg-surface-raised text-text-primary">All Formats</option>
                <option value="5-a-side" className="bg-surface-raised text-text-primary">5-a-side Futsal</option>
                <option value="7-a-side" className="bg-surface-raised text-text-primary">7-a-side Turf</option>
                <option value="11-a-side" className="bg-surface-raised text-text-primary">11-a-side Pitch</option>
              </select>

              {/* Hour Slot */}
              <select
                value={selectedHour}
                onChange={(e) => setSelectedHour(e.target.value)}
                className="h-11 px-3 rounded-xl bg-surface-raised border border-border-subtle text-[12px] font-bold text-text-primary focus:outline-none focus:border-primary-lime/50 transition-colors cursor-pointer"
              >
                {HOUR_SLOTS.map((h) => (
                  <option key={h} value={h} className="bg-surface-raised text-text-primary">
                    {h === "All" ? "Any Time" : `${h}`}
                  </option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-11 px-3 rounded-xl bg-surface-raised border border-border-subtle text-[12px] font-bold text-text-primary focus:outline-none focus:border-primary-lime/50 transition-colors cursor-pointer"
              >
                <option value="proximity" className="bg-surface-raised text-text-primary">Nearest First</option>
                <option value="rating" className="bg-surface-raised text-text-primary">Top Rated</option>
                <option value="priceAsc" className="bg-surface-raised text-text-primary">Price: Low to High</option>
                <option value="priceDesc" className="bg-surface-raised text-text-primary">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Date Picker Ribbon */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center px-1">
              <span className="font-bold text-[13px] text-text-primary">Match Date</span>
              <span className="font-bold text-[12px] text-primary-lime">
                {(() => {
                  const found = next7Days.find((d) => d.fullDateStr === selectedDate);
                  return found ? `${found.dayName} ${found.dayNum} ${found.monthName}` : selectedDate;
                })()}
              </span>
            </div>

            <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
              {next7Days.map((day) => {
                const isSelected = selectedDate === day.fullDateStr;
                const openCount = dailyAvailabilityCounts[day.fullDateStr] || 0;

                return (
                  <button
                    key={day.fullDateStr}
                    onClick={() => setSelectedDate(day.fullDateStr)}
                    className={`flex-none w-[68px] sm:w-[72px] py-3 rounded-2xl flex flex-col items-center justify-center border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary-lime border-primary-lime text-accent-text shadow-md shadow-primary-lime/20 scale-[1.02] font-bold"
                        : "bg-surface-card border-border-subtle text-text-primary hover:border-[#383838] hover:bg-surface-raised"
                    }`}
                  >
                    <span className={`text-[10px] uppercase font-bold ${isSelected ? "text-accent-text" : "text-text-secondary"}`}>
                      {day.dayName}
                    </span>
                    <span className="text-[16px] font-black leading-tight my-0.5">
                      {day.dayNum}
                    </span>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        isSelected
                          ? "bg-app-base/20 text-accent-text"
                          : openCount > 0
                          ? "bg-primary-lime/15 text-primary-lime border border-primary-lime/30"
                          : "bg-surface-raised text-[#71717A]"
                      }`}
                    >
                      {openCount > 0 ? `${openCount} open` : "full"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Results Heading */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[14px] font-bold text-text-primary">
              Identified Pitches ({processedPitches.length})
            </span>
            <span className="text-[12px] font-medium text-text-secondary">
              Sorted by {sortBy === "proximity" ? "Distance" : sortBy}
            </span>
          </div>

          {/* Pitch Cards Feed (Synchronized with Google Map) */}
          <div className="space-y-3.5">
            <AnimatePresence mode="popLayout">
              {processedPitches.length > 0 ? (
                processedPitches.map((pitch) => {
                  const freeSlotsCount = pitch.avail.freeSlotsCount;
                  const durationMins = Math.round(pitch.computedDistance * 2.2);
                  const isSelected = selectedPitchId === pitch.id;

                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      key={pitch.id}
                      onClick={() => {
                        setSelectedPitchId(pitch.id);
                        // Scroll map into view if on mobile
                        window.scrollTo({ top: 180, behavior: "smooth" });
                      }}
                      className={`rounded-xl p-4 border transition-all cursor-pointer shadow-xs space-y-3 group ${
                        isSelected
                          ? "bg-[#1C1C1E] border-primary-lime ring-2 ring-primary-lime/20"
                          : "bg-surface-card border-border-subtle hover:border-[#383838]"
                      }`}
                    >
                      <div className="flex gap-3.5 sm:gap-4">
                        {/* Thumbnail Image */}
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shrink-0 bg-surface-raised relative">
                          <img
                            src={
                              pitch.images?.[0] ||
                              pitch.image ||
                              "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=600&q=80"
                            }
                            alt={pitch.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-app-base/85 backdrop-blur-md text-text-primary border border-white/10 text-[10px] font-bold flex items-center gap-1 shadow-xs">
                            <Star size={11} className="fill-[#FACC15] text-[#FACC15]" />
                            <span>{pitch.rating || "4.8"}</span>
                          </div>
                        </div>

                        {/* Card Details */}
                        <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
                          <div>
                            <h3 className="text-[15px] sm:text-[16px] font-bold text-text-primary truncate group-hover:text-primary-lime transition-colors leading-tight">
                              {pitch.name}
                            </h3>
                            <p className="text-[12px] font-medium text-text-secondary flex items-center gap-1.5 mt-1 truncate">
                              <MapPin size={12} className="text-text-tertiary shrink-0" />
                              <span className="truncate">{pitch.location}</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-2 text-[12px] font-medium text-text-secondary mt-1.5">
                            <span className="text-text-primary font-semibold">{pitch.computedDistance} km</span>
                            <span className="text-[#383838] font-bold">•</span>
                            <span className="text-text-secondary">~{durationMins} min drive</span>
                          </div>

                          {/* Price & Open Slots (Never wraps awkwardly) */}
                          <div className="flex items-center justify-between gap-2 pt-2 mt-auto border-t border-border-subtle">
                            <div className="flex items-baseline gap-1">
                              <span className="text-[15px] font-black text-primary-lime tracking-tight">
                                UGX {pitch.pricePerHour.toLocaleString()}
                              </span>
                              <span className="text-[11px] font-normal text-text-secondary">/hr</span>
                            </div>
                            <span
                              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap border ${
                                freeSlotsCount > 0
                                  ? "bg-primary-lime/10 border-primary-lime/30 text-primary-lime"
                                  : "bg-surface-raised border-border-subtle text-[#71717A]"
                              }`}
                            >
                              {freeSlotsCount > 0 ? `${freeSlotsCount} open slots` : "Fully booked"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Bar (Single-line chips & aligned action buttons) */}
                      <div className="pt-3 border-t border-border-subtle flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5 overflow-hidden min-w-0">
                          <span className="text-[11px] text-[#71717A] font-medium shrink-0 mr-0.5 hidden xs:inline">
                            Slots:
                          </span>
                          {pitch.avail.freeSlots.slice(0, 3).map((slot: string) => (
                            <span
                              key={slot}
                              className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border whitespace-nowrap shrink-0 transition-colors ${
                                selectedHour === slot
                                  ? "bg-primary-lime border-primary-lime text-accent-text font-bold"
                                  : "bg-surface-raised border-[#2E2E32] text-[#D4D4D8]"
                              }`}
                            >
                              {slot}
                            </span>
                          ))}
                          {pitch.avail.freeSlots.length > 3 && (
                            <span className="text-[11px] font-semibold text-text-secondary px-2 py-1 rounded-lg bg-surface-raised border border-[#2E2E32] whitespace-nowrap shrink-0">
                              +{pitch.avail.freeSlots.length - 3} more
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${pitch.latitude || 0.3476},${pitch.longitude || 32.5825}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="w-9 h-9 rounded-xl bg-surface-raised hover:bg-[#28282D] border border-[#2E2E32] text-text-secondary hover:text-text-primary flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                            title="Get directions on Google Maps"
                          >
                            <ExternalLink size={14} />
                          </a>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/turf/${pitch.id}`);
                            }}
                            className="h-9 px-4 rounded-xl bg-primary-lime hover:bg-[#96E600] active:scale-[0.98] text-accent-text text-[12px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs whitespace-nowrap"
                          >
                            <span>Book Now</span>
                            <ChevronRight size={14} strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="py-14 px-4 text-center bg-surface-card border border-border-subtle rounded-2xl shadow-xs space-y-3">
                  <p className="text-[15px] font-bold text-text-primary">
                    No pitches found within this radius or filter
                  </p>
                  <p className="text-[13px] font-medium text-text-secondary max-w-[280px] mx-auto">
                    Try expanding the radius to &lt; 15 km or choosing another neighborhood anchor.
                  </p>
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedFormat("All");
                      setSelectedHour("All");
                      setSelectedRadius(999);
                    }}
                    className="mt-3 px-4 py-2 rounded-full bg-primary-lime hover:bg-[#96E600] text-accent-text text-[13px] font-bold transition-colors shadow-xs cursor-pointer"
                  >
                    Reset all filters
                  </button>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ExploreMap;
