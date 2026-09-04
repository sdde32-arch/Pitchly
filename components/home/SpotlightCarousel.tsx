import React from "react";
import { Star, MapPin, Zap, ChevronRight, Trophy, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Pitch } from "../../types/firebase";
import { SpotlightCarouselSkeleton } from "../ui/Skeleton";

interface SpotlightCarouselProps {
  pitches: Partial<Pitch>[];
  onSelectSlot: (pitch: Partial<Pitch>, slot: string) => void;
  loading?: boolean;
}

export const SpotlightCarousel: React.FC<SpotlightCarouselProps> = ({
  pitches,
  onSelectSlot,
  loading = false,
}) => {
  const navigate = useNavigate();

  if (loading) {
    return <SpotlightCarouselSkeleton />;
  }

  if (!pitches || pitches.length === 0) return null;

  return (
    <section id="spotlight-carousel-section" className="space-y-3 sm:space-y-4">
      {/* Header Container */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:gap-4">
        <div className="space-y-1 sm:space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-lime opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-lime"></span>
            </span>
            <h2 className="text-lg sm:text-xl font-black text-text-primary tracking-tight font-display uppercase leading-tight sm:leading-tight">
              Featured Matchday Grounds
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-md">
            Kampala’s most played floodlit venues with verified tournament-grade turf
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/explore-map")}
          className="text-xs font-bold text-primary-lime hover:text-primary-lime-hover transition-colors flex items-center gap-1 cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <span>View Map</span>
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Horizontal Scroll Carousel */}
      {/* Added -mx-4 px-4 to allow edge-to-edge scrolling on mobile while maintaining padding, 
          sm:-mx-6 sm:px-6 for tablet to match Home.tsx padding */}
      <div className="flex gap-4 sm:gap-5 overflow-x-auto no-scrollbar pb-4 pt-1 snap-x snap-mandatory w-full">
        {pitches.slice(0, 5).map((pitch, idx) => {
          const img =
            pitch.images?.[0] ||
            "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80";
          const rating = (pitch as any).rating || (4.9 - idx * 0.05).toFixed(1);
          const format = pitch.pitchFormats?.[0] || "7-A-Side";

          return (
            <div
              key={pitch.id || idx}
              id={`spotlight-card-${pitch.id}`}
              onClick={() => pitch.id && navigate(`/turf/${pitch.id}`)}
              className="group relative w-[280px] sm:w-[340px] h-[200px] sm:h-[220px] rounded-2xl overflow-hidden border border-border-subtle hover:border-primary-lime/50 transition-all duration-300 snap-center sm:snap-start shrink-0 cursor-pointer shadow-md hover:shadow-lg hover:shadow-black/10"
            >
              {/* Background Stadium Photo */}
              <img
                src={img}
                alt={pitch.name || "Football Turf"}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                loading="lazy"
              />

              {/* Dynamic Gradient Atmosphere */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20" />

              {/* Top Badges */}
              <div className="absolute top-3 inset-x-3 flex items-center justify-between">
                <span className="bg-primary-lime text-accent-text text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                  <Trophy size={11} className="shrink-0" />
                  <span>Top Rated</span>
                </span>

                <div className="bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-black text-white flex items-center gap-1 border border-white/10">
                  <Star size={12} className="fill-[#FACC15] text-[#FACC15]" />
                  <span>{rating}</span>
                </div>
              </div>

              {/* Bottom Content Overlay */}
              <div className="absolute bottom-3 inset-x-3 space-y-2">
                <div>
                  <span className="text-[10px] font-bold text-primary-lime tracking-wide uppercase block">
                    {format} • FIFA Standard
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-white tracking-tight leading-tight line-clamp-1 group-hover:text-primary-lime transition-colors">
                    {pitch.name}
                  </h3>
                  <div className="flex items-center gap-1 text-[11px] text-white/80 mt-0.5">
                    <MapPin size={12} className="text-primary-lime shrink-0" />
                    <span className="truncate">{pitch.location || "Kampala"}</span>
                  </div>
                </div>

                {/* Price and Book Action */}
                <div className="pt-2 border-t border-white/15 flex items-center justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm sm:text-base font-black text-white">
                      UGX {(pitch.pricePerHour || 80000).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-white/60">/hr</span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectSlot(pitch, "19:00");
                    }}
                    className="h-8 px-3 rounded-full bg-primary-lime hover:bg-[#96E600] text-accent-text text-[11px] font-black transition-all flex items-center gap-1 shadow-md cursor-pointer active:scale-95"
                  >
                    <span>Instant Book</span>
                    <ChevronRight size={13} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
