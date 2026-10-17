import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaMoneyBillWave, FaUsers } from "react-icons/fa";
import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import api from "../api/axios";

const formatCurrency = (amount) => `₹${Number(amount || 0).toLocaleString("en-IN")}`;
const formatCount = (count) => Number(count || 0).toLocaleString("en-IN");

const MonthlyEarnings = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    api.get("/admin/earnings")
      .then((response) => {
        if (active) setSummary(response.data.data);
      })
      .catch(() => {
        if (active) toast.error("Could not load monthly earnings");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <DashboardLayout title="Monthly Earnings">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 mb-6">
        <StatCard
          icon={FaMoneyBillWave}
          label="Expected Monthly Earnings"
          value={loading ? "Loading..." : formatCurrency(summary?.monthlyEarnings)}
          accent="bg-emerald-500/15 text-emerald-500"
        />
        <StatCard
          icon={FaUsers}
          label="Active Students Included"
          value={loading ? "Loading..." : Number(summary?.activeStudentCount || 0).toLocaleString("en-IN")}
          accent="bg-blue-500/15 text-blue-500"
        />
      </div>

      <section className="mb-6" aria-labelledby="earnings-groups-heading">
        <h2 id="earnings-groups-heading" className="mb-4 font-display text-lg font-semibold text-navy">Monthly Earnings by Class Group</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {Object.entries(summary?.groupedEarnings || {}).map(([key, group], index) => (
            <StatCard
              key={key}
              icon={index === 3 ? FaUsers : FaMoneyBillWave}
              label={group.label}
              value={loading ? "Loading..." : formatCurrency(group.monthlyEarnings)}
              accent={["bg-emerald-500/15 text-emerald-700", "bg-blue-500/15 text-blue-700", "bg-amber-500/15 text-amber-700", "bg-slate-500/15 text-slate-700"][index]}
            />
          ))}
        </div>
      </section>

      <section className="card mb-6">
        <h2 className="mb-4 font-display font-semibold text-navy">Monthly Income by Class</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-700">
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3 text-right">Active Students</th>
                <th className="px-4 py-3 text-right">Expected Monthly Income</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-700">Loading class earnings...</td></tr>
              ) : summary?.classWise?.length ? (
                summary.classWise.map((entry) => (
                  <tr key={entry.className} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-slate-900">{entry.className}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{formatCount(entry.studentCount)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatCurrency(entry.monthlyEarnings)}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-700">No active students found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="card">
        <h2 className="font-display font-semibold text-navy dark:text-white mb-2">How this is calculated</h2>
        <p className="text-sm font-medium text-slate-700">
          Expected monthly earnings are the sum of the monthly fees set on all active student records. Inactive students are excluded. This is expected fees, not payments collected.
        </p>
      </div>
    </DashboardLayout>
  );
};

export default MonthlyEarnings;
