import React from "react";
import {
  LayoutDashboard,
  CalendarDays,
  Calendar,
  CreditCard,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
}
const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/owner/dashboard", icon: LayoutDashboard },
  { label: "Bookings", path: "/owner/bookings", icon: CalendarDays },
  { label: "Calendar", path: "/owner/calendar", icon: Calendar },
  { label: "Payments", path: "/owner/payments", icon: CreditCard },
  { label: "Customers", path: "/owner/customers", icon: Users },
  { label: "Analytics", path: "/owner/analytics", icon: BarChart3 },
  { label: "Settings", path: "/owner/settings", icon: Settings },
];
interface SidebarProps {
  collapsed: boolean;
  currentPath: string;
  onNavigate: (path: string) => void;
  onToggle: () => void;
}
export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  currentPath,
  onNavigate,
  onToggle,
}) => {
  return (
    <aside
      className={` flex flex-col h-screen bg-background border-r border-border-subtle transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1.0)] z-20 ${collapsed ? "w-[80px]" : "w-[240px]"} `}
    >
      {" "}
      {/* Brand Header */}{" "}
      <div className="h-16 flex items-center justify-center border-b border-border-subtle relative shrink-0">
        {" "}
        <div
          className={` font-black text-xl italic uppercase tracking-tighter text-text-primary transition-all duration-300 ${collapsed ? "opacity-0 w-0 overflow-hidden scale-95" : "opacity-100 scale-100"} `}
        >
          {" "}
          Pitchly{" "}
        </div>{" "}
        {collapsed && (
          <div className="absolute inset-0 flex items-center justify-center animate-fadeIn">
            <div className="w-10 h-10 bg-primary-lime rounded-xl flex items-center justify-center text-accent-text font-black text-lg italic uppercase shadow-md shadow-primary-lime/20">
              Py
            </div>
          </div>
        )}{" "}
      </div>{" "}
      {/* Navigation List */}{" "}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-2 no-scrollbar">
        {" "}
        {NAV_ITEMS.map((item) => {
          const isActive =
            currentPath === item.path ||
            currentPath.startsWith(`${item.path}/`);
          return (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={` group relative flex items-center w-full p-3 rounded-[1rem] text-[12px] font-bold uppercase tracking-widest transition-all duration-200 outline-none ${isActive ? "bg-surface-card text-text-primary shadow-sm border border-border-subtle" : "text-text-secondary hover:bg-surface-raised hover:text-text-secondary border border-transparent"} ${collapsed ? "justify-center" : "justify-start"} `}
              aria-label={item.label}
              title={collapsed ? item.label : undefined}
            >
              {" "}
              <item.icon
                size={20}
                strokeWidth={isActive ? 2.5 : 2}
                className={` shrink-0 transition-colors duration-200 ${isActive ? "text-text-primary" : "text-text-secondary group-hover:text-text-secondary"} `}
              />{" "}
              <span
                className={` ml-4 truncate transition-all duration-300 origin-left ${collapsed ? "w-0 opacity-0 scale-95" : "w-auto opacity-100 scale-100"} `}
              >
                {" "}
                {item.label}{" "}
              </span>{" "}
              {/* Active Indicator (Left Border Style) */}{" "}
              {isActive && !collapsed && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-primary-lime rounded-r-full shadow-[0_0_8px_#A8FF00]" />
              )}{" "}
              {/* Collapsed Tooltip */}{" "}
              {collapsed && (
                <div className=" absolute left-full ml-4 px-3 py-2 bg-surface-raised text-text-primary text-[10px] uppercase tracking-widest font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-xl border border-border-subtle z-50 ">
                  {" "}
                  {item.label}{" "}
                </div>
              )}{" "}
            </button>
          );
        })}{" "}
      </nav>{" "}
      {/* Footer / Toggle */}{" "}
      <div className="p-4 border-t border-border-subtle shrink-0">
        {" "}
        <button
          onClick={onToggle}
          className=" flex items-center justify-center w-full p-3 rounded-[1rem] text-text-secondary hover:bg-surface-raised hover:text-text-primary transition-colors duration-200 outline-none border border-transparent hover:border-border-subtle "
          aria-label={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {" "}
          {collapsed ? (
            <ChevronRight size={20} />
          ) : (
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
              {" "}
              <ChevronLeft size={16} /> <span>Collapse Menu</span>{" "}
            </div>
          )}{" "}
        </button>{" "}
      </div>{" "}
    </aside>
  );
};
