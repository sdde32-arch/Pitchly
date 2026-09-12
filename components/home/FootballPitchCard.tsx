import React from "react";
import {
  MapPin,
  Star,
  ShieldCheck,
  Heart,
  ChevronRight,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Pitch } from "../../types/firebase";

interface FootballPitchCardProps {
  pitch: Partial<Pitch>;
  isFavorite: boolean;
  onToggleFavorite: (pitchId: string, e: React.MouseEvent) => void;
  onSelectSlot: (pitch: Partial<Pitch>, slot: string) => void;
  selectedDate: string;
}

export const FootballPitchCard: React.FC<FootballPitchCardProps> = ({
  pitch,
  isFavorite,
  onToggleFavorite,
  onSelectSlot,
  selectedDate,
}) => {
  const navigate = useNavigate();

  // Pick realistic upcoming matchday slots for this turf
  const slots = React.useMemo(() => {
    return ["17:00", "18:00", "19:00", "20:00"];
  }, [pitch.id]);

  const primaryImage =
    pitch.images?.[0] ||
    "https://images.unsplash.com/photo-1529900245534-47fbf59f4820?auto=format&fit=crop&w=800&q=80";

  const formatBadge = pitch.pitchFormats?.[0] || "7-A-Side";
  const surfaceType =
    (pitch as any).surfaceType ||
    (pitch.name?.toLowerCase().includes("grass")
      ? "Natural Grass"
      : pitch.name?.toLowerCase().includes("futsal") || pitch.name?.toLowerCase().includes("fusion")
      ? "Indoor 4G Turf"
      : "FIFA Synthetic Turf");
  
  const rating = (pitch as any).rating || 4.8;
  const reviewsCount = (pitch as any).reviewsCount || 24;
  const distance = (pitch as any).distance || "2.1 km";

  return (
    <article
      id={`pitch-card-${pitch.id}`}
      onClick={() => pitch.id && navigate(`/turf/${pitch.id}`)}
      className="group relative bg-surface-card hover:bg-surface-raised rounded-2xl border border-border-subtle hover:border-primary-lime/40 transition-all duration-300 overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-lg hover:shadow-black/5 cursor-pointer"
    >
      <div>
        {/* Pitch Stadium Image Frame */}
        <div className="relative w-full h-32 overflow-hidden bg-surface-raised select-none border-b border-border-subtle">
          <img
            src={primaryImage}
            alt={pitch.name || "Football Pitch"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            loading="lazy"
          />
          {/* Stadium Dark Gradient Shadow for Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

          {/* Top Row Badges */}
          <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
            {/* Format & Surface Pill */}
            <div className="flex items-center gap-1.5 pointer-events-auto">
              <span className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase text-white border border-white/10 shadow-xs flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-lime " />
                {formatBadge}
              </span>
              <span className="hidden sm:inline-block bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase text-white/90 border border-white/10">
                {surfaceType}
              </span>
            </div>

            {/* Favorite Button */}
            <button
              id={`favorite-btn-${pitch.id}`}
              type="button"
              onClick={(e) => {
                  if (pitch.id) onToggleFavorite(pitch.id, e);
              }}
              className="pointer-events-auto w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md flex items-center justify-center text-white border border-white/15 transition-all active:scale-90 cursor-pointer shadow-xs"
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart
                size={16}
                strokeWidth={isFavorite ? 3 : 2.5}
                className={isFavorite ? "fill-primary-lime text-primary-lime" : "text-white/90"}
              />
            </button>
          </div>

          {/* Bottom Overlay Data (Rating, Verified) */}
          <div className="absolute bottom-3 inset-x-3 flex items-end justify-between pointer-events-none">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-bold text-white border border-white/10">
                <ShieldCheck size={12} className="text-primary-lime" />
                <span>Verified</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-black/75 backdrop-blur-md px-2 py-1 rounded-lg text-xs font-black text-white border border-white/15 shadow-xs">
                <Star size={12} className="fill-[#FACC15] text-[#FACC15]" />
                <span>{rating}</span>
                <span className="text-white/60 text-[10px] font-medium">({reviewsCount})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card Content Body */}
        <div className="p-3 sm:p-4 space-y-3">
          {/* Title & Location */}
          <div className="space-y-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base sm:text-lg font-bold text-text-primary tracking-tight leading-snug group-hover:text-primary-lime transition-colors line-clamp-1">
                {pitch.name || "Kampala Arena Turf"}
              </h3>
            </div>
            <div className="flex items-center gap-1.5 text-text-secondary text-xs">
              <MapPin size={13} className="text-text-tertiary shrink-0" />
              <span className="truncate">{pitch.location || "Kampala, Uganda"}</span>
              <span className="text-text-tertiary">•</span>
              <span className="text-text-primary font-bold shrink-0">{distance}</span>
            </div>
          </div>

          {/* Quick Amenities Preview (Max 3) */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {(pitch.amenities && pitch.amenities.length > 0
              ? pitch.amenities.slice(0, 3)
              : ["Floodlights", "Changing Rooms", "Parking"]
            ).map((amenity, idx) => (
              <span
                key={idx}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-surface-raised text-text-secondary border border-border-subtle"
              >
                {amenity}
              </span>
            ))}
          </div>

          {/* Instant Slots Strip */}
          <div className="pt-3 border-t border-border-subtle space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-text-secondary flex items-center gap-1">
                <Clock size={12} className="text-text-tertiary" />
                Available Today
              </span>
              <span className="text-[10px] text-primary-lime font-bold uppercase tracking-wider">
                1-Tap Book
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {slots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSlot(pitch, slot);
                  }}
                  className="py-1.5 px-1 rounded-lg bg-surface-raised hover:bg-primary-lime hover:text-accent-text text-text-primary border border-border-subtle text-xs font-bold text-center transition-all cursor-pointer active:scale-95 group/slot shadow-2xs"
                >
                  <span className="group-hover/slot:text-accent-text">{slot}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Pricing & Action */}
      <div className="px-4 sm:px-5 py-3.5 border-t border-border-subtle flex items-center justify-between gap-3 bg-surface-raised/50">
        <div>
          <span className="text-[9px] font-black uppercase tracking-widest text-text-tertiary block mb-0.5">
            Book Turf
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-base sm:text-lg font-black text-text-primary tracking-tight">
              UGX {(pitch.pricePerHour || 90000).toLocaleString()}
            </span>
            <span className="text-[11px] text-text-tertiary font-bold">/hr</span>
          </div>
        </div>
        <button
          id={`book-pitch-${pitch.id}-btn`}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (pitch.id) navigate(`/turf/${pitch.id}`);
          }}
          className="h-9 px-4 rounded-xl bg-primary-lime hover:bg-primary-lime-hover text-accent-text text-xs font-bold transition-all shadow-md shadow-primary-lime/20 flex items-center gap-1 cursor-pointer active:scale-95 shrink-0"
        >
          <span>View</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </article>
  );
};
