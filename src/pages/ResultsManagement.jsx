import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaEdit, FaImage, FaPlus, FaTrash } from "react-icons/fa";
import DashboardLayout from "../components/DashboardLayout";
import api from "../api/axios";

const emptyForm = {
  studentName: "",
  programName: "",
  marksBefore: "",
  marksAfter: "",
  beforePhoto: null,
  afterPhoto: null,
  beforePhotoUrl: "",
  afterPhotoUrl: "",
};

const ResultsManagement = () => {
  const [results, setResults] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/admin/results");
      setResults(response.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load results");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchResults(); }, [fetchResults]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (result) => {
    setEditing(result);
    setForm({ ...emptyForm, ...result, beforePhoto: null, afterPhoto: null });
    setShowForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    const values = {
      studentName: form.studentName,
      programName: form.programName,
      marksBefore: form.marksBefore,
      marksAfter: form.marksAfter,
      beforePhotoUrl: form.beforePhotoUrl,
      afterPhotoUrl: form.afterPhotoUrl,
    };

    try {
      let payload = values;
      if (form.beforePhoto || form.afterPhoto) {
        payload = new FormData();
        Object.entries(values).forEach(([key, value]) => payload.append(key, value));
        if (form.beforePhoto) payload.append("beforePhoto", form.beforePhoto);
        if (form.afterPhoto) payload.append("afterPhoto", form.afterPhoto);
      }

      if (editing) await api.put(`/admin/results/${editing._id}`, payload);
      else await api.post("/admin/results", payload);
      toast.success(editing ? "Result updated" : "Result added");
      setShowForm(false);
      setForm(emptyForm);
      await fetchResults();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not save result");
    } finally {
      setSaving(false);
    }
  };

  const deleteResult = async (result) => {
    if (!window.confirm(`Delete the result for ${result.studentName || result.programName}?`)) return;
    try {
      await api.delete(`/admin/results/${result._id}`);
      toast.success("Result deleted");
      await fetchResults();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not delete result");
    }
  };

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <DashboardLayout title="Student Results">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div><p className="text-sm text-slate-500 dark:text-slate-300">Publish student progress and before/after marks on the public Results page.</p></div>
        <button type="button" onClick={openCreate} className="btn-primary flex items-center gap-2"><FaPlus /> Add Result</button>
      </div>

      {showForm && <form onSubmit={handleSubmit} className="admin-form-panel card mb-6 grid gap-4 md:grid-cols-2">
        <h2 className="md:col-span-2 font-display font-bold text-xl text-navy dark:text-white">{editing ? "Edit Result" : "Add Student Result"}</h2>
        <label className="admin-form-field"><span>Student name (optional)</span><input value={form.studentName} onChange={(event) => update("studentName", event.target.value)} placeholder="Leave blank to display as Student" /></label>
        <label className="admin-form-field"><span>Program / class</span><input required value={form.programName} onChange={(event) => update("programName", event.target.value)} placeholder="e.g. Class 10 Mathematics" /></label>
        <label className="admin-form-field"><span>Marks before</span><input required value={form.marksBefore} onChange={(event) => update("marksBefore", event.target.value)} placeholder="e.g. 32/50" /></label>
        <label className="admin-form-field"><span>Marks after</span><input required value={form.marksAfter} onChange={(event) => update("marksAfter", event.target.value)} placeholder="e.g. 46/50" /></label>
        <label className="admin-form-field"><span>Before photo</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => update("beforePhoto", event.target.files?.[0] || null)} /></label>
        <label className="admin-form-field"><span>Before photo URL</span><input value={form.beforePhotoUrl} onChange={(event) => update("beforePhotoUrl", event.target.value)} placeholder="https://..." /></label>
        <label className="admin-form-field"><span>After photo</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => update("afterPhoto", event.target.files?.[0] || null)} /></label>
        <label className="admin-form-field"><span>After photo URL</span><input value={form.afterPhotoUrl} onChange={(event) => update("afterPhotoUrl", event.target.value)} placeholder="https://..." /></label>
        <div className="md:col-span-2 flex gap-3"><button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : "Save Result"}</button><button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button></div>
      </form>}

      {loading ? <p className="text-slate-500">Loading results...</p> : results.length === 0 ? <div className="card"><p className="text-slate-500">No results yet. Add a student result to publish it on the public website.</p></div> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{results.map((result) => <article key={result._id} className="admin-program-card card overflow-hidden">
        <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-navy-lighter">
          {result.beforePhotoUrl ? <img src={result.beforePhotoUrl} alt="Before progress" className="h-36 w-full object-cover" /> : <div className="h-36 flex items-center justify-center text-slate-400"><FaImage /></div>}
          {result.afterPhotoUrl ? <img src={result.afterPhotoUrl} alt="After progress" className="h-36 w-full object-cover" /> : <div className="h-36 flex items-center justify-center text-slate-400"><FaImage /></div>}
        </div>
        <div className="p-5">
          <h3 className="font-display font-bold text-lg text-navy dark:text-white">{result.studentName || "Student"}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-300 mt-1">{result.programName}</p>
          <p className="text-sm text-slate-600 dark:text-slate-200 mt-3">Before: <strong>{result.marksBefore}</strong> <span className="mx-1">→</span> After: <strong>{result.marksAfter}</strong></p>
          <div className="flex gap-2 mt-4"><button type="button" onClick={() => openEdit(result)} className="mini-action"><FaEdit /> Edit</button><button type="button" onClick={() => deleteResult(result)} className="mini-action text-red-500"><FaTrash /> Delete</button></div>
        </div>
      </article>)}</div>}
    </DashboardLayout>
  );
};

export default ResultsManagement;