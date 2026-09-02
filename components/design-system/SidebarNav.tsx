import React from 'react';
import { AppTheme } from '../../tokens';
import { Logo } from '../Logo';
import { 
  LayoutDashboard, 
  MapPin, 
  Users, 
  Building2, 
  Calendar, 
  CreditCard, 
  ShieldAlert, 
  FileText, 
  Settings,
  LogOut,
  ChevronRight
} from 'lucide-react';

export interface SidebarNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
}

export interface SidebarNavProps {
  theme?: AppTheme;
  activeItem?: string;
  onSelect?: (id: string) => void;
  items?: SidebarNavItem[];
  userRole?: string;
  userName?: string;
  onLogout?: () => void;
  className?: string;
}

const DEFAULT_ADMIN_ITEMS: SidebarNavItem[] = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={18} /> },
  { id: 'pitch-reviews', label: 'Pitch Reviews', icon: <MapPin size={18} /> },
  { id: 'users', label: 'Users', icon: <Users size={18} /> },
  { id: 'owners', label: 'Owners', icon: <Building2 size={18} /> },
  { id: 'bookings', label: 'Bookings', icon: <Calendar size={18} /> },
  { id: 'payments', label: 'Payments', icon: <CreditCard size={18} /> },
  { id: 'reports', label: 'Reports', icon: <ShieldAlert size={18} /> },
  { id: 'audit-logs', label: 'Audit Logs', icon: <FileText size={18} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
];

export const SidebarNav: React.FC<SidebarNavProps> = ({
  theme = 'dark',
  activeItem = 'overview',
  onSelect,
  items = DEFAULT_ADMIN_ITEMS,
  userRole = 'SUPER ADMIN',
  userName = 'admin',
  onLogout,
  className = '',
}) => {
  const containerStyles = 'bg-surface-card border-r border-border-subtle text-text-primary';
  const profileCardBg = 'bg-surface-raised border border-border-subtle';

  return (
    <aside
      className={`w-64 min-h-[640px] h-full p-4 flex flex-col justify-between transition-colors ${containerStyles} ${className}`}
    >
      <div className="space-y-6">
        
        {/* Brand Header Logo */}
        <div className="px-1 py-1">
          <Logo size={32} showText={true} />
        </div>

        {/* User Profile Card */}
        <div className={`p-3.5 rounded-[22px] flex items-center gap-3 ${profileCardBg}`}>
          <div className="w-10 h-10 rounded-full bg-primary-lime/15 border border-primary-lime/30 text-primary-lime flex items-center justify-center font-extrabold text-sm shrink-0">
            {userName.charAt(0).toLowerCase()}
          </div>
          <div className="overflow-hidden">
            <span className="font-display font-black text-sm text-text-primary block truncate">
              {userName}
            </span>
            <span className="text-[10px] font-extrabold tracking-wider uppercase text-primary-lime block truncate">
              {userRole}
            </span>
          </div>
        </div>

        {/* Nav Items List */}
        <nav className="space-y-1.5">
          {items.map((item) => {
            const isActive = activeItem === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect?.(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-display font-extrabold tracking-wide transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-lime text-accent-text font-black shadow-md shadow-primary-lime/15'
                    : 'text-text-secondary hover:bg-surface-raised hover:text-text-primary'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-accent-text' : 'text-text-secondary'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      isActive
                        ? 'bg-app-base text-primary-lime'
                        : 'bg-rose-500 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Logout Button */}
      <div className="pt-4 border-t border-border-subtle">
        <button
          type="button"
          onClick={onLogout || (() => {})}
          className="w-full flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-display font-black text-rose-400 hover:bg-rose-500/10 transition-colors uppercase tracking-wider"
        >
          <LogOut size={16} className="text-rose-400" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
