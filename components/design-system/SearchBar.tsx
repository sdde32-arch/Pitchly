import React from 'react';
import { AppTheme } from '../../tokens';
import { Search, ChevronDown, X } from 'lucide-react';

export interface FilterSelect {
  key: string;
  label: string; // e.g. "STATUS", "ROLE", "PAYMENT"
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}

export interface SearchBarProps {
  theme?: AppTheme;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  placeholder?: string;
  filters?: FilterSelect[];
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  theme = 'dark',
  searchQuery = '',
  onSearchChange,
  placeholder = 'Search by ID, player, owner, pitch...',
  filters = [],
  className = '',
}) => {
  const containerBg = 'bg-surface-card border-border-subtle';
  const pillBg = 'bg-surface-raised border-border-subtle';
  const textColor = 'text-text-primary';
  const placeholderColor = 'placeholder-[#A1A1AA]';
  const iconColor = 'text-text-secondary';

  return (
    <div className={`space-y-3 w-full ${className}`}>
      
      {/* Top Main Search Input Box */}
      <div className={`relative w-full flex items-center rounded-full border px-4 py-3 shadow-sm transition-all focus-within:border-primary-lime ${containerBg}`}>
        <Search size={18} className={`shrink-0 mr-3 ${iconColor}`} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-transparent text-xs font-display font-medium outline-none ${textColor} ${placeholderColor}`}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange?.('')}
            className={`p-1 rounded-full hover:bg-current/10 ${iconColor}`}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filter Dropdown Pill Buttons (Row below search) */}
      {filters.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {filters.map((filter) => (
            <div
              key={filter.key}
              className={`relative flex items-center rounded-full border px-4 py-2 text-xs font-display font-extrabold tracking-wider ${pillBg}`}
            >
              <span className="text-text-secondary mr-2 uppercase text-[11px] font-bold">
                {filter.label}:
              </span>
              
              <div className="relative flex items-center">
                <select
                  value={filter.value}
                  onChange={(e) => filter.onChange(e.target.value)}
                  className="bg-transparent text-primary-lime font-black uppercase text-xs cursor-pointer outline-none pr-6 appearance-none"
                >
                  {filter.options.map((opt) => (
                    <option
                      key={opt.value}
                      value={opt.value}
                      className="bg-surface-card text-text-primary"
                    >
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-0 pointer-events-none text-primary-lime" />
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
