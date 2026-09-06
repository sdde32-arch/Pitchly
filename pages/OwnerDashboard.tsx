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
  Plus
} from "lucide-react";

export const OwnerDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
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
      <div className="w-full bg-app-base text-text-primary font-sans">
        {/* Sticky Sub-Header with Navigation Tabs */}
        <div className="sticky top-0 z-20 bg-app-base/95 backdrop-blur-md border-b border-border-subtle px-3 sm:px-4 md:px-6 pt-3 pb-2">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Scrollable / Touch-friendly Nav Tabs */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1 -mx-1 px-1">
              {navTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`owner-tab-${tab.id.toLowerCase()}`}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer select-none active:scale-95 ${
                      isActive
                        ? "bg-primary-lime text-accent-text shadow-sm shadow-primary-lime/20 font-extrabold"
                        : "bg-surface-card text-text-secondary hover:bg-surface-raised hover:text-text-primary border border-border-subtle"
                    }`}
                  >
                    <Icon size={15} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-accent-text" : "text-text-tertiary"} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
            {/* Quick Action Button */}
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <button
                onClick={() => navigate("/owner/add-pitch")}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-primary-lime/10 hover:bg-primary-lime/20 text-primary-lime border border-primary-lime/30 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95"
              >
                <Plus size={15} strokeWidth={2.5} />
                <span>New Pitch</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content Container */}
        <main className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-6 pb-20 sm:pb-8">
          <div className="animate-fadeIn w-full">
            {renderTabContent()}
          </div>
        </main>
      </div>
    </Layout>
  );
};

