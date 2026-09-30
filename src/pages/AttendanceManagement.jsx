import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FaSave } from "react-icons/fa";
import DashboardLayout from "../components/DashboardLayout";
import api from "../api/axios";

const todayStr = () => {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
};
const statusOptions = ["Present", "Absent", "Leave"];
const classOrder = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

const AttendanceManagement = () => {
  const [date, setDate] = useState(todayStr());
  const [classFilter, setClassFilter] = useState("all");
  const [students, setStudents] = useState([]);
  const [attendanceByStudent, setAttendanceByStudent] = useState({});
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [studentsError, setStudentsError] = useState(false);
  const [attendanceError, setAttendanceError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [collapsedGroups, setCollapsedGroups] = useState(() => new Set());

  useEffect(() => {
    const controller = new AbortController();
    setStudentsLoading(true);
    setStudentsError(false);
    api.get("/students", { signal: controller.signal })
      .then((response) => setStudents((response.data.data || []).filter((student) => student.status === "Active")))
      .catch(() => {
        if (!controller.signal.aborted) {
          setStudentsError(true);
          toast.error("Could not load students");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setStudentsLoading(false);
      });
    return () => controller.abort();
  }, [loadAttempt]);

  useEffect(() => {
    const controller = new AbortController();
    setAttendanceLoading(true);
    setAttendanceError(false);
    api.get("/attendance", { params: { date }, signal: controller.signal })
      .then((response) => {
        const savedStatuses = {};
        (response.data.data || []).forEach((record) => {
          const studentId = record.student?._id || record.student;
          if (studentId) savedStatuses[studentId] = record.status;
        });
        setAttendanceByStudent(savedStatuses);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setAttendanceError(true);
          toast.error("Could not load attendance for this date");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setAttendanceLoading(false);
      });
    return () => controller.abort();
  }, [date, loadAttempt]);

  const classes = useMemo(() => [...new Set(students.map((student) => student.class).filter(Boolean))].sort(classOrder.compare), [students]);
  const visibleStudents = useMemo(
    () => students.filter((student) => classFilter === "all" || student.class === classFilter),
    [classFilter, students]
  );
  const groups = useMemo(() => {
    const grouped = new Map();
    visibleStudents.forEach((student) => {
      const className = student.class || "Unassigned class";
      const batchName = student.batch?.trim() || "";
      const key = `${className}::${batchName}`;
      if (!grouped.has(key)) grouped.set(key, { key, className, batchName, students: [] });
      grouped.get(key).students.push(student);
    });
    return [...grouped.values()].sort((a, b) => classOrder.compare(a.className, b.className) || classOrder.compare(a.batchName, b.batchName));
  }, [visibleStudents]);
  const summary = useMemo(() => visibleStudents.reduce((counts, student) => {
    const status = attendanceByStudent[student._id] || "Present";
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, { total: visibleStudents.length, Present: 0, Absent: 0, Leave: 0 }), [attendanceByStudent, visibleStudents]);
  const attendancePercentage = summary.total > 0 ? Number(((summary.Present / summary.total) * 100).toFixed(2)) : null;

  const handleSave = async () => {
    if (visibleStudents.length === 0 || studentsError || attendanceError) return;
    setSaving(true);
    try {
      const records = visibleStudents.map((student) => ({
        studentId: student._id,
        class: student.class || "Unassigned class",
        status: attendanceByStudent[student._id] || "Present",
      }));
      await api.post("/attendance", { date, records });
      setAttendanceByStudent((current) => ({
        ...current,
        ...Object.fromEntries(records.map((record) => [record.studentId, record.status])),
      }));
      toast.success("Attendance saved successfully.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const setStudentStatus = (studentId, status) => {
    setAttendanceByStudent((current) => ({ ...current, [studentId]: status }));
  };

  const markGroupPresent = (groupStudents) => {
    setAttendanceByStudent((current) => ({
      ...current,
      ...Object.fromEntries(groupStudents.map((student) => [student._id, "Present"])),
    }));
  };

  const toggleGroup = (groupKey) => {
    setCollapsedGroups((current) => {
      const next = new Set(current);
      if (next.has(groupKey)) next.delete(groupKey);
      else next.add(groupKey);
      return next;
    });
  };

  return (
    <DashboardLayout title="Attendance Management">
      <div className="card mb-5">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="attendance-date">Date</label>
            <input id="attendance-date" type="date" className="input-field" value={date} max={todayStr()} onChange={(event) => setDate(event.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="attendance-class">Class</label>
            <select id="attendance-class" className="input-field" value={classFilter} onChange={(event) => setClassFilter(event.target.value)}>
              <option value="all">All Classes</option>
              {classes.map((className) => <option key={className} value={className}>{className}</option>)}
            </select>
          </div>
        </div>
      </div>

      <section aria-label="Attendance summary" className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Total Students", summary.total],
          ["Present", summary.Present],
          ["Absent", summary.Absent],
          ["Attendance", attendancePercentage == null ? "—" : `${attendancePercentage}%`],
        ].map(([label, value]) => (
          <div key={label} className="card p-4">
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <p className="mt-1 font-display text-xl font-bold text-navy">{value}</p>
          </div>
        ))}
      </section>

      {(studentsLoading || attendanceLoading) ? (
        <div className="card py-12 text-center text-sm text-slate-500">Loading students and attendance...</div>
      ) : (studentsError || attendanceError) ? (
        <div className="card flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-sm text-slate-600">Attendance data could not be loaded.</p>
          <button type="button" className="btn-secondary" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>Retry</button>
        </div>
      ) : groups.length === 0 ? (
        <div className="card py-12 text-center text-sm text-slate-500">
          {students.length === 0 ? "No active students are available." : "No students match this class."}
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => {
            const collapsed = collapsedGroups.has(group.key);
            const title = group.batchName ? `${group.className} · ${group.batchName}` : group.className;
            return (
              <section key={group.key} className="card min-w-0 overflow-hidden p-0">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
                  <button type="button" className="min-w-0 flex-1 text-left" aria-expanded={!collapsed} onClick={() => toggleGroup(group.key)}>
                    <span className="block truncate font-display font-semibold text-navy">{collapsed ? "▶" : "▼"} {title} — {group.students.length} {group.students.length === 1 ? "Student" : "Students"}</span>
                  </button>
                  <button type="button" className="btn-secondary px-3 py-2 text-xs" onClick={() => markGroupPresent(group.students)}>Mark All Present</button>
                </div>
                {!collapsed && <div className="divide-y divide-slate-100">
                  {group.students.map((student) => {
                    const selectedStatus = attendanceByStudent[student._id] || "Present";
                    return (
                      <div key={student._id} className="grid min-w-0 grid-cols-1 items-center gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:px-5">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-navy">{student.name}</p>
                          <p className="truncate text-xs text-slate-500">{student.studentId}{student.batch && !group.batchName ? ` · ${student.batch}` : ""}</p>
                        </div>
                        <div role="group" aria-label={`Attendance for ${student.name}`} className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1 sm:flex">
                          {statusOptions.map((status) => {
                            const selected = selectedStatus === status;
                            const selectedClass = status === "Present" ? "bg-emerald-600 text-white" : status === "Absent" ? "bg-red-600 text-white" : "bg-amber-500 text-white";
                            return (
                              <button
                                key={status}
                                type="button"
                                aria-pressed={selected}
                                onClick={() => setStudentStatus(student._id, status)}
                                className={`min-h-10 rounded-md px-3 text-xs font-semibold transition-colors ${selected ? selectedClass : "text-slate-600 hover:bg-white"}`}
                              >
                                {status}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>}
              </section>
            );
          })}
          <div className="flex justify-end">
            <button type="button" onClick={handleSave} disabled={saving || visibleStudents.length === 0} className="btn-primary flex min-h-11 items-center gap-2 px-6">
              <FaSave aria-hidden="true" /> {saving ? "Saving..." : "Save Attendance"}
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AttendanceManagement;
