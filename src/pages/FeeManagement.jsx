import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { FaMoneyBillWave, FaPlus, FaRupeeSign, FaTrash, FaUndo } from "react-icons/fa";
import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import api from "../api/axios";

const currentMonthStr = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const FeeManagement = () => {
  const [fees, setFees] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [monthFilter, setMonthFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [generateMonth, setGenerateMonth] = useState(currentMonthStr());
  const [generateDueDate, setGenerateDueDate] = useState("");
  const [generating, setGenerating] = useState(false);
  const [remindingId, setRemindingId] = useState(null);
  const [payModal, setPayModal] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMode, setPayMode] = useState("Cash");
  const [paying, setPaying] = useState(false);
  const [feeActionId, setFeeActionId] = useState(null);

  const fetchFees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/fees", { params: { month: monthFilter || undefined, status: statusFilter || undefined } });
      setFees(res.data.data);
    } catch {
      toast.error("Could not load fee records");
    } finally {
      setLoading(false);
    }
  }, [monthFilter, statusFilter]);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await api.get("/fees/summary");
      setSummary(res.data.data);
    } catch {
      toast.error("Could not load fee summary");
    }
  }, []);

  useEffect(() => { fetchFees(); fetchSummary(); }, [fetchFees, fetchSummary]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await api.post("/fees/generate", { month: generateMonth, dueDate: generateDueDate || undefined });
      toast.success(res.data.message);
      fetchFees(); fetchSummary();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate fees");
    } finally {
      setGenerating(false);
    }
  };

  const handleSendReminder = async (feeId) => {
    setRemindingId(feeId);
    try {
      const res = await api.post(`/fees/${feeId}/remind`);
      toast[res.data.success ? "success" : "error"](res.data.success ? "WhatsApp reminder sent" : "Reminder failed to send");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send reminder");
    } finally {
      setRemindingId(null);
    }
  };

  const openPayModal = (fee) => {
    setPayModal(fee);
    setPayAmount(fee.pending > 0 ? fee.pending : "");
    setPayMode("Cash");
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!payAmount || Number(payAmount) <= 0) { toast.error("Enter a valid payment amount"); return; }
    setPaying(true);
    try {
      await api.put(`/fees/${payModal._id}/pay`, { amount: Number(payAmount), modeOfPayment: payMode });
      toast.success("Payment recorded");
      setPayModal(null);
      fetchFees(); fetchSummary();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to record payment");
    } finally {
      setPaying(false);
    }
  };

  const handleUndoPayment = async (fee) => {
    const studentName = fee.student?.name || "this deleted student";
    if (!window.confirm(`Undo all payments recorded for ${studentName} for ${fee.month}?`)) return;

    setFeeActionId(fee._id);
    try {
      await api.put(`/fees/${fee._id}/undo-payment`);
      toast.success("Payment undone");
      await Promise.all([fetchFees(), fetchSummary()]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to undo payment");
    } finally {
      setFeeActionId(null);
    }
  };

  const handleDeleteFee = async (fee) => {
    const studentName = fee.student?.name || "Deleted student";
    if (!window.confirm(`Delete the ${fee.month} fee record for ${studentName}? This cannot be undone.`)) return;

    setFeeActionId(fee._id);
    try {
      await api.delete(`/fees/${fee._id}`);
      toast.success("Fee record deleted");
      await Promise.all([fetchFees(), fetchSummary()]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete fee record");
    } finally {
      setFeeActionId(null);
    }
  };

  return (
    <DashboardLayout title="Fee Management">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
        <StatCard icon={FaMoneyBillWave} label="Total Collection" value={`₹${(summary?.totalCollection ?? 0).toLocaleString("en-IN")}`} accent="bg-emerald-500/15 text-emerald-500" />
        <StatCard icon={FaMoneyBillWave} label="Pending Collection" value={`₹${(summary?.pendingCollection ?? 0).toLocaleString("en-IN")}`} accent="bg-red-500/15 text-red-500" />
        <StatCard icon={FaMoneyBillWave} label="Today's Collection" value={`₹${(summary?.todaysCollection ?? 0).toLocaleString("en-IN")}`} accent="bg-gold/15 text-gold" />
        <StatCard icon={FaMoneyBillWave} label="Monthly Collection" value={`₹${(summary?.monthlyCollection ?? 0).toLocaleString("en-IN")}`} accent="bg-blue-500/15 text-blue-500" />
      </div>

      <div className="card mb-6">
        <h3 className="font-display font-semibold text-navy dark:text-white mb-3">Generate Monthly Fees</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Creates a fee record for every active student for the selected month, automatically carrying forward any unpaid balance. Safe to re-run.</p>
        <form onSubmit={handleGenerate} className="flex flex-wrap items-end gap-3">
          <div><label className="text-sm font-medium block mb-1">Month</label><input type="month" className="input-field" value={generateMonth} onChange={(e) => setGenerateMonth(e.target.value)} required /></div>
          <div><label className="text-sm font-medium block mb-1">Due Date (optional)</label><input type="date" className="input-field" value={generateDueDate} onChange={(e) => setGenerateDueDate(e.target.value)} /><p className="text-xs text-slate-400 mt-1">Enables automatic WhatsApp reminders</p></div>
          <button type="submit" disabled={generating} className="btn-primary flex items-center gap-2"><FaPlus /> {generating ? "Generating..." : "Generate Fees"}</button>
        </form>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <input type="month" className="input-field max-w-[180px]" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} placeholder="Filter by month" />
        <select className="input-field max-w-[180px]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="Paid">Paid</option>
          <option value="Partial">Partial</option>
          <option value="Pending">Pending</option>
        </select>
      </div>

      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-navy-lighter">
              <th className="py-3 px-4">Student</th><th className="py-3 px-4">Class</th><th className="py-3 px-4">Month</th>
              <th className="py-3 px-4">Amount</th><th className="py-3 px-4">Paid</th><th className="py-3 px-4">Pending</th>
              <th className="py-3 px-4">Status</th><th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-10 text-slate-400">Loading...</td></tr>
            ) : fees.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-10 text-slate-400">No fee records found. Generate fees for a month above to get started.</td></tr>
            ) : (
              fees.map((f) => (
                <tr key={f._id} className="border-b border-slate-50 dark:border-navy-lighter/50">
                  <td className="py-3 px-4 font-medium text-navy dark:text-white">{f.student ? <>{f.student.name} <span className="text-slate-400 font-normal">({f.student.studentId})</span></> : <span className="text-red-500">Deleted student</span>}</td>
                  <td className="py-3 px-4">{f.student?.class || "—"}</td>
                  <td className="py-3 px-4">{f.month}</td>
                  <td className="py-3 px-4">₹{f.amount + f.carryForward}</td>
                  <td className="py-3 px-4">₹{f.paid}</td>
                  <td className="py-3 px-4">₹{f.pending}</td>
                  <td className="py-3 px-4"><span className={`badge ${f.status === "Paid" ? "bg-emerald-100 text-emerald-700" : f.status === "Partial" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>{f.status}</span></td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      {f.status !== "Paid" && f.student && (
                        <button onClick={() => handleSendReminder(f._id)} disabled={remindingId === f._id} className="btn-outline text-xs py-1.5 px-3">
                          {remindingId === f._id ? "Sending..." : "Remind"}
                        </button>
                      )}
                      {f.status !== "Paid" && f.student ? <button onClick={() => openPayModal(f)} className="btn-outline text-xs py-1.5 px-3">Record Payment</button> : f.status === "Paid" ? <span className="text-slate-400 text-xs">Fully paid</span> : null}
                      {f.paid > 0 && (
                        <button onClick={() => handleUndoPayment(f)} disabled={feeActionId === f._id} className="btn-outline text-xs py-1.5 px-3" title="Undo all payment amounts recorded for this fee">
                          <FaUndo className="inline mr-1" /> {feeActionId === f._id ? "Undoing..." : "Undo Payment"}
                        </button>
                      )}
                      <button onClick={() => handleDeleteFee(f)} disabled={feeActionId === f._id} className="btn-outline text-xs py-1.5 px-3 text-red-600" title="Delete this fee record">
                        <FaTrash className="inline mr-1" /> Delete Fee
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {payModal && (
        createPortal(
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center overflow-y-auto p-4">
          <div className="bg-white dark:bg-navy-light rounded-xl2 shadow-card-hover w-full max-w-sm max-h-[calc(100dvh-2rem)] overflow-y-auto p-6">
            <h3 className="font-display font-bold text-lg text-navy dark:text-white mb-1">Record Payment</h3>
            <p className="text-sm text-slate-500 mb-4">{payModal.student?.name} &middot; {payModal.month} &middot; Pending: ₹{payModal.pending}</p>
            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">Amount Paid</label>
                <div className="relative"><FaRupeeSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" /><input type="number" min="1" className="input-field pl-8" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} required /></div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Mode of Payment</label>
                <select className="input-field" value={payMode} onChange={(e) => setPayMode(e.target.value)}>
                  <option>Cash</option><option>UPI</option><option>Card</option><option>Bank Transfer</option><option>Cheque</option><option>Other</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" className="btn-outline" onClick={() => setPayModal(null)}>Cancel</button>
                <button type="submit" disabled={paying} className="btn-primary">{paying ? "Saving..." : "Confirm Payment"}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
        )
      )}
    </DashboardLayout>
  );
};

export default FeeManagement;
