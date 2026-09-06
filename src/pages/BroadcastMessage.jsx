import React, { useState } from "react";
import toast from "react-hot-toast";
import { FaPaperPlane, FaWhatsapp } from "react-icons/fa";
import DashboardLayout from "../components/DashboardLayout";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const BroadcastMessage = () => {
  const { role } = useAuth();
  const isAdmin = role === "admin";

  const [target, setTarget] = useState("all");
  const [classFilter, setClassFilter] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error("Write a message first");
      return;
    }
    if (target === "class" && !classFilter.trim()) {
      toast.error("Enter a class name to target");
      return;
    }
    if (!confirm("Send this WhatsApp broadcast now? This cannot be undone.")) return;

    setSending(true);
    setResult(null);
    try {
      const res = await api.post("/whatsapp/broadcast", {
        target,
        classFilter: target === "class" ? classFilter : undefined,
        message,
      });
      setResult(res.data.data);
      toast.success(`Broadcast sent: ${res.data.data.sent} delivered, ${res.data.data.failed} failed`);
      setMessage("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Broadcast failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <DashboardLayout title="Broadcast Message">
      <div className="card max-w-2xl">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
            <FaWhatsapp />
          </div>
          <div>
            <h3 className="font-display font-semibold text-navy dark:text-white">Send a WhatsApp Announcement</h3>
            <p className="text-sm text-slate-400">
              {isAdmin ? "Sent to parents of all matching active students." : "Sent to parents of your assigned students only."}
            </p>
          </div>
        </div>

        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Send To</label>
            <select className="input-field" value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="all">All my students</option>
              <option value="class">A specific class</option>
              <option value="absentToday">Students absent today</option>
              {isAdmin && <option value="pendingFees">Students with pending fees</option>}
            </select>
          </div>

          {target === "class" && (
            <div>
              <label className="text-sm font-medium block mb-1">Class Name</label>
              <input className="input-field" placeholder="e.g. Class 10" value={classFilter} onChange={(e) => setClassFilter(e.target.value)} />
            </div>
          )}

          <div>
            <label className="text-sm font-medium block mb-1">Message</label>
            <textarea
              className="input-field"
              rows={6}
              placeholder="e.g. Holiday notice: The academy will be closed on Friday for a public holiday. Classes resume Monday as usual."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <p className="text-xs text-slate-400 mt-1">Sent as a plain WhatsApp text message to each recipient's registered parent number.</p>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={sending} className="btn-primary flex items-center gap-2">
              <FaPaperPlane /> {sending ? "Sending..." : "Send Broadcast"}
            </button>
          </div>
        </form>

        {result && (
          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            <div className="bg-slate-50 dark:bg-navy-lighter rounded-lg py-3"><p className="text-slate-400 text-xs">Total</p><p className="font-bold text-navy dark:text-white text-lg">{result.total}</p></div>
            <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-lg py-3"><p className="text-emerald-600 text-xs">Sent</p><p className="font-bold text-emerald-600 text-lg">{result.sent}</p></div>
            <div className="bg-red-50 dark:bg-red-500/10 rounded-lg py-3"><p className="text-red-500 text-xs">Failed</p><p className="font-bold text-red-500 text-lg">{result.failed}</p></div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BroadcastMessage;
