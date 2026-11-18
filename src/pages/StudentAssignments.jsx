import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaFileDownload } from "react-icons/fa";
import DashboardLayout from "../components/DashboardLayout";
import api from "../api/axios";

const StudentAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    api.get("/assignments/my").then((res) => setAssignments(res.data.data)).catch(() => toast.error("Could not load your assignments")).finally(() => setLoading(false));
  }, []);

  const visibleAssignments = assignments.filter((assignment) => {
    const matchesSearch = `${assignment.title} ${assignment.description} ${assignment.class}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || assignment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout title="My Assignments">
      {!loading && assignments.length > 0 && <div className="card mb-5 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
        <input className="input-field" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search assignments..." aria-label="Search assignments" />
        <select className="input-field sm:w-52" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter assignments by status">
          <option value="">All statuses</option><option value="Pending">Pending</option><option value="Completed">Completed</option><option value="Late Submission">Late</option>
        </select>
      </div>}
      {loading ? (
        <p className="text-slate-400">Loading assignments...</p>
      ) : assignments.length === 0 ? (
        <p className="text-slate-400">No assignments yet.</p>
      ) : visibleAssignments.length === 0 ? (
        <div className="card py-10 text-center text-slate-500">No assignments match your search and status filter.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {visibleAssignments.map((a) => (
            <div key={a._id} className="card">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-display font-semibold text-navy dark:text-white">{a.title}</h3>
                <span className={`badge shrink-0 ${a.status === "Completed" ? "bg-emerald-100 text-emerald-700" : a.status === "Late Submission" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>{a.status}</span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{a.description}</p>
              <p className="text-xs text-slate-400 mb-3">Class {a.class} · Due: {new Date(a.submissionDate).toISOString().slice(0, 10)}</p>
              {a.files?.length > 0 && (
                <div className="space-y-1 mb-3">
                  {a.files.map((f, i) => (
                    <a key={i} href={f.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-blue-500 hover:underline"><FaFileDownload /> {f.originalName}</a>
                  ))}
                </div>
              )}
              {a.teacherRemarks && <p className="text-xs bg-slate-50 dark:bg-navy-lighter rounded-lg p-2 text-slate-500 dark:text-slate-300"><span className="font-medium">Teacher's note:</span> {a.teacherRemarks}</p>}
              {a.submittedAt && <p className="mt-2 text-xs text-slate-400">Submission status updated {new Date(a.submittedAt).toLocaleString()}</p>}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentAssignments;
