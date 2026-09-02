import React from 'react';
import { Layout } from '../components/Layout';
import { MatchInvitationsHub } from '../components/invitations/MatchInvitationsHub';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { MatchInvitation, User } from '../types/firebase';

export const Invitations: React.FC = () => {
  const { user, userProfile } = useUser();
  const navigate = useNavigate();

  const currentUser: User | null = user
    ? {
        id: user.uid,
        email: user.email || '',
        name: userProfile?.name || user.displayName || 'Player',
        phone: userProfile?.phone || '',
        role: ((userProfile?.role as any)?.toUpperCase() || 'PLAYER') as 'PLAYER' | 'OWNER' | 'ADMIN' | 'CARETAKER',
        status: 'ACTIVE',
        photoURL: user.photoURL || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    : null;

  const handleBookProposal = (proposal: MatchInvitation) => {
    // Navigate directly to the booking checkout page with proposal details prefilled
    navigate(
      `/turf/${proposal.pitchId}/book?date=${proposal.date}&time=${proposal.time}&proposalId=${proposal.id}`
    );
  };

  return (
    <Layout>
      <div className="pb-24 pt-2">
        <MatchInvitationsHub
          currentUser={currentUser}
          onBookProposal={handleBookProposal}
          onRequestLogin={() => navigate('/auth')}
        />
      </div>
    </Layout>
  );
};

export default Invitations;
