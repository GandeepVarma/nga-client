import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from "chart.js";
import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import api from "../api/axios";
import { FaCalendarCheck, FaClipboardList, FaBookOpen, FaMoneyBillWave, FaClock } from "react-icons/fa";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const formatClassDate = (value) => {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

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
    datasets: [{ label: "% Score", data: data.progressGraph.filter((t) => t.percentage !== null).map((t) => t.percentage), borderColor: "#244A76", backgroundColor: "rgba(242, 169, 0, 0.15)", tension: 0.35, fill: true }],
  };

  return (
    <DashboardLayout title="My Dashboard">
      <div className="student-welcome-card card flex items-center gap-4 mb-6 bg-navy text-white">
        <div className="w-16 h-16 rounded-full bg-gold flex items-center justify-center text-navy font-display font-bold text-2xl">{data.welcome.name[0]}</div>
        <div>
          <h2 className="font-display font-bold text-xl">Welcome back, {data.welcome.name}!</h2>
          <p className="text-slate-300 text-sm">{data.welcome.class}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
        <StatCard icon={FaCalendarCheck} label="Attendance" value={`${data.attendancePercentage}%`} accent="bg-emerald-500/15 text-emerald-500" />
        <StatCard icon={FaClipboardList} label="Upcoming Tests" value={data.upcomingTests.length} accent="bg-navy/15 text-navy" />
        <StatCard icon={FaBookOpen} label="Pending Assignments" value={data.pendingAssignmentsCount} accent="bg-amber-500/15 text-amber-500" />
        <StatCard icon={FaMoneyBillWave} label="Fee Pending" value={`₹${data.feeStatus?.pending ?? 0}`} accent="bg-red-500/15 text-red-500" />
      </div>

      <section className="card mb-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Your timetable</p>
            <h3 className="mt-1 font-display font-semibold text-navy dark:text-white">Classes &amp; Recent Attendance</h3>
          </div>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            {data.upcomingClasses?.length || 0} sessions
          </span>
        </div>
        {!data.upcomingClasses?.length ? (
          <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
            No upcoming classes or recently completed sessions.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {data.upcomingClasses.map((scheduledClass) => (
              <li key={scheduledClass._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-navy-lighter dark:bg-navy-light">
                <p className="flex items-center gap-2 text-sm font-semibold text-navy dark:text-white">
                  <FaCalendarCheck className="text-blue-600" aria-hidden="true" />
                  {formatClassDate(scheduledClass.date)}
                </p>
                <p className="mt-2 font-semibold text-slate-800 dark:text-slate-100">{scheduledClass.class}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{scheduledClass.batch || "No batch"}</p>
                <span className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${scheduledClass.session === "morning" ? "bg-amber-100 text-amber-800" : "bg-indigo-100 text-indigo-800"}`}>
                  <FaClock aria-hidden="true" />
                  {scheduledClass.session === "morning" ? "Morning" : "Evening"} session
                </span>
                {scheduledClass.attendanceStatus && (
                  <div className={`mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold ${
                    scheduledClass.attendanceStatus === "Present"
                      ? "text-emerald-700 dark:text-emerald-400"
                      : scheduledClass.attendanceStatus === "Absent"
                        ? "text-red-700 dark:text-red-400"
                        : "text-amber-700 dark:text-amber-400"
                  }`}>
                    <span>Session completed</span>
                    <span className="rounded-full bg-white/80 px-2.5 py-1 dark:bg-navy">
                      {scheduledClass.attendanceStatus}
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

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
