import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Trophy,
  Clock,
  Flame,
  Plus,
  Minus,
  Trash2,
  Edit2,
  Check,
  Copy,
  ExternalLink,
  Sparkles,
  Save,
  X,
  Radio,
  Search,
  Share2,
  Calendar,
  MapPin,
  ChevronRight,
  Filter,
} from "lucide-react";
import { ShareTournamentCard } from "../../components/tournament/ShareTournamentCard";
import { tournamentService } from "../../services/tournamentService";
import {
  TournamentFixture,
  TournamentScorer,
  TournamentNominee,
  TournamentTeam,
  TournamentPlayer,
  DEFAULT_TOURNAMENT,
  FixtureStatus,
} from "../../types/tournament";
import { TeamRegistrationManager } from "./TeamRegistrationManager";

type AdminRoundFilter = "all" | "md3" | "md2" | "md1" | "live";

export const TournamentManager: React.FC = () => {
  const [tournamentId] = useState<string>(DEFAULT_TOURNAMENT.id);
  const [activeTab, setActiveTab] = useState<"matches" | "teams">("matches");
  
  const [fixtures, setFixtures] = useState<TournamentFixture[]>([]);
  const [scorers, setScorers] = useState<TournamentScorer[]>([]);
  const [nominees, setNominees] = useState<TournamentNominee[]>([]);
  const [teams, setTeams] = useState<TournamentTeam[]>([]);
  const [players, setPlayers] = useState<TournamentPlayer[]>([]);
  const [, setLoading] = useState<boolean>(true);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Fixture list filters
  const [roundFilter, setRoundFilter] = useState<AdminRoundFilter>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  // Quick Scorer adder state
  const [activeScorerPicker, setActiveScorerPicker] = useState<{
    fixtureId: string;
    team: "home" | "away";
  } | null>(null);
  const [customScorerName, setCustomScorerName] = useState<string>("");

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
    notes: string;
  }>({
    time: "2:30 PM",
    homeTeam: "",
    awayTeam: "",
    homeScore: "",
    awayScore: "",
    status: "upcoming",
    pitchVenue: "Tal Olympic Park / Bayern Munyonyo",
    round: "Matchday 3 • Group Stage",
    notes: "",
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

  // Link copy state
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Subscribe to all 5 collections for this tournament
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
      (data) => setNominees(data),
      (err) => console.error(err)
    );
    const unsubTeams = tournamentService.subscribeToTeams(
      tournamentId,
      (data) => setTeams(data),
      (err) => console.error(err)
    );
    const unsubPlayers = tournamentService.subscribeToPlayers(
      tournamentId,
      (data) => {
        setPlayers(data);
        setLoading(false);
      },
      (err) => console.error(err)
    );

    return () => {
      unsubFixtures();
      unsubScorers();
      unsubNominees();
      unsubTeams();
      unsubPlayers();
    };
  }, [tournamentId]);

  const publicUrl = typeof window !== "undefined"
    ? `${window.location.origin}/#/tournament`
    : `/#/tournament`;

  const showNotification = (msg: string) => {
    setActionStatus(msg);
    setActionError(null);
    setTimeout(() => setActionStatus(null), 3500);
  };

  const showError = (err: any) => {
    setActionError(err?.message || "An error occurred");
    setTimeout(() => setActionError(null), 4000);
  };

  const copyFanLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    showNotification("Tournament fan link copied! Ready to share with players & fans.");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(
      `🏆 Follow WEHAT Soccer Tournament Season 2 Live Scores, Upcoming Deciders & Results on Pitchly:\n${publicUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const handleSeedKickoffData = async () => {
    try {
      setLoading(true);
      const res = await tournamentService.seedWehatTournament(tournamentId);
      showNotification(
        `Seeded WEHAT Tournament: ${res.fixturesCount} fixtures, ${res.scorersCount} scorers, ${res.nomineesCount} nominees!`
      );
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // RAPID LIVE SCORE & RESULT ACTIONS
  // ==========================================
  const handleQuickScoreStep = async (
    fixture: TournamentFixture,
    team: "home" | "away",
    delta: number
  ) => {
    const currentHome = fixture.homeScore ?? 0;
    const currentAway = fixture.awayScore ?? 0;
    const nextHome = team === "home" ? Math.max(0, currentHome + delta) : currentHome;
    const nextAway = team === "away" ? Math.max(0, currentAway + delta) : currentAway;

    // If upcoming, set to live automatically upon score recording
    const nextStatus = fixture.status === "upcoming" ? "live" : fixture.status;
    const nextTime = fixture.status === "upcoming" ? "LIVE" : fixture.time;

    try {
      await tournamentService.updateFixture(fixture.id, {
        homeScore: nextHome,
        awayScore: nextAway,
        status: nextStatus,
        time: nextTime,
      });
      showNotification(
        `Score updated: ${fixture.homeTeam} ${nextHome} - ${nextAway} ${fixture.awayTeam}`
      );
    } catch (err) {
      showError(err);
    }
  };

  const handleQuickStatusToggle = async (
    fixture: TournamentFixture,
    newStatus: FixtureStatus
  ) => {
    try {
      const updates: Partial<TournamentFixture> = { status: newStatus };
      if (newStatus === "live") {
        if (fixture.homeScore === null) updates.homeScore = 0;
        if (fixture.awayScore === null) updates.awayScore = 0;
        updates.time = "LIVE";
      } else if (newStatus === "finished") {
        if (fixture.homeScore === null) updates.homeScore = 0;
        if (fixture.awayScore === null) updates.awayScore = 0;
        updates.time = "FT";
      } else if (newStatus === "upcoming") {
        updates.homeScore = null;
        updates.awayScore = null;
        updates.time = fixture.time === "LIVE" || fixture.time === "FT" ? "2:30 PM" : fixture.time;
      }

      await tournamentService.updateFixture(fixture.id, updates);
      showNotification(
        `Status updated: ${fixture.homeTeam} vs ${fixture.awayTeam} is now ${newStatus.toUpperCase()}`
      );
    } catch (err) {
      showError(err);
    }
  };

  const handleAddGoalScorer = async (
    fixture: TournamentFixture,
    team: "home" | "away",
    playerName: string
  ) => {
    const name = playerName.trim();
    if (!name) return;

    try {
      const current = team === "home" ? (fixture.homeScorers || []) : (fixture.awayScorers || []);
      const updated = [...current, name];

      const updates: Partial<TournamentFixture> = team === "home"
        ? { homeScorers: updated }
        : { awayScorers: updated };

      await tournamentService.updateFixture(fixture.id, updates);

      // Check if scorer already in golden boot table
      const existing = scorers.find(
        (s) => s.playerName.toLowerCase() === name.toLowerCase()
      );
      if (existing) {
        await tournamentService.incrementScorerGoals(existing.id, 1);
      } else {
        const teamName = team === "home" ? fixture.homeTeam : fixture.awayTeam;
        await tournamentService.addScorer({
          tournamentId,
          playerName: name,
          teamName,
          goals: 1,
        });
      }

      setActiveScorerPicker(null);
      setCustomScorerName("");
      showNotification(`Goal added for ${name}!`);
    } catch (err) {
      showError(err);
    }
  };

  const handleRemoveGoalScorer = async (
    fixture: TournamentFixture,
    team: "home" | "away",
    indexToRemove: number
  ) => {
    try {
      const current = team === "home" ? (fixture.homeScorers || []) : (fixture.awayScorers || []);
      const removedPlayer = current[indexToRemove];
      const updated = current.filter((_, idx) => idx !== indexToRemove);

      const updates: Partial<TournamentFixture> = team === "home"
        ? { homeScorers: updated }
        : { awayScorers: updated };

      await tournamentService.updateFixture(fixture.id, updates);

      if (removedPlayer) {
        const existing = scorers.find(
          (s) => s.playerName.toLowerCase() === removedPlayer.toLowerCase()
        );
        if (existing && existing.goals > 1) {
          await tournamentService.incrementScorerGoals(existing.id, -1);
        }
      }

      showNotification("Scorer event removed.");
    } catch (err) {
      showError(err);
    }
  };

  // ==========================================
  // FULL FIXTURE FORM ACTIONS
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
          notes: fixtureForm.notes.trim(),
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
          pitchVenue: fixtureForm.pitchVenue.trim() || "Tal Olympic Park / Bayern Munyonyo",
          round: fixtureForm.round.trim() || "Matchday 3 • Group Stage",
          notes: fixtureForm.notes.trim(),
        });
        showNotification("Fixture added to tournament!");
      }

      setShowAddForm(false);
      setFixtureForm({
        time: "3:00 PM",
        homeTeam: "",
        awayTeam: "",
        homeScore: "",
        awayScore: "",
        status: "upcoming",
        pitchVenue: "Tal Olympic Park / Bayern Munyonyo",
        round: "Matchday 3 • Group Stage",
        notes: "",
      });
    } catch (err) {
      showError(err);
    }
  };

  const handleEditFixtureClick = (f: TournamentFixture) => {
    setEditingFixtureId(f.id);
    setShowAddForm(true);
    setFixtureForm({
      time: f.time || "",
      homeTeam: f.homeTeam || "",
      awayTeam: f.awayTeam || "",
      homeScore: f.homeScore !== null ? String(f.homeScore) : "",
      awayScore: f.awayScore !== null ? String(f.awayScore) : "",
      status: f.status,
      pitchVenue: f.pitchVenue || "Tal Olympic Park / Bayern Munyonyo",
      round: f.round || "Group Stage",
      notes: f.notes || "",
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

  // Filtered fixtures for admin view
  const filteredAdminFixtures = useMemo(() => {
    let list = fixtures;
    if (roundFilter === "live") {
      list = list.filter((f) => f.status === "live");
    } else if (roundFilter === "md3") {
      list = list.filter(
        (f) =>
          f.round?.toLowerCase().includes("matchday 3") ||
          f.round?.toLowerCase().includes("week 3")
      );
    } else if (roundFilter === "md2") {
      list = list.filter(
        (f) =>
          f.round?.toLowerCase().includes("matchday 2") ||
          f.round?.toLowerCase().includes("week 2")
      );
    } else if (roundFilter === "md1") {
      list = list.filter(
        (f) =>
          f.round?.toLowerCase().includes("matchday 1") ||
          f.round?.toLowerCase().includes("week 1")
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (f) =>
          f.homeTeam.toLowerCase().includes(q) ||
          f.awayTeam.toLowerCase().includes(q) ||
          (f.group && f.group.toLowerCase().includes(q))
      );
    }
    return list;
  }, [fixtures, roundFilter, searchQuery]);

  // Counts
  const liveCount = useMemo(() => fixtures.filter((f) => f.status === "live").length, [fixtures]);
  const md3Count = useMemo(
    () =>
      fixtures.filter(
        (f) =>
          f.round?.toLowerCase().includes("matchday 3") ||
          f.round?.toLowerCase().includes("week 3")
      ).length,
    [fixtures]
  );
  const md2Count = useMemo(
    () =>
      fixtures.filter(
        (f) =>
          f.round?.toLowerCase().includes("matchday 2") ||
          f.round?.toLowerCase().includes("week 2")
      ).length,
    [fixtures]
  );
  const md1Count = useMemo(
    () =>
      fixtures.filter(
        (f) =>
          f.round?.toLowerCase().includes("matchday 1") ||
          f.round?.toLowerCase().includes("week 1")
      ).length,
    [fixtures]
  );

  return (
    <div className="space-y-5 animate-fadeIn pb-16">
      {/* 1. SECTION HEADER */}
      <div className="bg-surface-card border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary-lime/15 text-primary-lime border border-primary-lime/30">
              <Trophy size={20} />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-text-primary uppercase tracking-tight font-display">
                WEHAT Tournament Admin Portal
              </h1>
              <p className="text-xs text-text-secondary mt-0.5">
                Real-time pitchside score updater, live matchboard, results &amp; Golden Boot manager.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Links & Share Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={copyFanLink}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
              copiedLink
                ? "bg-primary-lime text-black"
                : "bg-surface-raised hover:bg-border-subtle text-text-primary border border-border-subtle"
            }`}
            title="Copy Direct Link to share with fans"
          >
            {copiedLink ? <Check size={14} /> : <Copy size={14} />}
            <span>{copiedLink ? "Link Copied!" : "Copy Fan Link"}</span>
          </button>

          <button
            onClick={shareViaWhatsApp}
            className="px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            title="Share directly to WhatsApp group"
          >
            <Share2 size={14} />
            <span>WhatsApp</span>
          </button>

          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-primary-lime hover:bg-[#96E600] text-accent-text text-xs font-black flex items-center gap-1.5 transition-all shadow-xs"
          >
            <span>Live Fan Page</span>
            <ExternalLink size={14} />
          </a>

          <button
            onClick={handleSeedKickoffData}
            className="p-2 rounded-xl bg-surface-raised hover:bg-border-subtle border border-border-subtle text-text-secondary hover:text-text-primary transition-all cursor-pointer"
            title="Reset / Reload WEHAT Official Data Template"
          >
            <Sparkles size={14} />
          </button>
        </div>
      </div>

      {/* Notifications */}
      {actionStatus && (
        <div className="bg-primary-lime/15 border border-primary-lime/40 text-primary-lime px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn shadow-xs">
          <Check size={16} />
          <span>{actionStatus}</span>
        </div>
      )}
      {actionError && (
        <div className="bg-[#EF4444]/15 border border-[#EF4444]/40 text-[#EF4444] px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn shadow-xs">
          <span>{actionError}</span>
        </div>
      )}

      {/* 2. PRIMARY TAB CONTROLS */}
      <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
        <button
          onClick={() => setActiveTab("matches")}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === "matches"
              ? "bg-primary-lime text-black shadow-xs"
              : "bg-surface-card text-text-secondary hover:text-text-primary border border-border-subtle hover:border-border-muted"
          }`}
        >
          Matchboard &amp; Live Scores
        </button>
        <button
          onClick={() => setActiveTab("teams")}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === "teams"
              ? "bg-primary-lime text-black shadow-xs"
              : "bg-surface-card text-text-secondary hover:text-text-primary border border-border-subtle hover:border-border-muted"
          }`}
        >
          Teams &amp; Squad Rosters
        </button>
      </div>

      {/* 3. MAIN CONTENT AREA */}
      {activeTab === "teams" ? (
        <TeamRegistrationManager
          tournamentId={tournamentId}
          teams={teams}
          players={players}
          onAddTeam={tournamentService.addTeam}
          onUpdateTeam={tournamentService.updateTeam}
          onDeleteTeam={tournamentService.deleteTeam}
          onAddPlayer={tournamentService.addPlayer}
          onUpdatePlayer={tournamentService.updatePlayer}
          onDeletePlayer={tournamentService.deletePlayer}
          showNotification={showNotification}
          showError={showError}
        />
      ) : (
        <div className="space-y-6">
          {/* ======================================================== */}
          {/* ⚡ RAPID MATCHDAY SCORE & RESULT CONTROLLER */}
          {/* ======================================================== */}
          <div className="bg-surface-card border border-border-subtle rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-3.5">
              <div>
                <h2 className="text-base font-black text-text-primary uppercase tracking-tight flex items-center gap-2">
                  <Radio size={18} className="text-primary-lime animate-pulse" />
                  <span>Rapid Match Result Controller</span>
                </h2>
                <p className="text-xs text-text-secondary">
                  Tap <span className="text-primary-lime font-bold">+</span> or <span className="text-text-primary font-bold">-</span> to update scores in real-time. Changes immediately reflect on the fans&apos; live link!
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingFixtureId(null);
                    setShowAddForm(!showAddForm);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-surface-raised hover:bg-border-subtle border border-border-subtle text-xs font-bold text-text-primary flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus size={14} className="text-primary-lime" />
                  <span>{showAddForm ? "Hide Form" : "Schedule Match"}</span>
                </button>
              </div>
            </div>

            {/* Matchday Filter Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: "md3", label: "Matchday 3 Deciders", count: md3Count },
                  { id: "live", label: "🔴 LIVE Matches", count: liveCount },
                  { id: "md2", label: "Matchday 2 Results", count: md2Count },
                  { id: "md1", label: "Matchday 1 Results", count: md1Count },
                  { id: "all", label: "All Matches", count: fixtures.length },
                ].map((pill) => (
                  <button
                    key={pill.id}
                    onClick={() => setRoundFilter(pill.id as AdminRoundFilter)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      roundFilter === pill.id
                        ? "bg-primary-lime text-black font-black shadow-xs"
                        : "bg-surface-raised hover:bg-border-subtle text-text-secondary hover:text-text-primary border border-border-subtle"
                    }`}
                  >
                    <span>{pill.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        roundFilter === pill.id
                          ? "bg-black/20 text-black"
                          : "bg-surface-card text-text-tertiary"
                      }`}
                    >
                      {pill.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Team Search */}
              <div className="relative max-w-xs w-full">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
                />
                <input
                  type="text"
                  placeholder="Search team or group..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-8 pr-7 bg-surface-raised border border-border-subtle rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary-lime"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Optional Collapsible Schedule / Edit Form */}
            {showAddForm && (
              <form
                onSubmit={handleSaveFixture}
                className="bg-surface-raised/70 border border-primary-lime/30 rounded-2xl p-4 space-y-3 animate-fadeIn"
              >
                <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                  <h3 className="text-xs font-black text-text-primary uppercase">
                    {editingFixtureId ? "Edit Match Fixture" : "Schedule New Match"}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="text-text-tertiary hover:text-text-primary"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">
                      Kickoff Time
                    </label>
                    <input
                      type="text"
                      value={fixtureForm.time}
                      onChange={(e) =>
                        setFixtureForm((prev) => ({ ...prev, time: e.target.value }))
                      }
                      placeholder="e.g. 2:00 PM"
                      className="w-full bg-app-base border border-border-subtle rounded-xl px-3 py-2 text-text-primary focus:border-primary-lime"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">
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
                      <option value="finished">Finished (FT)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">
                      Round / Group
                    </label>
                    <input
                      type="text"
                      value={fixtureForm.round}
                      onChange={(e) =>
                        setFixtureForm((prev) => ({ ...prev, round: e.target.value }))
                      }
                      placeholder="Matchday 3 • Group A"
                      className="w-full bg-app-base border border-border-subtle rounded-xl px-3 py-2 text-text-primary focus:border-primary-lime"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">
                      Home Club
                    </label>
                    <input
                      type="text"
                      value={fixtureForm.homeTeam}
                      onChange={(e) =>
                        setFixtureForm((prev) => ({ ...prev, homeTeam: e.target.value }))
                      }
                      placeholder="e.g. WEHAT FC"
                      className="w-full bg-app-base border border-border-subtle rounded-xl px-3 py-2 text-text-primary focus:border-primary-lime"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">
                      Away Club
                    </label>
                    <input
                      type="text"
                      value={fixtureForm.awayTeam}
                      onChange={(e) =>
                        setFixtureForm((prev) => ({ ...prev, awayTeam: e.target.value }))
                      }
                      placeholder="e.g. IMDAD FC"
                      className="w-full bg-app-base border border-border-subtle rounded-xl px-3 py-2 text-text-primary focus:border-primary-lime"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">
                      Venue / Pitch
                    </label>
                    <input
                      type="text"
                      value={fixtureForm.pitchVenue}
                      onChange={(e) =>
                        setFixtureForm((prev) => ({ ...prev, pitchVenue: e.target.value }))
                      }
                      placeholder="Tal Olympic Park / Bayern Munyonyo"
                      className="w-full bg-app-base border border-border-subtle rounded-xl px-3 py-2 text-text-primary focus:border-primary-lime"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">
                      Match Notes (e.g. Red Cards, Decider)
                    </label>
                    <input
                      type="text"
                      value={fixtureForm.notes}
                      onChange={(e) =>
                        setFixtureForm((prev) => ({ ...prev, notes: e.target.value }))
                      }
                      placeholder="High-stakes decider clash"
                      className="w-full bg-app-base border border-border-subtle rounded-xl px-3 py-2 text-text-primary focus:border-primary-lime"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-text-secondary hover:text-text-primary cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-primary-lime hover:bg-[#96E600] text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <Save size={14} />
                    <span>{editingFixtureId ? "Save Changes" : "Create Fixture"}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Fixture Interactive List */}
            {filteredAdminFixtures.length === 0 ? (
              <div className="p-8 text-center bg-app-base rounded-2xl border border-border-subtle space-y-2">
                <Clock size={28} className="text-text-tertiary mx-auto" />
                <p className="text-xs text-text-secondary">No fixtures match this filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredAdminFixtures.map((f, idx) => {
                  const isLive = f.status === "live";
                  const isFinished = f.status === "finished";

                  return (
                    <div
                      key={f.id}
                      className={`bg-app-base rounded-2xl border p-3.5 transition-all space-y-3 relative ${
                        isLive
                          ? "border-primary-lime/70 shadow-sm ring-1 ring-primary-lime/30"
                          : "border-border-subtle"
                      }`}
                    >
                      {/* Top Header metadata */}
                      <div className="flex items-center justify-between gap-2 border-b border-border-subtle/50 pb-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="px-1.5 py-0.5 rounded bg-surface-raised font-mono font-bold text-[9px] text-text-secondary border border-border-subtle">
                            #{idx + 1}
                          </span>
                          <span className="text-[11px] font-bold text-text-secondary truncate">
                            {f.round || "Matchday"}
                          </span>
                        </div>

                        {/* Status Switcher Pills */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleQuickStatusToggle(f, "upcoming")}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              f.status === "upcoming"
                                ? "bg-surface-raised text-text-primary border border-border-subtle font-black"
                                : "text-text-tertiary hover:text-text-primary"
                            }`}
                          >
                            Upcoming
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickStatusToggle(f, "live")}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                              isLive
                                ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 font-black animate-pulse"
                                : "text-text-tertiary hover:text-rose-400"
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            <span>LIVE</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickStatusToggle(f, "finished")}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              isFinished
                                ? "bg-primary-lime/20 text-primary-lime border border-primary-lime/40 font-black"
                                : "text-text-tertiary hover:text-primary-lime"
                            }`}
                          >
                            FT
                          </button>
                        </div>
                      </div>

                      {/* Score Stepper Board */}
                      <div className="grid grid-cols-7 items-center gap-2">
                        {/* Home Team Stepper */}
                        <div className="col-span-3 text-right space-y-1">
                          <span className="text-xs font-bold text-text-primary block truncate">
                            {f.homeTeam}
                          </span>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleQuickScoreStep(f, "home", -1)}
                              className="w-7 h-7 rounded-lg bg-surface-card border border-border-subtle hover:bg-surface-raised flex items-center justify-center font-bold text-text-primary cursor-pointer active:scale-95"
                              title="Decrement Home Score (-1)"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-8 h-8 rounded-lg bg-surface-raised border border-border-subtle flex items-center justify-center font-black text-sm text-text-primary">
                              {f.homeScore ?? 0}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleQuickScoreStep(f, "home", 1)}
                              className="w-7 h-7 rounded-lg bg-primary-lime/20 hover:bg-primary-lime text-primary-lime hover:text-black border border-primary-lime/40 flex items-center justify-center font-bold cursor-pointer active:scale-95"
                              title="Increment Home Score (+1 Goal)"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>

                        {/* Center VS / Clock */}
                        <div className="col-span-1 text-center">
                          <span className="text-[10px] font-bold text-text-tertiary block font-mono">
                            {f.time || "vs"}
                          </span>
                          <span className="text-xs font-bold text-text-tertiary">:</span>
                        </div>

                        {/* Away Team Stepper */}
                        <div className="col-span-3 text-left space-y-1">
                          <span className="text-xs font-bold text-text-primary block truncate">
                            {f.awayTeam}
                          </span>
                          <div className="flex items-center justify-start gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleQuickScoreStep(f, "away", -1)}
                              className="w-7 h-7 rounded-lg bg-surface-card border border-border-subtle hover:bg-surface-raised flex items-center justify-center font-bold text-text-primary cursor-pointer active:scale-95"
                              title="Decrement Away Score (-1)"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-8 h-8 rounded-lg bg-surface-raised border border-border-subtle flex items-center justify-center font-black text-sm text-text-primary">
                              {f.awayScore ?? 0}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleQuickScoreStep(f, "away", 1)}
                              className="w-7 h-7 rounded-lg bg-primary-lime/20 hover:bg-primary-lime text-primary-lime hover:text-black border border-primary-lime/40 flex items-center justify-center font-bold cursor-pointer active:scale-95"
                              title="Increment Away Score (+1 Goal)"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Goal Scorers Bar */}
                      <div className="pt-2 border-t border-border-subtle/50 text-[10px] space-y-1.5">
                        <div className="flex items-center justify-between text-text-tertiary">
                          <span className="font-bold uppercase tracking-wider">Goal Scorers:</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveScorerPicker({ fixtureId: f.id, team: "home" })
                              }
                              className="text-primary-lime hover:underline font-bold"
                            >
                              + {f.homeTeam} Scorer
                            </button>
                            <span>•</span>
                            <button
                              type="button"
                              onClick={() =>
                                setActiveScorerPicker({ fixtureId: f.id, team: "away" })
                              }
                              className="text-primary-lime hover:underline font-bold"
                            >
                              + {f.awayTeam} Scorer
                            </button>
                          </div>
                        </div>

                        {/* List of current scorers */}
                        <div className="flex flex-wrap gap-1">
                          {(f.homeScorers || []).map((sc, scIdx) => (
                            <span
                              key={`h-${scIdx}`}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-raised border border-border-subtle text-text-primary"
                            >
                              <span>⚽ {sc} ({f.homeTeam})</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveGoalScorer(f, "home", scIdx)}
                                className="text-text-tertiary hover:text-[#EF4444]"
                              >
                                <X size={10} />
                              </button>
                            </span>
                          ))}
                          {(f.awayScorers || []).map((sc, scIdx) => (
                            <span
                              key={`a-${scIdx}`}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-raised border border-border-subtle text-text-primary"
                            >
                              <span>⚽ {sc} ({f.awayTeam})</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveGoalScorer(f, "away", scIdx)}
                                className="text-text-tertiary hover:text-[#EF4444]"
                              >
                                <X size={10} />
                              </button>
                            </span>
                          ))}
                        </div>

                        {/* Quick Scorer Add Popover */}
                        {activeScorerPicker && activeScorerPicker.fixtureId === f.id && (
                          <div className="p-2.5 rounded-xl bg-surface-raised border border-primary-lime/40 space-y-2 animate-fadeIn">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-text-primary">
                                Add Scorer for{" "}
                                {activeScorerPicker.team === "home" ? f.homeTeam : f.awayTeam}
                              </span>
                              <button
                                type="button"
                                onClick={() => setActiveScorerPicker(null)}
                                className="text-text-tertiary hover:text-text-primary"
                              >
                                <X size={12} />
                              </button>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                placeholder="Type player name..."
                                value={customScorerName}
                                onChange={(e) => setCustomScorerName(e.target.value)}
                                className="flex-1 h-7 px-2 bg-app-base border border-border-subtle rounded-lg text-xs text-text-primary focus:outline-none focus:border-primary-lime"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  handleAddGoalScorer(
                                    f,
                                    activeScorerPicker.team,
                                    customScorerName
                                  )
                                }
                                className="px-2.5 h-7 rounded-lg bg-primary-lime text-black font-bold text-xs"
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-2 border-t border-border-subtle/50 flex items-center justify-between text-xs text-text-tertiary">
                        <span className="truncate text-[10px]">
                          {f.pitchVenue || "Tal Olympic Park / Bayern Munyonyo"}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleEditFixtureClick(f)}
                            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-raised cursor-pointer"
                            title="Edit full fixture details"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteFixture(f.id)}
                            className="p-1.5 rounded-lg text-[#EF4444] hover:bg-[#EF4444]/10 cursor-pointer"
                            title="Delete match fixture"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* STATS & VOTING CONTROLLERS */}
          {/* ======================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* COLUMN 1: TOP SCORERS & LIVE INCREMENT */}
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
                    placeholder="e.g. Raymond Junior"
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
                    placeholder="e.g. WEHAT FC"
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

            {/* COLUMN 2: MAN OF THE MATCH NOMINEES */}
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
                    placeholder="e.g. WEHAT FC"
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
      )}
    </div>
  );
};
