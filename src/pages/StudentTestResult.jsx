import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FaArrowLeft } from "react-icons/fa";
import DashboardLayout from "../components/DashboardLayout";
import OnlineTestAnswerReview from "../components/OnlineTestAnswerReview";
import api from "../api/axios";

const StudentTestResult = () => {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/online-tests/student/${id}/result`).then((res) => setResult(res.data.data)).catch((err) => toast.error(err.response?.data?.message || "Could not load result")).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout title="Test Result">
        <div className="card h-40 animate-pulse bg-slate-100 dark:bg-navy-lighter" />
      </DashboardLayout>
    );
  }

  if (!result) {
    return (
      <DashboardLayout title="Test Result">
        <p className="text-slate-700 dark:text-slate-300">Result not available yet.</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Test Result">
      <Link to="/student/online-tests" className="inline-flex items-center gap-2 text-sm text-slate-700 hover:text-navy mb-4">
        <FaArrowLeft /> Back to Tests
      </Link>

      <div className={`card mb-6 text-center ${result.passed ? "bg-emerald-50" : "bg-red-50"}`}>
        <p className={`mb-1 text-sm font-semibold ${result.passed ? "text-emerald-800" : "text-red-800"}`}>{result.passed ? "Passed" : "Not Passed"}</p>
        <p className="font-display text-4xl font-bold text-slate-900">{result.score} / {result.totalMarks}</p>
        <p className="mt-1 text-sm text-slate-700">{result.percentage}% &middot; Pass mark: {result.passPercentage}%</p>
        {result.autoSubmitted && <p className="mt-2 text-xs text-slate-700">This attempt was auto-submitted.</p>}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="card text-center"><p className="text-slate-700 text-xs">Correct</p><p className="font-bold text-emerald-600 text-xl">{result.correctCount}</p></div>
        <div className="card text-center"><p className="text-slate-700 text-xs">Wrong</p><p className="font-bold text-red-600 text-xl">{result.wrongCount}</p></div>
        <div className="card text-center"><p className="text-slate-700 text-xs">Unanswered</p><p className="font-bold text-slate-700 text-xl">{result.unansweredCount}</p></div>
        <div className="card text-center"><p className="text-slate-700 text-xs">Time Taken</p><p className="font-bold text-slate-900 text-xl">{Math.floor(result.timeTakenSeconds / 60)}m</p></div>
      </div>

      {result.review && (
        <div className="card">
          <h3 className="font-display font-semibold text-navy dark:text-white mb-4">Answer Review</h3>
          <OnlineTestAnswerReview review={result.review} />
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentTestResult;
