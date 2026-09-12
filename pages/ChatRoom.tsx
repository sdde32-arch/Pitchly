import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { chatService } from '../services/chatService';
import { Message, Conversation } from '../types/firebase';
import { ChevronLeft, Send, Users, User as UserIcon } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const ChatRoom: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userProfile } = useUser();
  
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    
    // Fetch conversation details
    const fetchConv = async () => {
      const docRef = doc(db, 'conversations', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setConversation({ id: docSnap.id, ...docSnap.data() } as Conversation);
      }
    };
    fetchConv();

    const unsubscribe = chatService.subscribeToMessages(id, (msgs) => {
      setMessages(msgs);
      setLoading(false);
      setTimeout(() => scrollToBottom(), 100);
    });

    return () => unsubscribe();
  }, [id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userProfile?.id || !id) return;

    const text = newMessage.trim();
    setNewMessage('');
    
    try {
      await chatService.sendMessage(
        id, 
        userProfile.id, 
        text,
        userProfile.name,
        userProfile.avatar
      );
      scrollToBottom();
    } catch (err) {
      console.error('Failed to send message:', err);
      setNewMessage(text); // restore
    }
  };

  const getOtherParticipantName = () => {
    if (conversation?.type === 'TEAM') return conversation.name;
    return conversation?.name || 'Chat'; // For direct chats we'd lookup the other user, but let's keep it simple
  };

  return (
    <div className="flex flex-col h-full bg-app-base font-body max-w-xl mx-auto border-x border-border-subtle relative shadow-xl">
      {/* Header */}
      <div className="px-4 py-4 flex items-center gap-3 bg-surface-card/90 backdrop-blur-md border-b border-border-subtle sticky top-0 z-50 shadow-sm">
        <button 
          onClick={() => navigate(-1)} 
          className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-raised text-text-secondary hover:bg-border-subtle transition-colors"
        >
          <ChevronLeft size={20} strokeWidth={2.5} />
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-full bg-surface-raised flex items-center justify-center shrink-0 border border-border-subtle text-text-secondary overflow-hidden">
            {conversation?.type === 'TEAM' ? <Users size={18} /> : <UserIcon size={18} />}
          </div>
          <div>
            <h1 className="font-bold text-text-primary text-[15px] line-clamp-1">
              {conversation ? getOtherParticipantName() : 'Loading...'}
            </h1>
            <p className="text-[11px] text-text-secondary font-medium mt-0.5">
              {conversation?.type === 'TEAM' ? 'Team Chat' : 'Direct Message'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="text-center text-text-secondary text-[13px] font-medium py-10">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-text-secondary text-[13px] font-medium mt-10 p-4 bg-surface-card rounded-[16px] border border-border-subtle shadow-sm">
            No messages yet. Say hello!
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.senderId === userProfile?.id;
            const showName = !isMe && conversation?.type !== 'DIRECT';
            
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-center'}`}>
                {showName && (
                  <span className="text-[11px] text-text-secondary ml-2 mb-1 font-bold">
                    {msg.senderName || 'Player'}
                  </span>
                )}
                <div 
                  className={`max-w-[75%] rounded-[20px] px-4 py-2.5 text-[14px] shadow-sm font-medium ${
                    isMe 
                      ? 'bg-primary-lime text-white rounded-tr-sm shadow-primary-lime/20' 
                      : 'bg-surface-card border border-border-subtle text-text-primary rounded-tl-sm'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-[#71717A] mt-1 mx-1 font-bold">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* Input */}
      <div className="p-4 bg-surface-card border-t border-border-subtle pb-6">
        <form onSubmit={handleSend} className="flex gap-2 relative">
          <input 
            type="text" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-surface-raised border border-border-subtle rounded-full px-4 py-3 text-[14px] font-medium text-text-primary placeholder:text-slate-400 outline-none focus:border-primary-lime focus:ring-1 focus:ring-primary-lime transition-all pr-14"
          />
          <button 
            type="submit"
            disabled={!newMessage.trim()}
            className="absolute right-1.5 top-1.5 bottom-1.5 w-[38px] rounded-full bg-primary-lime text-white flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-primary-lime/20 transition-transform active:scale-95"
          >
            <Send size={16} className="ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
