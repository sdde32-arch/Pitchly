import React, { useState, useEffect } from "react";
import { useUser } from "../../context/UserContext";
import { adminService } from "../../services/adminService";
import { Report, ReportStatus, ReportTargetType } from "../../types";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import {
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  User,
  MapPin,
  CalendarDays,
  FileText,
  ExternalLink,
  ChevronRight,
  Sparkles,
  ArrowRight,
  X,
  UserCheck,
  Check,
  CornerDownRight,
  FileQuestion,
  Download,
} from "lucide-react";

export const Reports: React.FC = () => {
  const { user, isAdmin, loading: authLoading } = useUser();
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Selection & Details
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [reporterDetails, setReporterDetails] = useState<any>(null);
  const [targetDetails, setTargetDetails] = useState<any>(null);

  // Update state
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await adminService.listReports();
      setReports(data);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (isAdmin) {
      fetchReports();
    }
  }, [isAdmin, authLoading]);

  useEffect(() => {
    let result = [...reports];
    if (statusFilter !== "all") {
      result = result.filter((r) => r.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.reason.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.reporterId.toLowerCase().includes(q) ||
          r.targetId.toLowerCase().includes(q),
      );
    }
    setFilteredReports(result);
  }, [reports, statusFilter, searchQuery]);

  const fetchReportDetails = async (report: Report) => {
    setLoadingDetails(true);
    try {
      if (report.reporterId) {
        const uDoc = await getDoc(doc(db, "users", report.reporterId));
        if (uDoc.exists()) setReporterDetails({ id: uDoc.id, ...uDoc.data() });
      }
      if (report.targetType === ReportTargetType.USER && report.targetId) {
        const tDoc = await getDoc(doc(db, "users", report.targetId));
        if (tDoc.exists()) setTargetDetails({ id: tDoc.id, ...tDoc.data() });
      } else if (report.targetType === ReportTargetType.PITCH && report.targetId) {
        const pDoc = await getDoc(doc(db, "pitches", report.targetId));
        if (pDoc.exists()) setTargetDetails({ id: pDoc.id, ...pDoc.data() });
      }
    } catch (err) {
      console.error("Failed to load details", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSelectReport = (report: Report) => {
    setSelectedReport(report);
    fetchReportDetails(report);
  };

  const handleUpdateStatus = async (newStatus: ReportStatus) => {
    if (!user || !selectedReport) return;
    setIsUpdating(true);
    try {
      await adminService.updateReportStatus(
        selectedReport.id,
        newStatus,
        resolutionNotes,
        user.uid,
        user.email || undefined,
      );
      setSuccessMessage(`Report marked as ${newStatus}`);
      setTimeout(() => setSuccessMessage(""), 3000);
      setSelectedReport(null);
      fetchReports();
    } catch (err) {
      console.error(err);
      alert("Failed to update report status.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ["ID,TargetType,TargetID,Reason,Status,CreatedAt"];
    const rows = filteredReports.map((r) =>
      [
        `"${r.id || ""}"`,
        `"${r.targetType || ""}"`,
        `"${r.targetId || ""}"`,
        `"${r.reason || ""}"`,
        `"${r.status || ""}"`,
        `"${r.createdAt || ""}"`,
      ].join(","),
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pitchly-reports-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAdmin) return null;

  return (
    <div className="p-2 sm:p-4 max-w-7xl mx-auto space-y-6 pb-24 font-sans text-text-primary">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FACC15]/10 text-[#FACC15] border border-[#FACC15]/30 uppercase tracking-wider">
              Moderation Desk
            </span>
            <span className="text-xs text-text-tertiary font-medium">
              Community Integrity &amp; Infraction Reports
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            User Reports
          </h1>
          <p className="text-xs text-text-secondary font-medium">
            Investigate reported players, pitch condition complaints, match cancellations, and offensive behaviors.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-3.5 py-2 bg-surface-card hover:bg-surface-raised border border-border-subtle hover:border-border-prominent rounded-xl text-xs font-bold text-text-secondary hover:text-text-primary transition-all cursor-pointer self-start sm:self-auto"
        >
          <Download size={14} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-surface-card rounded-2xl p-4 border border-border-subtle shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary"
            />
            <input
              type="text"
              placeholder="Search reports by reason, reporter, or target..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-raised border border-border-subtle rounded-xl pl-10 pr-4 py-2.5 text-xs text-text-primary font-semibold outline-none focus:border-[#FACC15] transition-colors"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface-raised border border-border-subtle rounded-xl px-3 py-2.5 text-xs text-text-primary font-bold outline-none focus:border-[#FACC15] cursor-pointer"
          >
            <option value="all">All Report Statuses</option>
            <option value="pending">Pending</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>
      </div>

      {/* Reports Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#FACC15] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="bg-surface-card rounded-2xl p-12 text-center border border-border-subtle max-w-lg mx-auto">
          <ShieldAlert size={40} className="text-text-tertiary mx-auto mb-3 opacity-60" />
          <h2 className="text-base font-bold text-text-primary mb-1">No reports in queue</h2>
          <p className="text-xs text-text-secondary">
            Everything is calm. No active community complaints logged.
          </p>
        </div>
      ) : (
        <div className="bg-surface-card rounded-2xl overflow-hidden border border-border-subtle shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans">
              <thead>
                <tr className="bg-surface-raised border-b border-border-subtle">
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                    Reason &amp; Target
                  </th>
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                    Target Type
                  </th>
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                    Status
                  </th>
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                    Logged Date
                  </th>
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredReports.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-surface-raised/60 transition-colors"
                  >
                    <td className="p-3.5">
                      <div className="font-bold text-text-primary text-xs truncate max-w-[200px]">
                        {r.reason}
                      </div>
                      <div className="text-[10px] text-text-tertiary truncate max-w-[200px] mt-0.5">
                        {r.description}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-surface-raised border border-border-subtle text-text-primary">
                        {r.targetType}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          r.status === "resolved"
                            ? "bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30"
                            : r.status === "dismissed"
                              ? "bg-surface-raised text-text-tertiary border border-border-subtle"
                              : "bg-[#FACC15]/10 text-[#FACC15] border border-[#FACC15]/30"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>

                    <td className="p-3.5 text-xs text-text-secondary font-medium">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>

                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleSelectReport(r)}
                        className="bg-surface-raised hover:bg-border-subtle text-text-primary border border-border-subtle px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        Investigate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report Drawer */}
      {selectedReport && (
        <div className="fixed inset-0 bg-app-base/80 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-surface-card w-full max-w-lg h-full border-l border-border-subtle flex flex-col shadow-2xl overflow-hidden animate-slide-in-right">
            {/* Header */}
            <div className="p-4 border-b border-border-subtle flex justify-between items-center bg-surface-raised shrink-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FACC15]/10 text-[#FACC15] border border-[#FACC15]/30 uppercase tracking-wider">
                  Report Investigation
                </span>
                <h2 className="text-sm font-bold text-text-primary truncate max-w-[240px]">
                  {selectedReport.reason}
                </h2>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="w-8 h-8 flex items-center justify-center bg-surface-card hover:bg-border-subtle border border-border-subtle rounded-xl transition-colors text-text-secondary hover:text-text-primary cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-6">
              {/* Description */}
              <div className="bg-surface-raised rounded-2xl p-4 border border-border-subtle space-y-2">
                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                  Report Description
                </h3>
                <p className="text-xs text-text-primary leading-relaxed">
                  {selectedReport.description}
                </p>
              </div>

              {/* Target & Reporter Info */}
              <div className="bg-surface-raised rounded-2xl p-4 border border-border-subtle space-y-3 text-xs">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Involved Entities
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between border-b border-border-subtle pb-1.5">
                    <span className="text-text-secondary">Target Type:</span>
                    <span className="font-bold text-text-primary uppercase">
                      {selectedReport.targetType}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-border-subtle pb-1.5">
                    <span className="text-text-secondary">Target ID:</span>
                    <span className="font-mono text-text-tertiary">{selectedReport.targetId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Reporter ID:</span>
                    <span className="font-mono text-text-tertiary">{selectedReport.reporterId}</span>
                  </div>
                </div>
              </div>

              {/* Resolution Form */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Resolution Decision
                </h3>

                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Add resolution explanation or action taken..."
                  className="w-full bg-surface-raised border border-border-subtle rounded-xl p-3 text-xs text-text-primary outline-none focus:border-[#FACC15] resize-none"
                  rows={3}
                />

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleUpdateStatus(ReportStatus.RESOLVED)}
                    disabled={isUpdating}
                    className="bg-[#22C55E] hover:bg-[#22C55E]/90 text-app-base py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Resolve Report
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(ReportStatus.DISMISSED)}
                    disabled={isUpdating}
                    className="bg-surface-raised hover:bg-border-subtle text-text-secondary border border-border-subtle py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
