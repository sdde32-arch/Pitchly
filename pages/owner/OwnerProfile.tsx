import React, { useState, useRef, useEffect } from "react";
import { Layout } from "../../components/Layout";
import { useUser } from "../../context/UserContext";
import { OwnerService } from "../../services/owner";
import {
  Camera,
  Edit2,
  MapPin,
  Phone,
  Mail,
  Save,
  X,
  Building,
  CheckCircle2,
  Shield,
  ArrowLeft,
  Building2,
  Settings,
  CalendarCheck,
  Wallet
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export const OwnerProfile: React.FC = () => {
  const { userProfile, updateProfile, isOwner } = useUser();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: userProfile?.name || "",
    email: userProfile?.email || "",
    phone: userProfile?.phone || "",
  });

  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || "",
        email: userProfile.email || "",
        phone: userProfile.phone || "",
      });
    }
  }, [userProfile]);

  const [businessProfile, setBusinessProfile] = useState<any>(null);

  useEffect(() => {
    if (isOwner) {
      OwnerService.getBusinessProfile()
        .then((profile) => {
          setBusinessProfile(profile);
        })
        .catch((err) => {
          console.warn("Failed to load business profile on OwnerProfile screen", err);
        });
    }
  }, [isOwner]);

  const handleSave = async () => {
    await updateProfile({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
    });
    setIsEditing(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateProfile({ avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Layout>
      <div className="min-h-full bg-app-base text-text-primary font-sans p-3 sm:p-4 md:p-6 max-w-4xl mx-auto pb-24 animate-fadeIn">
        {/* Navigation */}
        <button
          onClick={() => navigate('/owner')}
          className="inline-flex items-center text-xs font-bold text-text-secondary hover:text-text-primary transition-colors mb-4 cursor-pointer"
        >
          <ArrowLeft size={14} className="mr-1.5" /> Back to Dashboard
        </button>

        {/* Profile Card */}
        <div className="bg-surface-card rounded-2xl border border-border-subtle overflow-hidden shadow-sm">
          {/* Cover Header Banner */}
          <div className="h-28 sm:h-36 bg-gradient-to-r from-surface-raised via-[#38BDF8]/15 to-primary-lime/10 border-b border-border-subtle relative" />

          {/* Profile Header Row */}
          <div className="px-4 sm:px-6 pb-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 mb-4">
              <div className="flex items-end gap-3 sm:gap-4">
                <div className="relative group">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-4 border-surface-card bg-surface-raised shadow-md">
                    <img
                      src={userProfile?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200"}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1.5 -right-1.5 w-8 h-8 bg-primary-lime text-accent-text rounded-xl flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                    title="Change Photo"
                  >
                    <Camera size={15} />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                  />
                </div>

                <div className="space-y-1">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
                    {userProfile?.name || "Pitch Owner"}
                  </h1>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30 uppercase tracking-wider">
                      Verified Pitch Owner
                    </span>
                  </div>
                </div>
              </div>

              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-surface-raised hover:bg-border-subtle border border-border-subtle rounded-xl text-xs font-bold text-text-primary flex items-center justify-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto"
                >
                  <Edit2 size={13} />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>

            {/* Editing Form vs Display Information */}
            {isEditing ? (
              <div className="space-y-4 pt-4 border-t border-border-subtle animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1 block">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-surface-raised border border-border-subtle rounded-xl px-3.5 py-2.5 text-xs font-bold text-text-primary outline-none focus:border-[#38BDF8]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1 block">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-surface-raised border border-border-subtle rounded-xl px-3.5 py-2.5 text-xs font-bold text-text-primary outline-none focus:border-[#38BDF8]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1 block">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-surface-raised border border-border-subtle rounded-xl px-3.5 py-2.5 text-xs font-bold text-text-primary outline-none focus:border-[#38BDF8]"
                    />
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-text-secondary bg-surface-raised hover:bg-border-subtle transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-accent-text bg-primary-lime hover:bg-[#96E600] shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  >
                    <Save size={15} />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-border-subtle">
                <div className="p-3.5 bg-surface-raised rounded-xl border border-border-subtle/80 flex items-center gap-3">
                  <div className="w-9 h-9 bg-surface-card rounded-lg flex items-center justify-center text-[#38BDF8] shrink-0 border border-border-subtle">
                    <Mail size={16} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-text-tertiary uppercase block">
                      Email Address
                    </span>
                    <span className="text-xs font-bold text-text-primary truncate block">
                      {formData.email || "Not provided"}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-surface-raised rounded-xl border border-border-subtle/80 flex items-center gap-3">
                  <div className="w-9 h-9 bg-surface-card rounded-lg flex items-center justify-center text-[#22C55E] shrink-0 border border-border-subtle">
                    <Phone size={16} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-text-tertiary uppercase block">
                      Phone Number
                    </span>
                    <span className="text-xs font-bold text-text-primary truncate block">
                      {formData.phone || "Not provided"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Business Summary Card */}
        {isOwner && (
          <div className="bg-surface-card rounded-2xl p-4 sm:p-6 border border-border-subtle mt-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-text-primary flex items-center gap-2">
                  <Building2 size={16} className="text-[#38BDF8]" />
                  <span>Linked Business Profile</span>
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  Operating entity linked to your pitch revenue payouts.
                </p>
              </div>
              <button
                onClick={() => navigate('/owner?tab=Settings')}
                className="text-xs font-bold text-[#38BDF8] hover:underline"
              >
                Edit in Settings
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-surface-raised rounded-xl border border-border-subtle">
                <span className="text-[10px] font-bold text-text-tertiary uppercase block">
                  Business Name
                </span>
                <span className="text-xs font-bold text-text-primary mt-1 block">
                  {businessProfile?.businessName || "Registered Arena"}
                </span>
              </div>

              <div className="p-3.5 bg-surface-raised rounded-xl border border-border-subtle">
                <span className="text-[10px] font-bold text-text-tertiary uppercase block">
                  Mobile Money Payout
                </span>
                <span className="text-xs font-bold text-text-primary mt-1 block">
                  {businessProfile?.paymentDetails?.mtnNumber || businessProfile?.mobileMoneyNumber || "Configured in Settings"}
                </span>
              </div>

              <div className="p-3.5 bg-surface-raised rounded-xl border border-border-subtle">
                <span className="text-[10px] font-bold text-text-tertiary uppercase block">
                  Operating Window
                </span>
                <span className="text-xs font-bold text-text-primary mt-1 block">
                  {businessProfile?.operatingHours?.open || "07:00"} – {businessProfile?.operatingHours?.close || "23:00"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Quick Portal Navigation Shortcuts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <button
            onClick={() => navigate('/owner?tab=Dashboard')}
            className="p-3.5 bg-surface-card rounded-xl border border-border-subtle hover:border-border-prominent text-center transition-all cursor-pointer shadow-xs"
          >
            <span className="text-xs font-bold text-text-primary block">Overview</span>
            <span className="text-[10px] text-text-tertiary">Live Slots</span>
          </button>
          <button
            onClick={() => navigate('/owner?tab=Bookings')}
            className="p-3.5 bg-surface-card rounded-xl border border-border-subtle hover:border-border-prominent text-center transition-all cursor-pointer shadow-xs"
          >
            <span className="text-xs font-bold text-text-primary block">Bookings</span>
            <span className="text-[10px] text-text-tertiary">Confirmations</span>
          </button>
          <button
            onClick={() => navigate('/owner/pitches')}
            className="p-3.5 bg-surface-card rounded-xl border border-border-subtle hover:border-border-prominent text-center transition-all cursor-pointer shadow-xs"
          >
            <span className="text-xs font-bold text-text-primary block">Facilities</span>
            <span className="text-[10px] text-text-tertiary">Manage Turf</span>
          </button>
          <button
            onClick={() => navigate('/owner?tab=Finances')}
            className="p-3.5 bg-surface-card rounded-xl border border-border-subtle hover:border-border-prominent text-center transition-all cursor-pointer shadow-xs"
          >
            <span className="text-xs font-bold text-text-primary block">Finances</span>
            <span className="text-[10px] text-text-tertiary">Payouts & MoMo</span>
          </button>
        </div>
      </div>
    </Layout>
  );
};
