import React, { useState } from "react";
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  Edit2,
  X,
  Phone,
  Hash,
  Award,
  Filter,
} from "lucide-react";
import { TournamentTeam, TournamentPlayer } from "../../types/tournament";

interface TeamRegistrationManagerProps {
  tournamentId: string;
  teams: TournamentTeam[];
  players: TournamentPlayer[];
  onAddTeam: (team: Omit<TournamentTeam, "id" | "createdAt" | "updatedAt">) => Promise<string | void>;
  onUpdateTeam: (teamId: string, updates: Partial<TournamentTeam>) => Promise<void>;
  onDeleteTeam: (teamId: string) => Promise<void>;
  onAddPlayer: (player: Omit<TournamentPlayer, "id" | "createdAt" | "updatedAt">) => Promise<string | void>;
  onUpdatePlayer: (playerId: string, updates: Partial<TournamentPlayer>) => Promise<void>;
  onDeletePlayer: (playerId: string) => Promise<void>;
  showNotification: (msg: string) => void;
  showError: (err: any) => void;
}

export const TeamRegistrationManager: React.FC<TeamRegistrationManagerProps> = ({
  tournamentId,
  teams,
  players,
  onAddTeam,
  onUpdateTeam,
  onDeleteTeam,
  onAddPlayer,
  onUpdatePlayer,
  onDeletePlayer,
  showNotification,
  showError,
}) => {
  // Active sub-view or filter
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>("all");

  // Team Form
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [teamForm, setTeamForm] = useState<{
    teamName: string;
    group: string;
    managerName: string;
    managerPhone: string;
    badgeInitials: string;
  }>({
    teamName: "",
    group: "Group A",
    managerName: "",
    managerPhone: "",
    badgeInitials: "",
  });

  // Player Form
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [playerForm, setPlayerForm] = useState<{
    teamName: string;
    playerName: string;
    jerseyNumber: string;
    position: string;
    captain: boolean;
    contactNumber: string;
  }>({
    teamName: "",
    playerName: "",
    jerseyNumber: "",
    position: "Forward",
    captain: false,
    contactNumber: "",
  });

  // Handle Team Submit
  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamForm.teamName.trim()) {
      showError(new Error("Please enter team name"));
      return;
    }

    try {
      if (editingTeamId) {
        await onUpdateTeam(editingTeamId, {
          teamName: teamForm.teamName.trim(),
          group: teamForm.group,
          managerName: teamForm.managerName.trim(),
          managerPhone: teamForm.managerPhone.trim(),
          badgeInitials: teamForm.badgeInitials.trim() || teamForm.teamName.substring(0, 3).toUpperCase(),
        });
        showNotification("Team details updated!");
        setEditingTeamId(null);
      } else {
        await onAddTeam({
          tournamentId,
          teamName: teamForm.teamName.trim(),
          group: teamForm.group,
          managerName: teamForm.managerName.trim(),
          managerPhone: teamForm.managerPhone.trim(),
          badgeInitials: teamForm.badgeInitials.trim() || teamForm.teamName.substring(0, 3).toUpperCase(),
        });
        showNotification("Team successfully registered!");
      }

      setTeamForm({
        teamName: "",
        group: "Group A",
        managerName: "",
        managerPhone: "",
        badgeInitials: "",
      });
    } catch (err) {
      showError(err);
    }
  };

  // Handle Player Submit
  const handleSavePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerForm.playerName.trim() || !playerForm.teamName.trim()) {
      showError(new Error("Please enter player name and select a team"));
      return;
    }

    try {
      const jerseyNum = playerForm.jerseyNumber ? parseInt(playerForm.jerseyNumber, 10) : undefined;

      if (editingPlayerId) {
        await onUpdatePlayer(editingPlayerId, {
          playerName: playerForm.playerName.trim(),
          teamName: playerForm.teamName.trim(),
          jerseyNumber: isNaN(jerseyNum as number) ? undefined : jerseyNum,
          position: playerForm.position,
          captain: playerForm.captain,
          contactNumber: playerForm.contactNumber.trim(),
        });
        showNotification("Player profile updated!");
        setEditingPlayerId(null);
      } else {
        await onAddPlayer({
          tournamentId,
          playerName: playerForm.playerName.trim(),
          teamName: playerForm.teamName.trim(),
          jerseyNumber: isNaN(jerseyNum as number) ? undefined : jerseyNum,
          position: playerForm.position,
          captain: playerForm.captain,
          contactNumber: playerForm.contactNumber.trim(),
        });
        showNotification("Player rostered successfully!");
      }

      setPlayerForm({
        teamName: playerForm.teamName, // keep selected team for faster batch entry
        playerName: "",
        jerseyNumber: "",
        position: "Forward",
        captain: false,
        contactNumber: "",
      });
    } catch (err) {
      showError(err);
    }
  };

  const filteredPlayers = selectedTeamFilter === "all"
    ? players
    : players.filter((p) => p.teamName === selectedTeamFilter);

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="p-4 rounded-2xl bg-surface-card border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-lime/15 border border-primary-lime/30 flex items-center justify-center text-primary-lime shrink-0">
            <Users size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-text-primary uppercase tracking-tight">
              Official Team & Player Registry
            </h3>
            <p className="text-xs text-text-secondary">
              Register club rosters, assign squad jersey numbers, designate captains, and store manager contacts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-surface-raised border border-border-subtle flex items-center gap-1.5">
            <span className="font-bold text-text-secondary">Registered Teams:</span>
            <span className="font-black text-primary-lime">{teams.length}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-surface-raised border border-border-subtle flex items-center gap-1.5">
            <span className="font-bold text-text-secondary">Rostered Players:</span>
            <span className="font-black text-primary-lime">{players.length}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ========================================== */}
        {/* COLUMN 1: REGISTER / MANAGE CLUBS (5 cols) */}
        {/* ========================================== */}
        <div className="lg:col-span-5 bg-surface-card border border-border-subtle rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm flex flex-col">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-primary-lime" />
              <h3 className="text-sm font-black text-text-primary uppercase tracking-tight">
                {editingTeamId ? "Edit Club" : "Register New Team"}
              </h3>
            </div>
            {editingTeamId && (
              <button
                type="button"
                onClick={() => {
                  setEditingTeamId(null);
                  setTeamForm({
                    teamName: "",
                    group: "Group A",
                    managerName: "",
                    managerPhone: "",
                    badgeInitials: "",
                  });
                }}
                className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1 cursor-pointer"
              >
                <X size={12} /> Cancel
              </button>
            )}
          </div>

          <form onSubmit={handleSaveTeam} className="space-y-3 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1">
                Team / Club Name *
              </label>
              <input
                type="text"
                value={teamForm.teamName}
                onChange={(e) => setTeamForm((prev) => ({ ...prev, teamName: e.target.value }))}
                placeholder="e.g. WEHAT FC, BUNGA FC"
                className="w-full bg-app-base border border-border-subtle rounded-xl px-3 py-2 text-text-primary focus:border-primary-lime"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1">
                  Assigned Group
                </label>
                <select
                  value={teamForm.group}
                  onChange={(e) => setTeamForm((prev) => ({ ...prev, group: e.target.value }))}
                  className="w-full bg-app-base border border-border-subtle rounded-xl px-2.5 py-2 text-text-primary focus:border-primary-lime cursor-pointer"
                >
                  <option value="Group A">Group A</option>
                  <option value="Group B">Group B</option>
                  <option value="Group C">Group C</option>
                  <option value="Group D">Group D</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1">
                  Initials / Code
                </label>
                <input
                  type="text"
                  value={teamForm.badgeInitials}
                  onChange={(e) => setTeamForm((prev) => ({ ...prev, badgeInitials: e.target.value }))}
                  placeholder="e.g. WFC"
                  maxLength={4}
                  className="w-full bg-app-base border border-border-subtle rounded-xl px-3 py-2 text-text-primary focus:border-primary-lime uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1">
                  Manager / Coach Name
                </label>
                <input
                  type="text"
                  value={teamForm.managerName}
                  onChange={(e) => setTeamForm((prev) => ({ ...prev, managerName: e.target.value }))}
                  placeholder="e.g. Coach David"
                  className="w-full bg-app-base border border-border-subtle rounded-xl px-3 py-2 text-text-primary focus:border-primary-lime"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1">
                  Manager Phone
                </label>
                <input
                  type="tel"
                  value={teamForm.managerPhone}
                  onChange={(e) => setTeamForm((prev) => ({ ...prev, managerPhone: e.target.value }))}
                  placeholder="+256..."
                  className="w-full bg-app-base border border-border-subtle rounded-xl px-3 py-2 text-text-primary focus:border-primary-lime"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-primary-lime hover:bg-[#96E600] text-black font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Shield size={14} />
              <span>{editingTeamId ? "Update Club" : "Register Team"}</span>
            </button>
          </form>

          {/* Teams List */}
          <div className="pt-2 border-t border-border-subtle space-y-2">
            <div className="flex items-center justify-between text-xs text-text-secondary font-bold">
              <span>Clubs List ({teams.length})</span>
            </div>

            <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
              {teams.length === 0 ? (
                <p className="text-xs text-text-tertiary italic text-center py-4">
                  No teams registered yet.
                </p>
              ) : (
                teams.map((t) => {
                  const teamPlayers = players.filter((p) => p.teamName === t.teamName);
                  return (
                    <div
                      key={t.id}
                      className="p-2.5 rounded-xl border border-border-subtle bg-app-base flex items-center justify-between gap-2 text-xs hover:border-primary-lime/40 transition-all"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-surface-raised font-mono text-[10px] font-black text-primary-lime">
                            {t.badgeInitials || t.teamName.substring(0, 3).toUpperCase()}
                          </span>
                          <span className="font-bold text-text-primary truncate">{t.teamName}</span>
                          <span className="text-[10px] text-text-tertiary">({t.group})</span>
                        </div>
                        <div className="text-[10px] text-text-secondary flex items-center gap-2 mt-0.5">
                          <span>{teamPlayers.length} players</span>
                          {t.managerName && <span>• Mgr: {t.managerName}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTeamId(t.id);
                            setTeamForm({
                              teamName: t.teamName,
                              group: t.group || "Group A",
                              managerName: t.managerName || "",
                              managerPhone: t.managerPhone || "",
                              badgeInitials: t.badgeInitials || "",
                            });
                          }}
                          className="p-1 rounded-lg text-text-secondary hover:text-text-primary cursor-pointer"
                          title="Edit team"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete ${t.teamName}?`)) {
                              onDeleteTeam(t.id);
                            }
                          }}
                          className="p-1 rounded-lg text-[#EF4444] hover:bg-[#EF4444]/10 cursor-pointer"
                          title="Delete team"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* COLUMN 2: REGISTER & ROSTER PLAYERS (7 cols) */}
        {/* ========================================== */}
        <div className="lg:col-span-7 bg-surface-card border border-border-subtle rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm flex flex-col">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2">
              <UserPlus size={16} className="text-primary-lime" />
              <h3 className="text-sm font-black text-text-primary uppercase tracking-tight">
                {editingPlayerId ? "Edit Player Profile" : "Register Player to Squad"}
              </h3>
            </div>
            {editingPlayerId && (
              <button
                type="button"
                onClick={() => {
                  setEditingPlayerId(null);
                  setPlayerForm({
                    teamName: "",
                    playerName: "",
                    jerseyNumber: "",
                    position: "Forward",
                    captain: false,
                    contactNumber: "",
                  });
                }}
                className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1 cursor-pointer"
              >
                <X size={12} /> Cancel
              </button>
            )}
          </div>

          <form onSubmit={handleSavePlayer} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1">
                  Club / Team *
                </label>
                <select
                  value={playerForm.teamName}
                  onChange={(e) => setPlayerForm((prev) => ({ ...prev, teamName: e.target.value }))}
                  className="w-full bg-app-base border border-border-subtle rounded-xl px-2.5 py-2 text-text-primary focus:border-primary-lime cursor-pointer"
                  required
                >
                  <option value="">-- Select Club --</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.teamName}>
                      {t.teamName} ({t.group})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1">
                  Player Full Name *
                </label>
                <input
                  type="text"
                  value={playerForm.playerName}
                  onChange={(e) => setPlayerForm((prev) => ({ ...prev, playerName: e.target.value }))}
                  placeholder="e.g. Shafik Nyanzi"
                  className="w-full bg-app-base border border-border-subtle rounded-xl px-3 py-2 text-text-primary focus:border-primary-lime"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1">
                  Jersey Number
                </label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={playerForm.jerseyNumber}
                  onChange={(e) => setPlayerForm((prev) => ({ ...prev, jerseyNumber: e.target.value }))}
                  placeholder="e.g. 10"
                  className="w-full bg-app-base border border-border-subtle rounded-xl px-3 py-2 text-text-primary focus:border-primary-lime"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1">
                  Position
                </label>
                <select
                  value={playerForm.position}
                  onChange={(e) => setPlayerForm((prev) => ({ ...prev, position: e.target.value }))}
                  className="w-full bg-app-base border border-border-subtle rounded-xl px-2.5 py-2 text-text-primary focus:border-primary-lime cursor-pointer"
                >
                  <option value="Forward">Forward</option>
                  <option value="Midfielder">Midfielder</option>
                  <option value="Defender">Defender</option>
                  <option value="Goalkeeper">Goalkeeper</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1">
                  Captain?
                </label>
                <label className="flex items-center gap-2 h-9 px-3 bg-app-base border border-border-subtle rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={playerForm.captain}
                    onChange={(e) => setPlayerForm((prev) => ({ ...prev, captain: e.target.checked }))}
                    className="accent-primary-lime w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-text-primary">Squad Captain</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-primary-lime hover:bg-[#96E600] text-black font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <UserPlus size={14} />
              <span>{editingPlayerId ? "Update Player" : "Add Player to Roster"}</span>
            </button>
          </form>

          {/* Players Roster Section with Filter */}
          <div className="pt-2 border-t border-border-subtle space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs text-text-secondary font-bold">
                <Filter size={13} className="text-primary-lime" />
                <span>Filter by Club:</span>
              </div>
              <select
                value={selectedTeamFilter}
                onChange={(e) => setSelectedTeamFilter(e.target.value)}
                className="bg-app-base border border-border-subtle rounded-xl px-2.5 py-1 text-xs text-text-primary focus:border-primary-lime cursor-pointer"
              >
                <option value="all">All Clubs ({players.length} players)</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.teamName}>
                    {t.teamName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
              {filteredPlayers.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-border-subtle rounded-xl space-y-1 text-xs text-text-tertiary">
                  <p>No players registered for this selection yet.</p>
                  <p className="text-[11px]">Select a club above and register squad members.</p>
                </div>
              ) : (
                filteredPlayers.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-xl border border-border-subtle bg-app-base flex items-center justify-between gap-2 text-xs hover:border-primary-lime/40 transition-all"
                  >
                    <div className="min-w-0 flex-1 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-surface-raised border border-border-subtle flex items-center justify-center font-mono font-black text-primary-lime text-xs shrink-0">
                        {p.jerseyNumber ? `#${p.jerseyNumber}` : "-"}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-text-primary truncate">{p.playerName}</span>
                          {p.captain && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[9px] font-black flex items-center gap-0.5">
                              <Award size={9} /> C
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-text-secondary truncate">
                          {p.teamName} • <span className="text-text-tertiary">{p.position || "Player"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPlayerId(p.id);
                          setPlayerForm({
                            teamName: p.teamName,
                            playerName: p.playerName,
                            jerseyNumber: p.jerseyNumber ? String(p.jerseyNumber) : "",
                            position: p.position || "Forward",
                            captain: !!p.captain,
                            contactNumber: p.contactNumber || "",
                          });
                        }}
                        className="p-1 rounded-lg text-text-secondary hover:text-text-primary cursor-pointer"
                        title="Edit player"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete ${p.playerName} from roster?`)) {
                            onDeletePlayer(p.id);
                          }
                        }}
                        className="p-1 rounded-lg text-[#EF4444] hover:bg-[#EF4444]/10 cursor-pointer"
                        title="Delete player"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
