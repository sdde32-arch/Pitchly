import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Trophy,
  Flame,
  Medal,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  Share2,
  Check,
  Radio,
  UserCheck,
  Sparkles,
  ChevronRight,
  Shield,
  Zap,
} from "lucide-react";
import { tournamentService } from "../../services/tournamentService";
import {
  TournamentFixture,
  TournamentScorer,
  TournamentNominee,
  DEFAULT_TOURNAMENT,
  FixtureStatus,
} from "../../types/tournament";
import { Logo } from "../../components/Logo";

type ActiveTab = "scores" | "scorers" | "motm";

export const TournamentHub: React.FC = () => {
  const { tournamentId = DEFAULT_TOURNAMENT.id } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<ActiveTab>("scores");
  const [fixtures, setFixtures] = useState<TournamentFixture[]>([]);
  const [scorers, setScorers] = useState<TournamentScorer[]>([]);
  const [nominees, setNominees] = useState<TournamentNominee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Voting state (One vote per browser enforced via localStorage key `voted_${tournamentId}`)
  const [votedNomineeId, setVotedNomineeId] = useState<string | null>(() =>
    tournamentService.getVotedNomineeId(tournamentId)
  );
  const [votingId, setVotingId] = useState<string | null>(null);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [justVotedSuccess, setJustVotedSuccess] = useState<boolean>(false);

  // Sync voted state when tournamentId changes
  useEffect(() => {
    setVotedNomineeId(tournamentService.getVotedNomineeId(tournamentId));
  }, [tournamentId]);

  // Real-time Firestore subscriptions via onSnapshot
  useEffect(() => {
    setLoading(true);
    let loadedCount = 0;
    const checkLoaded = () => {
      loadedCount++;
      if (loadedCount >= 3) {
        setLoading(false);
      }
    };

    // 1. Subscribe to Fixtures
    const unsubFixtures = tournamentService.subscribeToFixtures(
      tournamentId,
      (data) => {
        setFixtures(data);
        checkLoaded();
      },
      () => checkLoaded()
    );

    // 2. Subscribe to Scorers
    const unsubScorers = tournamentService.subscribeToScorers(
      tournamentId,
      (data) => {
        setScorers(data);
        checkLoaded();
      },
      () => checkLoaded()
    );

    // 3. Subscribe to MOTM Nominees
    const unsubNominees = tournamentService.subscribeToNominees(
      tournamentId,
      (data) => {
        setNominees(data);
        checkLoaded();
      },
      () => checkLoaded()
    );

    return () => {
      unsubFixtures();
      unsubScorers();
      unsubNominees();
    };
  }, [tournamentId]);

  // Handle Share link
  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "WEHAT Soccer Tournament • Live Hub",
          text: "Follow live scores, top goal scorers, and vote for Man of the Match!",
          url,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    await navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Handle MOTM Vote
  const handleVote = async (nomineeId: string) => {
    if (votedNomineeId) return;
    setVotingId(nomineeId);
    setVoteError(null);

    try {
      await tournamentService.voteForNominee(tournamentId, nomineeId);
      setVotedNomineeId(nomineeId);
      setJustVotedSuccess(true);
      setTimeout(() => setJustVotedSuccess(false), 3000);
    } catch (err: any) {
      console.error("Voting error:", err);
      setVoteError(err?.message || "Failed to record vote. Please try again.");
    } finally {
      setVotingId(null);
    }
  };

  // Auto-seed template if user visits empty tournament
  const handleQuickSeed = async () => {
    try {
      setLoading(true);
      await tournamentService.seedWehatTournament(tournamentId);
    } catch (err) {
      console.error("Seed error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Stats for the header
  const liveCount = useMemo(
    () => fixtures.filter((f) => f.status === "live").length,
    [fixtures]
  );
  const totalVotes = useMemo(
    () => nominees.reduce((acc, curr) => acc + (curr.voteCount || 0), 0),
    [nominees]
  );

  return (
    <div
      id="tournament-hub-root"
      className="min-h-full bg-app-base text-text-primary font-body pb-24 selection:bg-primary-lime/30"
    >
      {/* 1. TOP BRAND & SHARE NAVIGATION */}
      <header className="sticky top-0 z-40 bg-surface-card/95 backdrop-blur-md border-b border-border-subtle px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => navigate("/home")}
            title="Pitchly Home"
          >
            <Logo size={28} showText={true} showTagline={false} variant="auto" />
            <span className="hidden sm:inline-block text-[11px] font-bold text-text-secondary uppercase tracking-widest pl-2 border-l border-border-subtle">
              Tournament Hub
            </span>
          </div>

          <div className="flex items-center gap-2">
            {liveCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-primary-lime/15 text-primary-lime border border-primary-lime/30 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-primary-lime animate-pulse" />
                {liveCount} Live
              </span>
            )}
            <button
              id="tournament-share-btn"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-text-primary bg-surface-card hover:bg-surface-raised border border-border-subtle transition-all cursor-pointer active:scale-95 shadow-xs"
              title="Share Tournament Link"
            >
              {copiedLink ? (
                <>
                  <Check size={14} className="text-primary-lime" />
                  <span className="text-primary-lime">Copied</span>
                </>
              ) : (
                <>
                  <Share2 size={14} className="text-text-secondary" />
                  <span>Share</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* 2. TOURNAMENT HERO BANNER */}
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-4">
        <div className="bg-surface-card border border-border-subtle rounded-2xl p-5 sm:p-6 relative overflow-hidden shadow-xl">
          {/* Subtle lime glow accent */}
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-primary-lime/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-primary-lime/15 text-primary-lime border border-primary-lime/30 text-[11px] font-black uppercase tracking-wider">
                WEHAT Season 2
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-surface-raised text-text-secondary border border-border-subtle text-[11px] font-bold">
                Week 1
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-text-secondary">
                <Radio size={12} className="text-primary-lime animate-pulse" />
                Real-time Sync
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight font-display uppercase">
                WEHAT Soccer Tournament
              </h1>
              <p className="text-xs sm:text-sm text-text-secondary mt-1 max-w-xl">
                Official public match center: real-time scores, Golden Boot race, and live fan voting.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-xs text-text-secondary border-t border-border-subtle/70">
              <div className="flex items-center gap-1.5">
                <Calendar size={14} className="text-primary-lime" />
                <span className="font-semibold text-text-primary">12 Sept 2026</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin size={14} className="text-primary-lime" />
                <span>Tal Olympic, Bayern Munyonyo</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. THREE PRIMARY TABS */}
      <div className="max-w-4xl mx-auto px-4 sticky top-14 z-30 bg-app-base/95 backdrop-blur-md pt-2 pb-3">
        <div
          id="tournament-tabs-bar"
          className="grid grid-cols-3 gap-1.5 p-1.5 bg-surface-card border border-border-subtle rounded-2xl shadow-md"
        >
          {/* Tab 1: Live Scores */}
          <button
            id="tab-live-scores"
            onClick={() => setActiveTab("scores")}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "scores"
                ? "bg-primary-lime text-accent-text font-black shadow-xs"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-raised"
            }`}
          >
            <Clock size={16} className={activeTab === "scores" ? "text-accent-text" : "text-text-secondary"} />
            <span className="truncate">Live Scores</span>
            {liveCount > 0 && (
              <span
                className={`w-2 h-2 rounded-full ${
                  activeTab === "scores" ? "bg-accent-text" : "bg-primary-lime"
                } animate-pulse shrink-0`}
              />
            )}
          </button>

          {/* Tab 2: Top Scorer */}
          <button
            id="tab-top-scorer"
            onClick={() => setActiveTab("scorers")}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "scorers"
                ? "bg-primary-lime text-accent-text font-black shadow-xs"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-raised"
            }`}
          >
            <Flame size={16} className={activeTab === "scorers" ? "text-accent-text" : "text-text-secondary"} />
            <span className="truncate">Top Scorer</span>
          </button>

          {/* Tab 3: Man of the Match */}
          <button
            id="tab-motm"
            onClick={() => setActiveTab("motm")}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "motm"
                ? "bg-primary-lime text-accent-text font-black shadow-xs"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-raised"
            }`}
          >
            <Trophy size={16} className={activeTab === "motm" ? "text-accent-text" : "text-text-secondary"} />
            <span className="truncate">Man of Match</span>
            {votedNomineeId && (
              <CheckCircle2
                size={13}
                className={activeTab === "motm" ? "text-accent-text" : "text-primary-lime"}
              />
            )}
          </button>
        </div>
      </div>

      {/* 4. MAIN TAB CONTENT */}
      <main className="max-w-4xl mx-auto px-4 pt-3">
        {/* TAB 1: LIVE SCORES */}
        {activeTab === "scores" && (
          <div id="panel-live-scores" className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-text-primary">
                  Matchday Fixtures & Results
                </h2>
                <p className="text-xs text-text-secondary">
                  Scores update automatically as match controllers record goals.
                </p>
              </div>
              <span className="text-xs font-bold text-text-secondary">
                {fixtures.length} {fixtures.length === 1 ? "Match" : "Matches"}
              </span>
            </div>

            {loading && fixtures.length === 0 ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-surface-card rounded-2xl border border-border-subtle p-5 h-28 animate-pulse"
                  />
                ))}
              </div>
            ) : fixtures.length === 0 ? (
              <div className="bg-surface-card rounded-2xl border border-border-subtle p-8 text-center space-y-4">
                <Clock size={36} className="text-text-secondary mx-auto" />
                <div>
                  <h3 className="text-base font-bold text-text-primary">No fixtures added yet</h3>
                  <p className="text-xs text-text-secondary mt-1">
                    Fixtures for Week 1 at Tal Olympic are being prepared by the tournament admins.
                  </p>
                </div>
                <button
                  onClick={handleQuickSeed}
                  className="px-4 py-2 rounded-full bg-primary-lime text-accent-text font-black text-xs hover:bg-[#96E600] transition-colors cursor-pointer"
                >
                  Load WEHAT S2 Week 1 Template
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                {fixtures.map((f) => (
                  <FixtureCard key={f.id} fixture={f} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TOP SCORER */}
        {activeTab === "scorers" && (
          <div id="panel-top-scorer" className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-text-primary flex items-center gap-2">
                  <span>Golden Boot Leaderboard</span>
                  <Flame size={18} className="text-primary-lime" />
                </h2>
                <p className="text-xs text-text-secondary">
                  Ranked by total goals scored across the tournament.
                </p>
              </div>
              <span className="text-xs font-bold text-text-secondary">
                {scorers.length} {scorers.length === 1 ? "Player" : "Players"}
              </span>
            </div>

            {loading && scorers.length === 0 ? (
              <div className="space-y-2.5">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="bg-surface-card rounded-2xl border border-border-subtle p-4 h-16 animate-pulse"
                  />
                ))}
              </div>
            ) : scorers.length === 0 ? (
              <div className="bg-surface-card rounded-2xl border border-border-subtle p-8 text-center space-y-4">
                <Trophy size={36} className="text-text-secondary mx-auto" />
                <div>
                  <h3 className="text-base font-bold text-text-primary">No scorers listed yet</h3>
                  <p className="text-xs text-text-secondary mt-1">
                    Scorers will appear here as goals are logged in live matches.
                  </p>
                </div>
                <button
                  onClick={handleQuickSeed}
                  className="px-4 py-2 rounded-full bg-primary-lime text-accent-text font-black text-xs hover:bg-[#96E600] transition-colors cursor-pointer"
                >
                  Load WEHAT S2 Week 1 Template
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {scorers.map((s, index) => {
                  const isFirst = index === 0 && (s.goals || 0) > 0;
                  return (
                    <div
                      key={s.id}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                        isFirst
                          ? "bg-surface-card border-primary-lime shadow-[0_0_15px_rgba(168,255,0,0.15)] ring-1 ring-primary-lime/40"
                          : "bg-surface-card border-border-subtle"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Rank Badge */}
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border ${
                            isFirst
                              ? "bg-primary-lime text-accent-text border-primary-lime"
                              : index === 1
                              ? "bg-surface-raised text-text-primary border-border-subtle"
                              : index === 2
                              ? "bg-surface-raised text-text-primary border-border-subtle"
                              : "bg-surface-card text-text-secondary border-border-subtle"
                          }`}
                        >
                          {index === 0 ? (
                            <Medal size={18} className="text-accent-text" />
                          ) : (
                            `#${index + 1}`
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm sm:text-base font-bold text-text-primary truncate">
                              {s.playerName}
                            </span>
                            {isFirst && (
                              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary-lime/20 text-primary-lime border border-primary-lime/30">
                                Leader
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-text-secondary truncate">{s.teamName}</p>
                        </div>
                      </div>

                      {/* Goal Count */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div
                          className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 border ${
                            isFirst
                              ? "bg-primary-lime/15 border-primary-lime/40 text-primary-lime"
                              : "bg-surface-raised border-border-subtle text-text-primary"
                          }`}
                        >
                          <Flame
                            size={16}
                            className={isFirst ? "text-primary-lime" : "text-text-secondary"}
                          />
                          <span className="text-base sm:text-lg font-black font-display">
                            {s.goals}
                          </span>
                          <span className="text-[11px] font-bold text-text-secondary uppercase">
                            {s.goals === 1 ? "Goal" : "Goals"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MAN OF THE MATCH */}
        {activeTab === "motm" && (
          <div id="panel-motm" className="space-y-4 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
              <div>
                <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-text-primary flex items-center gap-2">
                  <span>Man of the Match Voting</span>
                  <Sparkles size={18} className="text-primary-lime" />
                </h2>
                <p className="text-xs text-text-secondary">
                  Fan voting is live. One vote per browser is allowed.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-surface-card border border-border-subtle text-xs font-bold text-text-secondary">
                  {totalVotes} {totalVotes === 1 ? "Total Vote" : "Total Votes"}
                </span>
              </div>
            </div>

            {/* Voting feedback banners */}
            {votedNomineeId ? (
              <div className="bg-surface-card border border-primary-lime/30 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary-lime/20 text-primary-lime flex items-center justify-center shrink-0 border border-primary-lime/40">
                  <CheckCircle2 size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-black text-text-primary uppercase tracking-tight">
                    You've already voted
                  </p>
                  <p className="text-xs text-text-secondary">
                    Your pick has been counted. Thank you for voting in WEHAT Season 2!
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-surface-card border border-border-subtle rounded-2xl p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary-lime/10 text-primary-lime flex items-center justify-center shrink-0 border border-primary-lime/20">
                  <Zap size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-text-primary">
                    Select your MVP below to cast your vote
                  </p>
                  <p className="text-[11px] text-text-secondary">
                    Votes update the leaderboard in real-time across all spectators.
                  </p>
                </div>
              </div>
            )}

            {voteError && (
              <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-2xl p-3 text-xs text-[#EF4444]">
                {voteError}
              </div>
            )}

            {justVotedSuccess && (
              <div className="bg-primary-lime/15 border border-primary-lime/40 rounded-2xl p-3 text-xs text-primary-lime font-bold animate-fadeIn">
                Vote recorded successfully! Leaderboard updated in real time.
              </div>
            )}

            {loading && nominees.length === 0 ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-surface-card rounded-2xl border border-border-subtle p-5 h-24 animate-pulse"
                  />
                ))}
              </div>
            ) : nominees.length === 0 ? (
              <div className="bg-surface-card rounded-2xl border border-border-subtle p-8 text-center space-y-4">
                <Trophy size={36} className="text-text-secondary mx-auto" />
                <div>
                  <h3 className="text-base font-bold text-text-primary">No nominees announced yet</h3>
                  <p className="text-xs text-text-secondary mt-1">
                    Nominees will be posted here as standout performers shine on matchday.
                  </p>
                </div>
                <button
                  onClick={handleQuickSeed}
                  className="px-4 py-2 rounded-full bg-primary-lime text-accent-text font-black text-xs hover:bg-[#96E600] transition-colors cursor-pointer"
                >
                  Load WEHAT S2 Week 1 Template
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                {nominees.map((nominee, idx) => {
                  const isVoted = votedNomineeId === nominee.id;
                  const isLeading = idx === 0 && (nominee.voteCount || 0) > 0;
                  const percentage =
                    totalVotes > 0
                      ? Math.round(((nominee.voteCount || 0) / totalVotes) * 100)
                      : 0;

                  return (
                    <div
                      key={nominee.id}
                      className={`bg-surface-card rounded-2xl border p-4 sm:p-5 relative overflow-hidden transition-all ${
                        isVoted
                          ? "border-primary-lime/50 ring-1 ring-primary-lime/30"
                          : isLeading
                          ? "border-primary-lime/60 shadow-[0_0_15px_rgba(168,255,0,0.1)]"
                          : "border-border-subtle"
                      }`}
                    >
                      {/* Live progress percentage bar in background */}
                      <div
                        className="absolute left-0 bottom-0 top-0 bg-primary-lime/[0.04] pointer-events-none transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />

                      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Nominee Info */}
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Avatar or Jersey */}
                          <div className="relative shrink-0">
                            {nominee.photoUrl ? (
                              <img
                                src={nominee.photoUrl}
                                alt={nominee.nomineeName}
                                className="w-12 h-12 rounded-full object-cover border border-border-subtle"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-surface-raised border border-border-subtle flex items-center justify-center text-text-secondary font-bold">
                                {nominee.nomineeName.charAt(0)}
                              </div>
                            )}

                            {isLeading && (
                              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary-lime text-accent-text flex items-center justify-center shadow-xs">
                                <Trophy size={11} strokeWidth={3} />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm sm:text-base font-black text-text-primary truncate">
                                {nominee.nomineeName}
                              </h3>
                              {isLeading && (
                                <span className="px-2 py-0.5 rounded-full bg-primary-lime/15 text-primary-lime border border-primary-lime/30 text-[10px] font-black uppercase">
                                  Current Leader
                                </span>
                              )}
                              {isVoted && (
                                <span className="px-2 py-0.5 rounded-full bg-primary-lime text-accent-text text-[10px] font-black uppercase">
                                  Your Pick
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-text-secondary truncate">
                              {nominee.teamName} {nominee.position && `• ${nominee.position}`}
                            </p>
                          </div>
                        </div>

                        {/* Votes & Vote Button */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border-subtle/50">
                          <div className="text-left sm:text-right">
                            <div className="flex items-baseline gap-1.5 sm:justify-end">
                              <span className="text-lg font-black text-text-primary font-display">
                                {nominee.voteCount || 0}
                              </span>
                              <span className="text-xs text-text-secondary">
                                ({percentage}%)
                              </span>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                              {nominee.voteCount === 1 ? "Vote" : "Votes"}
                            </span>
                          </div>

                          <button
                            id={`vote-btn-${nominee.id}`}
                            type="button"
                            disabled={!!votedNomineeId || votingId === nominee.id}
                            onClick={() => handleVote(nominee.id)}
                            className={`px-4 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                              isVoted
                                ? "bg-primary-lime text-accent-text cursor-default"
                                : votedNomineeId
                                ? "bg-surface-raised text-text-secondary border border-border-subtle cursor-not-allowed opacity-60"
                                : "bg-primary-lime hover:bg-[#96E600] text-accent-text active:scale-95 shadow-xs"
                            }`}
                          >
                            {votingId === nominee.id
                              ? "Voting..."
                              : isVoted
                              ? "Voted"
                              : votedNomineeId
                              ? "Vote"
                              : "Vote MVP"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* 5. FOOTER NOTICE */}
      <footer className="max-w-4xl mx-auto px-4 pt-12 text-center space-y-2 text-xs text-text-secondary">
        <p>
          WEHAT Soccer Tournament • Live scoring & MOTM voting powered by{" "}
          <strong className="text-text-primary font-bold">Pitchly</strong>.
        </p>
        <p className="text-[11px] text-text-secondary/70">
          Matches hosted at Tal Olympic, Bayern Munyonyo.
        </p>
      </footer>
    </div>
  );
};

// ==========================================
// SUB-COMPONENT: FIXTURE CARD
// ==========================================
const FixtureCard: React.FC<{ fixture: TournamentFixture }> = ({ fixture }) => {
  const isLive = fixture.status === "live";
  const isFinished = fixture.status === "finished";
  const isUpcoming = fixture.status === "upcoming";

  const getStatusBadge = (status: FixtureStatus) => {
    switch (status) {
      case "live":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-primary-lime/15 text-primary-lime border border-primary-lime/30 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-primary-lime animate-pulse" />
            Live
          </span>
        );
      case "finished":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-text-secondary bg-[#1f1f1f] border border-border-subtle">
            Finished
          </span>
        );
      case "upcoming":
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-text-secondary bg-[#262626] border border-border-subtle">
            Upcoming
          </span>
        );
    }
  };

  const hasScores = fixture.homeScore !== null && fixture.awayScore !== null;

  return (
    <div
      className={`bg-surface-card rounded-2xl border p-4 sm:p-5 relative transition-all ${
        isLive
          ? "border-primary-lime shadow-[0_0_20px_rgba(168,255,0,0.12)] ring-1 ring-primary-lime/40"
          : "border-border-subtle"
      }`}
    >
      {/* Top row: Round, Time, Status */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-border-subtle/70 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-text-secondary">
            {fixture.round || "Group Stage"}
          </span>
          {fixture.pitchVenue && (
            <span className="hidden sm:inline-block text-text-secondary/60">•</span>
          )}
          {fixture.pitchVenue && (
            <span className="hidden sm:inline-block text-text-secondary">
              {fixture.pitchVenue}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-text-primary flex items-center gap-1">
            <Clock size={12} className="text-text-secondary" />
            {fixture.time}
          </span>
          {getStatusBadge(fixture.status)}
        </div>
      </div>

      {/* Main Scoreboard row */}
      <div className="pt-3.5 pb-1 flex items-center justify-between gap-3">
        {/* Home Team */}
        <div className="flex-1 text-right min-w-0">
          <h4
            className={`text-sm sm:text-base font-black truncate ${
              hasScores && (fixture.homeScore || 0) > (fixture.awayScore || 0)
                ? "text-primary-lime"
                : "text-text-primary"
            }`}
          >
            {fixture.homeTeam}
          </h4>
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
            Home
          </span>
        </div>

        {/* Center Score / VS Display */}
        <div className="shrink-0 px-3 py-1.5 rounded-xl bg-surface-raised border border-border-subtle min-w-[76px] text-center">
          {hasScores ? (
            <div className="flex items-center justify-center gap-2">
              <span
                className={`text-xl sm:text-2xl font-black font-display ${
                  (fixture.homeScore || 0) > (fixture.awayScore || 0)
                    ? "text-primary-lime"
                    : "text-text-primary"
                }`}
              >
                {fixture.homeScore}
              </span>
              <span className="text-xs font-bold text-text-secondary">:</span>
              <span
                className={`text-xl sm:text-2xl font-black font-display ${
                  (fixture.awayScore || 0) > (fixture.homeScore || 0)
                    ? "text-primary-lime"
                    : "text-text-primary"
                }`}
              >
                {fixture.awayScore}
              </span>
            </div>
          ) : (
            <span className="text-xs font-black uppercase tracking-widest text-text-secondary">
              VS
            </span>
          )}
        </div>

        {/* Away Team */}
        <div className="flex-1 text-left min-w-0">
          <h4
            className={`text-sm sm:text-base font-black truncate ${
              hasScores && (fixture.awayScore || 0) > (fixture.homeScore || 0)
                ? "text-primary-lime"
                : "text-text-primary"
            }`}
          >
            {fixture.awayTeam}
          </h4>
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
            Away
          </span>
        </div>
      </div>
    </div>
  );
};
