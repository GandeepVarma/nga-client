import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FaPlus, FaSearch, FaCopy, FaTrash, FaChartBar, FaListAlt, FaDownload } from "react-icons/fa";
import DashboardLayout from "../components/DashboardLayout";
import api from "../api/axios";

const OnlineTestManagement = ({ basePath = "/teacher" }) => {
  const [tests, setTests] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [duplicateTarget, setDuplicateTarget] = useState(null);
  const [duplicateForm, setDuplicateForm] = useState({ class: "", batch: "" });
  const [assignmentOptions, setAssignmentOptions] = useState({ classes: [], batches: [] });
  const limit = 10;

  const fetchTests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/online-tests", { params: { search: search || undefined, page, limit } });
      setTests(res.data.data);
      setTotal(res.data.total);
    } catch {
      toast.error("Could not load tests");
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    const debounce = setTimeout(fetchTests, 300);
    return () => clearTimeout(debounce);
  }, [fetchTests]);

  const togglePublish = async (test) => {
    try {
      await api.post(`/online-tests/${test._id}/publish`, { publish: !test.published });
      toast.success(test.published ? "Unpublished" : "Published — students can now see it");
      fetchTests();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    }
  };

  const handleDuplicate = async (test) => {
    try {
      const response = await api.get("/online-tests/assignment-options");
      setAssignmentOptions((current) => ({ ...current, classes: response.data.data.classes }));
      const batchesResponse = test.class
        ? await api.get("/online-tests/assignment-options", { params: { class: test.class } })
        : { data: { data: { batches: [] } } };
      setAssignmentOptions((current) => ({ ...current, batches: batchesResponse.data.data.batches }));
      setDuplicateTarget(test);
      setDuplicateForm({ class: test.class || "", batch: test.batch || "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Duplicate failed");
    }
  };

  const confirmDuplicate = async () => {
    if (!duplicateForm.class || !duplicateForm.batch) {
      toast.error("Please select a class and batch.");
      return;
    }
    try {
      await api.post(`/online-tests/${duplicateTarget._id}/duplicate`, duplicateForm);
      toast.success("Test duplicated (as draft)");
      setDuplicateTarget(null);
      fetchTests();
    } catch (err) {
      toast.error(err.response?.data?.message || "Duplicate failed");
    }
  };

  const loadDuplicateBatches = async (className) => {
    setDuplicateForm((current) => ({ ...current, class: className, batch: "" }));
    if (!className) return setAssignmentOptions((current) => ({ ...current, batches: [] }));
    try {
      const response = await api.get("/online-tests/assignment-options", { params: { class: className } });
      setAssignmentOptions((current) => ({ ...current, batches: response.data.data.batches }));
    } catch {
      toast.error("Could not load batches for this class");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this test and all student submissions? This cannot be undone.")) return;
    try {
      await api.delete(`/online-tests/${id}`);
      toast.success("Test deleted");
      fetchTests();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  const handleExport = async (test) => {
    try {
      const res = await api.get(`/online-tests/${test._id}/export`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${test.title.replace(/\s+/g, "_")}_results.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      toast.error("Export failed");
    }
  };

  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return (
    <DashboardLayout title="Online MCQ Tests">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="relative max-w-sm flex-1">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <input className="input-field pl-9" placeholder="Search tests..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Link to={`${basePath}/online-tests/new`} className="btn-primary flex items-center gap-2 shrink-0">
          <FaPlus /> Create Test
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {loading ? (
          <p className="text-slate-400">Loading tests...</p>
        ) : tests.length === 0 ? (
          <p className="text-slate-400">No MCQ tests yet. Create one to get started.</p>
        ) : (
          tests.map((t) => (
            <div key={t._id} className="card">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-display font-semibold text-navy dark:text-white">{t.title}</h3>
                  <p className="text-sm text-slate-400">{t.subject} &middot; Class {t.class || "Unassigned"} &middot; {t.batch || "Unassigned"}</p>
                </div>
                <span className={`badge shrink-0 ${t.published ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                  {t.published ? "Published" : "Draft"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                {t.questions.length} questions &middot; {t.duration} min &middot; {new Date(t.startTime).toLocaleString()} → {new Date(t.endTime).toLocaleString()}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Link to={`${basePath}/online-tests/${t._id}/edit`} className="btn-outline text-xs py-2 text-center">Edit</Link>
                <button onClick={() => togglePublish(t)} className="btn-outline text-xs py-2">
                  {t.published ? "Unpublish" : "Publish"}
                </button>
                <Link to={`${basePath}/online-tests/${t._id}/analytics`} className="btn-outline text-xs py-2 flex items-center justify-center gap-1">
                  <FaChartBar /> Analytics
                </Link>
                <Link to={`${basePath}/online-tests/${t._id}/submissions`} className="btn-outline text-xs py-2 flex items-center justify-center gap-1">
                  <FaListAlt /> Submissions
                </Link>
                <button onClick={() => handleDuplicate(t)} className="btn-outline text-xs py-2 flex items-center justify-center gap-1">
                  <FaCopy /> Duplicate
                </button>
                <button onClick={() => handleExport(t)} className="btn-outline text-xs py-2 flex items-center justify-center gap-1">
                  <FaDownload /> Export CSV
                </button>
              </div>
              <button onClick={() => handleDelete(t._id)} className="w-full mt-2 text-xs text-red-500 hover:underline flex items-center justify-center gap-1">
                <FaTrash /> Delete Test
              </button>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`w-8 h-8 rounded-lg text-sm ${page === i + 1 ? "bg-gold text-navy font-semibold" : "bg-white dark:bg-navy-light text-slate-500"}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {duplicateTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center">
          <div className="card w-full max-w-md space-y-4">
            <h2 className="font-display font-semibold text-lg text-navy dark:text-white">Duplicate Test Assignment</h2>
            <p className="text-sm text-slate-500">Choose the class and batch for the new draft.</p>
            <select className="input-field" value={duplicateForm.class} onChange={(e) => loadDuplicateBatches(e.target.value)}>
              <option value="">Select class</option>
              {assignmentOptions.classes.map((className) => <option key={className} value={className}>{className}</option>)}
            </select>
            <select className="input-field" disabled={!duplicateForm.class} value={duplicateForm.batch} onChange={(e) => setDuplicateForm({ ...duplicateForm, batch: e.target.value })}>
              <option value="">Select batch</option>
              {assignmentOptions.batches.map((batch) => <option key={batch} value={batch}>{batch}</option>)}
            </select>
            <div className="flex justify-end gap-3"><button className="btn-outline" onClick={() => setDuplicateTarget(null)}>Cancel</button><button className="btn-primary" onClick={confirmDuplicate}>Duplicate</button></div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default OnlineTestManagement;
