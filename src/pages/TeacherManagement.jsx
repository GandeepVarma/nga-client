import React, { useEffect, useState, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import { FaPlus, FaEdit, FaKey, FaBan, FaCheckCircle, FaEye, FaTimes } from "react-icons/fa";
import DashboardLayout from "../components/DashboardLayout";
import api from "../api/axios";
import { ActionMenu, ConfirmDialog, EmptyState, Pagination, TableToolbar } from "../components/AdminUi";

const emptyForm = { name: "", email: "", password: "", phone: "" };

const TeacherManagement = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusTarget, setStatusTarget] = useState(null);
  const [profileTarget, setProfileTarget] = useState(null);

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
    try {
      await api.put(`/admin/teachers/${teacher._id}/status`, { isActive: !teacher.isActive });
      toast.success(`Teacher ${action}d`);
      setStatusTarget(null);
      fetchTeachers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(newPassword)) {
      toast.error("Password must be at least 8 characters and include uppercase, lowercase, and a number");
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

  const filteredTeachers = useMemo(() => {
    const filtered = teachers.filter((teacher) => {
      const matchesSearch = !search || `${teacher.name} ${teacher.email} ${teacher.phone || ""}`.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? teacher.isActive : !teacher.isActive);
      return matchesSearch && matchesStatus;
    });
    return [...filtered].sort((a, b) => {
      const av = sortField === "students" ? a.studentCount || 0 : sortField === "email" ? a.email || "" : a.name || "";
      const bv = sortField === "students" ? b.studentCount || 0 : sortField === "email" ? b.email || "" : b.name || "";
      const comparison = typeof av === "number" ? av - bv : av.localeCompare(bv);
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [search, sortDirection, sortField, statusFilter, teachers]);
  const totalPages = Math.max(1, Math.ceil(filteredTeachers.length / pageSize));
  const pagedTeachers = filteredTeachers.slice((page - 1) * pageSize, page * pageSize);

  return (
    <DashboardLayout title="Teacher Management">
      <TableToolbar
        search={search}
        onSearch={(value) => { setSearch(value); setPage(1); }}
        searchPlaceholder="Search by name, email or phone..."
        filters={
          <>
            <select className="input-field w-auto min-w-32 py-2.5" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} aria-label="Filter teacher status">
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Deactivated</option>
            </select>
            <select className="input-field w-auto min-w-36 py-2.5" value={`${sortField}:${sortDirection}`} onChange={(event) => { const [field, direction] = event.target.value.split(":"); setSortField(field); setSortDirection(direction); }} aria-label="Sort teachers">
              <option value="name:asc">Name A-Z</option>
              <option value="name:desc">Name Z-A</option>
              <option value="students:desc">Most students</option>
              <option value="students:asc">Fewest students</option>
              <option value="email:asc">Email A-Z</option>
            </select>
          </>
        }
        action={<button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2"><FaPlus /> Add Teacher</button>}
      />

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
            ) : pagedTeachers.length === 0 ? (
              <tr><td colSpan={6} className="p-6"><EmptyState title="No teachers found" description="Try changing the search or status filter." action={<button type="button" className="btn-primary" onClick={() => setShowAddModal(true)}>Add Teacher</button>} /></td></tr>
            ) : (
              pagedTeachers.map((t) => (
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
                    <div className="flex justify-end">
                      <ActionMenu
                        label={`Actions for ${t.name}`}
                        items={[
                          { label: "View teacher", icon: <FaEye />, onClick: () => setProfileTarget(t) },
                          { label: "Edit teacher", icon: <FaEdit />, onClick: () => openEdit(t) },
                          { label: "Reset password", icon: <FaKey />, onClick: () => setResetModal(t) },
                          { label: t.isActive ? "Deactivate teacher" : "Activate teacher", icon: t.isActive ? <FaBan /> : <FaCheckCircle />, danger: t.isActive, onClick: () => setStatusTarget(t) },
                        ]}
                      />
                    </div>
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
        from={filteredTeachers.length ? (page - 1) * pageSize + 1 : 0}
        to={Math.min(page * pageSize, filteredTeachers.length)}
        total={filteredTeachers.length}
      />

      <ConfirmDialog
        open={Boolean(statusTarget)}
        title={statusTarget?.isActive ? "Deactivate teacher?" : "Activate teacher?"}
        description={statusTarget ? `${statusTarget.name} will be ${statusTarget.isActive ? "prevented from logging in" : "allowed to log in again"}. Assigned student records will be preserved.` : ""}
        confirmLabel={statusTarget?.isActive ? "Deactivate" : "Activate"}
        danger={Boolean(statusTarget?.isActive)}
        onCancel={() => setStatusTarget(null)}
        onConfirm={() => statusTarget && toggleStatus(statusTarget)}
      />

      {profileTarget && (
        <div className="admin-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setProfileTarget(null)}>
          <section role="dialog" aria-modal="true" aria-labelledby="teacher-profile-title" className="admin-confirm-dialog max-w-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="teacher-profile-title">{profileTarget.name}</h2>
                <p>{profileTarget.email}</p>
              </div>
              <button type="button" className="admin-action-trigger" onClick={() => setProfileTarget(null)} aria-label="Close teacher profile"><FaTimes /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">Phone</p><p className="mt-1 text-sm font-semibold text-navy">{profileTarget.phone || "-"}</p></div>
              <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">Assigned students</p><p className="mt-1 text-sm font-semibold text-navy">{profileTarget.studentCount}</p></div>
              <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">Account status</p><p className="mt-1 text-sm font-semibold text-navy">{profileTarget.isActive ? "Active" : "Deactivated"}</p></div>
              <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">Joined</p><p className="mt-1 text-sm font-semibold text-navy">{profileTarget.createdAt ? new Date(profileTarget.createdAt).toLocaleDateString() : "-"}</p></div>
            </div>
            <div className="admin-confirm-actions mt-5">
              <button type="button" className="admin-button-secondary" onClick={() => setProfileTarget(null)}>Close</button>
              <button type="button" className="admin-button-primary" onClick={() => { setProfileTarget(null); openEdit(profileTarget); }}>Edit Teacher</button>
            </div>
          </section>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-light rounded-xl2 shadow-card-hover w-full max-w-md p-6">
            <h3 className="font-display font-bold text-lg text-navy dark:text-white mb-4">Add Teacher</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div><label className="text-sm font-medium block mb-1">Full Name</label><input className="input-field" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><label className="text-sm font-medium block mb-1">Email</label><input type="email" className="input-field" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><label className="text-sm font-medium block mb-1">Phone</label><input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><label className="text-sm font-medium block mb-1">Temporary Password</label><input type="password" className="input-field" required minLength={8} pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}" title="Use at least 8 characters with uppercase, lowercase, and a number" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /><p className="text-xs text-slate-500 mt-1">At least 8 characters, including uppercase, lowercase, and a number.</p></div>
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
                <input type="password" className="input-field" required minLength={8} pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}" title="Use at least 8 characters with uppercase, lowercase, and a number" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                <p className="text-xs text-slate-500 mt-1">At least 8 characters, including uppercase, lowercase, and a number.</p>
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
