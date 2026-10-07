import React, { useState, useEffect } from "react";
import {
  Shield,
  Users,
  CheckCircle2,
  X,
  Loader2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  MessageSquare,
  MapPin,
  Calendar,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { Team } from "../../types/firebase";
import { teamService } from "../../services/teamService";
import { chatService } from "../../services/chatService";

interface JoinTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  inviteCode?: string;
  onJoinedSuccess?: (joinedTeam: Team) => void;
}

export const JoinTeamModal: React.FC<JoinTeamModalProps> = ({
  isOpen,
  onClose,
  inviteCode = "",
  onJoinedSuccess,
}) => {
  const navigate = useNavigate();
  const { user, userProfile } = useUser();

  const [inputCode, setInputCode] = useState(inviteCode);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [joinedSuccess, setJoinedSuccess] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  // Sync inviteCode prop
  useEffect(() => {
    if (inviteCode) {
      setInputCode(inviteCode);
      lookupSquad(inviteCode);
    } else {
      setTeam(null);
      setError(null);
      setJoinedSuccess(false);
    }
  }, [inviteCode, isOpen]);

  const lookupSquad = async (codeToLookup: string) => {
    if (!codeToLookup.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const found = await teamService.getByInviteCode(codeToLookup.trim());
      if (found) {
        setTeam(found);
      } else {
        setTeam(null);
        setError(`No squad found matching invite code "${codeToLookup.trim().toUpperCase()}". Please check the code and try again.`);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to find squad");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentMembers = team?.members || [];
  const currentUserId = user?.uid;
  const isAlreadyMember = Boolean(
    team &&
      currentUserId &&
      currentMembers.some(
        (m) =>
          m.userId === currentUserId ||
          (userProfile?.name && m.name.toLowerCase() === userProfile.name.toLowerCase())
      )
  );

  const handleJoin = async () => {
    if (!team) return;

    // Check member details
    const playerName = userProfile?.name || user?.displayName || guestName.trim();
    if (!playerName) {
      setError("Please enter your player name to join the squad roster.");
      return;
    }

    setJoining(true);
    setError(null);

    try {
      const { team: updatedTeam } = await teamService.joinByInviteCode(
        team.inviteCode || inputCode,
        {
          userId: user?.uid || `guest_${Date.now()}`,
          name: playerName,
          contact: userProfile?.phone || guestPhone.trim(),
          avatar: (userProfile as any)?.photoURL || user?.photoURL,
        }
      );

      setTeam(updatedTeam);
      setJoinedSuccess(true);
      if (onJoinedSuccess) onJoinedSuccess(updatedTeam);
    } catch (err: any) {
      setError(err?.message || "Failed to join squad");
    } finally {
      setJoining(false);
    }
  };

  const handleOpenTeamChat = async () => {
    if (!team) return;
    try {
      const participantIds = (team.members || []).map((m: any) => m.userId).filter(Boolean);
      if (user?.uid && !participantIds.includes(user.uid)) {
        participantIds.push(user.uid);
      }
      const convId = await chatService.createTeamConversation(team.id, team.name, participantIds);
      onClose();
      navigate(`/chat/${convId}`);
    } catch (err) {
      console.error("Failed to open squad chat:", err);
      onClose();
      navigate("/teams");
    }
  };

  return (
    <div
      id="join-team-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="join-team-modal-content"
        className="bg-surface-card border border-border-subtle w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 text-text-primary relative max-h-[92vh] overflow-y-auto no-scrollbar"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border-subtle pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary-lime/15 border border-primary-lime/30 text-primary-lime flex items-center justify-center font-display font-black text-lg shadow-sm">
              <Shield size={22} className="text-primary-lime" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary-lime/15 text-primary-lime border border-primary-lime/25">
                Squad Invitation
              </span>
              <h2 className="font-display text-lg sm:text-xl font-extrabold text-text-primary tracking-tight mt-0.5">
                Join Football Squad
              </h2>
            </div>
          </div>

          <button
            id="close-join-team-modal-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-surface-raised flex items-center justify-center text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Code Input Form if no team loaded or user wants to enter code manually */}
        {!inviteCode && !joinedSuccess && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-secondary block">
              Enter Squad Invite Code
            </label>
            <div className="flex gap-2">
              <input
                id="join-squad-code-input"
                type="text"
                placeholder="e.g. NTINDA-7701"
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") lookupSquad(inputCode);
                }}
                className="flex-1 h-11 px-3.5 rounded-xl bg-surface-raised border border-border-subtle text-xs font-mono font-bold uppercase text-text-primary focus:outline-none focus:border-primary-lime"
              />
              <button
                id="lookup-squad-btn"
                type="button"
                disabled={loading || !inputCode.trim()}
                onClick={() => lookupSquad(inputCode)}
                className="h-11 px-4 rounded-xl bg-surface-raised hover:bg-border-subtle border border-border-subtle text-xs font-bold text-text-primary transition-colors cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : "Lookup"}
              </button>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="py-8 text-center space-y-2">
            <Loader2 size={24} className="animate-spin text-primary-lime mx-auto" />
            <p className="text-xs text-text-secondary">Looking up squad details...</p>
          </div>
        )}

        {/* Success State */}
        {joinedSuccess && team && (
          <div className="py-4 text-center space-y-4 animate-fadeIn">
            <div className="w-16 h-16 rounded-3xl bg-primary-lime/20 border border-primary-lime/40 text-primary-lime flex items-center justify-center mx-auto shadow-lg shadow-primary-lime/10">
              <CheckCircle2 size={36} strokeWidth={2.5} />
            </div>

            <div className="space-y-1">
              <h3 className="font-display text-xl font-extrabold text-text-primary">
                Welcome to {team.name}!
              </h3>
              <p className="text-xs text-text-secondary max-w-xs mx-auto">
                You are now officially listed on the squad roster. You can chat with teammates, sign up for matches, and coordinate lineups.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                id="join-success-open-chat-btn"
                type="button"
                onClick={handleOpenTeamChat}
                className="w-full h-11 rounded-xl bg-primary-lime hover:bg-primary-lime-hover text-black text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95"
              >
                <MessageSquare size={15} />
                <span>Open Squad Chat</span>
              </button>

              <button
                id="join-success-view-squad-btn"
                type="button"
                onClick={() => {
                  onClose();
                  navigate("/teams");
                }}
                className="w-full h-11 rounded-xl bg-surface-raised hover:bg-border-subtle border border-border-subtle text-text-primary text-xs font-bold transition-all cursor-pointer"
              >
                View Squad Hub
              </button>
            </div>
          </div>
        )}

        {/* Team Details & Join Confirmation View */}
        {!joinedSuccess && team && !loading && (
          <div className="space-y-4 animate-fadeIn">
            {/* Squad Hero Card */}
            <div className="bg-surface-raised rounded-2xl p-4 border border-border-subtle space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-primary-lime/20 text-primary-lime border border-primary-lime/30">
                      {team.type || "7-a-side"}
                    </span>
                    <span className="text-xs text-text-tertiary font-bold">
                      {currentMembers.length} active players
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-black text-text-primary tracking-tight">
                    {team.name}
                  </h3>
                  {team.location && (
                    <p className="text-xs text-text-secondary flex items-center gap-1">
                      <MapPin size={12} className="text-primary-lime shrink-0" />
                      <span>{team.location}</span>
                    </p>
                  )}
                </div>

                <div className="w-12 h-12 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center font-display font-black text-base text-primary-lime shrink-0">
                  {team.name.substring(0, 2).toUpperCase()}
                </div>
              </div>

              {team.description && (
                <p className="text-xs text-text-secondary border-t border-border-subtle pt-2 leading-relaxed">
                  "{team.description}"
                </p>
              )}

              {/* Roster preview avatars */}
              <div className="pt-2 border-t border-border-subtle flex items-center justify-between">
                <span className="text-[11px] font-bold text-text-tertiary">Current Roster</span>
                <div className="flex -space-x-1.5 overflow-hidden">
                  {currentMembers.slice(0, 5).map((m, idx) => (
                    <div
                      key={m.id || idx}
                      className="w-7 h-7 rounded-full bg-border-subtle border-2 border-surface-raised flex items-center justify-center text-[10px] font-bold text-text-primary"
                      title={m.name}
                    >
                      {m.avatar ? (
                        <img src={m.avatar} alt={m.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        (m.name || "?")[0]
                      )}
                    </div>
                  ))}
                  {currentMembers.length > 5 && (
                    <div className="w-7 h-7 rounded-full bg-primary-lime text-black border-2 border-surface-raised flex items-center justify-center text-[9px] font-black">
                      +{currentMembers.length - 5}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Already a member notice */}
            {isAlreadyMember ? (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <CheckCircle2 size={16} />
                  <span>You are already a member of this squad!</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate("/teams");
                  }}
                  className="w-full py-2.5 rounded-xl bg-primary-lime text-black text-xs font-black cursor-pointer shadow-sm"
                >
                  Go to Squad Hub
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Guest name inputs if user is not authenticated */}
                {!user && (
                  <div className="space-y-2 p-3 bg-surface-raised rounded-2xl border border-border-subtle">
                    <span className="text-[11px] font-bold text-text-secondary block">
                      Player Profile Details
                    </span>
                    <input
                      type="text"
                      placeholder="Your Full Name (e.g. Dennis Mukasa)"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-surface-card border border-border-subtle text-xs text-text-primary focus:outline-none focus:border-primary-lime"
                    />
                    <input
                      type="tel"
                      placeholder="Phone / WhatsApp (optional)"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-surface-card border border-border-subtle text-xs text-text-primary focus:outline-none focus:border-primary-lime"
                    />
                  </div>
                )}

                {/* Primary Join Action */}
                <button
                  id="confirm-join-squad-btn"
                  type="button"
                  disabled={joining}
                  onClick={handleJoin}
                  className="w-full h-12 rounded-2xl bg-primary-lime hover:bg-primary-lime-hover text-black text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-primary-lime/20 active:scale-95 disabled:opacity-50"
                >
                  {joining ? (
                    <Loader2 size={18} className="animate-spin text-black" />
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Join {team.name} Now</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
