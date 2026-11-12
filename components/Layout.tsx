import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar,
  CalendarCheck,
  User,
  Home,
  LayoutDashboard,
  Trophy,
  Shield,
  LogOut,
  Settings,
  Building2,
  Wallet,
  Users,
  Mail,
  Compass,
  Map as MapIcon,
  ClipboardCheck,
  Presentation,
  ExternalLink,
  ChevronRight,
  Sparkles,
  MoreHorizontal,
  X,
  Repeat,
  Building,
} from "lucide-react";
import { useUser } from "../context/UserContext";
import { useInteractiveWalkthrough } from "../context/InteractiveWalkthroughContext";
import { PlayerAvatar } from "./PlayerAvatars";
import { useNavigate, useLocation } from "react-router-dom";
import { RoleOnboarding } from "./onboarding/RoleOnboarding";
import { Logo } from "./Logo";
import { UpcomingMatchesBell } from "./UpcomingMatchesBell";
import { PWAInstallButton } from "./PWAInstallButton";
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { slotAlertService } from "../services/slotAlertService";

interface LayoutProps {
  children: React.ReactNode;
}
export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Hide mobile bottom navigation bar on transaction/details/chat/support/settings screens to prevent overlapping
  const hideMobileNav = React.useMemo(() => {
    const hiddenPaths = [
      "/checkout",
      "/booking-confirmation",
      "/chat/",
      "/turf/",
      "/owner/add-pitch",
      "/owner/edit-pitch",
      "/support",
      "/settings"
    ];
    return hiddenPaths.some(p => location.pathname.startsWith(p));
  }, [location.pathname]);

  const hideMobileHeader = React.useMemo(() => {
    const hiddenPaths = [
      "/checkout",
      "/booking-confirmation",
      "/turf"
    ];
    return hiddenPaths.some(p => location.pathname.startsWith(p));
  }, [location.pathname]);

  const [avatarError, setAvatarError] = React.useState(false);
  const [showOwnerMoreMenu, setShowOwnerMoreMenu] = React.useState(false);

  const hideDesktopSidebar = React.useMemo(() => {
    return location.pathname.startsWith("/turf");
  }, [location.pathname]);
  const {
    role,
    isAdmin,
    isStaff,
    isOwner,
    userProfile,
    user,
    signOut,
    switchRole,
  } = useUser();
  const { openWalkthrough } = useInteractiveWalkthrough();
  const [showOnboarding, setShowOnboarding] = React.useState(false);
  const [slotNotifs, setSlotNotifs] = React.useState<any[]>([]);
  const [activeSubs, setActiveSubs] = React.useState<any[]>([]);
  const activeSubsRef = React.useRef<any[]>([]);

  // Keep a stable ref of active pending subscriptions for our cancellation listener
  React.useEffect(() => {
    activeSubsRef.current = activeSubs;
  }, [activeSubs]);

  // 1. Listen to active, pending slot alert subscriptions for the current user
  React.useEffect(() => {
    if (!user) {
      setActiveSubs([]);
      return;
    }

    const q = query(
      collection(db, "slotAlertSubscriptions"),
      where("userId", "==", user.uid),
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const subs: any[] = [];
      snapshot.forEach((docSnap) => {
        subs.push({ id: docSnap.id, ...docSnap.data() });
      });
      setActiveSubs(subs);
    }, (err) => {
      console.error("Error listening to slot alert subscriptions:", err);
    });

    return () => unsubscribe();
  }, [user]);

  // 2. Listen to public slotCancellations and match against our active subscriptions in memory
  React.useEffect(() => {
    if (!user) return;

    // Only process cancellation events created after our current session started
    const sessionStartTime = new Date().toISOString();
    const q = query(
      collection(db, "slotCancellations"),
      where("cancelledAt", ">=", sessionStartTime)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === "added") {
          const cancellation = change.doc.data();
          
          // Filter matching subscriptions from active ones
          const matches = activeSubsRef.current.filter(
            (sub) =>
              sub.pitchId === cancellation.pitchId &&
              sub.date === cancellation.date &&
              sub.time === cancellation.time
          );

          for (const sub of matches) {
            try {
              // Create local notification document
              const notificationId = `notif-${user.uid}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
              const notifRef = doc(db, "slotNotifications", notificationId);
              
              await setDoc(notifRef, {
                id: notificationId,
                userId: user.uid,
                pitchId: sub.pitchId,
                pitchName: sub.pitchName || cancellation.pitchName,
                date: sub.date,
                time: sub.time,
                triggeredAt: cancellation.cancelledAt || new Date().toISOString(),
                read: false,
              });

              // Mark subscription as triggered/notified
              const subRef = doc(db, "slotAlertSubscriptions", sub.id);
              await updateDoc(subRef, {
                status: "triggered",
              });

              console.log(`Matched cancellation event, triggered notification ${notificationId} for subscription ${sub.id}`);
            } catch (err) {
              console.error("Error triggering notification from cancellation event:", err);
            }
          }
        }
      });
    }, (err) => {
      console.error("Error listening to slot cancellations:", err);
    });

    return () => unsubscribe();
  }, [user]);

  // 3. Listen to unread slot notifications for the current user (for notification indicator)
  React.useEffect(() => {
    if (!user) {
      setSlotNotifs([]);
      return;
    }

    const q = query(
      collection(db, "slotNotifications"),
      where("userId", "==", user.uid),
      where("read", "==", false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: any[] = [];
      snapshot.forEach((docSnap) => {
        notifs.push({ id: docSnap.id, ...docSnap.data() });
      });
      notifs.sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime());
      setSlotNotifs(notifs);
    }, (err) => {
      console.error("Error listening to slot notifications:", err);
      handleFirestoreError(err, OperationType.GET, "slotNotifications");
    });

    return () => unsubscribe();
  }, [user]);

  React.useEffect(() => {
    if (
      userProfile &&
      !isAdmin &&
      userProfile.hasCompletedOnboarding === false
    ) {
      setShowOnboarding(true);
    }
  }, [userProfile, isAdmin]);
  if (showOnboarding) {
    return <RoleOnboarding onComplete={() => setShowOnboarding(false)} />;
  }
  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/auth", { replace: true });
    } catch (e) {
      console.warn(e);
      navigate("/auth", { replace: true });
    }
  };
  const isActive = (path: string, search?: string) => {
    if (search) {
      return location.pathname === path && location.search.includes(search);
    }
    return location.pathname === path;
  };
  const NavItem = ({
    path,
    search,
    icon,
    label,
    desktopOnly,
    isCenter,
    action,
  }: {
    path?: string;
    search?: string;
    icon: string;
    label: string;
    desktopOnly?: boolean;
    isCenter?: boolean;
    action?: () => void;
  }) => {
    const active = path ? isActive(path, search) : false;
    if (desktopOnly) return null;
    const handleClick = () => {
      if (action) {
        action();
      } else if (path) {
        navigate(search ? `${path}?${search}` : path);
      }
    };
    if (isCenter) {
      return (
        <button
          onClick={handleClick}
          className="relative -top-4 group flex flex-col items-center hidden"
        >
          {" "}
        </button>
      );
    }
    return (
      <button
        onClick={handleClick}
        className={`flex flex-col items-center justify-center h-full transition-colors ${active ? "text-nav-active-text font-bold" : "text-nav-text-muted hover:text-nav-text"}`}
      >
        <div
          className={`p-1.5 rounded-full flex items-center justify-center ${active ? "text-nav-active-text bg-nav-active-bg" : ""}`}
        >
          <span
            className="material-symbols-outlined text-[24px] transition-transform duration-300"
            style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
          >
            {icon}
          </span>
        </div>
      </button>
    );
  };
  const DesktopNavItem = ({
    path,
    search,
    icon,
    label,
    action,
  }: {
    path?: string;
    search?: string;
    icon: string;
    label: string;
    action?: () => void;
  }) => {
    const active = path ? isActive(path, search) : false;
    const handleClick = () => {
      if (action) {
        action();
      } else if (path) {
        navigate(search ? `${path}?${search}` : path);
      }
    };
    return (
      <button
        onClick={handleClick}
        className={`relative flex items-center gap-4 p-3.5 rounded-xl transition-all duration-300 w-full group ${active ? "bg-nav-active-bg text-nav-active-text" : "text-nav-text-muted hover:bg-white/[0.06] hover:text-nav-text"}`}
      >
        <span
          className={`material-symbols-outlined text-[22px] transition-transform ${active ? "scale-105 text-nav-active-text" : ""}`}
          style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
        >
          {icon}
        </span>
        <span className="font-sans font-bold text-sm tracking-wide">{label}</span>
        {active && (
          <div className="absolute right-4 w-1.5 h-1.5 bg-nav-active-text rounded-full shadow-[0_0_8px_#A8FF00]"></div>
        )}
      </button>
    );
  };
  const playerLinks = [
    { path: "/home", search: "", label: "Home", icon: Home },
    { path: "/tournament", search: "", label: "Tournament", icon: Trophy },
    { path: "/explore-map", search: "", label: "Explore", icon: Compass },
    { path: "/bookings", search: "", label: "Bookings", icon: Calendar },
    { path: "/teams", search: "", label: "Squads", icon: Users },
    { path: "/profile", search: "", label: "Profile", icon: User },
  ];
  const ownerLinks = [
    {
      path: "/owner",
      search: "tab=Dashboard",
      label: "Overview",
      icon: LayoutDashboard,
    },
    {
      path: "/owner",
      search: "tab=Bookings",
      label: "Bookings",
      icon: CalendarCheck,
    },
    {
      path: "/owner/pitches",
      search: "",
      label: "Facilities",
      icon: Building2,
    },
    {
      path: "/owner",
      search: "tab=Finances",
      label: "Finances",
      icon: Wallet,
    },
    {
      path: "/owner",
      search: "tab=Staff",
      label: "Staff",
      icon: Users,
    },
    {
      path: "/tournament",
      search: "",
      label: "Tournament",
      icon: Trophy,
    },
    {
      path: "/invitations",
      search: "",
      label: "Proposals",
      icon: Mail,
    },
    {
      path: "/owner",
      search: "tab=Settings",
      label: "Settings",
      icon: Settings,
    },
  ];
  const adminLinks = [
    {
      path: "/admin/overview",
      search: "",
      label: "Admin Hub",
      icon: Shield,
    },
    {
      path: "/admin/tournaments",
      search: "",
      label: "Tournament Ops",
      icon: Trophy,
    },
  ];
  let links = playerLinks;
  if (isOwner) links = ownerLinks;
  else links = playerLinks;
  if (isAdmin) {
    links = [...links, ...adminLinks];
  }
  const getRoleBadgeConfig = () => {
    if (isAdmin) {
      return { label: "Admin", color: "text-nav-admin", bg: "bg-nav-admin-tint", border: "border-nav-admin-border" };
    }
    const r = userProfile?.role?.toLowerCase() || role?.toLowerCase();
    if (r === "super_admin" || r === "admin") {
      return { label: r === "super_admin" ? "Super Admin" : "Admin", color: "text-nav-admin", bg: "bg-nav-admin-tint", border: "border-nav-admin-border" };
    }
    if (r === "owner") {
      return { label: "Pitch Owner", color: "text-nav-owner", bg: "bg-nav-owner-tint", border: "border-nav-owner-border" };
    }
    if (r === "staff") {
      return { label: "Staff", color: "text-nav-owner", bg: "bg-nav-owner-tint", border: "border-nav-owner-border" };
    }
    return { label: "Player", color: "text-nav-active-text", bg: "bg-nav-active-bg", border: "border-nav-active-text/25" };
  };

  const renderRoleBadge = () => {
    const badge = getRoleBadgeConfig();
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${badge.border} ${badge.bg}`}>
        <Shield size={12} className={badge.color} />
        <span className={`text-[10px] font-bold ${badge.color} tracking-wider uppercase`}>
          {badge.label}
        </span>
      </div>
    );
  };

  return (
    <div className="flex h-screen w-full bg-app-base text-text-primary font-body overflow-hidden selection:bg-primary-lime/30">
      {/* DESKTOP SIDEBAR */}
      {!hideDesktopSidebar && (
        <aside className="hidden lg:flex flex-col w-64 bg-nav-bg border-r border-nav-border h-full shrink-0 z-30 shadow-xs select-none text-nav-text">
          {/* Brand Header */}
          <div className="p-4 border-b border-nav-border space-y-3">
            <div className="flex items-center justify-between">
              <div
                className="cursor-pointer"
                onClick={() => navigate(isOwner ? "/owner" : "/home")}
              >
                <Logo
                  size={32}
                  showTagline={false}
                  variant="dark"
                />
              </div>
              <UpcomingMatchesBell />
            </div>

            <div className="flex items-center justify-between pt-1">
              {renderRoleBadge()}
              <span className="text-[10px] font-bold text-nav-text-muted uppercase tracking-wider">
                {isOwner ? "Portal" : "App"}
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto p-3 space-y-5 no-scrollbar">
            <div>
              <p className="font-bold text-[10px] uppercase tracking-widest text-nav-text-muted px-3 mb-1.5">
                {isOwner ? "Facility Management" : "Main Navigation"}
              </p>
              <nav className="space-y-1">
                {links.map((link) => {
                  const active = isActive(link.path, link.search);
                  const Icon = link.icon;
                  return (
                    <button
                      key={link.label}
                      onClick={() =>
                        navigate(link.search ? `${link.path}?${link.search}` : link.path)
                      }
                      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-lime ${
                        active
                          ? "bg-nav-active-bg text-nav-active-text font-extrabold shadow-sm"
                          : "text-nav-text-muted hover:bg-white/[0.06] hover:text-nav-text"
                      }`}
                    >
                      <Icon
                        size={17}
                        strokeWidth={active ? 2.5 : 2}
                        className={`shrink-0 transition-colors ${
                          active ? "text-nav-active-text" : "text-nav-text-muted"
                        }`}
                      />
                      <span className="truncate">{link.label}</span>
                      {active && (
                        <div className="ml-auto w-1.5 h-1.5 bg-nav-active-text rounded-full shadow-[0_0_8px_#A8FF00]" />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Sidebar Footer: PWA Install, User Card & Logout */}
          <div className="p-3 border-t border-nav-border space-y-2 shrink-0 bg-white/[0.02]">
            <button
              type="button"
              onClick={() => openWalkthrough()}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-bold text-nav-active-text bg-nav-active-bg hover:bg-primary-lime/20 border border-primary-lime/30 transition-all cursor-pointer shadow-xs active:scale-98"
              title="Open Pitchly Master Walkthrough & Guide"
            >
              <div className="flex items-center gap-2">
                <Compass size={15} className="text-nav-active-text animate-spin-slow" />
                <span>App Walkthrough</span>
              </div>
              <Sparkles size={12} className="text-nav-active-text" />
            </button>
            <PWAInstallButton variant="sidebar" />
            <div
              onClick={() => navigate(isOwner ? "/owner-profile" : "/profile")}
              className="flex items-center justify-between p-2 rounded-xl bg-white/[0.04] border border-nav-border hover:border-nav-active-text/40 cursor-pointer transition-colors"
              title={isOwner ? "Owner Business Profile & Banking" : "Player Profile & Stats"}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-nav-border flex items-center justify-center text-nav-text-muted shrink-0 overflow-hidden">
                  {userProfile?.avatar && !avatarError ? (
                    <img
                      src={userProfile.avatar}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <User size={16} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-nav-text truncate">
                    {userProfile?.name || user?.displayName || (isOwner ? "Pitch Owner" : "Footballer")}
                  </p>
                  <p className="text-[10px] text-nav-text-muted truncate">
                    {user?.email || "verified account"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 pt-1">
              <button
                onClick={() => navigate("/settings")}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-nav-text-muted hover:bg-white/[0.06] hover:text-nav-text border border-transparent hover:border-nav-border transition-all cursor-pointer"
                title="Account Settings"
              >
                <Settings size={14} />
                <span>Settings</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center p-2 rounded-lg text-[#EF4444] hover:bg-[#EF4444]/10 border border-transparent hover:border-[#EF4444]/20 transition-all cursor-pointer"
                title="Log out"
                aria-label="Log out"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </aside>
      )}
      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0">
        {/* GLOBAL TOP BAR */}
        {!hideMobileHeader && (
          <header className="bg-nav-bg-glass backdrop-blur-md flex justify-between items-center w-full px-4 py-3 sticky top-0 z-50 border-b border-nav-border lg:hidden text-nav-text">
            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => navigate(isOwner ? "/owner" : "/home")}
              >
                <Logo
                  size={32}
                  showText={true}
                  showTagline={false}
                  variant="dark"
                />
              </div>
              {renderRoleBadge()}
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => openWalkthrough()}
                className="w-9 h-9 rounded-full flex items-center justify-center bg-nav-active-bg hover:bg-primary-lime/20 border border-primary-lime/30 text-nav-active-text cursor-pointer active:scale-95 transition-all shrink-0"
                title="Pitchly App Walkthrough & Guide"
                aria-label="App Walkthrough & Guide"
              >
                <Compass size={16} className="text-nav-active-text animate-spin-slow" />
              </button>
              <PWAInstallButton variant="compact" />
              <UpcomingMatchesBell />
              <button
                onClick={() => navigate(isOwner ? "/owner-profile" : "/profile")}
                className="w-11 h-11 rounded-full overflow-hidden border border-nav-border shrink-0 flex items-center justify-center bg-white/[0.06] cursor-pointer active:scale-95 transition-transform"
                title={isOwner ? "Owner Business Profile & Banking" : "Player Profile & Stats"}
              >
                <PlayerAvatar id={userProfile?.avatarId} className="w-full h-full" />
              </button>
            </div>
          </header>
        )}
        {slotNotifs.length > 0 && (
          <div className="bg-[#FACC15]/10 border-b border-[#FACC15]/30 text-text-primary px-4 py-3 flex flex-col sm:flex-row justify-between items-center sm:items-center gap-3 animate-fadeIn z-50">
            <div className="flex gap-3 items-center">
              <span className="material-symbols-outlined text-[#FACC15] text-[22px] shrink-0 animate-bounce">
                notifications_active
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#FACC15]">
                  slot available alert
                </p>
                <p className="text-xs font-medium text-text-primary">
                  Slot on <strong className="text-[#FACC15]">{slotNotifs[0].date}</strong> at <strong className="text-[#FACC15]">{slotNotifs[0].time}</strong> is open at <strong>{slotNotifs[0].pitchName}</strong>!
                </p>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
              <button
                onClick={async () => {
                  const notif = slotNotifs[0];
                  await slotAlertService.markAsRead(notif.id);
                  navigate(`/checkout/${notif.pitchId}?date=${notif.date}&time=${notif.time}`);
                }}
                className="px-3 py-1.5 bg-primary-lime text-accent-text font-bold text-xs rounded-full hover:bg-[#96E600] transition-colors active:scale-95 flex items-center gap-1 cursor-pointer"
              >
                Book now
              </button>
              <button
                onClick={async () => {
                  const notif = slotNotifs[0];
                  await slotAlertService.markAsRead(notif.id);
                }}
                className="px-3 py-1.5 bg-surface-raised text-text-secondary hover:text-text-primary font-medium text-xs rounded-full hover:bg-border-subtle transition-colors active:scale-95 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
        <main id="main-content-scroll" className="flex-1 overflow-y-auto no-scrollbar scroll-smooth w-full">
          <div className="w-full min-h-full lg:max-w-7xl lg:mx-auto pb-16 overflow-x-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="w-full h-full"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
        {/* MOBILE NAVIGATION - SLEEK MODERN FLOATING DOCK */}
        {/* MOBILE NAVIGATION - SLEEK MODERN FLOATING DOCK */}
        {!hideMobileNav && (
          <div className="lg:hidden fixed bottom-5 inset-x-0 z-40 px-4 pointer-events-none flex justify-center">
            <nav 
              className="pointer-events-auto w-full max-w-[390px] h-[58px] px-2 rounded-full bg-nav-bg-glass backdrop-blur-xl shadow-[0_12px_36px_rgba(0,0,0,0.35)] border border-nav-border flex justify-between items-center" 
              id="app-bottom-nav"
            >
              {isOwner ? (
                <>
                  {[
                    { path: "/owner", search: "tab=Dashboard", label: "Overview", icon: LayoutDashboard },
                    { path: "/owner/pitches", search: "", label: "Facilities", icon: Building2 },
                    { path: "/owner", search: "tab=Bookings", label: "Bookings", icon: CalendarCheck },
                    { path: "/owner", search: "tab=Finances", label: "Finances", icon: Wallet },
                  ].map((item, index) => {
                    const active = isActive(item.path, item.search) && !showOwnerMoreMenu;
                    const IconComponent = item.icon;
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          setShowOwnerMoreMenu(false);
                          navigate(item.search ? `${item.path}?${item.search}` : item.path);
                        }}
                        className={`relative flex flex-col items-center justify-center flex-1 h-[44px] rounded-full transition-all duration-200 cursor-pointer focus-visible:outline-none ${
                          active 
                            ? "bg-nav-active-bg text-nav-active-text font-extrabold shadow-sm" 
                            : "text-nav-text-muted hover:text-nav-text hover:bg-white/[0.06]"
                        }`}
                      >
                        <IconComponent
                          size={18}
                          strokeWidth={active ? 2.5 : 2}
                          className="mb-0.5 shrink-0"
                        />
                        <span className={`text-[10px] leading-tight tracking-tight whitespace-nowrap text-center ${active ? 'font-black' : 'font-semibold'}`}>
                          {item.label}
                        </span>
                      </button>
                    );
                  })}

                  {/* 5th Tab: More Drawer Trigger */}
                  <button
                    onClick={() => setShowOwnerMoreMenu(prev => !prev)}
                    className={`relative flex flex-col items-center justify-center flex-1 h-[44px] rounded-full transition-all duration-200 cursor-pointer focus-visible:outline-none ${
                      showOwnerMoreMenu 
                        ? "bg-nav-active-bg text-nav-active-text font-extrabold shadow-sm" 
                        : "text-nav-text-muted hover:text-nav-text hover:bg-white/[0.06]"
                    }`}
                  >
                    <MoreHorizontal
                      size={18}
                      strokeWidth={showOwnerMoreMenu ? 2.5 : 2}
                      className="mb-0.5 shrink-0"
                    />
                    <span className={`text-[10px] leading-tight tracking-tight whitespace-nowrap text-center ${showOwnerMoreMenu ? 'font-black' : 'font-semibold'}`}>
                      More
                    </span>
                  </button>
                </>
              ) : (
                links.slice(0, 5).map((link, index) => {
                  const active = isActive(link.path, link.search);
                  const IconComponent = link.icon;
                  return (
                    <button
                      key={index}
                      onClick={() =>
                        navigate(
                          link.search ? `${link.path}?${link.search}` : link.path,
                        )
                      }
                      className={`relative flex flex-col items-center justify-center flex-1 h-[44px] rounded-full transition-all duration-200 cursor-pointer focus-visible:outline-none ${
                        active 
                          ? "bg-nav-active-bg text-nav-active-text font-extrabold shadow-sm" 
                          : "text-nav-text-muted hover:text-nav-text hover:bg-white/[0.06]"
                      }`}
                    >
                      <IconComponent
                        size={18}
                        strokeWidth={active ? 2.5 : 2}
                        className="mb-0.5 shrink-0"
                      />
                      <span className={`text-[10px] leading-tight tracking-tight whitespace-nowrap text-center ${active ? 'font-black' : 'font-semibold'}`}>
                        {link.label}
                      </span>
                    </button>
                  );
                })
              )}
            </nav>
          </div>
        )}

        {/* OWNER MORE OPERATIONS BOTTOM SHEET DRAWER */}
        <AnimatePresence>
          {showOwnerMoreMenu && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowOwnerMoreMenu(false)}
                className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 lg:hidden"
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 26, stiffness: 320 }}
                className="fixed bottom-0 inset-x-0 bg-nav-bg border-t border-nav-border rounded-t-3xl p-5 z-50 lg:hidden shadow-2xl max-h-[85vh] overflow-y-auto text-nav-text"
              >
                <div className="flex items-center justify-between pb-3.5 border-b border-nav-border">
                  <div>
                    <h3 className="text-sm font-extrabold text-nav-text tracking-tight">Facility Ops & Actions</h3>
                    <p className="text-[11px] text-nav-text-muted">Quick access to all owner tools</p>
                  </div>
                  <button
                    onClick={() => setShowOwnerMoreMenu(false)}
                    className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-nav-text-muted hover:text-nav-text cursor-pointer active:scale-95"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5 py-4">
                  <button
                    onClick={() => {
                      setShowOwnerMoreMenu(false);
                      navigate("/owner-profile");
                    }}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.04] border border-nav-border hover:border-nav-active-text/40 text-left transition-colors cursor-pointer active:scale-98"
                  >
                    <div className="w-8 h-8 rounded-lg bg-nav-active-bg text-nav-active-text flex items-center justify-center shrink-0">
                      <Building size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-nav-text truncate">Business Profile</p>
                      <p className="text-[10px] text-nav-text-muted truncate">MoMo & banking</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowOwnerMoreMenu(false);
                      navigate("/owner?tab=Staff");
                    }}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.04] border border-nav-border hover:border-nav-active-text/40 text-left transition-colors cursor-pointer active:scale-98"
                  >
                    <div className="w-8 h-8 rounded-lg bg-nav-owner-tint text-nav-owner flex items-center justify-center shrink-0">
                      <Users size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-nav-text truncate">Staff & Crew</p>
                      <p className="text-[10px] text-nav-text-muted truncate">Pitch caretakers</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowOwnerMoreMenu(false);
                      navigate("/tournament");
                    }}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.04] border border-nav-border hover:border-nav-active-text/40 text-left transition-colors cursor-pointer active:scale-98"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#FACC15]/10 text-[#FACC15] flex items-center justify-center shrink-0">
                      <Trophy size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-nav-text truncate">Tournaments</p>
                      <p className="text-[10px] text-nav-text-muted truncate">Public events</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowOwnerMoreMenu(false);
                      navigate("/invitations");
                    }}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.04] border border-nav-border hover:border-nav-active-text/40 text-left transition-colors cursor-pointer active:scale-98"
                  >
                    <div className="w-8 h-8 rounded-lg bg-nav-admin-tint text-nav-admin flex items-center justify-center shrink-0">
                      <Mail size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-nav-text truncate">Proposals</p>
                      <p className="text-[10px] text-nav-text-muted truncate">Match invites</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowOwnerMoreMenu(false);
                      navigate("/owner?tab=Settings");
                    }}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.04] border border-nav-border hover:border-nav-active-text/40 text-left transition-colors cursor-pointer col-span-2 active:scale-98"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/[0.06] text-nav-text-muted flex items-center justify-center shrink-0 border border-nav-border">
                      <Settings size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-nav-text truncate">Venue Settings & Policies</p>
                      <p className="text-[10px] text-nav-text-muted truncate">Operating hours, rules, & cancellation terms</p>
                    </div>
                  </button>
                </div>

                <div className="pt-3 border-t border-nav-border space-y-2">
                  <button
                    onClick={async () => {
                      setShowOwnerMoreMenu(false);
                      await switchRole();
                      navigate("/home");
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-nav-active-bg text-nav-active-text hover:bg-primary-lime/20 border border-primary-lime/30 font-bold text-xs transition-colors cursor-pointer active:scale-98"
                  >
                    <Repeat size={14} />
                    <span>Switch to Player View</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowOwnerMoreMenu(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-bold text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors cursor-pointer"
                  >
                    <LogOut size={14} />
                    <span>Log Out</span>
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
