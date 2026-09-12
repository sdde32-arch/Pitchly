import React, { useState, useEffect } from "react";
import { Layout } from "../components/Layout";
import { useUser } from "../context/UserContext";
import { useInteractiveWalkthrough } from "../context/InteractiveWalkthroughContext";
import { PlayerAvatar, AVATARS_LIST } from "../components/PlayerAvatars";
import { Toggle } from "../components/ui/Toggle";
import { slotAlertService } from "../services/slotAlertService";
import {
  ChevronLeft,
  Settings,
  User,
  CreditCard,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  X,
  Plus,
  Trash2,
  Check,
  History,
  MessageSquare,
  Sparkles,
  Compass,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile, signOut, user, updateProfile } = useUser();
  const { startWalkthrough } = useInteractiveWalkthrough();

  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  // Modal active state: null | 'personal_info' | 'payment_methods' | 'notifications' | 'privacy_security' | 'help_support'
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Edit Profile / Personal Info form states
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatarId, setEditAvatarId] = useState("avatar_01");
  const [savingProfile, setSavingProfile] = useState(false);

  // Payment methods states
  const [savedWallets, setSavedWallets] = useState([
    { id: "w_1", phone: "0772123456", provider: "MTN MoMo", isDefault: true },
    { id: "w_2", phone: "0701987654", provider: "Airtel Money", isDefault: false },
  ]);
  const [newPhone, setNewPhone] = useState("");
  const [newProvider, setNewProvider] = useState("MTN MoMo");
  const [showAddWallet, setShowAddWallet] = useState(false);

  // Saved Card states
  const [savedCards, setSavedCards] = useState([
    { id: "c_1", name: "JAMES WILLIAM", number: "•••• •••• •••• 4242", expiry: "12/28", brand: "visa" },
  ]);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [showAddCard, setShowAddCard] = useState(false);

  // Notification toggles states
  const [notifPreferences, setNotifPreferences] = useState({
    slots: true,
    reminders: true,
    invites: true,
    marketing: false,
  });

  // Privacy states
  const [profileVisibility, setProfileVisibility] = useState("public");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Help & Support faq index
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(null);
  const [supportSubject, setSupportSubject] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportSeverity, setSupportSeverity] = useState("Medium");
  const [supportSuccess, setSupportSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchAlerts = async () => {
      setLoadingAlerts(true);
      try {
        const list = await slotAlertService.listByUser(user.uid);
        setActiveAlerts(list);
      } catch (err) {
        console.error("Error fetching slot subscriptions:", err);
      } finally {
        setLoadingAlerts(false);
      }
    };
    fetchAlerts();
  }, [user]);

  // Sync profile data when modal opens
  useEffect(() => {
    if (userProfile) {
      setEditName(userProfile.name || "");
      setEditPhone(userProfile.phone || "");
      setEditEmail(userProfile.email || "");
      setEditBio(userProfile.bio || "");
      setEditAvatarId(userProfile.avatarId || "avatar_01");
    }
  }, [userProfile, activeModal]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/auth", { replace: true });
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile({
        name: editName,
        phone: editPhone,
        bio: editBio,
        avatarId: editAvatarId,
      });
      alert("Profile updated successfully!");
      setActiveModal(null);
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddWallet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhone) return;
    const newW = {
      id: "w_" + Date.now(),
      phone: newPhone,
      provider: newProvider,
      isDefault: savedWallets.length === 0,
    };
    setSavedWallets([...savedWallets, newW]);
    setNewPhone("");
    setShowAddWallet(false);
  };

  const handleDeleteWallet = (id: string) => {
    setSavedWallets(savedWallets.filter((w) => w.id !== id));
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName || !cardNumber || !cardExpiry) return;
    const last4 = cardNumber.replace(/\s+/g, "").slice(-4) || "4242";
    const newC = {
      id: "c_" + Date.now(),
      name: cardName.toUpperCase(),
      number: `•••• •••• •••• ${last4}`,
      expiry: cardExpiry,
      brand: "mastercard",
    };
    setSavedCards([...savedCards, newC]);
    setCardName("");
    setCardNumber("");
    setCardExpiry("");
    setCardCvv("");
    setShowAddCard(false);
  };

  const handleDeleteCard = (id: string) => {
    setSavedCards(savedCards.filter((c) => c.id !== id));
  };

  const handleSaveNotifs = () => {
    setActiveModal(null);
  };

  const handleSavePrivacy = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveModal(null);
  };

  const handleSendTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportSubject || !supportMessage) return;
    setSupportSuccess(true);
    setTimeout(() => {
      setSupportSuccess(false);
      setSupportSubject("");
      setSupportMessage("");
      setActiveModal(null);
      alert("Your support ticket has been submitted. We will contact you shortly.");
    }, 1000);
  };

  return (
    <Layout>
      <div className="min-h-full bg-app-base text-text-primary font-body pb-24">
        {/* Header */}
        <div className="max-w-xl mx-auto p-4 flex items-center justify-between sticky top-0 bg-app-base/90 backdrop-blur-md z-40 border-b border-border-subtle">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-surface-card border border-border-subtle flex items-center justify-center text-text-primary hover:bg-surface-raised transition-colors shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-lime"
          >
            <ChevronLeft size={18} strokeWidth={2.5} />
          </button>
          <h1 className="text-[15px] font-bold text-text-primary">Profile</h1>
          <button
            onClick={() => navigate("/settings")}
            className="w-9 h-9 rounded-full bg-surface-card border border-border-subtle flex items-center justify-center text-text-primary hover:bg-surface-raised transition-colors shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-lime"
          >
            <Settings size={17} />
          </button>
        </div>

        {/* Profile Card Summary */}
        <div className="max-w-xl mx-auto p-4 space-y-4">
          <div className="bg-surface-card border border-border-subtle rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-xs">
            <div className="w-16 h-16 rounded-full mx-auto bg-surface-raised border border-primary-lime/50 flex items-center justify-center overflow-hidden mb-3">
              <PlayerAvatar id={userProfile?.avatarId || editAvatarId} className="w-full h-full" />
            </div>
            <h2 className="text-[16px] font-black text-text-primary tracking-tight">
              {userProfile?.name || "Player"}
            </h2>
            <p className="text-[12px] font-medium text-text-secondary mt-0.5 mb-4">
              {userProfile?.phone || userProfile?.email || user?.email || ""}
            </p>
            <button
              onClick={() => setActiveModal("personal_info")}
              className="px-5 py-2 rounded-full bg-surface-raised hover:bg-border-subtle border border-border-subtle text-text-primary text-[12px] font-bold transition-colors cursor-pointer shadow-xs active:scale-95"
            >
              Edit Profile
            </button>
          </div>

          {/* Quick Menu Options */}
          <div id="walkthrough-profile-hub" className="bg-surface-card border border-border-subtle rounded-2xl divide-y divide-border-subtle shadow-xs overflow-hidden scroll-mt-24">
            <button
              onClick={() => startWalkthrough(0)}
              className="w-full p-4 flex items-center justify-between bg-primary-lime/5 hover:bg-primary-lime/10 transition-colors text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-lime/20 text-primary-lime flex items-center justify-center">
                  <Compass size={16} className="group-hover:rotate-45 transition-transform" />
                </div>
                <div>
                  <span className="text-[13px] font-bold text-text-primary block">
                    Interactive App Tour
                  </span>
                  <span className="text-[11px] text-primary-lime font-medium">
                    Guided walkthrough of all app features & advantages
                  </span>
                </div>
              </div>
              <ChevronRight size={16} className="text-primary-lime group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => setActiveModal("personal_info")}
              className="w-full p-4 flex items-center justify-between hover:bg-surface-raised transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-surface-raised flex items-center justify-center text-text-secondary">
                  <User size={16} />
                </div>
                <span className="text-[13px] font-bold text-text-primary">
                  Personal Info
                </span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </button>

            <button
              onClick={() => setActiveModal("payment_methods")}
              className="w-full p-4 flex items-center justify-between hover:bg-surface-raised transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-surface-raised flex items-center justify-center text-text-secondary">
                  <CreditCard size={16} />
                </div>
                <span className="text-[13px] font-bold text-text-primary">
                  Payment Methods
                </span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </button>

            <button
              onClick={() => setActiveModal("notifications")}
              className="w-full p-4 flex items-center justify-between hover:bg-surface-raised transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-surface-raised flex items-center justify-center text-text-secondary">
                  <Bell size={16} />
                </div>
                <span className="text-[13px] font-bold text-text-primary">
                  Notifications
                </span>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </button>

            <button
              onClick={() => setActiveModal("privacy_security")}
              className="w-full p-4 flex items-center justify-between hover:bg-surface-raised transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-surface-raised flex items-center justify-center text-text-secondary">
                  <Shield size={18} />
                </div>
                <span className="text-[13px] font-bold text-text-primary">
                  Privacy & Security
                </span>
              </div>
              <ChevronRight size={18} className="text-slate-400" />
            </button>

            <button
              onClick={() => setActiveModal("help_support")}
              className="w-full p-4 flex items-center justify-between hover:bg-surface-raised transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-surface-raised flex items-center justify-center text-text-secondary">
                  <HelpCircle size={18} />
                </div>
                <span className="text-[13px] font-bold text-text-primary">
                  Help & Support
                </span>
              </div>
              <ChevronRight size={18} className="text-slate-400" />
            </button>
          </div>

          {/* Active Slot Subscriptions */}
          {user && (
            <div className="space-y-3 pt-2">
              <h3 className="text-[13px] font-bold uppercase tracking-wider text-text-secondary px-1">
                Active Slot Alerts
              </h3>
              {loadingAlerts ? (
                <p className="text-[13px] font-medium text-slate-400 px-1">Loading alerts...</p>
              ) : activeAlerts.length === 0 ? (
                <div className="p-4 text-center text-[13px] font-medium text-text-secondary bg-surface-card rounded-2xl border border-border-subtle shadow-sm">
                  You are not subscribed to any slot open notifications yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {activeAlerts.map((alertItem) => (
                    <div
                      key={alertItem.id}
                      className="p-4 flex justify-between items-center bg-surface-card border border-border-subtle rounded-[20px] shadow-sm"
                    >
                      <div>
                        <p className="text-[15px] font-bold text-text-primary leading-tight">
                          {alertItem.pitchName}
                        </p>
                        <p className="text-[12px] font-medium text-slate-500 mt-0.5">
                          {alertItem.date} @ {alertItem.time}
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          if (window.confirm("Cancel alert notification for this slot?")) {
                            try {
                              await slotAlertService.unsubscribe(
                                user.uid,
                                alertItem.pitchId,
                                alertItem.date,
                                alertItem.time
                              );
                              setActiveAlerts((prev) =>
                                prev.filter((item) => item.id !== alertItem.id)
                              );
                            } catch (err) {
                              console.error("Error removing subscription:", err);
                            }
                          }
                        }}
                        className="text-[12px] font-bold text-red-500 hover:text-red-600 p-2 bg-red-50 dark:bg-red-900/10 rounded-[8px]"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="w-full mt-6 p-4 bg-surface-card rounded-full border border-red-500/20 text-red-500 text-[14px] font-bold flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors cursor-pointer shadow-sm active:scale-[0.98]"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>

        {/* 1. PERSONAL INFO MODAL */}
        {activeModal === "personal_info" && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-surface-card border border-border-subtle rounded-2xl w-full max-w-md p-4  shadow-xl max-h-[90vh] overflow-y-auto space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-border-subtle">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-lime/15 text-primary-lime flex items-center justify-center">
                    <User size={16} />
                  </div>
                  <h3 className="text-sm font-medium text-text-primary">
                    Personal information
                  </h3>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="w-7 h-7 rounded-full hover:bg-border-subtle flex items-center justify-center text-slate-400"
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-3.5">
                <div>
                  <label className="text-xs font-medium text-text-secondary block mb-1.5">
                    Select player avatar
                  </label>
                  <div className="grid grid-cols-5 gap-2 p-2 bg-surface-raised rounded-[12px] border border-border-subtle max-h-[140px] overflow-y-auto">
                    {AVATARS_LIST.map((av) => {
                      const isSelected = editAvatarId === av.id;
                      return (
                        <button
                          key={av.id}
                          type="button"
                          onClick={() => setEditAvatarId(av.id)}
                          className={`relative aspect-square rounded-full border-2 overflow-hidden flex items-center justify-center p-0.5 ${
                            isSelected
                              ? "border-primary-lime bg-primary-lime/10"
                              : "border-transparent opacity-70 hover:opacity-100"
                          }`}
                        >
                          <PlayerAvatar id={av.id} className="w-full h-full" />
                          {isSelected && (
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                              <Check size={12} className="text-primary-lime" strokeWidth={3} />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-text-secondary block mb-1">
                    Full name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="w-full h-10 px-3 rounded-[10px] bg-surface-raised border border-border-subtle text-xs text-text-primary focus:outline-none focus:border-primary-lime"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-text-secondary block mb-1">
                    Phone number
                  </label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="0770000000"
                    className="w-full h-10 px-3 rounded-[10px] bg-surface-raised border border-border-subtle text-xs text-text-primary focus:outline-none focus:border-primary-lime"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-text-secondary block mb-1">
                    Bio / Positions
                  </label>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="Midfielder, 7-a-side enthusiast..."
                    rows={2}
                    className="w-full p-2.5 rounded-[10px] bg-surface-raised border border-border-subtle text-xs text-text-primary focus:outline-none focus:border-primary-lime"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="py-2 px-4 rounded-full border border-border-subtle text-xs font-medium text-text-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="flex-1 py-2 rounded-full bg-primary-lime hover:bg-[#96E600] text-slate-950 text-xs font-medium transition-colors cursor-pointer"
                  >
                    {savingProfile ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 2. PAYMENT METHODS MODAL */}
        {activeModal === "payment_methods" && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-surface-card border border-border-subtle rounded-2xl w-full max-w-md p-4  shadow-xl max-h-[90vh] overflow-y-auto space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-border-subtle">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-lime/15 text-primary-lime flex items-center justify-center">
                    <CreditCard size={16} />
                  </div>
                  <h3 className="text-sm font-medium text-text-primary">
                    Payment methods
                  </h3>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="w-7 h-7 rounded-full hover:bg-border-subtle flex items-center justify-center text-slate-400"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Mobile Money Wallets */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-text-secondary">
                    Mobile money wallets
                  </span>
                  <button
                    onClick={() => setShowAddWallet(!showAddWallet)}
                    className="text-primary-lime font-medium flex items-center gap-1"
                  >
                    <Plus size={12} /> add new
                  </button>
                </div>

                {showAddWallet && (
                  <form onSubmit={handleAddWallet} className="p-3 bg-surface-raised rounded-[10px] border border-border-subtle space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setNewProvider("MTN MoMo")}
                        className={`py-1.5 rounded-[8px] border text-xs font-medium ${
                          newProvider === "MTN MoMo"
                            ? "bg-primary-lime/15 border-primary-lime text-primary-lime"
                            : "bg-surface-card border-border-subtle"
                        }`}
                      >
                        MTN MoMo
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewProvider("Airtel Money")}
                        className={`py-1.5 rounded-[8px] border text-xs font-medium ${
                          newProvider === "Airtel Money"
                            ? "bg-red-500/15 border-red-500 text-red-600"
                            : "bg-surface-card border-border-subtle"
                        }`}
                      >
                        Airtel Money
                      </button>
                    </div>
                    <input
                      type="tel"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="0770000000"
                      required
                      className="w-full h-9 px-3 text-xs rounded-[8px] bg-surface-card border border-border-subtle"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddWallet(false)}
                        className="px-3 py-1 text-xs rounded-[8px] border border-slate-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 text-xs rounded-[8px] bg-primary-lime text-slate-950 font-medium"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-1.5">
                  {savedWallets.map((w) => (
                    <div
                      key={w.id}
                      className="p-2.5 bg-surface-raised rounded-[10px] border border-border-subtle flex justify-between items-center text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            w.provider.includes("MTN") ? "bg-primary-lime" : "bg-red-500"
                          }`}
                        />
                        <div>
                          <span className="font-medium text-text-primary">
                            {w.phone}
                          </span>
                          <span className="text-[10px] text-slate-400 block">{w.provider}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteWallet(w.id)}
                        className="text-slate-400 hover:text-red-500 p-1"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transactions list */}
              <div className="space-y-2 pt-2 border-t border-border-subtle">
                <span className="text-xs font-medium text-text-secondary block">
                  Recent transactions
                </span>
                <div className="space-y-1.5">
                  <div className="p-2.5 bg-surface-raised rounded-[10px] flex justify-between items-center text-xs">
                    <div>
                      <p className="font-medium text-text-primary">
                        Lugogo Arena Booking
                      </p>
                      <p className="text-[10px] text-slate-400">10 Jul 2026 · MTN MoMo</p>
                    </div>
                    <span className="font-semibold text-text-primary">
                      UGX 75,000
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. NOTIFICATIONS MODAL */}
        {activeModal === "notifications" && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-surface-card border border-border-subtle rounded-2xl w-full max-w-md p-4  shadow-xl space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-border-subtle">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-lime/15 text-primary-lime flex items-center justify-center">
                    <Bell size={16} />
                  </div>
                  <h3 className="text-sm font-medium text-text-primary">
                    Notification preferences
                  </h3>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="w-7 h-7 rounded-full hover:bg-border-subtle flex items-center justify-center text-slate-400"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-white/5">
                <div className="py-2.5 flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-medium text-text-primary">
                      Slot availability alerts
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Immediate alert when subscribed slots free up.
                    </p>
                  </div>
                  <Toggle
                    checked={notifPreferences.slots}
                    onChange={() =>
                      setNotifPreferences({ ...notifPreferences, slots: !notifPreferences.slots })
                    }
                  />
                </div>

                <div className="py-2.5 flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-medium text-text-primary">
                      Kickoff reminders
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Alerts 2 hours before scheduled pitch games.
                    </p>
                  </div>
                  <Toggle
                    checked={notifPreferences.reminders}
                    onChange={() =>
                      setNotifPreferences({
                        ...notifPreferences,
                        reminders: !notifPreferences.reminders,
                      })
                    }
                  />
                </div>

                <div className="py-2.5 flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-medium text-text-primary">
                      Match invites
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      When other squads invite you to a game.
                    </p>
                  </div>
                  <Toggle
                    checked={notifPreferences.invites}
                    onChange={() =>
                      setNotifPreferences({ ...notifPreferences, invites: !notifPreferences.invites })
                    }
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSaveNotifs}
                  className="w-full py-2 rounded-full bg-primary-lime hover:bg-[#96E600] text-slate-950 text-xs font-medium transition-colors"
                >
                  Save preferences
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. PRIVACY & SECURITY MODAL */}
        {activeModal === "privacy_security" && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-surface-card border border-border-subtle rounded-2xl w-full max-w-md p-4  shadow-xl space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-border-subtle">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-lime/15 text-primary-lime flex items-center justify-center">
                    <Shield size={16} />
                  </div>
                  <h3 className="text-sm font-medium text-text-primary">
                    Privacy & security
                  </h3>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="w-7 h-7 rounded-full hover:bg-border-subtle flex items-center justify-center text-slate-400"
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleSavePrivacy} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-text-secondary block mb-1">
                    Profile visibility
                  </label>
                  <select
                    value={profileVisibility}
                    onChange={(e) => setProfileVisibility(e.target.value)}
                    className="w-full h-10 px-3 rounded-[10px] bg-surface-raised border border-border-subtle text-xs"
                  >
                    <option value="public">Public (Searchable by all players)</option>
                    <option value="teams">Squads only (Teammates only)</option>
                    <option value="private">Hidden (Private profile)</option>
                  </select>
                </div>

                <div className="py-2 flex justify-between items-center border-t border-border-subtle">
                  <div>
                    <h4 className="text-xs font-medium text-text-primary">
                      Two-factor login
                    </h4>
                    <p className="text-[11px] text-slate-500">Verify login via SMS code.</p>
                  </div>
                  <Toggle
                    checked={twoFactorEnabled}
                    onChange={() => setTwoFactorEnabled(!twoFactorEnabled)}
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2 rounded-full bg-primary-lime hover:bg-[#96E600] text-accent-text text-xs font-bold transition-colors"
                  >
                    Save privacy settings
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 5. HELP & SUPPORT MODAL */}
        {activeModal === "help_support" && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-surface-card border border-border-subtle rounded-2xl w-full max-w-md p-4  shadow-xl max-h-[90vh] overflow-y-auto space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-border-subtle">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-lime/15 text-primary-lime flex items-center justify-center">
                    <HelpCircle size={16} />
                  </div>
                  <h3 className="text-sm font-medium text-text-primary">
                    Help & support
                  </h3>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="w-7 h-7 rounded-full hover:bg-border-subtle flex items-center justify-center text-slate-400"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Interactive App Tour launcher inside Help modal */}
              <div className="p-3.5 rounded-xl bg-primary-lime/10 border border-primary-lime/30 flex items-center justify-between gap-3 text-left">
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-primary-lime flex items-center gap-1">
                    <Sparkles size={12} />
                    Guided Tour
                  </span>
                  <p className="text-xs font-bold text-text-primary">
                    Need a quick refresher on using Footlink?
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveModal(null);
                    startWalkthrough(0);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-primary-lime hover:bg-[#96E600] text-accent-text text-xs font-bold shrink-0 flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-xs"
                >
                  <Compass size={13} />
                  <span>Start Tour</span>
                </button>
              </div>

              {/* FAQs */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-text-secondary block">
                  Frequently asked questions
                </span>
                {[
                  {
                    q: "How do slot alerts work?",
                    a: "When a pitch slot you subscribed to is cancelled or released by another player, you receive an immediate SMS alert.",
                  },
                  {
                    q: "What is the cancellation policy?",
                    a: "Cancellations made 12+ hours before kickoff receive an instant 100% refund.",
                  },
                ].map((faq, idx) => {
                  const isOpen = faqOpenIndex === idx;
                  return (
                    <div
                      key={idx}
                      className="rounded-xl border border-border-subtle overflow-hidden text-xs"
                    >
                      <button
                        type="button"
                        onClick={() => setFaqOpenIndex(isOpen ? null : idx)}
                        className="w-full p-3 bg-surface-raised text-left flex justify-between items-center"
                      >
                        <span className="font-medium text-text-primary">{faq.q}</span>
                        <ChevronRight
                          size={14}
                          className={`text-slate-400 transition-transform ${
                            isOpen ? "rotate-90" : ""
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div className="p-3 bg-surface-card text-text-secondary border-t border-border-subtle">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Submit Ticket */}
              <form onSubmit={handleSendTicket} className="space-y-2 pt-2 border-t border-border-subtle">
                <span className="text-xs font-medium text-text-secondary block">
                  Contact support team
                </span>
                <input
                  type="text"
                  placeholder="Subject"
                  value={supportSubject}
                  onChange={(e) => setSupportSubject(e.target.value)}
                  required
                  className="w-full h-9 px-3 rounded-xl bg-surface-raised border border-border-subtle text-xs"
                />
                <textarea
                  placeholder="Describe your question or issue..."
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  required
                  rows={2}
                  className="w-full p-2.5 rounded-xl bg-surface-raised border border-border-subtle text-xs"
                />
                <button
                  type="submit"
                  disabled={supportSuccess}
                  className="w-full py-2 rounded-full bg-primary-lime hover:bg-[#96E600] text-accent-text text-xs font-bold transition-colors"
                >
                  {supportSuccess ? "Submitting..." : "Send message"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Profile;
