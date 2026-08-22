import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FaArrowLeft } from "react-icons/fa";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";
import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import MathText from "../components/MathText";
import api from "../api/axios";
import { FaUsers, FaCheckCircle, FaTimesCircle, FaTrophy } from "react-icons/fa";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const OnlineTestAnalytics = ({ basePath = "/teacher" }) => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/online-tests/${id}/analytics`).then((res) => setData(res.data.data)).catch(() => toast.error("Could not load analytics")).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout title="Test Analytics">
        <div className="card h-40 animate-pulse bg-slate-100 dark:bg-navy-lighter" />
      </DashboardLayout>
    );
  }

  const distributionChart = {
    labels: data.scoreDistribution.labels,
    datasets: [{ label: "Students", data: data.scoreDistribution.counts, backgroundColor: "#F59E0B", borderRadius: 6 }],
  };

  return (
    <DashboardLayout title="Test Analytics">
      <Link to={`${basePath}/online-tests`} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-navy dark:hover:text-white mb-4">
        <FaArrowLeft /> Back to Tests
      </Link>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
        <StatCard icon={FaUsers} label="Attempted" value={`${data.attempted} / ${data.assignedCount}`} accent="bg-blue-500/15 text-blue-500" />
        <StatCard icon={FaCheckCircle} label="Average Score" value={`${data.average}%`} accent="bg-emerald-500/15 text-emerald-500" />
        <StatCard icon={FaTimesCircle} label="Not Attempted" value={data.notAttempted} accent="bg-red-500/15 text-red-500" />
        <StatCard icon={FaTrophy} label="Pass Rate" value={`${data.passPercentageActual}%`} accent="bg-gold/15 text-gold" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <div className="card">
          <h3 className="font-display font-semibold text-navy dark:text-white mb-4">Score Distribution</h3>
          <Bar data={distributionChart} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </div>
        <div className="card">
          <h3 className="font-display font-semibold text-navy dark:text-white mb-4">Top Performers</h3>
          {data.topPerformers.length === 0 ? (
            <p className="text-slate-400 text-sm">No submissions yet.</p>
          ) : (
            <ul className="space-y-2">
              {data.topPerformers.map((p, i) => (
                <li key={i} className="flex justify-between text-sm border-b border-slate-50 dark:border-navy-lighter/50 pb-2">
                  <span className="text-navy dark:text-white font-medium">#{i + 1} {p.student?.name} <span className="text-slate-400 font-normal">({p.student?.studentId})</span></span>
                  <span className="text-slate-500">{p.percentage}%</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="font-display font-semibold text-navy dark:text-white mb-4">Question-wise Accuracy</h3>
        <div className="space-y-3">
          {data.questionAccuracy.map((q, i) => (
            <div key={q.questionId}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600 dark:text-slate-300 truncate max-w-[70%]">Q{i + 1}. <MathText text={q.questionText} /></span>
                <span className="text-slate-400">{q.accuracyPercent}%</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-navy-lighter rounded-full overflow-hidden">
                <div className="h-full bg-gold" style={{ width: `${q.accuracyPercent}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OnlineTestAnalytics;
