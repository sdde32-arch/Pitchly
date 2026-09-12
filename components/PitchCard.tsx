import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Star, Heart, Zap, Flame } from 'lucide-react';
import { PitchStatus, Turf } from '../types';

interface PitchCardProps {
  pitch: Partial<Turf>;
  isFavorited?: boolean;
  onToggleFavorite?: (pitchId: string, e: React.MouseEvent) => void;
  onBook?: (pitchId: string) => void;
}

export const PitchCard: React.FC<PitchCardProps> = ({
  pitch,
  isFavorited = false,
  onToggleFavorite,
}) => {
  const navigate = useNavigate();

  const pitchImage =
    (pitch.images && pitch.images[0]) ||
    pitch.image ||
    'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1000&q=80';

  const ratingVal = (pitch as any).rating !== undefined && (pitch as any).rating !== null ? Number((pitch as any).rating).toFixed(1) : '4.8';

  // Extract football-specific details
  const formats = pitch.pitchFormats || [];
  const formatDetail =
    formats.find(
      (f) =>
        f.toLowerCase().includes('side') ||
        f.toLowerCase().includes('11') ||
        f.toLowerCase().includes('7') ||
        f.toLowerCase().includes('5')
    ) || '7-a-side';

  const handleCardClick = () => {
    if (pitch.id) {
      navigate(`/turf/${pitch.id}`);
    }
  };

  return (
    <article
      onClick={handleCardClick}
      className="group cursor-pointer rounded-2xl bg-surface-card border border-border-subtle hover:border-border-prominent hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between"
    >
      {/* Top Image with Overlaid Badges */}
      <div className="relative w-full h-32 bg-surface-raised overflow-hidden">
        <img
          src={pitchImage}
          alt={pitch.name || 'Football pitch'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Popular Tag */}
        <div className="absolute top-2.5 left-2.5 bg-white/90 dark:bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-md flex items-center gap-1 text-[10px] font-bold text-text-primary border border-border-subtle shadow-xs">
          <Flame size={12} className="text-amber-500 fill-amber-400" />
          <span>Popular</span>
        </div>

        {/* Overlaid Top-Right Heart / Save Icon */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleFavorite && pitch.id) {
              onToggleFavorite(pitch.id, e);
            }
          }}
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 dark:bg-black/75 backdrop-blur-md flex items-center justify-center text-text-tertiary hover:text-primary-lime border border-border-subtle transition-colors cursor-pointer shadow-xs"
          aria-label="Save pitch"
        >
          <Heart
            size={15}
            className={isFavorited ? 'fill-primary-lime text-primary-lime' : ''}
          />
        </button>

        {/* Overlaid Bottom-Right Rating */}
        <div className="absolute bottom-2.5 right-2.5 bg-white/90 dark:bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-md flex items-center gap-1 text-[11px] font-bold text-text-primary border border-border-subtle shadow-xs">
          <Star size={12} className="fill-amber-400 text-amber-500" />
          <span>{ratingVal}</span>
        </div>
      </div>

      {/* Details & Colored Facilities Badges */}
      <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          <div className="flex justify-between items-start gap-2">
            <h3 className="text-[14px] font-bold text-text-primary truncate group-hover:text-primary-lime transition-colors">
              {pitch.name}
            </h3>
            <div className="text-right flex flex-col shrink-0">
              <span className="text-[9px] text-text-tertiary uppercase tracking-wider leading-none">From</span>
              <span className="text-[13px] font-bold text-primary-lime leading-tight">
                UGX {(pitch.pricePerHour || 50000).toLocaleString()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-text-secondary truncate">
            <MapPin size={12} className="text-text-tertiary shrink-0" />
            <span className="truncate">{pitch.location || pitch.formattedAddress || 'Kampala, Uganda'}</span>
          </div>
        </div>

        {/* Colored Facilities Badges (Stadium, Lights, Parking, Changing) */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-border-subtle overflow-x-auto no-scrollbar">
          {/* Format / Stadium */}
          <div className="flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40 whitespace-nowrap">
            <span className="material-symbols-outlined text-[13px] text-emerald-600 dark:text-emerald-400">stadium</span>
            <span>{formatDetail}</span>
          </div>
          
          {/* Lights */}
          <div className="flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40 whitespace-nowrap">
            <Zap size={11} className="text-amber-500 fill-amber-400 shrink-0" />
            <span>Lights</span>
          </div>
          
          {/* Parking */}
          <div className="flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40 whitespace-nowrap">
            <span className="material-symbols-outlined text-[13px] text-blue-600 dark:text-blue-400">local_parking</span>
            <span>Parking</span>
          </div>
          
          {/* Changing */}
          <div className="flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/40 whitespace-nowrap">
            <span className="material-symbols-outlined text-[13px] text-purple-600 dark:text-purple-400">dry_cleaning</span>
            <span>Changing</span>
          </div>
        </div>
      </div>
    </article>
  );
};
