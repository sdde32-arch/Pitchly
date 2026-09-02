import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const PrimaryButton: React.FC<ButtonProps> = ({
  children,
  icon,
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  size = 'md',
  disabled,
  className = '',
  ...props
}) => {
  const sizeStyles = {
    sm: 'py-2 px-4 text-xs font-bold tracking-wider',
    md: 'py-3.5 px-4 text-xs font-bold tracking-wider',
    lg: 'py-4 px-4 text-sm font-bold tracking-wider',
  };

  return (
    <button
      disabled={disabled || loading}
      className={`relative inline-flex items-center justify-center gap-2 rounded-xl font-sans uppercase transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100 bg-primary-lime hover:bg-[#96E600] text-accent-text font-bold shadow-md shadow-primary-lime/15 ${
        sizeStyles[size]
      } ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-accent-text" />
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
          <span>{children}</span>
          {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
        </>
      )}
    </button>
  );
};

export const SecondaryButton: React.FC<ButtonProps> = ({
  children,
  icon,
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  size = 'md',
  disabled,
  className = '',
  ...props
}) => {
  const sizeStyles = {
    sm: 'py-2 px-4 text-xs font-bold tracking-wider',
    md: 'py-3.5 px-4 text-xs font-bold tracking-wider',
    lg: 'py-4 px-4 text-sm font-bold tracking-wider',
  };

  return (
    <button
      disabled={disabled || loading}
      className={`relative inline-flex items-center justify-center gap-2 rounded-xl font-sans uppercase transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100 bg-surface-raised hover:bg-border-subtle border border-border-subtle hover:border-[#383838] text-text-primary font-semibold ${
        sizeStyles[size]
      } ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
          <span>{children}</span>
          {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
        </>
      )}
    </button>
  );
};

