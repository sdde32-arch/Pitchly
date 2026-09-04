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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-4">
        <div className="space-y-1 sm:space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-primary-lime/10 text-primary-lime border border-primary-lime/30 uppercase tracking-wider">
              Match Invitations
            </span>
            <span className="text-[11px] sm:text-xs text-text-tertiary font-medium">
              Squad Organization
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight font-display">
            Proposed Games &amp; Squads
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary font-medium max-w-xl">
            Propose casual games, gather squad confirmations for free, then reserve the pitch when ready.
          </p>
        </div>

        {/* Action Controls - Ergonomic for Mobile Touch & Tablet Layout */}
        <div className="flex items-center gap-2 w-full md:w-auto pt-1 md:pt-0">
          <button
            id="invitations-refresh-btn"
            onClick={handleRefresh}
            className="w-11 h-11 rounded-2xl bg-surface-card hover:bg-surface-raised border border-border-subtle flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors cursor-pointer shrink-0 shadow-xs active:scale-95"
            title="Refresh Proposals"
          >
            <RefreshCw size={17} className={loading ? 'animate-spin text-primary-lime' : ''} />
          </button>

          <button
            id="invitations-propose-btn"
            onClick={() => {
              if (!currentUser && onRequestLogin) {
                onRequestLogin();
                return;
              }
              setIsCreateOpen(true);
            }}
            className="flex-1 md:flex-initial h-11 px-5 rounded-2xl bg-primary-lime hover:bg-primary-lime-hover text-accent-text text-xs sm:text-sm font-black uppercase tracking-wider shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Propose a Match</span>
          </button>
        </div>
      </div>

      {/* Alert Banners if Action Needed */}
      {readyToBookCount > 0 && (
        <div className="p-3.5 sm:p-4 rounded-3xl bg-primary-lime/15 border border-primary-lime/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-lime text-accent-text flex items-center justify-center font-black shrink-0">
              <Sparkles size={19} />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-extrabold text-text-primary leading-tight">
                {readyToBookCount} Proposed Match{readyToBookCount > 1 ? 'es' : ''} Fully Confirmed!
              </h4>
              <p className="text-[11px] text-text-secondary">
                Your squad is ready. Lock in the pitch slot with a 50% deposit now.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('created')}
            className="h-10 px-4 rounded-xl bg-primary-lime text-accent-text text-xs font-bold uppercase tracking-wider cursor-pointer active:scale-95 transition-all w-full sm:w-auto"
          >
            Review &amp; Book
          </button>
        </div>
      )}

      {/* Tab Navigation - Mobile Smooth Scroll & Tablet Auto-Fit */}
      <div className="flex items-center gap-1.5 sm:gap-2 border-b border-border-subtle pb-2.5 overflow-x-auto no-scrollbar scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          id="tab-all-proposals"
          onClick={() => setActiveTab('all')}
          className={`min-h-[44px] px-3.5 sm:px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap flex items-center gap-2 border active:scale-95 ${
            activeTab === 'all'
              ? 'bg-primary-lime/15 text-primary-lime border-primary-lime/40 shadow-xs'
              : 'bg-surface-card hover:bg-surface-raised border-border-subtle text-text-secondary hover:text-text-primary'
          }`}
        >
          <span>All Proposals</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
            activeTab === 'all'
              ? 'bg-primary-lime/20 text-primary-lime'
              : 'bg-surface-raised border border-border-subtle text-text-tertiary'
          }`}>
            {proposals.length}
          </span>
        </button>

        <button
          id="tab-my-proposals"
          onClick={() => setActiveTab('created')}
          className={`min-h-[44px] px-3.5 sm:px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap flex items-center gap-2 border active:scale-95 ${
            activeTab === 'created'
              ? 'bg-primary-lime/15 text-primary-lime border-primary-lime/40 shadow-xs'
              : 'bg-surface-card hover:bg-surface-raised border-border-subtle text-text-secondary hover:text-text-primary'
          }`}
        >
          <Send size={13} className={activeTab === 'created' ? 'text-primary-lime' : 'text-text-tertiary'} />
          <span>
            <span className="inline sm:hidden">My Proposals</span>
            <span className="hidden sm:inline">My Proposed Games</span>
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
            activeTab === 'created'
              ? 'bg-primary-lime/20 text-primary-lime'
              : 'bg-surface-raised border border-border-subtle text-text-tertiary'
          }`}>
            {createdProposals.length}
          </span>
        </button>

        <button
          id="tab-invitations"
          onClick={() => setActiveTab('invitations')}
          className={`min-h-[44px] px-3.5 sm:px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap flex items-center gap-2 border active:scale-95 ${
            activeTab === 'invitations'
              ? 'bg-primary-lime/15 text-primary-lime border-primary-lime/40 shadow-xs'
              : 'bg-surface-card hover:bg-surface-raised border-border-subtle text-text-secondary hover:text-text-primary'
          }`}
        >
          <Inbox size={13} className={activeTab === 'invitations' ? 'text-primary-lime' : 'text-text-tertiary'} />
          <span>
            <span className="inline sm:hidden">Invitations</span>
            <span className="hidden sm:inline">Invitations Received</span>
          </span>
          {pendingActionCount > 0 ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#F59E0B] text-white font-mono font-bold animate-pulse">
              {pendingActionCount} New
            </span>
          ) : (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              activeTab === 'invitations'
                ? 'bg-primary-lime/20 text-primary-lime'
                : 'bg-surface-raised border border-border-subtle text-text-tertiary'
            }`}>
              {receivedProposals.length}
            </span>
          )}
        </button>
      </div>

      {/* Main Grid & Responsive Cards */}
      {loading ? (
        <div className="py-16 sm:py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-3 border-primary-lime border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-text-tertiary">Loading match proposals...</span>
        </div>
      ) : !currentUser ? (
        <div className="bg-surface-card rounded-3xl p-6 sm:p-8 md:p-10 text-center border border-border-subtle max-w-md mx-auto space-y-4 shadow-sm">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-surface-raised border border-border-subtle flex items-center justify-center text-text-tertiary mx-auto">
            <Users size={28} className="text-text-secondary" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-text-primary">Sign In to Organize Games</h3>
            <p className="text-xs sm:text-sm text-text-secondary mt-1 max-w-xs mx-auto">
              Connect with players, create free match proposals, and gather attendance before reserving pitch slots.
            </p>
          </div>
          {onRequestLogin && (
            <button
              onClick={onRequestLogin}
              className="h-11 px-6 rounded-2xl bg-primary-lime text-accent-text text-xs sm:text-sm font-bold uppercase tracking-wider cursor-pointer active:scale-95 transition-all inline-flex items-center justify-center shadow-sm"
            >
              Sign In
            </button>
          )}
        </div>
      ) : displayedList.length === 0 ? (
        <div className="bg-surface-card rounded-3xl p-6 sm:p-8 md:p-10 text-center border border-border-subtle max-w-md mx-auto space-y-4 shadow-sm">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-surface-raised border border-border-subtle flex items-center justify-center text-text-tertiary mx-auto">
            <Users size={28} className="text-text-secondary" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-text-primary">
              {activeTab === 'created'
                ? "You haven't proposed any games yet"
                : activeTab === 'invitations'
                ? 'No invitations received'
                : 'No match proposals found'}
            </h3>
            <p className="text-xs sm:text-sm text-text-secondary mt-1 max-w-xs mx-auto">
              Start by proposing a match and inviting your squad to confirm attendance for free.
            </p>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="h-11 sm:h-12 px-6 rounded-2xl bg-primary-lime hover:bg-primary-lime-hover text-accent-text text-xs sm:text-sm font-black uppercase tracking-wider shadow-md transition-all cursor-pointer inline-flex items-center justify-center gap-2 active:scale-95"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Propose a Match</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 md:gap-5">
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
