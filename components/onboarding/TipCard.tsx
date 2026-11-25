import React, { useState } from "react";
import { Info } from "lucide-react";
import { useUser } from "../../context/UserContext";

interface TipCardProps {
  tipId: string;
  title: string;
  children: React.ReactNode;
  audience?: "player" | "owner";
}

export const TipCard: React.FC<TipCardProps> = ({
  tipId,
  title,
  children,
  audience = "player",
}) => {
  const { user, userProfile, isOwner, isAdmin, updateProfile } = useUser();
  const [dismissedInSession, setDismissedInSession] = useState(false);

  if (!user || !userProfile) return null;
  if (audience === "owner" && (!isOwner || isAdmin)) return null;
  if (dismissedInSession || userProfile.onboarding?.tipsSeen?.[tipId] === true) {
    return null;
  }

  const handleDismiss = async () => {
    setDismissedInSession(true);
    try {
      await updateProfile({
        onboarding: {
          ...userProfile.onboarding,
          tipsSeen: {
            ...userProfile.onboarding?.tipsSeen,
            [tipId]: true,
          },
        },
      });
    } catch (err) {
      console.warn(`Failed to save dismissed tip "${tipId}":`, err);
    }
  };

  return (
    <div
      role="note"
      aria-label={title}
      className="bg-surface-card border border-border-subtle rounded-2xl p-4 shadow-xs tip-card-fade"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            aria-hidden="true"
            className="w-8 h-8 rounded-xl bg-surface-raised border border-border-subtle text-text-primary flex items-center justify-center shrink-0 mt-0.5"
          >
            <Info size={16} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold text-text-primary">{title}</h3>
            <div className="text-xs text-text-secondary leading-relaxed mt-0.5">
              {children}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="min-h-[44px] min-w-[44px] px-4 rounded-xl bg-cta-bg hover:bg-cta-bg-hover text-cta-text text-xs font-extrabold shrink-0 transition-colors motion-reduce:transition-none cursor-pointer"
        >
          Got it
        </button>
      </div>
      <style>{`
        @keyframes tipCardFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .tip-card-fade {
          animation: tipCardFadeIn 0.2s ease-out both;
        }
        @media (prefers-reduced-motion: reduce) {
          .tip-card-fade {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};

export default TipCard;
