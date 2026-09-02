import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  useInteractiveWalkthrough, 
  WALKTHROUGH_STEPS 
} from "../../context/InteractiveWalkthroughContext";
import { 
  Compass, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  X, 
  CheckCircle2, 
  Zap, 
  Target, 
  ShieldCheck, 
  ChevronRight,
  MousePointerClick,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface BoundingBox {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
}

export const InteractiveWalkthroughOverlay: React.FC = () => {
  const { 
    isActive, 
    currentStepIndex, 
    currentStep, 
    totalSteps, 
    nextStep, 
    prevStep, 
    endWalkthrough,
    goToStep 
  } = useInteractiveWalkthrough();

  const [targetRect, setTargetRect] = useState<BoundingBox | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number; placement: "top" | "bottom" | "center" }>({
    top: 100,
    left: 20,
    placement: "bottom"
  });
  const [isElementFound, setIsElementFound] = useState<boolean>(false);
  const retryTimeoutRef = useRef<any>(null);

  // Update target bounding box and position tooltip
  const updatePosition = useCallback(() => {
    if (!isActive || !currentStep) {
      setTargetRect(null);
      setIsElementFound(false);
      return;
    }

    const el = document.querySelector(currentStep.targetSelector);
    if (!el) {
      setIsElementFound(false);
      // Retry in 150ms in case page is still mounting
      retryTimeoutRef.current = setTimeout(updatePosition, 150);
      return;
    }

    setIsElementFound(true);

    // Smoothly scroll target into view if needed
    const rect = el.getBoundingClientRect();
    const isOutOfView = rect.top < 70 || rect.bottom > window.innerHeight - 70;
    if (isOutOfView) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    const updatedRect = el.getBoundingClientRect();
    const padding = 8;
    const box: BoundingBox = {
      top: Math.max(0, updatedRect.top - padding),
      left: Math.max(0, updatedRect.left - padding),
      width: updatedRect.width + padding * 2,
      height: updatedRect.height + padding * 2,
      bottom: updatedRect.bottom + padding,
      right: updatedRect.right + padding
    };

    setTargetRect(box);

    // Calculate optimal tooltip position
    const tooltipWidth = Math.min(window.innerWidth - 32, 440);
    const tooltipHeight = 360;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    let left = Math.max(16, Math.min(box.left + (box.width - tooltipWidth) / 2, screenWidth - tooltipWidth - 16));
    let top = 100;
    let placement: "top" | "bottom" | "center" = "bottom";

    // Check if there is enough space below the element
    if (box.bottom + tooltipHeight + 20 < screenHeight) {
      top = box.bottom + 14;
      placement = "bottom";
    } else if (box.top - tooltipHeight - 20 > 60) {
      top = box.top - tooltipHeight - 14;
      placement = "top";
    } else {
      // Center on screen if target is large or near edges
      top = Math.max(80, (screenHeight - tooltipHeight) / 2);
      placement = "center";
    }

    setTooltipPos({ top, left, placement });
  }, [isActive, currentStep]);

  useEffect(() => {
    updatePosition();

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener("resize", handleScrollOrResize);
    window.addEventListener("scroll", handleScrollOrResize, true);

    const interval = setInterval(updatePosition, 500);

    return () => {
      window.removeEventListener("resize", handleScrollOrResize);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      clearInterval(interval);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, [updatePosition, currentStepIndex]);

  if (!isActive || !currentStep) return null;

  const handleActionClick = () => {
    if (currentStep.onExecuteAction) {
      currentStep.onExecuteAction();
    }
    // Also trigger click on the underlying spotlighted element if applicable
    const el = document.querySelector(currentStep.targetSelector) as HTMLElement;
    if (el) {
      el.focus?.();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] pointer-events-auto overflow-hidden font-sans"
      aria-label="Interactive App Walkthrough"
      role="dialog"
    >
      {/* Dimmed backdrop with cutout / vignette */}
      <div 
        className="absolute inset-0 bg-black/65 backdrop-blur-[2px] transition-all duration-300 pointer-events-auto"
        onClick={endWalkthrough}
      />

      {/* Dynamic Target Spotlight Box */}
      {targetRect && (
        <motion.div
          layout
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          style={{
            position: "absolute",
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
            pointerEvents: "none",
          }}
          className="rounded-2xl border-2 border-primary-lime ring-4 ring-primary-lime/40 shadow-[0_0_40px_rgba(132,204,22,0.45)] z-10 animate-pulse"
        >
          {/* Subtle Corner Markers */}
          <div className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-primary-lime rounded-full shadow-sm" />
          <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-primary-lime rounded-full shadow-sm" />
          <div className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-primary-lime rounded-full shadow-sm" />
          <div className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-primary-lime rounded-full shadow-sm" />

          {/* Pointer Badge Label */}
          <div className="absolute -top-7 left-2 bg-primary-lime text-black text-[10px] font-black uppercase px-2 py-0.5 rounded-md shadow-md flex items-center gap-1 tracking-wider">
            <Target className="w-3 h-3" />
            <span>Target Position</span>
          </div>
        </motion.div>
      )}

      {/* Floating Interactive Guide Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep.id}
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.98 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: "fixed",
            top: tooltipPos.top,
            left: tooltipPos.left,
            width: Math.min(window.innerWidth - 32, 440),
            zIndex: 10000,
          }}
          className="bg-white dark:bg-[#121214] text-text-primary rounded-3xl p-4 sm:p-5 shadow-2xl border border-primary-lime/40 ring-1 ring-primary-lime/20 text-left space-y-4 max-h-[82vh] overflow-y-auto no-scrollbar"
        >
          {/* Header Row */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-border-subtle">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-primary-lime/15 border border-primary-lime/30 text-primary-lime font-black text-[10px] uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {currentStep.badge}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-surface-raised text-text-tertiary font-bold text-[10px] uppercase tracking-wider">
                  {currentStep.highlightTag}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-text-primary tracking-tight">
                {currentStep.title}
              </h3>
              <p className="text-[12px] font-semibold text-text-secondary flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-primary-lime shrink-0" />
                <span>{currentStep.serviceName}</span>
              </p>
            </div>

            <button
              onClick={endWalkthrough}
              className="p-1.5 rounded-xl hover:bg-surface-raised text-text-tertiary hover:text-text-primary transition-colors cursor-pointer border border-transparent hover:border-border-subtle shrink-0"
              title="Close Walkthrough"
              aria-label="Close Walkthrough"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Key Advantage Box */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-1.5 text-left">
            <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              <Zap className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" />
              <span>Direct Advantage &amp; Why It Matters</span>
            </div>
            <p className="text-[12.5px] leading-relaxed text-text-primary font-medium">
              {currentStep.advantage}
            </p>
          </div>

          {/* Action To Master Box */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-1.5 text-left">
            <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
              <Target className="w-3.5 h-3.5 text-amber-500" />
              <span>How to Master This Action</span>
            </div>
            <p className="text-[12.5px] leading-relaxed text-text-secondary font-medium">
              {currentStep.actionToMaster}
            </p>
          </div>

          {/* Step Progress & Interactive Buttons */}
          <div className="pt-2 border-t border-border-subtle flex flex-col gap-3">
            {/* Step Indicators */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-text-tertiary">
                Position {currentStepIndex + 1} of {totalSteps}
              </span>
              <div className="flex items-center gap-1">
                {WALKTHROUGH_STEPS.map((s, idx) => (
                  <button
                    key={s.id}
                    onClick={() => goToStep(idx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      idx === currentStepIndex
                        ? "w-6 bg-primary-lime"
                        : idx < currentStepIndex
                        ? "w-2 bg-primary-lime/50"
                        : "w-2 bg-border-subtle hover:bg-text-tertiary"
                    }`}
                    title={`Jump to ${s.title}`}
                  />
                ))}
              </div>
            </div>

            {/* Navigation Actions */}
            <div className="flex items-center gap-2">
              {currentStepIndex > 0 && (
                <button
                  onClick={prevStep}
                  className="px-3 py-2.5 rounded-xl bg-surface-base hover:bg-surface-raised border border-border-subtle text-[12px] font-bold text-text-secondary hover:text-text-primary transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              )}

              <button
                onClick={handleActionClick}
                className="px-3.5 py-2.5 rounded-xl bg-surface-raised hover:bg-border-subtle border border-border-subtle text-[12px] font-bold text-text-primary transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Interact with this highlighted position"
              >
                <MousePointerClick className="w-3.5 h-3.5 text-primary-lime" />
                <span>{currentStep.actionLabel || "Try Action"}</span>
              </button>

              <button
                onClick={nextStep}
                className="flex-1 py-2.5 px-4 rounded-xl bg-primary-lime hover:bg-primary-lime-hover text-accent-text text-[12px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95"
              >
                <span>{currentStepIndex === totalSteps - 1 ? "Finish Tour" : "Next Position"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
