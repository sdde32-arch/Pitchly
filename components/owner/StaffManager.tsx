import React, { useEffect, useState } from 'react';
import { StaffMember } from '../../types';
import { OwnerService } from '../../services/owner';
import { 
  UserPlus, 
  Shield, 
  Trash2, 
  Phone, 
  Loader2, 
  X, 
  Users,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

export const StaffManager: React.FC = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  // Form State
  const [newStaff, setNewStaff] = useState({ name: '', phone: '', role: 'CARETAKER' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const data = await OwnerService.getStaff();
    setStaff(data);
  };

  const handleAddStaff = async () => {
    if (!newStaff.name || !newStaff.phone) return;
    setIsSubmitting(true);
    
    const staffObj: StaffMember = {
      id: `s-${Date.now()}`,
      name: newStaff.name,
      role: newStaff.role as any,
      phone: newStaff.phone
    };
    
    await OwnerService.addStaff(staffObj);
    await load();
    
    setIsSubmitting(false);
    setShowModal(false);
    setNewStaff({ name: '', phone: '', role: 'CARETAKER' });
  };

  const handleDeleteStaff = async (id: string) => {
    setShowDeleteConfirm(id);
  };

  const confirmDelete = async () => {
    if (showDeleteConfirm) {
      await OwnerService.deleteStaff(showDeleteConfirm);
      setStaff(prev => prev.filter(s => s.id !== showDeleteConfirm));
      setShowDeleteConfirm(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans w-full">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-card border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#A78BFA]/10 text-[#A78BFA] border border-[#A78BFA]/30 uppercase tracking-wider">
              Access & Operations
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight mt-1">
            Staff & Caretaker Roster
          </h1>
          <p className="text-xs text-text-secondary">
            Assign on-ground staff to check in players and verify walk-in cash payments.
          </p>
        </div>

        <button 
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-primary-lime hover:bg-[#96E600] text-accent-text font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm shadow-primary-lime/20 active:scale-95 transition-all cursor-pointer self-start sm:self-auto"
        >
          <UserPlus size={15} strokeWidth={2.5} />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {staff.length === 0 && (
          <div className="col-span-full text-center py-16 bg-surface-card rounded-2xl border border-border-subtle p-6 space-y-3">
            <Users size={36} className="mx-auto opacity-40 text-text-tertiary" />
            <p className="text-xs font-bold text-text-primary uppercase tracking-wider">
              No staff members registered
            </p>
            <p className="text-xs text-text-secondary max-w-sm mx-auto">
              Add facility managers or pitch caretakers to help monitor daily game operations.
            </p>
          </div>
        )}

        {staff.map((member) => (
          <div 
            key={member.id} 
            className="bg-surface-card p-4 rounded-2xl border border-border-subtle hover:border-border-prominent transition-all flex flex-col justify-between gap-3 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 bg-surface-raised rounded-xl flex items-center justify-center text-[#A78BFA] shrink-0 border border-border-subtle overflow-hidden">
                  {member.avatar ? (
                    <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    <UserCheck size={22} />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-sm text-text-primary truncate">
                    {member.name}
                  </h3>
                  <div className="mt-1">
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${
                      member.role === 'MANAGER' 
                        ? 'bg-[#A78BFA]/10 text-[#A78BFA] border-[#A78BFA]/30' 
                        : 'bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/30'
                    }`}>
                      {member.role}
                    </span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => handleDeleteStaff(member.id)}
                className="w-8 h-8 rounded-lg bg-surface-raised hover:bg-[#EF4444]/10 text-text-tertiary hover:text-[#EF4444] border border-border-subtle flex items-center justify-center transition-colors cursor-pointer"
                title="Remove Member"
              >
                <Trash2 size={14} />
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-xs">
              <span className="text-text-secondary font-medium">
                {member.phone}
              </span>
              <a
                href={`tel:${member.phone}`}
                className="px-2.5 py-1 bg-surface-raised hover:bg-border-subtle border border-border-subtle rounded-lg text-[11px] font-bold text-text-primary flex items-center gap-1 transition-all"
              >
                <Phone size={11} />
                <span>Call</span>
              </a>
            </div>
          </div>
        ))}
      </div>
      
      {/* Add Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface-card border border-border-subtle w-full max-w-sm rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-border-subtle">
              <h3 className="text-sm font-extrabold text-text-primary uppercase tracking-wider">
                Add New Staff Member
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary bg-surface-raised"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1 block">
                  Full Name
                </label>
                <input 
                  type="text" 
                  value={newStaff.name} 
                  onChange={e => setNewStaff({ ...newStaff, name: e.target.value })} 
                  placeholder="e.g. Samuel Okello"
                  className="w-full bg-surface-raised border border-border-subtle rounded-xl px-3.5 py-2.5 text-xs font-bold text-text-primary outline-none focus:border-[#38BDF8]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1 block">
                  Phone Number
                </label>
                <input 
                  type="tel" 
                  value={newStaff.phone} 
                  onChange={e => setNewStaff({ ...newStaff, phone: e.target.value })} 
                  placeholder="e.g. 0772 123 456"
                  className="w-full bg-surface-raised border border-border-subtle rounded-xl px-3.5 py-2.5 text-xs font-bold text-text-primary outline-none focus:border-[#38BDF8]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1 block">
                  Operational Role
                </label>
                <select 
                  value={newStaff.role} 
                  onChange={e => setNewStaff({ ...newStaff, role: e.target.value })} 
                  className="w-full bg-surface-raised border border-border-subtle rounded-xl px-3 py-2.5 text-xs font-bold text-text-primary outline-none focus:border-[#38BDF8]"
                >
                  <option value="CARETAKER">Caretaker (Slot Locks & Check-ins)</option>
                  <option value="MANAGER">Manager (Full Facility Oversight)</option>
                </select>
              </div>

              <button 
                onClick={handleAddStaff} 
                disabled={isSubmitting || !newStaff.name || !newStaff.phone} 
                className="w-full bg-primary-lime hover:bg-[#96E600] text-accent-text py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider shadow-sm mt-3 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer active:scale-95 transition-all"
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <UserPlus size={15} />
                    <span>Add Member</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface-card border border-border-subtle w-full max-w-sm rounded-2xl p-5 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 bg-[#EF4444]/10 text-[#EF4444] rounded-2xl flex items-center justify-center mx-auto border border-[#EF4444]/20">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-text-primary">
                Remove Staff Member?
              </h3>
              <p className="text-xs text-text-secondary mt-1">
                Are you sure you want to remove this staff member from your facility roster?
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button 
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-text-secondary bg-surface-raised hover:bg-border-subtle transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-[#EF4444] hover:bg-[#EF4444]/90 transition-colors cursor-pointer shadow-sm"
              >
                Confirm Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
