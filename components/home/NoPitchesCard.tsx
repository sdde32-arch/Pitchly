import React from "react";
import { PlusCircle, Share2, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface NoPitchesCardProps {
  className?: string;
}

export const NoPitchesCard: React.FC<NoPitchesCardProps> = ({ className = "" }) => {
  const navigate = useNavigate();

  const handleShareInvite = async () => {
    const inviteUrl = window.location.origin;
    const inviteText = `Own a football pitch in Kampala? List it on Pitchly and get bookings: ${inviteUrl}`;
    
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Pitchly Kampala",
          text: inviteText,
          url: inviteUrl,
        });
        return;
      } catch (err: any) {
        if (err?.name === "AbortError") return;
      }
    }

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(inviteText)}`;
    window.location.href = whatsappUrl;
  };

  return (
    <div
      id="no-pitches-empty-state-card"
      className={`col-span-full bg-surface-card rounded-3xl border border-border-subtle p-6 sm:p-8 text-center space-y-4 max-w-lg mx-auto shadow-sm ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-surface-raised border border-border-subtle flex items-center justify-center mx-auto text-primary-lime">
        <MapPin size={26} strokeWidth={2.5} />
      </div>

      <div className="space-y-1">
        <h3 className="text-base sm:text-lg font-black text-text-primary tracking-tight font-display">
          No pitches listed yet
        </h3>
        <p className="text-xs sm:text-sm text-text-secondary">
          We&apos;re onboarding grounds across Kampala.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
        <button
          id="empty-state-list-pitch-btn"
          type="button"
          onClick={() => navigate("/auth?role=owner", { state: { isOwner: true, role: "owner" } })}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-primary-lime hover:bg-[#96E600] text-accent-text text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95"
        >
          <PlusCircle size={15} strokeWidth={2.5} />
          <span>List your pitch</span>
        </button>

        <button
          id="empty-state-invite-owner-btn"
          type="button"
          onClick={handleShareInvite}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-surface-raised hover:bg-border-subtle border border-border-subtle text-xs font-bold text-text-primary hover:text-primary-lime transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
        >
          <Share2 size={15} />
          <span>Invite a pitch owner</span>
        </button>
      </div>
    </div>
  );
};
