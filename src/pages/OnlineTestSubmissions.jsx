import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FaArrowLeft } from "react-icons/fa";
import DashboardLayout from "../components/DashboardLayout";
import api from "../api/axios";

const OnlineTestSubmissions = ({ basePath = "/teacher" }) => {
  const { id } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 15;

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/online-tests/${id}/submissions`, { params: { page, limit } });
      setSubmissions(res.data.data);
      setTotal(res.data.total);
    } catch {
      toast.error("Could not load submissions");
    } finally {
      setLoading(false);
    }
  }, [id, page]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return (
    <DashboardLayout title="Test Submissions">
      <Link to={`${basePath}/online-tests`} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-navy dark:hover:text-white mb-4">
        <FaArrowLeft /> Back to Tests
      </Link>

      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-navy-lighter">
              <th className="py-3 px-4">Student</th>
              <th className="py-3 px-4">Class</th>
              <th className="py-3 px-4">Score</th>
              <th className="py-3 px-4">Percentage</th>
              <th className="py-3 px-4">Correct / Wrong / Skipped</th>
              <th className="py-3 px-4">Time Taken</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-10 text-slate-400">Loading...</td></tr>
            ) : submissions.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-slate-400">No submissions yet.</td></tr>
            ) : (
              submissions.map((s) => (
                <tr key={s._id} className="border-b border-slate-50 dark:border-navy-lighter/50">
                  <td className="py-3 px-4 font-medium text-navy dark:text-white">{s.student?.name} <span className="text-slate-400 font-normal">({s.student?.studentId})</span></td>
                  <td className="py-3 px-4">{s.student?.class}</td>
                  <td className="py-3 px-4">{s.score ?? "-"}</td>
                  <td className="py-3 px-4">{s.percentage ?? "-"}%</td>
                  <td className="py-3 px-4">{s.correctCount} / {s.wrongCount} / {s.unansweredCount}</td>
                  <td className="py-3 px-4">{s.timeTakenSeconds ? `${Math.floor(s.timeTakenSeconds / 60)}m ${s.timeTakenSeconds % 60}s` : "-"}</td>
                  <td className="py-3 px-4">
                    <span className={`badge ${
                      !s.submittedAt ? "bg-blue-100 text-blue-700" :
                      s.autoSubmitted ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                    }`}>
                      {!s.submittedAt ? "In Progress" : s.autoSubmitted ? "Auto-submitted" : "Submitted"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button key={i} onClick={() => setPage(i + 1)} className={`w-8 h-8 rounded-lg text-sm ${page === i + 1 ? "bg-gold text-navy font-semibold" : "bg-white dark:bg-navy-light text-slate-500"}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default OnlineTestSubmissions;
