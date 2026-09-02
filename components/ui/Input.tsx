import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon;
  fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  icon: Icon,
  fullWidth = true,
  className = '',
  id,
  ...props
}, ref) => {
  const widthClass = fullWidth ? "w-full" : "w-auto";
  
  return (
    <div className={`relative flex items-center ${widthClass}`} id={id ? `${id}-container` : undefined}>
      {Icon && (
        <div className="absolute left-3.5 text-[#71717A] pointer-events-none">
          <Icon size={16} strokeWidth={2} />
        </div>
      )}
      <input
        ref={ref}
        id={id}
        className={`
          ${widthClass}
          ${Icon ? 'pl-10 pr-3.5' : 'px-3.5'}
          h-11
          min-h-[44px]
          text-xs sm:text-sm
          font-body
          font-normal
          rounded-xl
          border
          border-border-subtle
          bg-surface-card
          text-text-primary
          placeholder-[#71717A]
          outline-none
          focus:border-primary-lime
          focus:ring-2
          focus:ring-primary-lime/20
          transition-all
          duration-150
          disabled:opacity-40
          disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      />
    </div>
  );
});

Input.displayName = "Input";

