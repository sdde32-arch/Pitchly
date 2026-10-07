import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import {
  Shield,
  Users,
  MapPin,
  Calendar,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  MessageSquare,
  AlertCircle,
  Loader2,
  ChevronLeft,
  Share2,
} from "lucide-react";
import { useUser } from "../context/UserContext";
import { Team } from "../types/firebase";
import { teamService } from "../services/teamService";
import { chatService } from "../services/chatService";

export const JoinTeam: React.FC = () => {
  const { inviteCode: paramCode } = useParams<{ inviteCode?: string }>();
  const [searchParams] = useSearchParams();
  const queryCode = searchParams.get("code") || searchParams.get("invite");
  const code = (paramCode || queryCode || "").trim().toUpperCase();

  const navigate = useNavigate();
  const { user, userProfile } = useUser();

  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joinedSuccess, setJoinedSuccess] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  useEffect(() => {
    if (!code) {
      setLoading(false);
      setError("No squad invite code provided in the link.");
      return;
    }

    const loadSquad = async () => {
      setLoading(true);
      setError(null);
      try {
        const found = await teamService.getByInviteCode(code);
        if (found) {
          setTeam(found);
        } else {
          setError(`No active squad was found matching invite code "${code}". The link may have expired or been regenerated.`);
        }
      } catch (err: any) {
        setError(err?.message || "Failed to retrieve squad details");
      } finally {
        setLoading(false);
      }
    };

    loadSquad();
  }, [code]);

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

    const playerName = userProfile?.name || user?.displayName || guestName.trim();
    if (!playerName) {
      setError("Please provide your name so teammates know who you are.");
      return;
    }

    setJoining(true);
    setError(null);

    try {
      const { team: updatedTeam } = await teamService.joinByInviteCode(code, {
        userId: user?.uid || `guest_${Date.now()}`,
        name: playerName,
        contact: userProfile?.phone || guestPhone.trim(),
        avatar: (userProfile as any)?.photoURL || user?.photoURL,
      });

      setTeam(updatedTeam);
      setJoinedSuccess(true);
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
      navigate(`/chat/${convId}`);
    } catch (err) {
      console.error("Failed to open chat:", err);
      navigate("/teams");
    }
  };

  return (
    <Layout>
      <div className="min-h-full bg-app-base text-text-primary font-body pb-24 pt-4 px-4 sm:px-6">
        <div className="max-w-md mx-auto space-y-6">
          {/* Top navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/teams")}
              className="flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
              <span>Back to Squads</span>
            </button>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary-lime/10 text-primary-lime border border-primary-lime/25">
              Pitchly Squad Invite
            </span>
          </div>

          {/* Loading */}
          {loading && (
            <div className="py-20 text-center space-y-3 bg-surface-card rounded-3xl border border-border-subtle p-6">
              <Loader2 size={32} className="animate-spin text-primary-lime mx-auto" />
              <h3 className="font-display text-base font-bold text-text-primary">
                Connecting to Squad...
              </h3>
              <p className="text-xs text-text-secondary">
                Verifying invite link and loading squad roster
              </p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="bg-surface-card rounded-3xl border border-border-subtle p-6 space-y-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
                <AlertCircle size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-base font-bold text-text-primary">
                  Squad Invite Not Found
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {error}
                </p>
              </div>
              <button
                onClick={() => navigate("/teams")}
                className="w-full py-3 rounded-xl bg-surface-raised hover:bg-border-subtle text-xs font-bold text-text-primary transition-colors"
              >
                Browse All Squads
              </button>
            </div>
          )}

          {/* Success State */}
          {!loading && joinedSuccess && team && (
            <div className="bg-surface-card rounded-3xl border border-border-subtle p-6 text-center space-y-5 shadow-xl animate-fadeIn">
              <div className="w-16 h-16 rounded-3xl bg-primary-lime/20 border border-primary-lime/40 text-primary-lime flex items-center justify-center mx-auto shadow-lg shadow-primary-lime/15">
                <CheckCircle2 size={36} strokeWidth={2.5} />
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary-lime">
                  Official Squad Signing
                </span>
                <h2 className="font-display text-2xl font-black text-text-primary">
                  Welcome to {team.name}!
                </h2>
                <p className="text-xs text-text-secondary max-w-xs mx-auto leading-relaxed">
                  You are now an active member of this squad. Join team chat to plan upcoming fixtures and matchday bibs.
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={handleOpenTeamChat}
                  className="w-full h-12 rounded-xl bg-primary-lime hover:bg-primary-lime-hover text-black text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-primary-lime/20 active:scale-95"
                >
                  <MessageSquare size={16} />
                  <span>Open Squad Chat</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/teams")}
                  className="w-full h-11 rounded-xl bg-surface-raised hover:bg-border-subtle border border-border-subtle text-text-primary text-xs font-bold transition-all cursor-pointer"
                >
                  View Squad Hub & Matches
                </button>
              </div>
            </div>
          )}

          {/* Main Squad Preview & Join Card */}
          {!loading && !joinedSuccess && team && (
            <div className="bg-surface-card rounded-3xl border border-border-subtle overflow-hidden shadow-xl space-y-5 animate-fadeIn">
              {/* Stadium Banner Header */}
              <div className="relative h-36 bg-gradient-to-tr from-black via-zinc-900 to-zinc-800 p-5 flex flex-col justify-between border-b border-border-subtle">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-primary-lime/20 text-primary-lime border border-primary-lime/30">
                    {team.type || "7-a-side"}
                  </span>
                  <span className="font-mono tabular-nums text-xs font-bold text-white/70">
                    Code: {team.inviteCode}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-black/60 border border-white/15 flex items-center justify-center font-display font-black text-xl text-primary-lime shadow-md">
                    {team.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h1 className="font-display text-xl font-extrabold text-white tracking-tight">
                      {team.name}
                    </h1>
                    {team.location && (
                      <p className="text-xs text-white/75 flex items-center gap-1 mt-0.5">
                        <MapPin size={12} className="text-primary-lime shrink-0" />
                        <span>{team.location}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Squad Details Body */}
              <div className="p-5 sm:p-6 pt-0 space-y-5">
                {team.description && (
                  <p className="text-xs text-text-secondary leading-relaxed bg-surface-raised p-3 rounded-xl border border-border-subtle">
                    "{team.description}"
                  </p>
                )}

                {/* Roster & Captain Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-surface-raised border border-border-subtle">
                    <span className="text-[10px] font-bold text-text-tertiary uppercase block">
                      Active Players
                    </span>
                    <span className="font-mono tabular-nums text-lg font-black text-text-primary">
                      {currentMembers.length}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-raised border border-border-subtle">
                    <span className="text-[10px] font-bold text-text-tertiary uppercase block">
                      Squad Captain
                    </span>
                    <span className="text-sm font-bold text-text-primary truncate block">
                      {currentMembers.find((m) => m.isCaptain)?.name || "Captain"}
                    </span>
                  </div>
                </div>

                {/* Existing Members Roster Preview */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-text-secondary">Current Squad Roster</span>
                    <span className="text-[11px] text-text-tertiary">
                      {currentMembers.length} joined
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto no-scrollbar">
                    {currentMembers.map((m, idx) => (
                      <div
                        key={m.id || idx}
                        className="flex items-center justify-between p-2 rounded-xl bg-surface-raised text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-border-subtle flex items-center justify-center font-bold text-[10px]">
                            {(m.name || "?")[0]}
                          </div>
                          <span className="font-semibold text-text-primary">{m.name}</span>
                        </div>
                        {m.isCaptain && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-primary-lime/15 text-primary-lime border border-primary-lime/30">
                            Captain
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Already a member notice */}
                {isAlreadyMember ? (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                      <CheckCircle2 size={16} />
                      <span>You are already an active player on this squad!</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate("/teams")}
                      className="w-full py-2.5 rounded-xl bg-primary-lime text-black text-xs font-black cursor-pointer shadow-sm"
                    >
                      Go to Squad Hub
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 pt-2 border-t border-border-subtle">
                    {/* Guest input if not logged in */}
                    {!user && (
                      <div className="space-y-2 p-3 bg-surface-raised rounded-2xl border border-border-subtle">
                        <span className="text-[11px] font-bold text-text-secondary block">
                          Enter your player name to join
                        </span>
                        <input
                          type="text"
                          placeholder="Your Full Name (e.g. Brian Ssebo)"
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

                    <button
                      id="join-squad-action-btn"
                      type="button"
                      disabled={joining}
                      onClick={handleJoin}
                      className="w-full h-12 rounded-2xl bg-primary-lime hover:bg-primary-lime-hover text-black text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-primary-lime/20 active:scale-95 disabled:opacity-50"
                    >
                      {joining ? (
                        <Loader2 size={18} className="animate-spin text-black" />
                      ) : (
                        <>
                          <Sparkles size={16} />
                          <span>Join {team.name} Roster</span>
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default JoinTeam;
