import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";
import DashboardLayout from "../components/DashboardLayout";
import api from "../api/axios";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const TeacherPerformance = () => {
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/dashboard")
      .then((res) => setPerformance(res.data.data.teacherPerformance || []))
      .catch(() => toast.error("Could not load teacher performance"))
      .finally(() => setLoading(false));
  }, []);

  const chartData = {
    labels: performance.map((t) => t.name),
    datasets: [
      { label: "Students", data: performance.map((t) => t.studentCount), backgroundColor: "#244A76", borderRadius: 6 },
    ],
  };

  return (
    <DashboardLayout title="Teacher Performance">
      {loading ? (
        <p className="text-slate-400">Loading...</p>
      ) : performance.length === 0 ? (
        <p className="text-slate-400">No teachers yet.</p>
      ) : (
        <>
          <div className="card mb-6">
            <h3 className="font-display font-semibold text-navy dark:text-white mb-4">Students per Teacher</h3>
            <Bar data={chartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </div>

          <div className="card p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-navy-lighter">
                  <th className="py-3 px-4">Teacher</th>
                  <th className="py-3 px-4">Students</th>
                  <th className="py-3 px-4">Average Test Score</th>
                </tr>
              </thead>
              <tbody>
                {performance.map((t) => (
                  <tr key={t.teacherId} className="border-b border-slate-50 dark:border-navy-lighter/50">
                    <td className="py-3 px-4 font-medium text-navy dark:text-white">{t.name}</td>
                    <td className="py-3 px-4">{t.studentCount}</td>
                    <td className="py-3 px-4">
                      {t.averageScorePercent !== null ? `${t.averageScorePercent}%` : "No graded tests yet"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default TeacherPerformance;
