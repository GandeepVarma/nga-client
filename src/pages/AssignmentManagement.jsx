import React, { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { FaPlus, FaTrash, FaUsers } from "react-icons/fa";
import DashboardLayout from "../components/DashboardLayout";
import api from "../api/axios";

const emptyForm = { title: "", description: "", class: "", submissionDate: "" };

const AssignmentManagement = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classFilter, setClassFilter] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [statusModal, setStatusModal] = useState(null);
  const [savingStatusFor, setSavingStatusFor] = useState(null);

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/assignments", { params: { class: classFilter || undefined } });
      setAssignments(res.data.data);
    } catch {
      toast.error("Could not load assignments");
    } finally {
      setLoading(false);
    }
  }, [classFilter]);

  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      files.forEach((f) => data.append("files", f));
      await api.post("/assignments", data, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Assignment created and students notified");
      setShowCreateModal(false);
      setForm(emptyForm);
      setFiles([]);
      fetchAssignments();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create assignment");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this assignment?")) return;
    try {
      await api.delete(`/assignments/${id}`);
      toast.success("Assignment deleted");
      fetchAssignments();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  const openStatusModal = async (assignment) => {
    try {
      const res = await api.get(`/assignments/${assignment._id}`);
      setStatusModal(res.data.data);
    } catch {
      toast.error("Could not load assignment details");
    }
  };

  const updateStatus = async (studentId, status) => {
    setSavingStatusFor(studentId);
    try {
      await api.put(`/assignments/${statusModal._id}/status/${studentId}`, { status });
      setStatusModal((prev) => ({
        ...prev,
        assignedStudents: prev.assignedStudents.map((s) => (s.student._id === studentId ? { ...s, status } : s)),
      }));
      toast.success("Status updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setSavingStatusFor(null);
    }
  };

  return (
    <DashboardLayout title="Assignment Management">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <input className="input-field max-w-[200px]" placeholder="Filter by class" value={classFilter} onChange={(e) => setClassFilter(e.target.value)} />
        <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
          <FaPlus /> Create Assignment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {loading ? (
          <p className="text-slate-400">Loading assignments...</p>
        ) : assignments.length === 0 ? (
          <p className="text-slate-400">No assignments yet. Create one to get started.</p>
        ) : (
          assignments.map((a) => {
            const pendingCount = a.assignedStudents.filter((s) => s.status === "Pending").length;
            return (
              <div key={a._id} className="card">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-display font-semibold text-navy dark:text-white">{a.title}</h3>
                    <p className="text-sm text-slate-400">{a.class}</p>
                  </div>
                  <button onClick={() => handleDelete(a._id)} title="Delete assignment"><FaTrash className="text-slate-400 hover:text-red-500" /></button>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{a.description}</p>
                <p className="text-xs text-slate-400 mb-4">Due: {new Date(a.submissionDate).toDateString()} &middot; {pendingCount} pending</p>
                <button onClick={() => openStatusModal(a)} className="btn-secondary w-full flex items-center justify-center gap-2 text-sm"><FaUsers /> Manage Submissions</button>
              </div>
            );
          })
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-light rounded-xl2 shadow-card-hover w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-display font-bold text-lg text-navy dark:text-white mb-4">Create Assignment</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div><label className="text-sm font-medium block mb-1">Title</label><input className="input-field" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div><label className="text-sm font-medium block mb-1">Description / Instructions</label><textarea className="input-field" rows={3} required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium block mb-1">Class</label><input className="input-field" required value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })} /></div>
                <div><label className="text-sm font-medium block mb-1">Due Date</label><input type="date" className="input-field" required value={form.submissionDate} onChange={(e) => setForm({ ...form, submissionDate: e.target.value })} /></div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Attach PDF or Images (optional)</label>
                <input type="file" multiple accept="application/pdf,image/*" className="input-field" onChange={(e) => setFiles(Array.from(e.target.files))} />
              </div>
              <p className="text-xs text-slate-400">All of your active students in this class will be assigned automatically.</p>
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" className="btn-outline" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? "Creating..." : "Create Assignment"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {statusModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-light rounded-xl2 shadow-card-hover w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto">
            <h3 className="font-display font-bold text-lg text-navy dark:text-white mb-4">{statusModal.title} — Submissions</h3>
            <div className="space-y-3">
              {statusModal.assignedStudents.map((s) => (
                <div key={s.student._id} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-navy dark:text-white">{s.student.name} <span className="text-slate-400">({s.student.studentId})</span></span>
                  <select className="input-field py-1.5 w-40" value={s.status} disabled={savingStatusFor === s.student._id} onChange={(e) => updateStatus(s.student._id, e.target.value)}>
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                    <option value="Late Submission">Late Submission</option>
                  </select>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-6"><button className="btn-outline" onClick={() => setStatusModal(null)}>Close</button></div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AssignmentManagement;
