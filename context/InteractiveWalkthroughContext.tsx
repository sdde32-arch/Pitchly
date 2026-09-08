import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export type WalkthroughCategory = "all" | "player" | "owner" | "booking" | "community";

export interface WalkthroughStepDetail {
  id: string;
  stepNumber: number;
  category: "player" | "owner" | "booking" | "community" | "general";
  title: string;
  subtitle: string;
  badge: string;
  route: string;
  actionLabel: string;
  summary: string;
  howToUse: string[];
  keyAdvantage: string;
  proTip: string;
  interactiveWidgetType: 
    | "flow_overview" 
    | "distance_radar" 
    | "gps_map" 
    | "slot_lock" 
    | "momo_checkout" 
    | "qr_pass" 
    | "motm_voting" 
    | "split_billing" 
    | "owner_portal" 
    | "pwa_tips";
}

export const MASTER_WALKTHROUGH_STEPS: WalkthroughStepDetail[] = [
  {
    id: "app-overview",
    stepNumber: 1,
    category: "general",
    title: "Welcome to Footlink",
    subtitle: "Kampala's Premier Sports Turf Booking & Matchmaking Platform",
    badge: "Chapter 1 • Platform Overview",
    route: "/home",
    actionLabel: "Explore Home Dashboard",
    summary:
      "Footlink connects football lovers, team captains, and pitch managers across Kampala. Book certified turf grounds, prevent double-bookings with cloud slot locks, pay via Mobile Money, and enter venues with digital QR passes.",
    howToUse: [
      "Find Pitches: Use the proximity radar or interactive map to spot venues near your location.",
      "Pick & Hold: Tap any green slot to lock it for 10 minutes exclusively in the cloud.",
      "Pay & Scan: Complete checkout via MTN MoMo or Airtel Money to receive your dynamic entry QR pass."
    ],
    keyAdvantage:
      "100% transparent pricing in UGX with zero phone tag, cash friction, or lost reservation disputes.",
    proTip:
      "Footlink can be installed directly onto your phone's home screen as a Progressive Web App (PWA) for 1-tap offline access.",
    interactiveWidgetType: "flow_overview"
  },
  {
    id: "radar-discovery",
    stepNumber: 2,
    category: "player",
    title: "Proximity Radar & Distance Engine",
    subtitle: "Zero-Traffic Discovery Across Kampala Neighborhoods",
    badge: "Chapter 2 • Smart Search",
    route: "/home",
    actionLabel: "Search Nearby Pitches",
    summary:
      "Beat Kampala traffic bottlenecks. The built-in proximity radar calculates driving and walking distance in kilometers and minutes from key city hubs like Lugogo, Kololo, Naguru, Munyonyo, and Ntinda.",
    howToUse: [
      "Select your neighborhood anchor or allow GPS location to measure exact road distances.",
      "Filter by match format: 5-A-Side cage, 7-A-Side, 9-A-Side, 11-A-Side, or Covered Indoor.",
      "Filter by surface and amenities: Certified FIFA AstroTurf, night floodlights, parking, and showers."
    ],
    keyAdvantage:
      "Know precisely how far your squad will have to travel before committing to a booking.",
    proTip:
      "Pitches with night floodlights remain open till 11:00 PM for late evening and after-work corporate fixtures.",
    interactiveWidgetType: "distance_radar"
  },
  {
    id: "interactive-map",
    stepNumber: 3,
    category: "player",
    title: "Interactive GPS Turf Map",
    subtitle: "Geographical Ground Pins, Live Price Tags & Directions",
    badge: "Chapter 3 • Venue Navigation",
    route: "/explore-map",
    actionLabel: "Open GPS Turf Map",
    summary:
      "View Kampala's sporting landscape on an aerial GPS map. See pins with live hourly prices, open slot counters, and instant 1-tap Google Maps turn-by-turn navigation directly to the stadium gates.",
    howToUse: [
      "Pan, pinch, and zoom across the Kampala map to inspect venues in various suburbs.",
      "Tap any pitch marker to preview photos, open slot availability, and hourly pricing in UGX.",
      "Tap the navigation icon on any pitch card to immediately route in Google Maps."
    ],
    keyAdvantage:
      "Visual clustering lets you find hidden community pitches and avoid congested corridors.",
    proTip:
      "Green map markers indicate venues with more than 3 open slots for today's matches.",
    interactiveWidgetType: "gps_map"
  },
  {
    id: "slot-locking",
    stepNumber: 4,
    category: "booking",
    title: "Live Slots & 10-Minute Cloud Lock",
    subtitle: "Real-Time Anti-Double Booking Protection",
    badge: "Chapter 4 • Reservation Hold",
    route: "/home",
    actionLabel: "View Available Slots",
    summary:
      "Never lose your favorite game hour while waiting for your squad to gather money. When you select an available hour, Footlink locks it exclusively in the cloud for 10 minutes so nobody else can take it.",
    howToUse: [
      "Inspect the live slot grid: Green = Available, Amber = Held in 10-min Cloud Lock, Gray = Booked.",
      "Select your kickoff hour. The timer starts immediately, protecting your slot while you check out.",
      "Choose match duration: 1 hour, 1.5 hours, or 2 hours for full match tournaments."
    ],
    keyAdvantage:
      "Eliminates double-booking conflicts completely. When a slot is held by you, all other users see it locked.",
    proTip:
      "If you abandon checkout, the slot unlocks automatically when the 10-minute timer expires, freeing it for others.",
    interactiveWidgetType: "slot_lock"
  },
  {
    id: "momo-checkout",
    stepNumber: 5,
    category: "booking",
    title: "Mobile Money (MTN & Airtel) Checkout",
    subtitle: "Direct USSD Prompts & Secure Instant Receipts",
    badge: "Chapter 5 • Fast Payment",
    route: "/home",
    actionLabel: "Explore Payment Options",
    summary:
      "Pay securely using Uganda's most trusted payment methods: MTN Mobile Money and Airtel Money. Receive instant USSD checkout approvals and digital receipts in seconds.",
    howToUse: [
      "Select MTN MoMo or Airtel Money during checkout and enter your Uganda phone number (+256).",
      "Confirm the transparent UGX total with all taxes and pitch fees included.",
      "Approve the automated prompt on your phone to complete your confirmed booking."
    ],
    keyAdvantage:
      "Zero hidden credit card surcharges or international transaction fees. Exact UGX pricing.",
    proTip:
      "Have a promo code? Enter it at checkout for special team discounts on weekend matches.",
    interactiveWidgetType: "momo_checkout"
  },
  {
    id: "digital-qr-pass",
    stepNumber: 6,
    category: "booking",
    title: "Digital QR Match Pass & Turnstile Entry",
    subtitle: "Offline-Ready Gate Pass for Fast Stadium Check-In",
    badge: "Chapter 6 • Venue Access",
    route: "/bookings",
    actionLabel: "View My Match Passes",
    summary:
      "No physical tickets or printed paper required. Your confirmed booking generates a high-contrast dynamic QR pass that pitch marshals scan in under 1 second at the gate.",
    howToUse: [
      "Go to 'Bookings' from the bottom navigation bar to view all your upcoming and past matches.",
      "Tap 'View Pass' to reveal your high-contrast QR entry pass and booking details.",
      "Show the QR code to the pitch supervisor upon arriving at the grounds."
    ],
    keyAdvantage:
      "Offline-ready! Even if cellular data drops at the arena, your ticket loads from local cache without error.",
    proTip:
      "Need to cancel or reschedule? Self-service options are available right from the booking pass view.",
    interactiveWidgetType: "qr_pass"
  },
  {
    id: "match-motm",
    stepNumber: 7,
    category: "community",
    title: "Match Center & Man of the Match (MotM)",
    subtitle: "Real-Time Scorekeeping & Squad MVP Voting",
    badge: "Chapter 7 • Post-Match Hub",
    route: "/bookings",
    actionLabel: "Open Match Center",
    summary:
      "The experience doesn't end when the final whistle blows. Enter the match score, nominate players, and let everyone on the pitch vote for the official Man of the Match with real-time percentage charts.",
    howToUse: [
      "Tap 'Match Summary' on any completed booking card.",
      "Enter the final scoreline (Home vs Away) and add player candidate names.",
      "Vote for your game MVP and tap 'Share to WhatsApp' to broadcast the official match report to your squad group."
    ],
    keyAdvantage:
      "Brings professional league excitement to casual pickup games and company leagues.",
    proTip:
      "Every player gets exactly 1 vote, preventing vote stuffing and ensuring genuine recognition.",
    interactiveWidgetType: "motm_voting"
  },
  {
    id: "squads-momo-split",
    stepNumber: 8,
    category: "community",
    title: "Squads & Automated MoMo Bill Split",
    subtitle: "Team Matchmaking & Splitting Turf Fees Fairly",
    badge: "Chapter 8 • Team Matchmaking",
    route: "/teams",
    actionLabel: "Open Squads Hub",
    summary:
      "Team captains no longer need to pay UGX 120,000 out of pocket. Footlink calculates each player's exact share (e.g., UGX 10,000 for 12 players) and tracks who has paid in real time.",
    howToUse: [
      "Navigate to 'Squads' to create your team with a custom crest, captain info, and home venue.",
      "Share your squad invite link with friends via WhatsApp or SMS to assemble your roster.",
      "Use the automated bill split feature when booking: input squad size and track who has settled their share."
    ],
    keyAdvantage:
      "Ends the hassle of chasing teammates for pitch contributions after the game.",
    proTip:
      "Looking for a match? Post in the Squads matchmaking tab to challenge rival teams in Kampala.",
    interactiveWidgetType: "split_billing"
  },
  {
    id: "owner-portal",
    stepNumber: 9,
    category: "owner",
    title: "Turf Owner & Manager Portal",
    subtitle: "Venue Listings, Slot Scheduling & Revenue Analytics",
    badge: "Chapter 9 • Venue Management",
    route: "/owner",
    actionLabel: "Visit Owner Portal",
    summary:
      "Pitch owners and venue managers have a dedicated suite to list grounds, set hourly rates, manage slots, approve offline cash bookings, and analyze earnings.",
    howToUse: [
      "Switch to Owner mode via the role switcher in your Profile or the header role badge.",
      "List your pitch: add photos, dimensions, surface type, floodlight availability, and hourly rates in UGX.",
      "Manage reservations on the live calendar: block maintenance slots, verify QR passes, and view payouts."
    ],
    keyAdvantage:
      "Maximizes pitch occupancy and automates payment collection with zero double-booking headaches.",
    proTip:
      "Set custom peak-hour pricing for popular Friday night and weekend afternoon slots.",
    interactiveWidgetType: "owner_portal"
  },
  {
    id: "pwa-tips",
    stepNumber: 10,
    category: "general",
    title: "Pro Tips, Offline Mode & Settings",
    subtitle: "Get the Absolute Best Out of Footlink",
    badge: "Chapter 10 • Pro Tips & Setup",
    route: "/profile",
    actionLabel: "View Profile & Settings",
    summary:
      "Everything you need to customize your Footlink experience: PWA home screen installation, match alerts, theme selection, and 24/7 support.",
    howToUse: [
      "Install as App: Tap 'Install App' in the top header to add Footlink directly to your Android or iOS home screen.",
      "Enable Match Alerts: Receive automatic 15-minute kick-off notifications so your team is never late.",
      "Theme Customization: Switch between Dark Mode (ideal for night fixtures) and clean Light Mode in Profile."
    ],
    keyAdvantage:
      "Fast, native-like experience on any smartphone with minimal battery and cellular data usage.",
    proTip:
      "Encounter an issue at a turf? Use the in-app Report & Support feature to report maintenance or billing questions.",
    interactiveWidgetType: "pwa_tips"
  }
];

interface WalkthroughContextType {
  isOpen: boolean;
  currentStepIndex: number;
  currentStep: WalkthroughStepDetail;
  totalSteps: number;
  steps: WalkthroughStepDetail[];
  activeCategory: WalkthroughCategory;
  viewMode: "guide" | "directory";
  searchQuery: string;
  hasCompleted: boolean;
  openWalkthrough: (startingStepOrId?: number | string) => void;
  closeWalkthrough: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
  setActiveCategory: (cat: WalkthroughCategory) => void;
  setViewMode: (mode: "guide" | "directory") => void;
  setSearchQuery: (query: string) => void;
  markCompleted: () => void;
  startWalkthrough: (stepIndex?: number) => void; // backwards-compatible alias
  endWalkthrough: () => void; // backwards-compatible alias
}

const WalkthroughContext = createContext<WalkthroughContextType | undefined>(undefined);

export const InteractiveWalkthroughProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [activeCategory, setActiveCategory] = useState<WalkthroughCategory>("all");
  const [viewMode, setViewMode] = useState<"guide" | "directory">("guide");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [hasCompleted, setHasCompleted] = useState<boolean>(() => {
    try {
      return localStorage.getItem("pitchly_master_walkthrough_completed") === "true";
    } catch {
      return false;
    }
  });

  const navigate = useNavigate();

  const currentStep = MASTER_WALKTHROUGH_STEPS[currentStepIndex] || MASTER_WALKTHROUGH_STEPS[0];

  const openWalkthrough = useCallback((startingStepOrId?: number | string) => {
    let index = 0;
    if (typeof startingStepOrId === "number") {
      index = Math.max(0, Math.min(startingStepOrId, MASTER_WALKTHROUGH_STEPS.length - 1));
    } else if (typeof startingStepOrId === "string") {
      const foundIdx = MASTER_WALKTHROUGH_STEPS.findIndex(
        s => s.id === startingStepOrId || s.route.includes(startingStepOrId)
      );
      if (foundIdx !== -1) index = foundIdx;
    }
    setCurrentStepIndex(index);
    setViewMode("guide");
    setIsOpen(true);
  }, []);

  const closeWalkthrough = useCallback(() => {
    setIsOpen(false);
  }, []);

  const markCompleted = useCallback(() => {
    setHasCompleted(true);
    try {
      localStorage.setItem("pitchly_master_walkthrough_completed", "true");
    } catch (e) {
      console.warn("Could not save walkthrough completion:", e);
    }
    setIsOpen(false);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStepIndex < MASTER_WALKTHROUGH_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      markCompleted();
    }
  }, [currentStepIndex, markCompleted]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [currentStepIndex]);

  const goToStep = useCallback((index: number) => {
    if (index >= 0 && index < MASTER_WALKTHROUGH_STEPS.length) {
      setCurrentStepIndex(index);
      setViewMode("guide");
    }
  }, []);

  // Backwards-compatible aliases
  const startWalkthrough = useCallback((stepIndex = 0) => {
    openWalkthrough(stepIndex);
  }, [openWalkthrough]);

  const endWalkthrough = useCallback(() => {
    closeWalkthrough();
  }, [closeWalkthrough]);

  return (
    <WalkthroughContext.Provider
      value={{
        isOpen,
        currentStepIndex,
        currentStep,
        totalSteps: MASTER_WALKTHROUGH_STEPS.length,
        steps: MASTER_WALKTHROUGH_STEPS,
        activeCategory,
        viewMode,
        searchQuery,
        hasCompleted,
        openWalkthrough,
        closeWalkthrough,
        nextStep,
        prevStep,
        goToStep,
        setActiveCategory,
        setViewMode,
        setSearchQuery,
        markCompleted,
        startWalkthrough,
        endWalkthrough
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
