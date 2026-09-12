import React, { useState, useEffect, useRef } from "react";
import {
  Trophy,
  Clock,
  Flame,
  Plus,
  Trash2,
  Edit2,
  Check,
  QrCode,
  Copy,
  ExternalLink,
  Printer,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Save,
  X,
  Radio,
  Sliders,
  Calendar,
  MapPin,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { tournamentService } from "../../services/tournamentService";
import {
  TournamentFixture,
  TournamentScorer,
  TournamentNominee,
  DEFAULT_TOURNAMENT,
  FixtureStatus,
} from "../../types/tournament";

export const TournamentManager: React.FC = () => {
  const [tournamentId, setTournamentId] = useState<string>(DEFAULT_TOURNAMENT.id);
  const [fixtures, setFixtures] = useState<TournamentFixture[]>([]);
  const [scorers, setScorers] = useState<TournamentScorer[]>([]);
  const [nominees, setNominees] = useState<TournamentNominee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Link & QR Code
  const [copied, setCopied] = useState<boolean>(false);
  const qrRef = useRef<HTMLDivElement>(null);

  // Fixture Form state
  const [editingFixtureId, setEditingFixtureId] = useState<string | null>(null);
  const [fixtureForm, setFixtureForm] = useState<{
    time: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: string;
    awayScore: string;
    status: FixtureStatus;
    pitchVenue: string;
    round: string;
  }>({
    time: "2:30 PM",
    homeTeam: "",
    awayTeam: "",
    homeScore: "",
    awayScore: "",
    status: "upcoming",
    pitchVenue: "Tal Olympic, Bayern Munyonyo",
    round: "Group Stage",
  });

  // Scorer Form state
  const [editingScorerId, setEditingScorerId] = useState<string | null>(null);
  const [scorerForm, setScorerForm] = useState<{
    playerName: string;
    teamName: string;
    goals: number;
  }>({
    playerName: "",
    teamName: "",
    goals: 1,
  });

  // Nominee Form state
  const [editingNomineeId, setEditingNomineeId] = useState<string | null>(null);
  const [nomineeForm, setNomineeForm] = useState<{
    nomineeName: string;
    teamName: string;
    photoUrl: string;
    position: string;
    voteCount: number;
  }>({
    nomineeName: "",
    teamName: "",
    photoUrl: "",
    position: "Midfielder",
    voteCount: 0,
  });

  // Subscribe to all 3 collections for this tournament
  useEffect(() => {
    setLoading(true);
    const unsubFixtures = tournamentService.subscribeToFixtures(
      tournamentId,
      (data) => setFixtures(data),
      (err) => console.error(err)
    );
    const unsubScorers = tournamentService.subscribeToScorers(
      tournamentId,
      (data) => setScorers(data),
      (err) => console.error(err)
    );
    const unsubNominees = tournamentService.subscribeToNominees(
      tournamentId,
      (data) => {
        setNominees(data);
        setLoading(false);
      },
      (err) => console.error(err)
    );

    return () => {
      unsubFixtures();
      unsubScorers();
      unsubNominees();
    };
  }, [tournamentId]);

  const publicUrl = typeof window !== "undefined"
    ? `${window.location.origin}/tournament/${tournamentId}`
    : `/tournament/${tournamentId}`;

  const showNotification = (msg: string) => {
    setActionStatus(msg);
    setActionError(null);
    setTimeout(() => setActionStatus(null), 3500);
  };

  const showError = (err: any) => {
    setActionError(err?.message || "An error occurred");
    setTimeout(() => setActionError(null), 4000);
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintFlyer = () => {
    window.print();
  };

  const handleSeedKickoffData = async () => {
    try {
      setLoading(true);
      const res = await tournamentService.seedWehatTournament(tournamentId);
      showNotification(
        `Seeded WEHAT Kickoff data: ${res.fixturesCount} fixtures, ${res.scorersCount} scorers, ${res.nomineesCount} nominees!`
      );
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // FIXTURE ACTIONS
  // ==========================================
  const handleSaveFixture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fixtureForm.homeTeam.trim() || !fixtureForm.awayTeam.trim()) {
      showError(new Error("Please enter both home and away team names"));
      return;
    }

    try {
      const homeScoreVal =
        fixtureForm.homeScore === "" ? null : parseInt(fixtureForm.homeScore, 10);
      const awayScoreVal =
        fixtureForm.awayScore === "" ? null : parseInt(fixtureForm.awayScore, 10);

      if (editingFixtureId) {
        await tournamentService.updateFixture(editingFixtureId, {
          time: fixtureForm.time.trim(),
          homeTeam: fixtureForm.homeTeam.trim(),
          awayTeam: fixtureForm.awayTeam.trim(),
          homeScore: isNaN(homeScoreVal as number) ? null : homeScoreVal,
          awayScore: isNaN(awayScoreVal as number) ? null : awayScoreVal,
          status: fixtureForm.status,
          pitchVenue: fixtureForm.pitchVenue.trim(),
          round: fixtureForm.round.trim(),
        });
        showNotification("Fixture updated successfully!");
        setEditingFixtureId(null);
      } else {
        await tournamentService.addFixture({
          tournamentId,
          time: fixtureForm.time.trim() || "2:30 PM",
          homeTeam: fixtureForm.homeTeam.trim(),
          awayTeam: fixtureForm.awayTeam.trim(),
          homeScore: isNaN(homeScoreVal as number) ? null : homeScoreVal,
          awayScore: isNaN(awayScoreVal as number) ? null : awayScoreVal,
          status: fixtureForm.status,
          pitchVenue: fixtureForm.pitchVenue.trim() || "Tal Olympic, Bayern Munyonyo",
          round: fixtureForm.round.trim() || "Group Stage",
        });
        showNotification("Fixture added to tournament!");
      }

      setFixtureForm({
        time: "3:00 PM",
        homeTeam: "",
        awayTeam: "",
        homeScore: "",
        awayScore: "",
        status: "upcoming",
        pitchVenue: "Tal Olympic, Bayern Munyonyo",
        round: "Group Stage",
      });
    } catch (err) {
      showError(err);
    }
  };

  const handleEditFixtureClick = (f: TournamentFixture) => {
    setEditingFixtureId(f.id);
    setFixtureForm({
      time: f.time || "",
      homeTeam: f.homeTeam || "",
      awayTeam: f.awayTeam || "",
      homeScore: f.homeScore !== null ? String(f.homeScore) : "",
      awayScore: f.awayScore !== null ? String(f.awayScore) : "",
      status: f.status,
      pitchVenue: f.pitchVenue || "Tal Olympic, Bayern Munyonyo",
      round: f.round || "Group Stage",
    });
  };

  const handleDeleteFixture = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this fixture?")) return;
    try {
      await tournamentService.deleteFixture(id);
      showNotification("Fixture deleted.");
    } catch (err) {
      showError(err);
    }
  };

  // ==========================================
  // SCORER ACTIONS
  // ==========================================
  const handleSaveScorer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scorerForm.playerName.trim() || !scorerForm.teamName.trim()) {
      showError(new Error("Please enter player name and team"));
      return;
    }

    try {
      if (editingScorerId) {
        await tournamentService.updateScorer(editingScorerId, {
          playerName: scorerForm.playerName.trim(),
          teamName: scorerForm.teamName.trim(),
          goals: Number(scorerForm.goals) || 0,
        });
        showNotification("Scorer record updated!");
        setEditingScorerId(null);
      } else {
        await tournamentService.addScorer({
          tournamentId,
          playerName: scorerForm.playerName.trim(),
          teamName: scorerForm.teamName.trim(),
          goals: Number(scorerForm.goals) || 1,
        });
        showNotification("Player added to Golden Boot table!");
      }

      setScorerForm({
        playerName: "",
        teamName: "",
        goals: 1,
      });
    } catch (err) {
      showError(err);
    }
  };

  const handleIncrementGoal = async (id: string, delta: number) => {
    try {
      await tournamentService.incrementScorerGoals(id, delta);
      showNotification(delta > 0 ? "Goal incremented! (+1)" : "Goal decremented (-1)");
    } catch (err) {
      showError(err);
    }
  };

  const handleDeleteScorer = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this player from scorers?")) return;
    try {
      await tournamentService.deleteScorer(id);
      showNotification("Scorer removed.");
    } catch (err) {
      showError(err);
    }
  };

  // ==========================================
  // NOMINEE ACTIONS
  // ==========================================
  const handleSaveNominee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomineeForm.nomineeName.trim() || !nomineeForm.teamName.trim()) {
      showError(new Error("Please enter nominee name and team"));
      return;
    }

    try {
      if (editingNomineeId) {
        await tournamentService.updateNominee(editingNomineeId, {
          nomineeName: nomineeForm.nomineeName.trim(),
          teamName: nomineeForm.teamName.trim(),
          photoUrl: nomineeForm.photoUrl.trim(),
          position: nomineeForm.position.trim(),
          voteCount: Number(nomineeForm.voteCount) || 0,
        });
        showNotification("MOTM Nominee updated!");
        setEditingNomineeId(null);
      } else {
        await tournamentService.addNominee({
          tournamentId,
          nomineeName: nomineeForm.nomineeName.trim(),
          teamName: nomineeForm.teamName.trim(),
          photoUrl: nomineeForm.photoUrl.trim(),
          position: nomineeForm.position.trim(),
          voteCount: Number(nomineeForm.voteCount) || 0,
        });
        showNotification("Nominee added to Man of the Match voting!");
      }

      setNomineeForm({
        nomineeName: "",
        teamName: "",
        photoUrl: "",
        position: "Midfielder",
        voteCount: 0,
      });
    } catch (err) {
      showError(err);
    }
  };

  const handleDeleteNominee = async (id: string) => {
    if (!window.confirm("Delete this nominee?")) return;
    try {
      await tournamentService.deleteNominee(id);
      showNotification("Nominee deleted.");
    } catch (err) {
      showError(err);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* 1. SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary-lime/15 text-primary-lime border border-primary-lime/30">
              <Trophy size={20} />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-text-primary uppercase tracking-tight font-display">
              Tournament Manager
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Real-time live scores, top scorers leaderboard, and public Man of the Match voting controller.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSeedKickoffData}
            className="px-3 py-2 rounded-xl bg-surface-card hover:bg-surface-raised border border-border-subtle text-xs font-bold text-text-primary flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-xs"
            title="Pre-populate WEHAT S2 Week 1 Template"
          >
            <Sparkles size={14} className="text-primary-lime" />
            <span>Load WEHAT Template</span>
          </button>

          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-primary-lime hover:bg-[#96E600] text-accent-text text-xs font-black flex items-center gap-1.5 transition-all shadow-xs"
          >
            <span>Preview Hub</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </div>

      {/* Notifications */}
      {actionStatus && (
        <div className="bg-primary-lime/15 border border-primary-lime/40 text-primary-lime px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <Check size={16} />
          <span>{actionStatus}</span>
        </div>
      )}
      {actionError && (
        <div className="bg-[#EF4444]/15 border border-[#EF4444]/40 text-[#EF4444] px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <AlertCircle size={16} />
          <span>{actionError}</span>
        </div>
      )}

      {/* 2. SHAREABLE LINK & QR CODE SECTION */}
      <div className="bg-surface-card border border-border-subtle rounded-2xl p-5 sm:p-6 shadow-md relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-primary-lime/15 text-primary-lime border border-primary-lime/30 text-[10px] font-black uppercase tracking-wider">
                Spectator Portal
              </span>
              <span className="text-xs font-bold text-text-secondary">
                Print Once • Covers Live Scores, Scorers & MOTM Voting
              </span>
            </div>

            <div>
              <h2 className="text-lg font-black text-text-primary uppercase tracking-tight font-display">
                Shareable Link & Print QR Code
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Spectators scan this QR code or click this link to access all 3 live tabs without logging in.
              </p>
            </div>

            {/* URL Display & Copy */}
            <div className="flex items-center gap-2 bg-app-base border border-border-subtle rounded-xl p-1.5 max-w-xl">
              <span className="text-xs font-mono text-text-secondary px-2 truncate flex-1 select-all">
                {publicUrl}
              </span>
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-lg bg-surface-card hover:bg-surface-raised border border-border-subtle text-xs font-bold text-text-primary flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0"
              >
                {copied ? (
                  <>
                    <Check size={13} className="text-primary-lime" />
                    <span className="text-primary-lime">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} className="text-text-secondary" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handlePrintFlyer}
                className="px-3 py-1.5 rounded-lg bg-surface-card hover:bg-surface-raised border border-border-subtle text-xs font-bold text-text-secondary hover:text-text-primary flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer size={13} />
                <span>Print Pitchside Flyer</span>
              </button>
            </div>
          </div>

          {/* QR Code Container */}
          <div
            ref={qrRef}
            className="p-3 bg-white rounded-2xl shadow-lg border border-border-subtle flex flex-col items-center justify-center shrink-0 self-center sm:self-start"
          >
            <QRCodeSVG
              value={publicUrl}
              size={130}
              level="H"
              includeMargin={false}
            />
            <span className="text-[10px] font-black text-black tracking-wider uppercase mt-1.5">
              WEHAT Hub QR
            </span>
          </div>
        </div>
      </div>

      {/* 3. THREE MANAGEMENT COLUMNS / FORMS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ========================================== */}
        {/* COLUMN 1: FIXTURES & LIVE SCORES */}
        {/* ========================================== */}
        <div className="bg-surface-card border border-border-subtle rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm flex flex-col">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-primary-lime" />
              <h3 className="text-sm font-black text-text-primary uppercase tracking-tight">
                {editingFixtureId ? "Edit Fixture" : "Add Match Fixture"}
              </h3>
            </div>
            {editingFixtureId && (
              <button
                onClick={() => {
                  setEditingFixtureId(null);
                  setFixtureForm({
                    time: "2:30 PM",
                    homeTeam: "",
                    awayTeam: "",
                    homeScore: "",
                    awayScore: "",
                    status: "upcoming",
                    pitchVenue: "Tal Olympic, Bayern Munyonyo",
                    round: "Group Stage",
                  });
                }}
                className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1"
              >
                <X size={12} /> Cancel
              </button>
            )}
          </div>

          {/* Add / Edit Form */}
          <form onSubmit={handleSaveFixture} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1">
                  Kickoff Time
                </label>
                <input
                  type="text"
                  value={fixtureForm.time}
                  onChange={(e) =>
                    setFixtureForm((prev) => ({ ...prev, time: e.target.value }))
                  }
                  placeholder="e.g. 2:30 PM"
                  className="w-full bg-app-base border border-border-subtle rounded-xl px-3 py-2 text-text-primary focus:border-primary-lime"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1">
                  Status
                </label>
                <select
                  value={fixtureForm.status}
                  onChange={(e) =>
                    setFixtureForm((prev) => ({
                      ...prev,
                      status: e.target.value as FixtureStatus,
                    }))
                  }
                  className="w-full bg-app-base border border-border-subtle rounded-xl px-3 py-2 text-text-primary focus:border-primary-lime cursor-pointer"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="live">Live Now</option>
                  <option value="finished">Finished</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1">
                Home Team
              </label>
              <input
                type="text"
                value={fixtureForm.homeTeam}
                onChange={(e) =>
                  setFixtureForm((prev) => ({ ...prev, homeTeam: e.target.value }))
                }
                placeholder="e.g. Tal Olympic FC"
                className="w-full bg-app-base border border-border-subtle rounded-xl px-3 py-2 text-text-primary focus:border-primary-lime"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1">
                Away Team
              </label>
              <input
                type="text"
                value={fixtureForm.awayTeam}
                onChange={(e) =>
                  setFixtureForm((prev) => ({ ...prev, awayTeam: e.target.value }))
                }
                placeholder="e.g. Bayern Munyonyo"
                className="w-full bg-app-base border border-border-subtle rounded-xl px-3 py-2 text-text-primary focus:border-primary-lime"
                required
              />
            </div>

            {/* Scores */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1">
                  Home Score
                </label>
                <input
                  type="number"
                  min="0"
                  value={fixtureForm.homeScore}
                  onChange={(e) =>
                    setFixtureForm((prev) => ({ ...prev, homeScore: e.target.value }))
                  }
                  placeholder="Blank for vs"
                  className="w-full bg-app-base border border-border-subtle rounded-xl px-3 py-2 text-text-primary focus:border-primary-lime"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1">
                  Away Score
                </label>
                <input
                  type="number"
                  min="0"
                  value={fixtureForm.awayScore}
                  onChange={(e) =>
                    setFixtureForm((prev) => ({ ...prev, awayScore: e.target.value }))
                  }
                  placeholder="Blank for vs"
                  className="w-full bg-app-base border border-border-subtle rounded-xl px-3 py-2 text-text-primary focus:border-primary-lime"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1">
                  Round
                </label>
                <input
                  type="text"
                  value={fixtureForm.round}
                  onChange={(e) =>
                    setFixtureForm((prev) => ({ ...prev, round: e.target.value }))
                  }
                  placeholder="Group A • Match 1"
                  className="w-full bg-app-base border border-border-subtle rounded-xl px-3 py-2 text-text-primary"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1">
                  Pitch / Venue
                </label>
                <input
                  type="text"
                  value={fixtureForm.pitchVenue}
                  onChange={(e) =>
                    setFixtureForm((prev) => ({ ...prev, pitchVenue: e.target.value }))
                  }
                  placeholder="Tal Olympic - Pitch 1"
                  className="w-full bg-app-base border border-border-subtle rounded-xl px-3 py-2 text-text-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-primary-lime hover:bg-[#96E600] text-accent-text font-black uppercase text-xs tracking-wider transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
            >
              <Save size={14} />
              <span>{editingFixtureId ? "Save Changes" : "Add Fixture"}</span>
            </button>
          </form>

          {/* List of Fixtures */}
          <div className="pt-2 flex-1 space-y-2">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-text-secondary">
              Fixtures ({fixtures.length})
            </h4>
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {fixtures.map((f) => (
                <div
                  key={f.id}
                  className={`p-3 rounded-xl border bg-app-base flex items-center justify-between gap-2 ${
                    f.status === "live"
                      ? "border-primary-lime/60 ring-1 ring-primary-lime/30"
                      : "border-border-subtle"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-[11px] text-text-secondary">
                      <span className="font-mono font-bold text-text-primary">{f.time}</span>
                      <span>•</span>
                      <span className="capitalize font-bold text-primary-lime">
                        {f.status}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-text-primary truncate">
                      {f.homeTeam} {f.homeScore !== null ? `(${f.homeScore})` : ""}{" "}
                      <span className="text-text-secondary">vs</span> {f.awayTeam}{" "}
                      {f.awayScore !== null ? `(${f.awayScore})` : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditFixtureClick(f)}
                      className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-raised cursor-pointer"
                      title="Edit"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteFixture(f.id)}
                      className="p-1.5 rounded-lg text-[#EF4444] hover:bg-[#EF4444]/10 cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* COLUMN 2: TOP SCORERS & LIVE INCREMENT */}
        {/* ========================================== */}
        <div className="bg-surface-card border border-border-subtle rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm flex flex-col">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2">
              <Flame size={16} className="text-primary-lime" />
              <h3 className="text-sm font-black text-text-primary uppercase tracking-tight">
                {editingScorerId ? "Edit Top Scorer" : "Add Top Scorer"}
              </h3>
            </div>
            {editingScorerId && (
              <button
                onClick={() => {
                  setEditingScorerId(null);
                  setScorerForm({ playerName: "", teamName: "", goals: 1 });
                }}
                className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1"
              >
                <X size={12} /> Cancel
              </button>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSaveScorer} className="space-y-3 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1">
                Player Name
              </label>
              <input
                type="text"
                value={scorerForm.playerName}
                onChange={(e) =>
                  setScorerForm((prev) => ({ ...prev, playerName: e.target.value }))
                }
                placeholder="e.g. Hakim 'Kaka' Ssekandi"
                className="w-full bg-app-base border border-border-subtle rounded-xl px-3 py-2 text-text-primary focus:border-primary-lime"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1">
                Team Name
              </label>
              <input
                type="text"
                value={scorerForm.teamName}
                onChange={(e) =>
                  setScorerForm((prev) => ({ ...prev, teamName: e.target.value }))
                }
                placeholder="e.g. Kabalagala Kings"
                className="w-full bg-app-base border border-border-subtle rounded-xl px-3 py-2 text-text-primary focus:border-primary-lime"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1">
                Goals
              </label>
              <input
                type="number"
                min="0"
                value={scorerForm.goals}
                onChange={(e) =>
                  setScorerForm((prev) => ({
                    ...prev,
                    goals: parseInt(e.target.value, 10) || 0,
                  }))
                }
                className="w-full bg-app-base border border-border-subtle rounded-xl px-3 py-2 text-text-primary focus:border-primary-lime"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-primary-lime hover:bg-[#96E600] text-accent-text font-black uppercase text-xs tracking-wider transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
            >
              <Save size={14} />
              <span>{editingScorerId ? "Save Scorer" : "Add Scorer"}</span>
            </button>
          </form>

          {/* List of Scorers with live +1 button */}
          <div className="pt-2 flex-1 space-y-2">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-text-secondary">
              Scorers Leaderboard ({scorers.length}) • Click +1 During Matches
            </h4>
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {scorers.map((s, idx) => (
                <div
                  key={s.id}
                  className="p-3 rounded-xl border border-border-subtle bg-app-base flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-primary-lime">
                        #{idx + 1}
                      </span>
                      <p className="text-xs font-bold text-text-primary truncate">
                        {s.playerName}
                      </p>
                    </div>
                    <p className="text-[11px] text-text-secondary truncate">{s.teamName}</p>
                  </div>

                  {/* Goal counter + Live Quick Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono font-black text-sm text-text-primary px-2 py-0.5 rounded-lg bg-surface-raised border border-border-subtle">
                      {s.goals}g
                    </span>

                    {/* Live +1 button */}
                    <button
                      type="button"
                      onClick={() => handleIncrementGoal(s.id, 1)}
                      className="px-2 py-1 rounded-lg bg-primary-lime/20 hover:bg-primary-lime text-primary-lime hover:text-accent-text font-black text-xs border border-primary-lime/40 transition-colors cursor-pointer"
                      title="Add 1 Goal (Live Update)"
                    >
                      +1
                    </button>

                    <button
                      type="button"
                      onClick={() => handleIncrementGoal(s.id, -1)}
                      className="px-1.5 py-1 rounded-lg bg-surface-raised hover:bg-border-subtle text-text-secondary font-bold text-xs cursor-pointer"
                      title="Minus 1 Goal"
                    >
                      -1
                    </button>

                    <button
                      onClick={() => {
                        setEditingScorerId(s.id);
                        setScorerForm({
                          playerName: s.playerName,
                          teamName: s.teamName,
                          goals: s.goals,
                        });
                      }}
                      className="p-1 rounded-lg text-text-secondary hover:text-text-primary cursor-pointer"
                    >
                      <Edit2 size={13} />
                    </button>

                    <button
                      onClick={() => handleDeleteScorer(s.id)}
                      className="p-1 rounded-lg text-[#EF4444] hover:bg-[#EF4444]/10 cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* COLUMN 3: MAN OF THE MATCH NOMINEES */}
        {/* ========================================== */}
        <div className="bg-surface-card border border-border-subtle rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm flex flex-col">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2">
              <Trophy size={16} className="text-primary-lime" />
              <h3 className="text-sm font-black text-text-primary uppercase tracking-tight">
                {editingNomineeId ? "Edit MOTM Nominee" : "Add MOTM Nominee"}
              </h3>
            </div>
            {editingNomineeId && (
              <button
                onClick={() => {
                  setEditingNomineeId(null);
                  setNomineeForm({
                    nomineeName: "",
                    teamName: "",
                    photoUrl: "",
                    position: "Midfielder",
                    voteCount: 0,
                  });
                }}
                className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1"
              >
                <X size={12} /> Cancel
              </button>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSaveNominee} className="space-y-3 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1">
                Player / Nominee Name
              </label>
              <input
                type="text"
                value={nomineeForm.nomineeName}
                onChange={(e) =>
                  setNomineeForm((prev) => ({ ...prev, nomineeName: e.target.value }))
                }
                placeholder="e.g. Denis Mukasa"
                className="w-full bg-app-base border border-border-subtle rounded-xl px-3 py-2 text-text-primary focus:border-primary-lime"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1">
                Team
              </label>
              <input
                type="text"
                value={nomineeForm.teamName}
                onChange={(e) =>
                  setNomineeForm((prev) => ({ ...prev, teamName: e.target.value }))
                }
                placeholder="e.g. Tal Olympic FC"
                className="w-full bg-app-base border border-border-subtle rounded-xl px-3 py-2 text-text-primary focus:border-primary-lime"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1">
                  Position
                </label>
                <input
                  type="text"
                  value={nomineeForm.position}
                  onChange={(e) =>
                    setNomineeForm((prev) => ({ ...prev, position: e.target.value }))
                  }
                  placeholder="Forward / Midfielder"
                  className="w-full bg-app-base border border-border-subtle rounded-xl px-3 py-2 text-text-primary"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1">
                  Base Votes
                </label>
                <input
                  type="number"
                  min="0"
                  value={nomineeForm.voteCount}
                  onChange={(e) =>
                    setNomineeForm((prev) => ({
                      ...prev,
                      voteCount: parseInt(e.target.value, 10) || 0,
                    }))
                  }
                  className="w-full bg-app-base border border-border-subtle rounded-xl px-3 py-2 text-text-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1">
                Photo URL (Optional)
              </label>
              <input
                type="url"
                value={nomineeForm.photoUrl}
                onChange={(e) =>
                  setNomineeForm((prev) => ({ ...prev, photoUrl: e.target.value }))
                }
                placeholder="https://..."
                className="w-full bg-app-base border border-border-subtle rounded-xl px-3 py-2 text-text-primary"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-primary-lime hover:bg-[#96E600] text-accent-text font-black uppercase text-xs tracking-wider transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
            >
              <Save size={14} />
              <span>{editingNomineeId ? "Save Nominee" : "Add Nominee"}</span>
            </button>
          </form>

          {/* List of Nominees */}
          <div className="pt-2 flex-1 space-y-2">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-text-secondary">
              Nominees ({nominees.length})
            </h4>
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {nominees.map((n, idx) => (
                <div
                  key={n.id}
                  className="p-3 rounded-xl border border-border-subtle bg-app-base flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-primary-lime">
                        #{idx + 1}
                      </span>
                      <p className="text-xs font-bold text-text-primary truncate">
                        {n.nomineeName}
                      </p>
                    </div>
                    <p className="text-[11px] text-text-secondary truncate">
                      {n.teamName} {n.position && `• ${n.position}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs font-black text-text-primary px-2 py-0.5 rounded-lg bg-surface-raised border border-border-subtle">
                      {n.voteCount || 0} votes
                    </span>

                    <button
                      onClick={() => {
                        setEditingNomineeId(n.id);
                        setNomineeForm({
                          nomineeName: n.nomineeName,
                          teamName: n.teamName,
                          photoUrl: n.photoUrl || "",
                          position: n.position || "Midfielder",
                          voteCount: n.voteCount || 0,
                        });
                      }}
                      className="p-1 rounded-lg text-text-secondary hover:text-text-primary cursor-pointer"
                    >
                      <Edit2 size={13} />
                    </button>

                    <button
                      onClick={() => handleDeleteNominee(n.id)}
                      className="p-1 rounded-lg text-[#EF4444] hover:bg-[#EF4444]/10 cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
