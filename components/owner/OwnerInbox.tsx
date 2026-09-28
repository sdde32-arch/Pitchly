import React, { useState, useEffect, useRef } from "react";
import { chatService } from "../../services/chatService";
import { useUser } from "../../context/UserContext";
import { Conversation, Message } from "../../types/firebase";
import {
  MessageSquare,
  Send,
  User,
  Clock,
  Phone,
  CheckCircle2,
  Search,
  Sparkles,
  Loader2,
  Calendar,
  Building2,
  ArrowLeft
} from "lucide-react";
import { formatBookingDate } from "../../lib/dateUtils";

export const OwnerInbox: React.FC = () => {
  const { user, userProfile } = useUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessageText, setNewMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fallback mock conversations if user is offline or has no messages yet
  const defaultMockConvs: Conversation[] = [
    {
      id: "conv_mock_1",
      participants: [user?.uid || "current_owner", "player_salim_barde"],
      type: "DIRECT",
      name: "Salim Barde",
      lastMessage: "Hi, is the pitch available for night lighting? We want to play at 19:00.",
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      turfName: "Area Arena",
      playerName: "Salim Barde",
      playerPhone: "+256 701 448 992",
      playerAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"
    } as any,
    {
      id: "conv_mock_2",
      participants: [user?.uid || "current_owner", "player_david_okello"],
      type: "DIRECT",
      name: "David Okello",
      lastMessage: "Thanks for confirming our booking! Do you have training bibs on site?",
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      turfName: "The Regent's Park",
      playerName: "David Okello",
      playerPhone: "+256 772 334 112",
      playerAvatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80"
    } as any,
    {
      id: "conv_mock_3",
      participants: [user?.uid || "current_owner", "player_sarah_namukasa"],
      type: "DIRECT",
      name: "Sarah Namukasa",
      lastMessage: "Can we extend our slot by 30 minutes if nobody is booked after us?",
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      turfName: "Kinetic Sports Arena",
      playerName: "Sarah Namukasa",
      playerPhone: "+256 789 123 456",
      playerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"
    } as any
  ];

  // Subscribe to real-time conversations
  useEffect(() => {
    if (!user?.uid) {
      setConversations(defaultMockConvs);
      setLoading(false);
      return;
    }

    try {
      const unsubscribe = chatService.subscribeToUserConversations(user.uid, (convs) => {
        if (convs && convs.length > 0) {
          setConversations(convs);
        } else {
          setConversations(defaultMockConvs);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } catch (err) {
      console.warn("Failed to subscribe to conversations, using local fallback", err);
      setConversations(defaultMockConvs);
      setLoading(false);
    }
  }, [user?.uid]);

  // Set default selected conversation
  useEffect(() => {
    if (!selectedConvId && conversations.length > 0) {
      setSelectedConvId(conversations[0].id);
    }
  }, [conversations, selectedConvId]);

  // Subscribe to messages of selected conversation
  useEffect(() => {
    if (!selectedConvId) return;
    setLoadingMessages(true);

    // If it's a mock conversation, provide realistic mock messages
    if (selectedConvId.startsWith("conv_mock_")) {
      const active = conversations.find(c => c.id === selectedConvId) as any;
      const mockMsgs: Message[] = [
        {
          id: "m_1",
          conversationId: selectedConvId,
          senderId: active?.playerName === "Salim Barde" ? "player_salim_barde" : "player_david",
          senderName: active?.playerName || "Player",
          senderAvatar: active?.playerAvatar,
          text: `Hello! Inquiring regarding pitch availability at ${active?.turfName || "your sports facility"}.`,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString()
        } as any,
        {
          id: "m_2",
          conversationId: selectedConvId,
          senderId: user?.uid || "current_owner",
          senderName: userProfile?.name || "Facility Host",
          text: `Hello ${active?.playerName || "there"}! Yes, we have our floodlit 7-a-side pitch open. How can we help?`,
          createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString()
        } as any,
        {
          id: "m_3",
          conversationId: selectedConvId,
          senderId: active?.playerName === "Salim Barde" ? "player_salim_barde" : "player_david",
          senderName: active?.playerName || "Player",
          senderAvatar: active?.playerAvatar,
          text: active?.lastMessage || "Is the pitch available for night lighting?",
          createdAt: active?.lastMessageTime || new Date(Date.now() - 1000 * 60 * 18).toISOString()
        } as any
      ];
      setMessages(mockMsgs);
      setLoadingMessages(false);
      return;
    }

    try {
      const unsubscribe = chatService.subscribeToMessages(selectedConvId, (msgs) => {
        setMessages(msgs);
        setLoadingMessages(false);
      });
      return () => unsubscribe();
    } catch (err) {
      console.warn("Failed to subscribe to messages", err);
      setLoadingMessages(false);
    }
  }, [selectedConvId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessageText.trim() || !selectedConvId) return;

    const textToSend = newMessageText.trim();
    setNewMessageText("");

    const activeConv = conversations.find(c => c.id === selectedConvId) as any;
    const senderId = user?.uid || "owner";
    const senderName = userProfile?.name || "Pitch Owner";
    const senderAvatar = userProfile?.avatar || user?.photoURL || undefined;

    // Optimistic message update
    const tempMsg: Message = {
      id: `temp_${Date.now()}`,
      conversationId: selectedConvId,
      senderId,
      senderName,
      senderAvatar,
      text: textToSend,
      createdAt: new Date().toISOString()
    } as any;

    setMessages(prev => [...prev, tempMsg]);

    // Update conversation snippet in list
    setConversations(prev => prev.map(c => {
      if (c.id === selectedConvId) {
        return {
          ...c,
          lastMessage: textToSend,
          lastMessageTime: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      return c;
    }));

    try {
      if (!selectedConvId.startsWith("conv_mock_")) {
        await chatService.sendMessage(selectedConvId, senderId, textToSend, senderName, senderAvatar);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const filteredConversations = conversations.filter(c => {
    const raw = c as any;
    const name = (raw.playerName || raw.name || "").toLowerCase();
    const turf = (raw.turfName || "").toLowerCase();
    const lastMsg = (c.lastMessage || "").toLowerCase();
    const q = searchQuery.toLowerCase();
    return name.includes(q) || turf.includes(q) || lastMsg.includes(q);
  });

  const activeConversation = conversations.find(c => c.id === selectedConvId) as any;

  return (
    <div className="bg-surface-card border border-border-subtle rounded-2xl overflow-hidden shadow-sm flex flex-col md:flex-row h-[720px] font-sans">
      {/* LEFT: Conversation List */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-border-subtle flex flex-col bg-surface-card shrink-0 ${
        selectedConvId && "hidden md:flex"
      }`}>
        {/* Search & Header */}
        <div className="p-3.5 border-b border-border-subtle bg-surface-raised/40 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary-lime/15 text-primary-lime flex items-center justify-center font-bold">
                <MessageSquare size={14} />
              </div>
              <h2 className="text-sm font-extrabold text-text-primary">Player Inquiries</h2>
            </div>
            <span className="text-[10px] font-bold text-primary-lime bg-primary-lime/10 px-2 py-0.5 rounded-full border border-primary-lime/20">
              {conversations.length} Active
            </span>
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search players or pitches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-surface-raised border border-border-subtle rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary-lime transition-all"
            />
          </div>
        </div>

        {/* Conversation Items */}
        <div className="flex-1 overflow-y-auto divide-y divide-border-subtle/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2">
              <Loader2 size={20} className="animate-spin text-primary-lime" />
              <span className="text-xs text-text-secondary">Loading player messages...</span>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-text-tertiary text-xs">
              No conversations found matching your search.
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const raw = conv as any;
              const isSelected = conv.id === selectedConvId;
              const displayName = raw.playerName || raw.name || "Player";
              const turf = raw.turfName || "Sports Arena";
              const timeDisplay = raw.lastMessageTime
                ? new Date(raw.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : "";

              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConvId(conv.id)}
                  className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-primary-lime/10 border-l-4 border-l-primary-lime"
                      : "hover:bg-surface-raised"
                  }`}
                >
                  <div className="relative shrink-0">
                    {raw.playerAvatar ? (
                      <img
                        src={raw.playerAvatar}
                        alt={displayName}
                        className="w-10 h-10 rounded-full object-cover border border-border-subtle"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-surface-raised border border-border-subtle flex items-center justify-center text-text-secondary">
                        <User size={18} />
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#22C55E] rounded-full border-2 border-surface-card" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className="text-xs font-bold text-text-primary truncate">
                        {displayName}
                      </p>
                      <span className="text-[10px] text-text-tertiary font-medium shrink-0">
                        {timeDisplay}
                      </span>
                    </div>

                    <p className="text-[10px] font-bold text-primary-lime truncate mb-1">
                      📍 {turf}
                    </p>

                    <p className="text-xs text-text-secondary line-clamp-1 leading-snug">
                      {conv.lastMessage || "Started a new inquiry..."}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT: Active Chat Room */}
      <div className={`flex-1 flex flex-col bg-surface-card min-w-0 ${
        !selectedConvId && "hidden md:flex"
      }`}>
        {activeConversation ? (
          <>
            {/* Chat Room Header */}
            <div className="p-3.5 border-b border-border-subtle bg-surface-raised/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => setSelectedConvId(null)}
                  className="md:hidden p-1.5 rounded-lg bg-surface-raised text-text-primary hover:bg-border-subtle transition-all"
                  title="Back to conversations"
                >
                  <ArrowLeft size={16} />
                </button>

                <div className="relative shrink-0">
                  {activeConversation.playerAvatar ? (
                    <img
                      src={activeConversation.playerAvatar}
                      alt={activeConversation.playerName || "Player"}
                      className="w-10 h-10 rounded-full object-cover border border-border-subtle"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-surface-raised border border-border-subtle flex items-center justify-center text-text-secondary">
                      <User size={18} />
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#22C55E] rounded-full border-2 border-surface-card" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-extrabold text-text-primary truncate">
                      {activeConversation.playerName || activeConversation.name || "Player"}
                    </h3>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#22C55E]/15 text-[#22C55E] uppercase">
                      Player
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary truncate flex items-center gap-1 mt-0.5">
                    <Building2 size={11} className="text-primary-lime" />
                    <span>Inquiring about <strong>{activeConversation.turfName || "Area Arena"}</strong></span>
                  </p>
                </div>
              </div>

              {/* Quick Actions (Call, Phone) */}
              <div className="flex items-center gap-2 shrink-0">
                {activeConversation.playerPhone && (
                  <a
                    href={`tel:${activeConversation.playerPhone}`}
                    className="px-3 py-1.5 bg-surface-raised hover:bg-border-subtle border border-border-subtle rounded-xl text-xs font-bold text-text-primary flex items-center gap-1.5 transition-all shadow-xs"
                    title="Call Player"
                  >
                    <Phone size={13} className="text-primary-lime" />
                    <span className="hidden sm:inline">{activeConversation.playerPhone}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Quick Context Strip */}
            <div className="px-4 py-2 bg-primary-lime/5 border-b border-primary-lime/10 flex items-center justify-between text-xs text-text-secondary">
              <span className="flex items-center gap-1.5">
                <Sparkles size={12} className="text-primary-lime" />
                <span>Direct inquiries sent by players from your pitch details page arrive here in real time.</span>
              </span>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-app-base/40">
              {loadingMessages ? (
                <div className="flex flex-col items-center justify-center h-48 gap-2">
                  <Loader2 size={20} className="animate-spin text-primary-lime" />
                  <span className="text-xs text-text-secondary">Loading conversation...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="py-16 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-surface-raised flex items-center justify-center text-text-tertiary mx-auto">
                    <MessageSquare size={20} />
                  </div>
                  <p className="text-xs font-bold text-text-primary">No messages yet</p>
                  <p className="text-[11px] text-text-secondary max-w-xs mx-auto">
                    Reply to start chatting with {activeConversation.playerName || "this player"}.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === user?.uid || msg.senderId === "current_owner" || msg.senderId === "owner";
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[70%]">
                        {!isMe && (
                          <div className="w-6 h-6 rounded-full bg-surface-raised border border-border-subtle flex items-center justify-center text-[10px] font-bold text-text-secondary shrink-0 mb-1">
                            {msg.senderName?.charAt(0) || "P"}
                          </div>
                        )}
                        <div
                          className={`rounded-2xl px-4 py-2.5 text-xs shadow-xs leading-relaxed ${
                            isMe
                              ? "bg-primary-lime text-accent-text font-medium rounded-br-xs"
                              : "bg-surface-raised border border-border-subtle text-text-primary rounded-bl-xs"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                        </div>
                      </div>
                      <span className="text-[9.5px] text-text-tertiary font-mono mt-1 px-1">
                        {msg.createdAt
                          ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : ""}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Response Chips */}
            <div className="px-4 py-2 bg-surface-card border-t border-border-subtle/50 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {[
                "Yes, our floodlights are fully operational!",
                "We provide complimentary match bibs and 2 balls.",
                "Confirmed! Please arrive 10 minutes before kickoff.",
                "Yes, we accept MTN & Airtel MoMo at the gate."
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setNewMessageText(chip)}
                  className="px-2.5 py-1 rounded-lg bg-surface-raised hover:bg-border-subtle border border-border-subtle text-[11px] font-medium text-text-secondary hover:text-text-primary whitespace-nowrap transition-colors cursor-pointer shrink-0"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-border-subtle bg-surface-raised/40 flex items-center gap-2">
              <input
                type="text"
                placeholder={`Reply to ${activeConversation.playerName || "player"}...`}
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-surface-card border border-border-subtle rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary-lime transition-all"
              />
              <button
                type="submit"
                disabled={!newMessageText.trim()}
                className="h-10 px-4 bg-primary-lime hover:bg-[#96E600] disabled:opacity-40 disabled:hover:bg-primary-lime text-accent-text font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm shadow-primary-lime/20 cursor-pointer active:scale-95"
              >
                <span>Send</span>
                <Send size={13} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-text-tertiary">
            <MessageSquare size={36} className="mb-2 text-border-prominent" />
            <p className="text-sm font-bold text-text-secondary">Select an inquiry to view messages</p>
            <p className="text-xs text-text-tertiary max-w-xs mt-1">
              Choose a conversation from the left to read and reply to players.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
