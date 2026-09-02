import React from 'react';
import { AppTheme } from '../../tokens';

export interface CardProps {
  children: React.ReactNode;
  theme?: AppTheme;
  variant?: 'default' | 'elevated' | 'lime-glow' | 'subtle';
  className?: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  theme = 'dark',
  variant = 'default',
  className = '',
  title,
  subtitle,
  action,
  padding = 'md',
}) => {
  const darkVariantStyles = {
    default: 'bg-surface-card border border-border-subtle text-text-primary',
    elevated: 'bg-surface-raised border border-border-subtle shadow-2xl text-text-primary',
    'lime-glow': 'bg-surface-card border border-primary-lime/40 shadow-xl shadow-primary-lime/10 text-text-primary',
    subtle: 'bg-[#121212] border border-border-subtle text-text-primary',
  };

  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-4',
    lg: 'p-4',
  };

  return (
    <div
      className={`rounded-[28px] transition-all duration-200 ${darkVariantStyles[variant]} ${paddingStyles[padding]} ${className}`}
    >
      {(title || subtitle || action) && (
        <div className="flex items-center justify-between gap-4 mb-5 pb-3 border-b border-border-subtle">
          <div>
            {title && (
              <h3 className="text-[20px] leading-[28px] font-display font-bold tracking-tight text-text-primary">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs font-medium mt-1 text-text-secondary">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
