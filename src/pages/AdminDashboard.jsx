import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import {
  FaArrowRight,
  FaBookOpen,
  FaCalendarCheck,
  FaChartLine,
  FaClipboardList,
  FaClock,
  FaMoneyBillWave,
  FaPlus,
  FaUserPlus,
  FaUserTie,
  FaUsers,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import AnalyticsKpiCard from "../components/AnalyticsKpiCard";
import DashboardChart from "../components/DashboardChart";
import DashboardAnalyticsPanel from "../components/DashboardAnalyticsPanel";
import DashboardLayout from "../components/DashboardLayout";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);

const NAVY = "#244A76";
const DARK_NAVY = "#1D3B5F";
const GOLD = "#F2A900";
const LIGHT_BLUE = "#DCE7F2";
const MUTED = "#718096";
const GRID = "#E2E8F0";
const currencyFormatter = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const numberFormatter = new Intl.NumberFormat("en-IN");

const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 550 },
  interaction: { mode: "index", intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: { backgroundColor: DARK_NAVY, padding: 10, titleColor: "#FFFFFF", bodyColor: "#FFFFFF", displayColors: true },
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: MUTED, maxRotation: 0, autoSkip: true } },
    y: { beginAtZero: true, grid: { color: GRID }, ticks: { color: MUTED, precision: 0 } },
  },
};

const percentChartOptions = {
  ...baseChartOptions,
  scales: {
    ...baseChartOptions.scales,
    y: { ...baseChartOptions.scales.y, min: 0, max: 100, ticks: { ...baseChartOptions.scales.y.ticks, callback: (value) => `${value}%` } },
  },
};

const formatMonth = (month) => new Date(`${month}-01T00:00:00`).toLocaleDateString(undefined, { month: "short", year: "2-digit" });
const dayKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const formatCurrency = (value) => currencyFormatter.format(value || 0);

const getRecentDays = (count, values, totalAdmissions) => {
  const dates = Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (count - index - 1));
    return dayKey(date);
  });
  const admissions = new Map((values || []).map((entry) => [entry._id, entry.count]));
  const rangeAdmissions = dates.reduce((sum, date) => sum + (admissions.get(date) || 0), 0);
  let cumulative = Math.max((totalAdmissions || 0) - rangeAdmissions, 0);
  return dates.map((date) => {
    const newAdmissions = admissions.get(date) || 0;
    cumulative += newAdmissions;
    return { label: new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" }), newAdmissions, cumulativeAdmissions: cumulative };
  });
};

const groupRevenue = (rows, period) => {
  if (period === "monthly") return rows.map((row) => ({ ...row, label: formatMonth(row.month) }));
  const groups = new Map();
  rows.forEach((row) => {
    const [year, monthValue] = row.month.split("-").map(Number);
    const quarter = Math.ceil(monthValue / 3);
    const key = period === "quarterly" ? `${year}-Q${quarter}` : String(year);
    const group = groups.get(key) || { label: key, revenue: 0, pending: 0 };
    group.revenue += row.revenue;
    group.pending += row.pending;
    groups.set(key, group);
  });
  return [...groups.values()];
};

const EmptyState = ({ children }) => (
  <div className="flex min-h-48 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-5 text-center text-sm text-slate-500">
    {children}
  </div>
);

const SegmentedControl = ({ value, options, onChange, label }) => (
  <div className="inline-flex max-w-full rounded-lg bg-slate-100 p-1" aria-label={label}>
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        onClick={() => onChange(option.value)}
        aria-pressed={value === option.value}
        className={`whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors sm:px-3 ${value === option.value ? "bg-white text-navy shadow-sm" : "text-slate-500 hover:text-navy"}`}
      >
        {option.label}
      </button>
    ))}
  </div>
);

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [growthRange, setGrowthRange] = useState("6m");
  const [attendanceRange, setAttendanceRange] = useState("week");
  const [revenueRange, setRevenueRange] = useState("monthly");
  const [teacherSort, setTeacherSort] = useState("score");
  const [classFilter, setClassFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [testFilter, setTestFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedTestId, setSelectedTestId] = useState("all");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setHasError(false);
    api.get("/admin/dashboard", { signal: controller.signal })
      .then((response) => setStats(response.data.data))
      .catch(() => {
        if (!controller.signal.aborted) {
          setHasError(true);
          toast.error("Could not load dashboard analytics");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [loadAttempt]);

  const growthRows = useMemo(() => {
    if (!stats) return [];
    if (growthRange === "7d" || growthRange === "30d") {
      return getRecentDays(growthRange === "7d" ? 7 : 30, stats.dailyAdmissions, stats.totalAdmissionsOnRecord);
    }
    const months = growthRange === "6m" ? 6 : 12;
    return (stats.studentGrowthChart || []).slice(-months).map((entry) => ({
      label: formatMonth(entry.month),
      newAdmissions: entry.newAdmissions,
      cumulativeAdmissions: entry.cumulativeAdmissions,
    }));
  }, [growthRange, stats]);

  const growthChartData = {
    labels: growthRows.map((row) => row.label),
    datasets: [
      {
        label: "Cumulative admissions on record",
        data: growthRows.map((row) => row.cumulativeAdmissions),
        borderColor: NAVY,
        backgroundColor: "rgba(36, 74, 118, 0.08)",
        pointBackgroundColor: NAVY,
        pointRadius: 3,
        tension: 0.34,
        fill: true,
        yAxisID: "y",
      },
      {
        label: "New admissions",
        data: growthRows.map((row) => row.newAdmissions),
        borderColor: GOLD,
        backgroundColor: GOLD,
        pointBackgroundColor: GOLD,
        pointRadius: 3,
        tension: 0.34,
        yAxisID: "y1",
      },
    ],
  };

  const revenueRows = useMemo(() => groupRevenue(stats?.monthlyRevenueChart || [], revenueRange), [revenueRange, stats]);
  const revenueChartData = {
    labels: revenueRows.map((row) => row.label),
    datasets: [
      { label: "Collected", data: revenueRows.map((row) => row.revenue), backgroundColor: NAVY, borderRadius: 4, stack: "fees" },
      { label: "Pending", data: revenueRows.map((row) => row.pending), backgroundColor: GOLD, borderRadius: 4, stack: "fees" },
    ],
  };
  const revenueChartOptions = {
    ...baseChartOptions,
    plugins: { ...baseChartOptions.plugins, legend: { display: true, position: "bottom", labels: { color: MUTED, usePointStyle: true, boxWidth: 8 } }, tooltip: { ...baseChartOptions.plugins.tooltip, callbacks: { label: (context) => `${context.dataset.label}: ${formatCurrency(context.raw)}` } } },
    scales: { ...baseChartOptions.scales, x: { ...baseChartOptions.scales.x, stacked: true }, y: { ...baseChartOptions.scales.y, stacked: true, ticks: { ...baseChartOptions.scales.y.ticks, callback: (value) => `₹${numberFormatter.format(value)}` } } },
  };

  const attendanceRows = useMemo(() => {
    const rows = stats?.attendanceDaily || [];
    const today = new Date();
    const todayKey = dayKey(today);
    if (attendanceRange === "today") return rows.filter((row) => row._id === todayKey);
    if (attendanceRange === "week") {
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - 6);
      return rows.filter((row) => row._id >= dayKey(weekStart) && row._id <= todayKey);
    }
    return rows.filter((row) => row._id.startsWith(todayKey.slice(0, 7)));
  }, [attendanceRange, stats]);
  const attendanceTrendData = {
    labels: attendanceRows.map((row) => new Date(`${row._id}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })),
    datasets: [{
      label: "Attendance",
      data: attendanceRows.map((row) => {
        const marked = row.present + row.absent + row.leave;
        return marked > 0 ? Number((row.present / marked * 100).toFixed(1)) : null;
      }),
      borderColor: NAVY,
      backgroundColor: "rgba(36, 74, 118, 0.1)",
      pointBackgroundColor: GOLD,
      pointRadius: 3,
      tension: 0.34,
      fill: true,
    }],
  };
  const todayAttendance = stats?.todaysAttendance;
  const attendanceMarked = todayAttendance?.marked || 0;
  const attendanceChartData = {
    labels: ["Present", "Absent", "Leave"],
    datasets: [{ data: [todayAttendance?.present || 0, todayAttendance?.absent || 0, todayAttendance?.leave || 0], backgroundColor: [NAVY, GOLD, LIGHT_BLUE], borderColor: "#FFFFFF", borderWidth: 3, hoverOffset: 5 }],
  };
  const attendanceDonutOptions = { responsive: true, maintainAspectRatio: false, cutout: "74%", plugins: { legend: { display: true, position: "bottom", labels: { color: MUTED, usePointStyle: true, boxWidth: 8 } }, tooltip: baseChartOptions.plugins.tooltip } };

  const sortedTeachers = useMemo(() => {
    const teachers = [...(stats?.teacherPerformance || [])];
    const sorters = {
      score: (a, b) => (b.averageScorePercent ?? -1) - (a.averageScorePercent ?? -1),
      lowest: (a, b) => (a.averageScorePercent ?? Infinity) - (b.averageScorePercent ?? Infinity),
      tests: (a, b) => b.testsCount - a.testsCount,
      attendance: (a, b) => (b.attendancePercent ?? -1) - (a.attendancePercent ?? -1),
    };
    return teachers.sort(sorters[teacherSort]);
  }, [stats, teacherSort]);
  const teachersWithScores = sortedTeachers.filter((teacher) => teacher.averageScorePercent != null);
  const teacherChartData = {
    labels: teachersWithScores.map((teacher) => teacher.name),
    datasets: [{ label: "Average score", data: teachersWithScores.map((teacher) => teacher.averageScorePercent), backgroundColor: NAVY, borderRadius: 4, barThickness: 16 }],
  };
  const teacherChartOptions = {
    ...percentChartOptions,
    indexAxis: "y",
    onClick: (_, elements) => { if (elements.length > 0) window.location.assign("/admin/teachers"); },
    plugins: { ...percentChartOptions.plugins, tooltip: { ...percentChartOptions.plugins.tooltip, callbacks: { label: (context) => `Average score: ${context.raw}%` } } },
  };

  const recentTests = stats?.recentTests || [];
  const classes = [...new Set(recentTests.map((test) => test.class).filter(Boolean))].sort();
  const subjects = [...new Set(recentTests.map((test) => test.subject).filter(Boolean))].sort();
  const dateCutoff = dateFilter === "all" ? null : Date.now() - Number(dateFilter) * 24 * 60 * 60 * 1000;
  const filteredTests = recentTests.filter((test) =>
    (classFilter === "all" || test.class === classFilter)
    && (subjectFilter === "all" || test.subject === subjectFilter)
    && (testFilter === "all" || test._id === testFilter)
    && (!dateCutoff || new Date(test.date).getTime() >= dateCutoff)
  ).sort((a, b) => new Date(a.date) - new Date(b.date));
  const currentMonthScore = (stats?.monthlyTestScores || []).find((entry) => entry._id === dayKey(new Date()).slice(0, 7));
  const studentPerformanceData = {
    labels: filteredTests.map((test) => test.testName),
    datasets: [{ label: "Average score", data: filteredTests.map((test) => test.averageScorePercent), borderColor: NAVY, backgroundColor: "rgba(36, 74, 118, 0.1)", pointBackgroundColor: GOLD, pointRadius: 4, tension: 0.32, fill: true }],
  };
  const studentPerformanceOptions = {
    ...percentChartOptions,
    plugins: { ...percentChartOptions.plugins, tooltip: { ...percentChartOptions.plugins.tooltip, callbacks: { label: (context) => context.raw == null ? "No marks entered" : `Average score: ${context.raw}%` } } },
  };

  const classRows = stats?.classPerformance || [];
  const scoredClasses = classRows.filter((row) => row.averageScorePercent != null);
  const classChartData = {
    labels: scoredClasses.map((row) => row.className),
    datasets: [{ label: "Average score", data: scoredClasses.map((row) => row.averageScorePercent), backgroundColor: NAVY, borderRadius: 4, barThickness: 18 }],
  };
  const classChartOptions = { ...percentChartOptions, indexAxis: "y" };

  const testCounts = stats?.monthlyTestCounts || [];
  const testCountByMonth = new Map(testCounts.map((entry) => [entry._id, entry.testCount]));
  const testMonths = (stats?.studentGrowthChart || []).map((entry) => entry.month);
  const testCountChartData = {
    labels: testMonths.map(formatMonth),
    datasets: [{ label: "Tests conducted", data: testMonths.map((month) => testCountByMonth.get(month) || 0), backgroundColor: GOLD, borderRadius: 4 }],
  };
  const selectedTest = recentTests.find((test) => test._id === selectedTestId);
  const admissionRows = (stats?.monthlyAdmissions || []).slice(-6);
  const admissionChartData = {
    labels: admissionRows.map((row) => formatMonth(row.month)),
    datasets: [{ label: "New admissions", data: admissionRows.map((row) => row.newAdmissions), backgroundColor: NAVY, borderRadius: 4 }],
  };
  const currentMonthAdmissionCount = stats?.monthlyAdmissions?.at(-1)?.newAdmissions || 0;
  const previousMonthAdmissionCount = stats?.monthlyAdmissions?.at(-2)?.newAdmissions || 0;
  const admissionInsight = stats?.comparisons?.admissionsPercent == null
    ? "Not enough previous-month admissions data for a comparison."
    : currentMonthAdmissionCount > previousMonthAdmissionCount
      ? `Admissions are up ${stats.comparisons.admissionsPercent}% from last month.`
      : currentMonthAdmissionCount < previousMonthAdmissionCount
        ? `Admissions are down ${Math.abs(stats.comparisons.admissionsPercent)}% from last month.`
        : "Admissions are unchanged from last month.";

  const kpis = stats ? [
    { label: "Total Students", value: numberFormatter.format(stats.totalStudents), detail: "Active students", icon: FaUsers, to: "/admin/students" },
    { label: "Total Teachers", value: numberFormatter.format(stats.totalTeachers), detail: `${stats.comparisons?.teachersAddedThisMonth || 0} added this month`, icon: FaUserTie, to: "/admin/teachers" },
    { label: "Today's Attendance", value: attendanceMarked ? `${todayAttendance.percentage}%` : "—", detail: attendanceMarked ? `${todayAttendance.present} present · ${attendanceMarked} marked` : "No attendance data today", change: stats.comparisons?.attendancePoints, changeUnit: "points", icon: FaCalendarCheck, to: "/admin/attendance" },
    { label: "Monthly Revenue", value: formatCurrency(stats.monthlyRevenue), detail: "Collected for current fee month", change: stats.comparisons?.revenuePercent, icon: FaMoneyBillWave, to: "/admin/fees" },
    { label: "Pending Fees", value: formatCurrency(stats.pendingFees), detail: "Outstanding across fee records", positiveWhenUp: false, icon: FaMoneyBillWave, to: "/admin/fees" },
    { label: "Tests Conducted This Month", value: numberFormatter.format(stats.testsThisMonth), detail: "Compared with last month", change: stats.comparisons?.testsPercent, icon: FaClipboardList, to: "/admin/tests" },
    { label: "Average Test Score", value: currentMonthScore?.averageScorePercent == null ? (stats.averageTestScore == null ? "—" : `${stats.averageTestScore}%`) : `${currentMonthScore.averageScorePercent}%`, detail: currentMonthScore ? `${numberFormatter.format(currentMonthScore.gradedMarks)} marks this month` : `${numberFormatter.format(stats.gradedTestMarks)} marks entered overall`, change: currentMonthScore ? stats.comparisons?.averageScorePoints : null, changeUnit: "points", changePeriod: "vs previous month", icon: FaChartLine, to: "/admin/teacher-performance" },
    { label: "New Admissions", value: numberFormatter.format(currentMonthAdmissionCount), detail: "This month", change: stats.comparisons?.admissionsPercent, icon: FaUserPlus, to: "/admin/students" },
  ] : [];

  const recentActivities = stats?.recentActivities || [];
  const highlights = stats ? [
    ["Active students", numberFormatter.format(stats.totalStudents)],
    ["Teachers", numberFormatter.format(stats.totalTeachers)],
    ["Tests conducted", numberFormatter.format(stats.testsConducted)],
    ["Today's attendance", attendanceMarked ? `${todayAttendance.percentage}%` : "No data"],
    ["Average test score", stats.averageTestScore == null ? "No data" : `${stats.averageTestScore}%`],
    ["Fee collection", stats.collectionPercentage == null ? "No data" : `${stats.collectionPercentage}%`],
  ] : [];

  return (
    <DashboardLayout title="Admin Dashboard">
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => <div key={index} className="card h-36 animate-pulse bg-slate-100" />)}
          <div className="card h-80 animate-pulse bg-slate-100 sm:col-span-2 xl:col-span-4" />
        </div>
      ) : hasError ? (
        <div className="card flex min-h-64 flex-col items-center justify-center gap-4 text-center">
          <p className="text-slate-600">Dashboard analytics could not be loaded.</p>
          <button type="button" className="btn-primary" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>Retry</button>
        </div>
      ) : (
        <div className="space-y-6">
          <section className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gold-dark">Academy overview</p>
              <h2 className="mt-1 font-display text-2xl font-bold text-navy">Welcome back{user?.name ? `, ${user.name}` : ""}</h2>
              <p className="mt-1 text-sm text-slate-500">A current view of learner progress, attendance, assessments, and fee collection.</p>
            </div>
            <p className="text-sm font-medium text-slate-500">{new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
          </section>

          <section aria-label="Academy key performance indicators" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((kpi) => <AnalyticsKpiCard key={kpi.label} {...kpi} />)}
          </section>

          <section className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
            <DashboardAnalyticsPanel
              title="Student growth"
              description="Admissions from student records; cumulative totals reflect records on file."
              actions={<SegmentedControl value={growthRange} onChange={setGrowthRange} label="Student growth range" options={[{ value: "7d", label: "7D" }, { value: "30d", label: "30D" }, { value: "6m", label: "6M" }, { value: "1y", label: "1Y" }]} />}
            >
              {stats.totalAdmissionsOnRecord > 0 ? (
                <DashboardChart type="line" data={growthChartData} options={{ ...baseChartOptions, plugins: { ...baseChartOptions.plugins, legend: { display: true, position: "bottom", labels: { color: MUTED, usePointStyle: true, boxWidth: 8 } } }, scales: { ...baseChartOptions.scales, y1: { beginAtZero: true, position: "right", grid: { drawOnChartArea: false }, ticks: { color: MUTED, precision: 0 } } } }} className="h-64" />
              ) : <EmptyState>No admission records are available for this period.</EmptyState>}
            </DashboardAnalyticsPanel>

            <DashboardAnalyticsPanel
              title="Revenue analytics"
              description={`Collected ${formatCurrency(stats.feesCollected)} · pending ${formatCurrency(stats.pendingFees)} · collection ${stats.collectionPercentage == null ? "—" : `${stats.collectionPercentage}%`}`}
              actions={<SegmentedControl value={revenueRange} onChange={setRevenueRange} label="Revenue period" options={[{ value: "monthly", label: "Monthly" }, { value: "quarterly", label: "Quarterly" }, { value: "yearly", label: "Yearly" }]} />}
            >
              {stats.totalDue > 0 || stats.feesCollected > 0 ? <DashboardChart type="bar" data={revenueChartData} options={revenueChartOptions} className="h-64" /> : <EmptyState>No fee records are available yet.</EmptyState>}
            </DashboardAnalyticsPanel>
          </section>

          <section className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
            <DashboardAnalyticsPanel
              title="Attendance analytics"
              description="Today's marked attendance and the daily attendance rate."
              actions={<SegmentedControl value={attendanceRange} onChange={setAttendanceRange} label="Attendance period" options={[{ value: "today", label: "Today" }, { value: "week", label: "This week" }, { value: "month", label: "This month" }]} />}
            >
              <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
                <div className="relative h-56 min-w-0">
                  {attendanceMarked > 0 ? <>
                    <DashboardChart type="doughnut" data={attendanceChartData} options={attendanceDonutOptions} className="h-full" />
                    <div className="pointer-events-none absolute inset-x-0 top-[36%] text-center">
                      <strong className="block font-display text-2xl text-navy">{todayAttendance.percentage}%</strong>
                      <span className="text-xs text-slate-500">Attendance</span>
                    </div>
                  </> : <EmptyState>No attendance data available today.</EmptyState>}
                </div>
                <div className="h-56 min-w-0">
                  {attendanceRows.length ? <DashboardChart type="line" data={attendanceTrendData} options={percentChartOptions} className="h-full" /> : <EmptyState>No attendance records in this period.</EmptyState>}
                </div>
              </div>
            </DashboardAnalyticsPanel>

            <DashboardAnalyticsPanel
              title="Fee collection"
              description="Collected and pending amounts across saved fee records."
              actions={<Link to="/admin/fees" className="inline-flex items-center gap-2 text-sm font-semibold text-navy hover:text-gold-dark">View fee details <FaArrowRight aria-hidden="true" /></Link>}
            >
              {stats.totalDue > 0 ? (
                <div className="grid min-w-0 grid-cols-1 items-center gap-5 sm:grid-cols-2">
                  <div className="relative mx-auto h-56 w-full max-w-64">
                    <DashboardChart type="doughnut" data={{ labels: ["Collected", "Pending"], datasets: [{ data: [stats.feesCollected, stats.pendingFees], backgroundColor: [NAVY, GOLD], borderColor: "#FFFFFF", borderWidth: 3, hoverOffset: 5 }] }} options={{ ...attendanceDonutOptions, plugins: { ...attendanceDonutOptions.plugins, legend: { display: false } } }} className="h-full" />
                    <div className="pointer-events-none absolute inset-x-0 top-[38%] text-center">
                      <strong className="block font-display text-2xl text-navy">{stats.collectionPercentage}%</strong>
                      <span className="text-xs text-slate-500">Collected</span>
                    </div>
                  </div>
                  <div className="space-y-4 text-sm">
                    <div><p className="text-slate-500">Collected</p><p className="mt-1 font-display text-xl font-bold text-navy">{formatCurrency(stats.feesCollected)}</p></div>
                    <div><p className="text-slate-500">Pending</p><p className="mt-1 font-display text-xl font-bold text-navy">{formatCurrency(stats.pendingFees)}</p></div>
                    <div><p className="text-slate-500">Current fee month</p><p className="mt-1 font-semibold text-navy">{formatCurrency(stats.monthlyRevenue)}</p></div>
                  </div>
                </div>
              ) : <EmptyState>No fee collection data available yet.</EmptyState>}
            </DashboardAnalyticsPanel>
          </section>

          <section className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
            <DashboardAnalyticsPanel
              title="Teacher performance"
              description="Average entered test scores; attendance uses marked records from the recent period."
              actions={<select aria-label="Sort teacher performance" className="input-field w-auto min-w-0 py-2 text-xs" value={teacherSort} onChange={(event) => setTeacherSort(event.target.value)}><option value="score">Highest score</option><option value="lowest">Lowest score</option><option value="tests">Most tests</option><option value="attendance">Best attendance</option></select>}
            >
              {teachersWithScores.length ? <DashboardChart type="bar" data={teacherChartData} options={teacherChartOptions} className="h-64" /> : <EmptyState>No graded student tests are available for teacher comparison.</EmptyState>}
              {sortedTeachers.length > 0 && <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">{sortedTeachers.slice(0, 4).map((teacher) => <div key={teacher.teacherId} className="flex min-w-0 items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-xs"><span className="truncate font-semibold text-navy">{teacher.name}</span><span className="shrink-0 text-slate-500">{teacher.testsCount} tests · {teacher.attendancePercent == null ? "No attendance" : `${teacher.attendancePercent}%`}</span></div>)}</div>}
            </DashboardAnalyticsPanel>

            <DashboardAnalyticsPanel
              title="Student performance"
              description="Average entered scores for recent tests; use available test fields to narrow the view."
              actions={<div className="flex flex-wrap justify-end gap-2">
                <select aria-label="Filter performance by class" className="input-field min-w-0 w-[48%] max-w-none py-2 text-xs sm:w-auto sm:max-w-28" value={classFilter} onChange={(event) => setClassFilter(event.target.value)}><option value="all">All classes</option>{classes.map((className) => <option key={className}>{className}</option>)}</select>
                <select aria-label="Filter performance by subject" className="input-field min-w-0 w-[48%] max-w-none py-2 text-xs sm:w-auto sm:max-w-32" value={subjectFilter} onChange={(event) => setSubjectFilter(event.target.value)}><option value="all">All subjects</option>{subjects.map((subject) => <option key={subject}>{subject}</option>)}</select>
                <select aria-label="Filter performance by test" className="input-field min-w-0 w-[48%] max-w-none py-2 text-xs sm:w-auto sm:max-w-36" value={testFilter} onChange={(event) => setTestFilter(event.target.value)}><option value="all">All tests</option>{recentTests.map((test) => <option key={test._id} value={test._id}>{test.testName}</option>)}</select>
                <select aria-label="Filter performance by date" className="input-field min-w-0 w-[48%] max-w-none py-2 text-xs sm:w-auto sm:max-w-32" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)}><option value="all">Any date</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select>
              </div>}
            >
              {filteredTests.some((test) => test.averageScorePercent != null) ? <DashboardChart type="line" data={studentPerformanceData} options={studentPerformanceOptions} className="h-64" /> : <EmptyState>No scored tests match the current filters.</EmptyState>}
            </DashboardAnalyticsPanel>
          </section>

          <section className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
            <DashboardAnalyticsPanel title="Class performance" description="Student counts, entered test scores, recent attendance, and fee collection by class.">
              {classRows.length ? <>
                {scoredClasses.length > 0 && <DashboardChart type="bar" data={classChartData} options={classChartOptions} className="mb-4 h-48" />}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead><tr className="border-b border-slate-200 text-slate-500"><th className="px-2 py-2">Class</th><th className="px-2 py-2">Students</th><th className="px-2 py-2">Avg score</th><th className="px-2 py-2">Attendance</th><th className="px-2 py-2">Fees</th></tr></thead>
                    <tbody>{classRows.map((row) => <tr key={row.className} className="border-b border-slate-100"><td className="px-2 py-2 font-semibold"><Link to="/admin/students" className="text-navy hover:text-gold-dark">{row.className}</Link></td><td className="px-2 py-2">{numberFormatter.format(row.studentCount)}</td><td className="px-2 py-2">{row.averageScorePercent == null ? "—" : `${row.averageScorePercent}%`}</td><td className="px-2 py-2">{row.attendancePercent == null ? "—" : `${row.attendancePercent}%`}</td><td className="px-2 py-2">{row.feeCollectionPercent == null ? "—" : `${row.feeCollectionPercent}%`}</td></tr>)}</tbody>
                  </table>
                </div>
              </> : <EmptyState>No class records are available yet.</EmptyState>}
            </DashboardAnalyticsPanel>

            <DashboardAnalyticsPanel
              title="Test analytics"
              description={`${numberFormatter.format(stats.totalTests)} total tests · ${numberFormatter.format(stats.testsConducted)} conducted · average ${stats.averageTestScore == null ? "—" : `${stats.averageTestScore}%`}`}
              actions={<select aria-label="Select a test for details" className="input-field w-auto max-w-40 py-2 text-xs" value={selectedTestId} onChange={(event) => setSelectedTestId(event.target.value)}><option value="all">Recent tests</option>{recentTests.map((test) => <option key={test._id} value={test._id}>{test.testName}</option>)}</select>}
            >
              {selectedTestId !== "all" ? (
                selectedTest ? <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4"><div className="rounded-lg bg-slate-50 p-3"><p className="text-slate-500">Test</p><p className="mt-1 font-semibold text-navy">{selectedTest.testName}</p></div><div className="rounded-lg bg-slate-50 p-3"><p className="text-slate-500">Class · subject</p><p className="mt-1 font-semibold text-navy">{selectedTest.class} · {selectedTest.subject}</p></div><div className="rounded-lg bg-slate-50 p-3"><p className="text-slate-500">Average</p><p className="mt-1 font-semibold text-navy">{selectedTest.averageScorePercent == null ? "No marks" : `${selectedTest.averageScorePercent}%`}</p></div><div className="rounded-lg bg-slate-50 p-3"><p className="text-slate-500">Marks entered</p><p className="mt-1 font-semibold text-navy">{numberFormatter.format(selectedTest.gradedMarks)}</p></div></div> : <EmptyState>Test details are unavailable.</EmptyState>
              ) : testMonths.length && stats.testsConducted > 0 ? <DashboardChart type="bar" data={testCountChartData} options={baseChartOptions} className="h-64" /> : <EmptyState>No conducted tests are available yet.</EmptyState>}
              {stats.highestTestScore != null && <p className="mt-3 text-xs text-slate-500">Highest entered score: <strong className="text-navy">{stats.highestTestScore}%</strong> · Lowest: <strong className="text-navy">{stats.lowestTestScore}%</strong></p>}
            </DashboardAnalyticsPanel>
          </section>

          <section className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
            <DashboardAnalyticsPanel title="Admissions overview" description={admissionInsight}>
              {admissionRows.length && admissionRows.some((row) => row.newAdmissions > 0) ? <DashboardChart type="bar" data={admissionChartData} options={baseChartOptions} className="h-56" /> : <EmptyState>No admission records are available for the recent months.</EmptyState>}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm">
                <span className="text-slate-500">Active students</span><strong className="font-display text-lg text-navy">{numberFormatter.format(stats.totalStudents)}</strong>
                <Link to="/admin/students" className="font-semibold text-navy hover:text-gold-dark">View students <FaArrowRight className="inline" aria-hidden="true" /></Link>
              </div>
            </DashboardAnalyticsPanel>

            <DashboardAnalyticsPanel title="Recent activity" description="Latest records across students, staff, assessments, attendance, fees, and assignments.">
              {recentActivities.length ? <ol className="max-h-80 space-y-1 overflow-y-auto">
                {recentActivities.map((activity) => <li key={activity.id}><Link to={activity.to} className="flex min-w-0 items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-slate-50">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy/10 text-navy">
                    {activity.type === "student" ? <FaUserPlus /> : activity.type === "teacher" ? <FaUserTie /> : activity.type === "test" ? <FaClipboardList /> : activity.type === "assignment" ? <FaBookOpen /> : activity.type === "attendance" ? <FaCalendarCheck /> : <FaMoneyBillWave />}
                  </span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-navy">{activity.description}</span><span className="mt-0.5 block truncate text-xs text-slate-500">{activity.detail || activity.type}</span></span>
                  <time className="shrink-0 text-right text-[11px] text-slate-400" dateTime={activity.date}>{new Date(activity.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</time>
                </Link></li>)}
              </ol> : <EmptyState>No recent activity is available yet.</EmptyState>}
            </DashboardAnalyticsPanel>
          </section>

          <section className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[1.4fr_1fr]">
            <DashboardAnalyticsPanel title="Academy highlights" description="Verified snapshots from the academy records currently available.">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{highlights.map(([label, value]) => <div key={label} className="rounded-lg border border-slate-100 bg-slate-50/70 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 font-display text-lg font-bold text-navy">{value}</p></div>)}</div>
            </DashboardAnalyticsPanel>

            <DashboardAnalyticsPanel title="Quick actions" description="Shortcuts to existing academy workflows.">
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["Add student", "/admin/students", FaUserPlus],
                  ["Add teacher", "/admin/teachers", FaUserTie],
                  ["Create test", "/admin/tests", FaClipboardList],
                  ["Add assignment", "/admin/assignments", FaBookOpen],
                  ["Record attendance", "/admin/attendance", FaCalendarCheck],
                  ["Collect fee", "/admin/fees", FaMoneyBillWave],
                ].map(([label, to, Icon]) => <Link key={label} to={to} className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-xs font-semibold text-navy transition-colors hover:border-gold hover:bg-gold/10"><Icon className="shrink-0 text-gold-dark" aria-hidden="true" /><span className="truncate">{label}</span><FaPlus className="ml-auto shrink-0 text-[10px]" aria-hidden="true" /></Link>)}
              </div>
            </DashboardAnalyticsPanel>
          </section>

          <div className="flex items-center gap-2 text-xs text-slate-400"><FaClock aria-hidden="true" /> Metrics update from academy records each time this dashboard loads.</div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminDashboard;
