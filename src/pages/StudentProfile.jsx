import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import toast from "react-hot-toast";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import DashboardLayout from "../components/DashboardLayout";
import api from "../api/axios";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const tabs = ["Personal", "Fees", "Performance", "Attendance", "Assignments"];

const StudentProfile = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("Personal");

  useEffect(() => {
    api
      .get(`/students/${id}/profile`)
      .then((res) => setProfile(res.data.data))
      .catch(() => toast.error("Could not load student profile"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout title="Student Profile">
        <div className="card h-40 animate-pulse bg-slate-100 dark:bg-navy-lighter" />
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout title="Student Profile">
        <p className="text-slate-500">Student not found.</p>
      </DashboardLayout>
    );
  }

  const { personalDetails: p, feeDetails, performance, attendance, assignments } = profile;

  const chartData = {
    labels: performance
      .filter((t) => t.marksObtained !== null)
      .slice(0, 8)
      .reverse()
      .map((t) => t.testName),
    datasets: [
      {
        label: "% Score",
        data: performance
          .filter((t) => t.marksObtained !== null)
          .slice(0, 8)
          .reverse()
          .map((t) => Number(((t.marksObtained / t.maxMarks) * 100).toFixed(1))),
        borderColor: "#F59E0B",
        backgroundColor: "rgba(245, 158, 11, 0.15)",
        tension: 0.35,
        fill: true,
      },
    ],
  };

  return (
    <DashboardLayout title="Student Profile">
      <Link to="/teacher/students" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-navy dark:hover:text-white mb-4">
        <FaArrowLeft /> Back to Students
      </Link>

      <div className="card flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-gold flex items-center justify-center text-navy font-display font-bold text-2xl">
          {p.name[0]}
        </div>
        <div>
          <h2 className="font-display font-bold text-xl text-navy dark:text-white">{p.name}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {p.studentId} &middot; {p.class} &middot;{" "}
            <span className={p.status === "Active" ? "text-emerald-500" : "text-slate-400"}>
              {p.status}
            </span>
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t
                ? "bg-navy text-white dark:bg-gold dark:text-navy"
                : "bg-white dark:bg-navy-light text-slate-500 dark:text-slate-400"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Personal" && (
        <div className="card grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <Info label="Parent Name" value={p.parentName} />
          <Info label="Phone Number" value={p.phone} />
          <Info label="Date of Joining" value={new Date(p.dateOfJoining).toDateString()} />
          <Info label="Monthly Fee" value={`₹${p.monthlyFee}`} />
          <Info label="Admission Fee" value={`₹${p.admissionFee}`} />
          <Info label="Status" value={p.status} />
        </div>
      )}

      {tab === "Fees" && (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100 dark:border-navy-lighter">
                <th className="py-3 px-4">Month</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Paid</th>
                <th className="py-3 px-4">Pending</th>
                <th className="py-3 px-4">Carry Fwd</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {feeDetails.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-400">No fee records yet.</td></tr>
              ) : (
                feeDetails.map((f) => (
                  <tr key={f._id} className="border-b border-slate-50 dark:border-navy-lighter/50">
                    <td className="py-3 px-4">{f.month}</td>
                    <td className="py-3 px-4">₹{f.amount}</td>
                    <td className="py-3 px-4">₹{f.paid}</td>
                    <td className="py-3 px-4">₹{f.pending}</td>
                    <td className="py-3 px-4">₹{f.carryForward}</td>
                    <td className="py-3 px-4">
                      <span className={`badge ${
                        f.status === "Paid" ? "bg-emerald-100 text-emerald-700" :
                        f.status === "Partial" ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                      }`}>{f.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "Performance" && (
        <div className="card">
          <h3 className="font-display font-semibold text-navy dark:text-white mb-4">Progress Over Time</h3>
          {chartData.labels.length > 0 ? (
            <Line data={chartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          ) : (
            <p className="text-slate-400 text-sm">No graded tests yet.</p>
          )}
        </div>
      )}

      {tab === "Attendance" && (
        <div className="card">
          <p className="mb-4 text-sm text-slate-500">
            Attendance Percentage:{" "}
            <span className="font-bold text-navy dark:text-white text-lg">{attendance.percentage}%</span>
          </p>
          <div className="max-h-72 overflow-y-auto space-y-2">
            {attendance.records.map((r) => (
              <div key={r._id} className="flex justify-between text-sm border-b border-slate-50 dark:border-navy-lighter/50 py-2">
                <span>{new Date(r.date).toDateString()}</span>
                <span className={`badge ${
                  r.status === "Present" ? "bg-emerald-100 text-emerald-700" :
                  r.status === "Absent" ? "bg-red-100 text-red-700" :
                  "bg-amber-100 text-amber-700"
                }`}>{r.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "Assignments" && (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100 dark:border-navy-lighter">
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={a._id} className="border-b border-slate-50 dark:border-navy-lighter/50">
                  <td className="py-3 px-4">{a.title}</td>
                  <td className="py-3 px-4">{new Date(a.submissionDate).toDateString()}</td>
                  <td className="py-3 px-4">{a.status}</td>
                  <td className="py-3 px-4">{a.teacherRemarks || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
};

const Info = ({ label, value }) => (
  <div>
    <p className="text-slate-400 text-xs">{label}</p>
    <p className="font-medium text-navy dark:text-white">{value}</p>
  </div>
);

export default StudentProfile;
