import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaCheck,
  FaChartBar,
  FaClock,
  FaFileExcel,
  FaSearch,
  FaTrash,
  FaUsers,
} from "react-icons/fa";
import * as XLSX from "xlsx";
import DashboardLayout from "../components/DashboardLayout";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const statusOptions = ["Present", "Absent", "Leave"];
const classOrder = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
const ALL_CLASSES = "__all_classes__";
const ALL_BATCHES = "__all_batches__";
const getReportPeriodLabel = (period, year, month, quarter) => {
  if (period === "month") {
    return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
  }
  if (period === "quarter") return `Q${quarter} ${year}`;
  return String(year);
};

const localDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const today = new Date();
const todayDateString = localDateString(today);

const dateFromApi = (value) => {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
};

const formatDate = (value) =>
  dateFromApi(value).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const sessionLabel = (session) => (session === "morning" ? "Morning" : "Evening");

const AttendanceManagement = () => {
  const { role } = useAuth();
  const [students, setStudents] = useState([]);
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [historyClasses, setHistoryClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const [className, setClassName] = useState("");
  const [batch, setBatch] = useState(ALL_BATCHES);
  const [session, setSession] = useState("morning");
  const [scheduleDate, setScheduleDate] = useState(todayDateString);
  const [scheduling, setScheduling] = useState(false);
  const [historySession, setHistorySession] = useState("morning");
  const [activeClasses, setActiveClasses] = useState([]);
  const [roster, setRoster] = useState([]);
  const [attendanceByStudent, setAttendanceByStudent] = useState({});
  const [rosterLoading, setRosterLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const now = new Date();
  const [reportPeriod, setReportPeriod] = useState("month");
  const [reportYear, setReportYear] = useState(String(now.getFullYear()));
  const [reportMonth, setReportMonth] = useState(String(now.getMonth() + 1));
  const [reportQuarter, setReportQuarter] = useState(String(Math.floor(now.getMonth() / 3) + 1));
  const [reportSession, setReportSession] = useState("all");
  const [lowAttendanceStudents, setLowAttendanceStudents] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [dailyAbsentees, setDailyAbsentees] = useState(null);
  const [absenteesLoading, setAbsenteesLoading] = useState(false);

  const classes = useMemo(
    () => [...new Set(students.map((student) => student.class).filter(Boolean))].sort(classOrder.compare),
    [students]
  );
  const batches = useMemo(
    () => [...new Set(students
      .filter((student) => className === ALL_CLASSES || student.class === className)
      .map((student) => student.batch?.trim() || ""))].sort(classOrder.compare),
    [className, students]
  );
  const upcomingBatches = useMemo(() => {
    const groups = new Map();
    upcomingClasses.forEach((scheduledClass) => {
      const batchName = scheduledClass.batch || "";
      const key = `${scheduledClass.date.slice(0, 10)}\u0000${scheduledClass.session}\u0000${batchName}`;
      const group = groups.get(key) || {
        batch: batchName,
        date: scheduledClass.date,
        session: scheduledClass.session,
        scheduledClasses: [],
      };
      group.scheduledClasses.push(scheduledClass);
      groups.set(key, group);
    });
    return [...groups.values()];
  }, [upcomingClasses]);
  const visibleRoster = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return roster;
    return roster.filter((student) =>
      `${student.name} ${student.studentId}`.toLowerCase().includes(normalizedSearch)
    );
  }, [roster, search]);
  const attendanceSummary = useMemo(
    () => roster.reduce((counts, student) => {
      const status = attendanceByStudent[student._id];
      if (status) counts[status] += 1;
      else counts.unmarked += 1;
      return counts;
    }, { Present: 0, Absent: 0, Leave: 0, unmarked: 0 }),
    [attendanceByStudent, roster]
  );
  const activeClassNames = [...new Set(activeClasses.map((scheduledClass) => scheduledClass.class))];

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError(false);
    Promise.all([
      api.get("/students", { signal: controller.signal }),
      api.get("/attendance/sessions", { params: { period: "upcoming" }, signal: controller.signal }),
      api.get("/attendance/sessions", { params: { period: "history" }, signal: controller.signal }),
    ])
      .then(([studentResponse, upcomingResponse, historyResponse]) => {
        const activeStudents = (studentResponse.data.data || []).filter((student) => student.status === "Active");
        setStudents(activeStudents);
        setUpcomingClasses(upcomingResponse.data.data || []);
        setHistoryClasses(historyResponse.data.data || []);
        setClassName((current) => current || [...new Set(activeStudents.map((item) => item.class).filter(Boolean))].sort(classOrder.compare)[0] || "");
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setLoadError(true);
          toast.error("Could not load attendance data");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [refreshCount]);

  useEffect(() => {
    if (batch !== ALL_BATCHES && !batches.includes(batch)) setBatch(ALL_BATCHES);
  }, [batch, batches]);

  const refreshClasses = () => setRefreshCount((count) => count + 1);

  const scheduleClass = async (event) => {
    event.preventDefault();
    setScheduling(true);
    try {
      const response = await api.post("/attendance/sessions", {
        class: className === ALL_CLASSES ? "" : className,
        batch,
        allClasses: className === ALL_CLASSES,
        allBatches: batch === ALL_BATCHES,
        session,
        date: scheduleDate,
      });
      setUpcomingClasses((current) =>
        [...current, ...response.data.data].sort((a, b) => a.date.localeCompare(b.date) || a.session.localeCompare(b.session))
      );
      toast.success(`${response.data.data.length} class${response.data.data.length === 1 ? "" : "es"} scheduled successfully.`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not schedule this class");
    } finally {
      setScheduling(false);
    }
  };

  const deleteScheduledClass = async (scheduledClass) => {
    const attendanceCount = Object.values(scheduledClass.attendance || {}).reduce((total, count) => total + count, 0);
    const attendanceWarning = attendanceCount
      ? ` This will also permanently delete ${attendanceCount} attendance record${attendanceCount === 1 ? "" : "s"}.`
      : "";
    if (!window.confirm(
      `Delete ${scheduledClass.class} · ${scheduledClass.batch || "No batch"} on ${formatDate(scheduledClass.date)} (${sessionLabel(scheduledClass.session)})?${attendanceWarning}`
    )) return;

    try {
      await api.delete(`/attendance/sessions/${scheduledClass._id}`);
      setUpcomingClasses((current) => current.filter((item) => item._id !== scheduledClass._id));
      setHistoryClasses((current) => current.filter((item) => item._id !== scheduledClass._id));
      setActiveClasses((current) => current.filter((item) => item._id !== scheduledClass._id));
      setRoster((current) => current.filter((student) => student.scheduledClassId !== scheduledClass._id));
      setAttendanceByStudent((current) => Object.fromEntries(
        Object.entries(current).filter(([studentId]) =>
          roster.find((student) => student._id === studentId)?.scheduledClassId !== scheduledClass._id
        )
      ));
      toast.success(attendanceCount
        ? `Scheduled class and ${attendanceCount} attendance record${attendanceCount === 1 ? "" : "s"} deleted.`
        : "Scheduled class deleted.");
      refreshClasses();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not delete the scheduled class");
    }
  };

  const openClasses = async (scheduledClasses) => {
    setActiveClasses(scheduledClasses);
    setRoster([]);
    setAttendanceByStudent({});
    setSearch("");
    setRosterLoading(true);
    try {
      const responses = await Promise.all(
        scheduledClasses.map((scheduledClass) => api.get(`/attendance/sessions/${scheduledClass._id}`))
      );
      const combinedRoster = responses.flatMap((response, index) =>
        response.data.data.students.map((student) => ({
          ...student,
          scheduledClassId: scheduledClasses[index]._id,
        }))
      );
      setRoster(combinedRoster);
      setAttendanceByStudent(Object.fromEntries(
        combinedRoster
          .filter((student) => student.attendanceStatus)
          .map((student) => [student._id, student.attendanceStatus])
      ));
    } catch (error) {
      setActiveClasses([]);
      toast.error(error.response?.data?.message || "Could not open these classes");
    } finally {
      setRosterLoading(false);
    }
  };

  const saveAttendance = async () => {
    const records = roster
      .filter((student) => attendanceByStudent[student._id])
      .map((student) => ({ studentId: student._id, status: attendanceByStudent[student._id] }));
    if (!records.length) {
      toast.error("Mark at least one student before saving.");
      return;
    }
    const recordsByClass = new Map();
    roster.forEach((student) => {
      const status = attendanceByStudent[student._id];
      if (!status) return;
      const recordsForClass = recordsByClass.get(student.scheduledClassId) || [];
      recordsForClass.push({ studentId: student._id, status });
      recordsByClass.set(student.scheduledClassId, recordsForClass);
    });
    setSaving(true);
    try {
      const results = await Promise.allSettled(
        [...recordsByClass].map(([scheduledClassId, classRecords]) =>
          api.put(`/attendance/sessions/${scheduledClassId}/attendance`, { records: classRecords })
        )
      );
      refreshClasses();
      const failedCount = results.filter((result) => result.status === "rejected").length;
      if (failedCount) {
        toast.error(`Attendance could not be saved for ${failedCount} class${failedCount === 1 ? "" : "es"}. Reopen the batch and try again.`);
      } else {
        toast.success(`Attendance saved for ${recordsByClass.size} class${recordsByClass.size === 1 ? "" : "es"}. You can reopen this batch to edit it later.`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not save attendance");
    } finally {
      setSaving(false);
    }
  };

  const markAllPresent = () => {
    setAttendanceByStudent((current) => ({
      ...current,
      ...Object.fromEntries(roster.map((student) => [student._id, "Present"])),
    }));
  };

  const generateLowAttendanceReport = async () => {
    setReportLoading(true);
    setLowAttendanceStudents(null);
    try {
      const params = {
        period: reportPeriod,
        year: reportYear,
        session: reportSession,
      };
      if (reportPeriod === "month") params.month = reportMonth;
      if (reportPeriod === "quarter") params.quarter = reportQuarter;
      const response = await api.get("/attendance/low-attendance", { params });
      setLowAttendanceStudents(response.data.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not generate the low attendance report");
    } finally {
      setReportLoading(false);
    }
  };

  const downloadLowAttendanceReport = () => {
    if (!lowAttendanceStudents) return;
    const rows = lowAttendanceStudents.map((student) => ({
      "Student ID": student.studentId,
      "Student Name": student.name,
      Class: student.class,
      Batch: student.batch || "No batch",
      "Present Sessions": student.presentDays,
      "Absent Sessions": student.absentDays,
      "Leave Sessions": student.leaveDays,
      "Total Marked Sessions": student.totalDays,
      "Attendance (%)": Number(student.attendancePercent.toFixed(2)),
    }));
    const sheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Below 75 Attendance");
    const period = getReportPeriodLabel(reportPeriod, reportYear, reportMonth, reportQuarter)
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "");
    const session = reportSession === "all" ? "all-sessions" : `${reportSession}-session`;
    XLSX.writeFile(workbook, `attendance-below-75-${period}-${session}.xlsx`);
  };

  const generateDailyAbsentees = async () => {
    setAbsenteesLoading(true);
    setDailyAbsentees(null);
    try {
      const date = localDateString(new Date());
      const [morningResponse, eveningResponse] = await Promise.all(
        ["morning", "evening"].map((session) =>
          api.get("/attendance", { params: { date, status: "Absent", session } })
        )
      );
      setDailyAbsentees({
        date,
        morning: morningResponse.data.data || [],
        evening: eveningResponse.data.data || [],
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not generate today's absentees list");
    } finally {
      setAbsenteesLoading(false);
    }
  };

  const downloadDailyAbsentees = (session) => {
    const records = dailyAbsentees?.[session];
    if (!records?.length) return;
    const rows = records.map((record) => ({
      "Student ID": record.student?.studentId || "",
      "Student Name": record.student?.name || "",
      Class: record.class,
      Batch: record.student?.batch || "No batch",
      Date: localDateString(dateFromApi(record.date)),
    }));
    const sheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, `${sessionLabel(session)} Absentees`);
    XLSX.writeFile(workbook, `absentees-${session}-${dailyAbsentees.date}.xlsx`);
  };

  const renderClassCard = (item) => {
    const present = item.attendance?.Present || 0;
    const absent = item.attendance?.Absent || 0;
    const leave = item.attendance?.Leave || 0;
    const marked = present + absent + leave;
    return (
      <article key={item._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-navy">
              <FaCalendarAlt className="text-blue-500" aria-hidden="true" />
              {formatDate(item.date)}
            </p>
            <p className="mt-2 text-base font-bold text-slate-800">{item.class}</p>
            <p className="mt-1 text-sm text-slate-500">{item.batch || "No batch"} · {sessionLabel(item.session)} session</p>
          </div>
          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${item.session === "morning" ? "bg-amber-50 text-amber-700" : "bg-indigo-50 text-indigo-700"}`}>
            <FaClock aria-hidden="true" /> {sessionLabel(item.session)}
          </span>
        </div>
        <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-slate-500">
            {marked ? `${marked} marked · ${present} present · ${absent} absent` : "Attendance not marked yet"}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <button type="button" className="btn-secondary w-full px-3 py-2 text-xs sm:w-auto sm:px-4" onClick={() => openClasses([item])}>
              {marked ? "Open / Edit" : "Open class"}
            </button>
            <button
              type="button"
              className="btn-secondary flex w-full items-center gap-1 px-3 py-2 text-xs text-rose-700 hover:bg-rose-50 sm:w-auto"
              onClick={() => deleteScheduledClass(item)}
              aria-label={`Delete ${item.class} scheduled class`}
              title="Delete scheduled class"
            >
              <FaTrash aria-hidden="true" /> Delete
            </button>
          </div>
        </div>
      </article>
    );
  };

  const renderBatchCard = (group) => {
    const summary = group.scheduledClasses.reduce(
      (counts, scheduledClass) => {
        statusOptions.forEach((status) => {
          counts[status] += scheduledClass.attendance?.[status] || 0;
        });
        return counts;
      },
      { Present: 0, Absent: 0, Leave: 0 }
    );
    const marked = summary.Present + summary.Absent + summary.Leave;
    const classNames = [...new Set(group.scheduledClasses.map((scheduledClass) => scheduledClass.class))]
      .sort(classOrder.compare);
    const key = group.scheduledClasses.map((scheduledClass) => scheduledClass._id).join("-");
    return (
      <article key={key} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-navy">
              <FaCalendarAlt className="text-blue-500" aria-hidden="true" />
              {formatDate(group.date)}
            </p>
            <p className="mt-2 text-base font-bold text-slate-800">Batch: {group.batch || "No batch"}</p>
            <p className="mt-1 text-sm text-slate-500">{classNames.length === 1 ? "Class" : "Classes"}: {classNames.join(", ")} · {sessionLabel(group.session)} session</p>
          </div>
          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${group.session === "morning" ? "bg-amber-50 text-amber-700" : "bg-indigo-50 text-indigo-700"}`}>
            <FaClock aria-hidden="true" /> {sessionLabel(group.session)}
          </span>
        </div>
        <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-slate-500">
            {marked ? `${marked} marked · ${summary.Present} present · ${summary.Absent} absent` : "Attendance not marked yet"}
          </p>
          <button type="button" className="btn-secondary w-full px-4 py-2 text-xs sm:w-auto" onClick={() => openClasses(group.scheduledClasses)}>
            {marked ? "Open / Edit batch" : "Mark batch"}
          </button>
        </div>
        <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
          {group.scheduledClasses.map((scheduledClass) => (
            <div key={scheduledClass._id} className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="min-w-0 flex-1 break-words text-slate-600">{scheduledClass.class}</span>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 font-semibold text-rose-700 hover:bg-rose-50"
                onClick={() => deleteScheduledClass(scheduledClass)}
                aria-label={`Delete ${scheduledClass.class} scheduled class`}
                title="Delete scheduled class"
              >
                <FaTrash aria-hidden="true" /> Delete class
              </button>
            </div>
          ))}
        </div>
      </article>
    );
  };

  return (
    <DashboardLayout title="Attendance Management">
      <div className="mx-auto max-w-7xl space-y-5 sm:space-y-6">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-[#1d3b5f] to-[#315f8f] p-5 text-white shadow-card sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">Class register</p>
          <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="font-display text-2xl font-bold sm:text-3xl">Plan a class. Take attendance.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
                Schedule a morning or evening session for any class and batch in your student records. Attendance is saved against that scheduled class.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm">
              <FaUsers aria-hidden="true" />
              <span>{students.length} active students</span>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-card sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-600">Daily report</p>
              <h3 className="mt-1 font-display text-xl font-bold text-navy">Today’s absentees by session</h3>
              <p className="mt-1 text-sm text-slate-500">Generate separate lists for morning and evening sessions.</p>
            </div>
            <button type="button" className="btn-primary min-h-11 rounded-2xl px-4" disabled={absenteesLoading} onClick={generateDailyAbsentees}>
              {absenteesLoading ? "Generating..." : "Generate lists"}
            </button>
          </div>
          {dailyAbsentees && (
          <div className="mt-5 grid gap-4 sm:gap-5 lg:grid-cols-2">
            {["morning", "evening"].map((session) => {
              const records = dailyAbsentees[session];
              return (
                <div key={session} className="rounded-2xl border border-slate-200 p-4">
                  <div className="mb-3 flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <h4 className="font-semibold text-navy">{sessionLabel(session)} session</h4>
                      <p className="text-sm text-slate-500">
                        {records.length} absent record{records.length === 1 ? "" : "s"} · {formatDate(dailyAbsentees.date)}
                      </p>
                    </div>
                    {records.length > 0 && (
                      <button type="button" className="btn-secondary flex w-full items-center gap-2 px-3 py-2 text-sm sm:w-auto" onClick={() => downloadDailyAbsentees(session)}>
                        <FaFileExcel aria-hidden="true" /> Download
                      </button>
                    )}
                  </div>
                  {records.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                      No students marked absent in the {session} session.
                    </p>
                  ) : (
                    <div className="max-h-[24rem] overflow-auto rounded-xl border border-slate-100">
                      <table className="w-full min-w-[420px] text-left text-sm">
                        <thead className="sticky top-0 bg-slate-50 text-slate-600">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Student</th>
                            <th className="px-4 py-3 font-semibold">Class / Batch</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {records.map((record) => (
                            <tr key={record._id}>
                              <td className="px-4 py-3">
                                <p className="font-semibold text-navy">{record.student?.name || "Unknown student"}</p>
                                <p className="mt-0.5 text-xs text-slate-500">{record.student?.studentId || ""}</p>
                              </td>
                              <td className="px-4 py-3">{record.class} · {record.student?.batch || "No batch"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-card sm:p-6">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Schedule a session</p>
            <h3 className="mt-1 font-display text-xl font-bold text-navy">Add an upcoming class</h3>
          </div>
          <form onSubmit={scheduleClass} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="scheduled-class">Class</label>
              <select id="scheduled-class" className="input-field" value={className} onChange={(event) => setClassName(event.target.value)} required disabled={!classes.length}>
                {classes.length ? <>
                  <option value={ALL_CLASSES}>All classes</option>
                  {classes.map((value) => <option key={value} value={value}>{value}</option>)}
                </> : <option value="">No classes found</option>}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="scheduled-batch">Batch</label>
              <select id="scheduled-batch" className="input-field" value={batch} onChange={(event) => setBatch(event.target.value)} disabled={!batches.length}>
                <option value={ALL_BATCHES}>All batches</option>
                {batches.map((value, index) => <option key={`${value}-${index}`} value={value}>{value || "No batch"}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="scheduled-session">Session</label>
              <select id="scheduled-session" className="input-field" value={session} onChange={(event) => setSession(event.target.value)}>
                <option value="morning">Morning</option>
                <option value="evening">Evening</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="scheduled-date">Date</label>
              <input id="scheduled-date" type="date" className="input-field" min={todayDateString} value={scheduleDate} onChange={(event) => setScheduleDate(event.target.value)} required />
            </div>
            <div className="flex items-end sm:col-span-2 lg:col-span-1">
              <button type="submit" className="btn-primary min-h-[46px] w-full rounded-2xl" disabled={scheduling || !classes.length || !batches.length}>
                {scheduling ? "Scheduling..." : "Schedule class"}
              </button>
            </div>
          </form>
          {!classes.length && !loading && (
            <p className="mt-3 text-sm text-amber-700">No active students are assigned to your account.</p>
          )}
        </section>

        {activeClasses.length > 0 && (
          <section className="rounded-3xl border border-blue-100 bg-white p-4 shadow-card sm:p-6">
            <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:gap-4">
              <div>
                <button type="button" onClick={() => setActiveClasses([])} className="mb-3 inline-flex items-center gap-2 text-xs font-semibold text-blue-700 hover:text-blue-900">
                  <FaArrowLeft aria-hidden="true" /> Back to classes
                </button>
                <h3 className="font-display text-xl font-bold text-navy">
                  {role === "admin"
                    ? `Batch: ${activeClasses[0].batch || "No batch"}`
                    : `${activeClasses[0].class} · ${activeClasses[0].batch || "No batch"}`}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {formatDate(activeClasses[0].date)} · {sessionLabel(activeClasses[0].session)} session
                  {activeClasses.length > 1 && ` · Classes: ${activeClassNames.join(", ")}`}
                  {" · Attendance is saved to each scheduled class"}
                </p>
              </div>
              {!rosterLoading && roster.length > 0 && (
                <button type="button" onClick={markAllPresent} className="btn-secondary w-full px-4 py-2.5 text-sm sm:w-auto">Mark all present</button>
              )}
            </div>

            <div className="my-5 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
              {[
                ["Students", roster.length, "text-navy"],
                ["Present", attendanceSummary.Present, "text-emerald-700"],
                ["Absent", attendanceSummary.Absent, "text-rose-700"],
                ["Leave", attendanceSummary.Leave, "text-amber-700"],
                ["Unmarked", attendanceSummary.unmarked, "text-slate-600"],
              ].map(([label, value, color]) => (
                <div key={label} className="rounded-2xl bg-slate-50 px-3 py-3 sm:px-4">
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className={`mt-1 text-xl font-bold ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            <div className="relative mb-4 w-full sm:max-w-sm">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input className="input-field pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search student name or ID" aria-label="Search students in this batch" />
            </div>

            {rosterLoading ? (
              <div className="py-10 text-center text-sm text-slate-500">Loading attendance roster...</div>
            ) : roster.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 py-10 text-center text-sm text-slate-500">No active students are assigned to this batch.</div>
            ) : (
              <>
                <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-100">
                  {visibleRoster.map((student) => (
                    <div key={student._id} className="flex flex-col justify-between gap-3 p-3 sm:flex-row sm:items-center sm:p-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-navy">{student.name}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {student.studentId}{activeClasses.length > 1 && ` · ${student.class}`}
                        </p>
                      </div>
                      <div role="group" aria-label={`Attendance for ${student.name}`} className="grid w-full grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 sm:w-auto">
                        {statusOptions.map((status) => {
                          const selected = attendanceByStudent[student._id] === status;
                          const selectedClass = status === "Present"
                            ? "bg-emerald-600 text-white"
                            : status === "Absent"
                              ? "bg-rose-600 text-white"
                              : "bg-amber-500 text-white";
                          return (
                            <button
                              key={status}
                              type="button"
                              aria-pressed={selected}
                              onClick={() => setAttendanceByStudent((current) => ({ ...current, [student._id]: status }))}
                              className={`min-h-10 rounded-lg px-2 text-xs font-semibold transition-colors sm:px-3 ${selected ? selectedClass : "text-slate-600 hover:bg-white"}`}
                            >
                              {selected && <FaCheck className="mr-1 inline" aria-hidden="true" />}
                              {status}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {visibleRoster.length === 0 && <p className="p-6 text-center text-sm text-slate-500">No students match your search.</p>}
                </div>
                <div className="mt-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <p className="text-xs text-slate-500">You can save partial attendance and reopen this batch to finish or edit it.</p>
                  <button type="button" onClick={saveAttendance} disabled={saving || attendanceSummary.Present + attendanceSummary.Absent + attendanceSummary.Leave === 0} className="btn-primary min-h-11 w-full rounded-2xl px-6 sm:w-auto">
                    {saving ? "Saving..." : "Save attendance"}
                  </button>
                </div>
              </>
            )}
          </section>
        )}

        {loading || loadError ? (
          <section className="rounded-3xl border border-slate-200 bg-white py-12 text-center shadow-card">
            <p className="text-sm text-slate-600">{loading ? "Loading scheduled classes..." : "Scheduled classes could not be loaded."}</p>
            {loadError && <button type="button" className="btn-secondary mt-4 px-4 py-2" onClick={refreshClasses}>Retry</button>}
          </section>
        ) : (
          <>
            <section>
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Your schedule</p>
                  <h3 className="mt-1 font-display text-xl font-bold text-navy">{role === "admin" ? "Upcoming batches" : "Upcoming classes"}</h3>
                  {role === "admin" && <p className="mt-1 text-sm text-slate-500">Classes sharing a batch, date, and session can be marked together.</p>}
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{upcomingClasses.length} scheduled</span>
              </div>
              {upcomingClasses.length ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {role === "admin" ? upcomingBatches.map(renderBatchCard) : upcomingClasses.map(renderClassCard)}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
                  <p className="font-semibold text-slate-700">No upcoming classes scheduled</p>
                  <p className="mt-1 text-sm text-slate-500">Create a session above to prepare its attendance register.</p>
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-rose-600">
                    <FaChartBar aria-hidden="true" /> Attendance insights
                  </p>
                  <h3 className="mt-1 font-display text-xl font-bold text-navy">Students below 75%</h3>
                  <p className="mt-1 text-sm text-slate-500">Generate a report from recorded attendance in the selected period.</p>
                </div>
                {lowAttendanceStudents?.length > 0 && (
                  <button type="button" className="btn-secondary flex items-center gap-2 px-4 py-2.5 text-sm" onClick={downloadLowAttendanceReport}>
                    <FaFileExcel aria-hidden="true" /> Download Excel
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <label className="text-sm font-medium text-slate-600">
                  Period
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
                  Session
                  <select className="input-field mt-1 min-w-36" value={reportSession} onChange={(event) => { setReportSession(event.target.value); setLowAttendanceStudents(null); }}>
                    <option value="all">All sessions</option>
                    <option value="morning">Morning</option>
                    <option value="evening">Evening</option>
                  </select>
                </label>
                <label className="text-sm font-medium text-slate-600">
                  Year
                  <input type="number" min="1900" max="9999" className="input-field mt-1 w-28" value={reportYear} onChange={(event) => { setReportYear(event.target.value); setLowAttendanceStudents(null); }} />
                </label>
                <button type="button" className="btn-primary min-h-11 rounded-2xl" disabled={reportLoading || !reportYear} onClick={generateLowAttendanceReport}>
                  {reportLoading ? "Generating..." : "Generate report"}
                </button>
              </div>
              {lowAttendanceStudents && (
                <div className="mt-5">
                  <p className="mb-3 text-sm text-slate-600">
                    {getReportPeriodLabel(reportPeriod, reportYear, reportMonth, reportQuarter)}
                    {" · "}{reportSession === "all" ? "All sessions" : `${sessionLabel(reportSession)} session`}
                    {" · "}{lowAttendanceStudents.length} student{lowAttendanceStudents.length === 1 ? "" : "s"} below 75%
                  </p>
                  {lowAttendanceStudents.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">No students are below 75% attendance for this period.</p>
                  ) : (
                    <div className="max-h-[28rem] overflow-auto rounded-2xl border border-slate-200">
                      <table className="w-full min-w-[680px] text-left text-sm">
                        <thead className="sticky top-0 bg-slate-50 text-slate-600">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Student</th>
                            <th className="px-4 py-3 font-semibold">Class / Batch</th>
                            <th className="px-4 py-3 font-semibold">Sessions</th>
                            <th className="px-4 py-3 text-right font-semibold">Attendance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {lowAttendanceStudents.map((student) => (
                            <tr key={student._id}>
                              <td className="px-4 py-3">
                                <p className="font-semibold text-navy">{student.name}</p>
                                <p className="mt-0.5 text-xs text-slate-500">{student.studentId}</p>
                              </td>
                              <td className="px-4 py-3">{student.class} · {student.batch || "No batch"}</td>
                              <td className="px-4 py-3">
                                <p>{student.presentDays} present / {student.totalDays} marked</p>
                                <p className="mt-0.5 text-xs text-slate-500">{student.absentDays} absent · {student.leaveDays} leave</p>
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-rose-700">{Number(student.attendancePercent.toFixed(1))}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </section>

            <section>
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Past sessions</p>
                <h3 className="mt-1 font-display text-xl font-bold text-navy">Attendance history</h3>
                <p className="mt-1 text-sm text-slate-500">Sessions with attendance marked are shown for 7 days.</p>
              </div>
              <div className="mb-4 inline-flex rounded-xl bg-slate-200/70 p-1" aria-label="Filter attendance history by session">
                {["morning", "evening"].map((value) => (
                  <button key={value} type="button" aria-pressed={historySession === value} onClick={() => setHistorySession(value)} className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${historySession === value ? "bg-white text-navy shadow-sm" : "text-slate-600 hover:text-navy"}`}>
                    {sessionLabel(value)}
                  </button>
                ))}
              </div>
              {historyClasses.filter((item) => item.session === historySession).length ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {historyClasses.filter((item) => item.session === historySession).map(renderClassCard)}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center text-sm text-slate-500">
                  No {historySession} attendance history yet.
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AttendanceManagement;
