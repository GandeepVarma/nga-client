import React, { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { FaSave } from "react-icons/fa";
import DashboardLayout from "../components/DashboardLayout";
import api from "../api/axios";

const todayStr = () => new Date().toISOString().slice(0, 10);
const statusOptions = ["Present", "Absent", "Leave"];

const AttendanceManagement = () => {
  const [className, setClassName] = useState("");
  const [date, setDate] = useState(todayStr());
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadClassStudents = useCallback(async () => {
    if (!className) { setStudents([]); return; }
    setLoading(true);
    try {
      const [studentsRes, attendanceRes] = await Promise.all([
        api.get("/students", { params: { class: className } }),
        api.get("/attendance", { params: { class: className, date } }),
      ]);
      const activeStudents = studentsRes.data.data.filter((s) => s.status === "Active");
      setStudents(activeStudents);
      const existing = {};
      attendanceRes.data.data.forEach((r) => { existing[r.student._id] = r.status; });
      const initial = {};
      activeStudents.forEach((s) => { initial[s._id] = existing[s._id] || "Present"; });
      setAttendance(initial);
    } catch {
      toast.error("Could not load class attendance");
    } finally {
      setLoading(false);
    }
  }, [className, date]);

  useEffect(() => { loadClassStudents(); }, [loadClassStudents]);

  const handleSave = async () => {
    if (students.length === 0) return;
    setSaving(true);
    try {
      const records = students.map((s) => ({ studentId: s._id, status: attendance[s._id] }));
      await api.post("/attendance", { date, class: className, records });
      toast.success("Attendance saved");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const markAll = (status) => {
    const updated = {};
    students.forEach((s) => (updated[s._id] = status));
    setAttendance(updated);
  };

  return (
    <DashboardLayout title="Attendance Management">
      <div className="card mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div><label className="text-sm font-medium block mb-1">Class</label><input className="input-field" placeholder="e.g. Class 10" value={className} onChange={(e) => setClassName(e.target.value)} /></div>
          <div><label className="text-sm font-medium block mb-1">Date</label><input type="date" className="input-field" value={date} max={todayStr()} onChange={(e) => setDate(e.target.value)} /></div>
          {students.length > 0 && (
            <div className="flex gap-2 ml-auto">
              <button className="btn-outline text-xs py-2" onClick={() => markAll("Present")}>Mark all Present</button>
              <button className="btn-outline text-xs py-2" onClick={() => markAll("Absent")}>Mark all Absent</button>
            </div>
          )}
        </div>
      </div>

      {!className ? (
        <p className="text-slate-400">Enter a class name above to load its student list.</p>
      ) : loading ? (
        <p className="text-slate-400">Loading students...</p>
      ) : students.length === 0 ? (
        <p className="text-slate-400">No active students found in this class assigned to you.</p>
      ) : (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-navy-lighter">
                <th className="py-3 px-4">Student ID</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s._id} className="border-b border-slate-50 dark:border-navy-lighter/50">
                  <td className="py-3 px-4 font-medium text-navy dark:text-white">{s.studentId}</td>
                  <td className="py-3 px-4">{s.name}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      {statusOptions.map((opt) => (
                        <button key={opt} type="button" onClick={() => setAttendance({ ...attendance, [s._id]: opt })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            attendance[s._id] === opt
                              ? opt === "Present" ? "bg-emerald-500 text-white" : opt === "Absent" ? "bg-red-500 text-white" : "bg-amber-500 text-white"
                              : "bg-slate-100 dark:bg-navy-lighter text-slate-500 dark:text-slate-300"
                          }`}
                        >{opt}</button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4 flex justify-end">
            <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2"><FaSave /> {saving ? "Saving..." : "Save Attendance"}</button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AttendanceManagement;
