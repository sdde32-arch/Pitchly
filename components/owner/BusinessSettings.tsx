import React, { useEffect, useState } from "react";
import {
  Settings,
  Save,
  Smartphone,
  Building,
  CheckCircle,
  Loader2,
  Clock,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Mail,
  Phone,
  Banknote,
  CheckCircle2,
  Info
} from "lucide-react";
import { OwnerService } from "../../services/owner";
import { BusinessProfile } from "../../types";
import { useUser } from "../../context/UserContext";

export const BusinessSettings: React.FC = () => {
  const { loading: authLoading } = useUser();
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pricePerHour, setPricePerHour] = useState<number>(100000);
  const [pricingSuggestion, setPricingSuggestion] = useState<string>("");
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);

  const [formData, setFormData] = useState<BusinessProfile>({
    businessName: "",
    contactEmail: "",
    contactPhone: "",
    mobileMoneyNumber: "",
    operatingHours: { open: "07:00", close: "23:00" },
    paymentDetails: {
      mtnNumber: "",
      mtnAccountName: "",
      airtelNumber: "",
      airtelAccountName: "",
      acceptsCash: true,
    },
  });

  useEffect(() => {
    if (authLoading) return;
    const load = async () => {
      const data = await OwnerService.getBusinessProfile();
      setFormData({
        ...data,
        paymentDetails: data.paymentDetails || {
          mtnNumber: "",
          mtnAccountName: "",
          airtelNumber: "",
          airtelAccountName: "",
          acceptsCash: true,
        },
      });

      try {
        const turfs = await OwnerService.getPitches();
        if (turfs && turfs.length > 0) {
          setPricePerHour(turfs[0].pricePerHour);
        }
      } catch (e) {
        console.log(e);
      }
      setIsLoading(false);
    };
    load();
  }, [authLoading]);

  const handleChange = (field: keyof BusinessProfile, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleHoursChange = (type: "open" | "close", value: string) => {
    setFormData((prev) => ({
      ...prev,
      operatingHours: { ...prev.operatingHours, [type]: value },
    }));
  };

  const handleGetPricingSuggestion = async () => {
    setLoadingSuggestion(true);
    setPricingSuggestion("");
    let stats = { occupancyRate: 45 };
    let firstTurfLocation = "Kampala, Uganda";
    try {
      const dashboard = await OwnerService.getDashboardStats();
      if (dashboard) {
        stats = dashboard;
      }
      const turfs = await OwnerService.getPitches();
      if (turfs && turfs.length > 0) {
        firstTurfLocation = turfs[0].location;
      }
    } catch (e) {
      console.log("Could not load stats for suggestion:", e);
    }
    setTimeout(() => {
      const suggestion =
        stats.occupancyRate < 40
          ? `Based on ${stats.occupancyRate}% current occupancy in ${firstTurfLocation}, we recommend an introductory rate of UGX 90,000/hr (Off-Peak) and UGX 110,000/hr (Peak) to drive weekday booking volume.`
          : `With strong occupancy (${stats.occupancyRate}%) in ${firstTurfLocation}, we recommend setting peak evening slots to UGX 130,000/hr to maximize prime-time slot revenue.`;
      setPricingSuggestion(suggestion);
      setLoadingSuggestion(false);
    }, 350);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await OwnerService.updateBusinessProfile(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
      alert("Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-surface-card rounded-2xl p-6 border border-border-subtle h-48 animate-pulse" />
        <div className="bg-surface-card rounded-2xl p-6 border border-border-subtle h-48 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn font-sans max-w-4xl w-full">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-card border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary-lime/10 text-primary-lime border border-primary-lime/30 uppercase tracking-wider">
              Facility Configuration
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight mt-1">
            Business Settings
          </h1>
          <p className="text-xs text-text-secondary">
            Manage your sports business profile, payout numbers, and operating schedule.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-5 py-2.5 bg-primary-lime hover:bg-[#96E600] text-accent-text font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm shadow-primary-lime/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : saved ? (
            <CheckCircle2 size={16} />
          ) : (
            <Save size={16} />
          )}
          <span>{isSaving ? "Saving..." : saved ? "Saved!" : "Save Changes"}</span>
        </button>
      </div>

      {/* SECTION 1: BUSINESS & CONTACT INFO */}
      <div className="bg-surface-card rounded-2xl p-4 sm:p-6 border border-border-subtle space-y-5 shadow-sm">
        <div className="border-b border-border-subtle pb-3">
          <h2 className="text-sm sm:text-base font-extrabold text-text-primary flex items-center gap-2">
            <Building size={16} className="text-[#38BDF8]" />
            <span>Business Information</span>
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Details shown to players on pitch receipts and booking confirmation notices.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block">
              Business / Arena Name
            </label>
            <div className="flex items-center bg-surface-raised rounded-xl px-3.5 border border-border-subtle focus-within:border-[#38BDF8] min-h-[46px]">
              <Building size={16} className="text-text-tertiary mr-2.5 shrink-0" />
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => handleChange("businessName", e.target.value)}
                placeholder="e.g. Kampala Central Sports Complex"
                className="bg-transparent w-full text-xs sm:text-sm font-bold outline-none text-text-primary placeholder:text-text-tertiary"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block">
              Contact Email
            </label>
            <div className="flex items-center bg-surface-raised rounded-xl px-3.5 border border-border-subtle focus-within:border-[#38BDF8] min-h-[46px]">
              <Mail size={16} className="text-text-tertiary mr-2.5 shrink-0" />
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => handleChange("contactEmail", e.target.value)}
                placeholder="owner@sportscomplex.ug"
                className="bg-transparent w-full text-xs sm:text-sm font-bold outline-none text-text-primary placeholder:text-text-tertiary"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block">
              Contact Phone (Player Inquiries)
            </label>
            <div className="flex items-center bg-surface-raised rounded-xl px-3.5 border border-border-subtle focus-within:border-[#38BDF8] min-h-[46px]">
              <Phone size={16} className="text-text-tertiary mr-2.5 shrink-0" />
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => handleChange("contactPhone", e.target.value)}
                placeholder="e.g. 0772 123 456"
                className="bg-transparent w-full text-xs sm:text-sm font-bold outline-none text-text-primary placeholder:text-text-tertiary"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: OPERATING HOURS & PRICING OPTIMIZER */}
      <div className="bg-surface-card rounded-2xl p-4 sm:p-6 border border-border-subtle space-y-5 shadow-sm">
        <div className="border-b border-border-subtle pb-3">
          <h2 className="text-sm sm:text-base font-extrabold text-text-primary flex items-center gap-2">
            <Clock size={16} className="text-primary-lime" />
            <span>Operating Schedule & Pricing</span>
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Default operating window for slot generation and AI pricing coaching.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Operating Hours */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block">
              Daily Facility Hours
            </label>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex-1 flex items-center bg-surface-raised rounded-xl px-3 border border-border-subtle focus-within:border-primary-lime min-h-[46px]">
                <Clock size={15} className="text-text-tertiary mr-2 shrink-0" />
                <input
                  type="time"
                  value={formData.operatingHours.open}
                  onChange={(e) => handleHoursChange("open", e.target.value)}
                  className="bg-transparent w-full text-xs sm:text-sm font-bold outline-none text-text-primary"
                />
              </div>
              <span className="text-xs font-bold text-text-tertiary uppercase">to</span>
              <div className="flex-1 flex items-center bg-surface-raised rounded-xl px-3 border border-border-subtle focus-within:border-primary-lime min-h-[46px]">
                <Clock size={15} className="text-text-tertiary mr-2 shrink-0" />
                <input
                  type="time"
                  value={formData.operatingHours.close}
                  onChange={(e) => handleHoursChange("close", e.target.value)}
                  className="bg-transparent w-full text-xs sm:text-sm font-bold outline-none text-text-primary"
                />
              </div>
            </div>
          </div>

          {/* Pricing Optimizer Module */}
          <div className="space-y-2 sm:col-span-2 pt-2 border-t border-border-subtle">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                Default Price Per Hour (UGX)
              </label>
              <button
                type="button"
                onClick={handleGetPricingSuggestion}
                disabled={loadingSuggestion}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#38BDF8]/10 hover:bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/30 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-50 self-start sm:self-auto"
              >
                {loadingSuggestion ? (
                  <RefreshCw size={13} className="animate-spin" />
                ) : (
                  <TrendingUp size={13} />
                )}
                <span>Rate Benchmark</span>
              </button>
            </div>

            <div className="flex items-center bg-surface-raised rounded-xl px-3.5 border border-border-subtle focus-within:border-primary-lime min-h-[46px]">
              <DollarSign size={16} className="text-text-tertiary mr-2.5 shrink-0" />
              <input
                type="number"
                value={pricePerHour}
                onChange={(e) => setPricePerHour(parseInt(e.target.value) || 0)}
                className="bg-transparent w-full text-xs sm:text-sm font-bold outline-none text-text-primary"
              />
            </div>

            {/* Market Rate Suggestion Banner */}
            {pricingSuggestion && (
              <div className="bg-[#38BDF8]/10 border border-[#38BDF8]/30 rounded-xl p-3.5 flex gap-3 animate-fadeIn mt-2">
                <TrendingUp size={18} className="text-[#38BDF8] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#38BDF8] block">
                    Occupancy & Pricing Benchmark
                  </span>
                  <p className="text-xs text-text-primary leading-relaxed">
                    {pricingSuggestion}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 3: MOBILE MONEY PAYOUT ACCOUNTS */}
      <div className="bg-surface-card rounded-2xl p-4 sm:p-6 border border-border-subtle space-y-5 shadow-sm">
        <div className="border-b border-border-subtle pb-3">
          <h2 className="text-sm sm:text-base font-extrabold text-text-primary flex items-center gap-2">
            <Smartphone size={16} className="text-[#FACC15]" />
            <span>Mobile Money Payout Accounts</span>
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Your registered MTN and Airtel Mobile Money numbers for automated booking withdrawals.
          </p>
        </div>

        {/* MTN MoMo */}
        <div className="space-y-2 p-3.5 bg-surface-raised rounded-xl border border-border-subtle">
          <span className="text-xs font-bold text-[#FACC15] uppercase tracking-wider block">
            MTN Mobile Money
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="MTN Phone (e.g. 0772 000 111)"
              value={formData.paymentDetails?.mtnNumber || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  paymentDetails: {
                    ...prev.paymentDetails!,
                    mtnNumber: e.target.value,
                  },
                }))
              }
              className="bg-surface-card rounded-xl px-3.5 py-2.5 border border-border-subtle text-xs sm:text-sm font-bold text-text-primary outline-none focus:border-[#FACC15] placeholder:text-text-tertiary"
            />
            <input
              type="text"
              placeholder="Registered Name (e.g. JOHN DOE)"
              value={formData.paymentDetails?.mtnAccountName || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  paymentDetails: {
                    ...prev.paymentDetails!,
                    mtnAccountName: e.target.value,
                  },
                }))
              }
              className="bg-surface-card rounded-xl px-3.5 py-2.5 border border-border-subtle text-xs sm:text-sm font-bold text-text-primary outline-none focus:border-[#FACC15] placeholder:text-text-tertiary"
            />
          </div>
        </div>

        {/* Airtel Money */}
        <div className="space-y-2 p-3.5 bg-surface-raised rounded-xl border border-border-subtle">
          <span className="text-xs font-bold text-[#EF4444] uppercase tracking-wider block">
            Airtel Money
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Airtel Phone (e.g. 0752 000 222)"
              value={formData.paymentDetails?.airtelNumber || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  paymentDetails: {
                    ...prev.paymentDetails!,
                    airtelNumber: e.target.value,
                  },
                }))
              }
              className="bg-surface-card rounded-xl px-3.5 py-2.5 border border-border-subtle text-xs sm:text-sm font-bold text-text-primary outline-none focus:border-[#EF4444] placeholder:text-text-tertiary"
            />
            <input
              type="text"
              placeholder="Registered Name (e.g. JANE DOE)"
              value={formData.paymentDetails?.airtelAccountName || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  paymentDetails: {
                    ...prev.paymentDetails!,
                    airtelAccountName: e.target.value,
                  },
                }))
              }
              className="bg-surface-card rounded-xl px-3.5 py-2.5 border border-border-subtle text-xs sm:text-sm font-bold text-text-primary outline-none focus:border-[#EF4444] placeholder:text-text-tertiary"
            />
          </div>
        </div>

        {/* Cash on Arrival Toggle */}
        <div className="pt-2 border-t border-border-subtle">
          <label className="flex items-center justify-between p-3.5 bg-surface-raised rounded-xl border border-border-subtle cursor-pointer select-none">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-surface-card flex items-center justify-center text-[#22C55E] border border-border-subtle">
                <Banknote size={18} />
              </div>
              <div>
                <span className="text-xs font-bold text-text-primary block">
                  Allow Pay On Arrival (Cash)
                </span>
                <span className="text-[11px] text-text-tertiary">
                  Players can reserve a slot and settle payment directly at the turf desk.
                </span>
              </div>
            </div>

            <div className="relative inline-flex items-center">
              <input
                type="checkbox"
                checked={formData.paymentDetails?.acceptsCash || false}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    paymentDetails: {
                      ...prev.paymentDetails!,
                      acceptsCash: e.target.checked,
                    },
                  }))
                }
                className="sr-only"
              />
              <div
                className={`w-11 h-6 rounded-full transition-colors ${
                  formData.paymentDetails?.acceptsCash
                    ? "bg-primary-lime"
                    : "bg-surface-card border border-border-subtle"
                }`}
              />
              <div
                className={`absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-xs ${
                  formData.paymentDetails?.acceptsCash ? "translate-x-5" : ""
                }`}
              />
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};
