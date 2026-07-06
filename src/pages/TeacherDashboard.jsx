import React, { useEffect, useState } from "react";
import {
  FaUsers,
  FaCalendarCheck,
  FaMoneyBillWave,
  FaClipboardList,
  FaBookOpen,
  FaChartLine,
} from "react-icons/fa";
import toast from "react-hot-toast";
import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import api from "../api/axios";

const TeacherDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/dashboard/teacher")
      .then((res) => setStats(res.data.data))
      .catch(() => toast.error("Could not load dashboard stats"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout title="Dashboard">
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card h-24 animate-pulse bg-slate-100 dark:bg-navy-lighter" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          <StatCard
            icon={FaUsers}
            label="Total Students"
            value={stats?.totalStudents ?? 0}
            accent="bg-blue-500/15 text-blue-500"
          />
          <StatCard
            icon={FaCalendarCheck}
            label="Today's Attendance"
            value={`${stats?.todaysAttendance?.present ?? 0} / ${stats?.todaysAttendance?.totalStudents ?? 0}`}
            accent="bg-emerald-500/15 text-emerald-500"
          />
          <StatCard
            icon={FaMoneyBillWave}
            label="Pending Fees"
            value={`₹${(stats?.pendingFees ?? 0).toLocaleString("en-IN")}`}
            accent="bg-red-500/15 text-red-500"
          />
          <StatCard
            icon={FaClipboardList}
            label="Upcoming Tests"
            value={stats?.upcomingTests ?? 0}
            accent="bg-purple-500/15 text-purple-500"
          />
          <StatCard
            icon={FaBookOpen}
            label="Assignments Pending"
            value={stats?.assignmentsPending ?? 0}
            accent="bg-amber-500/15 text-amber-500"
          />
          <StatCard
            icon={FaChartLine}
            label="Monthly Collection"
            value={`₹${(stats?.monthlyCollection ?? 0).toLocaleString("en-IN")}`}
            accent="bg-gold/15 text-gold"
          />
        </div>
      )}

      <div className="card mt-6">
        <h2 className="font-display font-semibold text-navy dark:text-white mb-2">
          Welcome to NextGen Learning Academy
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Use the sidebar to manage students, tests, assignments, fees, and
          attendance. Stats above update automatically as you record data.
        </p>
      </div>
    </DashboardLayout>
  );
};

export default TeacherDashboard;
