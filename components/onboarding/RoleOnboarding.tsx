import React, { useState } from "react";
import { useUser, UserRole } from "../../context/UserContext";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Search,
  Wallet,
  Users,
  Settings,
  PlusCircle,
  CheckSquare,
  ClipboardList,
  ShieldAlert,
  Monitor,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  EyeOff,
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
    title: "Welcome to Pitchly",
    text: "Find and book football pitches near you.",
    icon: <Search size={64} className="text-text-primary" />,
  },
  {
    id: 2,
    title: "Book Your Pitch",
    text: "Choose a turf, select your date and time, then confirm your booking.",
    icon: <CheckSquare size={64} className="text-text-primary" />,
  },
  {
    id: 3,
    title: "Pay Your Way",
    text: "Pay with MTN Mobile Money, Airtel Money, or Pay on Arrival.",
    icon: <Wallet size={64} className="text-text-primary" />,
  },
  {
    id: 4,
    title: "Play With Friends",
    text: "Create matches, invite teammates, and split costs.",
    icon: <Users size={64} className="text-text-primary" />,
  },
  {
    id: 5,
    title: "Manage Everything",
    text: "Track bookings, upload payment proof, cancel pending bookings, and check in.",
    icon: <Settings size={64} className="text-text-primary" />,
  },
];
const OWNER_SLIDES: Slide[] = [
  {
    id: 1,
    title: "Welcome to Pitchly for Owners",
    text: "Manage your pitch bookings, payments, and customers in one place.",
    icon: <Settings size={64} className="text-text-primary" />,
  },
  {
    id: 2,
    title: "Add Your Pitch",
    text: "Upload pitch details, photos, pricing, and amenities.",
    icon: <PlusCircle size={64} className="text-text-primary" />,
  },
  {
    id: 3,
    title: "Get Approved",
    text: "Your listing will be reviewed by Pitchly before going public.",
    icon: <CheckCircle2 size={64} className="text-text-primary" />,
  },
  {
    id: 4,
    title: "Set Payment Details",
    text: "Add your MTN and Airtel numbers so players know where to pay.",
    icon: <Wallet size={64} className="text-text-primary" />,
  },
  {
    id: 5,
    title: "Confirm Bookings",
    text: "Review payment screenshots, approve bookings, and manage your calendar.",
    icon: <ClipboardList size={64} className="text-text-primary" />,
  },
];
const ADMIN_SLIDES: Slide[] = [
  {
    id: 1,
    title: "Admin Console",
    text: "Review and manage the Pitchly marketplace.",
    icon: <Monitor size={64} className="text-text-primary" />,
  },
  {
    id: 2,
    title: "Approve Pitches",
    text: "Check submitted pitch details before they appear publicly.",
    icon: <CheckCircle2 size={64} className="text-text-primary" />,
  },
  {
    id: 3,
    title: "Monitor Activity",
    text: "View bookings, owners, and system activity for moderation.",
    icon: <Search size={64} className="text-text-primary" />,
  },
  {
    id: 4,
    title: "Keep Marketplace Safe",
    text: "Use admin tools to protect players and owners.",
    icon: <ShieldAlert size={64} className="text-text-primary" />,
  },
];
interface RoleOnboardingProps {
  onComplete?: () => void;
}
export const RoleOnboarding: React.FC<RoleOnboardingProps> = ({
  onComplete,
}) => {
  const { role, isOwner, isAdmin, updateProfile, userProfile } =
    useUser();
  const navigate = useNavigate();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);
  let slides = PLAYER_SLIDES;
  let cta = "Start Booking";
  let nextRoute = "/home";
  if (isAdmin) {
    slides = ADMIN_SLIDES;
    cta = "Go to Admin Dashboard";
    nextRoute = "/admin";
  } else if (isOwner) {
    slides = OWNER_SLIDES;
    cta = "Set Up My Pitch";
    nextRoute = "/owner";
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
  const handleFinish = async () => {
    setIsFinishing(true);
    if (!userProfile?.hasCompletedOnboarding) {
      await updateProfile({
        hasCompletedOnboarding: true,
        onboardingCompletedAt: new Date().toISOString(),
      });
    }
    if (onComplete) {
      onComplete();
    } else {
      navigate(nextRoute);
    }
  };
  const slide = slides[currentSlideIndex];
  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center animate-fadeIn selection:bg-primary-lime/30">
      <div className="flex-1 w-full flex flex-col justify-center items-center p-4 max-w-md mx-auto">
        {/* Progress Indicators */}
        <div className="flex justify-center gap-2 mb-12 w-full max-w-[200px]">
          {slides.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentSlideIndex ? "bg-primary-lime flex-1" : idx < currentSlideIndex ? "bg-primary-lime/50 w-4" : "bg-border-subtle w-4"}`}
            />
          ))}
        </div>
        {/* Slide content inside a glass card */}
        <div className="w-full bg-surface-card border border-border-subtle shadow-2xl rounded-2xl p-4 sm:p-10 text-center relative overflow-hidden transition-all duration-300 animate-slide-up">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            {slide.icon}
          </div>
          <div className="h-24 flex items-center justify-center mb-6 bg-surface-raised w-24 rounded-full border border-border-subtle shadow-lg mx-auto transform hover:scale-105 transition-transform duration-300 text-primary-lime">
            {slide.icon}
          </div>
          <div className="min-h-[140px] flex flex-col justify-center">
            <h2 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tighter text-white mb-4 leading-tight">
              {slide.title}
            </h2>
            <p className="text-text-secondary text-sm sm:text-base font-normal leading-relaxed">
              {slide.text}
            </p>
          </div>
        </div>
      </div>
      {/* Bottom Navigation */}
      <div className="w-full max-w-md px-4 pb-10 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentSlideIndex === 0}
            className={`w-[52px] h-[52px] flex items-center justify-center rounded-full transition-all bg-surface-card border border-border-subtle ${currentSlideIndex === 0 ? "opacity-0 pointer-events-none" : "text-white hover:bg-surface-raised"}`}
          >
            <ChevronLeft size={24} />
          </button>
          {currentSlideIndex < slides.length - 1 ? (
            <button
              onClick={handleNext}
              className="bg-primary-lime text-accent-text px-4 py-4 h-[52px] rounded-full font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-[#96E600] active:scale-95 transition-all shadow-[0_0_20px_rgba(168,255,0,0.2)]"
            >
              Next <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={isFinishing}
              className="bg-primary-lime text-accent-text px-4 py-4 h-[52px] rounded-full font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-[#96E600] active:scale-95 transition-all shadow-[0_0_20px_rgba(168,255,0,0.2)]"
            >
              {isFinishing ? "Saving..." : cta} <CheckCircle size={18} />
            </button>
          )}
        </div>{" "}
        {/* Skip option */}{" "}
        {currentSlideIndex < slides.length - 1 && (
          <button
            onClick={handleFinish}
            className="text-[10px] sm:text-xs font-bold text-text-secondary uppercase tracking-widest hover:text-text-primary transition-colors py-2"
          >
            {" "}
            Skip Tutorial{" "}
          </button>
        )}{" "}
      </div>{" "}
    </div>
  );
};
