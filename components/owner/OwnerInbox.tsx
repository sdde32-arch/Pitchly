import React, { useState, useEffect, useRef, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { chatService } from "../../services/chatService";
import { useUser } from "../../context/UserContext";
import { useChatUnread } from "../../context/ChatUnreadContext";
import { Conversation, Message } from "../../types/firebase";
import { FEATURES } from "../../config/features";
import {
  getOtherParticipant,
  getChatTitle,
  getChatSubtitle,
  formatConversationTime,
  getMessageDayKey,
  formatDaySeparator,
} from "../chat/chatLabels";
import {
  MessageSquare,
  Send,
  User,
  Search,
  Loader2,
  Building2,
  ArrowLeft,
} from "lucide-react";

const OWNER_QUICK_REPLIES = [
  "Yes, that time is free.",
  "Sorry, that time is not available.",
  "Please send your payment proof so I can confirm your booking.",
];

export const OwnerInbox: React.FC = () => {
  const location = useLocation();
  const { user, userProfile } = useUser();
  const { unreadConvIds, markRead } = useChatUnread();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [convRetryCount, setConvRetryCount] = useState(0);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messagesError, setMessagesError] = useState(false);
  const [msgRetryCount, setMsgRetryCount] = useState(0);
  const [newMessageText, setNewMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [failedAvatars, setFailedAvatars] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const appliedConvParamRef = useRef<string | null>(null);

  const requestedConvId = new URLSearchParams(location.search).get("conv");

  // Subscribe to conversations
  useEffect(() => {
    if (!user?.uid) {
      setConversations([]);
      setLoadError(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(false);

    try {
      const unsubscribe = chatService.subscribeToUserConversations(
        user.uid,
        (convs) => {
          setConversations(convs || []);
          setLoadError(false);
          setLoading(false);
        },
        () => {
          setLoadError(true);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.error("Failed to subscribe to conversations:", err);
      setLoadError(true);
      setLoading(false);
    }
  }, [user?.uid, convRetryCount]);

  const visibleConversations = useMemo(
    () => conversations.filter((c) => FEATURES.squads || c.type !== "TEAM"),
    [conversations]
  );

  // Select ?conv=ID when present in the list (works on all viewport widths)
  useEffect(() => {
    if (
      requestedConvId &&
      appliedConvParamRef.current !== requestedConvId &&
      visibleConversations.some((c) => c.id === requestedConvId)
    ) {
      appliedConvParamRef.current = requestedConvId;
      setSelectedConvId(requestedConvId);
    }
  }, [visibleConversations, requestedConvId]);

  // Auto-select first conversation on desktop viewports only; never snap mobile back out of the list
  useEffect(() => {
    const isDesktop =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(min-width: 768px)").matches;
    if (!isDesktop) return;
    if (
      requestedConvId &&
      visibleConversations.some((c) => c.id === requestedConvId)
    ) {
      return;
    }
    if (!selectedConvId && visibleConversations.length > 0) {
      setSelectedConvId(visibleConversations[0].id);
    }
  }, [visibleConversations, selectedConvId, requestedConvId]);

  // Subscribe to messages of selected conversation
  useEffect(() => {
    setSendError(null);
    if (!selectedConvId) {
      setMessages([]);
      setMessagesError(false);
      setLoadingMessages(false);
      return;
    }

    void markRead(selectedConvId);
    setLoadingMessages(true);
    setMessagesError(false);

    try {
      const unsubscribe = chatService.subscribeToMessages(
        selectedConvId,
        (msgs) => {
          setMessages(msgs || []);
          setMessagesError(false);
          setLoadingMessages(false);
          void markRead(selectedConvId);
        },
        () => {
          setMessagesError(true);
          setLoadingMessages(false);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.error("Failed to subscribe to messages:", err);
      setMessagesError(true);
      setLoadingMessages(false);
    }
  }, [selectedConvId, msgRetryCount, markRead]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSending || !newMessageText.trim() || !selectedConvId || !user?.uid) return;

    const textToSend = newMessageText.trim();
    setSendError(null);
    setIsSending(true);
    setNewMessageText("");

    const senderId = user.uid;
    const senderName = userProfile?.name || user.displayName || "Pitch Owner";
    const senderAvatar = userProfile?.avatar || user.photoURL || undefined;
    const nowIso = new Date().toISOString();

    const tempId = `temp_${Date.now()}`;
    const tempMsg: Message = {
      id: tempId,
      conversationId: selectedConvId,
      senderId,
      senderName,
      senderAvatar,
      text: textToSend,
      createdAt: nowIso,
    };

    const prevConvSnapshot = conversations.find((c) => c.id === selectedConvId);

    setMessages((prev) => [...prev, tempMsg]);
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConvId
          ? {
              ...c,
              lastMessage: textToSend,
              lastMessageAt: nowIso,
              updatedAt: nowIso,
            }
          : c
      )
    );

    try {
      await chatService.sendMessage(
        selectedConvId,
        senderId,
        textToSend,
        senderName,
        senderAvatar
      );
      void markRead(selectedConvId);
    } catch (err) {
      console.error("Failed to send message:", err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      if (prevConvSnapshot) {
        setConversations((prev) =>
          prev.map((c) => (c.id === selectedConvId ? prevConvSnapshot : c))
        );
      }
      setNewMessageText(textToSend);
      setSendError("Message not sent. Tap Send to try again.");
    } finally {
      setIsSending(false);
    }
  };

  const filteredConversations = visibleConversations.filter((c) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const title = getChatTitle(c, user?.uid, "owner").toLowerCase();
    const turf = (c.turfName || "").toLowerCase();
    const lastMsg = (c.lastMessage || "").toLowerCase();
    return title.includes(q) || turf.includes(q) || lastMsg.includes(q);
  });

  const activeConversation = visibleConversations.find(
    (c) => c.id === selectedConvId
  );
  const activeParticipant = activeConversation
    ? getOtherParticipant(activeConversation, user?.uid, "owner")
    : null;
  const activeTitle = activeConversation
    ? getChatTitle(activeConversation, user?.uid, "owner")
    : "";
  const activeSubtitle = activeConversation
    ? getChatSubtitle(activeConversation)
    : "";

  return (
    <div className="bg-surface-card border border-border-subtle rounded-2xl overflow-hidden shadow-sm flex flex-col md:flex-row h-[calc(100dvh-14rem)] min-h-[420px] font-sans">
      {/* LEFT: Conversation List */}
      <div
        className={`w-full md:w-80 lg:w-96 border-r border-border-subtle flex flex-col bg-surface-card shrink-0 min-h-0 ${
          selectedConvId ? "hidden md:flex" : "flex"
        }`}
      >
        {/* Search & Header */}
        <div className="p-3.5 border-b border-border-subtle bg-surface-raised space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-surface-card border border-border-subtle text-text-primary flex items-center justify-center font-bold">
                <MessageSquare size={14} />
              </div>
              <h2 className="text-sm font-extrabold text-text-primary">
                Player Inquiries
              </h2>
            </div>
            <span className="text-[11px] font-bold text-text-secondary bg-surface-card px-2.5 py-0.5 rounded-full border border-border-subtle">
              {visibleConversations.length}
            </span>
          </div>

          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
            />
            <input
              type="text"
              placeholder="Search players or pitches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-h-[44px] pl-9 pr-3 py-2 bg-surface-card border border-border-subtle rounded-xl text-xs text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-border-prominent transition-all"
            />
          </div>
        </div>

        {/* Conversation Items */}
        <div className="flex-1 overflow-y-auto divide-y divide-border-subtle">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2">
              <Loader2 size={20} className="animate-spin text-text-secondary" />
              <span className="text-xs text-text-secondary">
                Loading player messages...
              </span>
            </div>
          ) : loadError ? (
            <div className="p-4">
              <div className="bg-status-error-tint border border-status-error rounded-xl p-4 text-center space-y-3">
                <p className="text-xs font-semibold text-status-error">
                  Messages could not load. Check your connection and try again.
                </p>
                <button
                  type="button"
                  onClick={() => setConvRetryCount((c) => c + 1)}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-cta-bg hover:bg-cta-bg-hover text-cta-text font-bold text-xs transition-colors cursor-pointer"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-text-secondary text-xs">
              {visibleConversations.length === 0
                ? "No messages yet"
                : "No conversations found matching your search."}
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = conv.id === selectedConvId;
              const other = getOtherParticipant(conv, user?.uid, "owner");
              const displayName = getChatTitle(conv, user?.uid, "owner");
              const subtitle = getChatSubtitle(conv);
              const timeDisplay = formatConversationTime(conv.lastMessageAt);
              const showAvatar = Boolean(other.avatar) && !failedAvatars[conv.id];
              const isUnread = unreadConvIds.has(conv.id);

              return (
                <button
                  key={conv.id}
                  type="button"
                  aria-label={isUnread ? `${displayName}, unread` : undefined}
                  onClick={() => setSelectedConvId(conv.id)}
                  className={`w-full min-h-[44px] text-left p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-surface-raised border-l-4 border-l-cta-bg"
                      : "hover:bg-surface-raised"
                  }`}
                >
                  <div className="shrink-0">
                    {showAvatar ? (
                      <img
                        src={other.avatar}
                        alt={displayName}
                        className="w-10 h-10 rounded-full object-cover border border-border-subtle"
                        onError={() =>
                          setFailedAvatars((prev) => ({ ...prev, [conv.id]: true }))
                        }
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-surface-raised border border-border-subtle flex items-center justify-center text-text-secondary">
                        <User size={18} />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className="text-xs font-bold text-text-primary truncate">
                        {displayName}
                      </p>
                      {(isUnread || timeDisplay) && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isUnread && (
                            <span
                              aria-hidden="true"
                              className="w-2.5 h-2.5 rounded-full bg-[#B91C1C] shrink-0"
                            />
                          )}
                          {timeDisplay && (
                            <span className="text-[11px] text-text-secondary font-medium">
                              {timeDisplay}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {subtitle && (
                      <p className="text-[11px] font-semibold text-text-secondary truncate mb-0.5">
                        {subtitle}
                      </p>
                    )}

                    <p
                      className={`text-xs line-clamp-1 leading-snug ${
                        isUnread
                          ? "text-text-primary font-semibold"
                          : "text-text-secondary"
                      }`}
                    >
                      {conv.lastMessage || "No messages yet"}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT: Active Chat Room */}
      <div
        className={`flex-1 flex flex-col bg-surface-card min-w-0 min-h-0 ${
          !selectedConvId ? "hidden md:flex" : "flex"
        }`}
      >
        {activeConversation ? (
          <>
            {/* Chat Room Header */}
            <div className="p-3.5 border-b border-border-subtle bg-surface-raised flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setSelectedConvId(null)}
                  className="md:hidden w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-surface-card border border-border-subtle text-text-primary hover:bg-border-subtle transition-all shrink-0 cursor-pointer"
                  title="Back to conversations"
                  aria-label="Back to conversations"
                >
                  <ArrowLeft size={18} />
                </button>

                <div className="shrink-0">
                  {activeParticipant?.avatar &&
                  !failedAvatars[activeConversation.id] ? (
                    <img
                      src={activeParticipant.avatar}
                      alt={activeTitle}
                      className="w-10 h-10 rounded-full object-cover border border-border-subtle"
                      onError={() =>
                        setFailedAvatars((prev) => ({
                          ...prev,
                          [activeConversation.id]: true,
                        }))
                      }
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-surface-card border border-border-subtle flex items-center justify-center text-text-secondary">
                      <User size={18} />
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-extrabold text-text-primary truncate">
                      {activeTitle}
                    </h3>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-status-success-tint text-status-success uppercase shrink-0">
                      Player
                    </span>
                  </div>
                  {activeSubtitle && (
                    <p className="text-xs text-text-secondary truncate flex items-center gap-1 mt-0.5">
                      <Building2 size={12} className="shrink-0" />
                      <span>{activeSubtitle}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Context Strip */}
            <div className="px-4 py-2 bg-surface-card border-b border-border-subtle flex items-center justify-between text-xs text-text-secondary">
              <span>Messages from players about your pitch arrive here.</span>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-app-base">
              {loadingMessages ? (
                <div className="flex flex-col items-center justify-center h-48 gap-2">
                  <Loader2 size={20} className="animate-spin text-text-secondary" />
                  <span className="text-xs text-text-secondary">
                    Loading conversation...
                  </span>
                </div>
              ) : messagesError ? (
                <div className="my-8 max-w-sm mx-auto bg-status-error-tint border border-status-error rounded-xl p-4 text-center space-y-3">
                  <p className="text-xs font-semibold text-status-error">
                    Messages could not load. Check your connection and try again.
                  </p>
                  <button
                    type="button"
                    onClick={() => setMsgRetryCount((c) => c + 1)}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-cta-bg hover:bg-cta-bg-hover text-cta-text font-bold text-xs transition-colors cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              ) : messages.length === 0 ? (
                <div className="py-16 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-surface-raised flex items-center justify-center text-text-secondary mx-auto">
                    <MessageSquare size={20} />
                  </div>
                  <p className="text-xs font-bold text-text-primary">
                    No messages yet
                  </p>
                  <p className="text-[11px] text-text-secondary max-w-xs mx-auto">
                    Reply to start chatting with {activeTitle}.
                  </p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isMe = msg.senderId === user?.uid;
                  const dayKey = getMessageDayKey(msg.createdAt);
                  const prevDayKey =
                    index > 0 ? getMessageDayKey(messages[index - 1].createdAt) : "";
                  const showDaySeparator = Boolean(dayKey) && dayKey !== prevDayKey;
                  const dayLabel = showDaySeparator
                    ? formatDaySeparator(msg.createdAt)
                    : "";

                  return (
                    <React.Fragment key={msg.id}>
                      {showDaySeparator && dayLabel && (
                        <div className="flex justify-center py-1">
                          <span className="px-3 py-1 rounded-full bg-surface-raised border border-border-subtle text-text-secondary text-[11px] font-semibold">
                            {dayLabel}
                          </span>
                        </div>
                      )}
                      <div
                        className={`flex flex-col ${
                          isMe ? "items-end" : "items-start"
                        }`}
                      >
                        <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[70%]">
                          {!isMe && (
                            <div className="w-6 h-6 rounded-full bg-surface-raised border border-border-subtle flex items-center justify-center text-[10px] font-bold text-text-secondary shrink-0 mb-1">
                              {(msg.senderName || activeTitle).charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div
                            className={`rounded-2xl px-4 py-2.5 text-xs shadow-xs leading-relaxed ${
                              isMe
                                ? "bg-cta-bg text-cta-text font-medium rounded-br-sm"
                                : "bg-surface-card border border-border-subtle text-text-primary rounded-bl-sm"
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">
                              {msg.text}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] text-text-secondary font-mono mt-1 px-1">
                          {msg.createdAt
                            ? new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </span>
                      </div>
                    </React.Fragment>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Response Chips */}
            <div className="px-4 py-2 bg-surface-card border-t border-border-subtle flex items-center gap-2 overflow-x-auto no-scrollbar">
              {OWNER_QUICK_REPLIES.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    setNewMessageText(chip);
                    if (sendError) setSendError(null);
                  }}
                  className="min-h-[44px] px-3 py-2 rounded-xl bg-surface-raised hover:bg-border-subtle border border-border-subtle text-xs font-medium text-text-secondary hover:text-text-primary whitespace-nowrap transition-colors cursor-pointer shrink-0"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div
              className="px-3 pt-3 border-t border-border-subtle bg-surface-raised space-y-2"
              style={{
                paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
              }}
            >
              {sendError && (
                <p
                  role="alert"
                  className="text-xs font-semibold text-status-error bg-status-error-tint border border-status-error rounded-xl px-3 py-2"
                >
                  {sendError}
                </p>
              )}
              <form
                onSubmit={handleSendMessage}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  maxLength={2000}
                  placeholder={`Reply to ${activeTitle}...`}
                  value={newMessageText}
                  onChange={(e) => {
                    setNewMessageText(e.target.value);
                    if (sendError) setSendError(null);
                  }}
                  className="flex-1 min-h-[44px] px-4 py-2.5 bg-surface-card border border-border-subtle rounded-xl text-xs text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-border-prominent transition-all"
                />
                <button
                  type="submit"
                  disabled={isSending || !newMessageText.trim()}
                  className="min-h-[44px] px-4 bg-cta-bg hover:bg-cta-bg-hover disabled:opacity-40 text-cta-text font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer active:scale-95 shrink-0"
                >
                  <span>Send</span>
                  <Send size={13} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-text-secondary">
            <MessageSquare size={36} className="mb-2 text-border-prominent" />
            <p className="text-sm font-bold text-text-primary">
              {visibleConversations.length === 0
                ? "No messages yet"
                : "Select an inquiry to view messages"}
            </p>
            <p className="text-xs text-text-secondary max-w-xs mt-1">
              {visibleConversations.length === 0
                ? "When players message you about bookings or pitches, they will appear here."
                : "Choose a conversation from the left to read and reply to players."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
