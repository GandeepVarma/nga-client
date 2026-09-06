import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FaBuilding, FaCheckCircle, FaClock, FaBan, FaUserGraduate, FaUserTie } from "react-icons/fa";
import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import api from "../api/axios";

const statusStyle = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-blue-100 text-blue-700",
  REJECTED: "bg-red-100 text-red-700",
  SUSPENDED: "bg-slate-200 text-slate-600",
};

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/super-admin/dashboard").then((res) => setStats(res.data.data)).catch(() => toast.error("Could not load dashboard")).finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout title="Super Admin Dashboard">
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="card h-24 animate-pulse bg-slate-100 dark:bg-navy-lighter" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-6">
            <StatCard icon={FaBuilding} label="Total Academies" value={stats.totalAcademies} accent="bg-blue-500/15 text-blue-500" />
            <StatCard icon={FaCheckCircle} label="Active Academies" value={stats.activeAcademies} accent="bg-emerald-500/15 text-emerald-500" />
            <StatCard icon={FaClock} label="Pending Review" value={stats.pendingAcademies} accent="bg-amber-500/15 text-amber-500" />
            <StatCard icon={FaBan} label="Suspended" value={stats.suspendedAcademies} accent="bg-red-500/15 text-red-500" />
            <StatCard icon={FaUserGraduate} label="Total Students (platform-wide)" value={stats.totalStudents} accent="bg-purple-500/15 text-purple-500" />
            <StatCard icon={FaUserTie} label="Total Teachers (platform-wide)" value={stats.totalTeachers} accent="bg-gold/15 text-gold" />
          </div>

          <div className="card mb-6 bg-slate-50 dark:bg-navy-lighter/40 border border-dashed border-slate-300 dark:border-navy-lighter">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-navy dark:text-white">Revenue & Subscriptions</span> — coming in Phase 3.
              These cards are intentionally left as placeholders rather than showing fabricated numbers.
            </p>
          </div>

          {stats.pendingAcademies > 0 && (
            <div className="card mb-6 border border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                <span className="font-semibold">{stats.pendingAcademies} academy registration(s)</span> awaiting your review.{" "}
                <Link to="/super-admin/academies?status=PENDING" className="underline">Review now</Link>
              </p>
            </div>
          )}

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-navy dark:text-white">Recently Created Academies</h3>
              <Link to="/super-admin/academies" className="text-sm text-gold hover:underline">View all</Link>
            </div>
            {stats.recentAcademies.length === 0 ? (
              <p className="text-slate-400 text-sm">No academies created yet.</p>
            ) : (
              <div className="space-y-2">
                {stats.recentAcademies.map((a) => (
                  <Link key={a._id} to={`/super-admin/academies/${a._id}`} className="flex justify-between items-center text-sm border-b border-slate-50 dark:border-navy-lighter/50 py-2 hover:bg-slate-50 dark:hover:bg-navy-lighter/40 -mx-2 px-2 rounded">
                    <span className="text-navy dark:text-white font-medium">{a.academyName} <span className="text-slate-400 font-normal">({a.academyId})</span></span>
                    <span className={`badge ${statusStyle[a.status]}`}>{a.status}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default SuperAdminDashboard;
