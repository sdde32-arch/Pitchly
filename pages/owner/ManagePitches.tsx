import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { useUser } from '../../context/UserContext';
import { Turf } from '../../types';
import { 
  Plus, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  Clock3, 
  ArrowLeft, 
  Building2, 
  Edit3, 
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { pitchService } from '../../services/pitchService';

export const ManagePitches: React.FC = () => {
  const { user, loading: authLoading } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  const [pitches, setPitches] = useState<Turf[]>([]);
  const [loading, setLoading] = useState(true);

  const [showReReviewBanner, setShowReReviewBanner] = useState(false);
  const [showUpdateSuccess, setShowUpdateSuccess] = useState(false);

  useEffect(() => {
    if (location.state?.showReReviewBanner) {
      setShowReReviewBanner(true);
      window.history.replaceState({}, document.title);
    } else if (location.state?.showUpdateSuccess) {
      setShowUpdateSuccess(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    if (authLoading) return;
    const fetchPitches = async () => {
      try {
        if (!user) return;

        const fbPitches = await pitchService.listByOwner(user.uid);
        const combined = fbPitches.map(p => ({
          id: p.id,
          ownerId: p.ownerId,
          name: p.name,
          location: p.location,
          pricePerHour: p.pricePerHour,
          image: (p.images && p.images[0]) || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
          amenities: p.amenities || [],
          openingHour: p.openingHour || '07:00',
          closingHour: p.closingHour || '23:00',
          status: p.status as any,
          rejectionReason: 'changeRequestMessage' in p ? (p as any).changeRequestMessage : undefined,
          pitchFormats: p.pitchFormats || [],
          rating: 4.8,
          blockedDates: [],
          distance: '0 km',
          staff: [],
          isVerified: p.isVerified || false
        }));
        setPitches(combined);
      } catch (err) {
        console.error("Error fetching pitches:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPitches();
  }, [user, authLoading]);

  const getStatusBadge = (pitch: Turf) => {
    switch (pitch.status as any) {
      case 'ACTIVE':
      case 'approved':
        return (
          <div className="flex items-center gap-1 bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E] px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider">
            <ShieldCheck size={12} /> Verified & Active
          </div>
        );
      case 'PENDING_APPROVAL':
      case 'pending_review':
        return (
          <div className="flex items-center gap-1 bg-[#FACC15]/15 border border-[#FACC15]/30 text-[#FACC15] px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider">
            <Clock3 size={12} /> Pending Review
          </div>
        );
      case 'PENDING_INSPECTION':
        return (
          <div className="flex items-center gap-1 bg-[#38BDF8]/15 border border-[#38BDF8]/30 text-[#38BDF8] px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider">
            <MapPin size={12} /> Pending Inspection
          </div>
        );
      case 'REJECTED':
      case 'rejected':
      case 'changes_requested':
        return (
          <div className="flex items-center gap-1 bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider">
            <AlertCircle size={12} /> Action Required
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1 bg-surface-raised border border-border-subtle text-text-secondary px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider">
            {pitch.status}
          </div>
        );
    }
  };

  return (
    <Layout>
      <div className="min-h-[100dvh] bg-app-base text-text-primary font-sans p-3 sm:p-4 md:p-6 max-w-7xl mx-auto pb-24">
        {/* Navigation & Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <button
              onClick={() => navigate('/owner')}
              className="inline-flex items-center text-xs font-bold text-text-secondary hover:text-text-primary transition-colors mb-2 cursor-pointer"
            >
              <ArrowLeft size={14} className="mr-1.5" /> Back to Overview
            </button>
            <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
              Sports Facilities & Pitches
            </h1>
            <p className="text-xs text-text-secondary mt-0.5">
              Manage your listed turf pitches, hourly rates, and facility status.
            </p>
          </div>

          <button
            onClick={() => navigate('/owner/add-pitch')}
            className="px-4 py-2.5 bg-primary-lime hover:bg-[#96E600] text-accent-text font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm shadow-primary-lime/20 active:scale-95 transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Add New Pitch</span>
          </button>
        </div>

        {/* Informative Banners */}
        {showReReviewBanner && (
          <div className="bg-[#FACC15]/10 border border-[#FACC15]/30 text-text-primary p-4 rounded-2xl mb-6 text-xs space-y-1.5 animate-fadeIn">
            <div className="flex items-center gap-2 font-extrabold text-[#FACC15] text-sm">
              <AlertCircle size={16} />
              <span>Pitch Resubmitted for Admin Approval</span>
            </div>
            <p className="text-text-secondary leading-relaxed">
              You modified critical fields of your pitch. It is temporarily in <strong>Pending Review</strong> until an administrator verifies the details.
            </p>
          </div>
        )}

        {showUpdateSuccess && (
          <div className="bg-[#22C55E]/10 border border-[#22C55E]/30 text-text-primary p-4 rounded-2xl mb-6 text-xs space-y-1.5 animate-fadeIn">
            <div className="flex items-center gap-2 font-extrabold text-[#22C55E] text-sm">
              <ShieldCheck size={16} />
              <span>Pitch Updated Successfully</span>
            </div>
            <p className="text-text-secondary leading-relaxed">
              Your pitch details have been updated and remain active for player reservations.
            </p>
          </div>
        )}

        {/* Pitches Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-surface-card rounded-2xl p-4 border border-border-subtle h-64 animate-pulse" />
            ))}
          </div>
        ) : pitches.length === 0 ? (
          <div className="bg-surface-card rounded-2xl p-8 sm:p-12 text-center border border-border-subtle max-w-lg mx-auto my-8 space-y-4">
            <div className="w-14 h-14 bg-surface-raised rounded-2xl flex items-center justify-center mx-auto text-text-tertiary">
              <Building2 size={28} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-text-primary">
                No pitches registered yet
              </h2>
              <p className="text-xs text-text-secondary mt-1">
                Add your football turf or sports arena to start getting players.
              </p>
            </div>
            <button
              onClick={() => navigate('/owner/add-pitch')}
              className="px-5 py-2.5 bg-primary-lime text-accent-text font-bold text-xs rounded-xl inline-flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>Add Your Pitch</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pitches.map((pitch) => (
              <div
                key={pitch.id}
                className="bg-surface-card rounded-2xl overflow-hidden border border-border-subtle hover:border-border-prominent transition-all group flex flex-col justify-between shadow-sm"
              >
                <div>
                  {/* Card Image Banner */}
                  <div className="h-44 relative bg-surface-raised overflow-hidden">
                    <img
                      src={pitch.image}
                      alt={pitch.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    <div className="absolute top-3 left-3">
                      {getStatusBadge(pitch)}
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <h3 className="font-extrabold text-base truncate">
                        {pitch.name}
                      </h3>
                      <div className="flex items-center gap-1 text-white/80 text-xs mt-0.5">
                        <MapPin size={12} className="shrink-0" />
                        <span className="truncate">{pitch.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-secondary font-medium">Rate / Hour</span>
                      <span className="text-sm font-extrabold text-text-primary">
                        UGX {(pitch.pricePerHour || 0).toLocaleString()}
                      </span>
                    </div>

                    {pitch.status === 'REJECTED' && pitch.rejectionReason && (
                      <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-lg p-3 text-xs text-[#EF4444] space-y-1">
                        <p className="font-extrabold">Action needed:</p>
                        <p className="leading-relaxed">{pitch.rejectionReason}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-text-tertiary pt-2.5 border-t border-border-subtle">
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>{pitch.openingHour} – {pitch.closingHour}</span>
                      </div>
                      <span>{pitch.pitchFormats?.length || 1} format(s)</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-3 sm:p-3.5 bg-surface-raised/40 border-t border-border-subtle flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/owner/edit-pitch/${pitch.id}`)}
                    className="flex-1 h-9 bg-surface-card hover:bg-surface-raised border border-border-subtle text-text-primary rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  >
                    <Edit3 size={13} />
                    <span>Edit Pitch</span>
                  </button>
                  <button
                    onClick={() => navigate('/owner?tab=Dashboard')}
                    className="h-9 px-3.5 bg-primary-lime/10 hover:bg-primary-lime/20 text-primary-lime border border-primary-lime/30 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                    title="Manage Slots"
                  >
                    <Calendar size={13} />
                    <span>Slots</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};
