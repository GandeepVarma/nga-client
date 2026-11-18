import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import DashboardLayout from "../components/DashboardLayout";
import api from "../api/axios";

const StudentTests = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const dateOnly = (value) => (value ? new Date(value).toISOString().slice(0, 10) : "—");

  useEffect(() => {
    api.get("/tests/my").then((res) => setTests(res.data.data)).catch(() => toast.error("Could not load your tests")).finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout title="My Tests">
      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-navy-lighter">
              <th className="py-3 px-4">Test Name</th><th className="py-3 px-4">Subject</th><th className="py-3 px-4">Date</th><th className="py-3 px-4">Marks</th><th className="py-3 px-4">Percentage</th><th className="py-3 px-4">Grade</th><th className="py-3 px-4">Rank</th><th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-10 text-slate-400">Loading...</td></tr>
            ) : tests.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-10 text-slate-400">No tests assigned yet.</td></tr>
            ) : (
              tests.map((t) => {
                const now = new Date();
                const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
                const isPast = dateOnly(t.date) < today;
                const graded = t.marksObtained !== null;
                return (
                  <tr key={t._id} className="border-b border-slate-50 dark:border-navy-lighter/50">
                    <td className="py-3 px-4 font-medium text-navy dark:text-white">{t.testName}</td>
                    <td className="py-3 px-4">{t.subject}</td>
                    <td className="py-3 px-4">{dateOnly(t.date)}</td>
                    <td className="py-3 px-4">{graded ? `${t.marksObtained} / ${t.maxMarks}` : "—"}</td>
                    <td className="py-3 px-4">{graded ? `${t.percentage}%` : "—"}</td>
                    <td className="py-3 px-4">{graded ? t.grade : "—"}</td>
                    <td className="py-3 px-4">{graded ? `#${t.rank}` : "—"}</td>
                    <td className="py-3 px-4"><span className={`badge ${graded ? "bg-emerald-100 text-emerald-700" : isPast ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>{graded ? "Graded" : isPast ? "Awaiting Marks" : "Upcoming"}</span></td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
};

export default StudentTests;
