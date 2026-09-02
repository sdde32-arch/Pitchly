import React from 'react';

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  name?: string;
}

export const Radio: React.FC<RadioProps> = ({
  checked,
  onChange,
  label,
  name,
  className = '',
  disabled = false,
  id,
  ...props
}) => {
  const radioId = id || `radio-${Math.random().toString(36).substr(2, 6)}`;

  return (
    <label 
      className={`inline-flex items-center gap-3 cursor-pointer select-none min-h-[44px] py-1 ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${className}`}
      htmlFor={radioId}
    >
      <div className="relative flex items-center">
        <input
          type="radio"
          id={radioId}
          name={name}
          checked={checked}
          disabled={disabled}
          onChange={(e) => !disabled && onChange(e.target.checked)}
          className="sr-only peer"
          {...props}
        />
        {/* Styled Radio Circle */}
        <div className={`
          w-5
          h-5
          rounded-full
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
            ? 'border-primary-lime bg-transparent' 
            : 'bg-surface-raised border-border-subtle'
          }
          ${!disabled && !checked ? 'hover:border-primary-lime' : ''}
        `}>
          {checked && (
            <div className="w-2.5 h-2.5 rounded-full bg-primary-lime" />
          )}
        </div>
      </div>
      {label && (
        <span className="text-xs sm:text-sm font-sans font-normal text-text-primary">
          {label}
        </span>
      )}
    </label>
  );
};

