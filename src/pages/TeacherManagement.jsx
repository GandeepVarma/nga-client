import React, { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { FaPlus, FaEdit, FaKey, FaBan, FaCheckCircle } from "react-icons/fa";
import DashboardLayout from "../components/DashboardLayout";
import api from "../api/axios";

const emptyForm = { name: "", email: "", password: "", phone: "" };

const TeacherManagement = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", phone: "" });

  const [resetModal, setResetModal] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/teachers");
      setTeachers(res.data.data);
    } catch {
      toast.error("Could not load teachers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/admin/teachers", form);
      toast.success("Teacher account created");
      setShowAddModal(false);
      setForm(emptyForm);
      fetchTeachers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create teacher");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (teacher) => {
    setEditModal(teacher);
    setEditForm({ name: teacher.name, phone: teacher.phone || "" });
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/teachers/${editModal._id}`, editForm);
      toast.success("Teacher updated");
      setEditModal(null);
      fetchTeachers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    }
  };

  const toggleStatus = async (teacher) => {
    const action = teacher.isActive ? "deactivate" : "activate";
    if (!confirm(`Are you sure you want to ${action} ${teacher.name}?`)) return;
    try {
      await api.put(`/admin/teachers/${teacher._id}/status`, { isActive: !teacher.isActive });
      toast.success(`Teacher ${action}d`);
      fetchTeachers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    try {
      await api.put(`/admin/teachers/${resetModal._id}/reset-password`, { newPassword });
      toast.success(`Password reset for ${resetModal.name}`);
      setResetModal(null);
      setNewPassword("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset password");
    }
  };

  return (
    <DashboardLayout title="Teacher Management">
      <div className="flex justify-end mb-5">
        <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
          <FaPlus /> Add Teacher
        </button>
      </div>

      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-navy-lighter">
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Phone</th>
              <th className="py-3 px-4">Students</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-10 text-slate-400">Loading...</td></tr>
            ) : teachers.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-slate-400">No teachers yet. Add one to get started.</td></tr>
            ) : (
              teachers.map((t) => (
                <tr key={t._id} className="border-b border-slate-50 dark:border-navy-lighter/50">
                  <td className="py-3 px-4 font-medium text-navy dark:text-white">{t.name}</td>
                  <td className="py-3 px-4">{t.email}</td>
                  <td className="py-3 px-4">{t.phone || "-"}</td>
                  <td className="py-3 px-4">{t.studentCount}</td>
                  <td className="py-3 px-4">
                    <span className={`badge ${t.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                      {t.isActive ? "Active" : "Deactivated"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-3 text-slate-500">
                      <button onClick={() => openEdit(t)} title="Edit"><FaEdit className="hover:text-gold" /></button>
                      <button onClick={() => setResetModal(t)} title="Reset password"><FaKey className="hover:text-blue-500" /></button>
                      <button onClick={() => toggleStatus(t)} title={t.isActive ? "Deactivate" : "Activate"}>
                        {t.isActive ? <FaBan className="hover:text-red-500" /> : <FaCheckCircle className="hover:text-emerald-500" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-light rounded-xl2 shadow-card-hover w-full max-w-md p-6">
            <h3 className="font-display font-bold text-lg text-navy dark:text-white mb-4">Add Teacher</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div><label className="text-sm font-medium block mb-1">Full Name</label><input className="input-field" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><label className="text-sm font-medium block mb-1">Email</label><input type="email" className="input-field" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><label className="text-sm font-medium block mb-1">Phone</label><input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><label className="text-sm font-medium block mb-1">Temporary Password</label><input type="password" className="input-field" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" className="btn-outline" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? "Creating..." : "Create Teacher"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-light rounded-xl2 shadow-card-hover w-full max-w-md p-6">
            <h3 className="font-display font-bold text-lg text-navy dark:text-white mb-4">Edit Teacher</h3>
            <form onSubmit={handleEditSave} className="space-y-4">
              <div><label className="text-sm font-medium block mb-1">Full Name</label><input className="input-field" required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></div>
              <div><label className="text-sm font-medium block mb-1">Phone</label><input className="input-field" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} /></div>
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" className="btn-outline" onClick={() => setEditModal(null)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {resetModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-light rounded-xl2 shadow-card-hover w-full max-w-sm p-6">
            <h3 className="font-display font-bold text-lg text-navy dark:text-white mb-1">Reset Password</h3>
            <p className="text-sm text-slate-500 mb-4">for {resetModal.name}</p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">New Password</label>
                <input type="password" className="input-field" required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" className="btn-outline" onClick={() => { setResetModal(null); setNewPassword(""); }}>Cancel</button>
                <button type="submit" className="btn-primary">Reset Password</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default TeacherManagement;
