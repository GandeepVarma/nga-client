import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import DashboardLayout from "../components/DashboardLayout";
import api from "../api/axios";

const statusStyle = {
  "Not Started": "bg-blue-100 text-blue-700",
  "In Progress": "bg-amber-100 text-amber-700",
  Completed: "bg-emerald-100 text-emerald-700",
  Upcoming: "bg-slate-200 text-slate-600",
  Closed: "bg-red-100 text-red-700",
};

const StudentOnlineTests = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/online-tests/student").then((res) => setTests(res.data.data)).catch(() => toast.error("Could not load tests")).finally(() => setLoading(false));
  }, []);

  const handleAction = (test) => {
    if (test.status === "Completed") navigate(`/student/online-tests/${test._id}/result`);
    else if (test.status === "Not Started" || test.status === "In Progress") navigate(`/student/online-tests/${test._id}/exam`);
  };

  return (
    <DashboardLayout title="Online Tests">
      {loading ? (
        <p className="text-slate-400">Loading tests...</p>
      ) : tests.length === 0 ? (
        <p className="text-slate-400">No online tests available right now.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {tests.map((t) => (
            <div key={t._id} className="card">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-display font-semibold text-navy dark:text-white">{t.title}</h3>
                <span className={`badge shrink-0 ${statusStyle[t.status]}`}>{t.status}</span>
              </div>
              <p className="text-sm text-slate-400 mb-3">{t.subject}</p>
              <div className="grid grid-cols-3 gap-2 text-center text-xs mb-4">
                <div className="bg-slate-50 dark:bg-navy-lighter rounded-lg py-2"><p className="text-slate-400">Questions</p><p className="font-bold text-navy dark:text-white">{t.questionCount}</p></div>
                <div className="bg-slate-50 dark:bg-navy-lighter rounded-lg py-2"><p className="text-slate-400">Duration</p><p className="font-bold text-navy dark:text-white">{t.duration}m</p></div>
                <div className="bg-slate-50 dark:bg-navy-lighter rounded-lg py-2"><p className="text-slate-400">Marks</p><p className="font-bold text-navy dark:text-white">{t.totalMarks}</p></div>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Window: {new Date(t.startTime).toLocaleString()} → {new Date(t.endTime).toLocaleString()}
              </p>
              <button
                onClick={() => handleAction(t)}
                disabled={t.status === "Upcoming" || t.status === "Closed"}
                className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t.status === "Completed" ? "View Result" : t.status === "In Progress" ? "Resume Test" : t.status === "Not Started" ? "Start Test" : t.status}
              </button>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentOnlineTests;
