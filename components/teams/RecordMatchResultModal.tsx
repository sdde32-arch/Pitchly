import React, { useState } from "react";
import {
  X,
  Trophy,
  Plus,
  Minus,
  Sparkles,
  Radio,
  Check,
  Star,
  Users,
  Target,
  FileText,
} from "lucide-react";
import { Match, MatchResult, MatchScorer, TeamMember } from "../../types/firebase";

interface RecordMatchResultModalProps {
  isOpen: boolean;
  match: {
    id: string;
    title: string;
    pitchName: string;
    date: string;
    time: string;
    type?: string;
    joinedPlayers?: any[];
    result?: MatchResult;
    [key: string]: any;
  };
  onClose: () => void;
  onSaveResult: (result: MatchResult) => Promise<void>;
}

export const RecordMatchResultModal: React.FC<RecordMatchResultModalProps> = ({
  isOpen,
  match,
  onClose,
  onSaveResult,
}) => {
  const existingResult = match.result;

  const [teamAName, setTeamAName] = useState(
    existingResult?.teamAName || "Team Dark (Bibs)"
  );
  const [teamBName, setTeamBName] = useState(
    existingResult?.teamBName || "Team White (No Bibs)"
  );
  const [teamAScore, setTeamAScore] = useState<number>(
    existingResult?.teamAScore ?? 3
  );
  const [teamBScore, setTeamBScore] = useState<number>(
    existingResult?.teamBScore ?? 2
  );

  const [scorers, setScorers] = useState<MatchScorer[]>(
    existingResult?.scorers || []
  );
  const [selectedMvp, setSelectedMvp] = useState<string>(
    existingResult?.mvpPlayerName || ""
  );
  const [notes, setNotes] = useState<string>(existingResult?.notes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedScorerTeam, setSelectedScorerTeam] = useState<"teamA" | "teamB">("teamA");
  const [selectedPlayerForGoal, setSelectedPlayerForGoal] = useState<string>("");

  if (!isOpen) return null;

  // Joined players from match
  const joinedPlayers: TeamMember[] = (match as any).joinedPlayers || [];

  const handleAddScorer = (playerName: string, team: "teamA" | "teamB") => {
    if (!playerName.trim()) return;

    setScorers((prev) => {
      const existingIdx = prev.findIndex(
        (s) => s.playerName.toLowerCase() === playerName.toLowerCase() && s.team === team
      );
      if (existingIdx !== -1) {
        const next = [...prev];
        next[existingIdx] = {
          ...next[existingIdx],
          goals: next[existingIdx].goals + 1,
        };
        return next;
      }
      return [
        ...prev,
        {
          playerId: "player_" + Math.random().toString(36).substring(2, 7),
          playerName,
          goals: 1,
          team,
        },
      ];
    });
  };

  const handleRemoveScorer = (idx: number) => {
    setScorers((prev) => {
      const target = prev[idx];
      if (target.goals > 1) {
        const next = [...prev];
        next[idx] = { ...target, goals: target.goals - 1 };
        return next;
      }
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const winner: "teamA" | "teamB" | "draw" =
        teamAScore > teamBScore
          ? "teamA"
          : teamAScore < teamBScore
          ? "teamB"
          : "draw";

      const resultPayload: MatchResult = {
        teamAName: teamAName.trim() || "Team A",
        teamBName: teamBName.trim() || "Team B",
        teamAScore: Math.max(0, teamAScore),
        teamBScore: Math.max(0, teamBScore),
        winner,
        scorers,
        mvpPlayerName: selectedMvp.trim() || undefined,
        recordedAt: new Date().toISOString(),
        notes: notes.trim() || undefined,
      };

      await onSaveResult(resultPayload);
      onClose();
    } catch (err) {
      console.error("Failed to save match result", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="record-match-result-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="record-match-result-modal-content"
        className="bg-surface-card border border-border-subtle rounded-3xl max-w-lg w-full p-4 sm:p-6 text-text-primary relative shadow-2xl space-y-5 my-auto max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-lime/15 text-primary-lime flex items-center justify-center border border-primary-lime/30 shrink-0">
              <Trophy size={18} className="text-primary-lime" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-text-primary tracking-tight font-display">
                Record Match Result
              </h2>
              <p className="text-xs text-text-secondary truncate">
                {match.title} · {match.pitchName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-surface-raised flex items-center justify-center text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. Scoreboard Counter Grid */}
          <div className="p-4 rounded-2xl bg-surface-raised border border-border-subtle space-y-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-text-tertiary block">
              Final Scoreline
            </span>

            <div className="grid grid-cols-11 gap-2 items-center">
              {/* Team A Side */}
              <div className="col-span-5 space-y-2">
                <input
                  type="text"
                  value={teamAName}
                  onChange={(e) => setTeamAName(e.target.value)}
                  placeholder="Team Dark"
                  className="w-full text-center text-xs font-bold bg-surface-card border border-border-subtle rounded-xl px-2 py-1.5 focus:border-primary-lime focus:outline-none"
                  required
                />
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTeamAScore((prev) => Math.max(0, prev - 1))}
                    className="w-8 h-8 rounded-xl bg-surface-card hover:bg-border-subtle border border-border-subtle flex items-center justify-center text-text-secondary cursor-pointer active:scale-95 transition-all"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-12 text-center font-mono text-3xl font-black text-text-primary">
                    {teamAScore}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTeamAScore((prev) => prev + 1)}
                    className="w-8 h-8 rounded-xl bg-primary-lime text-black flex items-center justify-center font-bold cursor-pointer active:scale-95 transition-all hover:bg-primary-lime-hover shadow-xs"
                  >
                    <Plus size={14} strokeWidth={3} />
                  </button>
                </div>
              </div>

              {/* VS Divider */}
              <div className="col-span-1 text-center font-black text-xs text-text-tertiary">
                VS
              </div>

              {/* Team B Side */}
              <div className="col-span-5 space-y-2">
                <input
                  type="text"
                  value={teamBName}
                  onChange={(e) => setTeamBName(e.target.value)}
                  placeholder="Team White"
                  className="w-full text-center text-xs font-bold bg-surface-card border border-border-subtle rounded-xl px-2 py-1.5 focus:border-primary-lime focus:outline-none"
                  required
                />
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTeamBScore((prev) => Math.max(0, prev - 1))}
                    className="w-8 h-8 rounded-xl bg-surface-card hover:bg-border-subtle border border-border-subtle flex items-center justify-center text-text-secondary cursor-pointer active:scale-95 transition-all"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-12 text-center font-mono text-3xl font-black text-text-primary">
                    {teamBScore}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTeamBScore((prev) => prev + 1)}
                    className="w-8 h-8 rounded-xl bg-primary-lime text-black flex items-center justify-center font-bold cursor-pointer active:scale-95 transition-all hover:bg-primary-lime-hover shadow-xs"
                  >
                    <Plus size={14} strokeWidth={3} />
                  </button>
                </div>
              </div>
            </div>

            {/* Winner status preview banner */}
            <div className="pt-2 border-t border-border-subtle/60 text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-surface-card border border-border-subtle text-primary-lime">
                <Sparkles size={12} />
                {teamAScore > teamBScore ? (
                  <span>Winner: {teamAName}</span>
                ) : teamBScore > teamAScore ? (
                  <span>Winner: {teamBName}</span>
                ) : (
                  <span>Result: Competitive Draw</span>
                )}
              </span>
            </div>
          </div>

          {/* 2. Goal Scorers Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                <Target size={14} className="text-primary-lime" />
                <span>Goal Scorers</span>
              </label>
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setSelectedScorerTeam("teamA")}
                  className={`px-2 py-0.5 rounded-md font-bold transition-colors cursor-pointer ${
                    selectedScorerTeam === "teamA"
                      ? "bg-primary-lime text-black"
                      : "text-text-tertiary hover:text-text-primary"
                  }`}
                >
                  {teamAName}
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => setSelectedScorerTeam("teamB")}
                  className={`px-2 py-0.5 rounded-md font-bold transition-colors cursor-pointer ${
                    selectedScorerTeam === "teamB"
                      ? "bg-primary-lime text-black"
                      : "text-text-tertiary hover:text-text-primary"
                  }`}
                >
                  {teamBName}
                </button>
              </div>
            </div>

            {/* Quick add from joined match players */}
            {joinedPlayers.length > 0 && (
              <div className="p-2.5 rounded-xl bg-surface-raised border border-border-subtle space-y-1.5">
                <span className="text-[10px] text-text-tertiary font-medium block">
                  Tap player to add goal for {selectedScorerTeam === "teamA" ? teamAName : teamBName}:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {joinedPlayers.map((player) => (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() => handleAddScorer(player.name, selectedScorerTeam)}
                      className="px-2.5 py-1 rounded-lg bg-surface-card hover:bg-primary-lime hover:text-black border border-border-subtle text-xs font-medium text-text-secondary transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                    >
                      <span>{player.name}</span>
                      <Plus size={11} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom player manual entry if not in roster */}
            <div className="flex gap-2">
              <input
                type="text"
                value={selectedPlayerForGoal}
                onChange={(e) => setSelectedPlayerForGoal(e.target.value)}
                placeholder="Or enter scorer name..."
                className="flex-1 text-xs bg-surface-card border border-border-subtle rounded-xl px-3 py-2 text-text-primary focus:border-primary-lime focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (selectedPlayerForGoal.trim()) {
                    handleAddScorer(selectedPlayerForGoal.trim(), selectedScorerTeam);
                    setSelectedPlayerForGoal("");
                  }
                }}
                disabled={!selectedPlayerForGoal.trim()}
                className="px-3 py-2 rounded-xl bg-surface-raised hover:bg-border-subtle border border-border-subtle text-xs font-bold text-text-primary cursor-pointer disabled:opacity-50"
              >
                Add
              </button>
            </div>

            {/* Recorded Scorers Chips */}
            {scorers.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {scorers.map((s, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-raised border border-border-subtle text-xs"
                  >
                    <span className="text-[10px] text-text-tertiary font-bold">
                      [{s.team === "teamA" ? teamAName.slice(0, 8) : teamBName.slice(0, 8)}]
                    </span>
                    <span className="font-bold text-text-primary">{s.playerName}</span>
                    <span className="text-primary-lime font-mono font-black">
                      ({s.goals}⚽)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveScorer(idx)}
                      className="ml-1 text-text-tertiary hover:text-red-400 cursor-pointer"
                      title="Remove goal"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-text-tertiary italic">
                No goal scorers tagged yet. Tap any player above to add their goals.
              </p>
            )}
          </div>

          {/* 3. MVP / Man of the Match Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-primary flex items-center gap-1.5">
              <Star size={14} className="text-[#FACC15]" />
              <span>Man of the Match / MVP (Optional)</span>
            </label>
            <select
              value={selectedMvp}
              onChange={(e) => setSelectedMvp(e.target.value)}
              className="w-full text-xs bg-surface-card border border-border-subtle rounded-xl px-3 py-2.5 text-text-primary focus:border-primary-lime focus:outline-none"
            >
              <option value="">-- Select MVP player --</option>
              {joinedPlayers.map((player) => (
                <option key={player.id} value={player.name}>
                  {player.name}
                </option>
              ))}
              {scorers.map((scorer, i) => (
                <option key={"sc_" + i} value={scorer.playerName}>
                  {scorer.playerName} ({scorer.goals} goals)
                </option>
              ))}
            </select>
          </div>

          {/* 4. Match Summary / Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-primary flex items-center gap-1.5">
              <FileText size={14} className="text-text-tertiary" />
              <span>Match Highlights &amp; Notes</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. End-to-end clash with top saves from both keepers under floodlights!"
              rows={2}
              className="w-full text-xs bg-surface-card border border-border-subtle rounded-xl p-3 text-text-primary focus:border-primary-lime focus:outline-none resize-none"
            />
          </div>

          {/* Community Pulse Notice */}
          <div className="p-3 rounded-xl bg-primary-lime/10 border border-primary-lime/25 flex items-center gap-2.5 text-xs text-text-primary">
            <Radio size={16} className="text-primary-lime shrink-0 animate-pulse" />
            <span className="text-[11px] text-text-secondary leading-snug">
              Publishing will update the match card and post this result to the{" "}
              <strong className="text-text-primary">Live Community Pulse</strong> for Kampala football fans.
            </span>
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex items-center gap-2 border-t border-border-subtle">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-full border border-border-subtle text-xs font-bold text-text-secondary hover:bg-surface-raised cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-full bg-primary-lime hover:bg-primary-lime-hover text-black text-xs font-black transition-colors shadow-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Check size={14} strokeWidth={3} />
              <span>{isSubmitting ? "Saving..." : "Save & Publish Result"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
