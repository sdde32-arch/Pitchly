import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  Calendar, 
  Clock, 
  MapPin, 
  Radio, 
  Send, 
  Sparkles, 
  UserPlus, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  ShieldCheck,
  Building2
} from 'lucide-react';
import { Pitch, User } from '../../types/firebase';
import { matchInvitationService } from '../../services/matchInvitationService';
import { pitchService } from '../../services/pitchService';
import { PlayerSelectionModal } from './PlayerSelectionModal';

interface CreateMatchProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  initialPitchId?: string;
  initialDate?: string;
  initialTime?: string;
  preselectedPitchId?: string;
  preselectedPitchName?: string;
  onProposalCreated?: (proposalId: string) => void;
}

export const CreateMatchProposalModal: React.FC<CreateMatchProposalModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialPitchId,
  initialDate,
  initialTime,
  preselectedPitchId,
  preselectedPitchName,
  onProposalCreated,
}) => {
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [selectedPitchId, setSelectedPitchId] = useState<string>(preselectedPitchId || initialPitchId || '');
  const [date, setDate] = useState<string>(
    initialDate || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
  );
  const [time, setTime] = useState<string>(initialTime || '18:00');
  const [playersNeeded, setPlayersNeeded] = useState<number>(10);
  const [notes, setNotes] = useState<string>('');
  
  // Broadcast vs Direct
  const [isBroadcast, setIsBroadcast] = useState<boolean>(false);
  const [broadcastCount, setBroadcastCount] = useState<number>(0);
  const [loadingBroadcastCount, setLoadingBroadcastCount] = useState<boolean>(false);

  // Direct invitees
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isOwnerOrStaff = 
    currentUser?.role?.toUpperCase() === 'OWNER' ||
    currentUser?.role?.toUpperCase() === 'STAFF' ||
    currentUser?.role?.toUpperCase() === 'ADMIN';

  useEffect(() => {
    if (isOpen) {
      const loadPitches = async () => {
        try {
          const list = await pitchService.listPublic();
          setPitches(list);
          if (!selectedPitchId && list.length > 0) {
            setSelectedPitchId(initialPitchId || list[0].id);
          }
        } catch (err) {
          console.warn("Failed to load pitches:", err);
        }
      };
      loadPitches();
    }
  }, [isOpen, initialPitchId]);

  // When pitch changes, if broadcast mode is active or user is owner, check previous bookers count
  useEffect(() => {
    if (selectedPitchId && isOwnerOrStaff) {
      setLoadingBroadcastCount(true);
      matchInvitationService.getPreviousBookersForPitch(selectedPitchId)
        .then((bookerIds) => {
          setBroadcastCount(bookerIds.length);
        })
        .catch(() => setBroadcastCount(0))
        .finally(() => setLoadingBroadcastCount(false));
    }
  }, [selectedPitchId, isOwnerOrStaff]);

  if (!isOpen) return null;

  const selectedPitch = pitches.find((p) => p.id === selectedPitchId);

  const handleConfirmPlayers = (ids: string[], userObjs?: User[]) => {
    setSelectedUserIds(ids);
    if (userObjs) {
      setSelectedUsers(userObjs);
    }
  };

  const handleRemovePlayer = (id: string) => {
    setSelectedUserIds((prev) => prev.filter((uid) => uid !== id));
    setSelectedUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError("You must be logged in to propose a match.");
      return;
    }
    if (!selectedPitchId) {
      setError("Please select a pitch.");
      return;
    }
    if (!date || !time) {
      setError("Please specify match date and kickoff time.");
      return;
    }
    if (!isBroadcast && selectedUserIds.length === 0) {
      setError("Please invite at least 1 player to your proposed match.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const proposal = await matchInvitationService.createProposal({
        creatorId: currentUser.id,
        creatorName: currentUser.name || 'Organizer',
        creatorRole: isOwnerOrStaff ? 'owner' : 'player',
        pitchId: selectedPitchId,
        pitchName: selectedPitch?.name || 'Pitch Booking',
        pitchLocation: typeof selectedPitch?.location === 'string' ? selectedPitch.location : 'Kampala, Uganda',
        pricePerHour: selectedPitch?.pricePerHour || 50000,
        proposedDateTime: `${date}T${time}:00`,
        date,
        time,
        playersNeeded: Number(playersNeeded),
        broadcastToPreviousBookers: isBroadcast,
        invitedUserIds: isBroadcast ? [] : selectedUserIds,
        notes: notes.trim() || undefined,
      });

      if (onProposalCreated) {
        onProposalCreated(proposal.id || '');
      }
      onClose();
    } catch (err: any) {
      console.error("Failed to create proposal:", err);
      setError(err.message || "Failed to create match proposal. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-app-base/80 backdrop-blur-sm p-4 animate-fade-in font-sans">
        <div 
          className="bg-surface-card border border-border-subtle rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 border-b border-border-subtle flex items-center justify-between bg-surface-raised/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary-lime/10 border border-primary-lime/30 flex items-center justify-center text-primary-lime">
                <Sparkles size={20} />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-text-primary">
                  Propose a Match
                </h2>
                <p className="text-xs text-text-secondary">
                  Gather players before locking in your pitch reservation
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-surface-card hover:bg-border-subtle border border-border-subtle flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5 no-scrollbar">
            {error && (
              <div className="p-3.5 rounded-2xl bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] text-xs font-bold flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Pitch Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                Select Turf / Pitch
              </label>
              <div className="relative">
                <select
                  value={selectedPitchId}
                  onChange={(e) => setSelectedPitchId(e.target.value)}
                  className="w-full bg-surface-raised border border-border-subtle rounded-xl px-4 py-3 text-xs text-text-primary font-bold outline-none focus:border-primary-lime cursor-pointer appearance-none"
                >
                  {pitches.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {typeof p.location === 'string' ? p.location : 'Kampala'} (UGX {Number(p.pricePerHour || 50000).toLocaleString()}/hr)
                    </option>
                  ))}
                </select>
                <Building2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
              </div>
            </div>

            {/* Date & Kickoff Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                  Proposed Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-surface-raised border border-border-subtle rounded-xl px-4 py-2.5 text-xs text-text-primary font-bold outline-none focus:border-primary-lime"
                    required
                  />
                  <Calendar size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                  Kickoff Time Slot
                </label>
                <div className="relative">
                  <select
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-surface-raised border border-border-subtle rounded-xl px-4 py-2.5 text-xs text-text-primary font-bold outline-none focus:border-primary-lime cursor-pointer appearance-none"
                  >
                    {[
                      '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
                      '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
                      '20:00', '21:00', '22:00'
                    ].map((t) => (
                      <option key={t} value={t}>
                        {t} ({Number(t.split(':')[0]) >= 12 ? `${t} PM` : `${t} AM`})
                      </option>
                    ))}
                  </select>
                  <Clock size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Players Needed */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                  Target Squad Size
                </label>
                <span className="text-xs font-extrabold text-primary-lime">
                  {playersNeeded} players needed
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[6, 10, 14, 22].map((num) => (
                  <button
                    type="button"
                    key={num}
                    onClick={() => setPlayersNeeded(num)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      playersNeeded === num
                        ? 'bg-primary-lime text-accent-text border-primary-lime shadow-xs'
                        : 'bg-surface-raised border-border-subtle text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {num} Players ({num / 2}v{num / 2})
                  </button>
                ))}
              </div>
            </div>

            {/* Broadcast Options for Owners/Staff */}
            {isOwnerOrStaff && (
              <div className="bg-surface-raised rounded-2xl p-4 border border-border-subtle space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary block">
                  Pitch Owner &amp; Staff Options
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsBroadcast(false)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      !isBroadcast
                        ? 'bg-primary-lime/10 border-primary-lime text-text-primary'
                        : 'bg-surface-card border-border-subtle text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <UserPlus size={14} className={!isBroadcast ? 'text-primary-lime' : ''} />
                      <span>Select Players</span>
                    </div>
                    <p className="text-[10px] text-text-secondary mt-1">
                      Pick specific contacts or friends
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsBroadcast(true)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isBroadcast
                        ? 'bg-primary-lime/10 border-primary-lime text-text-primary'
                        : 'bg-surface-card border-border-subtle text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <Radio size={14} className={isBroadcast ? 'text-primary-lime' : ''} />
                      <span>Broadcast to Past Bookers</span>
                    </div>
                    <p className="text-[10px] text-text-secondary mt-1">
                      {loadingBroadcastCount
                        ? 'Counting previous players...'
                        : `${broadcastCount} past bookers for this pitch`}
                    </p>
                  </button>
                </div>
              </div>
            )}

            {/* Invitee Selection (when not broadcasting) */}
            {!isBroadcast && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                    Invited Teammates ({selectedUserIds.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsPlayerModalOpen(true)}
                    className="flex items-center gap-1.5 text-xs font-bold text-primary-lime hover:underline cursor-pointer"
                  >
                    <UserPlus size={14} />
                    <span>{selectedUserIds.length === 0 ? 'Select Players' : 'Edit Roster'}</span>
                  </button>
                </div>

                {selectedUserIds.length === 0 ? (
                  <div 
                    onClick={() => setIsPlayerModalOpen(true)}
                    className="border-2 border-dashed border-border-subtle hover:border-primary-lime/50 rounded-2xl p-6 text-center cursor-pointer transition-all bg-surface-raised/40 hover:bg-surface-raised"
                  >
                    <Users size={28} className="mx-auto mb-2 text-text-tertiary" />
                    <p className="text-xs font-bold text-text-primary">No teammates selected yet</p>
                    <p className="text-[11px] text-text-secondary mt-0.5">
                      Click here to search and select players from the Pitchly network
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 bg-surface-raised rounded-2xl border border-border-subtle">
                    {selectedUsers.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center gap-1.5 bg-surface-card border border-border-subtle px-2.5 py-1 rounded-xl text-xs font-bold text-text-primary shadow-2xs"
                      >
                        <span className="truncate max-w-[120px]">{u.name || u.email || 'Player'}</span>
                        <button
                          type="button"
                          onClick={() => handleRemovePlayer(u.id)}
                          className="text-text-tertiary hover:text-[#EF4444] transition-colors cursor-pointer"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Casual Match Notes */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                Match Notes / Description (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g., Casual 5-a-side friendly. Bring bibs and astro turf boots!"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-surface-raised border border-border-subtle rounded-xl p-3 text-xs text-text-primary placeholder:text-text-tertiary font-medium outline-none focus:border-primary-lime transition-all resize-none"
              />
            </div>

            {/* Spec / Rules info box */}
            <div className="p-3.5 rounded-2xl bg-surface-raised border border-border-subtle text-xs space-y-1 text-text-secondary">
              <div className="flex items-center gap-1.5 font-bold text-text-primary">
                <Info size={14} className="text-primary-lime" />
                <span>How Match Proposals Work:</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                • <strong>No slot is locked yet:</strong> Pitch time is only reserved when all players confirm and you finalize the booking deposit.
              </p>
              <p className="text-[11px] leading-relaxed">
                • <strong>Free for invitees:</strong> Invited players confirm attendance for free without any charges.
              </p>
              <p className="text-[11px] leading-relaxed">
                • <strong>24-Hour Expiry:</strong> Unconfirmed proposals automatically expire 24 hours prior to kickoff.
              </p>
            </div>
          </form>

          {/* Footer CTA */}
          <div className="p-4 border-t border-border-subtle bg-surface-raised/60 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-border-subtle text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-surface-card transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 max-w-[240px] px-5 py-2.5 rounded-xl bg-primary-lime hover:bg-[#B2FF1A] text-accent-text text-xs font-black uppercase tracking-wider shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-accent-text border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Send size={14} />
                  <span>Launch Proposal</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Player Selection Modal Sub-Flow */}
      <PlayerSelectionModal
        isOpen={isPlayerModalOpen}
        onClose={() => setIsPlayerModalOpen(false)}
        selectedUserIds={selectedUserIds}
        onConfirmSelection={handleConfirmPlayers}
        currentUserId={currentUser?.id}
        playersNeeded={playersNeeded}
      />
    </>
  );
};
