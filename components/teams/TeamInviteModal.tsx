import React, { useState } from "react";
import {
  X,
  Share2,
  Copy,
  Check,
  QrCode,
  Shield,
  Users,
  RefreshCw,
  Sparkles,
  ExternalLink,
  MessageCircle,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Team } from "../../types/firebase";
import { teamService, generateSquadInviteUrl } from "../../services/teamService";

interface TeamInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team | null;
  onTeamUpdated?: (updatedTeam: Team) => void;
  isCaptain?: boolean;
}

export const TeamInviteModal: React.FC<TeamInviteModalProps> = ({
  isOpen,
  onClose,
  team,
  onTeamUpdated,
  isCaptain = false,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  if (!isOpen || !team) return null;

  const inviteCode = team.inviteCode || "PITCH-INVITE";
  const inviteUrl = team.inviteUrl || generateSquadInviteUrl(inviteCode);
  const currentMembersCount = team.members?.length || 1;
  const maxSpots = team.maxMembers || (team.type?.includes("11") ? 16 : team.type?.includes("5") ? 8 : 12);
  const spotsLeft = Math.max(0, maxSpots - currentMembersCount);

  const shareText = `⚽ Join my football squad "${team.name}" on Pitchly!\n\nPitch: ${team.location || "Kampala"}\nFormat: ${team.type || "7-a-side"}\n\nTap here to join our roster directly:\n${inviteUrl}\n\nOr use squad invite code: ${inviteCode}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${team.name} on Pitchly`,
          text: `Join my squad "${team.name}"! Use invite code ${inviteCode} or click the link:`,
          url: inviteUrl,
        });
      } catch (err) {
        console.log("Share cancelled or failed:", err);
      }
    } else {
      handleCopyLink();
    }
  };

  const handleWhatsAppShare = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank");
  };

  const handleRegenerateCode = async () => {
    if (!isCaptain) return;
    const confirmRegen = window.confirm(
      "Are you sure you want to regenerate this squad invite link? Previous invite links will no longer work."
    );
    if (!confirmRegen) return;

    setIsRegenerating(true);
    try {
      const { inviteCode: newCode, inviteUrl: newUrl } =
        await teamService.regenerateInviteCode(team.id, team.name);
      const updated: Team = {
        ...team,
        inviteCode: newCode,
        inviteUrl: newUrl,
      };
      if (onTeamUpdated) onTeamUpdated(updated);
    } catch (e) {
      console.error("Error regenerating code:", e);
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div
      id="team-invite-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="team-invite-modal-content"
        className="bg-surface-card border border-border-subtle w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 text-text-primary relative max-h-[92vh] overflow-y-auto no-scrollbar"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border-subtle pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary-lime/15 border border-primary-lime/30 text-primary-lime flex items-center justify-center font-display font-black text-lg shadow-sm">
              <Shield size={22} className="text-primary-lime" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary-lime/15 text-primary-lime border border-primary-lime/25">
                  Squad Invite
                </span>
                <span className="text-xs text-text-tertiary font-medium">
                  {spotsLeft > 0 ? `${spotsLeft} spots open` : "Full Roster"}
                </span>
              </div>
              <h2 className="font-display text-lg sm:text-xl font-extrabold text-text-primary tracking-tight mt-0.5">
                {team.name}
              </h2>
            </div>
          </div>

          <button
            id="close-team-invite-modal-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-surface-raised flex items-center justify-center text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Squad Status Mini Bar */}
        <div className="bg-surface-raised/70 rounded-2xl p-3 border border-border-subtle flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-text-secondary">
            <Users size={14} className="text-primary-lime" />
            <span>
              Current Roster: <strong className="font-mono tabular-nums text-text-primary">{currentMembersCount}</strong> players
            </span>
          </div>
          <span className="text-[11px] font-bold text-text-tertiary">
            Format: {team.type || "7-a-side"}
          </span>
        </div>

        {/* 1. Unique Invite Link Box */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-text-secondary block">
            Unique Squad Invite Link
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                id="team-invite-link-input"
                type="text"
                readOnly
                value={inviteUrl}
                className="w-full h-11 px-3.5 pr-9 rounded-xl bg-surface-raised border border-border-subtle text-xs font-mono text-text-primary focus:outline-none select-all truncate"
              />
            </div>
            <button
              id="copy-invite-link-btn"
              type="button"
              onClick={handleCopyLink}
              className={`h-11 px-4 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 shrink-0 ${
                copiedLink
                  ? "bg-emerald-500 text-white"
                  : "bg-primary-lime hover:bg-primary-lime-hover text-black"
              }`}
            >
              {copiedLink ? <Check size={14} strokeWidth={3} /> : <Copy size={14} />}
              <span>{copiedLink ? "Copied!" : "Copy Link"}</span>
            </button>
          </div>
          <p className="text-[11px] text-text-tertiary">
            Anyone with this link can join your squad directly without approval.
          </p>
        </div>

        {/* 2. Unique Invite Code Banner */}
        <div className="p-3.5 rounded-2xl bg-primary-lime/10 border border-primary-lime/25 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-text-tertiary block">
              Squad Invite Code
            </span>
            <span className="font-mono tabular-nums text-base sm:text-lg font-black text-text-primary tracking-wide">
              {inviteCode}
            </span>
          </div>
          <button
            id="copy-invite-code-btn"
            type="button"
            onClick={handleCopyCode}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 border ${
              copiedCode
                ? "bg-emerald-500 text-white border-emerald-500"
                : "bg-surface-card hover:bg-surface-raised text-text-primary border-border-subtle"
            }`}
          >
            {copiedCode ? <Check size={12} strokeWidth={3} /> : <Copy size={12} />}
            <span>{copiedCode ? "Copied!" : "Copy Code"}</span>
          </button>
        </div>

        {/* 3. Social Share Buttons */}
        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-2 gap-2">
            <button
              id="share-whatsapp-invite-btn"
              type="button"
              onClick={handleWhatsAppShare}
              className="h-11 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <MessageCircle size={15} />
              <span>WhatsApp</span>
            </button>

            <button
              id="share-native-invite-btn"
              type="button"
              onClick={handleNativeShare}
              className="h-11 rounded-xl bg-surface-raised hover:bg-border-subtle border border-border-subtle text-text-primary text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <Share2 size={15} className="text-primary-lime" />
              <span>Share Sheet</span>
            </button>
          </div>
        </div>

        {/* 4. Pitch-side QR Code Toggle */}
        <div className="border-t border-border-subtle pt-3">
          <button
            id="toggle-squad-qr-btn"
            type="button"
            onClick={() => setShowQrCode(!showQrCode)}
            className="w-full flex items-center justify-between text-xs font-bold text-text-secondary hover:text-text-primary py-1 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <QrCode size={15} className="text-primary-lime" />
              <span>Pitch-Side QR Code (Scan with phone)</span>
            </span>
            <span className="text-[11px] text-primary-lime font-black">
              {showQrCode ? "Hide QR" : "Show QR"}
            </span>
          </button>

          {showQrCode && (
            <div className="mt-3 p-4 bg-white rounded-2xl flex flex-col items-center justify-center space-y-2 animate-fadeIn shadow-inner">
              <QRCodeSVG
                value={inviteUrl}
                size={160}
                bgColor="#FFFFFF"
                fgColor="#0D0D0D"
                level="M"
                includeMargin={false}
              />
              <span className="text-[10px] text-zinc-600 font-bold font-mono">
                Scan to join {team.name}
              </span>
            </div>
          )}
        </div>

        {/* Captain Action: Reset Invite Code */}
        {isCaptain && (
          <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-[11px] text-text-tertiary">
            <span>Need to invalidate old links?</span>
            <button
              id="regenerate-invite-code-btn"
              type="button"
              disabled={isRegenerating}
              onClick={handleRegenerateCode}
              className="text-text-secondary hover:text-amber-400 font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RefreshCw size={11} className={isRegenerating ? "animate-spin" : ""} />
              <span>Generate new code</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
