import React from 'react';
import { AppTheme } from '../../tokens';

export interface SectionHeadingProps {
  children: React.ReactNode;
  theme?: AppTheme;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  subtitle?: string;
  limeTitle?: boolean;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  children,
  theme = 'dark',
  badge,
  action,
  className = '',
  subtitle,
  limeTitle = true,
}) => {
  const titleColor = limeTitle ? 'text-primary-lime' : 'text-text-primary';

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-2 border-b border-border-subtle ${className}`}>
      <div>
        <div className="flex items-center gap-3">
          <h2
            className={`text-[18px] leading-[26px] font-display font-extrabold italic uppercase tracking-[0.05em] ${titleColor}`}
          >
            {children}
          </h2>

          {badge && (
            <span className="shrink-0">{badge}</span>
          )}
        </div>

        {subtitle && (
          <p className="text-xs font-medium mt-1 text-text-secondary">
            {subtitle}
          </p>
        )}
      </div>

      {action && <div className="shrink-0 self-start sm:self-center">{action}</div>}
    </div>
  );
};
