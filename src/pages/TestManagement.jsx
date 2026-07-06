import React, { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import DashboardLayout from "../components/DashboardLayout";
import api from "../api/axios";

const emptyForm = { testName: "", subject: "", class: "", maxMarks: "", date: "" };

const TestManagement = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classFilter, setClassFilter] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [marksModal, setMarksModal] = useState(null); // the test being graded
  const [marksDraft, setMarksDraft] = useState({}); // { studentId: value }
  const [savingMarks, setSavingMarks] = useState(false);

  const fetchTests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/tests", { params: { class: classFilter || undefined } });
      setTests(res.data.data);
    } catch {
      toast.error("Could not load tests");
    } finally {
      setLoading(false);
    }
  }, [classFilter]);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/tests", form);
      toast.success("Test created and students notified");
      setShowCreateModal(false);
      setForm(emptyForm);
      fetchTests();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create test");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this test and all its marks?")) return;
    try {
      await api.delete(`/tests/${id}`);
      toast.success("Test deleted");
      fetchTests();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  const openMarksModal = async (test) => {
    try {
      const res = await api.get(`/tests/${test._id}`);
      const full = res.data.data;
      setMarksModal(full);
      const draft = {};
      full.marks.forEach((m) => {
        draft[m.student._id] = m.marksObtained ?? "";
      });
      setMarksDraft(draft);
    } catch {
      toast.error("Could not load test details");
    }
  };

  const handleSaveMarks = async (e) => {
    e.preventDefault();
    setSavingMarks(true);
    try {
      const marks = Object.entries(marksDraft).map(([studentId, marksObtained]) => ({
        studentId,
        marksObtained: marksObtained === "" ? null : Number(marksObtained),
      }));
      await api.put(`/tests/${marksModal._id}/marks`, { marks });
      toast.success("Marks saved and students notified");
      setMarksModal(null);
      fetchTests();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save marks");
    } finally {
      setSavingMarks(false);
    }
  };

  return (
    <DashboardLayout title="Test Management">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <input
          className="input-field max-w-[200px]"
          placeholder="Filter by class"
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
        />
        <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
          <FaPlus /> Create Test
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {loading ? (
          <p className="text-slate-400">Loading tests...</p>
        ) : tests.length === 0 ? (
          <p className="text-slate-400">No tests yet. Create one to get started.</p>
        ) : (
          tests.map((t) => (
            <div key={t._id} className="card">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-display font-semibold text-navy dark:text-white">{t.testName}</h3>
                  <p className="text-sm text-slate-400">{t.subject} &middot; {t.class}</p>
                </div>
                <button onClick={() => handleDelete(t._id)} title="Delete test">
                  <FaTrash className="text-slate-400 hover:text-red-500" />
                </button>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                {new Date(t.date).toDateString()} &middot; Max Marks: {t.maxMarks}
              </p>
              <div className="grid grid-cols-3 gap-2 text-center text-xs mb-4">
                <div className="bg-slate-50 dark:bg-navy-lighter rounded-lg py-2">
                  <p className="text-slate-400">Avg</p>
                  <p className="font-bold text-navy dark:text-white">{t.stats.average}</p>
                </div>
                <div className="bg-slate-50 dark:bg-navy-lighter rounded-lg py-2">
                  <p className="text-slate-400">High</p>
                  <p className="font-bold text-navy dark:text-white">{t.stats.highest}</p>
                </div>
                <div className="bg-slate-50 dark:bg-navy-lighter rounded-lg py-2">
                  <p className="text-slate-400">Low</p>
                  <p className="font-bold text-navy dark:text-white">{t.stats.lowest}</p>
                </div>
              </div>
              <button onClick={() => openMarksModal(t)} className="btn-secondary w-full flex items-center justify-center gap-2 text-sm">
                <FaEdit /> Enter / Update Marks
              </button>
            </div>
          ))
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-light rounded-xl2 shadow-card-hover w-full max-w-md p-6">
            <h3 className="font-display font-bold text-lg text-navy dark:text-white mb-4">Create Test</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">Test Name</label>
                <input className="input-field" required value={form.testName} onChange={(e) => setForm({ ...form, testName: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-1">Subject</label>
                  <input className="input-field" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Class</label>
                  <input className="input-field" required value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-1">Max Marks</label>
                  <input type="number" className="input-field" required value={form.maxMarks} onChange={(e) => setForm({ ...form, maxMarks: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Date</label>
                  <input type="date" className="input-field" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
              </div>
              <p className="text-xs text-slate-400">
                All active students in this class will be assigned automatically.
              </p>
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" className="btn-outline" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? "Creating..." : "Create Test"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {marksModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-light rounded-xl2 shadow-card-hover w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto">
            <h3 className="font-display font-bold text-lg text-navy dark:text-white mb-1">
              {marksModal.testName}
            </h3>
            <p className="text-sm text-slate-400 mb-4">Max Marks: {marksModal.maxMarks}</p>
            <form onSubmit={handleSaveMarks}>
              <div className="space-y-3 mb-5">
                {marksModal.marks.map((m) => (
                  <div key={m.student._id} className="flex items-center justify-between gap-3">
                    <span className="text-sm text-navy dark:text-white">
                      {m.student.name} <span className="text-slate-400">({m.student.studentId})</span>
                    </span>
                    <input
                      type="number"
                      min="0"
                      max={marksModal.maxMarks}
                      className="input-field w-24 py-1.5"
                      value={marksDraft[m.student._id] ?? ""}
                      onChange={(e) =>
                        setMarksDraft({ ...marksDraft, [m.student._id]: e.target.value })
                      }
                      placeholder="—"
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" className="btn-outline" onClick={() => setMarksModal(null)}>Cancel</button>
                <button type="submit" disabled={savingMarks} className="btn-primary">
                  {savingMarks ? "Saving..." : "Save Marks"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default TestManagement;
