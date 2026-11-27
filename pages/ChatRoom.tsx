import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useChatUnread } from '../context/ChatUnreadContext';
import { chatService } from '../services/chatService';
import { Message, Conversation } from '../types/firebase';
import { ArrowLeft, Send, Users, User as UserIcon } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { FEATURES } from '../config/features';
import {
  getOtherParticipant,
  getChatTitle,
  getChatSubtitle,
  getMessageDayKey,
  formatDaySeparator,
} from '../components/chat/chatLabels';

export const ChatRoom: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, userProfile } = useUser();
  const { markRead } = useChatUnread();

  const myUid = userProfile?.id || user?.uid;

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [notFoundOrError, setNotFoundOrError] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAvatarFailed(false);
    setSendError(null);

    if (!id) {
      setNotFoundOrError(true);
      setLoading(false);
      return;
    }

    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    setLoading(true);
    setNotFoundOrError(false);

    const initChat = async () => {
      try {
        const docRef = doc(db, 'conversations', id);
        const docSnap = await getDoc(docRef);
        if (cancelled) return;

        if (!docSnap.exists()) {
          setConversation(null);
          setNotFoundOrError(true);
          setLoading(false);
          return;
        }

        const conv = { id: docSnap.id, ...docSnap.data() } as Conversation;
        if (!FEATURES.squads && conv.type === 'TEAM') {
          navigate('/chat', { replace: true });
          return;
        }
        setConversation(conv);
        void markRead(id);

        unsubscribe = chatService.subscribeToMessages(
          id,
          (msgs) => {
            if (cancelled) return;
            setMessages(msgs);
            setLoading(false);
            void markRead(id);
            setTimeout(() => scrollToBottom(), 100);
          },
          () => {
            if (cancelled) return;
            setNotFoundOrError(true);
            setLoading(false);
          }
        );
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to open conversation:', err);
        setConversation(null);
        setNotFoundOrError(true);
        setLoading(false);
      }
    };

    initChat();

    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, [id, navigate, markRead]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSending || !newMessage.trim() || !myUid || !id) return;

    const text = newMessage.trim();
    setSendError(null);
    setIsSending(true);
    setNewMessage('');

    try {
      await chatService.sendMessage(
        id,
        myUid,
        text,
        userProfile?.name || user?.displayName || 'Player',
        userProfile?.avatar || user?.photoURL || ''
      );
      void markRead(id);
      scrollToBottom();
    } catch (err) {
      console.error('Failed to send message:', err);
      setNewMessage(text);
      setSendError('Message not sent. Tap Send to try again.');
    } finally {
      setIsSending(false);
    }
  };

  const otherParticipant = conversation
    ? getOtherParticipant(conversation, myUid, 'player')
    : null;
  const headerTitle = conversation
    ? getChatTitle(conversation, myUid, 'player')
    : notFoundOrError
    ? 'Messages'
    : 'Loading...';
  const headerSubtitle = conversation
    ? conversation.type === 'TEAM'
      ? 'Team Chat'
      : getChatSubtitle(conversation)
    : '';
  const showHeaderAvatar =
    conversation?.type !== 'TEAM' &&
    Boolean(otherParticipant?.avatar) &&
    !avatarFailed;

  return (
    <div className="flex flex-col h-[100dvh] bg-app-base font-body max-w-xl mx-auto border-x border-border-subtle relative shadow-xl">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3 bg-surface-card border-b border-border-subtle sticky top-0 z-50 shadow-sm">
        <button
          type="button"
          onClick={() => {
            navigate('/chat');
          }}
          className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-surface-raised text-text-secondary hover:bg-border-subtle transition-colors cursor-pointer shrink-0"
          title="Go back"
          aria-label="Go back to chat list"
        >
          <ArrowLeft size={20} strokeWidth={2.5} />
        </button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full bg-surface-raised flex items-center justify-center shrink-0 border border-border-subtle text-text-secondary overflow-hidden">
            {conversation?.type === 'TEAM' ? (
              <Users size={18} />
            ) : showHeaderAvatar && otherParticipant ? (
              <img
                src={otherParticipant.avatar}
                alt={headerTitle}
                className="w-full h-full object-cover"
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              <UserIcon size={18} />
            )}
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-text-primary text-[15px] truncate">
              {headerTitle}
            </h1>
            {headerSubtitle && (
              <p className="text-[12px] text-text-secondary font-medium truncate mt-0.5">
                {headerSubtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {notFoundOrError ? (
          <div className="mt-10 p-6 bg-status-error-tint border border-status-error rounded-2xl text-center space-y-4">
            <p className="text-[14px] font-semibold text-status-error">
              This conversation could not be opened.
            </p>
            <button
              type="button"
              onClick={() => navigate('/chat')}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-cta-bg hover:bg-cta-bg-hover text-cta-text font-bold text-[14px] transition-colors cursor-pointer"
            >
              Back to messages
            </button>
          </div>
        ) : loading ? (
          <div className="text-center text-text-secondary text-[13px] font-medium py-10">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-text-secondary text-[13px] font-medium mt-10 p-4 bg-surface-card rounded-[16px] border border-border-subtle shadow-sm">
            No messages yet. Say hello!
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.senderId === myUid;
            const showName = !isMe && conversation?.type !== 'DIRECT';
            const dayKey = getMessageDayKey(msg.createdAt);
            const prevDayKey = index > 0 ? getMessageDayKey(messages[index - 1].createdAt) : '';
            const showDaySeparator = Boolean(dayKey) && dayKey !== prevDayKey;
            const dayLabel = showDaySeparator ? formatDaySeparator(msg.createdAt) : '';

            return (
              <React.Fragment key={msg.id}>
                {showDaySeparator && dayLabel && (
                  <div className="flex justify-center py-1">
                    <span className="px-3 py-1 rounded-full bg-surface-raised border border-border-subtle text-text-secondary text-[11px] font-semibold">
                      {dayLabel}
                    </span>
                  </div>
                )}
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {showName && (
                    <span className="text-[11px] text-text-secondary ml-2 mb-1 font-bold">
                      {msg.senderName || 'Player'}
                    </span>
                  )}
                  <div
                    className={`max-w-[78%] rounded-[20px] px-4 py-2.5 text-[14px] shadow-sm font-medium whitespace-pre-wrap break-words ${
                      isMe
                        ? 'bg-cta-bg text-cta-text rounded-tr-sm'
                        : 'bg-surface-card border border-border-subtle text-text-primary rounded-tl-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-text-secondary mt-1 mx-1 font-semibold">
                    {msg.createdAt
                      ? new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : ''}
                  </span>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* Input */}
      {!notFoundOrError && (
        <div
          className="px-4 pt-3 bg-surface-card border-t border-border-subtle space-y-2"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          {sendError && (
            <p
              role="alert"
              className="text-[12px] font-semibold text-status-error bg-status-error-tint border border-status-error rounded-xl px-3 py-2"
            >
              {sendError}
            </p>
          )}
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input
              type="text"
              value={newMessage}
              maxLength={2000}
              onChange={(e) => {
                setNewMessage(e.target.value);
                if (sendError) setSendError(null);
              }}
              placeholder="Type a message..."
              className="flex-1 min-h-[44px] bg-surface-raised border border-border-subtle rounded-full px-4 py-2.5 text-[14px] font-medium text-text-primary placeholder:text-text-secondary outline-none focus:border-border-prominent focus:ring-1 focus:ring-border-prominent transition-all"
            />
            <button
              type="submit"
              aria-label="Send message"
              disabled={isSending || !newMessage.trim()}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-cta-bg hover:bg-cta-bg-hover text-cta-text flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-transform active:scale-95 cursor-pointer"
            >
              <Send size={16} className="ml-0.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
