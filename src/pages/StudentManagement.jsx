import React, { useEffect, useState, useCallback, useMemo } from "react";
import { FaPlus, FaSearch, FaEdit, FaTrash, FaEye, FaTimes } from "react-icons/fa";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import DashboardLayout from "../components/DashboardLayout";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const emptyForm = {
  studentId: "",
  name: "",
  parentName: "",
  phone: "",
  parentWhatsapp: "",
  studentWhatsapp: "",
  preferredLanguage: "English",
  class: "",
  batch: "",
  password: "",
  monthlyFee: "",
  admissionFee: "",
  assignedTeacher: "",
};

const toAttendanceDateKey = (value) => {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const formatAttendanceDate = (value) => new Date(`${toAttendanceDateKey(value)}T00:00:00`).toLocaleDateString(undefined, {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const getAttendancePercentage = (presentDays, totalDays) => totalDays > 0
  ? Number(((presentDays / totalDays) * 100).toFixed(2))
  : null;

const StudentManagement = ({ basePath = "/teacher" }) => {
  const { role } = useAuth();
  const isAdmin = role === "admin";

  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [attendanceSummaries, setAttendanceSummaries] = useState({});
  const [attendanceSummaryLoading, setAttendanceSummaryLoading] = useState(false);
  const [attendanceSummaryError, setAttendanceSummaryError] = useState(false);
  const [selectedAttendanceStudent, setSelectedAttendanceStudent] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState(null);
  const [attendanceHistoryLoading, setAttendanceHistoryLoading] = useState(false);
  const [attendanceHistoryError, setAttendanceHistoryError] = useState(false);
  const [historyStatusFilter, setHistoryStatusFilter] = useState("all");
  const [historyDateFilter, setHistoryDateFilter] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/students", {
        params: { search: search || undefined, class: classFilter || undefined },
      });
      setStudents(res.data.data);
    } catch {
      toast.error("Could not load students");
    } finally {
      setLoading(false);
    }
  }, [search, classFilter]);

  useEffect(() => {
    const debounce = setTimeout(fetchStudents, 300);
    return () => clearTimeout(debounce);
  }, [fetchStudents]);

  useEffect(() => {
    if (isAdmin) {
      api.get("/admin/teachers").then((res) => setTeachers(res.data.data)).catch(() => {});
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return undefined;
    const controller = new AbortController();
    setAttendanceSummaryLoading(true);
    setAttendanceSummaryError(false);
    api.get("/admin/students/attendance-summary", { signal: controller.signal })
      .then((response) => {
        setAttendanceSummaries(Object.fromEntries((response.data.data || []).map((summary) => [summary._id, summary])));
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setAttendanceSummaryError(true);
          toast.error("Could not load attendance percentages");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setAttendanceSummaryLoading(false);
      });
    return () => controller.abort();
  }, [isAdmin]);

  useEffect(() => {
    if (!selectedAttendanceStudent) return undefined;
    const controller = new AbortController();
    setAttendanceHistory(null);
    setAttendanceHistoryLoading(true);
    setAttendanceHistoryError(false);
    setHistoryStatusFilter("all");
    setHistoryDateFilter("all");
    setCustomStartDate("");
    setCustomEndDate("");
    api.get(`/admin/students/${selectedAttendanceStudent._id}/attendance`, { signal: controller.signal })
      .then((response) => setAttendanceHistory(response.data.data))
      .catch(() => {
        if (!controller.signal.aborted) {
          setAttendanceHistoryError(true);
          toast.error("Could not load student attendance history");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setAttendanceHistoryLoading(false);
      });
    return () => controller.abort();
  }, [selectedAttendanceStudent]);

  useEffect(() => {
    if (!selectedAttendanceStudent) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setSelectedAttendanceStudent(null);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [selectedAttendanceStudent]);

  const rangedAttendanceRecords = useMemo(() => {
    const records = attendanceHistory?.records || [];
    const today = new Date();
    let startDate = null;
    let endDate = null;
    if (historyDateFilter === "this-month") {
      startDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
      endDate = toAttendanceDateKey(today);
    } else if (historyDateFilter === "last-month") {
      const firstDayThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayPreviousMonth = new Date(firstDayThisMonth);
      lastDayPreviousMonth.setDate(0);
      const firstDayPreviousMonth = new Date(lastDayPreviousMonth.getFullYear(), lastDayPreviousMonth.getMonth(), 1);
      startDate = toAttendanceDateKey(firstDayPreviousMonth);
      endDate = toAttendanceDateKey(lastDayPreviousMonth);
    } else if (historyDateFilter === "custom") {
      startDate = customStartDate || null;
      endDate = customEndDate || null;
    }
    return records.filter((record) => {
      const recordDate = toAttendanceDateKey(record.date);
      return (!startDate || recordDate >= startDate) && (!endDate || recordDate <= endDate);
    });
  }, [attendanceHistory, customEndDate, customStartDate, historyDateFilter]);

  const filteredAttendanceRecords = useMemo(
    () => rangedAttendanceRecords.filter((record) => historyStatusFilter === "all" || record.status === historyStatusFilter),
    [historyStatusFilter, rangedAttendanceRecords]
  );
  const selectedRangeSummary = useMemo(() => rangedAttendanceRecords.reduce((summary, record) => {
    summary.totalDays += 1;
    if (record.status === "Present") summary.presentDays += 1;
    if (record.status === "Absent") summary.absentDays += 1;
    if (record.status === "Leave") summary.leaveDays += 1;
    return summary;
  }, { totalDays: 0, presentDays: 0, absentDays: 0, leaveDays: 0 }), [rangedAttendanceRecords]);
  const monthlyAttendanceSummary = useMemo(() => {
    const months = new Map();
    (attendanceHistory?.records || []).forEach((record) => {
      const month = toAttendanceDateKey(record.date).slice(0, 7);
      const summary = months.get(month) || { month, totalDays: 0, presentDays: 0, absentDays: 0, leaveDays: 0 };
      summary.totalDays += 1;
      if (record.status === "Present") summary.presentDays += 1;
      if (record.status === "Absent") summary.absentDays += 1;
      if (record.status === "Leave") summary.leaveDays += 1;
      months.set(month, summary);
    });
    return [...months.values()].sort((a, b) => b.month.localeCompare(a.month));
  }, [attendanceHistory]);

  const openAddModal = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowModal(true);
  };

  const openEditModal = (student) => {
    setForm({
      studentId: student.studentId,
      name: student.name,
      parentName: student.parentName,
      phone: student.phone,
      parentWhatsapp: student.parentWhatsapp || "",
      studentWhatsapp: student.studentWhatsapp || "",
      preferredLanguage: student.preferredLanguage || "English",
      class: student.class,
      batch: student.batch || "",
      password: "",
      monthlyFee: student.monthlyFee,
      admissionFee: student.admissionFee,
      assignedTeacher: student.assignedTeacher?._id || student.assignedTeacher || "",
    });
    setEditingId(student._id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        if (!isAdmin) delete payload.assignedTeacher; // teachers can't reassign
        await api.put(`/students/${editingId}`, payload);
        toast.success("Student updated");
      } else {
        const payload = { ...form };
        if (!isAdmin) delete payload.assignedTeacher; // auto-assigned to self server-side
        await api.post("/students", payload);
        toast.success("Student added");
      }
      setShowModal(false);
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this student? This cannot be undone.")) return;
    try {
      await api.delete(`/students/${id}`);
      toast.success("Student deleted");
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  return (
    <DashboardLayout title={isAdmin ? "All Students" : "My Students"}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex flex-1 gap-3">
          <div className="relative flex-1 max-w-sm">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input
              className="input-field pl-9"
              placeholder="Search by name, ID or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <input
            className="input-field max-w-[160px]"
            placeholder="Filter by class"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
          />
        </div>
        <button onClick={openAddModal} className="btn-primary flex items-center gap-2 shrink-0">
          <FaPlus /> Add Student
        </button>
      </div>

      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-navy-lighter">
              <th className="py-3 px-4">Student ID</th>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Class</th>
              <th className="py-3 px-4">Phone</th>
              {isAdmin && <th className="py-3 px-4">Teacher</th>}
              {isAdmin && <th className="py-3 px-4">Attendance %</th>}
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={isAdmin ? 8 : 6} className="text-center py-10 text-slate-400">Loading students...</td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan={isAdmin ? 8 : 6} className="text-center py-10 text-slate-400">No students found.</td></tr>
            ) : (
              students.map((s) => (
                <tr key={s._id} className="border-b border-slate-50 dark:border-navy-lighter/50 hover:bg-slate-50 dark:hover:bg-navy-lighter/40">
                  <td className="py-3 px-4 font-medium text-navy dark:text-white">{s.studentId}</td>
                  <td className="py-3 px-4">{s.name}</td>
                  <td className="py-3 px-4">{s.class}</td>
                  <td className="py-3 px-4">{s.phone}</td>
                  {isAdmin && <td className="py-3 px-4">{s.assignedTeacher?.name || "—"}</td>}
                  {isAdmin && <td className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => setSelectedAttendanceStudent(s)}
                      className="font-semibold text-navy underline decoration-navy/30 underline-offset-2 hover:text-gold-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                      title={`View attendance history for ${s.name}`}
                    >
                      {attendanceSummaryLoading
                        ? "Loading..."
                        : attendanceSummaryError
                          ? "Unavailable"
                          : attendanceSummaries[s._id]?.totalDays > 0
                            ? `${Number(attendanceSummaries[s._id].attendancePercent.toFixed(1))}%`
                            : "N/A"}
                    </button>
                  </td>}
                  <td className="py-3 px-4">
                    <span className={`badge ${s.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-3 text-slate-500">
                      <Link to={`${basePath}/students/${s._id}`} title="View profile">
                        <FaEye className="hover:text-blue-500" />
                      </Link>
                      <button onClick={() => openEditModal(s)} title="Edit">
                        <FaEdit className="hover:text-gold" />
                      </button>
                      <button onClick={() => handleDelete(s._id)} title="Delete">
                        <FaTrash className="hover:text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-light rounded-xl2 shadow-card-hover w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-display font-bold text-lg text-navy dark:text-white mb-4">
              {editingId ? "Edit Student" : "Add New Student"}
            </h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="col-span-1">
                <label className="text-sm font-medium">Student ID</label>
                <input className="input-field mt-1" required disabled={!!editingId} value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} />
              </div>
              <div className="col-span-1">
                <label className="text-sm font-medium">Class</label>
                <input className="input-field mt-1" required value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">Full Name</label>
                <input className="input-field mt-1" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="col-span-1">
                <label className="text-sm font-medium">Parent Name</label>
                <input className="input-field mt-1" required value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })} />
              </div>
              <div className="col-span-1">
                <label className="text-sm font-medium">Phone</label>
                <input className="input-field mt-1" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="col-span-1">
                <label className="text-sm font-medium">Parent WhatsApp <span className="text-slate-400 font-normal">(if different)</span></label>
                <input className="input-field mt-1" placeholder="Defaults to phone above" value={form.parentWhatsapp} onChange={(e) => setForm({ ...form, parentWhatsapp: e.target.value })} />
              </div>
              <div className="col-span-1">
                <label className="text-sm font-medium">Student WhatsApp <span className="text-slate-400 font-normal">(optional)</span></label>
                <input className="input-field mt-1" value={form.studentWhatsapp} onChange={(e) => setForm({ ...form, studentWhatsapp: e.target.value })} />
              </div>
              <div className="col-span-1">
                <label className="text-sm font-medium">Preferred Language</label>
                <select className="input-field mt-1" value={form.preferredLanguage} onChange={(e) => setForm({ ...form, preferredLanguage: e.target.value })}>
                  <option>English</option>
                  <option>Telugu</option>
                </select>
              </div>
              <div className="col-span-1">
                <label className="text-sm font-medium">Batch</label>
                <input className="input-field mt-1" value={form.batch} onChange={(e) => setForm({ ...form, batch: e.target.value })} />
              </div>
              {isAdmin && (
                <div className="col-span-1">
                  <label className="text-sm font-medium">Assigned Teacher</label>
                  <select className="input-field mt-1" required value={form.assignedTeacher} onChange={(e) => setForm({ ...form, assignedTeacher: e.target.value })}>
                    <option value="">Select teacher...</option>
                    {teachers.map((t) => (
                      <option key={t._id} value={t._id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="col-span-1">
                <label className="text-sm font-medium">Monthly Fee</label>
                <input type="number" className="input-field mt-1" required value={form.monthlyFee} onChange={(e) => setForm({ ...form, monthlyFee: e.target.value })} />
              </div>
              <div className="col-span-1">
                <label className="text-sm font-medium">Admission Fee</label>
                <input type="number" className="input-field mt-1" value={form.admissionFee} onChange={(e) => setForm({ ...form, admissionFee: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">
                  {editingId ? "New Password (leave blank to keep current)" : "Password"}
                </label>
                <input type="password" className="input-field mt-1" required={!editingId} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>

              <div className="col-span-2 flex justify-end gap-3 mt-2">
                <button type="button" className="btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : "Save Student"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAdmin && selectedAttendanceStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedAttendanceStudent(null);
          }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby="attendance-history-title" className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-card-hover">
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <h2 id="attendance-history-title" className="truncate font-display text-lg font-bold text-navy">{selectedAttendanceStudent.name}</h2>
                <p className="mt-1 text-sm text-slate-500">Class {selectedAttendanceStudent.class} · {selectedAttendanceStudent.studentId}</p>
              </div>
              <button type="button" aria-label="Close attendance history" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-navy" onClick={() => setSelectedAttendanceStudent(null)}>
                <FaTimes aria-hidden="true" />
              </button>
            </header>

            <div className="min-h-0 overflow-y-auto px-5 py-5 sm:px-6">
              {attendanceHistoryLoading ? (
                <div className="py-16 text-center text-sm text-slate-500">Loading attendance history...</div>
              ) : attendanceHistoryError ? (
                <div className="py-16 text-center text-sm text-slate-500">Attendance history could not be loaded. Close this window and retry from the percentage column.</div>
              ) : attendanceHistory && (
                <div className="space-y-6">
                  <section aria-label="Overall attendance" className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Overall attendance</p>
                        <p className="mt-1 font-display text-3xl font-bold text-navy">
                          {attendanceHistory.summary.totalDays > 0 ? `${Number(attendanceHistory.summary.attendancePercent.toFixed(1))}%` : "N/A"}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-x-5 gap-y-1 text-sm sm:grid-cols-4">
                        <span className="text-slate-500">Total days <strong className="text-navy">{attendanceHistory.summary.totalDays}</strong></span>
                        <span className="text-slate-500">Present <strong className="text-emerald-700">{attendanceHistory.summary.presentDays}</strong></span>
                        <span className="text-slate-500">Absent <strong className="text-red-700">{attendanceHistory.summary.absentDays}</strong></span>
                        <span className="text-slate-500">Leave <strong className="text-amber-700">{attendanceHistory.summary.leaveDays}</strong></span>
                      </div>
                    </div>
                  </section>

                  <section aria-label="Selected date range attendance">
                    <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <h3 className="font-display font-semibold text-navy">Selected date range attendance</h3>
                        <p className="mt-1 text-xs text-slate-500">Status filter changes the table only; these totals reflect all statuses in the selected date range.</p>
                      </div>
                      <div className="flex flex-wrap items-end gap-2">
                        <label className="text-xs font-medium text-slate-600">
                          Date range
                          <select className="input-field mt-1 min-w-36 py-2 text-sm" value={historyDateFilter} onChange={(event) => setHistoryDateFilter(event.target.value)}>
                            <option value="all">All Dates</option>
                            <option value="this-month">This Month</option>
                            <option value="last-month">Last Month</option>
                            <option value="custom">Custom Date Range</option>
                          </select>
                        </label>
                        {historyDateFilter === "custom" && <>
                          <label className="text-xs font-medium text-slate-600">From<input aria-label="Attendance start date" type="date" className="input-field mt-1 py-2 text-sm" value={customStartDate} max={customEndDate || undefined} onChange={(event) => setCustomStartDate(event.target.value)} /></label>
                          <label className="text-xs font-medium text-slate-600">To<input aria-label="Attendance end date" type="date" className="input-field mt-1 py-2 text-sm" min={customStartDate || undefined} max={toAttendanceDateKey(new Date())} value={customEndDate} onChange={(event) => setCustomEndDate(event.target.value)} /></label>
                        </>}
                      </div>
                    </div>
                    <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {[
                        ["Total Days", selectedRangeSummary.totalDays],
                        ["Present", selectedRangeSummary.presentDays],
                        ["Absent", selectedRangeSummary.absentDays],
                        ["Attendance", selectedRangeSummary.totalDays > 0 ? `${getAttendancePercentage(selectedRangeSummary.presentDays, selectedRangeSummary.totalDays)}%` : "N/A"],
                      ].map(([label, value]) => <div key={label} className="rounded-lg border border-slate-100 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 font-display font-bold text-navy">{value}</p></div>)}
                    </div>

                    <div className="mb-3 inline-flex rounded-lg bg-slate-100 p-1" role="group" aria-label="Filter attendance by status">
                      {[{ value: "all", label: "All" }, { value: "Present", label: "Present" }, { value: "Absent", label: "Absent" }].map((option) => (
                        <button key={option.value} type="button" aria-pressed={historyStatusFilter === option.value} onClick={() => setHistoryStatusFilter(option.value)} className={`rounded-md px-3 py-2 text-xs font-semibold ${historyStatusFilter === option.value ? "bg-white text-navy shadow-sm" : "text-slate-500 hover:text-navy"}`}>
                          {option.label}
                        </button>
                      ))}
                    </div>

                    {attendanceHistory.records.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">No attendance has been recorded for this student yet.</p>
                    ) : filteredAttendanceRecords.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">No attendance records match these filters.</p>
                    ) : (
                      <div className="max-h-64 overflow-auto rounded-lg border border-slate-200">
                        <table className="w-full text-left text-sm">
                          <thead className="sticky top-0 bg-slate-50 text-slate-600">
                            <tr><th className="px-4 py-3 font-semibold">Date</th><th className="px-4 py-3 font-semibold">Status</th></tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredAttendanceRecords.map((record, index) => (
                              <tr key={`${record.date}-${index}`}>
                                <td className="px-4 py-3 text-slate-700">{formatAttendanceDate(record.date)}</td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${record.status === "Present" ? "bg-emerald-100 text-emerald-700" : record.status === "Absent" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                                    {record.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>

                  <section aria-label="Monthly attendance summary">
                    <h3 className="mb-3 font-display font-semibold text-navy">Monthly summary</h3>
                    {monthlyAttendanceSummary.length === 0 ? (
                      <p className="text-sm text-slate-500">No monthly attendance data yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {monthlyAttendanceSummary.map((month) => (
                          <div key={month.month} className="rounded-lg border border-slate-200 p-3">
                            <p className="font-semibold text-navy">{new Date(`${month.month}-01T00:00:00`).toLocaleDateString(undefined, { month: "long", year: "numeric" })}</p>
                            <p className="mt-2 text-xs text-slate-500">Present <strong className="text-emerald-700">{month.presentDays}</strong> · Absent <strong className="text-red-700">{month.absentDays}</strong>{month.leaveDays > 0 && <> · Leave <strong className="text-amber-700">{month.leaveDays}</strong></>}</p>
                            <p className="mt-1 text-sm font-semibold text-navy">Attendance {getAttendancePercentage(month.presentDays, month.totalDays)}%</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentManagement;
