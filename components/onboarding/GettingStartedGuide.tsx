import React, { useState } from "react";
import { 
  Search, 
  CalendarCheck, 
  Users, 
  CheckCircle2, 
  ChevronRight, 
  Sparkles, 
  X, 
  ArrowRight,
  Compass,
  CreditCard,
  ShieldCheck
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useInteractiveWalkthrough } from "../../context/InteractiveWalkthroughContext";

interface GettingStartedGuideProps {
  onDismiss?: () => void;
  onOpenAppTour?: () => void;
}

export const GettingStartedGuide: React.FC<GettingStartedGuideProps> = ({
  onDismiss,
  onOpenAppTour
}) => {
  const navigate = useNavigate();
  const { startWalkthrough } = useInteractiveWalkthrough();
  const [activeCard, setActiveCard] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  const cards = [
    {
      id: 0,
      step: "01",
      badge: "Discovery",
      title: "Find a Premier Turf",
      subtitle: "Locate certified pitches across Kampala with real distance & night floodlight filters.",
      icon: <Search className="w-5 h-5 text-primary-lime" />,
      actionText: "Interactive Radar Tour",
      onClick: () => startWalkthrough(1),
      highlightBg: "from-lime-500/10 to-transparent",
      features: [
        "Interactive radar map with GPS proximity",
        "AstroTurf & natural grass filters",
        "Real photo galleries & hourly pricing"
      ]
    },
    {
      id: 1,
      step: "02",
      badge: "Reservation",
      title: "Book & Lock a Match",
      subtitle: "Pick an hourly slot and hold it for 10 minutes with instant MTN / Airtel Mobile Money checkout.",
      icon: <CalendarCheck className="w-5 h-5 text-primary-lime" />,
      actionText: "Interactive Slot Lock Tour",
      onClick: () => startWalkthrough(3),
      highlightBg: "from-amber-500/10 to-transparent",
      features: [
        "Real-time anti-double booking lock",
        "MTN MoMo & Airtel Money direct checkout",
        "Instant digital QR match ticket"
      ]
    },
    {
      id: 2,
      step: "03",
      badge: "Community",
      title: "Join or Create a Team",
      subtitle: "Connect with local squads in your district, schedule friendlies, and split match fees automatically.",
      icon: <Users className="w-5 h-5 text-primary-lime" />,
      actionText: "Interactive Squads Tour",
      onClick: () => startWalkthrough(7),
      highlightBg: "from-emerald-500/10 to-transparent",
      features: [
        "Squad matchmaking & player rosters",
        "Team chat & fixture scheduling",
        "Automated fee split per player"
      ]
    }
  ];

  const handleDismiss = () => {
    try {
      localStorage.setItem("hasDismissedGettingStarted", "true");
    } catch (e) {
      console.warn("Could not write to localStorage", e);
    }
    if (onDismiss) {
      onDismiss();
    }
  };

  const handleCardClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveCard(index);
    setCompletedSteps(prev => ({ ...prev, [index]: true }));
  };

  return (
    <section 
      aria-label="Getting Started Guide"
      className="relative rounded-3xl bg-surface-card border border-border-subtle p-4 sm:p-6 shadow-xl overflow-hidden animate-fade-in text-left"
    >
      {/* Decorative ambient gradient backdrop */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-primary-lime/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header section with dismiss and full tour trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border-subtle relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-lime/10 border border-primary-lime/25 text-[10.5px] font-black tracking-widest text-primary-lime uppercase">
              <Sparkles className="w-3 h-3 text-primary-lime" />
              Getting Started
            </span>
            <span className="text-[11px] font-semibold text-text-tertiary">
              Quick Setup (3 Steps)
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-black text-text-primary tracking-tight">
            How to Master Footlink in Minutes
          </h2>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => onOpenAppTour ? onOpenAppTour() : startWalkthrough(0)}
            className="px-3.5 py-1.5 rounded-xl bg-primary-lime/15 hover:bg-primary-lime/25 border border-primary-lime/40 text-[11px] font-black text-primary-lime hover:text-primary-lime transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            title="Start live interactive app walkthrough"
          >
            <Compass className="w-3.5 h-3.5 text-primary-lime animate-spin-slow" />
            <span>Interactive Walkthrough</span>
          </button>

          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-xl hover:bg-surface-base text-text-tertiary hover:text-text-primary transition-colors cursor-pointer border border-transparent hover:border-border-subtle"
            title="Dismiss guide"
            aria-label="Dismiss Getting Started guide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3 Step Interactive Visual Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 my-4 relative z-10">
        {cards.map((card, idx) => {
          const isSelected = activeCard === idx;
          const isChecked = completedSteps[idx];

          return (
            <div
              key={card.id}
              onClick={(e) => handleCardClick(idx, e)}
              className={`relative rounded-2xl p-4 transition-all duration-300 cursor-pointer flex flex-col justify-between border select-none ${
                isSelected
                  ? "bg-surface-raised border-primary-lime/60 shadow-lg shadow-primary-lime/10 ring-1 ring-primary-lime/30 scale-[1.01]"
                  : "bg-surface-base/80 hover:bg-surface-raised/70 border-border-subtle hover:border-text-tertiary"
              }`}
            >
              {/* Step indicator top row */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                    isSelected ? "bg-primary-lime/20 text-primary-lime" : "bg-surface-card border border-border-subtle text-text-secondary"
                  }`}>
                    {card.icon}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-text-tertiary">
                    Step {card.step}
                  </span>
                </div>
                
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border transition-all ${
                  isSelected 
                    ? "bg-primary-lime/15 text-primary-lime border-primary-lime/30"
                    : "bg-surface-card text-text-tertiary border-border-subtle"
                }`}>
                  {card.badge}
                </span>
              </div>

              {/* Card copy */}
              <div className="space-y-1.5 mb-3.5">
                <h3 className="text-sm font-bold text-text-primary group-hover:text-primary-lime transition-colors">
                  {card.title}
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed font-normal">
                  {card.subtitle}
                </p>

                {/* Key sub-features list */}
                <div className="space-y-1 pt-2">
                  {card.features.map((feature, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
                      <div className="w-1 h-1 rounded-full bg-primary-lime shrink-0" />
                      <span className="truncate">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action button inside card */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCompletedSteps(prev => ({ ...prev, [idx]: true }));
                  card.onClick();
                }}
                className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? "bg-primary-lime text-accent-text hover:bg-primary-lime-hover shadow-xs"
                    : "bg-surface-card hover:bg-surface-base text-text-primary border border-border-subtle"
                }`}
              >
                <span>{card.actionText}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer with "I'm ready" dismissal button */}
      <div className="pt-3 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <ShieldCheck className="w-4 h-4 text-primary-lime shrink-0" />
          <span>You can always revisit tutorials in your <strong>Profile &gt; Help Guide</strong>.</span>
        </div>

        <button
          onClick={handleDismiss}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-primary-lime hover:bg-primary-lime-hover text-accent-text font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-primary-lime/20 active:scale-[0.98] transition-all cursor-pointer"
        >
          <span>I'm Ready</span>
          <CheckCircle2 className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
};
