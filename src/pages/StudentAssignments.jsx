import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaFileDownload } from "react-icons/fa";
import DashboardLayout from "../components/DashboardLayout";
import api from "../api/axios";

const StudentAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/assignments/my").then((res) => setAssignments(res.data.data)).catch(() => toast.error("Could not load your assignments")).finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout title="My Assignments">
      {loading ? (
        <p className="text-slate-400">Loading assignments...</p>
      ) : assignments.length === 0 ? (
        <p className="text-slate-400">No assignments yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {assignments.map((a) => (
            <div key={a._id} className="card">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-display font-semibold text-navy dark:text-white">{a.title}</h3>
                <span className={`badge shrink-0 ${a.status === "Completed" ? "bg-emerald-100 text-emerald-700" : a.status === "Late Submission" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>{a.status}</span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{a.description}</p>
              <p className="text-xs text-slate-400 mb-3">Due: {new Date(a.submissionDate).toDateString()}</p>
              {a.files?.length > 0 && (
                <div className="space-y-1 mb-3">
                  {a.files.map((f, i) => (
                    <a key={i} href={f.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-blue-500 hover:underline"><FaFileDownload /> {f.originalName}</a>
                  ))}
                </div>
              )}
              {a.teacherRemarks && <p className="text-xs bg-slate-50 dark:bg-navy-lighter rounded-lg p-2 text-slate-500 dark:text-slate-300"><span className="font-medium">Teacher's note:</span> {a.teacherRemarks}</p>}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentAssignments;
