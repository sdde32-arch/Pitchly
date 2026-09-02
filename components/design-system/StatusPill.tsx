import React from 'react';

export type StatusPillVariant = 'available' | 'fully-booked' | 'in-progress' | 'pending' | 'success' | 'warning' | 'admin';

export interface StatusPillProps {
  variant: StatusPillVariant;
  label?: string;
  className?: string;
  pulse?: boolean;
}

export const StatusPill: React.FC<StatusPillProps> = ({
  variant,
  label,
  className = '',
  pulse = true,
}) => {
  const configs: Record<StatusPillVariant, { defaultLabel: string; bg: string; border: string; text: string; dotBg: string }> = {
    available: {
      defaultLabel: 'Available',
      bg: 'bg-[#22C55E]/10',
      border: 'border-[#22C55E]/30',
      text: 'text-[#22C55E]',
      dotBg: 'bg-[#22C55E]',
    },
    'fully-booked': {
      defaultLabel: 'Fully Booked',
      bg: 'bg-[#EF4444]/10',
      border: 'border-[#EF4444]/30',
      text: 'text-[#EF4444]',
      dotBg: 'bg-[#EF4444]',
    },
    'in-progress': {
      defaultLabel: 'Payment Submitted',
      bg: 'bg-[#38BDF8]/10',
      border: 'border-[#38BDF8]/30',
      text: 'text-[#38BDF8]',
      dotBg: 'bg-[#38BDF8]',
    },
    pending: {
      defaultLabel: 'Pending Approval',
      bg: 'bg-[#FACC15]/10',
      border: 'border-[#FACC15]/30',
      text: 'text-[#FACC15]',
      dotBg: 'bg-[#FACC15]',
    },
    warning: {
      defaultLabel: 'Warning',
      bg: 'bg-[#FACC15]/10',
      border: 'border-[#FACC15]/30',
      text: 'text-[#FACC15]',
      dotBg: 'bg-[#FACC15]',
    },
    admin: {
      defaultLabel: 'Admin Review',
      bg: 'bg-[#A78BFA]/10',
      border: 'border-[#A78BFA]/30',
      text: 'text-[#A78BFA]',
      dotBg: 'bg-[#A78BFA]',
    },
    success: {
      defaultLabel: 'Confirmed Pass',
      bg: 'bg-primary-lime/10',
      border: 'border-primary-lime/40',
      text: 'text-primary-lime',
      dotBg: 'bg-primary-lime',
    },
  };

  const config = configs[variant] || configs.available;
  const displayText = label || config.defaultLabel;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-sans font-bold tracking-wide uppercase whitespace-nowrap backdrop-blur-sm ${config.bg} ${config.border} ${config.text} ${className}`}
    >
      <span className="relative flex h-2 w-2 shrink-0">
        {pulse && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dotBg}`}
          />
        )}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${config.dotBg}`}
        />
      </span>
      <span>{displayText}</span>
    </span>
  );
};

