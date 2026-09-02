import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Radio, 
  ArrowRight, 
  RefreshCw, 
  Sparkles, 
  Check, 
  X, 
  Share2, 
  Trash2,
  Lock,
  UserCheck
} from 'lucide-react';
import { MatchInvitation, User } from '../../types/firebase';
import { matchInvitationService } from '../../services/matchInvitationService';
import { RescheduleProposalModal } from './RescheduleProposalModal';

interface MatchInvitationCardProps {
  proposal: MatchInvitation;
  currentUser: User | null;
  onBookProposal?: (proposal: MatchInvitation) => void;
  onRefresh?: () => void;
}

export const MatchInvitationCard: React.FC<MatchInvitationCardProps> = ({
  proposal,
  currentUser,
  onBookProposal,
  onRefresh,
}) => {
  const [responding, setResponding] = useState<boolean>(false);
  const [rescheduleOpen, setRescheduleOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [cancelling, setCancelling] = useState<boolean>(false);

  const isCreator = currentUser?.id === proposal.creatorId;
  const myResponse = currentUser ? proposal.responses?.[currentUser.id] : undefined;
  const isInvitee = currentUser && (proposal.invitedUserIds.includes(currentUser.id) || proposal.broadcastToPreviousBookers);

  const responseEntries = Object.entries(proposal.responses || {});
  const acceptedCount = responseEntries.filter(([_, status]) => status === 'accepted').length;
  const declinedCount = responseEntries.filter(([_, status]) => status === 'declined').length;
  const pendingCount = Math.max(0, (proposal.invitedUserIds?.length || 0) - acceptedCount - declinedCount);

  const percentFull = Math.min(100, Math.round((acceptedCount / proposal.playersNeeded) * 100));

  const handleRespond = async (status: 'accepted' | 'declined') => {
    if (!currentUser || !proposal.id) return;
    setResponding(true);
    try {
      await matchInvitationService.respondToInvitation(
        proposal.id,
        currentUser.id,
        status
      );
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Failed to respond to invitation:", err);
    } finally {
      setResponding(false);
    }
  };

  const handleCancel = async () => {
    if (!proposal.id) return;
    if (!confirm("Are you sure you want to cancel this match proposal?")) return;
    setCancelling(true);
    try {
      await matchInvitationService.cancelProposal(proposal.id);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Failed to cancel proposal:", err);
    } finally {
      setCancelling(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Match Proposal: ${proposal.pitchName}`,
        text: `Join our match proposal at ${proposal.pitchName} on ${proposal.date} at ${proposal.time}!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(
        `Join our match at ${proposal.pitchName} on ${proposal.date} at ${proposal.time}! Propose on Pitchly: ${window.location.href}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Status Styling Helpers
  const getStatusBadge = () => {
    switch (proposal.status) {
      case 'all_confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-primary-lime/15 text-primary-lime border border-primary-lime/30 animate-pulse">
            <Sparkles size={12} /> Squad Full • Ready to Book
          </span>
        );
      case 'booked':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30">
            <CheckCircle2 size={12} /> Pitch Booked
          </span>
        );
      case 'slot_taken':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30">
            <AlertTriangle size={12} /> Slot Taken by Others
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-surface-raised text-text-tertiary border border-border-subtle">
            <Clock size={12} /> Expired
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20">
            <XCircle size={12} /> Cancelled
          </span>
        );
      case 'proposing':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">
            <Users size={12} /> Gathering Squad ({acceptedCount}/{proposal.playersNeeded})
          </span>
        );
    }
  };

  return (
    <>
      <div className="bg-surface-card rounded-3xl border border-border-subtle p-5 shadow-xs hover:border-border-prominent transition-all font-sans flex flex-col justify-between gap-4">
        {/* Top bar: Status & Type */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              {getStatusBadge()}
              {proposal.broadcastToPreviousBookers && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-surface-raised border border-border-subtle text-text-secondary">
                  <Radio size={10} className="text-primary-lime" /> Broadcast
                </span>
              )}
              {isCreator && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30">
                  Organizer
                </span>
              )}
            </div>
            <h3 className="text-base font-extrabold text-text-primary">
              {proposal.pitchName}
            </h3>
            <div className="flex items-center gap-1 text-xs text-text-secondary mt-0.5">
              <MapPin size={12} className="text-text-tertiary shrink-0" />
              <span className="truncate">{proposal.pitchLocation || 'Kampala'}</span>
            </div>
          </div>

          <button
            onClick={handleShare}
            className="w-8 h-8 rounded-xl bg-surface-raised hover:bg-border-subtle border border-border-subtle flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors cursor-pointer shrink-0"
            title="Share Proposal"
          >
            {copied ? <Check size={14} className="text-primary-lime" /> : <Share2 size={14} />}
          </button>
        </div>

        {/* Match Time & Organizer Info */}
        <div className="grid grid-cols-2 gap-2 p-3 bg-surface-raised/70 rounded-2xl border border-border-subtle text-xs">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-primary-lime shrink-0" />
            <div>
              <span className="text-[10px] text-text-tertiary block uppercase font-bold">Date</span>
              <span className="font-bold text-text-primary">{proposal.date}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock size={14} className="text-primary-lime shrink-0" />
            <div>
              <span className="text-[10px] text-text-tertiary block uppercase font-bold">Time</span>
              <span className="font-bold text-text-primary">{proposal.time}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
            <span className="text-text-secondary">Squad Attendance</span>
            <span className="text-text-primary">
              <span className="text-primary-lime">{acceptedCount}</span> / {proposal.playersNeeded} Confirmed
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-surface-raised overflow-hidden border border-border-subtle">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${
                proposal.status === 'all_confirmed' || proposal.status === 'booked'
                  ? 'bg-primary-lime'
                  : 'bg-[#F59E0B]'
              }`}
              style={{ width: `${percentFull}%` }}
            />
          </div>
        </div>

        {/* Invitee Responses Breakdown */}
        {responseEntries.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary block">
              Player Responses ({responseEntries.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {responseEntries.map(([userId, status]) => {
                const isAccept = status === 'accepted';
                const isDecline = status === 'declined';
                const isCreatorUser = userId === proposal.creatorId;
                const displayName = isCreatorUser
                  ? `${proposal.creatorName || 'Creator'} (Host)`
                  : userId === currentUser?.id
                  ? 'You'
                  : `Player (${userId.substring(0, 5)})`;

                return (
                  <div
                    key={userId}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border ${
                      isAccept
                        ? 'bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]'
                        : isDecline
                        ? 'bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444]'
                        : 'bg-surface-raised border-border-subtle text-text-tertiary'
                    }`}
                  >
                    {isAccept ? (
                      <Check size={11} className="text-[#22C55E]" />
                    ) : isDecline ? (
                      <X size={11} className="text-[#EF4444]" />
                    ) : (
                      <Clock size={11} />
                    )}
                    <span className="truncate max-w-[120px]">{displayName}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Notes (if any) */}
        {proposal.notes && (
          <p className="text-xs text-text-secondary italic bg-surface-raised/40 p-2.5 rounded-xl border border-border-subtle/50">
            "{proposal.notes}"
          </p>
        )}

        {/* Actions Zone */}
        <div className="pt-2 border-t border-border-subtle flex flex-col gap-2">
          {/* Invitee Attendance Action */}
          {isInvitee && !isCreator && proposal.status === 'proposing' && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary block">
                Your Response (Free attendance)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleRespond('accepted')}
                  disabled={responding || myResponse === 'accepted'}
                  className={`py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    myResponse === 'accepted'
                      ? 'bg-[#22C55E] text-white shadow-sm'
                      : 'bg-[#22C55E]/15 hover:bg-[#22C55E]/25 text-[#22C55E] border border-[#22C55E]/40'
                  }`}
                >
                  <Check size={14} />
                  <span>{myResponse === 'accepted' ? 'Attending' : 'Accept (Free)'}</span>
                </button>

                <button
                  onClick={() => handleRespond('declined')}
                  disabled={responding || myResponse === 'declined'}
                  className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    myResponse === 'declined'
                      ? 'bg-[#EF4444] text-white'
                      : 'bg-surface-raised hover:bg-[#EF4444]/10 text-text-secondary hover:text-[#EF4444] border border-border-subtle'
                  }`}
                >
                  <X size={14} />
                  <span>{myResponse === 'declined' ? 'Declined' : 'Decline'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Creator Actions: Book Slot Now when All Confirmed */}
          {isCreator && proposal.status === 'all_confirmed' && (
            <button
              onClick={() => onBookProposal && onBookProposal(proposal)}
              className="w-full py-3 px-4 rounded-2xl bg-primary-lime hover:bg-[#B2FF1A] text-accent-text font-black text-xs uppercase tracking-wider shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock size={15} />
              <span>Book Slot Now (Pay 50% Deposit)</span>
              <ArrowRight size={15} />
            </button>
          )}

          {/* Creator Actions: Reschedule if Slot Taken */}
          {isCreator && proposal.status === 'slot_taken' && (
            <div className="space-y-2">
              <p className="text-xs text-[#EF4444] font-medium">
                Another group booked this time slot. Reschedule to keep your confirmed players!
              </p>
              <button
                onClick={() => setRescheduleOpen(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw size={14} />
                <span>Reschedule to New Time Slot</span>
              </button>
            </div>
          )}

          {/* Creator Cancel / Status */}
          {isCreator && proposal.status === 'proposing' && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-text-tertiary">
                Waiting for {proposal.playersNeeded - acceptedCount} more players
              </span>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="text-xs text-text-tertiary hover:text-[#EF4444] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Trash2 size={12} />
                <span>Cancel Proposal</span>
              </button>
            </div>
          )}

          {/* If Booked, link to confirmation */}
          {proposal.status === 'booked' && (
            <div className="p-3 rounded-2xl bg-[#22C55E]/10 border border-[#22C55E]/20 text-xs text-[#22C55E] font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} /> Confirmed Booking #{proposal.bookingId?.substring(0, 8) || 'DONE'}
              </span>
              <span className="text-[10px] uppercase tracking-wider opacity-80">Pitch Locked</span>
            </div>
          )}
        </div>
      </div>

      {/* Reschedule Modal */}
      <RescheduleProposalModal
        isOpen={rescheduleOpen}
        onClose={() => setRescheduleOpen(false)}
        proposal={proposal}
        onRescheduled={() => {
          if (onRefresh) onRefresh();
        }}
      />
    </>
  );
};
