import React from "react";
import {
  Home,
  Compass,
  Calendar,
  MessageSquare,
  Users,
  User,
  LayoutDashboard,
  Building2,
  CalendarCheck,
  Wallet,
  MoreHorizontal,
  LucideIcon,
} from "lucide-react";
import { FEATURES } from "../../config/features";

export interface MobileNavItem {
  id: string;
  label: string;
  path: string;
  search?: string;
  icon: LucideIcon;
  matchPaths?: string[];
}

interface MobileBottomNavProps {
  isOwner: boolean;
  pathname: string;
  search: string;
  showOwnerMoreMenu: boolean;
  ownerWaitingCount?: number;
  onNavigate: (target: string) => void;
  onToggleOwnerMore: () => void;
  onCloseOwnerMore: () => void;
}

const PLAYER_MOBILE_TABS: MobileNavItem[] = [
  {
    id: "home",
    label: "Home",
    path: "/home",
    icon: Home,
    matchPaths: ["/home"],
  },
  ...(FEATURES.squads
    ? [
        {
          id: "teams",
          label: "Teams",
          path: "/teams",
          icon: Users,
          matchPaths: ["/teams", "/join-team"],
        },
      ]
    : [
        {
          id: "explore",
          label: "Explore",
          path: "/explore-map",
          icon: Compass,
          matchPaths: ["/explore-map"],
        },
      ]),
  {
    id: "bookings",
    label: "Bookings",
    path: "/bookings",
    icon: Calendar,
    matchPaths:
      FEATURES.matchInvites && FEATURES.squads
        ? ["/bookings", "/match-summary"]
        : ["/bookings"],
  },
  {
    id: "messages",
    label: "Messages",
    path: "/chat",
    icon: MessageSquare,
    matchPaths: ["/chat"],
  },
  {
    id: "profile",
    label: "Profile",
    path: "/profile",
    icon: User,
    matchPaths: ["/profile"],
  },
];

const OWNER_MOBILE_TABS: MobileNavItem[] = [
  {
    id: "owner-overview",
    label: "Today",
    path: "/owner",
    search: "tab=Today",
    icon: LayoutDashboard,
  },
  {
    id: "owner-facilities",
    label: "Facilities",
    path: "/owner/pitches",
    icon: Building2,
    matchPaths: ["/owner/pitches"],
  },
  {
    id: "owner-bookings",
    label: "Bookings",
    path: "/owner",
    search: "tab=Bookings",
    icon: CalendarCheck,
  },
  {
    id: "owner-finances",
    label: "Finances",
    path: "/owner",
    search: "tab=Finances",
    icon: Wallet,
  },
];

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  isOwner,
  pathname,
  search,
  showOwnerMoreMenu,
  ownerWaitingCount = 0,
  onNavigate,
  onToggleOwnerMore,
  onCloseOwnerMore,
}) => {
  const isTabActive = (item: MobileNavItem): boolean => {
    if (item.search) {
      if (item.search === "tab=Today" && pathname === "/owner" && !search.includes("tab=")) {
        return true;
      }
      return pathname === item.path && search.includes(item.search);
    }
    if (item.matchPaths && item.matchPaths.length > 0) {
      return item.matchPaths.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
      );
    }
    return pathname === item.path;
  };

  const handleTabPress = (item: MobileNavItem, active: boolean) => {
    if (isOwner) {
      onCloseOwnerMore();
    }
    if (active) {
      const mainScroll = document.getElementById("main-content-scroll");
      if (mainScroll && mainScroll.scrollTop > 0) {
        mainScroll.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }
    onNavigate(item.search ? `${item.path}?${item.search}` : item.path);
  };

  const tabs = isOwner ? OWNER_MOBILE_TABS : PLAYER_MOBILE_TABS;

  return (
    <nav
      id="app-bottom-nav"
      aria-label={isOwner ? "Owner mobile navigation" : "Primary mobile navigation"}
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-nav-bg-glass backdrop-blur-xl border-t border-nav-border shadow-[0_-8px_28px_rgba(0,0,0,0.22)] pb-[env(safe-area-inset-bottom)]"
    >
      <div
        className={`max-w-lg mx-auto h-16 px-2 grid items-center gap-1 ${
          isOwner || tabs.length === 5 ? "grid-cols-5" : "grid-cols-4"
        }`}
      >
        {tabs.map((item) => {
          const active = isOwner ? isTabActive(item) && !showOwnerMoreMenu : isTabActive(item);
          const IconComponent = item.icon;
          return (
            <button
              key={item.id}
              id={`mobile-nav-${item.id}`}
              type="button"
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              onClick={() => handleTabPress(item, active)}
              className={`relative flex flex-col items-center justify-center min-h-[48px] min-w-[44px] w-full rounded-xl px-1 py-1.5 transition-colors duration-150 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-lime focus-visible:ring-inset active:scale-[0.97] ${
                active
                  ? "bg-nav-active-bg text-nav-active-text"
                  : "text-nav-text-muted hover:text-nav-text hover:bg-white/[0.05]"
              }`}
            >
              {active && (
                <span
                  aria-hidden="true"
                  className="absolute top-0.5 w-6 h-0.5 rounded-full bg-nav-active-text"
                />
              )}
              <IconComponent
                size={21}
                strokeWidth={active ? 2.4 : 1.85}
                className="shrink-0"
                aria-hidden={true}
              />
              {isOwner && item.id === "owner-overview" && ownerWaitingCount > 0 && (
                <span
                  aria-label={`${ownerWaitingCount} waiting for approval`}
                  className="absolute top-1 right-2 min-w-[20px] h-5 px-1 rounded-full bg-[#EF4444] text-white text-[11px] font-extrabold leading-none flex items-center justify-center tabular-nums shadow-sm"
                >
                  {ownerWaitingCount > 99 ? "99+" : ownerWaitingCount}
                </span>
              )}
              <span
                className={`mt-1 text-[11px] leading-tight tracking-tight whitespace-nowrap ${
                  active ? "font-bold" : "font-medium"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}

        {isOwner && (
          <button
            id="mobile-nav-owner-more"
            type="button"
            aria-label="More owner options"
            aria-expanded={showOwnerMoreMenu}
            aria-haspopup="dialog"
            onClick={onToggleOwnerMore}
            className={`relative flex flex-col items-center justify-center min-h-[48px] min-w-[44px] w-full rounded-xl px-1 py-1.5 transition-colors duration-150 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-lime focus-visible:ring-inset active:scale-[0.97] ${
              showOwnerMoreMenu
                ? "bg-nav-active-bg text-nav-active-text"
                : "text-nav-text-muted hover:text-nav-text hover:bg-white/[0.05]"
            }`}
          >
            {showOwnerMoreMenu && (
              <span
                aria-hidden="true"
                className="absolute top-0.5 w-6 h-0.5 rounded-full bg-nav-active-text"
              />
            )}
            <MoreHorizontal
              size={21}
              strokeWidth={showOwnerMoreMenu ? 2.4 : 1.85}
              className="shrink-0"
              aria-hidden={true}
            />
            <span
              className={`mt-1 text-[11px] leading-tight tracking-tight whitespace-nowrap ${
                showOwnerMoreMenu ? "font-bold" : "font-medium"
              }`}
            >
              More
            </span>
          </button>
        )}
      </div>
    </nav>
  );
};
