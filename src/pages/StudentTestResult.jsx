import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FaArrowLeft, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import DashboardLayout from "../components/DashboardLayout";
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
        <p className="text-slate-400">Result not available yet.</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Test Result">
      <Link to="/student/tests" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-navy dark:hover:text-white mb-4">
        <FaArrowLeft /> Back to Tests
      </Link>

      <div className={`card mb-6 text-center ${result.passed ? "bg-emerald-500" : "bg-red-500"} text-white`}>
        <p className="text-sm opacity-90 mb-1">{result.passed ? "Passed" : "Not Passed"}</p>
        <p className="font-display text-4xl font-bold">{result.score} / {result.totalMarks}</p>
        <p className="text-sm opacity-90 mt-1">{result.percentage}% &middot; Pass mark: {result.passPercentage}%</p>
        {result.autoSubmitted && <p className="text-xs opacity-80 mt-2">This attempt was auto-submitted.</p>}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="card text-center"><p className="text-slate-400 text-xs">Correct</p><p className="font-bold text-emerald-500 text-xl">{result.correctCount}</p></div>
        <div className="card text-center"><p className="text-slate-400 text-xs">Wrong</p><p className="font-bold text-red-500 text-xl">{result.wrongCount}</p></div>
        <div className="card text-center"><p className="text-slate-400 text-xs">Unanswered</p><p className="font-bold text-slate-400 text-xl">{result.unansweredCount}</p></div>
        <div className="card text-center"><p className="text-slate-400 text-xs">Time Taken</p><p className="font-bold text-navy dark:text-white text-xl">{Math.floor(result.timeTakenSeconds / 60)}m</p></div>
      </div>

      {result.review && (
        <div className="card">
          <h3 className="font-display font-semibold text-navy dark:text-white mb-4">Answer Review</h3>
          <div className="space-y-5">
            {result.review.map((q, i) => (
              <div key={i} className="border-b border-slate-50 dark:border-navy-lighter/50 pb-4 last:border-0">
                <p className="text-sm font-medium text-navy dark:text-white mb-2">Q{i + 1}. {q.questionText}</p>
                <div className="space-y-1.5">
                  {q.options.map((opt, oi) => (
                    <div
                      key={oi}
                      className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
                        oi === q.correctOption ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" :
                        oi === q.selectedOption ? "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400" :
                        "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {oi === q.correctOption ? <FaCheckCircle /> : oi === q.selectedOption ? <FaTimesCircle /> : <span className="w-4" />}
                      {String.fromCharCode(65 + oi)}. {opt}
                    </div>
                  ))}
                </div>
                {q.explanation && <p className="text-xs text-slate-400 mt-2">Explanation: {q.explanation}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentTestResult;
