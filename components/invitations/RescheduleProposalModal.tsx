import React, { useState } from 'react';
import { X, Calendar, Clock, AlertTriangle, RefreshCw, Check } from 'lucide-react';
import { MatchInvitation } from '../../types/firebase';
import { matchInvitationService } from '../../services/matchInvitationService';

interface RescheduleProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: MatchInvitation | null;
  onRescheduled?: () => void;
}

export const RescheduleProposalModal: React.FC<RescheduleProposalModalProps> = ({
  isOpen,
  onClose,
  proposal,
  onRescheduled,
}) => {
  const [newDate, setNewDate] = useState<string>(
    proposal?.date || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
  );
  const [newTime, setNewTime] = useState<string>(proposal?.time || '19:00');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !proposal) return null;

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate || !newTime) {
      setError("Please pick a new date and time slot.");
      return;
    }

    if (!proposal.id) return;
    setLoading(true);
    setError(null);
    try {
      await matchInvitationService.rescheduleProposal(proposal.id, newDate, newTime);
      if (onRescheduled) {
        onRescheduled();
      }
      onClose();
    } catch (err: any) {
      console.error("Reschedule failed:", err);
      setError(err.message || "Failed to reschedule match proposal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-app-base/80 backdrop-blur-sm p-4 animate-fade-in font-sans">
      <div 
        className="bg-surface-card border border-border-subtle rounded-3xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-border-subtle flex items-center justify-between bg-surface-raised/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B]">
              <RefreshCw size={20} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-text-primary">
                Reschedule Match
              </h2>
              <p className="text-xs text-text-secondary">
                Pick a new time slot for your squad
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

        {/* Content */}
        <form onSubmit={handleReschedule} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] text-xs font-bold">
              {error}
            </div>
          )}

          <div className="p-3.5 rounded-2xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 text-xs text-text-secondary space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[#F59E0B]">
              <AlertTriangle size={14} />
              <span>Rescheduling keeps your squad intact</span>
            </div>
            <p className="text-[11px]">
              All invited players will be notified of the updated time slot and their attendance status will be refreshed so they can re-confirm.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
              New Date
            </label>
            <div className="relative">
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full bg-surface-raised border border-border-subtle rounded-xl px-4 py-2.5 text-xs text-text-primary font-bold outline-none focus:border-primary-lime"
                required
              />
              <Calendar size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
              New Kickoff Time
            </label>
            <div className="relative">
              <select
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
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

          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-border-subtle text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-surface-raised transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-5 py-2.5 rounded-xl bg-primary-lime hover:bg-[#B2FF1A] text-accent-text text-xs font-black uppercase tracking-wider shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-accent-text border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Check size={14} />
                  <span>Update &amp; Re-Invite</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
