import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronRight, X } from "lucide-react";
import { useUser } from "../../context/UserContext";
import { useBooking } from "../../context/BookingContext";
import { BookingStatus } from "../../types";

const BOOKING_EXISTS_STATUSES = new Set<string>([
  BookingStatus.PENDING_PAYMENT,
  BookingStatus.PAYMENT_SUBMITTED,
  BookingStatus.CONFIRMED,
  BookingStatus.DEPOSIT_PAID,
  BookingStatus.TENTATIVE,
  BookingStatus.PENDING,
  BookingStatus.COMPLETED,
  BookingStatus.CHECKED_IN,
]);

const PAYMENT_CONFIRMED_STATUSES = new Set<string>([
  BookingStatus.CONFIRMED,
  BookingStatus.DEPOSIT_PAID,
  BookingStatus.COMPLETED,
  BookingStatus.CHECKED_IN,
]);

export const FirstMatchChecklist: React.FC = () => {
  const { user, userProfile, isOwner, isAdmin, updateProfile } = useUser();
  const { bookings, loading: bookingsLoading } = useBooking();
  const navigate = useNavigate();
  const [dismissedInSession, setDismissedInSession] = useState(false);

  const playerBookings = useMemo(() => {
    if (!user?.uid || !Array.isArray(bookings)) return [];
    return bookings.filter(
      (b) => b && (b.userId === user.uid || b.playerId === user.uid)
    );
  }, [bookings, user?.uid]);

  const hasBooking = useMemo(() => {
    return playerBookings.some((b) =>
      BOOKING_EXISTS_STATUSES.has(String(b.status || "").toUpperCase())
    );
  }, [playerBookings]);

  const hasConfirmedBooking = useMemo(() => {
    return playerBookings.some((b) =>
      PAYMENT_CONFIRMED_STATUSES.has(String(b.status || "").toUpperCase())
    );
  }, [playerBookings]);

  const isPlayerUser = Boolean(user && userProfile && !isOwner && !isAdmin);
  const isDismissed =
    dismissedInSession || Boolean(userProfile?.onboarding?.checklistDismissedAt);

  if (!isPlayerUser || isDismissed || bookingsLoading || hasConfirmedBooking) {
    return null;
  }

  const viewedPitch = userProfile?.onboarding?.viewedPitch === true;
  const completedCount =
    (viewedPitch ? 1 : 0) + (hasBooking ? 1 : 0) + (hasConfirmedBooking ? 1 : 0);

  if (completedCount >= 3) {
    return null;
  }

  const scrollToPitches = () => {
    const el = document.getElementById("pitches-booking-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleDismiss = async () => {
    setDismissedInSession(true);
    try {
      await updateProfile({
        onboarding: {
          ...userProfile?.onboarding,
          checklistDismissedAt: new Date().toISOString(),
        },
      });
    } catch (err) {
      console.warn("Failed to persist checklist dismissal:", err);
    }
  };

  const items = [
    {
      id: "browse-pitch",
      label: "Browse a pitch",
      done: viewedPitch,
      onClick: scrollToPitches,
    },
    {
      id: "book-slot",
      label: "Book a slot",
      done: hasBooking,
      onClick: scrollToPitches,
    },
    {
      id: "match-pass",
      label: "Get your Match Pass",
      done: hasConfirmedBooking,
      onClick: () => navigate("/bookings"),
    },
  ];

  return (
    <section
      role="region"
      aria-label="First match checklist"
      className="bg-surface-card border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-extrabold text-text-primary font-display tracking-tight">
              Your first match
            </h2>
            <span
              aria-live="polite"
              className="text-xs font-bold px-2 py-0.5 rounded-md bg-surface-raised border border-border-subtle text-text-secondary"
            >
              {completedCount} of 3
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">3 quick steps</p>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss checklist"
          className="min-h-[44px] min-w-[44px] px-3 rounded-xl bg-surface-raised hover:bg-border-subtle border border-border-subtle text-xs font-bold text-text-secondary hover:text-text-primary flex items-center justify-center gap-1.5 shrink-0 transition-colors motion-reduce:transition-none cursor-pointer"
        >
          <span>Dismiss</span>
          <X size={14} />
        </button>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={item.onClick}
            className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-surface-raised hover:bg-border-subtle/50 border border-border-subtle flex items-center justify-between gap-3 text-left transition-colors motion-reduce:transition-none cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              {item.done ? (
                <span
                  aria-hidden="true"
                  className="w-6 h-6 rounded-full bg-status-success-tint text-status-success border border-status-success/30 flex items-center justify-center shrink-0"
                >
                  <Check size={14} strokeWidth={3} />
                </span>
              ) : (
                <span
                  aria-hidden="true"
                  className="w-6 h-6 rounded-full border-2 border-border-subtle bg-surface-card shrink-0"
                />
              )}
              <span
                className={`text-xs sm:text-sm font-bold truncate ${
                  item.done ? "text-text-secondary line-through" : "text-text-primary"
                }`}
              >
                {item.label}
              </span>
            </div>
            <ChevronRight size={16} className="text-text-secondary shrink-0" />
          </button>
        ))}
      </div>
    </section>
  );
};

export default FirstMatchChecklist;
