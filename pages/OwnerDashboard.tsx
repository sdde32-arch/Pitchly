import React, { useState, useEffect } from "react";
import { Layout } from "../components/Layout";
import { OwnerOverview } from "../components/owner/OwnerOverview";
import { BookingManager } from "../components/owner/BookingManager";
import { FinanceManager } from "../components/owner/FinanceManager";
import { BusinessSettings } from "../components/owner/BusinessSettings";
import { StaffManager } from "../components/owner/StaffManager";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  CalendarCheck, 
  Building2, 
  Wallet, 
  Settings, 
  Users,
  Plus,
  Compass
} from "lucide-react";
import { useInteractiveWalkthrough } from "../context/InteractiveWalkthroughContext";

export const OwnerDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { openWalkthrough } = useInteractiveWalkthrough();
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get("tab") || "Dashboard";
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const tab = queryParams.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [location.search]);

  const handleTabChange = (tab: string) => {
    if (tab === "Facilities") {
      navigate("/owner/pitches");
      return;
    }
    setActiveTab(tab);
    navigate(`/owner?tab=${tab}`);
  };

  const navTabs = [
    { id: "Dashboard", label: "Overview", icon: LayoutDashboard },
    { id: "Bookings", label: "Bookings", icon: CalendarCheck },
    { id: "Facilities", label: "Facilities", icon: Building2 },
    { id: "Finances", label: "Finances", icon: Wallet },
    { id: "Staff", label: "Staff", icon: Users },
    { id: "Settings", label: "Settings", icon: Settings },
  ];

  const tabMetadata: Record<string, { title: string; label: string; desc: string }> = {
    Dashboard: {
      label: "Overview",
      title: "Facility Operations & Overview",
      desc: "Live slot reservations, occupancy heatmap, and revenue telemetry."
    },
    Bookings: {
      label: "Bookings",
      title: "Match Bookings & Approvals",
      desc: "Manage player match requests, confirm slots, and handle check-ins."
    },
    Facilities: {
      label: "Facilities",
      title: "Turf Grounds & Pitches",
      desc: "View and edit pitch specifications, turf formats, and photos."
    },
    Finances: {
      label: "Finances",
      title: "Revenue & MoMo Payout Ledger",
      desc: "Track completed matches, MTN & Airtel MoMo payouts, and statements."
    },
    Staff: {
      label: "Staff",
      title: "Pitch Marshals & Ground Staff",
      desc: "Manage venue staff, assign pitch roles, and grant booking permissions."
    },
    Settings: {
      label: "Settings",
      title: "Business & Venue Settings",
      desc: "Update venue contact information, operating rules, and policies."
    }
  };

  const currentMeta = tabMetadata[activeTab] || tabMetadata.Dashboard;

  const renderTabContent = () => {
    switch (activeTab) {
      case "Dashboard":
        return <OwnerOverview />;
      case "Bookings":
        return <BookingManager />;
      case "Finances":
        return <FinanceManager />;
      case "Staff":
        return <StaffManager />;
      case "Settings":
        return <BusinessSettings />;
      default:
        return <OwnerOverview />;
    }
  };

  return (
    <Layout>
      <div className="w-full bg-app-base text-text-primary font-sans min-h-[calc(100vh-4rem)]">
        {/* Responsive Executive Header / Sub-Header */}
        <div className="sticky top-0 z-20 bg-app-base/95 backdrop-blur-md border-b border-border-subtle px-3 sm:px-5 lg:px-8 py-3.5 shadow-sm">
          <div className="max-w-7xl mx-auto flex flex-col gap-3">
            {/* Desktop & Tablet Top Tier: Title, Status Badge, and Primary Action Bar */}
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[11px] sm:text-xs font-bold text-text-tertiary uppercase tracking-wider">
                  <span>Venue Operations</span>
                  <span className="text-border-prominent">/</span>
                  <span className="text-primary-lime">{currentMeta.label}</span>
                </div>
                <div className="flex items-center gap-2.5 mt-0.5">
                  <h1 className="text-lg sm:text-2xl font-extrabold text-text-primary tracking-tight truncate">
                    {currentMeta.title}
                  </h1>
                  <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                    Live · Kampala Hub
                  </span>
                </div>
              </div>

              {/* Action Buttons: Add Pitch & Tour */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => openWalkthrough(8)}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 bg-surface-card hover:bg-surface-raised text-text-secondary hover:text-text-primary border border-border-subtle rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95"
                  title="Launch Venue Owner Tour"
                >
                  <Compass size={15} className="text-primary-lime" />
                  <span className="hidden md:inline">Venue Guide</span>
                </button>

                <button
                  onClick={() => navigate("/owner/add-pitch")}
                  className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-primary-lime hover:bg-[#96E600] text-accent-text font-extrabold uppercase tracking-wider text-xs rounded-xl transition-all cursor-pointer active:scale-95 shadow-sm shadow-primary-lime/20"
                >
                  <Plus size={15} strokeWidth={2.5} />
                  <span>New Pitch</span>
                </button>
              </div>
            </div>

            {/* Navigation Tabs Bar: Optimized for Desktop, Tablet, and Mobile */}
            <div className="flex items-center justify-between border-t border-border-subtle/60 pt-2.5">
              {/* Touch-scrollable & Desktop Segmented Control */}
              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1 w-full lg:w-auto">
                {navTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      id={`owner-tab-${tab.id.toLowerCase()}`}
                      onClick={() => handleTabChange(tab.id)}
                      className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer select-none active:scale-95 min-h-[38px] ${
                        isActive
                          ? "bg-primary-lime text-accent-text shadow-sm shadow-primary-lime/20 font-extrabold"
                          : "bg-surface-card text-text-secondary hover:bg-surface-raised hover:text-text-primary border border-border-subtle"
                      }`}
                    >
                      <Icon 
                        size={14} 
                        strokeWidth={isActive ? 2.5 : 2} 
                        className={isActive ? "text-accent-text" : "text-text-tertiary"} 
                      />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Desktop Subtitle text for context */}
              <div className="hidden lg:block text-xs text-text-tertiary font-medium">
                {currentMeta.desc}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content Container */}
        <main className="w-full max-w-7xl mx-auto px-3 sm:px-5 lg:px-8 py-5 sm:py-7 pb-28 sm:pb-12">
          <div className="animate-fadeIn w-full">
            {renderTabContent()}
          </div>
        </main>
      </div>
    </Layout>
  );
};

