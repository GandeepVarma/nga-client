import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import api from "../api/axios";
import {
  FaUserTie,
  FaUsers,
  FaCalendarCheck,
  FaMoneyBillWave,
  FaChartLine,
} from "react-icons/fa";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/dashboard")
      .then((res) => setStats(res.data.data))
      .catch(() => toast.error("Could not load dashboard stats"))
      .finally(() => setLoading(false));
  }, []);

  const revenueChartData = {
    labels: stats?.monthlyRevenueChart?.map((m) => m.month) || [],
    datasets: [
      {
        label: "Revenue",
        data: stats?.monthlyRevenueChart?.map((m) => m.revenue) || [],
        backgroundColor: "#E08700",
        borderRadius: 6,
      },
    ],
  };

  const performanceChartData = {
    labels: stats?.teacherPerformance?.map((t) => t.name) || [],
    datasets: [
      {
        label: "Avg Score %",
        data: stats?.teacherPerformance?.map((t) => t.averageScorePercent ?? 0) || [],
        backgroundColor: "#1F4068",
        borderRadius: 6,
      },
    ],
  };

  return (
    <DashboardLayout title="Admin Dashboard">
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card h-24 animate-pulse bg-slate-100 dark:bg-navy-lighter" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          <StatCard icon={FaUserTie} label="Total Teachers" value={stats?.totalTeachers ?? 0} accent="bg-blue-500/15 text-blue-500" />
          <StatCard icon={FaUsers} label="Total Students" value={stats?.totalStudents ?? 0} accent="bg-purple-500/15 text-purple-500" />
          <StatCard
            icon={FaCalendarCheck}
            label="Today's Attendance"
            value={`${stats?.todaysAttendance?.present ?? 0} / ${stats?.todaysAttendance?.totalStudents ?? 0}`}
            accent="bg-emerald-500/15 text-emerald-500"
          />
          <StatCard icon={FaMoneyBillWave} label="Fees Collected" value={`₹${(stats?.feesCollected ?? 0).toLocaleString("en-IN")}`} accent="bg-gold/15 text-gold" />
          <StatCard icon={FaMoneyBillWave} label="Pending Fees" value={`₹${(stats?.pendingFees ?? 0).toLocaleString("en-IN")}`} accent="bg-red-500/15 text-red-500" />
          <StatCard icon={FaChartLine} label="This Month's Revenue" value={`₹${(stats?.monthlyRevenue ?? 0).toLocaleString("en-IN")}`} accent="bg-amber-500/15 text-amber-500" />
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
          <div className="admin-chart-card card">
            <h3 className="font-display font-semibold text-navy dark:text-white mb-4">Monthly Revenue</h3>
            {revenueChartData.labels.length > 0 ? (
              <Bar data={revenueChartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
            ) : (
              <p className="text-slate-400 text-sm">No fee collection data yet.</p>
            )}
          </div>
          <div className="admin-chart-card card">
            <h3 className="font-display font-semibold text-navy dark:text-white mb-4">Teacher Performance (Avg Test Score)</h3>
            {performanceChartData.labels.length > 0 ? (
              <Bar data={performanceChartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
            ) : (
              <p className="text-slate-400 text-sm">No teachers yet.</p>
            )}
          </div>
        </div>
      )}

      {!loading && (
        <div className="card mt-6">
          <h3 className="font-display font-semibold text-navy dark:text-white mb-4">Recent Admissions</h3>
          {stats?.recentAdmissions?.length > 0 ? (
            <div className="space-y-2">
              {stats.recentAdmissions.map((s) => (
                <div key={s._id} className="flex justify-between text-sm border-b border-slate-50 dark:border-navy-lighter/50 py-2">
                  <span className="text-navy dark:text-white font-medium">{s.name} <span className="text-slate-400 font-normal">({s.studentId})</span></span>
                  <span className="text-slate-400">{s.class} &middot; {new Date(s.dateOfJoining).toDateString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm">No admissions yet.</p>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminDashboard;
