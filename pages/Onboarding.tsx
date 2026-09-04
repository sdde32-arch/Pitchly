import React, { useState, useEffect } from "react";
import {
  MapPin,
  Trophy,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  CalendarDays,
} from "lucide-react";
import { Logo } from "../components/Logo";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

const SLIDES = [
  {
    id: 0,
    pillar: "DISCOVER",
    title: "The Pitch is Yours",
    desc: "Access a curated network of premium football turfs across the city. View real-time availability and detailed amenities for every venue.",
    features: [
      "Map-integrated search",
      "Verified turf listings",
      "Distance tracking",
    ],
    icon: MapPin,
    color: "text-[#38BDF8]",
    bgColor: "bg-[#38BDF8]/10",
    borderColor: "border-[#38BDF8]/20",
  },
  {
    id: 1,
    pillar: "BOOK",
    title: "Seamless Reservations",
    desc: "Secure your slot in under 60 seconds. From individual bookings to team split-payments via Mobile Money.",
    features: [
      "MoMo Split-Payment",
      "Instant QR Tickets",
      "Automated Reminders",
    ],
    icon: CalendarDays,
    color: "text-primary-lime",
    bgColor: "bg-primary-lime/10",
    borderColor: "border-primary-lime/20",
  },
  {
    id: 2,
    pillar: "PLAY",
    title: "Elevate Your Game",
    desc: "Join Uganda's thriving football community. Assemble your ultimate squad, challenge rival teams, and coordinate matches.",
    features: ["Team Management", "Match Matchmaking", "Real-Time Team Chat"],
    icon: Trophy,
    color: "text-[#F59E0B]",
    bgColor: "bg-[#F59E0B]/10",
    borderColor: "border-[#F59E0B]/20",
  },
];

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isOwner, loading } = useUser();
  const [currentSlide, setCurrentSlide] = useState(0);

  // If already logged in, redirect directly to home tab
  useEffect(() => {
    if (!loading && user) {
      if (isAdmin) {
        navigate("/admin/overview", { replace: true });
      } else if (isOwner) {
        navigate("/owner", { replace: true });
      } else {
        navigate("/home", { replace: true });
      }
    }
  }, [user, loading, isAdmin, isOwner, navigate]);

  const nextSlide = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      navigate("/auth");
    }
  };

  const activeSlide = SLIDES[currentSlide];
  const Icon = activeSlide.icon;

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col overflow-hidden bg-app-base text-text-primary selection:bg-primary-lime/30">
      {/* Visual Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary-lime/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Top Branding & Skip */}
      <div className="absolute top-0 left-0 right-0 z-30 p-4 sm:p-6 flex justify-between items-center safe-top max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2 animate-fadeIn">
          <Logo size={28} showText={true} className="!items-center !flex-row gap-2" />
        </div>
        <button
          onClick={() => navigate("/auth")}
          className="text-[10px] font-bold tracking-[0.2em] text-text-secondary hover:text-text-primary transition-colors py-2 px-4 rounded-full border border-border-subtle bg-surface-card hover:bg-surface-raised shadow-xs animate-fadeIn"
        >
          SKIP
        </button>
      </div>

      {/* Main Content Area */}
      <div className="relative z-20 flex flex-col flex-1 w-full max-w-xl mx-auto p-6 pb-8 pt-24 sm:pt-32 justify-center">
        
        {/* Abstract Icon/Graphic Container replacing Image */}
        <div className="w-full flex items-center justify-center mb-10 sm:mb-12 h-48 sm:h-64 relative">
          {SLIDES.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ease-in-out ${
                currentSlide === index ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
              }`}
            >
               <div className={`w-32 h-32 sm:w-40 sm:h-40 rounded-[2.5rem] ${slide.bgColor} ${slide.color} flex items-center justify-center shadow-lg shadow-${slide.color.replace('text-', '')}/10 border border-white/5`}>
                 <slide.icon size={64} strokeWidth={1.5} />
               </div>
            </div>
          ))}
        </div>

        {/* Slide Content */}
        <div className="flex-1 min-h-[220px]">
          {/* Pillar Badge */}
          <div className="overflow-hidden mb-5 h-7">
            <div
              key={`pillar-${currentSlide}`}
              className={`inline-flex items-center px-3 py-1 ${activeSlide.bgColor} ${activeSlide.color} border ${activeSlide.borderColor} rounded-full text-[10px] font-black uppercase tracking-[0.2em] animate-slideUp shadow-sm`}
            >
              {activeSlide.pillar}
            </div>
          </div>
          
          {/* Title */}
          <h1
            key={`title-${currentSlide}`}
            className="text-3xl sm:text-[40px] font-black text-text-primary leading-[1.1] tracking-tight mb-4 animate-slideUp font-display"
          >
            {activeSlide.title}
          </h1>
          
          {/* Description */}
          <p
            key={`desc-${currentSlide}`}
            className="text-text-secondary text-[15px] sm:text-base font-medium leading-relaxed mb-8 animate-slideUp delay-75 max-w-md"
          >
            {activeSlide.desc}
          </p>
          
          {/* Features List */}
          <div className="space-y-4 mb-10">
            {activeSlide.features.map((feature, i) => (
              <div
                key={`${currentSlide}-feat-${i}`}
                className="flex items-center gap-3.5 animate-slideUp"
                style={{ animationDelay: `${150 + i * 50}ms` }}
              >
                <div className="w-5 h-5 rounded-full bg-primary-lime/10 text-primary-lime flex items-center justify-center shrink-0">
                  <CheckCircle2 size={13} strokeWidth={3} />
                </div>
                <span className="text-[14px] sm:text-[15px] font-semibold text-text-secondary">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Interaction Bar */}
        <div className="flex flex-col gap-6 mt-8">
          {/* Indicators - Dot Style */}
          <div className="flex items-center gap-2.5">
            {SLIDES.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-500 overflow-hidden ${
                  currentSlide === index ? "w-8 bg-primary-lime shadow-[0_0_12px_rgba(34,197,94,0.4)]" : "w-2 bg-border-prominent"
                }`}
              />
            ))}
          </div>
          
          {/* Action Button */}
          <div className="flex items-center safe-bottom w-full">
            <button
              onClick={nextSlide}
              className="group w-full flex h-[56px] items-center justify-center gap-3 rounded-full px-6 text-[15px] font-black uppercase tracking-wide text-accent-text shadow-xl shadow-primary-lime/20 transition-all active:scale-[0.98] bg-primary-lime hover:bg-[#15803D] border border-[#16A34A] cursor-pointer"
            >
              <span>
                {currentSlide === SLIDES.length - 1
                  ? "Start Your Journey"
                  : "Continue"}
              </span>
              <ArrowRight size={20} strokeWidth={2.5} className="group-hover:translate-x-1.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-slideUp {
          animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out forwards;
        }
        .delay-75 {
          animation-delay: 75ms;
        }
      `}</style>
    </div>
  );
};
