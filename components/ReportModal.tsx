import React, { useState } from "react";
import { useUser } from "../context/UserContext";
import { adminService } from "../services/adminService";
import { ReportStatus, ReportTargetType } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle, 
  Loader2,
  HelpCircle
} from "lucide-react";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  reporterRole: "player" | "owner";
}

const REASONS = [
  "Inappropriate content",
  "No-show",
  "Safety concern",
  "Payment dispute unrelated to proof",
  "Other"
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  reporterRole
}) => {
  const { user } = useUser();
  const [reason, setReason] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("You must be logged in to file a report.");
      return;
    }
    if (!reason) {
      setError("Please select a reason.");
      return;
    }
    if (!description.trim() || description.length < 10) {
      setError("Please provide a detailed description (at least 10 characters).");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await adminService.createReport({
        reporterId: user.uid,
        reporterRole,
        targetType,
        targetId,
        reason,
        description: description.trim(),
        status: ReportStatus.OPEN,
        createdAt: new Date().toISOString()
      });
      setSubmitted(true);
    } catch (err: any) {
      console.error("Failed to submit report", err);
      setError("Something went wrong while submitting the report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setReason("");
    setDescription("");
    setError("");
    setSubmitted(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleResetAndClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.3 }}
          className="relative w-full max-w-md bg-surface-card rounded-[2rem] border border-border-subtle shadow-2xl overflow-hidden z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-50 dark:bg-red-950/30 rounded-[12px] text-red-500">
                <ShieldAlert size={20} />
              </div>
              <h2 className="text-lg font-black uppercase tracking-tight text-text-primary">
                Report an Issue
              </h2>
            </div>
            <button
              onClick={handleResetAndClose}
              className="p-1.5 rounded-full hover:bg-border-subtle text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-4">
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4 space-y-4"
              >
                <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle size={36} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black uppercase tracking-tight text-text-primary">
                    Report Submitted
                  </h3>
                  <p className="text-sm text-text-secondary">
                    Report submitted, our team will review it. Thank you for helping keep our community safe.
                  </p>
                </div>
                <button
                  onClick={handleResetAndClose}
                  className="mt-4 px-4 py-2.5 bg-primary-lime text-accent-text font-bold text-xs uppercase tracking-wider rounded-[12px] hover:bg-slate-800 transition-all active:scale-[0.98]"
                >
                  Close Window
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-left">
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-[12px] text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Target Type/Id Indicator */}
                <div className="bg-surface-raised/40 p-3.5 rounded-[16px] border border-border-subtle text-xs text-text-secondary flex items-center justify-between">
                  <span>Reporting: <strong className="text-text-primary capitalize">{targetType}</strong></span>
                  <span className="font-mono text-[10px]">ID: {targetId.substring(0, 8)}...</span>
                </div>

                {/* Reason Selection */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">
                    Select Reason
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    className="w-full bg-surface-raised border border-border-subtle rounded-[12px] px-4 py-3 text-xs text-text-primary font-bold outline-none focus:border-red-500/50 appearance-none"
                    style={{ backgroundImage: 'url("data:image/svg+xml;utf8,<svg fill=\'%23a1a1aa\' height=\'24\' viewBox=\'0 0 24 24\' width=\'24\' xmlns=\'http://www.w3.org/2000/svg\'><path d=\'M7 10l5 5 5-5z\'/></svg>")', backgroundPosition: 'right 12px center', backgroundRepeat: 'no-repeat' }}
                  >
                    <option value="" disabled>-- Choose a reason --</option>
                    {REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description Text */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">
                    Detailed Complaint Description
                  </label>
                  <textarea
                    placeholder="Provide clear details, dates, or context regarding the issue to help our moderation team review it..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows={4}
                    className="w-full bg-surface-raised border border-border-subtle rounded-[12px] px-4 py-3 text-xs text-text-primary font-medium outline-none focus:border-red-500/50 resize-none leading-relaxed"
                  />
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[9px] text-slate-400">
                      Minimum 10 characters
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">
                      {description.length} chars
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleResetAndClose}
                    className="flex-1 py-3 border border-border-subtle rounded-[12px] text-text-secondary font-bold text-xs uppercase tracking-wider hover:bg-surface-raised transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-[12px] font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50 active:scale-[0.98] flex items-center justify-center gap-1.5 shadow-md shadow-red-600/10"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Report"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
