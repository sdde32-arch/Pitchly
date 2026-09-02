import React from 'react';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  label,
  className = '',
  disabled = false,
  id,
  ...props
}) => {
  const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 6)}`;
  
  return (
    <label 
      className={`inline-flex items-center gap-3 cursor-pointer select-none min-h-[44px] py-1 ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${className}`}
      htmlFor={checkboxId}
    >
      <div className="relative flex items-center">
        <input
          type="checkbox"
          id={checkboxId}
          checked={checked}
          disabled={disabled}
          onChange={(e) => !disabled && onChange(e.target.checked)}
          className="sr-only peer"
          {...props}
        />
        {/* Styled box */}
        <div className={`
          w-5
          h-5
          rounded-md
          border
          flex
          items-center
          justify-center
          transition-colors
          duration-150
          peer-focus-visible:ring-2
          peer-focus-visible:ring-primary-lime
          peer-focus-visible:ring-offset-2
          peer-focus-visible:ring-offset-[#0D0D0D]
          ${checked 
            ? 'bg-primary-lime border-primary-lime text-accent-text' 
            : 'bg-surface-raised border-border-subtle'
          }
          ${!disabled && !checked ? 'hover:border-primary-lime/60' : ''}
        `}>
          {checked && (
            <Check size={13} strokeWidth={3} className="text-accent-text" />
          )}
        </div>
      </div>
      {label && (
        <span className="text-xs sm:text-sm font-sans font-medium text-text-primary">
          {label}
        </span>
      )}
    </label>
  );
};

