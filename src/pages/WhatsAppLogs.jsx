import React, { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { FaSearch, FaRedo, FaCheckCircle, FaEye, FaTimesCircle, FaClock } from "react-icons/fa";
import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import api from "../api/axios";

const typeLabels = {
  FEE_REMINDER: "Fee Reminder",
  ATTENDANCE_ALERT: "Attendance Alert",
  TEST_ANNOUNCEMENT: "Test Announcement",
  RESULT_NOTIFICATION: "Result Notification",
  HOMEWORK_REMINDER: "Homework Reminder",
  BROADCAST: "Broadcast",
  TEST_MESSAGE: "Test Message",
};

const statusStyle = {
  sent: "bg-blue-100 text-blue-700",
  delivered: "bg-emerald-100 text-emerald-700",
  read: "bg-purple-100 text-purple-700",
  failed: "bg-red-100 text-red-700",
  queued: "bg-slate-200 text-slate-600",
};

const WhatsAppLogs = () => {
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(null);
  const limit = 20;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/whatsapp/logs", {
        params: { search: search || undefined, type: typeFilter || undefined, status: statusFilter || undefined, page, limit },
      });
      setLogs(res.data.data);
      setTotal(res.data.total);
      setSummary(res.data.summary);
    } catch {
      toast.error("Could not load WhatsApp logs");
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, statusFilter, page]);

  useEffect(() => {
    const debounce = setTimeout(fetchLogs, 300);
    return () => clearTimeout(debounce);
  }, [fetchLogs]);

  const handleRetry = async (id) => {
    setRetrying(id);
    try {
      const res = await api.post(`/whatsapp/logs/${id}/retry`);
      toast[res.data.success ? "success" : "error"](res.data.success ? "Retried successfully" : "Retry failed");
      fetchLogs();
    } catch (err) {
      toast.error(err.response?.data?.message || "Retry failed");
    } finally {
      setRetrying(null);
    }
  };

  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return (
    <DashboardLayout title="WhatsApp Logs">
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
          <StatCard icon={FaCheckCircle} label="Sent Today" value={summary.sentToday} accent="bg-blue-500/15 text-blue-500" />
          <StatCard icon={FaCheckCircle} label="Delivered" value={summary.deliveredToday} accent="bg-emerald-500/15 text-emerald-500" />
          <StatCard icon={FaEye} label="Read" value={summary.readToday} accent="bg-purple-500/15 text-purple-500" />
          <StatCard icon={FaTimesCircle} label="Failed" value={summary.failedToday} accent="bg-red-500/15 text-red-500" />
          <StatCard icon={FaClock} label="Pending" value={summary.pendingToday} accent="bg-amber-500/15 text-amber-500" />
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <input className="input-field pl-9" placeholder="Search by name or number..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="input-field max-w-[200px]" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
          <option value="">All types</option>
          {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="input-field max-w-[160px]" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          <option value="sent">Sent</option>
          <option value="delivered">Delivered</option>
          <option value="read">Read</option>
          <option value="failed">Failed</option>
          <option value="queued">Queued</option>
        </select>
      </div>

      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-navy-lighter">
              <th className="py-3 px-4">Recipient</th>
              <th className="py-3 px-4">Student</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Date & Time</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-10 text-slate-400">Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-slate-400">No messages yet.</td></tr>
            ) : (
              logs.map((log) => (
                <tr key={log._id} className="border-b border-slate-50 dark:border-navy-lighter/50">
                  <td className="py-3 px-4">
                    <p className="font-medium text-navy dark:text-white">{log.recipientName || "-"}</p>
                    <p className="text-xs text-slate-400">{log.recipientNumber}</p>
                  </td>
                  <td className="py-3 px-4">{log.student?.name || "-"}</td>
                  <td className="py-3 px-4">{typeLabels[log.type] || log.type}</td>
                  <td className="py-3 px-4">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <span className={`badge ${statusStyle[log.status]}`}>{log.status}</span>
                    {log.status === "failed" && log.errorMessage && (
                      <p className="text-xs text-red-400 mt-1 max-w-[200px] truncate" title={log.errorMessage}>{log.errorMessage}</p>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {log.status === "failed" && (
                      <button onClick={() => handleRetry(log._id)} disabled={retrying === log._id} className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1 ml-auto">
                        <FaRedo /> {retrying === log._id ? "Retrying..." : "Retry"}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button key={i} onClick={() => setPage(i + 1)} className={`w-8 h-8 rounded-lg text-sm ${page === i + 1 ? "bg-gold text-navy font-semibold" : "bg-white dark:bg-navy-light text-slate-500"}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default WhatsAppLogs;
