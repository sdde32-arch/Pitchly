import React, { useState } from "react";
import { useUser } from "../../context/UserContext";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Search,
  Wallet,
  PlusCircle,
  ClipboardList,
  ShieldAlert,
  Monitor,
  CheckCircle2,
  QrCode,
} from "lucide-react";

interface Slide {
  id: number;
  title: string;
  text: string;
  icon: React.ReactNode;
}

const PLAYER_SLIDES: Slide[] = [
  {
    id: 1,
    title: "Find a pitch",
    text: "Browse verified football pitches in Kampala by area, check amenities and UGX prices, and see open time slots.",
    icon: <Search size={48} className="text-nav-active-text" />,
  },
  {
    id: 2,
    title: "Book and pay your deposit",
    text: "Hold a slot while you pay by MTN MoMo or Airtel Money and upload your payment proof, or hold a slot and pay at the pitch (limits apply).",
    icon: <Wallet size={48} className="text-nav-active-text" />,
  },
  {
    id: 3,
    title: "Show your Match Pass",
    text: "Once the owner confirms your payment, open your Match Pass in Bookings and show it at the gate.",
    icon: <QrCode size={48} className="text-nav-active-text" />,
  },
];

const OWNER_SLIDES: Slide[] = [
  {
    id: 1,
    title: "List your pitch",
    text: "Add your pitch photos, hourly prices in UGX, deposit percentage, and your Mobile Money number.",
    icon: <PlusCircle size={48} className="text-nav-active-text" />,
  },
  {
    id: 2,
    title: "Get approved",
    text: "Pitchly reviews each pitch before it goes live. You get a notification once it is approved.",
    icon: <CheckCircle2 size={48} className="text-nav-active-text" />,
  },
  {
    id: 3,
    title: "Run your day from Today",
    text: "Each slot shows booked, free, or waiting for your OK. Review payment proof and confirm payments right there.",
    icon: <ClipboardList size={48} className="text-nav-active-text" />,
  },
];

const ADMIN_SLIDES: Slide[] = [
  {
    id: 1,
    title: "Admin Console",
    text: "Review and manage the Pitchly marketplace.",
    icon: <Monitor size={48} className="text-nav-active-text" />,
  },
  {
    id: 2,
    title: "Approve Pitches",
    text: "Check submitted pitch details before they appear publicly.",
    icon: <CheckCircle2 size={48} className="text-nav-active-text" />,
  },
  {
    id: 3,
    title: "Monitor Activity",
    text: "View bookings, owners, and system activity for moderation.",
    icon: <Search size={48} className="text-nav-active-text" />,
  },
  {
    id: 4,
    title: "Keep Marketplace Safe",
    text: "Use admin tools to protect players and owners.",
    icon: <ShieldAlert size={48} className="text-nav-active-text" />,
  },
];

interface RoleOnboardingProps {
  onComplete?: () => void;
}

export const RoleOnboarding: React.FC<RoleOnboardingProps> = ({
  onComplete,
}) => {
  const { isOwner, isAdmin, updateProfile, userProfile } = useUser();
  const navigate = useNavigate();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);

  let slides = PLAYER_SLIDES;
  let cta = "Find a pitch";
  let finishRoute = "/home";
  let skipRoute = "/home";

  if (isAdmin) {
    slides = ADMIN_SLIDES;
    cta = "Go to Admin Dashboard";
    finishRoute = "/admin";
    skipRoute = "/admin";
  } else if (isOwner) {
    slides = OWNER_SLIDES;
    cta = "Add my pitch";
    finishRoute = "/owner/add-pitch";
    skipRoute = "/owner";
  }

  const handleNext = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex((prev) => prev - 1);
    }
  };

  const handleFinish = async (targetRoute: string) => {
    if (isFinishing) return;
    const isFirstRun = !userProfile?.hasCompletedOnboarding;
    setIsFinishing(true);
    try {
      if (isFirstRun) {
        try {
          await updateProfile({
            hasCompletedOnboarding: true,
            onboardingCompletedAt: new Date().toISOString(),
          });
        } catch (err) {
          console.warn("Failed to save onboarding completion:", err);
        }
      }
      if (onComplete) {
        onComplete();
      }
      if (isFirstRun) {
        navigate(targetRoute);
      }
    } finally {
      setIsFinishing(false);
    }
  };

  const slide = slides[currentSlideIndex];

  return (
    <div className="fixed inset-0 z-[100] bg-app-base text-text-primary flex flex-col items-center justify-center animate-fadeIn motion-reduce:animate-none selection:bg-primary-lime/30">
      <div className="flex-1 w-full flex flex-col justify-center items-center p-4 max-w-md mx-auto">
        {/* Progress Dots */}
        <div
          className="flex justify-center gap-2 mb-10 w-full max-w-[200px]"
          aria-label={`Step ${currentSlideIndex + 1} of ${slides.length}`}
        >
          {slides.map((s, idx) => (
            <div
              key={s.id}
              className={`h-1.5 rounded-full transition-all motion-reduce:transition-none duration-300 ${
                idx === currentSlideIndex
                  ? "bg-cta-bg flex-1"
                  : idx < currentSlideIndex
                  ? "bg-primary-lime/50 w-4"
                  : "bg-border-subtle w-4"
              }`}
            />
          ))}
        </div>

        {/* Slide Card */}
        <div className="w-full bg-surface-card border border-border-subtle shadow-2xl rounded-2xl p-6 sm:p-10 text-center relative overflow-hidden transition-all motion-reduce:transition-none duration-300">
          <div
            aria-hidden="true"
            className="h-24 w-24 flex items-center justify-center mb-6 bg-nav-bg rounded-full border border-nav-border shadow-lg mx-auto text-nav-active-text"
          >
            {slide.icon}
          </div>
          <div className="min-h-[140px] flex flex-col justify-center">
            <p className="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-2">
              {currentSlideIndex + 1} of {slides.length}
            </p>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-text-primary mb-4 leading-tight font-display">
              {slide.title}
            </h2>
            <p className="text-text-secondary text-sm sm:text-base font-normal leading-relaxed">
              {slide.text}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="w-full max-w-md px-4 pb-10 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            aria-label="Back"
            onClick={handleBack}
            disabled={currentSlideIndex === 0}
            className={`min-w-[48px] min-h-[48px] w-[52px] h-[52px] flex items-center justify-center rounded-full transition-all motion-reduce:transition-none bg-surface-card border border-border-subtle cursor-pointer ${
              currentSlideIndex === 0
                ? "opacity-0 pointer-events-none"
                : "text-text-primary hover:bg-surface-raised"
            }`}
          >
            <ChevronLeft size={24} />
          </button>

          {currentSlideIndex < slides.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="bg-cta-bg hover:bg-cta-bg-hover text-cta-text px-6 min-h-[52px] rounded-full font-black uppercase tracking-widest text-xs flex items-center gap-2 active:scale-95 motion-reduce:active:scale-100 transition-all motion-reduce:transition-none shadow-md cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight size={18} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleFinish(finishRoute)}
              disabled={isFinishing}
              className="bg-cta-bg hover:bg-cta-bg-hover text-cta-text px-6 min-h-[52px] rounded-full font-black uppercase tracking-widest text-xs flex items-center gap-2 active:scale-95 motion-reduce:active:scale-100 transition-all motion-reduce:transition-none shadow-md disabled:opacity-60 cursor-pointer"
            >
              <span>{isFinishing ? "Saving..." : cta}</span>
              <CheckCircle size={18} />
            </button>
          )}
        </div>

        {/* Skip option visible on every slide */}
        <button
          type="button"
          onClick={() => handleFinish(skipRoute)}
          disabled={isFinishing}
          className="min-h-[44px] px-4 py-2 text-xs font-bold text-text-secondary uppercase tracking-widest hover:text-text-primary transition-colors motion-reduce:transition-none disabled:opacity-60 cursor-pointer"
        >
          Skip
        </button>
      </div>
    </div>
  );
};
