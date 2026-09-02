import React, { useState, useEffect } from 'react';
import { Search, X, Check, Users, UserPlus, Phone, Mail, Shield } from 'lucide-react';
import { User } from '../../types/firebase';
import { userService } from '../../services/userService';

interface PlayerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUserIds: string[];
  onConfirmSelection: (selectedUserIds: string[], selectedUserObjects?: User[]) => void;
  currentUserId?: string;
  playersNeeded?: number;
}

export const PlayerSelectionModal: React.FC<PlayerSelectionModalProps> = ({
  isOpen,
  onClose,
  selectedUserIds,
  onConfirmSelection,
  currentUserId,
  playersNeeded = 10,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMap, setSelectedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      const initialMap: Record<string, boolean> = {};
      selectedUserIds.forEach((uid) => {
        initialMap[uid] = true;
      });
      setSelectedMap(initialMap);

      const fetchUsers = async () => {
        setLoading(true);
        try {
          const list = await userService.listSearchableUsers();
          // Filter out the creator themselves
          const filtered = list.filter((u) => u.id !== currentUserId);
          setUsers(filtered);
        } catch (err) {
          console.warn("Error fetching searchable users:", err);
        } finally {
          setLoading(false);
        }
      };

      fetchUsers();
    }
  }, [isOpen, selectedUserIds, currentUserId]);

  if (!isOpen) return null;

  const toggleSelect = (uid: string) => {
    setSelectedMap((prev) => ({
      ...prev,
      [uid]: !prev[uid],
    }));
  };

  const selectedCount = Object.values(selectedMap).filter(Boolean).length;

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const nameMatch = u.name?.toLowerCase().includes(q) || false;
    const emailMatch = u.email?.toLowerCase().includes(q) || false;
    const phoneMatch = u.phone?.toLowerCase().includes(q) || false;
    return nameMatch || emailMatch || phoneMatch;
  });

  const handleConfirm = () => {
    const finalUids = Object.entries(selectedMap)
      .filter(([_, isSelected]) => isSelected)
      .map(([uid]) => uid);
    
    const selectedObjs = users.filter((u) => finalUids.includes(u.id));
    onConfirmSelection(finalUids, selectedObjs);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-app-base/80 backdrop-blur-sm p-4 animate-fade-in font-sans">
      <div 
        className="bg-surface-card border border-border-subtle rounded-3xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-border-subtle flex items-center justify-between bg-surface-raised/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-lime/10 border border-primary-lime/30 flex items-center justify-center text-primary-lime">
              <UserPlus size={20} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-text-primary">
                Invite Players
              </h2>
              <p className="text-xs text-text-secondary">
                Select teammates to invite to this proposed match
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

        {/* Search Bar */}
        <div className="p-4 border-b border-border-subtle bg-surface-card">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search players by name, phone or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-raised border border-border-subtle rounded-xl pl-10 pr-4 py-2.5 text-xs text-text-primary placeholder:text-text-tertiary font-semibold outline-none focus:border-primary-lime transition-all"
            />
          </div>

          {/* Selection counter pill */}
          <div className="flex items-center justify-between mt-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-text-primary">
                Selected: <span className="text-primary-lime">{selectedCount}</span> / {playersNeeded} needed
              </span>
              {selectedCount >= playersNeeded && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30">
                  Target Met
                </span>
              )}
            </div>
            {selectedCount > 0 && (
              <button
                onClick={() => setSelectedMap({})}
                className="text-[11px] font-bold text-text-tertiary hover:text-[#EF4444] transition-colors cursor-pointer"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[45vh] no-scrollbar">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-primary-lime border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-semibold text-text-tertiary">Loading players roster...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-text-tertiary">
              <Users size={36} className="mx-auto mb-2 opacity-50" />
              <p className="text-xs font-bold text-text-primary">No players found</p>
              <p className="text-[11px] text-text-secondary mt-0.5">Try searching with a different keyword</p>
            </div>
          ) : (
            filteredUsers.map((u) => {
              const isSelected = !!selectedMap[u.id];
              const initials = (u.name || u.email || 'PL')
                .split(' ')
                .map((n) => n[0])
                .join('')
                .substring(0, 2)
                .toUpperCase();

              return (
                <div
                  key={u.id}
                  onClick={() => toggleSelect(u.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-primary-lime/10 border-primary-lime/50 shadow-xs'
                      : 'bg-surface-raised hover:bg-surface-raised/80 border-border-subtle'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-surface-card border border-border-subtle flex items-center justify-center font-extrabold text-xs text-text-primary shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-text-primary truncate">
                          {u.name || 'Anonymous Player'}
                        </span>
                        {u.role && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-surface-card border border-border-subtle text-text-tertiary">
                            {u.role}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-text-secondary truncate mt-0.5">
                        {u.phone && (
                          <span className="flex items-center gap-1">
                            <Phone size={10} className="text-text-tertiary" /> {u.phone}
                          </span>
                        )}
                        {u.email && (
                          <span className="flex items-center gap-1 truncate">
                            <Mail size={10} className="text-text-tertiary" /> {u.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Selection Checkbox */}
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all shrink-0 ${
                      isSelected
                        ? 'bg-primary-lime text-accent-text shadow-sm'
                        : 'border border-border-subtle bg-surface-card text-transparent'
                    }`}
                  >
                    <Check size={14} className={isSelected ? 'opacity-100 font-black' : 'opacity-0'} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border-subtle bg-surface-raised/60 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-border-subtle text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-surface-card transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 max-w-[220px] px-5 py-2.5 rounded-xl bg-primary-lime hover:bg-[#B2FF1A] text-accent-text text-xs font-black uppercase tracking-wider shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Check size={14} />
            <span>Confirm ({selectedCount})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
