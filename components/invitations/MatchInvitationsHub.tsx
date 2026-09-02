import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Users, 
  Sparkles, 
  Filter, 
  Clock, 
  Calendar, 
  RefreshCw, 
  CheckCircle2, 
  Inbox, 
  Send
} from 'lucide-react';
import { MatchInvitation, User } from '../../types/firebase';
import { matchInvitationService } from '../../services/matchInvitationService';
import { MatchInvitationCard } from './MatchInvitationCard';
import { CreateMatchProposalModal } from './CreateMatchProposalModal';

interface MatchInvitationsHubProps {
  currentUser: User | null;
  onBookProposal?: (proposal: MatchInvitation) => void;
  onRequestLogin?: () => void;
}

export const MatchInvitationsHub: React.FC<MatchInvitationsHubProps> = ({
  currentUser,
  onBookProposal,
  onRequestLogin,
}) => {
  const [proposals, setProposals] = useState<MatchInvitation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'all' | 'created' | 'invitations'>('all');
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      setProposals([]);
      return;
    }

    setLoading(true);
    const unsubscribe = matchInvitationService.subscribeUserProposals(
      currentUser.id,
      (userProposals) => {
        setProposals(userProposals);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.id]);

  const handleRefresh = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const userProposals = await matchInvitationService.getProposalsForUser(currentUser.id);
      setProposals(userProposals);
    } catch (err) {
      console.warn("Error refreshing proposals:", err);
    } finally {
      setLoading(false);
    }
  };

  const createdProposals = proposals.filter((p) => p.creatorId === currentUser?.id);
  const receivedProposals = proposals.filter((p) => p.creatorId !== currentUser?.id);

  const displayedList =
    activeTab === 'created'
      ? createdProposals
      : activeTab === 'invitations'
      ? receivedProposals
      : proposals;

  const pendingActionCount = receivedProposals.filter((p) => {
    if (p.status !== 'proposing') return false;
    const myResp = currentUser ? p.responses?.[currentUser.id] : undefined;
    return !myResp || myResp === 'pending';
  }).length;

  const readyToBookCount = createdProposals.filter(
    (p) => p.status === 'all_confirmed'
  ).length;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 font-sans text-text-primary">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary-lime/10 text-primary-lime border border-primary-lime/30 uppercase tracking-wider">
              Match Invitations
            </span>
            <span className="text-xs text-text-tertiary font-medium">
              Squad Organization
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            Proposed Games &amp; Squads
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary font-medium">
            Propose casual games, gather squad confirmations for free, then reserve the pitch when ready.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            className="w-10 h-10 rounded-2xl bg-surface-card hover:bg-surface-raised border border-border-subtle flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            title="Refresh Proposals"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={() => {
              if (!currentUser && onRequestLogin) {
                onRequestLogin();
                return;
              }
              setIsCreateOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary-lime hover:bg-[#B2FF1A] text-accent-text text-xs font-black uppercase tracking-wider shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Propose a Match</span>
          </button>
        </div>
      </div>

      {/* Alert Banners if Action Needed */}
      {readyToBookCount > 0 && (
        <div className="p-4 rounded-3xl bg-primary-lime/15 border border-primary-lime/40 flex items-center justify-between gap-3 animate-fade-in shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-lime text-accent-text flex items-center justify-center font-black">
              <Sparkles size={20} />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-text-primary">
                {readyToBookCount} Proposed Match{readyToBookCount > 1 ? 'es' : ''} Fully Confirmed!
              </h4>
              <p className="text-[11px] text-text-secondary">
                Your squad is ready. Lock in the pitch slot with a 50% deposit now.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('created')}
            className="px-4 py-2 rounded-xl bg-primary-lime text-accent-text text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            Review &amp; Book
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-border-subtle pb-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'all'
              ? 'bg-surface-raised border border-border-prominent text-text-primary'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-card'
          }`}
        >
          <span>All Proposals</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-surface-card border border-border-subtle font-mono">
            {proposals.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('created')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'created'
              ? 'bg-surface-raised border border-border-prominent text-text-primary'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-card'
          }`}
        >
          <Send size={13} />
          <span>My Proposed Games</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-surface-card border border-border-subtle font-mono">
            {createdProposals.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('invitations')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'invitations'
              ? 'bg-surface-raised border border-border-prominent text-text-primary'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-card'
          }`}
        >
          <Inbox size={13} />
          <span>Invitations Received</span>
          {pendingActionCount > 0 ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#F59E0B] text-white font-mono font-bold animate-pulse">
              {pendingActionCount} New
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-surface-card border border-border-subtle font-mono">
              {receivedProposals.length}
            </span>
          )}
        </button>
      </div>

      {/* Main Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-primary-lime border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-text-tertiary">Loading match proposals...</span>
        </div>
      ) : !currentUser ? (
        <div className="bg-surface-card rounded-3xl p-12 text-center border border-border-subtle max-w-md mx-auto space-y-4">
          <Users size={44} className="mx-auto text-text-tertiary opacity-60" />
          <div>
            <h3 className="text-base font-bold text-text-primary">Sign In to Organize Games</h3>
            <p className="text-xs text-text-secondary mt-1">
              Connect with players, create free match proposals, and gather attendance before reserving pitch slots.
            </p>
          </div>
          {onRequestLogin && (
            <button
              onClick={onRequestLogin}
              className="px-6 py-2.5 rounded-2xl bg-primary-lime text-accent-text text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>
      ) : displayedList.length === 0 ? (
        <div className="bg-surface-card rounded-3xl p-12 text-center border border-border-subtle max-w-md mx-auto space-y-4">
          <Users size={44} className="mx-auto text-text-tertiary opacity-60" />
          <div>
            <h3 className="text-base font-bold text-text-primary">
              {activeTab === 'created'
                ? "You haven't proposed any games yet"
                : activeTab === 'invitations'
                ? 'No invitations received'
                : 'No match proposals found'}
            </h3>
            <p className="text-xs text-text-secondary mt-1">
              Start by proposing a match and inviting your squad to confirm attendance for free.
            </p>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-6 py-2.5 rounded-2xl bg-primary-lime hover:bg-[#B2FF1A] text-accent-text text-xs font-black uppercase tracking-wider shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <Plus size={15} />
            <span>Propose a Match</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedList.map((proposal) => (
            <MatchInvitationCard
              key={proposal.id}
              proposal={proposal}
              currentUser={currentUser}
              onBookProposal={onBookProposal}
              onRefresh={handleRefresh}
            />
          ))}
        </div>
      )}

      {/* Create Proposal Modal */}
      <CreateMatchProposalModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        currentUser={currentUser}
        onProposalCreated={() => {
          handleRefresh();
        }}
      />
    </div>
  );
};
