import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaMoneyBillWave, FaUsers } from "react-icons/fa";
import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import api from "../api/axios";

const formatCurrency = (amount) => `₹${Number(amount || 0).toLocaleString("en-IN")}`;

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

      <div className="card">
        <h2 className="font-display font-semibold text-navy dark:text-white mb-2">How this is calculated</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Expected monthly earnings are the sum of the monthly fees set on all active student records. Inactive students are excluded. This is expected fees, not payments collected.
        </p>
      </div>
    </DashboardLayout>
  );
};

export default MonthlyEarnings;
