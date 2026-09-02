import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";

interface TurfImageGalleryProps {
  images: string[];
  name: string;
  showMaximize?: boolean;
  showPageCounter?: boolean;
  showThumbnails?: boolean;
  className?: string;
  selectedIndex?: number;
  onIndexChange?: (index: number) => void;
}

const DEFAULT_DEMO_PITCH_IMAGES = [
  "https://images.unsplash.com/photo-1529900245534-47fbf59f4820?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1556056504-5c7696c4c28d?auto=format&fit=crop&w=1200&q=80",
];

export const TurfImageGallery: React.FC<TurfImageGalleryProps> = ({ 
  images, 
  name,
  showMaximize = true,
  showPageCounter = true,
  showThumbnails = true,
  className = "",
  selectedIndex,
  onIndexChange
}) => {
  const [currentIndex, setCurrentIndex] = useState(selectedIndex ?? 0);

  React.useEffect(() => {
    if (selectedIndex !== undefined && selectedIndex !== currentIndex) {
      setCurrentIndex(selectedIndex);
    }
  }, [selectedIndex]);

  React.useEffect(() => {
    onIndexChange?.(currentIndex);
  }, [currentIndex, onIndexChange]);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right

  const galleryImages = React.useMemo(() => {
    if (!images || images.length === 0) {
      return DEFAULT_DEMO_PITCH_IMAGES;
    }
    // ensure we have at least 4 images for a rich gallery feel
    const list = [...images].filter(Boolean);
    DEFAULT_DEMO_PITCH_IMAGES.forEach((img) => {
      if (!list.includes(img) && list.length < 5) {
        list.push(img);
      }
    });
    return list;
  }, [images]);

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDirection(1);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % galleryImages.length);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDirection(-1);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + galleryImages.length) % galleryImages.length);
  };

  const selectImage = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  // Drag variants for swipe
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  return (
    <div className="w-full" id="turf-photo-gallery">
      {/* Main Swiper Stage */}
      <div className={`relative w-full overflow-hidden group transition-all ${className || "h-[240px] sm:h-[320px] rounded-[16px] shadow-lg border border-border-subtle bg-surface-card"}`}>
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x);
              if (swipe < -swipeConfidenceThreshold) {
                handleNext();
              } else if (swipe > swipeConfidenceThreshold) {
                handlePrev();
              }
            }}
            className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
            onClick={() => setIsLightboxOpen(true)}
          >
            <img
              src={galleryImages[currentIndex]}
              alt={`${name} facility image ${currentIndex + 1}`}
              className="w-full h-full object-cover pointer-events-none"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </AnimatePresence>

        {/* Gradient Overlay for bottom navigation readability inside the slider */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

        {/* Floating Page Counter Badges */}
        {showPageCounter && (
          <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full z-10 select-none flex items-center gap-1.5 border border-white/10 shadow-md">
            <span>{currentIndex + 1}</span>
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
            className="absolute top-4 left-4 w-9 h-9 bg-black/50 backdrop-blur-md hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all active:scale-95 z-10 border border-white/10 shadow-md"
            title="Open Fullscreen Gallery"
          >
            <Maximize2 size={16} />
          </button>
        )}

        {/* Floating Arrow Controls (always available, elegantly styled) */}
        {galleryImages.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 backdrop-blur-md hover:bg-black/75 hover:scale-105 text-white rounded-full flex items-center justify-center transition-all active:scale-95 z-10 opacity-0 group-hover:opacity-100 sm:opacity-100 border border-white/10 shadow-lg"
              aria-label="Previous image"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 backdrop-blur-md hover:bg-black/75 hover:scale-105 text-white rounded-full flex items-center justify-center transition-all active:scale-95 z-10 opacity-0 group-hover:opacity-100 sm:opacity-100 border border-white/10 shadow-lg"
              aria-label="Next image"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Interactive Pagination Indicator dots */}
        {galleryImages.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10 bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/5">
            {galleryImages.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  selectImage(idx);
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentIndex
                    ? "w-5 bg-primary-lime shadow-[0_0_8px_rgba(168,255,0,0.5)]"
                    : "w-2 bg-white/40 hover:bg-white/60"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Grid of Mini-Thumbnails Below the main swiper stage */}
      {showThumbnails && galleryImages.length > 1 && (
        <div className="flex gap-2.5 mt-3 overflow-x-auto no-scrollbar py-1">
          {galleryImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => selectImage(idx)}
              className={`relative flex-shrink-0 w-16 h-12 rounded-[12px] overflow-hidden border-2 transition-all ${
                idx === currentIndex
                  ? "border-primary-lime scale-105 shadow-[0_0_8px_rgba(168,255,0,0.3)]"
                  : "border-transparent hover:border-zinc-400 opacity-60 hover:opacity-100"
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

      {/* FULLSCREEN LIGHTBOX VIEW */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/98 backdrop-blur-xl flex flex-col justify-between p-4 "
            onClick={() => setIsLightboxOpen(false)}
          >
            {/* Top Bar inside Lightbox */}
            <div className="w-full flex items-center justify-between text-white z-10" onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-col">
                <h3 className="font-display font-semibold text-sm sm:text-base tracking-wide text-white">
                  {name} Gallery
                </h3>
                <span className="text-xs text-zinc-400">
                  Image {currentIndex + 1} of {galleryImages.length}
                </span>
              </div>
              <button
                onClick={() => setIsLightboxOpen(false)}
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all active:scale-95"
                aria-label="Close Lightbox"
              >
                <X size={20} />
              </button>
            </div>

            {/* Main Stage inside Lightbox */}
            <div className="flex-1 flex items-center justify-center relative w-full h-full py-4 my-2 select-none" onClick={(e) => e.stopPropagation()}>
              {/* Swipeable Large Image */}
              <AnimatePresence initial={false} custom={direction} mode="popLayout">
                <motion.div
                  key={currentIndex}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 },
                  }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={1}
                  onDragEnd={(e, { offset, velocity }) => {
                    const swipe = swipePower(offset.x, velocity.x);
                    if (swipe < -swipeConfidenceThreshold) {
                      handleNext();
                    } else if (swipe > swipeConfidenceThreshold) {
                      handlePrev();
                    }
                  }}
                  className="max-w-full max-h-[70vh] flex items-center justify-center cursor-zoom-out"
                  onClick={() => setIsLightboxOpen(false)}
                >
                  <img
                    src={galleryImages[currentIndex]}
                    alt={`${name} high resolution`}
                    className="max-w-full max-h-[75vh] object-contain rounded-[16px] shadow-2xl border border-white/5"
                    referrerPolicy="no-referrer"
                  />
                </motion.div>
              </AnimatePresence>

              {/* Navigation Controls in Lightbox */}
              {galleryImages.length > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    className="absolute left-2 sm:left-6 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all active:scale-95 border border-white/5 shadow-2xl z-20"
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-2 sm:right-6 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all active:scale-95 border border-white/5 shadow-2xl z-20"
                    aria-label="Next image"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
            </div>

            {/* Bottom Thumbnail list in Lightbox */}
            <div className="w-full flex flex-col items-center gap-3 py-2 z-10" onClick={(e) => e.stopPropagation()}>
              <div className="flex gap-2 max-w-full overflow-x-auto no-scrollbar px-4 pb-2">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectImage(idx)}
                    className={`relative flex-shrink-0 w-16 h-12 rounded-[12px] overflow-hidden border-2 transition-all ${
                      idx === currentIndex
                        ? "border-primary-lime scale-105 shadow-[0_0_12px_rgba(168,255,0,0.4)]"
                        : "border-transparent opacity-40 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Lightbox thumbnail preview ${idx + 1}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
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
