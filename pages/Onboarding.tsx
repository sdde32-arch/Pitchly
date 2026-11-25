import React, { useState, useEffect } from "react";
import {
  MapPin,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  CalendarDays,
  Clock,
  QrCode,
  Check,
} from "lucide-react";
import { Logo } from "../components/Logo";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

interface SlideData {
  id: number;
  pillar: string;
  badgeText: string;
  title: string;
  subtitle: string;
  desc: string;
  features: { label: string; detail: string }[];
  icon: React.ElementType;
}

const ALL_SLIDES: SlideData[] = [
  {
    id: 0,
    pillar: "DISCOVER",
    badgeText: "Kampala Pitches",
    title: "Find a pitch near you",
    subtitle: "See verified football pitches in Kampala and their open time slots.",
    desc: "Browse approved football pitches across Kampala, check live hourly availability, and compare amenities and prices in UGX before booking.",
    features: [
      {
        label: "Browse pitches by area",
        detail: "Filter across Kampala neighborhoods including Lugogo, Kololo, Bugolobi, Ntinda, and Munyonyo.",
      },
      {
        label: "See open and taken slots",
        detail: "Check which hourly slots are available, held, or already booked before picking a time.",
      },
      {
        label: "Check amenities and prices in UGX",
        detail: "Compare hourly rates in UGX alongside amenities like floodlights, showers, parking, and cafeteria.",
      },
    ],
    icon: MapPin,
  },
  {
    id: 1,
    pillar: "BOOK",
    badgeText: "Mobile Money Checkout",
    title: "Lock your slot",
    subtitle: "Pay a deposit by Mobile Money and show your Match Pass at the gate.",
    desc: "Choose a time and hold it while you pay. Pay a deposit or full amount by MTN MoMo or Airtel Money, or hold a slot and pay at the pitch (limits apply).",
    features: [
      {
        label: "Hold your slot while you pay",
        detail: "Choose a time and hold it while you complete checkout.",
      },
      {
        label: "Pay by MTN MoMo or Airtel Money",
        detail: "Dial *165# (MTN) or *185# (Airtel) and upload your payment proof or transaction reference.",
      },
      {
        label: "Match Pass in Bookings",
        detail: "Your Match Pass activates in Bookings once the owner confirms your payment.",
      },
    ],
    icon: CalendarDays,
  },
];

const SLIDES: SlideData[] = ALL_SLIDES;

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

  // Keyboard navigation for power users
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        nextSlide();
      } else if (e.key === "ArrowLeft") {
        prevSlide();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSlide]);

  const nextSlide = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      navigate("/auth");
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const activeSlide = SLIDES[currentSlide];
  const Icon = activeSlide.icon;

  return (
    <div
      className="fixed inset-0 h-full w-full flex flex-col bg-app-base text-text-primary selection:bg-primary-lime/30 overflow-y-auto overflow-x-hidden scroll-smooth"
      style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}
    >
      {/* Top Header Navigation */}
      <header className="relative z-30 w-full border-b border-border-subtle/60 bg-app-base/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo size={28} showText={true} className="!items-center !flex-row gap-2" />
          </div>

          {/* Stepper Tabs - Visible on sm: and up */}
          <nav className="hidden sm:flex items-center gap-1.5 p-1 bg-surface-card rounded-xl border border-border-subtle">
            {SLIDES.map((slide, index) => {
              const isActive = currentSlide === index;
              const isPast = currentSlide > index;
              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setCurrentSlide(index)}
                  className={`flex items-center gap-1.5 px-3 min-h-[44px] rounded-lg text-xs font-bold transition-all motion-reduce:transition-none cursor-pointer ${
                    isActive
                      ? "bg-cta-bg text-cta-text shadow-sm font-extrabold"
                      : isPast
                      ? "text-text-primary hover:bg-surface-raised"
                      : "text-text-tertiary hover:text-text-secondary"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                      isActive
                        ? "bg-cta-text/20 text-cta-text font-black"
                        : "bg-surface-raised text-text-secondary"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span>{slide.pillar}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action: Skip & Quick Login */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => navigate("/auth")}
              className="text-xs font-bold text-text-secondary hover:text-text-primary px-3 min-h-[44px] rounded-lg hover:bg-surface-card transition-colors motion-reduce:transition-none cursor-pointer"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => navigate("/auth")}
              className="text-[11px] font-extrabold tracking-wider text-text-primary hover:text-primary-lime transition-all motion-reduce:transition-none px-4 min-h-[44px] rounded-full border border-border-subtle bg-surface-card hover:bg-surface-raised shadow-xs uppercase cursor-pointer"
            >
              Skip Tour
            </button>
          </div>
        </div>
      </header>

      {/* Main Responsive Body */}
      <main className="relative z-20 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10">
        <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          {/* LEFT COLUMN: Narrative & Interaction Controls (6 cols) */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col justify-center space-y-6 sm:space-y-7">
            {/* Pillar Badge & Slide Counter */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-nav-bg text-nav-active-text border border-nav-border">
                  <Icon size={14} strokeWidth={2.5} />
                  <span>{activeSlide.pillar}</span>
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-surface-raised text-text-secondary border border-border-subtle">
                  {activeSlide.badgeText}
                </span>
              </div>
              <span className="text-xs font-bold text-text-tertiary">
                {currentSlide + 1} of {SLIDES.length}
              </span>
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-2.5">
              <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-black text-text-primary tracking-tight leading-[1.1] font-display">
                {activeSlide.title}
              </h1>
              <p className="text-base sm:text-lg font-bold text-text-primary/90 leading-snug">
                {activeSlide.subtitle}
              </p>
              <p className="text-sm sm:text-base text-text-secondary leading-relaxed pt-1">
                {activeSlide.desc}
              </p>
            </div>

            {/* Feature Highlights Rows */}
            <div className="space-y-2.5 pt-1">
              {activeSlide.features.map((feature, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 sm:p-3.5 rounded-xl bg-surface-card/70 border border-border-subtle hover:border-border-prominent transition-all motion-reduce:transition-none"
                >
                  <div className="w-6 h-6 rounded-lg bg-nav-bg text-nav-active-text border border-nav-border flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-text-primary">
                      {feature.label}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-text-secondary mt-0.5 leading-relaxed">
                      {feature.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Actions & Stepper Bar */}
            <div className="pt-2 space-y-4">
              {/* Stepper Progress Bar */}
              <div className="flex items-center gap-2" aria-label={`Slide ${currentSlide + 1} of ${SLIDES.length}`}>
                {SLIDES.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setCurrentSlide(index)}
                    aria-label={`Go to slide ${index + 1}`}
                    className="min-h-[44px] flex items-center cursor-pointer"
                  >
                    <span
                      className={`block h-2 rounded-full transition-all motion-reduce:transition-none duration-300 ${
                        currentSlide === index
                          ? "w-10 bg-cta-bg"
                          : "w-3 bg-border-prominent hover:bg-text-tertiary"
                      }`}
                    />
                  </button>
                ))}
              </div>

              {/* Action Buttons Row */}
              <div className="flex items-center gap-3 pt-1">
                {currentSlide > 0 && (
                  <button
                    type="button"
                    onClick={prevSlide}
                    className="px-4 min-h-[48px] py-3.5 sm:py-4 rounded-xl border border-border-subtle bg-surface-card hover:bg-surface-raised text-text-primary text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all motion-reduce:transition-none active:scale-95 motion-reduce:active:scale-100 cursor-pointer"
                  >
                    <ArrowLeft size={16} />
                    <span className="hidden sm:inline">Previous</span>
                  </button>
                )}

                <button
                  id="btn-onboarding-continue"
                  type="button"
                  onClick={nextSlide}
                  className="flex-1 px-6 min-h-[48px] py-3.5 sm:py-4 rounded-xl bg-cta-bg hover:bg-cta-bg-hover text-cta-text text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all motion-reduce:transition-none active:scale-95 motion-reduce:active:scale-100 cursor-pointer"
                >
                  <span>
                    {currentSlide === SLIDES.length - 1
                      ? "Start Booking Turfs"
                      : "Continue"}
                  </span>
                  <ArrowRight size={17} strokeWidth={2.5} />
                </button>
              </div>

              {/* Role Shortcut Footer */}
              <div className="flex items-center justify-between gap-2 text-xs text-text-tertiary pt-1 px-1">
                <span>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/auth")}
                    className="text-text-primary font-bold hover:underline min-h-[44px] inline-flex items-center cursor-pointer"
                  >
                    Sign in
                  </button>
                </span>
                <button
                  type="button"
                  onClick={() => navigate("/auth?role=owner", { state: { isOwner: true, role: "owner" } })}
                  className="text-primary-lime hover:underline font-bold inline-flex items-center gap-1 min-h-[44px] cursor-pointer"
                >
                  <span>Venue Owner Portal</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Feature Preview Showcase (6 cols) */}
          <div className="lg:col-span-6 xl:col-span-6 flex items-center justify-center">
            <div className="w-full max-w-md lg:max-w-none relative">
              {/* Showcase Container */}
              <div className="relative z-10 bg-surface-card rounded-3xl border border-border-subtle p-5 sm:p-7 shadow-2xl space-y-5">
                {/* SLIDE 0 SHOWCASE: Discover Verified Pitches */}
                {activeSlide.id === 0 && (
                  <div className="space-y-4 animate-fadeIn motion-reduce:animate-none">
                    <div className="flex items-center justify-between pb-1 border-b border-border-subtle/80">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-status-success" />
                        <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                          Verified Pitches · Kampala
                        </span>
                      </div>
                      <span className="text-xs font-bold bg-surface-raised text-text-secondary border border-border-subtle px-2 py-0.5 rounded-md">
                        Preview
                      </span>
                    </div>

                    {/* Preview Pitch Banner */}
                    <div className="relative rounded-2xl overflow-hidden aspect-video bg-surface-raised border border-border-subtle flex flex-col justify-between p-3.5">
                      <div className="flex items-center">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-nav-bg text-nav-text border border-nav-border">
                          <ShieldCheck size={12} className="text-nav-active-text" />
                          <span>Verified Pitch</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-center" aria-hidden="true">
                        <div className="w-12 h-12 rounded-2xl bg-surface-card border border-border-subtle flex items-center justify-center text-primary-lime shadow-sm">
                          <MapPin size={24} />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-base font-extrabold text-text-primary">Kampala Football Pitch</h4>
                        <p className="text-xs text-text-secondary flex items-center gap-1 mt-0.5">
                          <MapPin size={11} className="text-primary-lime" />
                          <span>Lugogo · Kololo · Bugolobi · Ntinda</span>
                        </p>
                      </div>
                    </div>

                    {/* Slot Availability Preview */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-text-secondary">Hourly Time Slots</span>
                        <span className="font-extrabold text-primary-lime">Prices in UGX / hr</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-2 rounded-xl bg-status-success-tint border border-status-success/30 text-center">
                          <p className="text-[11px] font-extrabold text-status-success">18:00 - 19:00</p>
                          <span className="text-[9px] font-bold text-status-success uppercase">Available</span>
                        </div>
                        <div className="p-2 rounded-xl bg-surface-raised border border-border-subtle text-center opacity-70">
                          <p className="text-[11px] font-bold text-text-tertiary line-through">19:00 - 20:00</p>
                          <span className="text-[9px] font-bold text-status-error uppercase">Booked</span>
                        </div>
                        <div className="p-2 rounded-xl bg-status-success-tint border border-status-success/30 text-center">
                          <p className="text-[11px] font-extrabold text-status-success">20:00 - 21:00</p>
                          <span className="text-[9px] font-bold text-status-success uppercase">Available</span>
                        </div>
                      </div>
                    </div>

                    {/* Amenities Row (matches Home.tsx AMENITIES_LIST) */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {["Floodlights", "Showers", "Secure Parking", "Cafeteria"].map((amenity) => (
                        <span
                          key={amenity}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-surface-raised border border-border-subtle text-text-secondary"
                        >
                          ✓ {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* SLIDE 1 SHOWCASE: Slot Hold, Mobile Money & Match Pass */}
                {activeSlide.id === 1 && (
                  <div className="space-y-4 animate-fadeIn motion-reduce:animate-none">
                    <div className="flex items-center justify-between pb-1 border-b border-border-subtle/80">
                      <div className="flex items-center gap-2">
                        <Clock size={15} className="text-primary-lime" />
                        <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                          Slot Hold Active
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-nav-bg text-nav-active-text border border-nav-border">
                        Held while you pay
                      </span>
                    </div>

                    {/* Reservation Box */}
                    <div className="p-4 rounded-2xl bg-surface-raised border border-border-subtle space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-xs text-text-tertiary">Selected Time Slot</p>
                          <h4 className="text-sm font-extrabold text-text-primary">19:00 - 20:00</h4>
                        </div>
                        <span className="px-2.5 py-1 rounded-md text-xs font-black bg-cta-bg text-cta-text">
                          Deposit or Full · UGX
                        </span>
                      </div>
                      <p className="text-[11px] text-text-secondary leading-relaxed">
                        Send your deposit via Mobile Money and upload your confirmation screenshot or transaction reference.
                      </p>
                    </div>

                    {/* MoMo Provider Badges */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-xl bg-surface-raised border border-border-subtle flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-status-warning text-accent-text font-black text-[10px] flex items-center justify-center shrink-0">
                          MTN
                        </div>
                        <div>
                          <p className="text-xs font-bold text-text-primary">MTN MoMo</p>
                          <p className="text-[10px] text-text-tertiary">Dial *165#</p>
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-surface-raised border border-border-subtle flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-status-error text-accent-text font-black text-[10px] flex items-center justify-center shrink-0">
                          AIR
                        </div>
                        <div>
                          <p className="text-xs font-bold text-text-primary">Airtel Money</p>
                          <p className="text-[10px] text-text-tertiary">Dial *185#</p>
                        </div>
                      </div>
                    </div>

                    {/* Match Pass Snippet */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-nav-bg border border-nav-border text-nav-text">
                      <QrCode size={24} className="shrink-0 text-nav-active-text" />
                      <div className="text-xs">
                        <p className="font-bold text-nav-active-text">Official Match Pass</p>
                        <p className="text-[11px] text-nav-text-muted">
                          Activates in Bookings once the owner confirms your payment.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-fadeIn {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};
