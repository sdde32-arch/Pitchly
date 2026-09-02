import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  accent?: boolean;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ accent, className = '', children, ...props }) => {
  const baseClasses = "rounded-2xl border transition-colors duration-150 overflow-hidden";
  const safeClassName = className || '';
  
  // Surface tokens
  const bgClasses = safeClassName.includes('bg-') 
    ? '' 
    : accent 
      ? 'bg-primary-lime/5' 
      : 'bg-surface-card';

  const textClasses = safeClassName.includes('text-') 
    ? '' 
    : 'text-text-primary';
  
  const borderClass = accent 
    ? "border-primary-lime/30" 
    : "border-border-subtle shadow-sm";

  return (
    <div
      id="pitchly-card"
      className={`${baseClasses} ${bgClasses} ${textClasses} ${borderClass} ${safeClassName}`}
      {...props}
    >
      {children}
    </div>
  );
};


