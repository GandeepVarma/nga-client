import React, { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { FaPlus, FaTrash, FaUsers, FaFileDownload } from "react-icons/fa";
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
  const [assignmentTarget, setAssignmentTarget] = useState("class");
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
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

  const handleFilesChange = (event) => {
    const selected = Array.from(event.target.files);
    if (selected.length > 5) toast.error("Choose no more than 5 attachments");
    setFiles(selected.slice(0, 5));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (assignmentTarget === "students" && selectedStudentIds.length === 0) {
      toast.error("Select at least one student, or assign to the whole class");
      return;
    }
    setSaving(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      files.forEach((f) => data.append("files", f));
      if (assignmentTarget === "students") data.append("studentIds", JSON.stringify(selectedStudentIds));
      await api.post("/assignments", data, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Assignment created and students notified");
      setShowCreateModal(false);
      setForm(emptyForm);
      setFiles([]);
      setAssignmentTarget("class");
      setAvailableStudents([]);
      setSelectedStudentIds([]);
      fetchAssignments();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create assignment");
    } finally {
      setSaving(false);
    }
  };

  const loadStudents = async () => {
    if (!form.class.trim()) {
      toast.error("Enter a class before loading its students");
      return;
    }
    setLoadingStudents(true);
    try {
      const response = await api.get("/students", { params: { class: form.class.trim() } });
      const activeStudents = response.data.data.filter((student) => student.status === "Active");
      setAvailableStudents(activeStudents);
      setSelectedStudentIds([]);
      if (!activeStudents.length) toast.error("No active students found for this class");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load students for this class");
    } finally {
      setLoadingStudents(false);
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
      const todayStart = Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate());
      const dueDate = new Date(statusModal.submissionDate);
      const displayStatus = status === "Pending" && dueDate.getTime() < todayStart ? "Late Submission" : status;
      setStatusModal((prev) => ({
        ...prev,
        assignedStudents: prev.assignedStudents.map((s) => (s.student._id === studentId ? {
          ...s,
          status: displayStatus,
          submittedAt: status === "Pending" ? null : new Date().toISOString(),
        } : s)),
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
            const lateCount = a.assignedStudents.filter((s) => s.status === "Late Submission").length;
            const completedCount = a.assignedStudents.filter((s) => s.status === "Completed").length;
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
                <p className="text-xs text-slate-400 mb-2">Due: {new Date(a.submissionDate).toISOString().slice(0, 10)} &middot; {a.assignedStudents.length} students</p>
                <p className="text-xs text-slate-500 mb-3">{completedCount} completed · {pendingCount} pending · {lateCount} late</p>
                {a.files?.length > 0 && <div className="mb-3 space-y-1">{a.files.map((file, index) => <a key={`${file.publicId || file.url}-${index}`} href={file.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-blue-600 hover:underline"><FaFileDownload />{file.originalName}</a>)}</div>}
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
                <div><label className="text-sm font-medium block mb-1">Class</label><input className="input-field" required value={form.class} onChange={(e) => { setForm({ ...form, class: e.target.value }); setAvailableStudents([]); setSelectedStudentIds([]); }} /></div>
                <div><label className="text-sm font-medium block mb-1">Due Date</label><input type="date" className="input-field" required value={form.submissionDate} onChange={(e) => setForm({ ...form, submissionDate: e.target.value })} /></div>
              </div>
              <div className="rounded-lg border border-slate-200 dark:border-navy-lighter p-3 space-y-3">
                <p className="text-sm font-medium">Assign to</p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <label className="flex items-center gap-2"><input type="radio" name="assignmentTarget" checked={assignmentTarget === "class"} onChange={() => setAssignmentTarget("class")} />All active students in class</label>
                  <label className="flex items-center gap-2"><input type="radio" name="assignmentTarget" checked={assignmentTarget === "students"} onChange={() => setAssignmentTarget("students")} />Selected students</label>
                </div>
                {assignmentTarget === "students" && <>
                  <button type="button" className="btn-outline text-sm" disabled={loadingStudents || !form.class.trim()} onClick={loadStudents}>{loadingStudents ? "Loading students..." : "Load students in class"}</button>
                  {availableStudents.length > 0 && <div className="max-h-40 overflow-y-auto space-y-2 border-t border-slate-100 dark:border-navy-lighter pt-3">
                    <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={selectedStudentIds.length === availableStudents.length} onChange={(e) => setSelectedStudentIds(e.target.checked ? availableStudents.map((student) => student._id) : [])} />Select all {availableStudents.length}</label>
                    {availableStudents.map((student) => <label key={student._id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selectedStudentIds.includes(student._id)} onChange={(e) => setSelectedStudentIds((current) => e.target.checked ? [...current, student._id] : current.filter((id) => id !== student._id))} />{student.name} <span className="text-slate-400">({student.studentId})</span></label>)}
                  </div>}
                </>}
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Attach PDF or Images (optional)</label>
                <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" className="input-field" onChange={handleFilesChange} />
                <p className="mt-1 text-xs text-slate-400">Up to 5 PDF or JPG/PNG/WEBP attachments, 10 MB per file.</p>
              </div>
              <p className="text-xs text-slate-400">{assignmentTarget === "class" ? "All active students in this class will be assigned automatically." : `${selectedStudentIds.length} students selected.`}</p>
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" className="btn-outline" onClick={() => { setShowCreateModal(false); setForm(emptyForm); setFiles([]); setAssignmentTarget("class"); setAvailableStudents([]); setSelectedStudentIds([]); }}>Cancel</button>
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
                  <span className="text-sm text-navy dark:text-white">{s.student.name} <span className="text-slate-400">({s.student.studentId})</span>{s.submittedAt && <span className="block text-xs text-slate-400">Updated {new Date(s.submittedAt).toLocaleString()}</span>}</span>
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
