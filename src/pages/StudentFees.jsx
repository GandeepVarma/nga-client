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

  return (
    <DashboardLayout title="Fee Status">
      {loading ? (
        <p className="text-slate-400">Loading...</p>
      ) : fees.length === 0 ? (
        <p className="text-slate-400">No fee records yet.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
            <div className="card"><p className="text-slate-500 dark:text-slate-400 text-sm">Current Month</p><p className="font-display text-2xl font-bold text-navy dark:text-white">{current.month}</p></div>
            <div className="card"><p className="text-slate-500 dark:text-slate-400 text-sm">Pending Amount</p><p className="font-display text-2xl font-bold text-red-500">₹{current.pending}</p></div>
            <div className="card"><p className="text-slate-500 dark:text-slate-400 text-sm">Carry Forward</p><p className="font-display text-2xl font-bold text-navy dark:text-white">₹{current.carryForward}</p></div>
          </div>
          <div className="card p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-navy-lighter">
                  <th className="py-3 px-4">Month</th><th className="py-3 px-4">Amount</th><th className="py-3 px-4">Paid</th><th className="py-3 px-4">Pending</th><th className="py-3 px-4">Payment Date</th><th className="py-3 px-4">Mode</th><th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {fees.map((f) => (
                  <tr key={f._id} className="border-b border-slate-50 dark:border-navy-lighter/50">
                    <td className="py-3 px-4">{f.month}</td><td className="py-3 px-4">₹{f.amount}</td><td className="py-3 px-4">₹{f.paid}</td><td className="py-3 px-4">₹{f.pending}</td>
                    <td className="py-3 px-4">{f.paymentDate ? new Date(f.paymentDate).toDateString() : "-"}</td><td className="py-3 px-4">{f.modeOfPayment || "-"}</td>
                    <td className="py-3 px-4"><span className={`badge ${f.status === "Paid" ? "bg-emerald-100 text-emerald-700" : f.status === "Partial" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>{f.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default StudentFees;
