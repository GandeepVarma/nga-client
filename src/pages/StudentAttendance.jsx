import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FaArrowLeft, FaCalendarCheck } from "react-icons/fa";
import DashboardLayout from "../components/DashboardLayout";
import api from "../api/axios";

const formatDate = (value) => {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getDateKey = (value) => value.slice(0, 10);

const StudentAttendance = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [period, setPeriod] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [month, setMonth] = useState("");
  const [semester, setSemester] = useState("1");
  const [semesterYear, setSemesterYear] = useState(String(new Date().getFullYear()));
  const [classFilter, setClassFilter] = useState("all");

  useEffect(() => {
    api.get("/attendance/my")
      .then((response) => setRecords(response.data.data))
      .catch(() => toast.error("Could not load your attendance history"))
      .finally(() => setLoading(false));
  }, []);

  const classes = useMemo(
    () => [...new Set(records.map((record) => record.class).filter(Boolean))].sort(),
    [records]
  );
  const years = useMemo(() => {
    const recordYears = records.map((record) => getDateKey(record.date).slice(0, 4));
    return [...new Set([String(new Date().getFullYear()), ...recordYears])].sort((a, b) => b.localeCompare(a));
  }, [records]);

  const filteredRecords = useMemo(() => records.filter((record) => {
    const dateKey = getDateKey(record.date);
    if (statusFilter !== "all" && record.status !== statusFilter) return false;
    if (classFilter !== "all" && record.class !== classFilter) return false;
    if (period === "dateRange") {
      if (startDate && dateKey < startDate) return false;
      if (endDate && dateKey > endDate) return false;
    }
    if (period === "month" && month && dateKey.slice(0, 7) !== month) return false;
    if (period === "semester") {
      const monthNumber = Number(dateKey.slice(5, 7));
      const recordSemester = monthNumber <= 6 ? "1" : "2";
      if (dateKey.slice(0, 4) !== semesterYear || recordSemester !== semester) return false;
    }
    return true;
  }), [records, statusFilter, classFilter, period, startDate, endDate, month, semester, semesterYear]);

  const resetFilters = () => {
    setStatusFilter("all");
    setPeriod("all");
    setStartDate("");
    setEndDate("");
    setMonth("");
    setSemester("1");
    setSemesterYear(String(new Date().getFullYear()));
    setClassFilter("all");
  };

  return (
    <DashboardLayout title="Attendance Details">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link to="/student/dashboard" className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900">
              <FaArrowLeft aria-hidden="true" /> Back to dashboard
            </Link>
            <h2 className="font-display text-2xl font-bold text-navy">Attendance Details</h2>
            <p className="mt-1 text-sm text-slate-700">Your current and previous class attendance records.</p>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-emerald-100 px-4 py-3 text-emerald-900">
            <FaCalendarCheck aria-hidden="true" />
            <span className="text-sm font-semibold">{filteredRecords.length} {filteredRecords.length === 1 ? "record" : "records"}</span>
          </div>
        </div>

        <section className="card" aria-label="Attendance filters">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div>
              <label htmlFor="attendance-status" className="mb-1 block text-sm font-semibold text-navy">Attendance Status</label>
              <select id="attendance-status" className="input-field" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">All</option>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
              </select>
            </div>
            <div>
              <label htmlFor="attendance-period" className="mb-1 block text-sm font-semibold text-navy">Time Period</label>
              <select id="attendance-period" className="input-field" value={period} onChange={(event) => setPeriod(event.target.value)}>
                <option value="all">All time</option>
                <option value="dateRange">Date range</option>
                <option value="month">Month</option>
                <option value="semester">Semester / Academic term</option>
              </select>
            </div>
            {period === "dateRange" && (
              <>
                <div>
                  <label htmlFor="attendance-start-date" className="mb-1 block text-sm font-semibold text-navy">From</label>
                  <input id="attendance-start-date" type="date" className="input-field" value={startDate} max={endDate || undefined} onChange={(event) => setStartDate(event.target.value)} />
                </div>
                <div>
                  <label htmlFor="attendance-end-date" className="mb-1 block text-sm font-semibold text-navy">To</label>
                  <input id="attendance-end-date" type="date" className="input-field" value={endDate} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} />
                </div>
              </>
            )}
            {period === "month" && (
              <div>
                <label htmlFor="attendance-month" className="mb-1 block text-sm font-semibold text-navy">Month</label>
                <input id="attendance-month" type="month" className="input-field" value={month} onChange={(event) => setMonth(event.target.value)} />
              </div>
            )}
            {period === "semester" && (
              <>
                <div>
                  <label htmlFor="attendance-semester" className="mb-1 block text-sm font-semibold text-navy">Semester</label>
                  <select id="attendance-semester" className="input-field" value={semester} onChange={(event) => setSemester(event.target.value)}>
                    <option value="1">Semester 1 (Jan–Jun)</option>
                    <option value="2">Semester 2 (Jul–Dec)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="attendance-semester-year" className="mb-1 block text-sm font-semibold text-navy">Year</label>
                  <select id="attendance-semester-year" className="input-field" value={semesterYear} onChange={(event) => setSemesterYear(event.target.value)}>
                    {years.map((year) => <option key={year} value={year}>{year}</option>)}
                  </select>
                </div>
              </>
            )}
            <div>
              <label htmlFor="attendance-class" className="mb-1 block text-sm font-semibold text-navy">Subject / Class</label>
              <select id="attendance-class" className="input-field" value={classFilter} onChange={(event) => setClassFilter(event.target.value)}>
                <option value="all">All classes</option>
                {classes.map((className) => <option key={className} value={className}>{className}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button type="button" className="btn-outline" onClick={resetFilters}>Clear filters</button>
          </div>
        </section>

        <section className="card p-0" aria-label="Attendance records">
          {loading ? (
            <div className="space-y-3 p-5" aria-label="Loading attendance records">
              <div className="h-14 animate-pulse rounded-lg bg-slate-100 dark:bg-navy-lighter" />
              <div className="h-14 animate-pulse rounded-lg bg-slate-100 dark:bg-navy-lighter" />
            </div>
          ) : filteredRecords.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-slate-700">
              {records.length ? "No attendance records match these filters." : "No attendance records are available yet."}
            </p>
          ) : (
            <ol className="divide-y divide-slate-100 dark:divide-navy-lighter">
              {filteredRecords.map((record) => (
                <li key={record._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div>
                    <p className="font-semibold text-navy">{record.class || "Class not specified"}</p>
                    <p className="mt-1 text-sm text-slate-700">
                      {formatDate(record.date)}{record.session ? ` · ${record.session[0].toUpperCase()}${record.session.slice(1)} session` : ""}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    record.status === "Present"
                      ? "bg-emerald-100 text-emerald-900"
                      : record.status === "Absent"
                        ? "bg-red-100 text-red-900"
                        : "bg-amber-100 text-amber-900"
                  }`}>
                    {record.status}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
};

export default StudentAttendance;
