import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { X, ChevronDown, HelpCircle } from "lucide-react";
import { useInteractiveWalkthrough } from "../../context/InteractiveWalkthroughContext";
import { useUser } from "../../context/UserContext";
import {
  PENDING_BOOKING_EXPIRATION_MINUTES,
  MAX_OPEN_UNPAID_HOLDS,
} from "../../services/bookingService";

interface HowItWorksCard {
  title: string;
  body: string;
}

interface HowItWorksFaqItem {
  question: string;
  answer: string;
}

interface RoleHowItWorksContent {
  subtitle: string;
  cards: HowItWorksCard[];
  faq: HowItWorksFaqItem[];
}

const HOW_IT_WORKS_CONTENT: Record<"player" | "owner", RoleHowItWorksContent> = {
  player: {
    subtitle: "How booking a pitch on Pitchly works",
    cards: [
      {
        title: "Find a pitch",
        body: "Browse verified football pitches by area on Home and Explore, and check amenities and hourly prices in UGX.",
      },
      {
        title: "Pick a time",
        body: "Choose a date and hourly slot on the pitch page. Lime/green marks available slots, muted grey marks booked slots, and amber marks an unpaid hold (not guaranteed).",
      },
      {
        title: "Hold and pay",
        body: `Hold the slot for ${PENDING_BOOKING_EXPIRATION_MINUTES} minutes while you pay a deposit or the full amount by MTN MoMo or Airtel Money and upload your payment screenshot or transaction reference.`,
      },
      {
        title: "Owner confirms",
        body: "Your booking shows as confirmed (or deposit paid) in Bookings once the pitch owner confirms your payment.",
      },
      {
        title: "Show your Match Pass",
        body: "Open your Match Pass from Bookings and show the QR code at the pitch gate.",
      },
    ],
    faq: [
      {
        question: "Why is there a deposit and who sets the percentage?",
        answer:
          "A deposit secures your slot so another player cannot take it. Each pitch owner sets their own deposit percentage (from 10% to 100%, defaulting to 50%), and any remaining balance is due at the pitch.",
      },
      {
        question: "What happens if I do not pay before the hold ends?",
        answer: `If payment is not submitted within ${PENDING_BOOKING_EXPIRATION_MINUTES} minutes, the pending booking expires and the held time slot is automatically released back to the pitch schedule.`,
      },
      {
        question: "Can I cancel my booking?",
        answer:
          "Unpaid bookings and submitted payments not yet confirmed can be cancelled in Bookings. For confirmed or deposit-paid bookings, contact the pitch owner or Pitchly Support.",
      },
      {
        question: "What happens if the owner does not confirm my payment?",
        answer:
          "Unconfirmed submitted payments are cancelled automatically 1 hour before kickoff (or at kickoff if you submitted proof less than 1 hour before kickoff), and the slot is released.",
      },
      {
        question: "How do pay-at-the-pitch holds work?",
        answer: `Where a pitch allows unpaid holds, you can keep up to ${MAX_OPEN_UNPAID_HOLDS} open unpaid reservation at a time. Unpaid holds are not guaranteed and can be taken by another player who pays a deposit.`,
      },
      {
        question: "Where can I get help?",
        answer:
          "Tap Contact support below to open Support and reach Pitchly via WhatsApp or email.",
      },
    ],
  },
  owner: {
    subtitle: "How managing your pitch on Pitchly works",
    cards: [
      {
        title: "Add your pitch",
        body: "Upload pitch photos, set hourly prices in UGX, choose your deposit percentage, and add the Mobile Money number players pay.",
      },
      {
        title: "Get approved",
        body: "Pitchly reviews each submitted pitch before it goes live for bookings.",
      },
      {
        title: "Run your day from Today",
        body: "Open Today to see each hourly slot marked as booked, free, or waiting for your OK.",
      },
      {
        title: "Confirm payments",
        body: "Open any waiting booking to review the player's payment proof and confirm the payment.",
      },
    ],
    faq: [],
  },
};

export const HowItWorksSheet: React.FC = () => {
  const { isOpen, closeWalkthrough } = useInteractiveWalkthrough();
  const { isOwner, isAdmin } = useUser();
  const navigate = useNavigate();

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  // Admin gets the player content; non-admin owners get the owner content.
  const roleKey: "player" | "owner" = isOwner && !isAdmin ? "owner" : "player";
  const content = HOW_IT_WORKS_CONTENT[roleKey];

  // Focus management: move focus into sheet on open, restore to opener on close.
  useEffect(() => {
    if (isOpen) {
      openerRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const timer = window.setTimeout(() => {
        if (closeButtonRef.current) {
          closeButtonRef.current.focus();
        } else {
          dialogRef.current?.focus();
        }
      }, 0);
      return () => window.clearTimeout(timer);
    }

    if (openerRef.current && openerRef.current.isConnected) {
      openerRef.current.focus();
      openerRef.current = null;
    }
  }, [isOpen]);

  // Body scroll lock while open, restored on close/unmount.
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  // Escape key closes sheet; Tab stays inside dialog.
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeWalkthrough();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), summary, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeWalkthrough]);

  if (!isOpen) return null;

  const handleGoToSupport = () => {
    closeWalkthrough();
    navigate("/support");
  };

  return (
    <div
      className="fixed inset-0 z-[150] flex items-end justify-center lg:items-center lg:p-6 bg-black/60 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeWalkthrough();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="how-it-works-title"
        tabIndex={-1}
        className="w-full lg:max-w-lg max-h-[85vh] flex flex-col bg-surface-card text-text-primary border-t border-border-subtle lg:border rounded-t-2xl lg:rounded-2xl shadow-2xl overflow-hidden hiw-sheet-enter focus:outline-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border-subtle shrink-0">
          <div className="min-w-0">
            <h2
              id="how-it-works-title"
              className="text-lg font-extrabold text-text-primary font-display tracking-tight"
            >
              How Pitchly works
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">{content.subtitle}</p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={closeWalkthrough}
            aria-label="Close How Pitchly works"
            className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl bg-surface-raised hover:bg-border-subtle border border-border-subtle text-text-primary flex items-center justify-center shrink-0 transition-colors motion-reduce:transition-none cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Numbered Steps */}
          <ol className="space-y-2.5">
            {content.cards.map((card, index) => (
              <li
                key={card.title}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-raised border border-border-subtle"
              >
                <span
                  aria-hidden="true"
                  className="w-7 h-7 rounded-lg bg-cta-bg text-cta-text text-xs font-black flex items-center justify-center shrink-0 mt-0.5"
                >
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-text-primary leading-snug">
                    {card.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-text-secondary mt-1 leading-relaxed">
                    {card.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          {roleKey === "owner" && (
            <p className="text-xs sm:text-sm text-text-secondary px-0.5 leading-relaxed">
              For step-by-step lessons, open Guide in the owner menu.
            </p>
          )}

          {/* FAQ Accordions */}
          {content.faq.length > 0 && (
            <section aria-labelledby="how-it-works-faq-heading" className="space-y-2">
              <h3
                id="how-it-works-faq-heading"
                className="text-xs font-extrabold uppercase tracking-wider text-text-secondary px-0.5"
              >
                Frequently asked questions
              </h3>
              <div className="space-y-2">
                {content.faq.map((item) => (
                  <details
                    key={item.question}
                    className="group rounded-xl bg-surface-raised border border-border-subtle overflow-hidden"
                  >
                    <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer flex items-center justify-between gap-3 px-3.5 py-3 min-h-[44px] text-xs sm:text-sm font-bold text-text-primary hover:bg-border-subtle/40 transition-colors motion-reduce:transition-none">
                      <span>{item.question}</span>
                      <ChevronDown
                        size={16}
                        className="text-text-secondary shrink-0 transition-transform duration-200 motion-reduce:transition-none group-open:rotate-180"
                      />
                    </summary>
                    <p className="px-3.5 pb-3.5 pt-2.5 text-xs sm:text-sm text-text-secondary leading-relaxed border-t border-border-subtle">
                      {item.answer}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-5 pt-3 border-t border-border-subtle bg-surface-card shrink-0"
          style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
        >
          <button
            type="button"
            onClick={handleGoToSupport}
            className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-cta-bg hover:bg-cta-bg-hover text-cta-text text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-colors motion-reduce:transition-none cursor-pointer"
          >
            <HelpCircle size={16} />
            <span>Need help? Contact support</span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes hiwSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hiw-sheet-enter {
          animation: hiwSlideUp 0.2s ease-out both;
        }
        @media (prefers-reduced-motion: reduce) {
          .hiw-sheet-enter {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};

export default HowItWorksSheet;
