import React, { useEffect, useState, useCallback } from "react";
import { FaPlus, FaSearch, FaEdit, FaTrash, FaEye } from "react-icons/fa";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import DashboardLayout from "../components/DashboardLayout";
import api from "../api/axios";

const emptyForm = {
  studentId: "",
  name: "",
  parentName: "",
  phone: "",
  class: "",
  password: "",
  monthlyFee: "",
  admissionFee: "",
};

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

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
      class: student.class,
      password: "",
      monthlyFee: student.monthlyFee,
      admissionFee: student.admissionFee,
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
        await api.put(`/students/${editingId}`, payload);
        toast.success("Student updated");
      } else {
        await api.post("/students", form);
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
    <DashboardLayout title="Student Management">
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
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-slate-400">
                  Loading students...
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-slate-400">
                  No students found.
                </td>
              </tr>
            ) : (
              students.map((s) => (
                <tr
                  key={s._id}
                  className="border-b border-slate-50 dark:border-navy-lighter/50 hover:bg-slate-50 dark:hover:bg-navy-lighter/40"
                >
                  <td className="py-3 px-4 font-medium text-navy dark:text-white">{s.studentId}</td>
                  <td className="py-3 px-4">{s.name}</td>
                  <td className="py-3 px-4">{s.class}</td>
                  <td className="py-3 px-4">{s.phone}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`badge ${
                        s.status === "Active"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-3 text-slate-500">
                      <Link to={`/teacher/students/${s._id}`} title="View profile">
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
                <input
                  className="input-field mt-1"
                  required
                  disabled={!!editingId}
                  value={form.studentId}
                  onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                />
              </div>
              <div className="col-span-1">
                <label className="text-sm font-medium">Class</label>
                <input
                  className="input-field mt-1"
                  required
                  value={form.class}
                  onChange={(e) => setForm({ ...form, class: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">Full Name</label>
                <input
                  className="input-field mt-1"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="col-span-1">
                <label className="text-sm font-medium">Parent Name</label>
                <input
                  className="input-field mt-1"
                  required
                  value={form.parentName}
                  onChange={(e) => setForm({ ...form, parentName: e.target.value })}
                />
              </div>
              <div className="col-span-1">
                <label className="text-sm font-medium">Phone</label>
                <input
                  className="input-field mt-1"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="col-span-1">
                <label className="text-sm font-medium">Monthly Fee</label>
                <input
                  type="number"
                  className="input-field mt-1"
                  required
                  value={form.monthlyFee}
                  onChange={(e) => setForm({ ...form, monthlyFee: e.target.value })}
                />
              </div>
              <div className="col-span-1">
                <label className="text-sm font-medium">Admission Fee</label>
                <input
                  type="number"
                  className="input-field mt-1"
                  value={form.admissionFee}
                  onChange={(e) => setForm({ ...form, admissionFee: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">
                  {editingId ? "New Password (leave blank to keep current)" : "Password"}
                </label>
                <input
                  type="password"
                  className="input-field mt-1"
                  required={!editingId}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>

              <div className="col-span-2 flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? "Saving..." : "Save Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentManagement;
