import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Layout } from "../components/Layout";
import { useBooking } from "../context/BookingContext";
import { GooglePitchMap, DEFAULT_CENTER } from "../components/GooglePitchMap";
import { Search, MapPin, ChevronLeft, SlidersHorizontal, Navigation, Star, Activity, ChevronRight } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Turf } from "../types";

export const ExploreMap: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { turfs, bookings, loading } = useBooking();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPitchId, setSelectedPitchId] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<[number, number]>([0.3476, 32.5825]);
  const [isLocating, setIsLocating] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  const carouselRef = useRef<HTMLDivElement>(null);

  const requestGPS = useCallback(() => {
    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords([position.coords.latitude, position.coords.longitude]);
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

  const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
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

  const processedPitches = useMemo(() => {
    return turfs
      .filter((pitch) => pitch.status === "ACTIVE")
      .filter((pitch) => {
        if (!searchTerm) return true;
        return pitch.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               pitch.location?.toLowerCase().includes(searchTerm.toLowerCase());
      })
      .map((pitch) => {
        const [pLat, pLon] = getPitchCoords(pitch);
        const [uLat, uLon] = userCoords;
        const calculatedDistance = getDistanceKm(uLat, uLon, pLat, pLon);
        return {
          ...pitch,
          latitude: pLat,
          longitude: pLon,
          computedDistance: parseFloat(calculatedDistance.toFixed(1)),
        };
      })
      .sort((a, b) => (a.computedDistance || 0) - (b.computedDistance || 0));
  }, [turfs, searchTerm, userCoords, getPitchCoords]);

  // Scroll to selected pitch in carousel
  useEffect(() => {
    if (selectedPitchId && carouselRef.current) {
      const el = document.getElementById(`pitch-card-${selectedPitchId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [selectedPitchId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-app-base flex flex-col items-center justify-center text-text-primary gap-3">
        <Activity size={32} className="text-primary-lime animate-spin" />
        <span className="text-sm font-medium text-text-secondary">Loading Map...</span>
      </div>
    );
  }

  return (
    <Layout>
      <div className="relative h-[calc(100vh-64px)] w-full overflow-hidden bg-[#09090b]">
        {/* Fullscreen Map */}
        <div className="absolute inset-0 z-0">
          <GooglePitchMap
            pitches={processedPitches}
            userLocation={{ lat: userCoords[0], lng: userCoords[1] }}
            selectedPitchId={selectedPitchId}
            onSelectPitch={(pitch) => setSelectedPitchId(pitch?.id || null)}
            height="100%"
            interactive={true}
            showControls={false}
          />
        </div>

        {/* Floating Top Bar */}
        <div className="absolute top-4 inset-x-4 z-10 flex flex-col gap-2 max-w-xl mx-auto pointer-events-none">
          <div className="flex items-center gap-3 pointer-events-auto">
            <button
              onClick={() => navigate("/home")}
              className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/70 transition-colors shadow-lg shrink-0"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
              <input
                type="text"
                placeholder="Search pitches or locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-12 pl-11 pr-4 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-sm font-medium text-white placeholder:text-white/50 focus:outline-none focus:border-primary-lime/50 transition-all shadow-lg"
              />
            </div>
            <button
              onClick={requestGPS}
              className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg backdrop-blur-md border transition-all ${
                isLocating 
                  ? "bg-primary-lime/20 border-primary-lime/50 text-primary-lime" 
                  : "bg-black/50 border-white/10 text-white hover:bg-black/70"
              }`}
            >
              {isLocating ? <Activity size={18} className="animate-spin" /> : <Navigation size={18} />}
            </button>
          </div>
        </div>

        {/* Floating Bottom Carousel */}
        <div className="absolute bottom-6 inset-x-0 z-10 pointer-events-none">
          <div 
            ref={carouselRef}
            className="flex gap-4 overflow-x-auto px-4 pb-4 no-scrollbar snap-x snap-mandatory pointer-events-auto items-end"
          >
            {processedPitches.map((pitch) => {
              const isSelected = selectedPitchId === pitch.id;
              
              return (
                <div
                  key={pitch.id}
                  id={`pitch-card-${pitch.id}`}
                  onClick={() => setSelectedPitchId(pitch.id)}
                  className={`snap-center shrink-0 w-[280px] sm:w-[320px] rounded-[24px] overflow-hidden bg-[#1c1c1e]/90 backdrop-blur-xl border transition-all duration-300 cursor-pointer shadow-2xl ${
                    isSelected 
                      ? "border-primary-lime ring-4 ring-primary-lime/20 scale-100 opacity-100" 
                      : "border-white/10 scale-95 opacity-80 hover:opacity-100 hover:scale-[0.98]"
                  }`}
                >
                  <div className="h-32 sm:h-36 relative w-full bg-zinc-800">
                    <img
                      src={pitch.images?.[0] || pitch.image || "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=600&q=80"}
                      alt={pitch.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=600&q=80"; }}
                    />
                    <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/10 text-xs font-bold flex items-center gap-1">
                      <Star size={12} className="fill-[#FACC15] text-[#FACC15]" />
                      <span>{pitch.rating || "4.8"}</span>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="text-[17px] font-bold text-white truncate">{pitch.name}</h3>
                      <p className="text-[13px] text-zinc-400 flex items-center gap-1.5 mt-0.5 truncate">
                        <MapPin size={12} className="shrink-0" />
                        <span className="truncate">{pitch.location}</span>
                        <span className="text-zinc-600 font-bold mx-0.5">•</span>
                        <span className="shrink-0 text-zinc-300">{pitch.computedDistance} km</span>
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-white/10">
                      <div className="flex items-baseline gap-1">
                        <span className="text-[16px] font-black text-primary-lime">
                          UGX {(pitch.pricePerHour / 1000).toFixed(0)}k
                        </span>
                        <span className="text-[12px] text-zinc-500">/hr</span>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/turf/${pitch.id}`);
                        }}
                        className="h-8 px-4 rounded-full bg-white text-black text-[13px] font-bold flex items-center gap-1 hover:bg-zinc-200 transition-colors"
                      >
                        Book
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Subtle Map Gradient Overlays */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-0"></div>
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-0"></div>
      </div>
    </Layout>
  );
};

export default ExploreMap;

