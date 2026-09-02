import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  MapPin,
  Calendar,
  Trophy,
  ChevronRight,
  CheckCircle2,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Logo } from "../components/Logo";
import { Eyebrow } from "../components/ui/Eyebrow";
import { useNavigate } from "react-router-dom";
const SLIDES = [
  {
    id: 0,
    pillar: "DISCOVER",
    title: "The Pitch is Yours",
    desc: "Access a curated network of premium football turfs across the city. View high-res galleries, real-time availability, and detailed amenities for every venue.",
    features: [
      "Map-integrated search",
      "Verified turf listings",
      "Distance tracking",
    ],
    image:
      "https://images.unsplash.com/photo-1575361204480-aadea25d46b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    icon: MapPin,
    color: "emerald",
    accent: "bg-emerald-500",
  },
  {
    id: 1,
    pillar: "BOOK",
    title: "Seamless Reservations",
    desc: "Secure your slot in under 60 seconds. From individual bookings to team split-payments via Mobile Money, we've automated the logistics so you can focus on the game.",
    features: [
      "MoMo Split-Payment",
      "Instant QR Tickets",
      "Automated Reminders",
    ],
    image:
      "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    icon: ShieldCheck,
    color: "blue",
    accent: "bg-blue-600",
  },
  {
    id: 2,
    pillar: "PLAY",
    title: "Elevate Your Game",
    desc: "Join Uganda's thriving football community. Assemble your ultimate squad, challenge rival teams, and coordinate matches with built-in team chat.",
    features: ["Team Management", "Match Matchmaking", "Real-Time Team Chat"],
    image:
      "https://images.unsplash.com/photo-1551958219-acbc608c6377?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    icon: Trophy,
    color: "orange",
    accent: "bg-orange-500",
  },
];
export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);
  /* Preload images for smooth transitions */ useEffect(() => {
    SLIDES.forEach((slide) => {
      const img = new Image();
      img.src = slide.image;
    });
  }, []);
  const nextSlide = () => {
    if (currentSlide < SLIDES.length - 1) {
      setDirection(1);
      setCurrentSlide((prev) => prev + 1);
    } else {
      navigate("/auth");
    }
  };
  const activeSlide = SLIDES[currentSlide];
  const Icon = activeSlide.icon;
  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col overflow-hidden bg-[#fafafa] dark:bg-[#0e0f12] font-body text-text-primary">
      {/* Top Branding & Skip */}
      <div className="absolute top-0 left-0 right-0 z-30 p-4 flex justify-between items-center safe-top max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <Logo
            size={32}
            showText={true}
            className="!items-center !flex-row gap-2"
          />
        </div>
        <button
          onClick={() => navigate("/auth")}
          className="text-[10px] font-bold tracking-[0.2em] text-text-secondary hover:text-primary-lime transition-colors py-2 px-4 rounded-full border border-border-subtle bg-surface-card shadow-sm"
        >
          SKIP
        </button>
      </div>

      {/* Main Content Area */}
      <div className="relative z-20 flex flex-col flex-1 w-full max-w-xl mx-auto p-4 pb-12 pt-24 sm:pt-32">
        {/* Image Container */}
        <div className="relative w-full aspect-square sm:aspect-video rounded-[16px] overflow-hidden shadow-lg shadow-slate-200/50 dark:shadow-black/50 border border-border-subtle mb-8 bg-surface-card">
          {SLIDES.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${currentSlide === index ? "opacity-100" : "opacity-0"}`}
            >
              <img
                src={slide.image}
                alt=""
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            </div>
          ))}
        </div>

        {/* Slide Content */}
        <div className="flex-1">
          {/* Pillar Badge */}
          <div className="overflow-hidden mb-4 h-6">
            <div
              key={`pillar-${currentSlide}`}
              className="inline-block px-3 py-1 bg-amber-50 dark:bg-primary-lime/10 text-amber-600 dark:text-primary-lime rounded-full text-[10px] font-black uppercase tracking-widest animate-slideUp"
            >
              {activeSlide.pillar}
            </div>
          </div>
          
          {/* Title */}
          <h1
            key={`title-${currentSlide}`}
            className="text-3xl sm:text-4xl font-black text-text-primary leading-[1.15] mb-4 animate-slideUp"
          >
            {activeSlide.title}
          </h1>
          
          {/* Description */}
          <p
            key={`desc-${currentSlide}`}
            className="text-text-secondary text-[15px] font-medium leading-relaxed mb-8 animate-slideUp delay-75"
          >
            {activeSlide.desc}
          </p>
          
          {/* Features List */}
          <div className="space-y-3 mb-10">
            {activeSlide.features.map((feature, i) => (
              <div
                key={`${currentSlide}-feat-${i}`}
                className="flex items-center gap-3 animate-slideUp"
                style={{ animationDelay: `${150 + i * 50}ms` }}
              >
                <div className="p-1 rounded-full bg-amber-50 dark:bg-primary-lime/10 text-primary-lime border border-amber-100 dark:border-primary-lime/20">
                  <CheckCircle2 size={16} strokeWidth={3} />
                </div>
                <span className="text-[14px] font-bold text-text-secondary">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Interaction Bar */}
        <div className="flex flex-col gap-4 mt-auto">
          {/* Indicators - Progress Bar Style */}
          <div className="flex items-center justify-center gap-2">
            {SLIDES.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all duration-500 overflow-hidden ${currentSlide === index ? "w-8 bg-amber-100 dark:bg-amber-900/40" : "w-4 bg-surface-raised"}`}
              >
                {currentSlide === index && (
                  <div className="h-full bg-primary-lime animate-progressWidth" />
                )}
              </div>
            ))}
          </div>
          
          {/* Action Button */}
          <div className="flex items-center gap-4 safe-bottom">
            <button
              onClick={nextSlide}
              className="group flex-1 flex h-14 items-center justify-center gap-3 rounded-full px-4 text-[15px] font-bold text-accent-text shadow-md shadow-primary-lime/20 transition-all active:scale-[0.98] bg-primary-lime hover:bg-[#96E600]"
            >
              <span>
                {currentSlide === SLIDES.length - 1
                  ? "Start Your Journey"
                  : "Continue"}
              </span>
              <ArrowRight size={20} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
      <style>{` @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } } @keyframes progressWidth { from { width: 0%; } to { width: 100%; } } .animate-slideUp { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; } .animate-progressWidth { animation: progressWidth 0.6s ease-out forwards; } .delay-75 { animation-delay: 75ms; } `}</style>
    </div>
  );
};
