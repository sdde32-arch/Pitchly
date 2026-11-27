import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useUser } from '../context/UserContext';
import { useChatUnread } from '../context/ChatUnreadContext';
import { chatService } from '../services/chatService';
import { Conversation } from '../types/firebase';
import { useNavigate } from 'react-router-dom';
import { Search, Users, User as UserIcon, MessageSquare } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';
import { ChatListSkeleton } from '../components/ui/Skeleton';
import { FEATURES } from '../config/features';
import {
  getOtherParticipant,
  getChatTitle,
  getChatSubtitle,
  formatConversationTime,
} from '../components/chat/chatLabels';

export const ChatList: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile, loading: authLoading } = useUser();
  const { unreadConvIds } = useChatUnread();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [failedAvatars, setFailedAvatars] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (authLoading) return;

    if (!userProfile?.id) {
      setConversations([]);
      setLoadError(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(false);

    const unsubscribe = chatService.subscribeToUserConversations(
      userProfile.id,
      (convs) => {
        setConversations(convs);
        setLoadError(false);
        setLoading(false);
      },
      () => {
        setLoadError(true);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [userProfile?.id, authLoading, retryCount]);

  const filteredConvs = conversations.filter((c) => {
    if (!FEATURES.squads && c.type === 'TEAM') return false;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const title = getChatTitle(c, userProfile?.id, 'player').toLowerCase();
    const pitchName = (c.turfName || '').toLowerCase();
    const lastMessage = (c.lastMessage || '').toLowerCase();
    return title.includes(q) || pitchName.includes(q) || lastMessage.includes(q);
  });

  return (
    <Layout>
      <div className="min-h-full bg-app-base font-body text-text-primary pb-24">
        <div className="max-w-xl mx-auto p-4">
          <div className="flex items-center gap-3 mb-6">
            <h1 className="text-[24px] font-black tracking-tight">Messages</h1>
            {filteredConvs.length > 0 && (
              <span className="bg-cta-bg text-cta-text text-[12px] font-bold px-2.5 py-0.5 rounded-full">
                {filteredConvs.length}
              </span>
            )}
          </div>

          <div className="bg-surface-card rounded-full px-4 py-3.5 flex items-center gap-3 border border-border-subtle shadow-sm mb-6 focus-within:ring-2 focus-within:ring-border-prominent transition-shadow">
            <Search size={18} className="text-text-secondary shrink-0" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-[14px] text-text-primary placeholder:text-text-secondary"
            />
          </div>

          {loading ? (
            <ChatListSkeleton />
          ) : loadError ? (
            <div className="bg-status-error-tint border border-status-error rounded-2xl p-5 text-center space-y-4">
              <p className="text-[14px] font-semibold text-status-error">
                Messages could not load. Check your connection and try again.
              </p>
              <button
                type="button"
                onClick={() => setRetryCount((c) => c + 1)}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-cta-bg hover:bg-cta-bg-hover text-cta-text font-bold text-[14px] transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : filteredConvs.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No Messages Yet"
              description={
                FEATURES.squads
                  ? "Your inbox is empty. Search for teams or view other player profiles to initiate a chat!"
                  : "Your inbox is empty. Message a pitch owner from any pitch or booking to ask about availability and payments."
              }
              actionText={FEATURES.squads ? "Explore Teams" : "Browse pitches"}
              onAction={() => navigate(FEATURES.squads ? "/teams" : "/home")}
              actionVariant="primary"
              className="my-4"
            />
          ) : (
            <div className="flex flex-col gap-3">
              {filteredConvs.map((conv) => {
                const other = getOtherParticipant(conv, userProfile?.id, 'player');
                const title = getChatTitle(conv, userProfile?.id, 'player');
                const subtitle = getChatSubtitle(conv);
                const timestamp = formatConversationTime(conv.lastMessageAt);
                const showAvatarImg =
                  conv.type !== 'TEAM' && Boolean(other.avatar) && !failedAvatars[conv.id];
                const isUnread = unreadConvIds.has(conv.id);

                return (
                  <button
                    key={conv.id}
                    type="button"
                    aria-label={isUnread ? `${title}, unread` : undefined}
                    onClick={() => navigate(`/chat/${conv.id}`)}
                    className="min-h-[44px] bg-surface-card rounded-2xl p-4 flex items-center gap-4 border border-border-subtle shadow-sm active:scale-[0.98] transition-all text-left hover:border-border-prominent group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-prominent cursor-pointer"
                  >
                    <div className="w-14 h-14 rounded-full bg-surface-raised flex items-center justify-center shrink-0 border border-border-subtle text-text-secondary overflow-hidden">
                      {conv.type === 'TEAM' ? (
                        <Users size={22} />
                      ) : showAvatarImg ? (
                        <img
                          src={other.avatar}
                          alt={title}
                          className="w-full h-full object-cover"
                          onError={() =>
                            setFailedAvatars((prev) => ({ ...prev, [conv.id]: true }))
                          }
                        />
                      ) : (
                        <UserIcon size={22} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center gap-2 mb-0.5">
                        <h3 className="font-bold text-[15px] text-text-primary truncate">
                          {title}
                        </h3>
                        {(isUnread || timestamp) && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isUnread && (
                              <span
                                aria-hidden="true"
                                className="w-2.5 h-2.5 rounded-full bg-[#B91C1C] shrink-0"
                              />
                            )}
                            {timestamp && (
                              <span className="text-[11px] font-semibold text-text-secondary">
                                {timestamp}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {subtitle && (
                        <p className="text-[12px] font-semibold text-text-secondary truncate mb-0.5">
                          {subtitle}
                        </p>
                      )}
                      <p
                        className={`text-[13px] truncate ${
                          isUnread
                            ? 'font-semibold text-text-primary'
                            : 'font-medium text-text-secondary'
                        }`}
                      >
                        {conv.lastMessage || 'No messages yet'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
