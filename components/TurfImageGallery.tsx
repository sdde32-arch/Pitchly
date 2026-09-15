import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";

interface TurfImageGalleryProps {
  images: string[];
  name: string;
  showMaximize?: boolean;
  showPageCounter?: boolean;
  showThumbnails?: boolean;
  className?: string;
  wrapperClassName?: string;
  selectedIndex?: number;
  onIndexChange?: (index: number) => void;
}

const DEFAULT_DEMO_PITCH_IMAGES = [
  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1556056504-5c7696c4c28d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=1200&q=80",
];

export const TurfImageGallery: React.FC<TurfImageGalleryProps> = ({ 
  images, 
  name,
  showMaximize = true,
  showPageCounter = true,
  showThumbnails = true,
  className = "",
  wrapperClassName = "",
  selectedIndex,
  onIndexChange
}) => {
  const [currentIndex, setCurrentIndex] = useState(selectedIndex ?? 0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const startXRef = useRef<number | null>(null);
  const currentXRef = useRef<number | null>(null);
  const isMouseDownRef = useRef(false);

  // Filter valid images
  const galleryImages = React.useMemo(() => {
    if (!images || images.length === 0) {
      return DEFAULT_DEMO_PITCH_IMAGES;
    }
    const list = images.filter((img) => typeof img === "string" && img.trim().length > 0);
    return list.length > 0 ? list : DEFAULT_DEMO_PITCH_IMAGES;
  }, [images]);

  // Safe clamped index within bounds
  const safeIndex = Math.min(Math.max(0, currentIndex), Math.max(0, galleryImages.length - 1));

  // Sync external selectedIndex into internal state without triggering circular updates
  useEffect(() => {
    if (selectedIndex !== undefined && selectedIndex !== currentIndex) {
      const clamped = Math.min(Math.max(0, selectedIndex), galleryImages.length - 1);
      setCurrentIndex(clamped);
    }
  }, [selectedIndex, galleryImages.length]);

  const changeSlide = useCallback((newIndex: number) => {
    const total = galleryImages.length;
    if (total === 0) return;
    const nextIdx = (newIndex + total) % total;
    setCurrentIndex(nextIdx);
    onIndexChange?.(nextIdx);
  }, [galleryImages.length, onIndexChange]);

  const handleNext = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    changeSlide(safeIndex + 1);
  }, [changeSlide, safeIndex]);

  const handlePrev = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    changeSlide(safeIndex - 1);
  }, [changeSlide, safeIndex]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startXRef.current === null) return;
    currentXRef.current = e.touches[0].clientX;
    const diff = currentXRef.current - startXRef.current;
    // Dampen drag at boundaries
    if ((safeIndex === 0 && diff > 0) || (safeIndex === galleryImages.length - 1 && diff < 0)) {
      setDragOffset(diff * 0.3);
    } else {
      setDragOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (startXRef.current !== null && currentXRef.current !== null) {
      const diff = currentXRef.current - startXRef.current;
      if (diff < -50) {
        handleNext();
      } else if (diff > 50) {
        handlePrev();
      }
    }
    startXRef.current = null;
    currentXRef.current = null;
    setDragOffset(0);
    setIsDragging(false);
  };

  // Mouse drag handlers for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only left click
    if (e.button !== 0) return;
    isMouseDownRef.current = true;
    startXRef.current = e.clientX;
    currentXRef.current = e.clientX;
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDownRef.current || startXRef.current === null) return;
    currentXRef.current = e.clientX;
    const diff = currentXRef.current - startXRef.current;
    if ((safeIndex === 0 && diff > 0) || (safeIndex === galleryImages.length - 1 && diff < 0)) {
      setDragOffset(diff * 0.3);
    } else {
      setDragOffset(diff);
    }
  };

  const handleMouseUp = () => {
    if (!isMouseDownRef.current) return;
    if (startXRef.current !== null && currentXRef.current !== null) {
      const diff = currentXRef.current - startXRef.current;
      if (diff < -50) {
        handleNext();
      } else if (diff > 50) {
        handlePrev();
      }
    }
    isMouseDownRef.current = false;
    startXRef.current = null;
    currentXRef.current = null;
    setDragOffset(0);
    setIsDragging(false);
  };

  // Keyboard navigation when Lightbox is open
  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsLightboxOpen(false);
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, handleNext, handlePrev]);

  const isFullHeight = className?.includes("h-full") || wrapperClassName?.includes("h-full");

  return (
    <div className={`w-full ${isFullHeight ? "h-full" : ""} ${wrapperClassName || ""}`} id="turf-photo-gallery">
      {/* Main Track Swiper Stage */}
      <div 
        className={`relative w-full overflow-hidden select-none group ${
          isFullHeight 
            ? "h-full w-full" 
            : (className || "h-[240px] sm:h-[320px] rounded-[16px] shadow-lg border border-border-subtle bg-surface-card")
        } ${className || ""}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Sliding flex track: all images placed side by side, translated smoothly via CSS hardware acceleration */}
        <div 
          className="flex h-full w-full will-change-transform cursor-grab active:cursor-grabbing"
          style={{
            transform: `translate3d(calc(-${safeIndex * 100}% + ${dragOffset}px), 0px, 0px)`,
            transition: isDragging ? "none" : "transform 350ms cubic-bezier(0.25, 1, 0.5, 1)",
          }}
          onClick={(e) => {
            // Only trigger fullscreen click if not dragging
            if (Math.abs(dragOffset) < 5) {
              setIsLightboxOpen(true);
            }
          }}
        >
          {galleryImages.map((imgUrl, idx) => (
            <div 
              key={idx} 
              className="w-full h-full shrink-0 relative bg-surface-card overflow-hidden"
            >
              <img
                src={imgUrl}
                alt={`${name} facility view ${idx + 1}`}
                className="w-full h-full object-cover pointer-events-none select-none"
                loading={idx <= 1 ? "eager" : "lazy"}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_DEMO_PITCH_IMAGES[0];
                }}
              />
            </div>
          ))}
        </div>

        {/* Subtle Dark Gradient Overlay at bottom for contrast */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none z-10" />

        {/* Floating Page Counter Badge */}
        {showPageCounter && (
          <div className="absolute top-4 right-20 sm:right-24 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full z-20 select-none flex items-center gap-1.5 border border-white/10 shadow-md">
            <span>{safeIndex + 1}</span>
            <span className="opacity-50">/</span>
            <span className="opacity-70">{galleryImages.length}</span>
          </div>
        )}

        {/* Floating Maximize Trigger */}
        {showMaximize && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsLightboxOpen(true);
            }}
            className="absolute top-4 left-18 sm:left-20 w-10 h-10 bg-black/60 backdrop-blur-md hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-all active:scale-95 z-20 border border-white/10 shadow-md cursor-pointer"
            title="Open Fullscreen Gallery"
            aria-label="Open Fullscreen Gallery"
          >
            <Maximize2 size={16} />
          </button>
        )}

        {/* Left & Right Arrow Controls */}
        {galleryImages.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 bg-black/60 backdrop-blur-md hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-all active:scale-95 z-20 border border-white/15 shadow-lg cursor-pointer"
              aria-label="Previous image"
              title="Previous photo"
            >
              <ChevronLeft size={22} strokeWidth={2.5} />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 bg-black/60 backdrop-blur-md hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-all active:scale-95 z-20 border border-white/15 shadow-lg cursor-pointer"
              aria-label="Next image"
              title="Next photo"
            >
              <ChevronRight size={22} strokeWidth={2.5} />
            </button>
          </>
        )}

        {/* Interactive Dot Indicators */}
        {galleryImages.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 shadow-md">
            {galleryImages.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  changeSlide(idx);
                }}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === safeIndex
                    ? "w-6 bg-primary-lime shadow-[0_0_10px_rgba(168,255,0,0.6)]"
                    : "w-2 bg-white/40 hover:bg-white/70"
                }`}
                aria-label={`Go to photo ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Mini Thumbnails Strip Below Stage (if enabled) */}
      {showThumbnails && galleryImages.length > 1 && (
        <div className="flex gap-2.5 mt-3 overflow-x-auto no-scrollbar py-1">
          {galleryImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => changeSlide(idx)}
              className={`relative flex-shrink-0 w-16 h-12 rounded-[12px] overflow-hidden border-2 transition-all cursor-pointer ${
                idx === safeIndex
                  ? "border-primary-lime scale-105 shadow-[0_0_8px_rgba(168,255,0,0.4)]"
                  : "border-transparent hover:border-zinc-500 opacity-60 hover:opacity-100"
              }`}
            >
              <img
                src={img}
                alt={`Thumbnail preview ${idx + 1}`}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </button>
          ))}
        </div>
      )}

      {/* FULLSCREEN LIGHTBOX MODAL */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6"
            onClick={() => setIsLightboxOpen(false)}
          >
            {/* Top Bar inside Lightbox */}
            <div 
              className="w-full max-w-5xl mx-auto flex items-center justify-between text-white z-10" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col">
                <h3 className="font-display font-semibold text-base sm:text-lg tracking-wide text-white">
                  {name}
                </h3>
                <span className="text-xs text-zinc-400">
                  Photo {safeIndex + 1} of {galleryImages.length}
                </span>
              </div>
              <button
                onClick={() => setIsLightboxOpen(false)}
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all active:scale-95 cursor-pointer border border-white/10"
                aria-label="Close Lightbox"
                title="Close Lightbox"
              >
                <X size={20} />
              </button>
            </div>

            {/* Main Stage inside Lightbox */}
            <div 
              className="flex-1 flex items-center justify-center relative w-full max-w-5xl mx-auto my-2 overflow-hidden select-none" 
              onClick={(e) => e.stopPropagation()}
            >
              <div 
                className="flex h-full w-full items-center will-change-transform"
                style={{
                  transform: `translate3d(-${safeIndex * 100}%, 0px, 0px)`,
                  transition: "transform 300ms cubic-bezier(0.25, 1, 0.5, 1)",
                }}
              >
                {galleryImages.map((imgUrl, idx) => (
                  <div 
                    key={idx} 
                    className="w-full h-full shrink-0 flex items-center justify-center p-2"
                  >
                    <img
                      src={imgUrl}
                      alt={`${name} high resolution view ${idx + 1}`}
                      className="max-w-full max-h-[75vh] object-contain rounded-[14px] shadow-2xl border border-white/10"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.src = DEFAULT_DEMO_PITCH_IMAGES[0];
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Navigation Controls in Lightbox */}
              {galleryImages.length > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    className="absolute left-2 sm:left-4 w-12 h-12 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-all active:scale-95 border border-white/15 shadow-2xl z-20 cursor-pointer"
                    aria-label="Previous photo"
                  >
                    <ChevronLeft size={24} strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-2 sm:right-4 w-12 h-12 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-all active:scale-95 border border-white/15 shadow-2xl z-20 cursor-pointer"
                    aria-label="Next photo"
                  >
                    <ChevronRight size={24} strokeWidth={2.5} />
                  </button>
                </>
              )}
            </div>

            {/* Bottom Thumbnail Strip in Lightbox */}
            <div 
              className="w-full max-w-5xl mx-auto flex flex-col items-center gap-2 py-2 z-10" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex gap-2 max-w-full overflow-x-auto no-scrollbar px-2 pb-1">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => changeSlide(idx)}
                    className={`relative flex-shrink-0 w-16 h-12 rounded-[10px] overflow-hidden border-2 transition-all cursor-pointer ${
                      idx === safeIndex
                        ? "border-primary-lime scale-105 shadow-[0_0_12px_rgba(168,255,0,0.5)]"
                        : "border-transparent opacity-40 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Lightbox thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.src = DEFAULT_DEMO_PITCH_IMAGES[0];
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
