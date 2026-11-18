import React, { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import {
  FaChartBar,
  FaClock,
  FaDownload,
  FaFileInvoiceDollar,
  FaHistory,
  FaMoneyBillWave,
  FaPlus,
  FaRupeeSign,
  FaSearch,
  FaTrash,
} from "react-icons/fa";
import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import api from "../api/axios";
import { PLATFORM_NAME } from "../config/branding";
import { useAuth } from "../context/AuthContext";
import ngaLogo from "../assets/nga-logo.png.jpeg";

const currentMonthStr = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const formatCurrency = (amount) => `₹${Number(amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const formatDate = (value) => {
  if (!value) return "—";
  const dateOnly = String(value).slice(0, 10);
  return new Date(`${dateOnly}T00:00:00`).toLocaleDateString("en-IN");
};
const formatPaymentDate = (value) => value ? new Date(value).toLocaleString("en-IN") : "Date unavailable";
const statusClass = {
  Paid: "bg-emerald-100 text-emerald-700",
  "Partially Paid": "bg-amber-100 text-amber-700",
  Partial: "bg-amber-100 text-amber-700",
  Pending: "bg-red-100 text-red-700",
  Overdue: "bg-red-100 text-red-700",
};

const imageUrlToPng = async (url) => {
  const response = await fetch(url, { mode: "cors" });
  if (!response.ok) throw new Error("Academy logo could not be downloaded");
  const objectUrl = URL.createObjectURL(await response.blob());
  try {
    return await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;
          canvas.getContext("2d").drawImage(image, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } catch (error) {
          reject(error);
        }
      };
      image.onerror = () => reject(new Error("Academy logo could not be decoded"));
      image.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

const FeeManagement = () => {
  const [fees, setFees] = useState([]);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [monthFilter, setMonthFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [searchText, setSearchText] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [generateMonth, setGenerateMonth] = useState(currentMonthStr());
  const [generateDueDate, setGenerateDueDate] = useState("");
  const [generating, setGenerating] = useState(false);
  const [payModal, setPayModal] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMode, setPayMode] = useState("Cash");
  const [payRequestId, setPayRequestId] = useState("");
  const [paying, setPaying] = useState(false);
  const [feeActionId, setFeeActionId] = useState(null);
  const [expandedFeeId, setExpandedFeeId] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(false);
  const [page, setPage] = useState(1);
  const { user } = useAuth();

  const fetchFees = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const response = await api.get("/fees", {
        params: {
          month: monthFilter || undefined,
          status: statusFilter || undefined,
          class: classFilter || undefined,
          search: searchFilter || undefined,
        },
      });
      setFees(response.data.data || []);
    } catch (error) {
      setLoadError(true);
      toast.error(error.response?.data?.message || "Could not load fee records");
    } finally {
      setLoading(false);
    }
  }, [classFilter, monthFilter, searchFilter, statusFilter]);

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    setSummaryError(false);
    try {
      const response = await api.get("/fees/summary");
      setSummary(response.data.data);
    } catch (error) {
      setSummaryError(true);
      toast.error(error.response?.data?.message || "Could not load fee summary");
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearchFilter(searchText.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    setPage(1);
  }, [classFilter, monthFilter, searchFilter, statusFilter]);

  useEffect(() => { fetchFees(); }, [fetchFees]);
  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  const pageSize = 20;
  const pageCount = Math.max(1, Math.ceil(fees.length / pageSize));
  const visibleFees = fees.slice((page - 1) * pageSize, page * pageSize);
  const monthlyTrend = summary?.monthlyTrend || [];
  const trendMaximum = Math.max(
    1,
    ...monthlyTrend.flatMap((item) => [item.expected, item.collected])
  );

  const handleGenerate = async (event) => {
    event.preventDefault();
    setGenerating(true);
    try {
      const response = await api.post("/fees/generate", {
        month: generateMonth,
        dueDate: generateDueDate || undefined,
      });
      toast.success(response.data.message);
      await Promise.all([fetchFees(), fetchSummary()]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to generate fees");
    } finally {
      setGenerating(false);
    }
  };

  const handleSendReminder = (fee) => {
    const digits = String(fee.student?.parentWhatsapp || fee.student?.phone || "").replace(/\D/g, "");
    const phoneNumber = digits.length === 10 ? `91${digits}` : digits.length >= 11 && digits.length <= 15 ? digits : null;
    if (!phoneNumber) {
      toast.error("A valid parent WhatsApp number is required to send a reminder");
      return;
    }
    const message = [
      `Hello ${fee.student.parentName || "Parent"},`,
      "",
      `This is a fee reminder from ${user?.academyName || PLATFORM_NAME}.`,
      "",
      `Student: ${fee.student.name}`,
      `Class: ${fee.student.class}`,
      `Month: ${fee.month}`,
      `Pending Fee: ${formatCurrency(fee.pending)}`,
      `Due Date: ${formatDate(fee.dueDate)}`,
      "",
      "Please make the payment at your earliest convenience.",
    ].join("\n");
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
    toast.success("WhatsApp opened. Review the reminder and press Send.");
  };

  const openPayModal = (fee) => {
    if (!window.crypto?.randomUUID) {
      toast.error("Secure payment request IDs are unavailable in this browser");
      return;
    }
    setPayModal(fee);
    setPayAmount(fee.pending > 0 ? String(fee.pending) : "");
    setPayMode("Cash");
    setPayRequestId(window.crypto.randomUUID());
  };

  const handleRecordPayment = async (event) => {
    event.preventDefault();
    const amount = Number(payAmount);
    if (!Number.isFinite(amount) || amount <= 0 || !payRequestId) {
      toast.error("Enter a valid payment amount");
      return;
    }
    setPaying(true);
    try {
      await api.put(
        `/fees/${payModal._id}/pay`,
        { amount, modeOfPayment: payMode },
        { headers: { "Idempotency-Key": payRequestId } }
      );
      toast.success("Payment recorded");
      setPayModal(null);
      setPayRequestId("");
      await Promise.all([fetchFees(), fetchSummary()]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to record payment");
      await Promise.all([fetchFees(), fetchSummary()]);
    } finally {
      setPaying(false);
    }
  };

  const loadPaymentHistory = async (fee) => {
    setExpandedFeeId(fee._id);
    setPaymentHistory([]);
    setHistoryLoading(true);
    setHistoryError(false);
    try {
      const response = await api.get(`/fees/${fee._id}/payments`);
      setPaymentHistory(response.data.data || []);
    } catch (error) {
      setHistoryError(true);
      toast.error(error.response?.data?.message || "Could not load payment history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const togglePaymentHistory = async (fee) => {
    if (expandedFeeId === fee._id) {
      setExpandedFeeId(null);
      setPaymentHistory([]);
      return;
    }
    await loadPaymentHistory(fee);
  };

  const downloadReceipt = async (fee, payment) => {
    try {
      const response = await api.get(`/fees/${fee._id}/receipts/${payment._id}`);
      const receipt = response.data.data;
      const logoUrl = receipt.academy.logo || new URL(ngaLogo, window.location.href).href;
      const logoData = await imageUrlToPng(logoUrl);
      const { jsPDF } = await import("jspdf");
      const document = new jsPDF();
      const margin = 18;
      const pageWidth = document.internal.pageSize.getWidth();
      const receiptDate = receipt.payment.date
        ? new Date(receipt.payment.date).toLocaleString("en-IN")
        : "Date unavailable (legacy payment record)";
      document.setDrawColor(213, 225, 237);
      document.setFillColor(255, 255, 255);
      document.roundedRect(12, 12, pageWidth - 24, 273, 4, 4, "FD");
      document.addImage(logoData, "PNG", margin, 20, 25, 25);
      document.setFont("helvetica", "bold");
      document.setFontSize(18);
      document.setTextColor(36, 74, 118);
      document.text(receipt.academy.name || PLATFORM_NAME, 49, 28, { maxWidth: pageWidth - 70 });
      document.setFont("helvetica", "normal");
      document.setFontSize(9);
      document.setTextColor(71, 85, 105);
      if (receipt.academy.address) document.text(receipt.academy.address, 49, 36, { maxWidth: pageWidth - 70 });
      document.setFontSize(12);
      document.text("OFFICIAL FEE RECEIPT", margin, 58);
      document.setDrawColor(242, 169, 0);
      document.setLineWidth(1);
      document.line(margin, 63, pageWidth - margin, 63);

      const rows = [
        ["Receipt number", receipt.payment.receiptNumber || "—"],
        ["Payment date", receiptDate],
        ["Student", receipt.student.name],
        ["Student ID", receipt.student.studentId],
        ["Parent / guardian", receipt.student.parentName || "—"],
        ["Contact", receipt.student.phone || "—"],
        ["Class / batch", `${receipt.student.class || "—"} / ${receipt.student.batch || "No batch"}`],
        ["Fee month", receipt.month],
        ["Payment method", receipt.payment.modeOfPayment || "—"],
      ];
      let y = 76;
      document.setFontSize(10);
      rows.forEach(([label, value]) => {
        document.setFont("helvetica", "bold");
        document.text(label, margin, y);
        document.setFont("helvetica", "normal");
        document.text(String(value), 78, y, { maxWidth: pageWidth - 96 });
        y += 14;
      });

      document.setFillColor(234, 241, 248);
      document.roundedRect(margin, y + 3, pageWidth - margin * 2, 42, 3, 3, "F");
      document.setFont("helvetica", "bold");
      document.setTextColor(23, 32, 51);
      document.text("Payment amount", margin + 6, y + 17);
      document.text(`INR ${Number(receipt.payment.amount).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`, pageWidth - margin - 6, y + 17, { align: "right" });
      document.setFont("helvetica", "normal");
      document.setFontSize(9);
      document.text("Outstanding balance after payment", margin + 6, y + 33);
      document.text(`INR ${Number(receipt.outstandingBalance).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`, pageWidth - margin - 6, y + 33, { align: "right" });
      if (receipt.legacy) {
        document.setFontSize(8);
        document.setTextColor(100, 116, 139);
        document.text("This receipt reflects a legacy aggregate payment; individual historical installments were not stored.", margin, y + 57, {
          maxWidth: pageWidth - margin * 2,
        });
      }
      document.setFontSize(9);
      document.setTextColor(71, 85, 105);
      document.text("Thank you for your payment.", margin, 266);
      const fileName = `${receipt.payment.receiptNumber || "fee-receipt"}.pdf`.replace(/[^\w.-]/g, "_");
      document.save(fileName);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Could not generate the PDF receipt");
    }
  };

  const handleDeleteFee = async (fee) => {
    if (Number(fee.paid) > 0 || fee.paymentCount > 0) {
      toast.error("Fee records with payment history cannot be deleted");
      return;
    }
    const studentName = fee.student?.name || "Deleted student";
    if (!window.confirm(`Delete the unpaid ${fee.month} fee record for ${studentName}?`)) return;
    setFeeActionId(fee._id);
    try {
      await api.delete(`/fees/${fee._id}`);
      toast.success("Unpaid fee record deleted");
      await Promise.all([fetchFees(), fetchSummary()]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete fee record");
    } finally {
      setFeeActionId(null);
    }
  };

  return (
    <DashboardLayout title="Fee Management">
      <div className="space-y-6">
        {summaryError && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <span>Financial analytics could not be loaded.</span>
            <button type="button" className="btn-secondary px-3 py-1.5" onClick={fetchSummary}>Retry analytics</button>
          </div>
        )}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6" aria-label="Fee overview">
          <StatCard icon={FaFileInvoiceDollar} label="Total Expected Fees" value={summaryLoading ? "Loading..." : summaryError ? "Unavailable" : formatCurrency(summary?.totalExpectedFees)} accent="bg-blue-500/15 text-blue-500" />
          <StatCard icon={FaMoneyBillWave} label="Total Collected" value={summaryLoading ? "Loading..." : summaryError ? "Unavailable" : formatCurrency(summary?.totalCollection)} accent="bg-emerald-500/15 text-emerald-500" />
          <StatCard icon={FaMoneyBillWave} label="Pending Fees" value={summaryLoading ? "Loading..." : summaryError ? "Unavailable" : formatCurrency(summary?.pendingCollection)} accent="bg-red-500/15 text-red-500" />
          <StatCard icon={FaClock} label="Overdue Fees" value={summaryLoading ? "Loading..." : summaryError ? "Unavailable" : formatCurrency(summary?.overdueCollection)} accent="bg-red-500/15 text-red-500" />
          <StatCard icon={FaMoneyBillWave} label="Today's Collection" value={summaryLoading ? "Loading..." : summaryError ? "Unavailable" : formatCurrency(summary?.todaysCollection)} accent="bg-gold/15 text-gold" />
          <StatCard icon={FaChartBar} label="Monthly Collection" value={summaryLoading ? "Loading..." : summaryError ? "Unavailable" : formatCurrency(summary?.monthlyCollection)} accent="bg-blue-500/15 text-blue-500" />
        </section>

        <section className="grid gap-5 xl:grid-cols-2" aria-label="Fee analytics">
          <div className="card">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display font-semibold text-navy dark:text-white">Expected versus collected</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Monthly fees due compared with payments received by date. Legacy aggregate payments remain in lifetime totals but are excluded from date-based trends because their installment dates are unavailable.
                </p>
              </div>
              <div className="flex gap-3 text-xs text-slate-500">
                <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-gold" />Expected</span>
                <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-blue-500" />Collected</span>
              </div>
            </div>
            <div className="space-y-3">
              {monthlyTrend.map((item) => (
                <div key={item.month}>
                  <div className="mb-1 flex justify-between gap-3 text-xs text-slate-500">
                    <span>{item.month}</span>
                    <span>{formatCurrency(item.collected)} / {formatCurrency(item.expected)}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-gold" style={{ width: `${Math.min(100, (item.expected / trendMaximum) * 100)}%` }} />
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(100, (item.collected / trendMaximum) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              ))}
              {!monthlyTrend.length && <p className="py-8 text-center text-sm text-slate-500">No collection data available.</p>}
            </div>
          </div>

          <div className="card">
            <div className="mb-4">
              <h2 className="font-display font-semibold text-navy dark:text-white">Class-wise collection</h2>
              <p className="mt-1 text-sm text-slate-500">Expected, collected, and outstanding balances by student class.</p>
            </div>
            <div className="max-h-80 overflow-auto">
              <table className="w-full min-w-[540px] text-sm">
                <thead className="sticky top-0 bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-3 py-2.5 font-semibold">Class</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Expected</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Collected</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Pending</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(summary?.classWise || []).map((group) => (
                    <tr key={group.className}>
                      <td className="px-3 py-3 font-medium text-navy">{group.className}</td>
                      <td className="px-3 py-3 text-right">{formatCurrency(group.expected)}</td>
                      <td className="px-3 py-3 text-right text-emerald-700">{formatCurrency(group.collected)}</td>
                      <td className="px-3 py-3 text-right text-rose-700">{formatCurrency(group.pending)}</td>
                    </tr>
                  ))}
                  {!summary?.classWise?.length && (
                    <tr><td colSpan={4} className="px-3 py-8 text-center text-slate-500">No class-wise fee data available.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display font-semibold text-navy dark:text-white">Pending fee breakdown</h2>
              <p className="mt-1 text-sm text-slate-500">Balances are grouped by the fee month; overdue status is calculated from due dates.</p>
            </div>
            <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
              {summary?.overdueFeeCount || 0} overdue record{summary?.overdueFeeCount === 1 ? "" : "s"}
            </span>
          </div>
          {(summary?.pendingBreakdown || []).length ? (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {summary.pendingBreakdown.map((item) => (
                <div key={item.month} className="min-w-36 rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">{item.month}</p>
                  <p className="mt-1 font-semibold text-navy">{formatCurrency(item.pending)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-sm text-slate-500">No pending fees.</p>
          )}
        </section>

        <section className="card">
          <div className="mb-4">
            <h2 className="font-display font-semibold text-navy dark:text-white">Generate monthly fees</h2>
            <p className="mt-1 text-sm text-slate-500">
              Adds a fee for active students who do not already have a record for the selected month, carrying forward the previous balance.
            </p>
          </div>
          <form onSubmit={handleGenerate} className="flex flex-wrap items-end gap-3">
            <label className="text-sm font-medium text-slate-700">
              Month
              <input type="month" className="input-field mt-1" value={generateMonth} onChange={(event) => setGenerateMonth(event.target.value)} required />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Due date (optional)
              <input type="date" className="input-field mt-1" value={generateDueDate} onChange={(event) => setGenerateDueDate(event.target.value)} />
            </label>
            <button type="submit" disabled={generating} className="btn-primary flex min-h-11 items-center gap-2">
              <FaPlus aria-hidden="true" /> {generating ? "Generating..." : "Generate fees"}
            </button>
          </form>
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold text-navy">Student fee records</h2>
              <p className="mt-1 text-sm text-slate-500">Search, filter, record installments, and review immutable payment history.</p>
            </div>
            <div className="grid w-full gap-2 sm:grid-cols-2 lg:w-auto lg:grid-cols-4">
              <label className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input className="input-field pl-9" value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Student name or ID" aria-label="Search students" />
              </label>
              <label>
                <span className="sr-only">Filter by month</span>
                <input type="month" className="input-field" value={monthFilter} onChange={(event) => setMonthFilter(event.target.value)} aria-label="Filter by month" />
              </label>
              <label>
                <span className="sr-only">Filter by class</span>
                <input className="input-field" value={classFilter} onChange={(event) => setClassFilter(event.target.value)} placeholder="Class name" aria-label="Filter by class" />
              </label>
              <label>
                <span className="sr-only">Filter by status</span>
                <select className="input-field" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by payment status">
                  <option value="">All statuses</option>
                  <option value="Paid">Paid</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </label>
            </div>
          </div>

          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Student</th>
                    <th className="px-4 py-3 font-semibold">Class</th>
                    <th className="px-4 py-3 font-semibold">Month / due</th>
                    <th className="px-4 py-3 text-right font-semibold">Expected</th>
                    <th className="px-4 py-3 text-right font-semibold">Paid</th>
                    <th className="px-4 py-3 text-right font-semibold">Pending</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan={8} className="py-10 text-center text-slate-500">Loading fee records...</td></tr>
                  ) : loadError ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center">
                        <p className="text-slate-600">Fee records could not be loaded.</p>
                        <button type="button" className="btn-secondary mt-3 px-4 py-2" onClick={fetchFees}>Retry</button>
                      </td>
                    </tr>
                  ) : visibleFees.length === 0 ? (
                    <tr><td colSpan={8} className="py-10 text-center text-slate-500">No fee records match these filters.</td></tr>
                  ) : visibleFees.map((fee) => {
                    const displayStatus = fee.displayStatus || fee.status;
                    return (
                      <React.Fragment key={fee._id}>
                        <tr className="hover:bg-slate-50/70">
                          <td className="px-4 py-3 font-medium text-navy">
                            {fee.student ? (
                              <>
                                {fee.student.name}
                                <span className="ml-1 text-xs font-normal text-slate-400">({fee.student.studentId})</span>
                              </>
                            ) : <span className="text-rose-600">Deleted student</span>}
                          </td>
                          <td className="px-4 py-3">{fee.student?.class || "—"}</td>
                          <td className="px-4 py-3">
                            <span>{fee.month}</span>
                            <span className="mt-0.5 block text-xs text-slate-500">Due {formatDate(fee.dueDate)}</span>
                          </td>
                          <td className="px-4 py-3 text-right">{formatCurrency(fee.amount + fee.carryForward)}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(fee.paid)}</td>
                          <td className="px-4 py-3 text-right font-semibold">{formatCurrency(fee.pending)}</td>
                          <td className="px-4 py-3">
                            <span className={`badge ${statusClass[displayStatus] || "bg-slate-100 text-slate-700"}`}>{displayStatus}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap justify-end gap-2">
                              {fee.student && fee.pending > 0 && (
                                <>
                                  <button type="button" onClick={() => handleSendReminder(fee)} className="btn-outline px-3 py-1.5 text-xs">Remind</button>
                                  <button type="button" onClick={() => openPayModal(fee)} className="btn-outline px-3 py-1.5 text-xs">Record payment</button>
                                </>
                              )}
                              {fee.paymentCount > 0 && (
                                <button type="button" onClick={() => togglePaymentHistory(fee)} className="btn-outline inline-flex items-center gap-1 px-3 py-1.5 text-xs">
                                  <FaHistory aria-hidden="true" /> History ({fee.paymentCount})
                                </button>
                              )}
                              {fee.paid <= 0 && fee.paymentCount === 0 && (
                                <button type="button" onClick={() => handleDeleteFee(fee)} disabled={feeActionId === fee._id} className="btn-outline px-3 py-1.5 text-xs text-rose-600" title="Delete unpaid fee record">
                                  <FaTrash className="mr-1 inline" aria-hidden="true" /> Delete
                                </button>
                              )}
                              {fee.paymentCount > 0 && <span className="self-center text-xs text-slate-400">Payment history locked</span>}
                            </div>
                          </td>
                        </tr>
                        {expandedFeeId === fee._id && (
                          <tr>
                            <td colSpan={8} className="bg-slate-50/80 px-4 py-4">
                              <div className="mb-3 flex items-center justify-between gap-3">
                                <div>
                                  <h3 className="font-semibold text-navy">Payment history · {fee.student?.name || "Student"} · {fee.month}</h3>
                                  <p className="mt-1 text-xs text-slate-500">Every installment is retained as a separate, read-only transaction.</p>
                                </div>
                                {historyLoading && <span className="text-xs text-slate-500">Loading...</span>}
                              </div>
                              {historyError ? (
                                <button type="button" onClick={() => loadPaymentHistory(fee)} className="btn-secondary px-3 py-2 text-xs">Retry history</button>
                              ) : paymentHistory.length ? (
                                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                                  <table className="w-full min-w-[700px] text-left text-xs">
                                    <thead className="bg-slate-50 text-slate-500">
                                      <tr>
                                        <th className="px-3 py-2.5">Date</th>
                                        <th className="px-3 py-2.5">Receipt</th>
                                        <th className="px-3 py-2.5">Method</th>
                                        <th className="px-3 py-2.5 text-right">Amount</th>
                                        <th className="px-3 py-2.5 text-right">Balance after payment</th>
                                        <th className="px-3 py-2.5 text-right">Receipt</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {paymentHistory.map((payment) => (
                                        <tr key={payment._id}>
                                          <td className="px-3 py-2.5">{formatPaymentDate(payment.date)}</td>
                                          <td className="px-3 py-2.5 font-medium">{payment.receiptNumber || "Legacy record"}</td>
                                          <td className="px-3 py-2.5">{payment.modeOfPayment || "—"}</td>
                                          <td className="px-3 py-2.5 text-right">{formatCurrency(payment.amount)}</td>
                                          <td className="px-3 py-2.5 text-right">{formatCurrency(payment.outstandingBalance)}</td>
                                          <td className="px-3 py-2.5 text-right">
                                            <button type="button" className="btn-outline inline-flex items-center gap-1 px-3 py-1.5" onClick={() => downloadReceipt(fee, payment)}>
                                              <FaDownload aria-hidden="true" /> PDF
                                            </button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : !historyLoading ? (
                                <p className="rounded-lg border border-dashed border-slate-200 bg-white px-4 py-5 text-center text-sm text-slate-500">No payment transactions recorded.</p>
                              ) : null}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {fees.length > pageSize && (
              <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
                <p className="text-xs text-slate-500">Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, fees.length)} of {fees.length}</p>
                <div className="flex gap-2">
                  <button type="button" className="btn-secondary px-3 py-1.5 text-xs" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</button>
                  <button type="button" className="btn-secondary px-3 py-1.5 text-xs" disabled={page >= pageCount} onClick={() => setPage((current) => current + 1)}>Next</button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {payModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-card-hover dark:bg-navy-light">
            <h2 className="font-display text-lg font-bold text-navy dark:text-white">Record payment</h2>
            <p className="mb-4 mt-1 text-sm text-slate-500">
              {payModal.student?.name} · {payModal.month} · Outstanding {formatCurrency(payModal.pending)}
            </p>
            <form onSubmit={handleRecordPayment} className="space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Payment amount
                <div className="relative mt-1">
                  <FaRupeeSign className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" aria-hidden="true" />
                  <input
                    type="number"
                    min="0.01"
                    max={payModal.pending}
                    step="0.01"
                    className="input-field pl-8"
                    value={payAmount}
                    onChange={(event) => setPayAmount(event.target.value)}
                    required
                  />
                </div>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Payment method
                <select className="input-field mt-1" value={payMode} onChange={(event) => setPayMode(event.target.value)}>
                  <option>Cash</option><option>UPI</option><option>Card</option><option>Bank Transfer</option><option>Cheque</option><option>Other</option>
                </select>
              </label>
              <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-500">
                Amount and remaining balance are validated on the server. Submissions use a unique request key to prevent duplicate recording.
              </p>
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" className="btn-outline" disabled={paying} onClick={() => { setPayModal(null); setPayRequestId(""); }}>Cancel</button>
                <button type="submit" disabled={paying} className="btn-primary">{paying ? "Saving..." : "Confirm payment"}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </DashboardLayout>
  );
};

export default FeeManagement;
