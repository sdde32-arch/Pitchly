import React from 'react';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  id?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  id,
}) => {
  const toggleId = id || `toggle-${Math.random().toString(36).substr(2, 6)}`;

  return (
    <label 
      className={`inline-flex items-center gap-3 cursor-pointer select-none min-h-[44px] py-1 ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      htmlFor={toggleId}
    >
      <div className="relative flex items-center">
        <input
          type="checkbox"
          id={toggleId}
          checked={checked}
          disabled={disabled}
          onChange={(e) => !disabled && onChange(e.target.checked)}
          className="sr-only peer"
        />
        {/* Track */}
        <div className={`
          w-11
          h-6
          rounded-full
          transition-colors
          duration-200
          peer-focus-visible:ring-2
          peer-focus-visible:ring-primary-lime
          peer-focus-visible:ring-offset-2
          peer-focus-visible:ring-offset-[#0D0D0D]
          ${checked 
            ? 'bg-primary-lime border border-primary-lime' 
            : 'bg-surface-raised border border-border-subtle'
          }
        `} />
        {/* Knob */}
        <div className={`
          absolute
          top-1
          left-1
          w-4
          h-4
          rounded-full
          transition-transform
          duration-200
          transform
          ${checked ? 'translate-x-5 bg-app-base' : 'translate-x-0 bg-text-secondary'}
        `} />
      </div>
      {label && (
        <span className="text-xs sm:text-sm font-sans font-normal text-text-primary">
          {label}
        </span>
      )}
    </label>
  );
};

