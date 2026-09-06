import React, { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { FaExchangeAlt } from "react-icons/fa";
import DashboardLayout from "../components/DashboardLayout";
import api from "../api/axios";

const AssignStudents = () => {
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [bulkTeacher, setBulkTeacher] = useState("");
  const [savingBulk, setSavingBulk] = useState(false);
  const [savingRow, setSavingRow] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [studentsRes, teachersRes] = await Promise.all([
        api.get("/students"),
        api.get("/admin/teachers"),
      ]);
      setStudents(studentsRes.data.data);
      setTeachers(teachersRes.data.data);
    } catch {
      toast.error("Could not load students or teachers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleSelected = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const handleBulkAssign = async () => {
    if (selected.length === 0 || !bulkTeacher) {
      toast.error("Select at least one student and a teacher");
      return;
    }
    setSavingBulk(true);
    try {
      const res = await api.put("/admin/students/assign", { studentIds: selected, teacherId: bulkTeacher });
      toast.success(res.data.message);
      setSelected([]);
      setBulkTeacher("");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Bulk assign failed");
    } finally {
      setSavingBulk(false);
    }
  };

  const handleReassignRow = async (studentId, teacherId) => {
    if (!teacherId) return;
    setSavingRow(studentId);
    try {
      const res = await api.put(`/admin/students/${studentId}/reassign`, { teacherId });
      toast.success(res.data.message);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Reassign failed");
    } finally {
      setSavingRow(null);
    }
  };

  return (
    <DashboardLayout title="Assign / Reassign Students">
      <div className="card mb-6">
        <h3 className="font-display font-semibold text-navy dark:text-white mb-3 flex items-center gap-2">
          <FaExchangeAlt /> Bulk Assign
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Check students in the table below, choose a teacher, then assign them all at once.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-slate-500">{selected.length} student(s) selected</span>
          <select className="input-field max-w-[220px]" value={bulkTeacher} onChange={(e) => setBulkTeacher(e.target.value)}>
            <option value="">Select teacher...</option>
            {teachers.map((t) => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </select>
          <button onClick={handleBulkAssign} disabled={savingBulk} className="btn-primary">
            {savingBulk ? "Assigning..." : "Assign Selected"}
          </button>
        </div>
      </div>

      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-navy-lighter">
              <th className="py-3 px-4 w-10"></th>
              <th className="py-3 px-4">Student</th>
              <th className="py-3 px-4">Class</th>
              <th className="py-3 px-4">Current Teacher</th>
              <th className="py-3 px-4">Reassign To</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-10 text-slate-400">Loading...</td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-10 text-slate-400">No students found.</td></tr>
            ) : (
              students.map((s) => (
                <tr key={s._id} className="border-b border-slate-50 dark:border-navy-lighter/50">
                  <td className="py-3 px-4">
                    <input type="checkbox" checked={selected.includes(s._id)} onChange={() => toggleSelected(s._id)} />
                  </td>
                  <td className="py-3 px-4 font-medium text-navy dark:text-white">
                    {s.name} <span className="text-slate-400 font-normal">({s.studentId})</span>
                  </td>
                  <td className="py-3 px-4">{s.class}</td>
                  <td className="py-3 px-4">{s.assignedTeacher?.name || "Unassigned"}</td>
                  <td className="py-3 px-4">
                    <select
                      className="input-field py-1.5 w-44"
                      disabled={savingRow === s._id}
                      defaultValue=""
                      onChange={(e) => handleReassignRow(s._id, e.target.value)}
                    >
                      <option value="">Move to...</option>
                      {teachers
                        .filter((t) => t._id !== (s.assignedTeacher?._id || s.assignedTeacher))
                        .map((t) => (
                          <option key={t._id} value={t._id}>{t.name}</option>
                        ))}
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
};

export default AssignStudents;
