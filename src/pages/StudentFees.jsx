import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import DashboardLayout from "../components/DashboardLayout";
import api from "../api/axios";

const StudentFees = () => {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/fees/my").then((res) => setFees(res.data.data)).catch(() => toast.error("Could not load your fee records")).finally(() => setLoading(false));
  }, []);

  const current = fees[0];
  const statusClass = {
    Paid: "bg-emerald-100 text-emerald-700",
    "Partially Paid": "bg-amber-100 text-amber-700",
    Partial: "bg-amber-100 text-amber-700",
    Pending: "bg-red-100 text-red-700",
    Overdue: "bg-red-100 text-red-700",
  };

  return (
    <DashboardLayout title="Fee Status">
      <div className="text-navy dark:text-slate-100">
      {loading ? (
        <p className="text-slate-700 dark:text-slate-300">Loading...</p>
      ) : fees.length === 0 ? (
        <p className="text-slate-700 dark:text-slate-300">No fee records yet.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
            <div className="card"><p className="text-slate-600 dark:text-slate-400 text-sm">Current Month</p><p className="font-display text-2xl font-bold text-navy dark:text-white">{current.month}</p></div>
            <div className="card"><p className="text-slate-600 dark:text-slate-400 text-sm">Pending Amount</p><p className="font-display text-2xl font-bold text-red-500">₹{Number(current.pending).toLocaleString("en-IN")}</p></div>
            <div className="card"><p className="text-slate-600 dark:text-slate-400 text-sm">Carry Forward</p><p className="font-display text-2xl font-bold text-navy dark:text-white">₹{current.carryForward}</p></div>
          </div>
          <div className="card p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-navy-lighter">
                  <th className="py-3 px-4">Month</th><th className="py-3 px-4">Expected</th><th className="py-3 px-4">Paid</th><th className="py-3 px-4">Pending</th><th className="py-3 px-4">Payment history</th><th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {fees.map((f) => (
                  <tr key={f._id} className="border-b border-slate-50 dark:border-navy-lighter/50">
                    <td className="py-3 px-4">{f.month}</td>
                    <td className="py-3 px-4">₹{Number(f.amount + f.carryForward).toLocaleString("en-IN")}</td>
                    <td className="py-3 px-4">₹{Number(f.paid).toLocaleString("en-IN")}</td>
                    <td className="py-3 px-4">₹{Number(f.pending).toLocaleString("en-IN")}</td>
                    <td className="py-3 px-4">
                      {f.paymentHistory?.length ? (
                        <div className="space-y-1">
                          {f.paymentHistory.map((payment) => (
                            <p key={payment._id} className="whitespace-nowrap text-xs">
                              ₹{Number(payment.amount).toLocaleString("en-IN")} · {payment.modeOfPayment || "—"} · {payment.date ? new Date(payment.date).toLocaleDateString("en-IN") : "Date unavailable"}
                            </p>
                          ))}
                        </div>
                      ) : <span className="text-slate-400">No payments</span>}
                    </td>
                    <td className="py-3 px-4"><span className={`badge ${statusClass[f.displayStatus || f.status] || "bg-slate-100 text-slate-700"}`}>{f.displayStatus || (f.status === "Partial" ? "Partially Paid" : f.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      </div>
    </DashboardLayout>
  );
};

export default StudentFees;
