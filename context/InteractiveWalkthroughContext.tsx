import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export interface WalkthroughStep {
  id: string;
  route: string;
  targetSelector: string;
  title: string;
  serviceName: string;
  badge: string;
  highlightTag: string;
  advantage: string;
  actionToMaster: string;
  preferredPosition?: "top" | "bottom" | "left" | "right" | "auto";
  actionLabel?: string;
  onExecuteAction?: () => void;
}

export const WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    id: "step-radar-search",
    route: "/home",
    targetSelector: "#walkthrough-radar-card",
    title: "Kampala Pitch Radar",
    serviceName: "Real-Time Proximity Scanner & Distance Calculator",
    badge: "Step 1 of 6 • Discovery",
    highlightTag: "Zero-Traffic Routing",
    advantage:
      "Avoid cross-city traffic bottlenecks across Kampala. The live radar scanner immediately measures driving and walking distance from your exact neighborhood (Kololo, Lugogo, Naguru, Munyonyo) to verified pitches.",
    actionToMaster:
      "Tap the Radar card or 'Launch Interactive Pitch Radar' to preview venues within 1km to 15km of your location.",
    preferredPosition: "bottom",
    actionLabel: "Preview Nearby Pitches"
  },
  {
    id: "step-format-filters",
    route: "/home",
    targetSelector: "#walkthrough-format-categories",
    title: "Surface & Format Selector",
    serviceName: "Dynamic Pitch Capacity & Weather Filters",
    badge: "Step 2 of 6 • Match Sizing",
    highlightTag: "Exact Squad Match",
    advantage:
      "Never arrive with 14 players to a 5-a-side cage or face rain delays. Filters isolate certified FIFA AstroTurf, covered indoor courts, and illuminated night floodlights in real time.",
    actionToMaster:
      "Tap any match size chip (5-A-Side, 7-A-Side, Indoor) to instantly filter venues that match your squad's capacity.",
    preferredPosition: "bottom",
    actionLabel: "Filter by 7-A-Side"
  },
  {
    id: "step-explore-map",
    route: "/explore-map",
    targetSelector: "#walkthrough-map-canvas",
    title: "Live GPS Turf Map",
    serviceName: "Geographical Pitch Pins & Cluster Scanner",
    badge: "Step 3 of 6 • Venue Locator",
    highlightTag: "Interactive GPS Grid",
    advantage:
      "Gives you a full interactive aerial map of Kampala's sports grounds with color-coded availability badges, hourly price tags, and direct Google navigation shortcuts.",
    actionToMaster:
      "Drag the map, switch neighborhood anchors (e.g., Lugogo or Ntinda), or tap a pitch marker to open full specs.",
    preferredPosition: "bottom",
    actionLabel: "Anchor to Lugogo"
  },
  {
    id: "step-slot-lock",
    route: "/turf/pitch-tal-olympic-7/book",
    targetSelector: "#walkthrough-slot-picker",
    title: "Anti-Double Booking Lock",
    serviceName: "10-Minute Cloud Slot Hold & Rate Engine",
    badge: "Step 4 of 6 • Reservation",
    highlightTag: "10-Min Reserved Hold",
    advantage:
      "Prevents someone else from taking your game slot while your team gathers money. Once you pick an hour, Footlink locks it exclusively in the cloud for 10 minutes with instant MTN/Airtel checkout.",
    actionToMaster:
      "Tap an available green hour slot to initiate your secured 10-minute hold lock before completing Mobile Money checkout.",
    preferredPosition: "bottom",
    actionLabel: "Inspect Available Slots"
  },
  {
    id: "step-qr-pass",
    route: "/bookings",
    targetSelector: "#walkthrough-qr-pass-section",
    title: "Digital QR Match Pass",
    serviceName: "Instant Gate Turnstile Verification",
    badge: "Step 5 of 6 • Venue Entry",
    highlightTag: "Offline-Ready Pass",
    advantage:
      "Zero paperwork, cash disputes, or phone calls needed. Pitch marshals scan your dynamic QR ticket at the gate in 1 second, functioning seamlessly even if stadium cellular data drops.",
    actionToMaster:
      "Tap 'View Pass' on your confirmed booking to display your high-contrast QR entry code to the pitch supervisor.",
    preferredPosition: "bottom",
    actionLabel: "View Digital Pass"
  },
  {
    id: "step-teams-split",
    route: "/teams",
    targetSelector: "#walkthrough-teams-hub",
    title: "Squads & Automated MoMo Split",
    serviceName: "Matchmaking & Mobile Money Bill Splitting",
    badge: "Step 6 of 6 • Community",
    highlightTag: "Automated Fee Split",
    advantage:
      "Team captains no longer need to pay UGX 100,000 upfront. Automatically calculates and requests individual shares from 10 to 14 teammates via MTN & Airtel MoMo with real-time payment status tracking.",
    actionToMaster:
      "Create a squad, invite teammates via link, or host a public weekend match fixture with split billing.",
    preferredPosition: "top",
    actionLabel: "Host Match Fixture"
  }
];

interface WalkthroughContextType {
  isActive: boolean;
  currentStepIndex: number;
  currentStep: WalkthroughStep | null;
  totalSteps: number;
  startWalkthrough: (startingStepIndex?: number) => void;
  endWalkthrough: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
}

const WalkthroughContext = createContext<WalkthroughContextType | undefined>(undefined);

export const InteractiveWalkthroughProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const navigate = useNavigate();
  const location = useLocation();

  const currentStep = isActive && currentStepIndex < WALKTHROUGH_STEPS.length
    ? WALKTHROUGH_STEPS[currentStepIndex]
    : null;

  // Navigate to appropriate page when step changes
  useEffect(() => {
    if (!isActive || !currentStep) return;

    if (location.pathname !== currentStep.route) {
      navigate(currentStep.route);
    }
  }, [isActive, currentStepIndex, currentStep, location.pathname, navigate]);

  const startWalkthrough = useCallback((startingStepIndex = 0) => {
    const idx = Math.max(0, Math.min(startingStepIndex, WALKTHROUGH_STEPS.length - 1));
    setCurrentStepIndex(idx);
    setIsActive(true);
    const targetStep = WALKTHROUGH_STEPS[idx];
    if (targetStep && location.pathname !== targetStep.route) {
      navigate(targetStep.route);
    }
  }, [location.pathname, navigate]);

  const endWalkthrough = useCallback(() => {
    setIsActive(false);
    try {
      localStorage.setItem("pitchly_walkthrough_completed", "true");
    } catch (e) {
      console.warn("Could not save walkthrough completion:", e);
    }
  }, []);

  const nextStep = useCallback(() => {
    if (currentStepIndex < WALKTHROUGH_STEPS.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      const nextTarget = WALKTHROUGH_STEPS[nextIdx];
      if (nextTarget && location.pathname !== nextTarget.route) {
        navigate(nextTarget.route);
      }
    } else {
      endWalkthrough();
    }
  }, [currentStepIndex, location.pathname, navigate, endWalkthrough]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      const prevTarget = WALKTHROUGH_STEPS[prevIdx];
      if (prevTarget && location.pathname !== prevTarget.route) {
        navigate(prevTarget.route);
      }
    }
  }, [currentStepIndex, location.pathname, navigate]);

  const goToStep = useCallback((index: number) => {
    if (index >= 0 && index < WALKTHROUGH_STEPS.length) {
      setCurrentStepIndex(index);
      const target = WALKTHROUGH_STEPS[index];
      if (target && location.pathname !== target.route) {
        navigate(target.route);
      }
    }
  }, [location.pathname, navigate]);

  return (
    <WalkthroughContext.Provider
      value={{
        isActive,
        currentStepIndex,
        currentStep,
        totalSteps: WALKTHROUGH_STEPS.length,
        startWalkthrough,
        endWalkthrough,
        nextStep,
        prevStep,
        goToStep
      }}
    >
      {children}
    </WalkthroughContext.Provider>
  );
};

export const useInteractiveWalkthrough = () => {
  const ctx = useContext(WalkthroughContext);
  if (!ctx) {
    throw new Error("useInteractiveWalkthrough must be used within an InteractiveWalkthroughProvider");
  }
  return ctx;
};
