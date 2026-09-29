import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaEdit, FaImage, FaPlus, FaTrash } from "react-icons/fa";
import DashboardLayout from "../components/DashboardLayout";
import api from "../api/axios";

const emptyForm = { name: "", level: "", badge: "Program", description: "", features: "", monthlyFee: "", sortOrder: 0, image: null, imageUrl: "" };

const ProgramManagement = () => {
  const [programs, setPrograms] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/admin/programs");
      setPrograms(response.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load programs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPrograms(); }, [fetchPrograms]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (program) => {
    setEditing(program);
    setForm({ ...emptyForm, ...program, features: (program.features || []).join(", "), image: null });
    setShowForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key !== "image" && value !== undefined && value !== null) payload.append(key, value);
      });
      if (form.image) payload.append("image", form.image);
      if (editing) await api.put(`/admin/programs/${editing._id}`, payload);
      else await api.post("/admin/programs", payload);
      toast.success(editing ? "Program updated" : "Program created");
      setShowForm(false);
      setForm(emptyForm);
      fetchPrograms();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not save program");
    } finally { setSaving(false); }
  };

  const deleteProgram = async (program) => {
    if (!window.confirm(`Delete ${program.name}?`)) return;
    try {
      await api.delete(`/admin/programs/${program._id}`);
      toast.success("Program deleted");
      fetchPrograms();
    } catch (error) { toast.error(error.response?.data?.message || "Could not delete program"); }
  };

  return (
    <DashboardLayout title="Programs">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div><p className="text-sm text-slate-500 dark:text-slate-300">Manage the programs shown on the public Programs page.</p></div>
        <button type="button" onClick={openCreate} className="btn-primary flex items-center gap-2"><FaPlus /> Add Program</button>
      </div>

      {showForm && <form onSubmit={handleSubmit} className="admin-form-panel card mb-6 grid gap-4 md:grid-cols-2">
        <h2 className="md:col-span-2 font-display font-bold text-xl text-navy dark:text-white">{editing ? "Edit Program" : "Create Program"}</h2>
        <label className="admin-form-field"><span>Program name</span><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Class 10 Board Support" /></label>
        <label className="admin-form-field"><span>Level / class</span><input value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} placeholder="e.g. Class 10" /></label>
        <label className="admin-form-field"><span>Badge</span><input value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} placeholder="e.g. Board Focus" /></label>
        <label className="admin-form-field"><span>Monthly fee (optional)</span><input type="number" min="0" value={form.monthlyFee || ""} onChange={(e) => setForm({ ...form, monthlyFee: e.target.value })} /></label>
        <label className="admin-form-field md:col-span-2"><span>Description</span><textarea required rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe this program" /></label>
        <label className="admin-form-field md:col-span-2"><span>Key features, comma separated</span><input value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} placeholder="Concept clarity, Weekly practice, Doubt support" /></label>
        <label className="admin-form-field"><span>Program picture</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setForm({ ...form, image: e.target.files?.[0] || null })} /></label>
        <label className="admin-form-field"><span>Or image URL</span><input value={form.imageUrl || ""} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." /></label>
        <div className="md:col-span-2 flex gap-3"><button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : "Save Program"}</button><button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button></div>
      </form>}

      {loading ? <p className="text-slate-500">Loading programs...</p> : programs.length === 0 ? <div className="card"><p className="text-slate-500">No programs yet. Add the first program to publish it on the public website.</p></div> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{programs.map((program) => <article key={program._id} className="admin-program-card card overflow-hidden">{program.imageUrl ? <img src={program.imageUrl} alt="" className="h-40 w-full object-cover" /> : <div className="h-40 flex items-center justify-center bg-slate-100 dark:bg-navy-lighter text-slate-400"><FaImage className="text-3xl" /></div>}<div className="p-5"><span className="text-xs font-semibold uppercase tracking-wide text-gold">{program.badge}</span><h3 className="font-display font-bold text-lg text-navy dark:text-white mt-1">{program.name}</h3><p className="text-sm text-slate-500 dark:text-slate-300 mt-2">{program.description}</p><div className="flex gap-2 mt-4"><button type="button" onClick={() => openEdit(program)} className="mini-action"><FaEdit /> Edit</button><button type="button" onClick={() => deleteProgram(program)} className="mini-action text-red-500"><FaTrash /> Delete</button></div></div></article>)}</div>}
    </DashboardLayout>
  );
};

export default ProgramManagement;
