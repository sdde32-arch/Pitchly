import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  useInteractiveWalkthrough,
  WalkthroughStepDetail,
  WalkthroughCategory,
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
  Search,
  MapPin,
  Clock,
  CreditCard,
  QrCode,
  Users,
  Trophy,
  Building2,
  Smartphone,
  Check,
  ExternalLink,
  Layers,
  HelpCircle,
  Play,
  RotateCcw,
  Sliders,
  Bell,
  Sun,
  Moon,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

/* -------------------------------------------------------------------------- */
/* INTERACTIVE SIMULATOR WIDGETS                                              */
/* -------------------------------------------------------------------------- */

const FlowOverviewWidget: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const flow = [
    { label: "1. Radar Search", desc: "Find pitches by GPS distance & format" },
    { label: "2. 10-Min Hold", desc: "Tap slot to freeze it exclusively in cloud" },
    { label: "3. MoMo Pay", desc: "Instant MTN/Airtel checkout with zero fees" },
    { label: "4. Digital Pass", desc: "Get offline-ready turnstile QR ticket" },
    { label: "5. Play & Vote", desc: "Scan at gate & vote for Man of the Match" },
  ];

  return (
    <div className="bg-surface-base p-3.5 rounded-2xl border border-border-subtle space-y-3 text-left">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-black uppercase tracking-wider text-primary-lime flex items-center gap-1.5">
          <Play size={12} className="fill-primary-lime" /> Interactive Life-Cycle
        </span>
        <span className="text-[10px] text-text-tertiary font-semibold">Tap step to inspect</span>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {flow.map((f, i) => (
          <button
            key={f.label}
            onClick={() => setActiveStep(i)}
            className={`p-2 rounded-xl text-left transition-all cursor-pointer ${
              activeStep === i
                ? "bg-primary-lime text-accent-text font-bold shadow-sm"
                : "bg-surface-card hover:bg-surface-raised border border-border-subtle text-text-secondary"
            }`}
          >
            <p className="text-[11px] font-black leading-tight line-clamp-1">{f.label}</p>
          </button>
        ))}
      </div>
      <div className="p-2.5 rounded-xl bg-surface-card border border-border-subtle flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-bold text-text-primary">{flow[activeStep].label}</p>
          <p className="text-[11.5px] text-text-secondary mt-0.5">{flow[activeStep].desc}</p>
        </div>
        <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-md bg-primary-lime/10 text-primary-lime shrink-0">
          Stage {activeStep + 1} of 5
        </span>
      </div>
    </div>
  );
};

const DistanceRadarWidget: React.FC = () => {
  const [anchor, setAnchor] = useState<"Lugogo" | "Kololo" | "Naguru" | "Munyonyo" | "Ntinda">("Lugogo");

  const venues = {
    Lugogo: { distance: "0.8 km", time: "3 min drive", bestPitch: "Kampala Arena Turf" },
    Kololo: { distance: "2.4 km", time: "7 min drive", bestPitch: "Tal Olympic 7s" },
    Naguru: { distance: "3.1 km", time: "9 min drive", bestPitch: "Champions Grounds" },
    Munyonyo: { distance: "7.8 km", time: "16 min drive", bestPitch: "Lakeside Arena" },
    Ntinda: { distance: "4.2 km", time: "11 min drive", bestPitch: "Kigozi Turf Ground" },
  };

  return (
    <div className="bg-surface-base p-3.5 rounded-2xl border border-border-subtle space-y-3 text-left">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-black uppercase tracking-wider text-primary-lime flex items-center gap-1.5">
          <MapPin size={12} /> Test Neighborhood Proximity
        </span>
        <span className="text-[10.5px] text-text-tertiary">Real Kampala GPS</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {(["Lugogo", "Kololo", "Naguru", "Munyonyo", "Ntinda"] as const).map(loc => (
          <button
            key={loc}
            onClick={() => setAnchor(loc)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              anchor === loc
                ? "bg-primary-lime text-accent-text shadow-xs"
                : "bg-surface-card border border-border-subtle text-text-secondary hover:text-text-primary"
            }`}
          >
            {loc}
          </button>
        ))}
      </div>
      <div className="bg-surface-card p-3 rounded-xl border border-border-subtle flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-text-primary">{venues[anchor].bestPitch}</p>
          <p className="text-[11.5px] text-text-secondary font-medium">
            From {anchor} • <strong className="text-primary-lime">{venues[anchor].distance}</strong> ({venues[anchor].time})
          </p>
        </div>
        <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10.5px] font-bold border border-emerald-500/20">
          Fast Route
        </span>
      </div>
    </div>
  );
};

const SlotLockWidget: React.FC = () => {
  const [selectedSlot, setSelectedSlot] = useState<string>("18:00 - 19:00");
  const [timeLeft, setTimeLeft] = useState(592); // seconds (e.g. ~9:52)

  const slots = [
    { time: "16:00 - 17:00", status: "booked" },
    { time: "17:00 - 18:00", status: "available" },
    { time: "18:00 - 19:00", status: "selected" },
    { time: "19:00 - 20:00", status: "available" },
    { time: "20:00 - 21:00", status: "held" },
  ];

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="bg-surface-base p-3.5 rounded-2xl border border-border-subtle space-y-3 text-left">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-black uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
          <Clock size={12} /> Anti-Double Booking Simulator
        </span>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30 text-[10.5px] font-mono font-bold">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span>Hold: {formatTimer(timeLeft)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {slots.map(s => {
          const isSelected = selectedSlot === s.time;
          return (
            <button
              key={s.time}
              onClick={() => {
                if (s.status !== "booked") setSelectedSlot(s.time);
              }}
              disabled={s.status === "booked"}
              className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                isSelected
                  ? "bg-primary-lime/15 border-primary-lime text-text-primary ring-1 ring-primary-lime"
                  : s.status === "booked"
                  ? "bg-surface-card/40 border-border-subtle text-text-tertiary opacity-50 cursor-not-allowed"
                  : s.status === "held"
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
                  : "bg-surface-card border-border-subtle text-text-secondary hover:border-text-tertiary"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] font-bold">{s.time}</span>
                {isSelected && <Check size={12} className="text-primary-lime" />}
              </div>
              <span className="text-[10px] font-medium block mt-0.5">
                {isSelected ? "Locked by You" : s.status === "booked" ? "Occupied" : s.status === "held" ? "Hold in Cloud" : "Available"}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-text-secondary leading-relaxed bg-surface-card p-2.5 rounded-xl border border-border-subtle">
        🔒 <strong>Cloud Guarantee:</strong> While this timer runs, no other user anywhere can book or snipe your slot.
      </p>
    </div>
  );
};

const MomoCheckoutWidget: React.FC = () => {
  const [provider, setProvider] = useState<"MTN" | "Airtel">("MTN");

  return (
    <div className="bg-surface-base p-3.5 rounded-2xl border border-border-subtle space-y-3 text-left">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-black uppercase tracking-wider text-primary-lime flex items-center gap-1.5">
          <CreditCard size={12} /> Mobile Money Simulator
        </span>
        <span className="text-[10.5px] font-bold text-text-tertiary">Zero Extra Fees</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setProvider("MTN")}
          className={`p-2.5 rounded-xl border transition-all cursor-pointer text-left ${
            provider === "MTN"
              ? "bg-[#FFCC00]/10 border-[#FFCC00] text-text-primary ring-1 ring-[#FFCC00]"
              : "bg-surface-card border-border-subtle text-text-secondary"
          }`}
        >
          <p className="text-xs font-black text-[#E5A800]">MTN MoMo</p>
          <p className="text-[10.5px] text-text-secondary mt-0.5">*165# USSD Push</p>
        </button>
        <button
          onClick={() => setProvider("Airtel")}
          className={`p-2.5 rounded-xl border transition-all cursor-pointer text-left ${
            provider === "Airtel"
              ? "bg-[#FF0000]/10 border-[#FF0000] text-text-primary ring-1 ring-[#FF0000]"
              : "bg-surface-card border-border-subtle text-text-secondary"
          }`}
        >
          <p className="text-xs font-black text-[#E60000]">Airtel Money</p>
          <p className="text-[10.5px] text-text-secondary mt-0.5">*185# USSD Push</p>
        </button>
      </div>
      <div className="p-2.5 rounded-xl bg-surface-card border border-border-subtle flex items-center justify-between text-xs">
        <div>
          <span className="text-text-secondary font-medium">Turf Rate (1 Hour):</span>
          <p className="font-bold text-text-primary">UGX 80,000</p>
        </div>
        <div className="text-right">
          <span className="text-text-secondary font-medium">Prompt Phone:</span>
          <p className="font-mono font-bold text-primary-lime">+256 700 ••• •••</p>
        </div>
      </div>
    </div>
  );
};

const QrPassWidget: React.FC = () => {
  return (
    <div className="bg-surface-base p-3.5 rounded-2xl border border-border-subtle space-y-3 text-left">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-black uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
          <QrCode size={12} /> Digital QR Turnstile Pass
        </span>
        <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          Offline Ready
        </span>
      </div>
      <div className="bg-surface-card p-3 rounded-xl border border-border-subtle flex items-center gap-3.5">
        <div className="w-16 h-16 bg-white p-1 rounded-xl flex items-center justify-center shrink-0 shadow-xs">
          <QrCode size={48} className="text-black" />
        </div>
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-xs font-bold text-text-primary truncate">Kampala Arena Turf (Pitch A)</p>
          <p className="text-[11px] text-text-secondary font-medium">Friday • 18:00 - 19:00</p>
          <p className="text-[10px] font-mono text-text-tertiary">PASS #FTL-2026-9812</p>
        </div>
      </div>
      <p className="text-[11px] text-text-secondary">
        Gate marshals scan this pass in &lt; 1 second. Works even if your mobile data disconnects.
      </p>
    </div>
  );
};

const MotmVotingWidget: React.FC = () => {
  const [votes, setVotes] = useState<{ [name: string]: number }>({
    "Brian Mukasa": 8,
    "Kato Paul": 14,
    "David Okello": 5,
  });
  const [myVote, setMyVote] = useState<string | null>("Kato Paul");

  const total = Object.values(votes).reduce((a, b) => a + b, 0);

  const handleVote = (name: string) => {
    if (myVote === name) return;
    setVotes(prev => {
      const next = { ...prev };
      if (myVote && next[myVote]) next[myVote] -= 1;
      next[name] = (next[name] || 0) + 1;
      return next;
    });
    setMyVote(name);
  };

  return (
    <div className="bg-surface-base p-3.5 rounded-2xl border border-border-subtle space-y-3 text-left">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-black uppercase tracking-wider text-primary-lime flex items-center gap-1.5">
          <Trophy size={12} /> Interactive MVP Voting
        </span>
        <span className="text-[10.5px] font-semibold text-text-tertiary">{total} Total Votes</span>
      </div>
      <div className="space-y-1.5">
        {Object.entries(votes).map(([name, count]) => {
          const pct = Math.round((count / total) * 100);
          const isVoted = myVote === name;
          return (
            <button
              key={name}
              onClick={() => handleVote(name)}
              className={`w-full p-2 rounded-xl text-left border transition-all cursor-pointer relative overflow-hidden ${
                isVoted
                  ? "bg-primary-lime/10 border-primary-lime/50 text-text-primary"
                  : "bg-surface-card border-border-subtle text-text-secondary hover:border-text-tertiary"
              }`}
            >
              <div
                className="absolute inset-y-0 left-0 bg-primary-lime/15 pointer-events-none transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
              <div className="relative z-10 flex items-center justify-between text-xs">
                <span className="font-bold flex items-center gap-1.5">
                  {name} {isVoted && <Check size={12} className="text-primary-lime" />}
                </span>
                <span className="font-mono font-bold text-[11px] text-text-secondary">
                  {count} votes ({pct}%)
                </span>
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-[10.5px] text-text-tertiary">
        Tap any player above to simulate casting your official Man of the Match vote.
      </p>
    </div>
  );
};

const SplitBillingWidget: React.FC = () => {
  const [squadSize, setSquadSize] = useState(10);
  const totalCost = 100000;
  const perPlayer = Math.round(totalCost / squadSize);

  return (
    <div className="bg-surface-base p-3.5 rounded-2xl border border-border-subtle space-y-3 text-left">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-black uppercase tracking-wider text-primary-lime flex items-center gap-1.5">
          <Users size={12} /> MoMo Squad Bill Split Calculator
        </span>
        <span className="text-[10.5px] font-bold text-text-tertiary">Zero Captain Burden</span>
      </div>
      <div className="flex items-center justify-between bg-surface-card p-3 rounded-xl border border-border-subtle">
        <div>
          <span className="text-[11px] text-text-secondary font-medium">Turf Match Fee:</span>
          <p className="text-sm font-black text-text-primary">UGX {totalCost.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <span className="text-[11px] text-text-secondary font-medium">Per Player Share:</span>
          <p className="text-sm font-black text-primary-lime">UGX {perPlayer.toLocaleString()}</p>
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-text-secondary">Squad Size:</span>
          <span className="font-bold text-text-primary">{squadSize} Players</span>
        </div>
        <input
          type="range"
          min={6}
          max={14}
          value={squadSize}
          onChange={e => setSquadSize(Number(e.target.value))}
          className="w-full accent-primary-lime cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-text-tertiary font-mono">
          <span>6 (3v3)</span>
          <span>10 (5v5)</span>
          <span>14 (7v7)</span>
        </div>
      </div>
    </div>
  );
};

const OwnerPortalWidget: React.FC = () => {
  const [isBlocked, setIsBlocked] = useState(false);

  return (
    <div className="bg-surface-base p-3.5 rounded-2xl border border-border-subtle space-y-3 text-left">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-black uppercase tracking-wider text-[#0284C7] flex items-center gap-1.5">
          <Building2 size={12} /> Venue Manager Simulator
        </span>
        <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-md bg-[#0284C7]/10 text-[#0284C7]">
          Pitch Owner Suite
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-surface-card p-2 rounded-xl border border-border-subtle text-center">
          <p className="text-[10px] text-text-secondary font-medium">Monthly Revenue</p>
          <p className="text-xs font-black text-text-primary mt-0.5">UGX 2.8M</p>
        </div>
        <div className="bg-surface-card p-2 rounded-xl border border-border-subtle text-center">
          <p className="text-[10px] text-text-secondary font-medium">Booked Hours</p>
          <p className="text-xs font-black text-text-primary mt-0.5">34 hrs</p>
        </div>
        <div className="bg-surface-card p-2 rounded-xl border border-border-subtle text-center">
          <p className="text-[10px] text-text-secondary font-medium">Occupancy</p>
          <p className="text-xs font-black text-emerald-500 mt-0.5">85%</p>
        </div>
      </div>
      <div className="bg-surface-card p-2.5 rounded-xl border border-border-subtle flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-text-primary">15:00 Maintenance Slot</p>
          <p className="text-[11px] text-text-secondary">
            {isBlocked ? "Blocked (Sprinklers Active)" : "Open for Bookings"}
          </p>
        </div>
        <button
          onClick={() => setIsBlocked(!isBlocked)}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
            isBlocked
              ? "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30"
              : "bg-primary-lime text-accent-text"
          }`}
        >
          {isBlocked ? "Unblock Slot" : "Block for Turf Care"}
        </button>
      </div>
    </div>
  );
};

const PwaTipsWidget: React.FC = () => {
  const [checked, setChecked] = useState<Record<number, boolean>>({ 0: true, 1: true });

  const tips = [
    { title: "Install PWA on Phone", desc: "Tap 'Install App' in top bar to get 1-tap launcher" },
    { title: "Enable 15-Min Match Alert", desc: "Automated alert warns team before kickoff" },
    { title: "Dark Mode for Night Matches", desc: "Saves phone battery during late-night fixtures" },
  ];

  return (
    <div className="bg-surface-base p-3.5 rounded-2xl border border-border-subtle space-y-3 text-left">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-black uppercase tracking-wider text-primary-lime flex items-center gap-1.5">
          <Smartphone size={12} /> Setup Checklist
        </span>
        <span className="text-[10.5px] font-semibold text-text-tertiary">Interactive Checklist</span>
      </div>
      <div className="space-y-1.5">
        {tips.map((t, idx) => (
          <div
            key={t.title}
            onClick={() => setChecked(prev => ({ ...prev, [idx]: !prev[idx] }))}
            className="p-2 rounded-xl bg-surface-card border border-border-subtle flex items-center gap-2.5 cursor-pointer hover:border-text-tertiary transition-colors"
          >
            <div
              className={`w-4 h-4 rounded-md flex items-center justify-center transition-colors ${
                checked[idx] ? "bg-primary-lime text-black" : "border border-border-subtle"
              }`}
            >
              {checked[idx] && <Check size={12} strokeWidth={3} />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-text-primary">{t.title}</p>
              <p className="text-[10.5px] text-text-secondary">{t.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* RENDER THE MATCHING SIMULATOR                                              */
/* -------------------------------------------------------------------------- */

const RenderWidget: React.FC<{ type: string }> = ({ type }) => {
  switch (type) {
    case "flow_overview":
      return <FlowOverviewWidget />;
    case "distance_radar":
      return <DistanceRadarWidget />;
    case "gps_map":
      return <DistanceRadarWidget />;
    case "slot_lock":
      return <SlotLockWidget />;
    case "momo_checkout":
      return <MomoCheckoutWidget />;
    case "qr_pass":
      return <QrPassWidget />;
    case "motm_voting":
      return <MotmVotingWidget />;
    case "split_billing":
      return <SplitBillingWidget />;
    case "owner_portal":
      return <OwnerPortalWidget />;
    case "pwa_tips":
      return <PwaTipsWidget />;
    default:
      return <FlowOverviewWidget />;
  }
};

/* -------------------------------------------------------------------------- */
/* MAIN COMPONENT: AppWalkthroughModal                                        */
/* -------------------------------------------------------------------------- */

export const AppWalkthroughModal: React.FC = () => {
  const {
    isOpen,
    currentStepIndex,
    currentStep,
    totalSteps,
    steps,
    viewMode,
    activeCategory,
    searchQuery,
    closeWalkthrough,
    nextStep,
    prevStep,
    goToStep,
    setViewMode,
    setActiveCategory,
    setSearchQuery,
    markCompleted,
  } = useInteractiveWalkthrough();

  const navigate = useNavigate();

  // Close on Escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeWalkthrough();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeWalkthrough]);

  // Filtered steps for directory view
  const filteredSteps = useMemo(() => {
    return steps.filter(step => {
      const matchCategory =
        activeCategory === "all" ||
        step.category === activeCategory ||
        (activeCategory === "player" && (step.category === "player" || step.category === "booking" || step.category === "community")) ||
        (activeCategory === "owner" && (step.category === "owner" || step.category === "general"));

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        step.title.toLowerCase().includes(q) ||
        step.subtitle.toLowerCase().includes(q) ||
        step.summary.toLowerCase().includes(q) ||
        step.keyAdvantage.toLowerCase().includes(q) ||
        step.howToUse.some(h => h.toLowerCase().includes(q));

      return matchCategory && matchSearch;
    });
  }, [steps, activeCategory, searchQuery]);

  if (!isOpen) return null;

  const handleNavigateToFeature = (route: string) => {
    closeWalkthrough();
    navigate(route);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 font-sans animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label="App Walkthrough & Feature Guide"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
        onClick={closeWalkthrough}
      />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-4xl max-h-[92vh] bg-surface-card border border-border-subtle rounded-3xl shadow-2xl overflow-hidden flex flex-col text-text-primary animate-scaleUp">
        {/* TOP APP BAR / HEADER */}
        <div className="p-4 sm:p-5 border-b border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-card/90 backdrop-blur-sm shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-primary-lime/15 border border-primary-lime/30 text-primary-lime font-black text-[10px] uppercase tracking-wider flex items-center gap-1">
                <Sparkles size={12} />
                Footlink Master Walkthrough
              </span>
              <span className="text-[11px] font-semibold text-text-tertiary">
                {viewMode === "guide" ? `Step ${currentStepIndex + 1} of ${totalSteps}` : "All Features Directory"}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-text-primary tracking-tight">
              Master Footlink: Full App Walkthrough &amp; Guide
            </h2>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* View Mode Toggle: Step-by-Step vs Directory */}
            <div className="flex items-center p-1 rounded-xl bg-surface-base border border-border-subtle">
              <button
                type="button"
                onClick={() => setViewMode("guide")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  viewMode === "guide"
                    ? "bg-primary-lime text-accent-text shadow-xs"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <Compass size={13} />
                <span>Tour</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("directory")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  viewMode === "directory"
                    ? "bg-primary-lime text-accent-text shadow-xs"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <Layers size={13} />
                <span>All Features</span>
              </button>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={closeWalkthrough}
              className="p-2 rounded-xl bg-surface-base hover:bg-surface-raised border border-border-subtle text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
              title="Close Walkthrough (Esc)"
              aria-label="Close Walkthrough"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ================================================================== */}
        {/* VIEW 1: STEP-BY-STEP GUIDED WALKTHROUGH                            */}
        {/* ================================================================== */}
        {viewMode === "guide" ? (
          <div className="flex-1 overflow-hidden flex flex-col lg:flex-row min-h-0">
            {/* LEFT SIDEBAR: CHAPTER LIST */}
            <div className="hidden lg:flex flex-col w-72 border-r border-border-subtle bg-surface-base/50 p-3 overflow-y-auto no-scrollbar shrink-0 space-y-1">
              <p className="text-[10px] font-black uppercase tracking-wider text-text-tertiary px-2 py-1">
                Chapters &amp; Features
              </p>
              {steps.map((step, idx) => {
                const isActive = idx === currentStepIndex;
                const isPast = idx < currentStepIndex;
                return (
                  <button
                    key={step.id}
                    onClick={() => goToStep(idx)}
                    className={`w-full p-2.5 rounded-xl text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                      isActive
                        ? "bg-primary-lime/15 text-text-primary border border-primary-lime/40 shadow-xs font-bold"
                        : "hover:bg-surface-card text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5 ${
                        isActive
                          ? "bg-primary-lime text-accent-text"
                          : isPast
                          ? "bg-surface-raised text-primary-lime border border-primary-lime/30"
                          : "bg-surface-raised text-text-tertiary"
                      }`}
                    >
                      {isPast ? <Check size={10} strokeWidth={3} /> : idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate">{step.title}</p>
                      <p className="text-[10.5px] text-text-tertiary truncate">{step.badge.split("•")[1]?.trim() || step.badge}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-left">
              {/* Step Header */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-surface-raised border border-border-subtle text-text-secondary font-bold text-[10px] uppercase tracking-wider">
                    {currentStep.badge}
                  </span>
                  <span className="text-[11px] font-bold text-primary-lime uppercase tracking-wider">
                    {currentStep.category.toUpperCase()}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">
                  {currentStep.title}
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-text-secondary">
                  {currentStep.subtitle}
                </p>
              </div>

              {/* Summary Paragraph */}
              <p className="text-xs sm:text-sm text-text-primary leading-relaxed">
                {currentStep.summary}
              </p>

              {/* Interactive Simulator Widget */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-black uppercase tracking-wider text-text-tertiary flex items-center gap-1">
                  <Sparkles size={12} className="text-primary-lime" />
                  Interactive Feature Sandbox
                </p>
                <RenderWidget type={currentStep.interactiveWidgetType} />
              </div>

              {/* How To Use (1-2-3 Guide) */}
              <div className="bg-surface-card p-4 rounded-2xl border border-border-subtle space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-text-primary">
                  <Target size={14} className="text-primary-lime" />
                  <span>How To Use This Feature</span>
                </div>
                <ul className="space-y-2">
                  {currentStep.howToUse.map((instruction, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-text-secondary leading-relaxed">
                      <span className="w-4 h-4 rounded-full bg-primary-lime/20 text-primary-lime flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span>{instruction}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Key Advantage Box */}
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  <Zap size={13} className="fill-emerald-500 text-emerald-500" />
                  <span>Key Advantage</span>
                </div>
                <p className="text-xs text-text-primary font-medium leading-relaxed">
                  {currentStep.keyAdvantage}
                </p>
              </div>

              {/* Pro Tip Callout */}
              <div className="p-3 rounded-2xl bg-surface-raised border border-border-subtle flex items-start gap-2.5 text-xs text-text-secondary">
                <Info size={15} className="text-primary-lime shrink-0 mt-0.5" />
                <p>
                  <strong className="text-text-primary">Pro Tip:</strong> {currentStep.proTip}
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* ================================================================== */
          /* VIEW 2: ALL FEATURES DIRECTORY & SEARCH                            */
          /* ================================================================== */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-left">
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pb-2 border-b border-border-subtle">
              <div className="relative w-full sm:w-72">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search features (e.g. radar, momo, qr, lock)..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-base border border-border-subtle text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary-lime transition-colors"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                {(
                  [
                    { id: "all", label: "All Details" },
                    { id: "player", label: "Player Guide" },
                    { id: "owner", label: "Owner Guide" },
                  ] as const
                ).map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveCategory(tab.id as WalkthroughCategory)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      activeCategory === tab.id
                        ? "bg-primary-lime text-accent-text shadow-xs"
                        : "bg-surface-base border border-border-subtle text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredSteps.map((step, idx) => (
                <div
                  key={step.id}
                  className="bg-surface-base hover:bg-surface-card border border-border-subtle rounded-2xl p-4 transition-all space-y-2.5 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] font-bold text-primary-lime uppercase tracking-wider">
                        {step.badge}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-surface-card border border-border-subtle text-[10px] font-bold text-text-tertiary uppercase">
                        {step.category}
                      </span>
                    </div>

                    <h4 className="text-base font-black text-text-primary">
                      {step.title}
                    </h4>

                    <p className="text-xs text-text-secondary leading-relaxed">
                      {step.summary}
                    </p>

                    <div className="bg-surface-card p-2.5 rounded-xl border border-border-subtle text-[11px] text-text-secondary space-y-1">
                      <p className="font-bold text-text-primary flex items-center gap-1">
                        <CheckCircle2 size={12} className="text-primary-lime" /> Key Advantage:
                      </p>
                      <p className="text-[11px] leading-relaxed">{step.keyAdvantage}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border-subtle gap-2">
                    <button
                      type="button"
                      onClick={() => goToStep(step.stepNumber - 1)}
                      className="text-xs font-bold text-primary-lime hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>View in Tour</span>
                      <ArrowRight size={12} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleNavigateToFeature(step.route)}
                      className="px-3 py-1.5 rounded-xl bg-surface-card hover:bg-surface-raised border border-border-subtle text-xs font-bold text-text-primary flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                    >
                      <span>{step.actionLabel}</span>
                      <ExternalLink size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredSteps.length === 0 && (
              <div className="py-12 text-center space-y-2">
                <p className="text-sm font-bold text-text-primary">No matching features found</p>
                <p className="text-xs text-text-secondary">Try searching for &quot;radar&quot;, &quot;momo&quot;, &quot;qr&quot;, &quot;owner&quot;, or &quot;lock&quot;.</p>
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="mt-2 px-3 py-1.5 rounded-xl bg-primary-lime text-accent-text text-xs font-bold cursor-pointer"
                >
                  Clear Search
                </button>
              </div>
            )}
          </div>
        )}

        {/* FOOTER ACTION BAR */}
        <div className="p-4 sm:p-5 border-t border-border-subtle bg-surface-card/90 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          {viewMode === "guide" ? (
            <>
              {/* Step dots */}
              <div className="flex items-center gap-1.5 order-2 sm:order-1">
                {steps.map((s, idx) => (
                  <button
                    key={s.id}
                    onClick={() => goToStep(idx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      idx === currentStepIndex
                        ? "w-7 bg-primary-lime"
                        : idx < currentStepIndex
                        ? "w-2 bg-primary-lime/40"
                        : "w-2 bg-border-subtle hover:bg-text-tertiary"
                    }`}
                    title={`Jump to ${s.title}`}
                  />
                ))}
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end order-1 sm:order-2">
                {currentStepIndex > 0 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-3.5 py-2 rounded-xl bg-surface-base hover:bg-surface-raised border border-border-subtle text-xs font-bold text-text-secondary hover:text-text-primary transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                    <span>Previous</span>
                  </button>
                )}

                {/* Direct feature jump */}
                <button
                  type="button"
                  onClick={() => handleNavigateToFeature(currentStep.route)}
                  className="px-3.5 py-2 rounded-xl bg-surface-base hover:bg-surface-raised border border-border-subtle text-xs font-bold text-text-primary transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Navigate directly to this section in Footlink"
                >
                  <span>{currentStep.actionLabel}</span>
                  <ExternalLink size={13} className="text-primary-lime" />
                </button>

                {/* Next / Finish */}
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-4 py-2 rounded-xl bg-primary-lime hover:bg-primary-lime-hover text-accent-text text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
                >
                  <span>{currentStepIndex === totalSteps - 1 ? "Finish Walkthrough" : "Next Chapter"}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-text-secondary font-medium">
                Browsing all {steps.length} platform features &amp; capabilities
              </span>
              <button
                type="button"
                onClick={() => setViewMode("guide")}
                className="px-4 py-2 rounded-xl bg-primary-lime text-accent-text text-xs font-black flex items-center gap-1.5 cursor-pointer"
              >
                <Compass size={14} />
                <span>Return to Interactive Tour</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
