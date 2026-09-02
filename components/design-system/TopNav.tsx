import React from 'react';
import { Bell, Menu, User } from 'lucide-react';
import { Logo } from '../Logo';
import { AppTheme } from '../../tokens';

export interface TopNavProps {
  theme?: AppTheme;
  activeTab?: 'discover' | 'book-now' | 'dashboard';
  onTabChange?: (tab: 'discover' | 'book-now' | 'dashboard') => void;
  userAvatarUrl?: string;
  hasNotifications?: boolean;
  userName?: string;
}

export const TopNav: React.FC<TopNavProps> = ({
  theme = 'dark',
  activeTab = 'discover',
  onTabChange,
  userAvatarUrl,
  hasNotifications = true,
  userName = 'Player',
}) => {
  const tabs = [
    { id: 'discover' as const, label: 'Discover' },
    { id: 'book-now' as const, label: 'Book Now' },
    { id: 'dashboard' as const, label: 'Dashboard' },
  ];

  const headerBg = 'bg-app-base/95 border-border-subtle';
  const navBoxBg = 'bg-surface-card border-border-subtle';
  const iconBtnBg = 'bg-surface-raised hover:bg-border-subtle border-border-subtle text-text-secondary hover:text-text-primary';

  return (
    <header className={`w-full backdrop-blur-md border-b sticky top-0 z-50 px-4 lg:px-4 py-3.5 transition-colors ${headerBg}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Left: Brand Logo & Mobile Menu Toggle */}
        <div className="flex items-center gap-3">
          <button 
            type="button"
            className={`lg:hidden p-2 rounded-xl border transition-colors ${iconBtnBg}`}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onTabChange?.('discover')}>
            <Logo size={36} showText={true} variant="auto" />
          </div>
        </div>

        {/* Center: 4 Primary Nav Tabs */}
        <nav className={`hidden md:flex items-center gap-1 p-1.5 rounded-full border ${navBoxBg}`}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange?.(tab.id)}
                className={`relative px-4 py-2 rounded-full text-xs font-display font-bold tracking-wide transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-lime text-accent-text shadow-md shadow-primary-lime/15'
                    : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Right: Notifications & User Profile */}
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <button
            type="button"
            className={`relative p-2.5 rounded-full border transition-all group ${iconBtnBg}`}
            aria-label="Notifications"
          >
            <Bell size={18} className="transition-transform group-hover:scale-110" />
            {hasNotifications && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-primary-lime rounded-full ring-2 ring-app-base animate-pulse" />
            )}
          </button>

          {/* User Avatar */}
          <div className={`flex items-center gap-2.5 border rounded-full p-1 pr-3 cursor-pointer transition-all ${iconBtnBg}`}>
            {userAvatarUrl ? (
              <img
                src={userAvatarUrl}
                alt={userName}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-primary-lime"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary-lime text-accent-text flex items-center justify-center font-extrabold text-xs">
                <User size={16} />
              </div>
            )}
            <span className="hidden sm:inline-block text-xs font-bold max-w-[100px] truncate text-text-primary">
              {userName}
            </span>
          </div>
        </div>

      </div>

      {/* Mobile Nav Tabs Bar */}
      <div className="md:hidden flex items-center justify-around gap-1 mt-3 pt-2 border-t border-border-subtle overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange?.(tab.id)}
              className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-wider transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-primary-lime text-accent-text'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
