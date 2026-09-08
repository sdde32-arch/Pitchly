import React, { useState } from "react";
import { 
  Compass, 
  Clock, 
  CreditCard, 
  QrCode, 
  Users, 
  X, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  ChevronLeft,
  ShieldCheck,
  Zap,
  MapPin,
  CalendarCheck
} from "lucide-react";
import { useUser } from "../../context/UserContext";
import { useInteractiveWalkthrough } from "../../context/InteractiveWalkthroughContext";

interface FirstTimeUserTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  role?: string;
}

interface TourStep {
  id: string;
  badge: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  tips: string[];
  graphic: React.ReactNode;
}

export const FirstTimeUserTourModal: React.FC<FirstTimeUserTourModalProps> = ({
  isOpen,
  onClose,
  role = "player"
}) => {
  const { userProfile, updateProfile } = useUser();
  const { startWalkthrough } = useInteractiveWalkthrough();
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const isOwner = role.toLowerCase() === "owner";
  const isAdmin = role.toLowerCase() === "admin" || role.toLowerCase() === "super_admin";

  const playerSteps: TourStep[] = [
    {
      id: "search",
      badge: "Step 1 of 4: Explore",
      title: "Discover & Filter Pitches",
      description: "Find available football pitches across Kampala, Lugogo, Naguru, and Entebbe with distance calculation and real photos.",
      icon: <Compass className="w-5 h-5 text-primary-lime" />,
      tips: [
        "Use the top search bar to find venues by area or pitch name.",
        "Filter by surface type (AstroTurf or Grass) and day/night floodlights."
      ],
      graphic: (
        <div className="bg-surface-base p-4 rounded-2xl border border-border-subtle space-y-2 text-left">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-text-primary flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary-lime" /> Tal Olympic Arena
            </span>
            <span className="text-[10px] font-bold text-primary-lime bg-primary-lime/10 px-2 py-0.5 rounded-full">
              1.2 km away
            </span>
          </div>
          <div className="flex gap-1.5 pt-1">
            <span className="text-[10px] bg-surface-card px-2 py-0.5 rounded-md text-text-secondary border border-border-subtle font-medium">AstroTurf</span>
            <span className="text-[10px] bg-surface-card px-2 py-0.5 rounded-md text-text-secondary border border-border-subtle font-medium">Floodlit</span>
            <span className="text-[10px] bg-surface-card px-2 py-0.5 rounded-md text-text-secondary border border-border-subtle font-medium">7v7 &amp; 9v9</span>
          </div>
        </div>
      )
    },
    {
      id: "slots",
      badge: "Step 2 of 4: Reserve",
      title: "Select & Hold Time Slots",
      description: "Pick your preferred game time. When you select a slot, Footlink locks it exclusively for 10 minutes so no one double-books it.",
      icon: <Clock className="w-5 h-5 text-primary-lime" />,
      tips: [
        "Green slots are available; gray/red slots are occupied or held.",
        "Select consecutive hours if you want longer match sessions."
      ],
      graphic: (
        <div className="bg-surface-base p-4 rounded-2xl border border-border-subtle space-y-2 text-left">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-text-secondary font-medium">Slot Hold Timer Active</span>
            <span className="font-bold text-amber-400">09:59 remaining</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-primary-lime text-accent-text font-black text-center text-xs rounded-xl shadow-xs">
              08:00 PM (Selected)
            </div>
            <div className="p-2 bg-surface-card text-text-tertiary font-bold text-center text-xs rounded-xl border border-border-subtle">
              09:00 PM (Available)
            </div>
          </div>
        </div>
      )
    },
    {
      id: "payment",
      badge: "Step 3 of 4: Checkout",
      title: "Pay via MTN / Airtel MoMo",
      description: "Complete payment instantly using Mobile Money or split payments among your squad members before the hold expires.",
      icon: <CreditCard className="w-5 h-5 text-primary-lime" />,
      tips: [
        "Prompt sent directly to your phone for PIN authorization.",
        "Split payment lets each teammate contribute their share seamlessly."
      ],
      graphic: (
        <div className="bg-surface-base p-4 rounded-2xl border border-border-subtle space-y-2 text-left">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-text-primary">Instant Mobile Money</span>
            <div className="flex gap-1">
              <span className="text-[9px] font-black bg-amber-400 text-black px-1.5 py-0.5 rounded">MTN</span>
              <span className="text-[9px] font-black bg-red-600 text-white px-1.5 py-0.5 rounded">AIRTEL</span>
            </div>
          </div>
          <div className="text-[11px] text-text-secondary flex justify-between pt-1 border-t border-border-subtle">
            <span>Transaction Security</span>
            <span className="text-primary-lime font-bold">256-bit Encrypted</span>
          </div>
        </div>
      )
    },
    {
      id: "qrcode",
      badge: "Step 4 of 4: Match Ready",
      title: "Show Digital QR Ticket at Gate",
      description: "Once confirmed, your booking pass appears under 'My Bookings'. Present the QR code to the pitch manager for immediate gate entry.",
      icon: <QrCode className="w-5 h-5 text-primary-lime" />,
      tips: [
        "Access your match pass offline even if connectivity is low.",
        "Share ticket details directly with your squad members."
      ],
      graphic: (
        <div className="bg-surface-base p-4 rounded-2xl border border-border-subtle flex items-center gap-3 text-left">
          <div className="w-12 h-12 bg-primary-lime/10 border border-primary-lime/30 rounded-xl flex items-center justify-center text-primary-lime shrink-0">
            <QrCode className="w-7 h-7" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-bold text-text-primary block truncate">Match Pass #FL-9921</span>
            <span className="text-[10.5px] text-primary-lime font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Gate Verified
            </span>
          </div>
        </div>
      )
    }
  ];

  const ownerSteps: TourStep[] = [
    {
      id: "pitches",
      badge: "Step 1 of 3: Venue Setup",
      title: "Manage Pitch Rates & Details",
      description: "Configure hourly rates, pitch dimensions, amenities (floodlights, changing rooms), and upload high-resolution venue photos.",
      icon: <Compass className="w-5 h-5 text-primary-lime" />,
      tips: [
        "Set peak evening rates and discounted morning rates.",
        "Keep photos updated to attract competitive weekend squads."
      ],
      graphic: (
        <div className="bg-surface-base p-4 rounded-2xl border border-border-subtle text-xs space-y-1.5 text-left">
          <div className="flex justify-between font-bold">
            <span className="text-text-primary">Tal Olympic Arena</span>
            <span className="text-primary-lime">UGX 100,000 /hr</span>
          </div>
          <p className="text-text-tertiary text-[11px]">Certified AstroTurf • Floodlit • 7v7</p>
        </div>
      )
    },
    {
      id: "slots_management",
      badge: "Step 2 of 3: Schedule",
      title: "Real-time Slot Availability",
      description: "Block time slots for private academy trainings or maintenance, and monitor player reservations as they happen live.",
      icon: <CalendarCheck className="w-5 h-5 text-primary-lime" />,
      tips: [
        "Prevent double bookings with automated cloud synchronization.",
        "Manual block slots in 1 tap for local tournaments."
      ],
      graphic: (
        <div className="bg-surface-base p-4 rounded-2xl border border-border-subtle text-xs space-y-2 text-left">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-text-secondary">Today's Schedule</span>
            <span className="text-primary-lime font-bold">8 Slots Booked</span>
          </div>
          <div className="h-2 bg-surface-card rounded-full overflow-hidden">
            <div className="w-3/4 h-full bg-primary-lime rounded-full" />
          </div>
        </div>
      )
    },
    {
      id: "gate_scan",
      badge: "Step 3 of 3: Gate Entry",
      title: "Scan Player QR Tickets",
      description: "Use your phone camera to scan player match passes at the gate to instantly verify payment and prevent unauthorized entry.",
      icon: <QrCode className="w-5 h-5 text-primary-lime" />,
      tips: [
        "1-second scan validates booking ID and player identity.",
        "Track daily revenue and player check-ins in your dashboard."
      ],
      graphic: (
        <div className="bg-surface-base p-4 rounded-2xl border border-border-subtle flex items-center justify-between text-xs text-left">
          <span className="text-text-primary font-bold">Instant Gate Scanner</span>
          <span className="bg-primary-lime/20 text-primary-lime px-2.5 py-1 rounded-full font-extrabold text-[10px]">
            Ready to Scan
          </span>
        </div>
      )
    }
  ];

  const steps = isOwner ? ownerSteps : playerSteps;
  const activeStep = steps[currentStep];

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      if (updateProfile) {
        await updateProfile({
          hasCompletedOnboarding: true,
          onboardingCompletedAt: new Date().toISOString()
        });
      }
    } catch (e) {
      console.warn("Could not save onboarding profile state:", e);
    }
    try {
      localStorage.setItem("hasCompletedManeuverTour", "true");
    } catch {}
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-surface-card border border-border-subtle rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="p-5 pb-3 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary-lime/10 border border-primary-lime/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-lime" />
            </div>
            <div className="text-left">
              <h3 className="text-xs font-black uppercase tracking-wider text-text-primary">
                {isOwner ? "Pitch Owner Guide" : "How to Maneuver Footlink"}
              </h3>
              <p className="text-[10px] text-text-tertiary font-medium">Quick Master Guide</p>
            </div>
          </div>
          <button
            onClick={handleComplete}
            className="p-1.5 rounded-full hover:bg-surface-base text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
            aria-label="Close Guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Master Walkthrough Launcher Card */}
        <div className="mx-5 mt-4 p-3 rounded-2xl bg-primary-lime/10 border border-primary-lime/30 flex items-center justify-between gap-3 text-left">
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-primary-lime flex items-center gap-1">
              <Zap className="w-3 h-3 fill-primary-lime" />
              Master App Walkthrough
            </span>
            <p className="text-[11.5px] font-bold text-text-primary truncate">
              Comprehensive 10-chapter guide to all key features &amp; details
            </p>
          </div>
          <button
            onClick={() => {
              handleComplete();
              startWalkthrough(0);
            }}
            className="px-3 py-1.5 rounded-xl bg-primary-lime hover:bg-primary-lime-hover text-accent-text text-[11px] font-black shrink-0 flex items-center gap-1 shadow-xs cursor-pointer transition-all active:scale-95"
          >
            <span>Start Master Tour</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Step Content */}
        <div className="p-6 space-y-4 text-left">
          {/* Step Pill */}
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-black text-primary-lime bg-primary-lime/10 border border-primary-lime/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
              {activeStep.badge}
            </span>
            <div className="flex items-center gap-1.5">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentStep ? "w-6 bg-primary-lime" : "w-1.5 bg-border-subtle"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Heading */}
          <div>
            <h2 className="text-xl font-black text-text-primary tracking-tight flex items-center gap-2">
              {activeStep.title}
            </h2>
            <p className="text-xs text-text-secondary leading-relaxed pt-1 font-normal">
              {activeStep.description}
            </p>
          </div>

          {/* Feature Graphic Showcase */}
          <div className="pt-1">
            {activeStep.graphic}
          </div>

          {/* Pro Tips List */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Maneuvering Tips:</span>
            {activeStep.tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px] text-text-secondary font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary-lime shrink-0 mt-0.5" />
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="p-5 pt-3 border-t border-border-subtle bg-surface-base/50 flex items-center justify-between gap-3">
          {currentStep > 0 ? (
            <button
              onClick={handlePrev}
              className="py-2.5 px-4 rounded-xl border border-border-subtle text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-surface-card transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="text-xs font-bold text-text-tertiary hover:text-text-primary px-3 py-2 transition-colors cursor-pointer"
            >
              Skip
            </button>
          )}

          <button
            onClick={handleNext}
            className="flex-1 py-3 px-5 rounded-xl bg-primary-lime hover:bg-primary-lime-hover text-accent-text font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-primary-lime/20 active:scale-[0.98] transition-all cursor-pointer"
          >
            {currentStep === steps.length - 1 ? (
              <>
                Got it, Let's Play!
                <CheckCircle2 className="w-4 h-4" />
              </>
            ) : (
              <>
                Next Step
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
