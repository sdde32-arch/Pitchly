import React, { useState, useEffect } from "react";
import {
  MapPin,
  Trophy,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  CalendarDays,
  Clock,
  Smartphone,
  Users,
  Star,
  Sparkles,
  Zap,
  QrCode,
  Check,
  Compass
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
  accentColor: string;
  accentBg: string;
  accentBorder: string;
}

const SLIDES: SlideData[] = [
  {
    id: 0,
    pillar: "DISCOVER",
    badgeText: "Kampala Turf Radar",
    title: "The Pitch is Yours",
    subtitle: "Find & explore verified synthetic football pitches in real-time.",
    desc: "Access a curated network of premium football turfs across Kampala. Check live slot availability, surface specifications, and venue amenities before booking.",
    features: [
      { label: "Map-integrated search", detail: "Browse pitches across Lugogo, Kololo, Naguru & beyond" },
      { label: "Verified turf listings", detail: "FIFA Synthetic AstroTurf & natural grass with night floodlights" },
      { label: "Real-time slot availability", detail: "Instant view of open, held, and peak match hours" },
    ],
    icon: MapPin,
    accentColor: "text-[#38BDF8]",
    accentBg: "bg-[#38BDF8]/10",
    accentBorder: "border-[#38BDF8]/30",
  },
  {
    id: 1,
    pillar: "BOOK",
    badgeText: "Instant MoMo Checkout",
    title: "Seamless Reservations",
    subtitle: "Zero wait times, 10-minute slot lock & automated Mobile Money.",
    desc: "Lock your desired match slot with anti-double-booking technology. Pay seamlessly via MTN MoMo (*165#) or Airtel Money (*185#), or split the fee with your squad.",
    features: [
      { label: "10-Minute Anti-Double-Booking", detail: "Cloud slot lock prevents walk-ins while you check out" },
      { label: "MTN & Airtel MoMo Split", detail: "Split turf fees directly among teammates with zero hassle" },
      { label: "Digital QR Match Pass", detail: "Instant offline-ready ticket with pass download and calendar sync" },
    ],
    icon: CalendarDays,
    accentColor: "text-primary-lime",
    accentBg: "bg-primary-lime/10",
    accentBorder: "border-primary-lime/30",
  },
  {
    id: 2,
    pillar: "PLAY",
    badgeText: "Squad Community",
    title: "Elevate Your Game",
    subtitle: "Assemble your squad, track match records & challenge local rivals.",
    desc: "Join Kampala's most active football network. Manage your team roster, coordinate lineups via live team chat, and rate MVPs after every match.",
    features: [
      { label: "Squad & Roster Hub", detail: "Invite teammates, set positions, and track squad win/loss record" },
      { label: "Rival Team Matchmaking", detail: "Find open 5-a-side, 7-a-side, or 11-a-side matches to challenge" },
      { label: "Post-Match Player Ratings", detail: "Vote for match MVPs, fair play awards, and venue reviews" },
    ],
    icon: Trophy,
    accentColor: "text-[#F59E0B]",
    accentBg: "bg-[#F59E0B]/10",
    accentBorder: "border-[#F59E0B]/30",
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
    <div className="relative min-h-[100dvh] w-full flex flex-col bg-app-base text-text-primary selection:bg-primary-lime/30 overflow-x-hidden">
      {/* Visual Ambient Glows */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-primary-lime/[0.04] rounded-full blur-[140px] pointer-events-none -mr-32 -mt-32" />
      <div className="absolute bottom-0 left-0 w-[550px] h-[550px] bg-[#38BDF8]/[0.04] rounded-full blur-[140px] pointer-events-none -ml-32 -mb-32" />

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
                  onClick={() => setCurrentSlide(index)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? "bg-primary-lime text-accent-text shadow-sm shadow-primary-lime/20 font-extrabold"
                      : isPast
                      ? "text-text-primary hover:bg-surface-raised"
                      : "text-text-tertiary hover:text-text-secondary"
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                    isActive ? "bg-accent-text/20 text-accent-text font-black" : "bg-surface-raised text-text-secondary"
                  }`}>
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
              onClick={() => navigate("/auth")}
              className="text-xs font-bold text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-lg hover:bg-surface-card transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate("/auth")}
              className="text-[11px] font-extrabold tracking-wider text-text-primary hover:text-primary-lime transition-all py-1.5 px-3.5 rounded-full border border-border-subtle bg-surface-card hover:bg-surface-raised shadow-xs uppercase cursor-pointer"
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
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${activeSlide.accentBg} ${activeSlide.accentColor} border ${activeSlide.accentBorder}`}>
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

            {/* Feature Highlights Bento Rows */}
            <div className="space-y-2.5 pt-1">
              {activeSlide.features.map((feature, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 sm:p-3.5 rounded-xl bg-surface-card/70 border border-border-subtle hover:border-border-prominent transition-all"
                >
                  <div className="w-6 h-6 rounded-lg bg-primary-lime/10 text-primary-lime flex items-center justify-center shrink-0 mt-0.5">
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
              <div className="flex items-center gap-2">
                {SLIDES.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    aria-label={`Go to slide ${index + 1}`}
                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      currentSlide === index
                        ? "w-10 bg-primary-lime shadow-[0_0_12px_rgba(34,197,94,0.4)]"
                        : "w-2 bg-border-prominent hover:bg-text-tertiary"
                    }`}
                  />
                ))}
              </div>

              {/* Action Buttons Row */}
              <div className="flex items-center gap-3 pt-1">
                {currentSlide > 0 && (
                  <button
                    onClick={prevSlide}
                    className="px-4 py-3.5 sm:py-4 rounded-xl border border-border-subtle bg-surface-card hover:bg-surface-raised text-text-primary text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  >
                    <ArrowLeft size={16} />
                    <span className="hidden sm:inline">Previous</span>
                  </button>
                )}

                <button
                  id="btn-onboarding-continue"
                  onClick={nextSlide}
                  className="flex-1 px-6 py-3.5 sm:py-4 rounded-xl bg-primary-lime hover:bg-[#96E600] text-accent-text text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-primary-lime/25 transition-all active:scale-95 cursor-pointer"
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
              <div className="flex items-center justify-between text-xs text-text-tertiary pt-1 px-1">
                <span>Already have a squad? <button onClick={() => navigate("/auth")} className="text-text-primary font-bold hover:underline cursor-pointer">Sign in</button></span>
                <button
                  onClick={() => navigate("/owner")}
                  className="text-primary-lime hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>Venue Owner Portal</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Interactive Visual Feature Preview Showcase (6 cols) */}
          <div className="lg:col-span-6 xl:col-span-6 flex items-center justify-center">
            <div className="w-full max-w-md lg:max-w-none relative">
              
              {/* Background ambient framing glow */}
              <div className="absolute inset-0 bg-gradient-to-tr from-primary-lime/10 to-[#38BDF8]/10 rounded-3xl blur-2xl transform scale-95 pointer-events-none" />

              {/* Showcase Container */}
              <div className="relative z-10 bg-surface-card rounded-3xl border border-border-subtle p-5 sm:p-7 shadow-2xl space-y-5">
                
                {/* SLIDE 0 SHOWCASE: Real-Time Turf Radar */}
                {currentSlide === 0 && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between pb-1 border-b border-border-subtle/80">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E] animate-pulse" />
                        <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                          Live Turf Radar · Kampala
                        </span>
                      </div>
                      <span className="text-xs font-bold text-primary-lime bg-primary-lime/10 px-2 py-0.5 rounded-md">
                        1.2 km away
                      </span>
                    </div>

                    {/* Preview Turf Banner */}
                    <div className="relative rounded-2xl overflow-hidden aspect-video bg-surface-raised border border-border-subtle group">
                      <img
                        src="https://images.unsplash.com/photo-1529900241451-b8f416550794?auto=format&fit=crop&q=80"
                        alt="Kigozi Sports Arena"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-black/60 backdrop-blur-md text-white border border-white/10">
                        <ShieldCheck size={12} className="text-primary-lime" />
                        <span>FIFA Synthetic Turf</span>
                      </div>
                      <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-yellow-400/90 text-black">
                        <Star size={11} className="fill-black" />
                        <span>4.9 (128)</span>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3">
                        <h4 className="text-base font-extrabold text-white">Kigozi Sports Arena - Pitch 1</h4>
                        <p className="text-xs text-white/80 flex items-center gap-1 mt-0.5">
                          <MapPin size={11} className="text-primary-lime" />
                          <span>Lugogo Bypass, Near UMA Showgrounds</span>
                        </p>
                      </div>
                    </div>

                    {/* Live Slot Chips */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-text-secondary">Today's Evening Slots</span>
                        <span className="font-extrabold text-primary-lime">UGX 120,000 / hr</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-2 rounded-xl bg-primary-lime/10 border border-primary-lime/40 text-center">
                          <p className="text-[11px] font-extrabold text-primary-lime">18:00 - 19:00</p>
                          <span className="text-[9px] font-bold text-primary-lime/80 uppercase">Available</span>
                        </div>
                        <div className="p-2 rounded-xl bg-surface-raised border border-border-subtle text-center opacity-60">
                          <p className="text-[11px] font-bold text-text-tertiary line-through">19:00 - 20:00</p>
                          <span className="text-[9px] font-bold text-red-400 uppercase">Held</span>
                        </div>
                        <div className="p-2 rounded-xl bg-primary-lime/10 border border-primary-lime/40 text-center">
                          <p className="text-[11px] font-extrabold text-primary-lime">20:00 - 21:00</p>
                          <span className="text-[9px] font-bold text-primary-lime/80 uppercase">Available</span>
                        </div>
                      </div>
                    </div>

                    {/* Amenities Row */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {["Floodlights", "Showers", "Secure Parking", "Cafeteria"].map((amenity) => (
                        <span key={amenity} className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-surface-raised border border-border-subtle text-text-secondary">
                          ✓ {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* SLIDE 1 SHOWCASE: MoMo Slot Hold & QR Match Pass */}
                {currentSlide === 1 && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between pb-1 border-b border-border-subtle/80">
                      <div className="flex items-center gap-2">
                        <Clock size={15} className="text-primary-lime animate-spin" />
                        <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                          10-Min Anti-Double Booking Lock
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-primary-lime/10 text-primary-lime border border-primary-lime/30 font-mono">
                        09:42 remaining
                      </span>
                    </div>

                    {/* Match Reservation Box */}
                    <div className="p-4 rounded-2xl bg-surface-raised border border-border-subtle space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-text-tertiary">Selected Match Window</p>
                          <h4 className="text-sm font-extrabold text-text-primary">Today · 19:00 - 20:00</h4>
                        </div>
                        <span className="px-2.5 py-1 rounded-md text-xs font-black bg-primary-lime text-accent-text">
                          UGX 120k
                        </span>
                      </div>

                      {/* Split-Payment Meter */}
                      <div className="space-y-1.5 pt-1 border-t border-border-subtle">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-text-secondary flex items-center gap-1.5">
                            <Users size={13} className="text-primary-lime" />
                            <span>Squad Split (10 Players)</span>
                          </span>
                          <span className="font-extrabold text-text-primary">UGX 12,000 / player</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-surface-card overflow-hidden">
                          <div className="h-full bg-primary-lime rounded-full w-4/5" />
                        </div>
                        <p className="text-[10px] text-text-tertiary">8 of 10 squad teammates have paid via MoMo</p>
                      </div>
                    </div>

                    {/* MoMo Provider Badges */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-xl bg-surface-raised border border-border-subtle flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#FACC15] text-black font-black text-[10px] flex items-center justify-center">
                          MTN
                        </div>
                        <div>
                          <p className="text-xs font-bold text-text-primary">MTN MoMo</p>
                          <p className="text-[10px] text-text-tertiary">*165# Instant</p>
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-surface-raised border border-border-subtle flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#EF4444] text-white font-black text-[10px] flex items-center justify-center">
                          AIR
                        </div>
                        <div>
                          <p className="text-xs font-bold text-text-primary">Airtel Money</p>
                          <p className="text-[10px] text-text-tertiary">*185# Zero fee</p>
                        </div>
                      </div>
                    </div>

                    {/* QR Pass Snippet */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-primary-lime/10 border border-primary-lime/20 text-primary-lime">
                      <QrCode size={24} className="shrink-0" />
                      <div className="text-xs">
                        <p className="font-bold">Instant Digital Gate Pass</p>
                        <p className="text-[11px] opacity-80">QR scan at pitch entry with Apple Wallet & PDF download.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* SLIDE 2 SHOWCASE: Squad Matchmaking & Community */}
                {currentSlide === 2 && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between pb-1 border-b border-border-subtle/80">
                      <div className="flex items-center gap-2">
                        <Trophy size={15} className="text-[#F59E0B]" />
                        <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                          Kampala Turf Matchday
                        </span>
                      </div>
                      <span className="text-[11px] font-extrabold text-[#F59E0B] bg-[#F59E0B]/10 px-2 py-0.5 rounded-md">
                        7-a-side Match
                      </span>
                    </div>

                    {/* Head to Head Fixture Card */}
                    <div className="p-4 rounded-2xl bg-surface-raised border border-border-subtle">
                      <div className="flex items-center justify-between gap-4">
                        <div className="text-center flex-1">
                          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#38BDF8]/20 border border-[#38BDF8]/40 flex items-center justify-center text-[#38BDF8] font-black text-sm mb-1.5 shadow-sm">
                            LS
                          </div>
                          <p className="text-xs font-extrabold text-text-primary truncate">Lugogo Strikers</p>
                          <span className="text-[10px] text-text-tertiary font-bold">4-1-1 (1st)</span>
                        </div>

                        <div className="text-center shrink-0">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-primary-lime/20 text-primary-lime uppercase">
                            VS
                          </span>
                          <p className="text-[10px] text-text-tertiary mt-1 font-mono">19:30 KO</p>
                        </div>

                        <div className="text-center flex-1">
                          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#F59E0B]/20 border border-[#F59E0B]/40 flex items-center justify-center text-[#F59E0B] font-black text-sm mb-1.5 shadow-sm">
                            NG
                          </div>
                          <p className="text-xs font-extrabold text-text-primary truncate">Ntinda Gunners</p>
                          <span className="text-[10px] text-text-tertiary font-bold">3-2-1 (3rd)</span>
                        </div>
                      </div>
                    </div>

                    {/* Team Chat Simulation Bubble */}
                    <div className="p-3 rounded-xl bg-surface-raised/70 border border-border-subtle space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-extrabold text-text-primary">Squad Chat · Lugogo Strikers</span>
                        <span className="text-text-tertiary">Just now</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-surface-card border border-border-subtle text-xs text-text-secondary">
                        <span className="font-bold text-primary-lime mr-1">Captain Brian:</span>
                        "Warm-up starts at 18:30 guys. Wear the neon green kits tonight! ⚽"
                      </div>
                    </div>

                    {/* Post-Match Ratings */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-raised border border-border-subtle text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#F59E0B]/20 text-[#F59E0B] flex items-center justify-center">
                          <Star size={14} className="fill-[#F59E0B]" />
                        </div>
                        <div>
                          <p className="font-bold text-text-primary">Match MVP Voting</p>
                          <p className="text-[10px] text-text-tertiary">Community ratings after final whistle</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-primary-lime">Active</span>
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
      `}</style>
    </div>
  );
};

