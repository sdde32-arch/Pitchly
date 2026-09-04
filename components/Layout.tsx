import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar,
  User,
  Home,
  LayoutDashboard,
  Trophy,
  Shield,
  LogOut,
  Settings,
  Map as MapIcon,
  ClipboardCheck,
  Presentation,
  ExternalLink,
} from "lucide-react";
import { useUser } from "../context/UserContext";
import { PlayerAvatar } from "./PlayerAvatars";
import { useNavigate, useLocation } from "react-router-dom";
import { RoleOnboarding } from "./onboarding/RoleOnboarding";
import { Logo } from "./Logo";
import { UpcomingMatchesBell } from "./UpcomingMatchesBell";
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
      "/owner/pitches",
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
  } = useUser();
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
        className={`flex flex-col items-center justify-center h-full transition-colors ${active ? "text-primary-lime font-bold" : "text-text-secondary hover:text-text-primary"}`}
      >
        <div
          className={`p-1.5 rounded-full flex items-center justify-center ${active ? "text-accent-text bg-primary-lime" : ""}`}
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
        className={`relative flex items-center gap-4 p-3.5 rounded-xl transition-all duration-300 w-full group ${active ? "bg-primary-lime/10 text-primary-lime" : "text-text-secondary hover:bg-surface-raised hover:text-text-primary"}`}
      >
        <span
          className={`material-symbols-outlined text-[22px] transition-transform ${active ? "scale-105 text-primary-lime" : ""}`}
          style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
        >
          {icon}
        </span>
        <span className="font-sans font-bold text-sm tracking-wide">{label}</span>
        {active && (
          <div className="absolute right-4 w-1.5 h-1.5 bg-primary-lime rounded-full shadow-[0_0_8px_#A8FF00]"></div>
        )}
      </button>
    );
  };
  const playerLinks = [
    { path: "/home", search: "", label: "Home", icon: "home" },
    { path: "/explore-map", search: "", label: "Explore", icon: "explore" },
    { path: "/invitations", search: "", label: "Proposals", icon: "mail" },
    { path: "/bookings", search: "", label: "Bookings", icon: "calendar_today" },
    { path: "/teams", search: "", label: "Squads", icon: "groups" },
    { path: "/profile", search: "", label: "Profile", icon: "person" },
  ];
  const ownerLinks = [
    {
      path: "/owner",
      search: "tab=Dashboard",
      label: "Dashboard",
      icon: "dashboard",
    },
    {
      path: "/invitations",
      search: "",
      label: "Proposals",
      icon: "mail",
    },
    {
      path: "/owner",
      search: "tab=Bookings",
      label: "Bookings",
      icon: "event_note",
    },
    {
      path: "/owner/pitches",
      search: "",
      label: "Facilities",
      icon: "stadium",
    },
    {
      path: "/owner",
      search: "tab=Finances",
      label: "Finances",
      icon: "account_balance_wallet",
    },
    { path: "/owner-profile", search: "", label: "Profile", icon: "person" },
  ];
  const adminLinks = [
    {
      path: "/admin/overview",
      search: "",
      label: "Admin Hub",
      icon: "admin_panel_settings",
    },
  ];
  let links = playerLinks;
  if (isOwner) links = ownerLinks;
  else links = playerLinks;
  if (isAdmin) {
    links = [...links, ...adminLinks];
  }
  const getRoleBadgeConfig = () => {
    if (
      userProfile?.id === "0uVlAOWTy7dpqAW5tsgxQVs4PW43" ||
      user?.uid === "0uVlAOWTy7dpqAW5tsgxQVs4PW43"
    ) {
      return { label: "Admin", color: "text-[#A78BFA]", bg: "bg-[#A78BFA]/10", border: "border-[#A78BFA]/25" };
    }
    const r = userProfile?.role?.toLowerCase() || role?.toLowerCase();
    if (r === "super_admin" || r === "admin") {
      return { label: r === "super_admin" ? "Super Admin" : "Admin", color: "text-[#A78BFA]", bg: "bg-[#A78BFA]/10", border: "border-[#A78BFA]/25" };
    }
    if (r === "owner") {
      return { label: "Pitch Owner", color: "text-[#38BDF8]", bg: "bg-[#38BDF8]/10", border: "border-[#38BDF8]/25" };
    }
    if (r === "staff") {
      return { label: "Staff", color: "text-[#38BDF8]", bg: "bg-[#38BDF8]/10", border: "border-[#38BDF8]/25" };
    }
    return { label: "Player", color: "text-primary-lime", bg: "bg-primary-lime/10", border: "border-primary-lime/25" };
  };

  const RoleBadge = () => {
    const badge = getRoleBadgeConfig();
    return (
      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${badge.border} ${badge.bg} shadow-xs`}>
        <Shield size={12} className={badge.color} />
        <span className={`text-[10px] font-bold ${badge.color} tracking-wider uppercase`}>
          {badge.label}
        </span>
      </div>
    );
  };

  return (
    <div className="flex h-[100dvh] bg-app-base text-text-primary font-body overflow-hidden selection:bg-primary-lime/30">
      {/* DESKTOP SIDEBAR */}
      {!hideDesktopSidebar && (
        <aside className="hidden lg:flex flex-col w-72 bg-surface-card border-r border-border-subtle h-full p-4 shrink-0 z-30 shadow-xs">
          <div className="flex flex-col items-center gap-4 mb-8 pl-1">
            <div className="cursor-pointer" onClick={() => navigate(isOwner ? "/owner" : "/home")}>
              <Logo
                size={38}
                showTagline={false}
                variant="auto"
                className="transform origin-left"
              />
            </div>
            <div className="flex items-center w-full pr-1 justify-between">
              <RoleBadge />
              <UpcomingMatchesBell />
            </div>
          </div>
          <div className="mb-6">
            <p className="font-bold text-[10px] uppercase tracking-widest text-text-tertiary px-3 mb-2">
              Menu
            </p>
            <nav className="space-y-1">
              {links.map((link) => {
                const active = isActive(link.path, link.search);
                return (
                  <button
                    key={link.label}
                    onClick={() =>
                      navigate(link.search ? `${link.path}?${link.search}` : link.path)
                    }
                    className={`relative flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-lime ${
                      active
                        ? "bg-primary-lime/10 text-primary-lime font-bold"
                        : "text-text-secondary hover:bg-surface-raised hover:text-text-primary"
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-[20px] transition-colors ${
                        active ? "text-primary-lime" : "text-text-tertiary"
                      }`}
                      style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      {link.icon}
                    </span>
                    <span>{link.label}</span>
                    {active && (
                      <div className="ml-auto w-1.5 h-1.5 bg-primary-lime rounded-full"></div>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
          <div className="mt-auto pt-4 border-t border-border-subtle space-y-1">
            <button
              onClick={() => navigate("/settings")}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl w-full text-xs font-medium text-text-secondary hover:bg-surface-raised hover:text-text-primary transition-all cursor-pointer group"
            >
              <Settings
                size={18}
                className="group-hover:rotate-90 transition-transform duration-300 text-text-tertiary"
              />
              <span>Settings</span>
            </button>
            <button
              onClick={handleLogout}
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
      )}
      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* GLOBAL TOP BAR */}
        {!hideMobileHeader && (
          <header className="bg-surface-card/90 backdrop-blur-md flex justify-between items-center w-full px-4 py-3 sticky top-0 z-50 border-b border-border-subtle lg:hidden">
            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => navigate(isOwner ? "/owner" : "/home")}
              >
                <Logo
                  size={32}
                  showText={true}
                  showTagline={false}
                  variant="auto"
                />
              </div>
              <RoleBadge />
            </div>
            <div className="flex items-center gap-2">
              <UpcomingMatchesBell />
              <button
                onClick={() => navigate("/profile")}
                className="w-11 h-11 rounded-full overflow-hidden border border-border-subtle shrink-0 flex items-center justify-center bg-surface-raised cursor-pointer active:scale-95 transition-transform"
                title="View Profile"
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
        <main id="main-content-scroll" className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
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
        {/* MOBILE NAVIGATION - SLEEK FLOATING PILL DOCK */}
        {!hideMobileNav && (
          <div className="lg:hidden fixed bottom-5 inset-x-0 z-40 px-4 pointer-events-none flex justify-center">
            <nav 
              className="pointer-events-auto w-full max-w-[360px] h-[58px] px-2 rounded-full bg-primary-lime shadow-[0_10px_30px_rgba(22,163,74,0.4)] border border-[#15803D]/20 flex justify-between items-center" 
              id="player-bottom-nav"
            >
              {links.slice(0, 5).map((link, index) => {
                const active = isActive(link.path, link.search);
                return (
                  <button
                    key={index}
                    onClick={() =>
                      navigate(
                        link.search ? `${link.path}?${link.search}` : link.path,
                      )
                    }
                    className={`relative flex flex-col items-center justify-center flex-1 h-[46px] rounded-full transition-all duration-300 cursor-pointer focus-visible:outline-none ${
                      active 
                        ? "bg-[#14532D] text-white font-bold shadow-inner" 
                        : "text-[#14532D]/80 hover:text-[#14532D]"
                    }`}
                  >
                    <span
                      className="material-symbols-outlined text-[20px] leading-none mb-0.5"
                      style={{
                        fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0",
                      }}
                    >
                      {link.icon}
                    </span>
                    <span className={`text-[10px] leading-tight tracking-tight whitespace-nowrap text-center ${active ? 'font-black' : 'font-bold'}`}>
                      {link.label}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};
