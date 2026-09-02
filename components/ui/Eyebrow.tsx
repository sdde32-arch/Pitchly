import React from 'react';

export interface EyebrowProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
}

export const Eyebrow: React.FC<EyebrowProps> = ({ className = '', children, ...props }) => {
  return (
    <span 
      className={`font-sans text-[10px] uppercase font-bold tracking-wider text-primary-lime ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

