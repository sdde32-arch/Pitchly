import React from 'react';

export type BadgeVariant = 'available' | 'almost-full' | 'booked' | 'verified' | 'top-rated' | 'popular' | 'pending' | 'confirmed';

export interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant,
  children,
  className = '',
}) => {
  let variantClasses = "";
  
  switch (variant) {
    case 'available':
      variantClasses = "bg-primary-lime/10 text-primary-lime border border-primary-lime/25";
      break;
    case 'almost-full':
      variantClasses = "bg-[#FACC15]/10 text-[#FACC15] border border-[#FACC15]/30";
      break;
    case 'pending':
      variantClasses = "bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30";
      break;
    case 'booked':
      variantClasses = "bg-surface-raised text-text-secondary border border-border-subtle";
      break;
    case 'verified':
    case 'confirmed':
      variantClasses = "bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30";
      break;
    case 'top-rated':
      variantClasses = "bg-[#FACC15]/10 text-[#FACC15] border border-[#FACC15]/30";
      break;
    case 'popular':
      variantClasses = "bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30";
      break;
  }

  return (
    <span 
      id={`badge-${variant}`}
      className={`
        inline-flex 
        items-center 
        px-2.5 
        py-0.5 
        rounded-full 
        text-[11px] 
        font-body 
        font-medium 
        leading-tight
        ${variantClasses} 
        ${className}
      `}
    >
      {children}
    </span>
  );
};

