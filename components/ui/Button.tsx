import React from 'react';
import { ArrowRight } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'text';
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  fullWidth = false, 
  size = 'md',
  className = '', 
  children, 
  ...props 
}) => {
  const baseClasses = "font-sans font-bold rounded-full transition-all duration-150 flex items-center justify-center active:scale-[0.96] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-lime focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0D0D0D] cursor-pointer";
  
  let variantClasses = "";
  if (variant === 'primary') {
    variantClasses = "bg-primary-lime text-accent-text hover:bg-[#96E600] active:bg-[#85CC00] shadow-sm shadow-primary-lime/20 font-bold";
  } else if (variant === 'secondary') {
    variantClasses = "bg-surface-raised text-text-primary hover:bg-border-subtle border border-border-subtle shadow-sm";
  } else if (variant === 'outline') {
    variantClasses = "bg-surface-card text-text-primary border border-border-subtle hover:bg-surface-raised hover:border-[#383838] active:bg-border-subtle";
  } else if (variant === 'text') {
    variantClasses = "bg-transparent text-primary-lime p-0 hover:text-[#96E600] active:text-[#85CC00] hover:underline gap-1.5 min-h-[44px]";
  } else if (variant === 'danger') {
    variantClasses = "bg-[#EF4444] text-white hover:bg-red-600 active:bg-red-700 shadow-sm shadow-red-500/20";
  }

  const widthClass = fullWidth ? "w-full" : "w-auto px-4";
  
  let sizeClass = "min-h-[48px] py-3 text-[14px]";
  if (size === 'sm') {
    sizeClass = "min-h-[38px] py-2 px-4 text-[12px]";
  } else if (size === 'lg') {
    sizeClass = "min-h-[56px] py-4 px-4 text-[16px]";
  }
  if (variant === 'text') {
    sizeClass = "min-h-[44px] py-1 text-xs sm:text-sm";
  }

  return (
    <button 
      id={`btn-${variant}`}
      className={`${baseClasses} ${variantClasses} ${widthClass} ${sizeClass} ${className}`}
      {...props}
    >
      <span>{children}</span>
      {variant === 'text' && <ArrowRight size={15} className="shrink-0 transition-transform group-hover:translate-x-1" />}
    </button>
  );
};


