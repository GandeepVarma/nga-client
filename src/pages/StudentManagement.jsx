import React, { useEffect, useState, useCallback, useMemo } from "react";
import { FaPlus, FaEdit, FaTrash, FaEye, FaTimes, FaFileExcel, FaChartBar } from "react-icons/fa";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import DashboardLayout from "../components/DashboardLayout";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { ActionMenu, ConfirmDialog, EmptyState, Pagination, TableToolbar } from "../components/AdminUi";

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

const getReportPeriodLabel = (period, year, month, quarter) => {
  if (period === "month") {
    return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
  }
  if (period === "quarter") return `Q${quarter} ${year}`;
  return year;
};

const StudentManagement = ({ basePath = "/teacher" }) => {
  const { role } = useAuth();
  const isAdmin = role === "admin";

  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [batchFilter, setBatchFilter] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
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
  const now = new Date();
  const [showLowAttendanceReport, setShowLowAttendanceReport] = useState(false);
  const [reportPeriod, setReportPeriod] = useState("month");
  const [reportYear, setReportYear] = useState(String(now.getFullYear()));
  const [reportMonth, setReportMonth] = useState(String(now.getMonth() + 1));
  const [reportQuarter, setReportQuarter] = useState(String(Math.floor(now.getMonth() / 3) + 1));
  const [lowAttendanceStudents, setLowAttendanceStudents] = useState(null);
  const [lowAttendanceLoading, setLowAttendanceLoading] = useState(false);

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
    setPage(1);
  }, [search, classFilter, batchFilter]);

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
    try {
      await api.delete(`/students/${id}`);
      toast.success("Student deleted");
      setDeleteTarget(null);
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  const generateLowAttendanceReport = async () => {
    setLowAttendanceLoading(true);
    setLowAttendanceStudents(null);
    try {
      const params = { period: reportPeriod, year: reportYear };
      if (reportPeriod === "month") params.month = reportMonth;
      if (reportPeriod === "quarter") params.quarter = reportQuarter;
      const response = await api.get("/attendance/low-attendance", { params });
      setLowAttendanceStudents(response.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not generate the low attendance report");
    } finally {
      setLowAttendanceLoading(false);
    }
  };

  const downloadLowAttendanceReport = async () => {
    if (!lowAttendanceStudents) return;
    try {
      const XLSX = await import("xlsx");
      const rows = lowAttendanceStudents.map((student) => ({
        "Student ID": student.studentId,
        "Student Name": student.name,
        Class: student.class,
        "Present Days": student.presentDays,
        "Total Marked Days": student.totalDays,
        "Attendance (%)": Number(student.attendancePercent.toFixed(2)),
      }));
      const sheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, sheet, "Low Attendance");
      const filePeriod = getReportPeriodLabel(reportPeriod, reportYear, reportMonth, reportQuarter).replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
      XLSX.writeFile(workbook, `low-attendance-${filePeriod}.xlsx`);
    } catch (error) {
      toast.error(error.message || "Could not export the low attendance report");
    }
  };

  const classOptions = useMemo(() => [...new Set(students.map((student) => student.class).filter(Boolean))].sort(), [students]);
  const batchOptions = useMemo(() => [...new Set(students.map((student) => student.batch).filter(Boolean))].sort(), [students]);
  const visibleStudents = useMemo(() => {
    const filtered = students.filter((student) =>
      (!classFilter || student.class === classFilter)
      && (!batchFilter || (student.batch || "") === batchFilter)
    );
    return [...filtered].sort((a, b) => {
      const av = sortField === "name" ? a.name || "" : sortField === "studentId" ? a.studentId || "" : sortField === "class" ? a.class || "" : a.createdAt || "";
      const bv = sortField === "name" ? b.name || "" : sortField === "studentId" ? b.studentId || "" : sortField === "class" ? b.class || "" : b.createdAt || "";
      const comparison = typeof av === "string" && typeof bv === "string"
        ? av.localeCompare(bv)
        : new Date(av) - new Date(bv);
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [batchFilter, classFilter, sortDirection, sortField, students]);
  const totalPages = Math.max(1, Math.ceil(visibleStudents.length / pageSize));
  const pagedStudents = visibleStudents.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const toggleSelected = (id) => {
    setSelectedIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  };
  const toggleAllVisible = () => {
    const visibleIds = pagedStudents.map((student) => student._id);
    const allSelected = visibleIds.every((id) => selectedIds.includes(id));
    setSelectedIds((current) => allSelected
      ? current.filter((id) => !visibleIds.includes(id))
      : [...new Set([...current, ...visibleIds])]);
  };
  const exportStudents = async (format = "xlsx") => {
    const exportRows = (selectedIds.length
      ? visibleStudents.filter((student) => selectedIds.includes(student._id))
      : visibleStudents
    ).map((student) => ({
      "Student ID": student.studentId,
      Name: student.name,
      "Parent Name": student.parentName,
      Phone: student.phone,
      "Parent WhatsApp": student.parentWhatsapp || "",
      "Student WhatsApp": student.studentWhatsapp || "",
      Class: student.class,
      Batch: student.batch || "",
      "Monthly Fee": student.monthlyFee,
      "Admission Fee": student.admissionFee,
      Teacher: student.assignedTeacher?.name || "",
      Status: student.status,
    }));
    if (!exportRows.length) {
      toast.error("No students to export");
      return;
    }
    try {
      const XLSX = await import("xlsx");
      const sheet = XLSX.utils.json_to_sheet(exportRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, sheet, "Students");
      if (format === "csv") {
        XLSX.writeFile(workbook, "students.csv", { bookType: "csv" });
      } else {
        XLSX.writeFile(workbook, "students.xlsx");
      }
    } catch (error) {
      toast.error(error.message || "Could not export students");
    }
  };

  return (
    <DashboardLayout title={isAdmin ? "All Students" : "My Students"}>
      <TableToolbar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search by name, ID or phone..."
        filters={
          <>
            <select className="input-field w-auto min-w-32 py-2.5" value={classFilter} onChange={(event) => setClassFilter(event.target.value)} aria-label="Filter by class">
              <option value="">All classes</option>
              {classOptions.map((className) => <option key={className}>{className}</option>)}
            </select>
            <select className="input-field w-auto min-w-32 py-2.5" value={batchFilter} onChange={(event) => setBatchFilter(event.target.value)} aria-label="Filter by batch">
              <option value="">All batches</option>
              {batchOptions.map((batch) => <option key={batch}>{batch}</option>)}
            </select>
            <select className="input-field w-auto min-w-36 py-2.5" value={`${sortField}:${sortDirection}`} onChange={(event) => { const [field, direction] = event.target.value.split(":"); setSortField(field); setSortDirection(direction); }} aria-label="Sort students">
              <option value="createdAt:desc">Newest first</option>
              <option value="createdAt:asc">Oldest first</option>
              <option value="name:asc">Name A-Z</option>
              <option value="name:desc">Name Z-A</option>
              <option value="studentId:asc">Student ID ascending</option>
              <option value="studentId:desc">Student ID descending</option>
              <option value="class:asc">Class ascending</option>
            </select>
          </>
        }
        action={
          <>
            {selectedIds.length > 0 && <span className="text-xs font-semibold text-navy">{selectedIds.length} selected</span>}
            <button type="button" onClick={() => exportStudents("xlsx")} className="btn-outline flex items-center gap-2"><FaFileExcel /> Excel</button>
            <button type="button" onClick={() => exportStudents("csv")} className="btn-outline">CSV</button>
            <button type="button" onClick={() => { setLowAttendanceStudents(null); setShowLowAttendanceReport(true); }} className="btn-outline flex items-center gap-2"><FaChartBar /> Report</button>
            <button onClick={openAddModal} className="btn-primary flex items-center gap-2"><FaPlus /> Add Student</button>
          </>
        }
      />

      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-navy-lighter">
              <th className="w-12 py-3 px-4"><input type="checkbox" aria-label="Select all visible students" checked={pagedStudents.length > 0 && pagedStudents.every((student) => selectedIds.includes(student._id))} onChange={toggleAllVisible} /></th>
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
              <tr><td colSpan={isAdmin ? 9 : 7} className="text-center py-10 text-slate-400"><div className="mx-auto max-w-sm"><div className="h-3 animate-pulse rounded bg-slate-100" /><div className="mt-2 h-3 animate-pulse rounded bg-slate-100" /></div></td></tr>
            ) : pagedStudents.length === 0 ? (
              <tr><td colSpan={isAdmin ? 9 : 7} className="p-6"><EmptyState title="No students found" description="Try changing your search or filters." /></td></tr>
            ) : (
              pagedStudents.map((s) => (
                <tr key={s._id} className="border-b border-slate-50 dark:border-navy-lighter/50 hover:bg-slate-50 dark:hover:bg-navy-lighter/40">
                  <td className="py-3 px-4"><input type="checkbox" aria-label={`Select ${s.name}`} checked={selectedIds.includes(s._id)} onChange={() => toggleSelected(s._id)} /></td>
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
                    <div className="flex justify-end">
                      <ActionMenu
                        label={`Actions for ${s.name}`}
                        items={[
                          { label: "View profile", icon: <FaEye />, onClick: () => window.location.assign(`${basePath}/students/${s._id}`) },
                          { label: "Edit student", icon: <FaEdit />, onClick: () => openEditModal(s) },
                          { label: "Delete student", icon: <FaTrash />, danger: true, onClick: () => setDeleteTarget(s) },
                        ]}
                      />
                    </div>
                    <ConfirmDialog
                      open={Boolean(deleteTarget)}
                      title="Delete student?"
                      description={deleteTarget ? `${deleteTarget.name} (${deleteTarget.studentId}) will be permanently deleted. This action cannot be undone.` : ""}
                      confirmLabel="Delete Student"
                      danger
                      onCancel={() => setDeleteTarget(null)}
                      onConfirm={() => deleteTarget && handleDelete(deleteTarget._id)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        from={visibleStudents.length ? (page - 1) * pageSize + 1 : 0}
        to={Math.min(page * pageSize, visibleStudents.length)}
        total={visibleStudents.length}
      />

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
                <input type="password" className="input-field mt-1" required={!editingId} minLength={8} pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}" title="Use at least 8 characters with uppercase, lowercase, and a number" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                <p className="text-xs text-slate-500 mt-1">At least 8 characters, including uppercase, lowercase, and a number.</p>
              </div>

              <div className="col-span-2 flex justify-end gap-3 mt-2">
                <button type="button" className="btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : "Save Student"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLowAttendanceReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowLowAttendanceReport(false);
          }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby="low-attendance-title" className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-card-hover">
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <h2 id="low-attendance-title" className="font-display text-lg font-bold text-navy">Students below 75% attendance</h2>
                <p className="mt-1 text-sm text-slate-500">Attendance is calculated from all marked days in the selected period.</p>
              </div>
              <button type="button" aria-label="Close low attendance report" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-navy" onClick={() => setShowLowAttendanceReport(false)}>
                <FaTimes aria-hidden="true" />
              </button>
            </header>

            <div className="min-h-0 overflow-y-auto px-5 py-5 sm:px-6">
              <div className="flex flex-wrap items-end gap-3">
                <label className="text-sm font-medium text-slate-600">
                  Report period
                  <select className="input-field mt-1 min-w-36" value={reportPeriod} onChange={(event) => { setReportPeriod(event.target.value); setLowAttendanceStudents(null); }}>
                    <option value="month">Monthly</option>
                    <option value="quarter">Quarterly</option>
                    <option value="year">Yearly</option>
                  </select>
                </label>
                {reportPeriod === "month" && (
                  <label className="text-sm font-medium text-slate-600">
                    Month
                    <select className="input-field mt-1 min-w-36" value={reportMonth} onChange={(event) => { setReportMonth(event.target.value); setLowAttendanceStudents(null); }}>
                      {Array.from({ length: 12 }, (_, index) => (
                        <option key={index + 1} value={index + 1}>{new Date(2000, index, 1).toLocaleDateString(undefined, { month: "long" })}</option>
                      ))}
                    </select>
                  </label>
                )}
                {reportPeriod === "quarter" && (
                  <label className="text-sm font-medium text-slate-600">
                    Quarter
                    <select className="input-field mt-1 min-w-36" value={reportQuarter} onChange={(event) => { setReportQuarter(event.target.value); setLowAttendanceStudents(null); }}>
                      {[1, 2, 3, 4].map((quarter) => <option key={quarter} value={quarter}>Q{quarter}</option>)}
                    </select>
                  </label>
                )}
                <label className="text-sm font-medium text-slate-600">
                  Year
                  <input type="number" min="1900" max="9999" className="input-field mt-1 w-28" value={reportYear} onChange={(event) => { setReportYear(event.target.value); setLowAttendanceStudents(null); }} />
                </label>
                <button type="button" className="btn-primary" disabled={lowAttendanceLoading || !reportYear} onClick={generateLowAttendanceReport}>
                  {lowAttendanceLoading ? "Generating..." : "Generate List"}
                </button>
                {lowAttendanceStudents && lowAttendanceStudents.length > 0 && (
                  <button type="button" className="btn-outline flex items-center gap-2" onClick={downloadLowAttendanceReport}>
                    <FaFileExcel aria-hidden="true" /> Download Excel
                  </button>
                )}
              </div>

              {lowAttendanceStudents && (
                <div className="mt-5">
                  <p className="mb-3 text-sm text-slate-600">
                    {getReportPeriodLabel(reportPeriod, reportYear, reportMonth, reportQuarter)} · {lowAttendanceStudents.length} student{lowAttendanceStudents.length === 1 ? "" : "s"} below 75%
                  </p>
                  {lowAttendanceStudents.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">No students are below 75% attendance for this period.</p>
                  ) : (
                    <div className="max-h-[50vh] overflow-auto rounded-lg border border-slate-200">
                      <table className="w-full text-left text-sm">
                        <thead className="sticky top-0 bg-slate-50 text-slate-600">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Student ID</th>
                            <th className="px-4 py-3 font-semibold">Name</th>
                            <th className="px-4 py-3 font-semibold">Class</th>
                            <th className="px-4 py-3 font-semibold">Present / Marked</th>
                            <th className="px-4 py-3 text-right font-semibold">Attendance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {lowAttendanceStudents.map((student) => (
                            <tr key={student._id}>
                              <td className="px-4 py-3">{student.studentId}</td>
                              <td className="px-4 py-3 font-medium text-navy">{student.name}</td>
                              <td className="px-4 py-3">{student.class}</td>
                              <td className="px-4 py-3">{student.presentDays} / {student.totalDays}</td>
                              <td className="px-4 py-3 text-right font-semibold text-red-700">{Number(student.attendancePercent.toFixed(1))}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
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
