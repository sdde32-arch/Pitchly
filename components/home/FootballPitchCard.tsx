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
import { PhotoPlaceholder } from "../ui/PhotoPlaceholder";

interface FootballPitchCardProps {
  pitch: Partial<Pitch>;
  isFavorite: boolean;
  onToggleFavorite: (pitchId: string, e: React.MouseEvent) => void;
  selectedDate: string;
  distanceKm?: number | null;
}

export const FootballPitchCard: React.FC<FootballPitchCardProps> = ({
  pitch,
  isFavorite,
  onToggleFavorite,
  selectedDate,
  distanceKm,
}) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = React.useState(false);

  const primaryImage = pitch.images?.[0] || "";

  const formatBadge = pitch.pitchFormats?.[0] || "7-A-Side";
  const surfaceType =
    (pitch as any).surfaceType ||
    (pitch.name?.toLowerCase().includes("grass")
      ? "Natural Grass"
      : pitch.name?.toLowerCase().includes("futsal") || pitch.name?.toLowerCase().includes("fusion")
      ? "Indoor 4G Turf"
      : "FIFA Synthetic Turf");
  
  const reviewCount = Number((pitch as any).reviewsCount ?? (pitch as any).reviewCount ?? 0);
  const rawRating = (pitch as any).rating;
  const hasRealRating = reviewCount > 0 && typeof rawRating === 'number' && rawRating > 0;
  const ratingVal = hasRealRating ? rawRating.toFixed(1) : null;
  const distance =
    typeof distanceKm === "number"
      ? distanceKm < 0.1
        ? "< 100 m"
        : distanceKm < 1
        ? `${Math.round(distanceKm * 1000)} m`
        : `${distanceKm.toFixed(1)} km`
      : (typeof (pitch as any).distance === "string" && (pitch as any).distance.trim().length > 0)
      ? (pitch as any).distance
      : null;

  return (
    <article
      id={`pitch-card-${pitch.id}`}
      onClick={() => pitch.id && navigate(`/turf/${pitch.id}`, { state: { from: 'home' } })}
      className="group relative bg-surface-card hover:bg-surface-raised rounded-2xl border border-border-subtle hover:border-primary-lime/40 transition-all duration-300 overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-xl hover:shadow-black/15 cursor-pointer h-full"
    >
      <div className="flex-1 flex flex-col">
        {/* Pitch Stadium Image Frame */}
        <div className="relative w-full h-36 sm:h-40 overflow-hidden bg-surface-raised select-none border-b border-border-subtle shrink-0">
          {!primaryImage || imageError ? (
            <PhotoPlaceholder className="w-full h-full" />
          ) : (
            <img
              src={primaryImage}
              alt={pitch.name || "Football Pitch"}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              loading="lazy"
              onError={() => setImageError(true)}
            />
          )}
          {/* Stadium Dark Gradient Shadow for Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />

          {/* Top Row Badges: Clean, Essential Only */}
          <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
            {/* Format Pill */}
            <div className="pointer-events-auto">
              <span className="bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase text-white border border-white/10 shadow-xs flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-lime" />
                {formatBadge}
              </span>
            </div>

            {/* Favorite Button */}
            <button
              id={`favorite-btn-${pitch.id}`}
              type="button"
              onClick={(e) => {
                if (pitch.id) onToggleFavorite(pitch.id, e);
              }}
              className="pointer-events-auto w-8 h-8 rounded-full bg-black/55 hover:bg-black/85 backdrop-blur-md flex items-center justify-center text-white border border-white/15 transition-all active:scale-90 cursor-pointer shadow-xs"
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart
                size={16}
                strokeWidth={isFavorite ? 3 : 2.5}
                className={isFavorite ? "fill-primary-lime text-primary-lime" : "text-white/90"}
              />
            </button>
          </div>

          {/* Bottom Overlay Data (Rating) */}
          <div className="absolute bottom-3 right-3 pointer-events-none">
            <div className="flex items-center gap-1 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-md text-xs font-bold text-white border border-white/15 shadow-xs font-mono tabular-nums">
              {hasRealRating ? (
                <>
                  <Star size={12} className="fill-[#FACC15] text-[#FACC15] shrink-0" />
                  <span>{ratingVal}</span>
                  <span className="text-white/60 text-[10px] font-medium">({reviewCount})</span>
                </>
              ) : (
                <span className="text-[10px] uppercase font-bold text-primary-lime">New</span>
              )}
            </div>
          </div>
        </div>

        {/* Card Content Body */}
        <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
          <div className="space-y-1.5">
            {/* Title */}
            <h3 className="font-display text-base font-bold text-text-primary tracking-tight leading-snug group-hover:text-primary-lime transition-colors line-clamp-1">
              {pitch.name || "Kampala Arena Turf"}
            </h3>

            {/* Location & Proximity Distance */}
            <div className="flex items-center gap-1.5 text-text-secondary text-xs">
              <MapPin size={13} className="text-primary-lime shrink-0" />
              <span className="truncate">{pitch.location || "Kampala, Uganda"}</span>
              {distance && (
                <>
                  <span className="text-text-tertiary">·</span>
                  <span className="font-mono tabular-nums text-text-primary font-bold shrink-0">{distance}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Pricing & Action */}
      <div className="px-4 py-3 border-t border-border-subtle flex items-center justify-between gap-3 bg-surface-raised/40 shrink-0">
        <div>
          {typeof pitch.pricePerHour === 'number' && pitch.pricePerHour > 0 ? (
            <>
              <span className="text-[9px] font-black uppercase tracking-widest text-text-tertiary block mb-0.5">
                Hourly Rate
              </span>
              <div className="flex items-baseline gap-1">
                <span className="font-mono tabular-nums text-base sm:text-lg font-black text-text-primary tracking-tight">
                  UGX {pitch.pricePerHour.toLocaleString()}
                </span>
                <span className="text-[11px] text-text-tertiary font-bold">/hr</span>
              </div>
            </>
          ) : null}
        </div>
        <button
          id={`book-pitch-${pitch.id}-btn`}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (pitch.id) navigate(`/turf/${pitch.id}`, { state: { from: 'home' } });
          }}
          className="h-9 px-3.5 rounded-xl bg-primary-lime hover:bg-primary-lime-hover text-black text-xs font-extrabold transition-all shadow-md shadow-primary-lime/20 flex items-center gap-1 cursor-pointer active:scale-95 shrink-0"
        >
          <span>View</span>
          <ChevronRight size={14} strokeWidth={2.5} />
        </button>
      </div>
    </article>
  );
};
