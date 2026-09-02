import React, { useState, useEffect } from "react";
import { useUser } from "../../context/UserContext";
import { adminService } from "../../services/adminService";
import {
  Settings,
  Save,
  AlertCircle,
  Percent,
  Phone,
  MessageCircle,
  Mail,
  ShieldAlert,
  Database,
  RefreshCw,
  Play,
  CheckCircle,
  Sliders,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { migrateBookings } from "../../scripts/migrateBookings";

export const PlatformSettings: React.FC = () => {
  const { user, isSuperAdmin, isAdmin, loading: authLoading } = useUser();
  const [settings, setSettings] = useState<any>({
    commissionRate: 10,
    supportPhone: "",
    supportWhatsapp: "",
    supportEmail: "",
    bookingCancellationPolicy: "Free cancellation up to 24 hours before the booking.",
    paymentDisclaimer: "All payments are subject to review.",
    featuredPitchEnabled: true,
    featuredPitchLimit: 5,
    maintenanceMode: false,
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [migrationLoading, setMigrationLoading] = useState(false);
  const [nonConformingCount, setNonConformingCount] = useState<number | null>(null);
  const [totalBookingsCount, setTotalBookingsCount] = useState<number | null>(null);
  const [migrationResult, setMigrationResult] = useState<any>(null);

  useEffect(() => {
    if (authLoading) return;
    if (isAdmin) {
      fetchSettings();
      checkMigrationStatus();
    }
  }, [isAdmin, authLoading]);

  const checkMigrationStatus = async () => {
    try {
      const snapshot = await getDocs(collection(db, "bookings"));
      setTotalBookingsCount(snapshot.size);

      let count = 0;
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const status = data.status;
        const paymentMethod = data.paymentMethod;

        const isStatusUppercase =
          typeof status === "string" &&
          status === status.toUpperCase() &&
          status.length > 0;
        const isPaymentUppercase =
          typeof paymentMethod === "string" &&
          paymentMethod === paymentMethod.toUpperCase() &&
          paymentMethod.length > 0;

        if (!isStatusUppercase || !isPaymentUppercase) {
          count++;
        }
      });
      setNonConformingCount(count);
    } catch (error) {
      console.error("Failed to check migration status:", error);
    }
  };

  const handleRunMigration = async () => {
    if (!window.confirm("Are you sure you want to run the database casing normalization migration?"))
      return;
    setMigrationLoading(true);
    setMigrationResult(null);
    try {
      const res = await migrateBookings();
      setMigrationResult(res);
      await checkMigrationStatus();
      alert(`Migration completed! Processed ${res.processed} bookings, updated ${res.updated}.`);
    } catch (error: any) {
      alert(`Migration failed: ${error.message || error}`);
    } finally {
      setMigrationLoading(false);
    }
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await adminService.getPlatformSettings();
      if (data) {
        setSettings((prev: any) => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error("Failed to fetch settings", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setSettings((prev: any) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else if (type === "number") {
      setSettings((prev: any) => ({ ...prev, [name]: Number(value) }));
    } else {
      setSettings((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    if (!user || (!isSuperAdmin && !isAdmin)) return;

    if (!isSuperAdmin) {
      alert("Only Super Admins can update platform settings.");
      return;
    }

    if (!window.confirm("Are you sure you want to update global platform settings?"))
      return;
    setIsSaving(true);
    try {
      await adminService.updatePlatformSettings(user.uid, settings);
      alert("Platform settings updated successfully!");
    } catch (error) {
      alert("Failed to update platform settings. See console for details.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="p-2 sm:p-4 max-w-5xl mx-auto space-y-6 pb-24 font-sans text-text-primary">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-surface-raised text-text-secondary border border-border-subtle uppercase tracking-wider">
              Global Architecture
            </span>
            <span className="text-xs text-text-tertiary font-medium">
              System Parameters &amp; Commission
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            Platform Settings
          </h1>
          <p className="text-xs text-text-secondary font-medium">
            Configure system-wide commission rates, customer support phone lines, cancellation policy, and database normalization.
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-lime hover:bg-primary-lime/90 text-accent-text rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 self-start sm:self-auto shadow-xs"
          >
            <Save size={14} />
            <span>{isSaving ? "Saving..." : "Save Settings"}</span>
          </button>
        )}
      </div>

      {!isSuperAdmin && (
        <div className="bg-[#A78BFA]/10 border border-[#A78BFA]/30 p-4 rounded-2xl flex items-center gap-3">
          <ShieldAlert size={20} className="text-[#A78BFA] shrink-0" />
          <p className="text-xs text-text-primary font-medium">
            You are viewing settings in <strong className="text-[#A78BFA]">Read-Only Mode</strong>. Super Admin privilege is required to save changes.
          </p>
        </div>
      )}

      {/* Main Settings Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Commission & Monetization */}
        <div className="bg-surface-card rounded-2xl p-4 sm:p-5 border border-border-subtle shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
            <Percent size={18} className="text-primary-lime" />
            <h2 className="text-sm font-bold text-text-primary">Monetization &amp; Fee Take</h2>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-text-secondary">
              Platform Take Commission Rate (%)
            </label>
            <div className="relative">
              <input
                type="number"
                name="commissionRate"
                min="0"
                max="100"
                value={settings.commissionRate}
                onChange={handleChange}
                disabled={!isSuperAdmin}
                className="w-full bg-surface-raised border border-border-subtle rounded-xl p-3 text-xs text-text-primary font-bold outline-none focus:border-primary-lime"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-text-tertiary">
                %
              </span>
            </div>
            <p className="text-[11px] text-text-tertiary">
              Percentage retained from pitch bookings. Standard rate is 10%.
            </p>
          </div>
        </div>

        {/* Support Channels */}
        <div className="bg-surface-card rounded-2xl p-4 sm:p-5 border border-border-subtle shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
            <Phone size={18} className="text-[#38BDF8]" />
            <h2 className="text-sm font-bold text-text-primary">Help &amp; Support Channels</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-text-secondary block mb-1">
                Official Support Phone
              </label>
              <input
                type="text"
                name="supportPhone"
                placeholder="+256 700 000000"
                value={settings.supportPhone || ""}
                onChange={handleChange}
                disabled={!isSuperAdmin}
                className="w-full bg-surface-raised border border-border-subtle rounded-xl p-3 text-text-primary font-medium outline-none focus:border-[#38BDF8]"
              />
            </div>

            <div>
              <label className="font-bold text-text-secondary block mb-1">
                WhatsApp Support Number
              </label>
              <input
                type="text"
                name="supportWhatsapp"
                placeholder="+256 700 000000"
                value={settings.supportWhatsapp || ""}
                onChange={handleChange}
                disabled={!isSuperAdmin}
                className="w-full bg-surface-raised border border-border-subtle rounded-xl p-3 text-text-primary font-medium outline-none focus:border-[#38BDF8]"
              />
            </div>

            <div>
              <label className="font-bold text-text-secondary block mb-1">
                Support Email Address
              </label>
              <input
                type="email"
                name="supportEmail"
                placeholder="support@pitchly.ug"
                value={settings.supportEmail || ""}
                onChange={handleChange}
                disabled={!isSuperAdmin}
                className="w-full bg-surface-raised border border-border-subtle rounded-xl p-3 text-text-primary font-medium outline-none focus:border-[#38BDF8]"
              />
            </div>
          </div>
        </div>

        {/* Booking Policies */}
        <div className="bg-surface-card rounded-2xl p-4 sm:p-5 border border-border-subtle shadow-xs space-y-4 md:col-span-2">
          <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
            <Sliders size={18} className="text-[#A78BFA]" />
            <h2 className="text-sm font-bold text-text-primary">Policies &amp; Disclaimers</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-text-secondary block mb-1">
                Cancellation &amp; Refund Policy Text
              </label>
              <textarea
                name="bookingCancellationPolicy"
                value={settings.bookingCancellationPolicy || ""}
                onChange={handleChange}
                disabled={!isSuperAdmin}
                rows={3}
                className="w-full bg-surface-raised border border-border-subtle rounded-xl p-3 text-text-primary font-medium outline-none focus:border-[#A78BFA] resize-none"
              />
            </div>

            <div>
              <label className="font-bold text-text-secondary block mb-1">
                Payment Disclaimer Note
              </label>
              <textarea
                name="paymentDisclaimer"
                value={settings.paymentDisclaimer || ""}
                onChange={handleChange}
                disabled={!isSuperAdmin}
                rows={3}
                className="w-full bg-surface-raised border border-border-subtle rounded-xl p-3 text-text-primary font-medium outline-none focus:border-[#A78BFA] resize-none"
              />
            </div>
          </div>
        </div>

        {/* Database Migration & Diagnostic Tools */}
        <div className="bg-surface-card rounded-2xl p-4 sm:p-5 border border-border-subtle shadow-xs space-y-4 md:col-span-2">
          <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
            <Database size={18} className="text-[#22C55E]" />
            <h2 className="text-sm font-bold text-text-primary">System Integrity &amp; Migration</h2>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface-raised p-4 rounded-xl border border-border-subtle">
            <div>
              <h3 className="text-xs font-bold text-text-primary">
                Schema Standardization (Uppercase Status Migration)
              </h3>
              <p className="text-[11px] text-text-secondary mt-0.5">
                Total bookings: {totalBookingsCount ?? "..."} | Inconsistent records:{" "}
                <span className="font-bold text-primary-lime">{nonConformingCount ?? "0"}</span>
              </p>
            </div>

            <button
              onClick={handleRunMigration}
              disabled={migrationLoading || !isSuperAdmin}
              className="flex items-center gap-2 px-3.5 py-2 bg-surface-card hover:bg-border-subtle border border-border-subtle rounded-xl text-xs font-bold text-text-primary transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={13} className={migrationLoading ? "animate-spin" : ""} />
              <span>{migrationLoading ? "Running..." : "Run Schema Normalization"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
