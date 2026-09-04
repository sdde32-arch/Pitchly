import React, { useState } from "react";
import {
  X,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  Zap,
  ChevronRight,
  CreditCard,
  Phone,
  Sparkles,
  Info,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Pitch } from "../../types/firebase";

interface QuickBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  pitch: Partial<Pitch> | null;
  selectedDate: string; // YYYY-MM-DD
  initialTimeSlot?: string; // e.g. "19:00"
}

export const QuickBookingModal: React.FC<QuickBookingModalProps> = ({
  isOpen,
  onClose,
  pitch,
  selectedDate,
  initialTimeSlot = "19:00",
}) => {
  const navigate = useNavigate();
  const [selectedTime, setSelectedTime] = useState<string>(initialTimeSlot);
  const [duration, setDuration] = useState<number>(1); // hours
  const [paymentOption, setPaymentOption] = useState<"deposit" | "full">("deposit");

  // Keep state in sync with prop changes
  React.useEffect(() => {
    if (initialTimeSlot) {
      setSelectedTime(initialTimeSlot);
    }
  }, [initialTimeSlot]);

  if (!isOpen || !pitch) return null;

  const pricePerHour = pitch.pricePerHour || 75000;
  const totalPrice = pricePerHour * duration;
  const depositAmount = Math.round(totalPrice * 0.5);

  // Available slots preview around selected time
  const availableSlots = [
    "07:00", "08:00", "09:00", "16:00", "17:00", "18:00",
    "19:00", "20:00", "21:00", "22:00"
  ];

  const handleProceedToCheckout = () => {
    onClose();
    const queryParams = new URLSearchParams({
      date: selectedDate,
      time: selectedTime,
      duration: duration.toString(),
      deposit: paymentOption === "deposit" ? "true" : "false",
    });
    navigate(`/checkout/${pitch.id}?${queryParams.toString()}`);
  };

  const handleViewFullDetails = () => {
    onClose();
    navigate(`/turf/${pitch.id}`);
  };

  const formattedDate = new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      id="quick-booking-modal-overlay"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="quick-booking-modal-container"
        className="w-full max-w-lg bg-surface-card border-t sm:border border-border-subtle rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 space-y-5 text-text-primary shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border-subtle pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-lime/10 border border-primary-lime/20 text-[11px] font-bold text-primary-lime">
              <Zap size={12} className="fill-primary-lime" />
              <span>Instant Pitch Checkout</span>
            </div>
            <h2 className="text-xl font-black text-text-primary tracking-tight font-display">
              {pitch.name}
            </h2>
            <div className="flex items-center gap-1 text-xs text-text-secondary">
              <MapPin size={13} className="text-primary-lime shrink-0" />
              <span className="truncate">{pitch.location || "Kampala, Uganda"}</span>
            </div>
          </div>

          <button
            id="quick-booking-close-btn"
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-raised hover:bg-border-subtle flex items-center justify-center text-text-tertiary hover:text-text-primary transition-colors cursor-pointer shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Matchday Date & Surface Tag */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-raised border border-border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-lime/15 text-primary-lime flex items-center justify-center border border-primary-lime/25">
              <Calendar size={18} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary block">
                Selected Matchday
              </span>
              <span className="text-xs font-bold text-text-primary">
                {formattedDate}
              </span>
            </div>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-black/40 text-text-secondary border border-border-subtle">
            {pitch.pitchFormats?.[0] || "Floodlit Turf"}
          </span>
        </div>

        {/* Kickoff Time Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-text-primary flex items-center gap-1.5">
              <Clock size={14} className="text-primary-lime" />
              <span>Choose Kickoff Time</span>
            </label>
            <span className="text-[11px] text-text-tertiary font-medium">60-minute blocks</span>
          </div>

          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {availableSlots.map((slot) => {
              const isSelected = selectedTime === slot;
              return (
                <button
                  key={slot}
                  id={`slot-select-${slot}`}
                  type="button"
                  onClick={() => setSelectedTime(slot)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold text-center transition-all cursor-pointer ${
                    isSelected
                      ? "bg-primary-lime text-accent-text font-black shadow-md shadow-primary-lime/20 scale-[1.02]"
                      : "bg-surface-raised hover:bg-border-subtle text-text-secondary hover:text-text-primary border border-border-subtle"
                  }`}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        </div>

        {/* Match Duration Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-text-primary block">
            Match Duration
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { hours: 1, label: "1 Hour (60m)" },
              { hours: 1.5, label: "1.5 Hours (90m)" },
              { hours: 2, label: "2 Hours (120m)" },
            ].map((d) => (
              <button
                key={d.hours}
                type="button"
                id={`duration-${d.hours}`}
                onClick={() => setDuration(d.hours)}
                className={`py-2 px-2 rounded-xl text-xs font-bold text-center transition-all cursor-pointer ${
                  duration === d.hours
                    ? "bg-surface-raised text-primary-lime border-2 border-primary-lime"
                    : "bg-surface-raised/60 hover:bg-surface-raised text-text-secondary border border-border-subtle"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Money Payment Preference */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-text-primary block">
            Payment Option (MTN / Airtel Mobile Money)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              id="payment-opt-deposit"
              onClick={() => setPaymentOption("deposit")}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                paymentOption === "deposit"
                  ? "bg-primary-lime/10 border-primary-lime text-text-primary"
                  : "bg-surface-raised border-border-subtle text-text-secondary hover:text-text-primary"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-black text-text-primary">50% Deposit</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary-lime/20 text-primary-lime">
                  Hold Pitch
                </span>
              </div>
              <p className="text-xs font-bold text-primary-lime">
                UGX {depositAmount.toLocaleString()}
              </p>
              <span className="text-[10px] text-text-tertiary">Pay balance on turf arrival</span>
            </button>

            <button
              type="button"
              id="payment-opt-full"
              onClick={() => setPaymentOption("full")}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                paymentOption === "full"
                  ? "bg-primary-lime/10 border-primary-lime text-text-primary"
                  : "bg-surface-raised border-border-subtle text-text-secondary hover:text-text-primary"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-black text-text-primary">Full Payment</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-raised text-text-tertiary">
                  Complete
                </span>
              </div>
              <p className="text-xs font-bold text-text-primary">
                UGX {totalPrice.toLocaleString()}
              </p>
              <span className="text-[10px] text-text-tertiary">Instant confirmation & pass</span>
            </button>
          </div>
        </div>

        {/* Price Breakdown Card */}
        <div className="p-3.5 rounded-2xl bg-surface-raised/70 border border-border-subtle space-y-1.5">
          <div className="flex justify-between text-xs text-text-secondary">
            <span>Hourly rate</span>
            <span>UGX {pricePerHour.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs text-text-secondary">
            <span>Duration ({duration} hr)</span>
            <span>UGX {totalPrice.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs text-text-secondary">
            <span>Booking & pitch lights</span>
            <span className="text-primary-lime font-medium">Included</span>
          </div>
          <div className="pt-2 border-t border-border-subtle flex justify-between items-baseline">
            <span className="text-xs font-bold text-text-primary">Due Right Now</span>
            <span className="text-base font-black text-primary-lime">
              UGX {(paymentOption === "deposit" ? depositAmount : totalPrice).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            id="quick-booking-submit-btn"
            type="button"
            onClick={handleProceedToCheckout}
            className="w-full h-12 rounded-full bg-primary-lime hover:bg-[#96E600] text-accent-text font-black text-sm transition-all duration-200 shadow-md shadow-primary-lime/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <span>Lock Slot & Proceed to Pay</span>
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>

          <button
            id="quick-booking-view-details-btn"
            type="button"
            onClick={handleViewFullDetails}
            className="w-full h-10 rounded-full bg-surface-raised hover:bg-border-subtle text-text-secondary hover:text-text-primary font-bold text-xs transition-colors cursor-pointer text-center"
          >
            View Ground Photos, Rules & Amenities
          </button>
        </div>
      </div>
    </div>
  );
};
