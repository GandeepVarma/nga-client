import React, { useEffect, useState } from "react";
import { FaUsers, FaCalendarCheck, FaClipboardList, FaBookOpen } from "react-icons/fa";
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
    <DashboardLayout title="My Dashboard">
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card h-24 animate-pulse bg-slate-100 dark:bg-navy-lighter" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          <StatCard icon={FaUsers} label="My Students" value={stats?.totalStudents ?? 0} accent="bg-blue-500/15 text-blue-500" />
          <StatCard
            icon={FaCalendarCheck}
            label="Today's Attendance"
            value={`${stats?.todaysAttendance?.present ?? 0} / ${stats?.todaysAttendance?.totalStudents ?? 0}`}
            accent="bg-emerald-500/15 text-emerald-500"
          />
          <StatCard icon={FaClipboardList} label="Upcoming Tests" value={stats?.upcomingTests ?? 0} accent="bg-navy/15 text-navy" />
          <StatCard icon={FaBookOpen} label="Assignments Pending" value={stats?.assignmentsPending ?? 0} accent="bg-amber-500/15 text-amber-500" />
        </div>
      )}

      <div className="card mt-6">
        <h2 className="font-display font-semibold text-navy dark:text-white mb-4">Recent Test Entries</h2>
        {stats?.recentTests?.length > 0 ? (
          <ul className="space-y-3">
            {stats.recentTests.map((t) => (
              <li key={t._id} className="text-sm border-b border-slate-50 dark:border-navy-lighter/50 pb-2">
                <p className="font-medium text-navy dark:text-white">{t.testName}</p>
                <p className="text-slate-400">{t.subject} &middot; {new Date(t.date).toDateString()} &middot; Max {t.maxMarks}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-500 dark:text-slate-400 text-sm">No tests yet for your students.</p>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TeacherDashboard;
