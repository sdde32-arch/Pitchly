import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useUser } from '../context/UserContext';
import { chatService } from '../services/chatService';
import { Conversation } from '../types/firebase';
import { useNavigate } from 'react-router-dom';
import { Search, Users, User as UserIcon, MessageSquare } from 'lucide-react';
import { userService } from '../services/userService';
import { EmptyState } from '../components/ui/EmptyState';

export const ChatList: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!userProfile?.id) return;
    const unsubscribe = chatService.subscribeToUserConversations(userProfile.id, (convs) => {
      setConversations(convs);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [userProfile?.id]);

  const filteredConvs = conversations.filter(c => {
    const name = c.name || (c.type === 'DIRECT' ? 'Direct Message' : 'Chat');
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <Layout>
      <div className="min-h-[100dvh] bg-[#fafafa] dark:bg-[#0e0f12] font-body text-text-primary pb-24">
        <div className="max-w-xl mx-auto p-4">
          <div className="flex items-center gap-3 mb-6">
            <h1 className="text-[24px] font-black tracking-tight">Messages</h1>
            {filteredConvs.length > 0 && (
              <span className="bg-primary-lime text-accent-text text-[12px] font-bold px-2.5 py-0.5 rounded-full">
                {filteredConvs.length}
              </span>
            )}
          </div>
          
          <div className="bg-surface-card rounded-full px-4 py-3.5 flex items-center gap-3 border border-border-subtle shadow-sm mb-6 focus-within:ring-2 focus-within:ring-primary-lime transition-shadow">
            <Search size={18} className="text-[#71717A]" />
            <input 
              type="text" 
              placeholder="Search messages..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-[14px] text-text-primary placeholder:text-slate-400 dark:placeholder:text-zinc-500"
            />
          </div>

          {loading ? (
            <div className="text-center text-[13px] font-medium text-text-secondary py-10">Loading conversations...</div>
          ) : filteredConvs.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No Messages Yet"
              description="Your inbox is empty. Search for teams or view other player profiles to initiate a chat!"
              actionText="Explore Teams"
              onAction={() => navigate("/teams")}
              actionVariant="primary"
              className="my-4"
            />
          ) : (
            <div className="flex flex-col gap-3">
              {filteredConvs.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => navigate(`/chat/${conv.id}`)}
                  className="bg-surface-card rounded-2xl p-4 flex items-center gap-4 border border-border-subtle shadow-sm active:scale-[0.98] transition-all text-left hover:border-primary-lime group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-lime"
                >
                  <div className="w-14 h-14 rounded-full bg-surface-raised flex items-center justify-center shrink-0 border border-border-subtle text-text-secondary group-hover:text-primary-lime transition-colors overflow-hidden">
                    {conv.type === 'TEAM' ? (
                      <Users size={22} />
                    ) : (
                      <UserIcon size={22} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-bold text-[15px] text-text-primary truncate pr-2 group-hover:text-primary-lime transition-colors">
                        {conv.name || (conv.type === 'DIRECT' ? 'Direct Message' : 'Chat')}
                      </h3>
                      {conv.lastMessageAt && (
                        <span className="text-[11px] font-bold text-[#71717A] shrink-0">
                          {new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] font-medium text-text-secondary truncate">
                      {conv.lastMessage || 'No messages yet'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
