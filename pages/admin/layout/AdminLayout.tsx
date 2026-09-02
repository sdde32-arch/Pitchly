import React from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../../../context/UserContext";
import {
  LayoutDashboard,
  Map,
  Users,
  Building,
  CalendarDays,
  CreditCard,
  ShieldAlert,
  Activity,
  Settings,
  LogOut,
  Shield,
  Presentation,
  ExternalLink,
  ArrowRightCircle,
  Eye,
} from "lucide-react";
import { Logo } from "../../../components/Logo";
import { PlayerAvatar } from "../../../components/PlayerAvatars";

export const AdminLayout: React.FC = () => {
  const { userProfile, user, signOut } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const navItems = [
    {
      path: "/admin/overview",
      label: "Overview",
      icon: <LayoutDashboard size={18} />,
    },
    { 
      path: "/admin/pitches", 
      label: "Pitch Reviews", 
      icon: <Map size={18} /> 
    },
    { 
      path: "/admin/users", 
      label: "Users", 
      icon: <Users size={18} /> 
    },
    { 
      path: "/admin/owners", 
      label: "Owners", 
      icon: <Building size={18} /> 
    },
    {
      path: "/admin/bookings",
      label: "Bookings",
      icon: <CalendarDays size={18} />,
    },
    {
      path: "/admin/payments",
      label: "Payments",
      icon: <CreditCard size={18} />,
    },
    {
      path: "/admin/reports",
      label: "Reports",
      icon: <ShieldAlert size={18} />,
    },
    {
      path: "/admin/audit-logs",
      label: "Audit Logs",
      icon: <Activity size={18} />,
    },
    {
      path: "/admin/settings",
      label: "Settings",
      icon: <Settings size={18} />,
    },
  ];

  return (
    <div className="h-[100dvh] overflow-hidden bg-app-base flex flex-col lg:flex-row text-text-primary font-sans">
      {/* Desktop Sidebar matching Player Portal Design */}
      <aside className="hidden lg:flex flex-col w-72 bg-surface-card border-r border-border-subtle h-full shrink-0 p-4 shadow-xs">
        {/* Brand & Role Header */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="cursor-pointer" onClick={() => navigate("/admin/overview")}>
            <Logo
              size={32}
              showText={true}
              showTagline={false}
              variant="auto"
            />
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#A78BFA]/25 bg-[#A78BFA]/10 shadow-xs">
            <Shield size={12} className="text-[#A78BFA]" />
            <span className="text-[10px] font-bold text-[#A78BFA] tracking-wider uppercase">
              Admin
            </span>
          </div>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-3 bg-surface-raised p-3 rounded-2xl border border-border-subtle mb-6">
          <div className="w-10 h-10 rounded-full bg-[#A78BFA]/15 text-[#A78BFA] border border-[#A78BFA]/30 flex items-center justify-center font-extrabold text-sm shrink-0">
            {userProfile?.name?.charAt(0) || "A"}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-xs font-bold text-text-primary truncate">
              {userProfile?.name || "Admin User"}
            </p>
            <p className="text-[10px] text-text-secondary truncate font-medium">
              {userProfile?.email || user?.email || "admin@pitchly.app"}
            </p>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="mb-6 flex-1 overflow-y-auto no-scrollbar">
          <p className="font-bold text-[10px] uppercase tracking-widest text-text-tertiary px-3 mb-2">
            Admin Console
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`relative flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-lime ${
                    active
                      ? "bg-primary-lime/10 text-primary-lime font-bold"
                      : "text-text-secondary hover:bg-surface-raised hover:text-text-primary"
                  }`}
                >
                  <span className={`shrink-0 transition-colors ${active ? "text-primary-lime" : "text-text-tertiary"}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {active && (
                    <div className="ml-auto w-1.5 h-1.5 bg-primary-lime rounded-full shadow-[0_0_8px_#A8FF00]"></div>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="mt-auto pt-4 border-t border-border-subtle space-y-1 shrink-0">
          <button
            onClick={() => navigate("/home")}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl w-full text-xs font-medium text-text-secondary hover:bg-surface-raised hover:text-primary-lime transition-all group cursor-pointer"
            title="Switch to Player Portal view"
          >
            <Eye size={18} className="text-primary-lime group-hover:scale-110 transition-transform" />
            <span>Player Portal</span>
            <ArrowRightCircle size={14} className="ml-auto opacity-60 group-hover:opacity-100 text-text-tertiary" />
          </button>

          <button
            onClick={() => navigate("/admin/settings")}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl w-full text-xs font-medium text-text-secondary hover:bg-surface-raised hover:text-text-primary transition-all cursor-pointer group"
          >
            <Settings
              size={18}
              className="group-hover:rotate-90 transition-transform duration-300 text-text-tertiary"
            />
            <span>Settings</span>
          </button>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl w-full text-xs font-medium text-[#EF4444] hover:bg-[#EF4444]/10 transition-all cursor-pointer group"
          >
            <LogOut
              size={18}
              className="group-hover:-translate-x-0.5 transition-transform text-[#EF4444]"
            />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header matching Player Portal */}
        <header className="bg-surface-card/90 backdrop-blur-md flex justify-between items-center w-full px-4 py-3 sticky top-0 z-50 border-b border-border-subtle lg:hidden">
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => navigate("/admin/overview")}
            >
              <Logo
                size={30}
                showText={true}
                showTagline={false}
                variant="auto"
              />
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-[#A78BFA]/25 bg-[#A78BFA]/10">
              <Shield size={11} className="text-[#A78BFA]" />
              <span className="text-[9px] font-bold text-[#A78BFA] tracking-wider uppercase">
                Admin
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/home")}
              className="px-2.5 py-1.5 rounded-full bg-surface-raised border border-border-subtle text-[11px] font-bold text-primary-lime flex items-center gap-1 cursor-pointer active:scale-95"
              title="Player View"
            >
              <Eye size={13} />
              <span className="hidden sm:inline">Player View</span>
            </button>
            <button
              onClick={handleSignOut}
              className="w-9 h-9 rounded-full bg-surface-raised border border-border-subtle text-[#EF4444] hover:bg-[#EF4444]/10 flex items-center justify-center cursor-pointer transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Mobile Sub-Navigation Bar matching sleek pills */}
        <div className="lg:hidden bg-surface-card border-b border-border-subtle px-3 py-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 min-w-max">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    active
                      ? "bg-primary-lime text-accent-text shadow-xs"
                      : "bg-surface-raised text-text-secondary hover:text-text-primary border border-border-subtle"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto no-scrollbar scroll-smooth bg-app-base">
          <div className="w-full min-h-full max-w-7xl mx-auto pb-16 overflow-x-hidden p-4">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
