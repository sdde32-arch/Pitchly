import React, { useState, useEffect } from "react";
import { useUser } from "../../context/UserContext";
import { adminService } from "../../services/adminService";
import {
  Search,
  Activity,
  Calendar,
  User,
  FileText,
  ChevronRight,
  X,
  AlertCircle,
  Clock,
  Download,
  Filter,
  Layers,
  Code,
} from "lucide-react";

export const AuditLogs: React.FC = () => {
  const { isAdmin, loading: authLoading } = useUser();
  const [logs, setLogs] = useState<any[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState("ALL");
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (isAdmin) {
      fetchLogs();
    }
  }, [isAdmin, authLoading]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, lastDoc: newLastDoc } = await adminService.listAuditLogs();
      setLogs(data);
      setLastDoc(newLastDoc);
      setHasMore(data.length >= 50);
    } catch (error) {
      console.error("Failed to fetch audit logs", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMoreLogs = async () => {
    if (!lastDoc || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const { data, lastDoc: newLastDoc } = await adminService.listAuditLogs(lastDoc);
      setLogs((prev) => [...prev, ...data]);
      setLastDoc(newLastDoc);
      setHasMore(data.length >= 50);
    } catch (error) {
      console.error("Failed to fetch more logs", error);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    let result = logs;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          (l.adminEmail && l.adminEmail.toLowerCase().includes(q)) ||
          (l.action && l.action.toLowerCase().includes(q)) ||
          (l.targetId && l.targetId.toLowerCase().includes(q)),
      );
    }
    if (timeFilter !== "ALL") {
      const now = Date.now();
      let threshold = 0;
      if (timeFilter === "1") threshold = now - 24 * 60 * 60 * 1000;
      else if (timeFilter === "7") threshold = now - 7 * 24 * 60 * 60 * 1000;
      else if (timeFilter === "30") threshold = now - 30 * 24 * 60 * 60 * 1000;
      result = result.filter((l) => {
        if (!l.createdAt) return false;
        const time = l.createdAt?.toDate
          ? l.createdAt.toDate().getTime()
          : new Date(l.createdAt).getTime();
        return time >= threshold;
      });
    }
    setFilteredLogs(result);
  }, [searchQuery, timeFilter, logs]);

  const handleExportCSV = () => {
    const headers = ["ID,Action,AdminID,AdminEmail,TargetType,TargetID,CreatedAt"];
    const rows = filteredLogs.map((l) =>
      [
        `"${l.id || ""}"`,
        `"${l.action || ""}"`,
        `"${l.adminId || ""}"`,
        `"${l.adminEmail || ""}"`,
        `"${l.targetType || ""}"`,
        `"${l.targetId || ""}"`,
        `"${l.createdAt ? (l.createdAt.toDate ? l.createdAt.toDate().toISOString() : l.createdAt) : ""}"`,
      ].join(","),
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pitchly-audit-logs-${new Date().toISOString().split("T")[0]}.csv`);
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
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-surface-raised text-text-secondary border border-border-subtle uppercase tracking-wider">
              Immutable Ledger
            </span>
            <span className="text-xs text-text-tertiary font-medium">
              Administrative Action Tracking
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            Audit Logs
          </h1>
          <p className="text-xs text-text-secondary font-medium">
            Permanent, verifiable history of all staff interventions, approvals, status modifications, and refunds.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-3.5 py-2 bg-surface-card hover:bg-surface-raised border border-border-subtle hover:border-border-prominent rounded-xl text-xs font-bold text-text-secondary hover:text-text-primary transition-all cursor-pointer self-start sm:self-auto"
        >
          <Download size={14} />
          <span>Export Logs</span>
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
              placeholder="Search audit trail by action, admin email, target ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-raised border border-border-subtle rounded-xl pl-10 pr-4 py-2.5 text-xs text-text-primary font-semibold outline-none focus:border-border-prominent transition-colors"
            />
          </div>

          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="bg-surface-raised border border-border-subtle rounded-xl px-3 py-2.5 text-xs text-text-primary font-bold outline-none focus:border-border-prominent cursor-pointer"
          >
            <option value="ALL">All Time</option>
            <option value="1">Last 24 Hours</option>
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary-lime border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-surface-card rounded-2xl p-12 text-center border border-border-subtle max-w-lg mx-auto">
          <Activity size={40} className="text-text-tertiary mx-auto mb-3 opacity-60" />
          <h2 className="text-base font-bold text-text-primary mb-1">No log entries found</h2>
          <p className="text-xs text-text-secondary">
            No administrative events recorded matching the filter query.
          </p>
        </div>
      ) : (
        <div className="bg-surface-card rounded-2xl overflow-hidden border border-border-subtle shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans">
              <thead>
                <tr className="bg-surface-raised border-b border-border-subtle">
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                    Action Performed
                  </th>
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                    Administrator
                  </th>
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                    Target &amp; Type
                  </th>
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                    Timestamp
                  </th>
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary text-right">
                    Payload
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredLogs.map((l) => (
                  <tr
                    key={l.id}
                    className="hover:bg-surface-raised/60 transition-colors font-mono text-xs"
                  >
                    <td className="p-3.5">
                      <span className="font-bold text-text-primary">
                        {l.action}
                      </span>
                    </td>

                    <td className="p-3.5 text-text-secondary font-sans text-xs">
                      <div className="font-medium text-text-primary">{l.adminEmail || "Admin"}</div>
                      <div className="text-[10px] text-text-tertiary font-mono">{l.adminId?.substring(0, 8)}...</div>
                    </td>

                    <td className="p-3.5 font-sans text-xs">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-surface-raised border border-border-subtle text-text-secondary">
                        {l.targetType || "Entity"}
                      </span>
                      <span className="text-[10px] text-text-tertiary font-mono block mt-0.5">
                        {l.targetId ? l.targetId.substring(0, 12) : "N/A"}
                      </span>
                    </td>

                    <td className="p-3.5 text-text-secondary font-sans text-xs">
                      {l.createdAt
                        ? (l.createdAt.toDate
                            ? l.createdAt.toDate().toLocaleString()
                            : new Date(l.createdAt).toLocaleString())
                        : "N/A"}
                    </td>

                    <td className="p-3.5 text-right font-sans">
                      <button
                        onClick={() => setSelectedLog(l)}
                        className="bg-surface-raised hover:bg-border-subtle text-text-primary border border-border-subtle px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <div className="p-4 flex justify-center border-t border-border-subtle bg-surface-card">
              <button
                onClick={fetchMoreLogs}
                disabled={loadingMore}
                className="bg-surface-raised hover:bg-border-subtle border border-border-subtle text-text-primary px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : "Load More Logs"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Log Detail Drawer */}
      {selectedLog && (
        <div className="fixed inset-0 bg-app-base/80 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-surface-card w-full max-w-lg h-full border-l border-border-subtle flex flex-col shadow-2xl overflow-hidden animate-slide-in-right">
            {/* Header */}
            <div className="p-4 border-b border-border-subtle flex justify-between items-center bg-surface-raised shrink-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface-card border border-border-subtle text-text-secondary uppercase tracking-wider">
                  Audit Entry
                </span>
                <h2 className="text-sm font-bold text-text-primary truncate max-w-[240px]">
                  {selectedLog.action}
                </h2>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="w-8 h-8 flex items-center justify-center bg-surface-card hover:bg-border-subtle border border-border-subtle rounded-xl transition-colors text-text-secondary hover:text-text-primary cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-6">
              {/* Metadata Details */}
              <div className="bg-surface-raised rounded-2xl p-4 border border-border-subtle space-y-2 text-xs">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2">
                  Event Parameters
                </h3>
                <div className="flex justify-between border-b border-border-subtle pb-1.5">
                  <span className="text-text-secondary">Action Name:</span>
                  <span className="font-bold text-text-primary">{selectedLog.action}</span>
                </div>
                <div className="flex justify-between border-b border-border-subtle pb-1.5">
                  <span className="text-text-secondary">Admin Email:</span>
                  <span className="font-bold text-text-primary">{selectedLog.adminEmail}</span>
                </div>
                <div className="flex justify-between border-b border-border-subtle pb-1.5">
                  <span className="text-text-secondary">Admin ID:</span>
                  <span className="font-mono text-text-tertiary">{selectedLog.adminId}</span>
                </div>
                <div className="flex justify-between border-b border-border-subtle pb-1.5">
                  <span className="text-text-secondary">Target Entity:</span>
                  <span className="font-bold text-text-primary">{selectedLog.targetType} ({selectedLog.targetId})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Timestamp:</span>
                  <span className="text-text-primary">
                    {selectedLog.createdAt
                      ? (selectedLog.createdAt.toDate
                          ? selectedLog.createdAt.toDate().toISOString()
                          : selectedLog.createdAt)
                      : "N/A"}
                  </span>
                </div>
              </div>

              {/* JSON Details */}
              <div>
                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                  Full Payload JSON
                </h3>
                <pre className="bg-surface-raised rounded-xl p-4 border border-border-subtle text-[11px] font-mono text-text-secondary overflow-x-auto">
                  {JSON.stringify(selectedLog.details || selectedLog, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
