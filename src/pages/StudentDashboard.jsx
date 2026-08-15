import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from "chart.js";
import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import api from "../api/axios";
import { FaCalendarCheck, FaClipboardList, FaBookOpen, FaMoneyBillWave } from "react-icons/fa";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const StudentDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/dashboard/student").then((res) => setData(res.data.data)).catch(() => toast.error("Could not load your dashboard")).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="My Dashboard">
        <div className="card h-40 animate-pulse bg-slate-100 dark:bg-navy-lighter" />
      </DashboardLayout>
    );
  }

  const chartData = {
    labels: data.progressGraph.filter((t) => t.percentage !== null).map((t) => t.testName),
    datasets: [{ label: "% Score", data: data.progressGraph.filter((t) => t.percentage !== null).map((t) => t.percentage), borderColor: "#F59E0B", backgroundColor: "rgba(245, 158, 11, 0.15)", tension: 0.35, fill: true }],
  };

  return (
    <DashboardLayout title="My Dashboard">
      <div className="card flex items-center gap-4 mb-6 bg-navy text-white">
        <div className="w-16 h-16 rounded-full bg-gold flex items-center justify-center text-navy font-display font-bold text-2xl">{data.welcome.name[0]}</div>
        <div>
          <h2 className="font-display font-bold text-xl">Welcome back, {data.welcome.name}!</h2>
          <p className="text-slate-300 text-sm">{data.welcome.class}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
        <StatCard icon={FaCalendarCheck} label="Attendance" value={`${data.attendancePercentage}%`} accent="bg-emerald-500/15 text-emerald-500" />
        <StatCard icon={FaClipboardList} label="Upcoming Tests" value={data.upcomingTests.length} accent="bg-purple-500/15 text-purple-500" />
        <StatCard icon={FaBookOpen} label="Pending Assignments" value={data.pendingAssignmentsCount} accent="bg-amber-500/15 text-amber-500" />
        <StatCard icon={FaMoneyBillWave} label="Fee Pending" value={`₹${data.feeStatus?.pending ?? 0}`} accent="bg-red-500/15 text-red-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card lg:col-span-2">
          <h3 className="font-display font-semibold text-navy dark:text-white mb-4">Progress Graph</h3>
          {chartData.labels.length > 0 ? <Line data={chartData} options={{ responsive: true, plugins: { legend: { display: false } } }} /> : <p className="text-slate-400 text-sm">No graded tests yet.</p>}
        </div>
        <div className="card">
          <h3 className="font-display font-semibold text-navy dark:text-white mb-4">Upcoming Tests</h3>
          {data.upcomingTests.length === 0 ? <p className="text-slate-400 text-sm">No upcoming tests.</p> : (
            <ul className="space-y-3">
              {data.upcomingTests.map((t) => (
                <li key={t._id} className="text-sm border-b border-slate-50 dark:border-navy-lighter/50 pb-2">
                  <p className="font-medium text-navy dark:text-white">{t.testName}</p>
                  <p className="text-slate-400">{t.subject} &middot; {new Date(t.date).toDateString()}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
