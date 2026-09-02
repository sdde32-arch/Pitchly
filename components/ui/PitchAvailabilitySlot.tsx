import React from 'react';

export interface PitchAvailabilitySlotProps {
  status:
    | 'available'
    | 'selected'
    | 'temporarily_held'
    | 'pending_payment'
    | 'confirmed'
    | 'blocked_by_owner'
    | 'unavailable'
    | 'cancelled'
    | 'expired';
  selected?: boolean;
  time: string;
  price?: string;
  onClick?: () => void;
  isSubscribed?: boolean;
  isMyHold?: boolean;
  countdownText?: string;
}

export const PitchAvailabilitySlot: React.FC<PitchAvailabilitySlotProps> = ({
  status,
  selected = false,
  time,
  price,
  onClick,
  isSubscribed = false,
  isMyHold = false,
  countdownText,
}) => {
  const handleSlotClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const baseSlotClass = "rounded-xl p-3 text-center min-h-[58px] transition-all duration-150 flex flex-col items-center justify-center gap-0.5 relative w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-lime select-none";

  // 1. CONFIRMED / BOOKED State
  if (status === 'confirmed') {
    return (
      <button 
        id="slot-confirmed"
        onClick={handleSlotClick}
        type="button"
        className={`${baseSlotClass} ${
          isSubscribed 
            ? "bg-[#38BDF8]/10 border border-[#38BDF8] text-[#38BDF8]" 
            : "bg-surface-card border border-border-subtle text-[#71717A] hover:border-[#383838] cursor-pointer"
        }`}
      >
        <span className="text-xs font-normal line-through">{time}</span>
        {isSubscribed ? (
          <span className="text-[10px] font-medium text-[#38BDF8]">
            alert set
          </span>
        ) : (
          <span className="text-[10px] font-normal text-[#71717A]">
            booked (notify)
          </span>
        )}
      </button>
    );
  }

  // 2. SELECTED State: flat lime
  if (selected || status === 'selected') {
    return (
      <button
        id="slot-selected"
        onClick={handleSlotClick}
        type="button"
        className={`${baseSlotClass} bg-primary-lime text-accent-text border border-primary-lime font-bold active:scale-[0.98] cursor-pointer shadow-sm shadow-primary-lime/20`}
      >
        <span className="text-xs font-bold">{time}</span>
        {price && <span className="text-[10px] font-semibold text-accent-text">{price}</span>}
      </button>
    );
  }

  // 3. TEMPORARILY HELD State
  if (status === 'temporarily_held') {
    if (isMyHold) {
      return (
        <button
          id="slot-my-hold"
          onClick={handleSlotClick}
          type="button"
          className={`${baseSlotClass} bg-[#FACC15]/10 text-[#FACC15] border border-[#FACC15]/40 cursor-pointer`}
        >
          <span className="text-xs font-medium">{time}</span>
          <span className="text-[10px] font-normal">
            held {countdownText ? `(${countdownText})` : ''}
          </span>
        </button>
      );
    } else {
      return (
        <button
          id="slot-held-other"
          disabled
          type="button"
          className={`${baseSlotClass} bg-surface-card text-[#71717A] border border-dashed border-border-subtle cursor-not-allowed`}
        >
          <span className="text-xs font-normal line-through">{time}</span>
          <span className="text-[10px] font-normal text-[#FACC15]/80">
            in checkout
          </span>
        </button>
      );
    }
  }

  // 4. PENDING PAYMENT State
  if (status === 'pending_payment') {
    return (
      <button
        id="slot-pending-payment"
        disabled
        type="button"
        className={`${baseSlotClass} bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30 cursor-not-allowed`}
      >
        <span className="text-xs font-medium">{time}</span>
        <span className="text-[10px] font-normal">
          pending payment
        </span>
      </button>
    );
  }

  // 5. BLOCKED BY OWNER State
  if (status === 'blocked_by_owner') {
    return (
      <button
        id="slot-blocked-owner"
        disabled={!onClick}
        onClick={handleSlotClick}
        type="button"
        className={`${baseSlotClass} ${
          onClick 
            ? "bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30 hover:bg-[#EF4444]/20 cursor-pointer" 
            : "bg-surface-card text-[#71717A] border border-border-subtle cursor-not-allowed"
        }`}
      >
        <span className="text-xs font-medium">{time}</span>
        <span className="text-[10px] font-normal">
          unavailable
        </span>
      </button>
    );
  }

  // 6. UNAVAILABLE State
  if (status === 'unavailable') {
    return (
      <button
        id="slot-unavailable"
        disabled
        type="button"
        className={`${baseSlotClass} bg-surface-card text-[#71717A] border border-border-subtle cursor-not-allowed`}
      >
        <span className="text-xs font-normal line-through">{time}</span>
        <span className="text-[10px] font-normal">
          closed
        </span>
      </button>
    );
  }

  // 7. AVAILABLE State
  return (
    <button
      id="slot-available"
      onClick={handleSlotClick}
      type="button"
      className={`${baseSlotClass} bg-surface-card text-text-primary border border-border-subtle hover:border-primary-lime active:scale-[0.98] cursor-pointer`}
    >
      <span className="text-xs font-medium text-text-primary">{time}</span>
      {price && <span className="text-[10px] font-normal text-primary-lime">{price}</span>}
    </button>
  );
};

