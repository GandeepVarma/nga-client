import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaCopy } from "react-icons/fa";
import DashboardLayout from "../components/DashboardLayout";
import api from "../api/axios";

const emptyForm = {
  academyName: "", ownerName: "", ownerEmail: "", phone: "",
  address: "", city: "", state: "", country: "", logo: "", status: "ACTIVE", plan: "",
};

const AcademyCreate = () => {
  const [form, setForm] = useState(emptyForm);
  const [plans, setPlans] = useState([]);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState(null); // holds { academy, admin, temporaryPassword } after success
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/super-admin/plans").then((res) => setPlans(res.data.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post("/super-admin/academies", form);
      setCreated(res.data.data);
      toast.success("Academy created");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create academy");
    } finally {
      setSaving(false);
    }
  };

  const copyCredentials = () => {
    const text = `Academy: ${created.academy.academyName} (${created.academy.academyId})\nLogin email: ${created.admin.email}\nTemporary password: ${created.temporaryPassword}`;
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (created) {
    return (
      <DashboardLayout title="Academy Created">
        <div className="card max-w-lg mx-auto text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center text-2xl mx-auto mb-4">✓</div>
          <h2 className="font-display font-bold text-xl text-navy dark:text-white mb-1">{created.academy.academyName}</h2>
          <p className="text-slate-400 text-sm mb-6">Academy ID: {created.academy.academyId}</p>

          <div className="bg-slate-50 dark:bg-navy-lighter rounded-lg p-4 text-left mb-6 space-y-2">
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              Share these credentials with the academy owner directly — there is no automatic email delivery yet, and this password won't be shown again.
            </p>
            <p className="text-sm"><span className="text-slate-400">Login email:</span> <span className="font-mono text-navy dark:text-white">{created.admin.email}</span></p>
            <p className="text-sm"><span className="text-slate-400">Temporary password:</span> <span className="font-mono text-navy dark:text-white">{created.temporaryPassword}</span></p>
          </div>

          <div className="flex justify-center gap-3">
            <button onClick={copyCredentials} className="btn-outline flex items-center gap-2"><FaCopy /> Copy Credentials</button>
            <button onClick={() => navigate("/super-admin/academies")} className="btn-primary">Go to Academies</button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Create Academy">
      <form onSubmit={handleSubmit} className="card max-w-2xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="text-sm font-medium block mb-1">Academy Name</label><input className="input-field" required value={form.academyName} onChange={(e) => setForm({ ...form, academyName: e.target.value })} /></div>
          <div><label className="text-sm font-medium block mb-1">Owner Name</label><input className="input-field" required value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="text-sm font-medium block mb-1">Owner Email</label><input type="email" className="input-field" required value={form.ownerEmail} onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })} /></div>
          <div><label className="text-sm font-medium block mb-1">Phone</label><input className="input-field" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Address</label>
          <input className="input-field" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div><label className="text-sm font-medium block mb-1">City</label><input className="input-field" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
          <div><label className="text-sm font-medium block mb-1">State</label><input className="input-field" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
          <div><label className="text-sm font-medium block mb-1">Country</label><input className="input-field" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></div>
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Logo URL (optional)</label>
          <input className="input-field" placeholder="https://..." value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Plan (optional)</label>
          <select className="input-field" value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}>
            <option value="">No plan</option>
            {plans.map((p) => (
              <option key={p._id} value={p._id}>{p.name} — ₹{p.priceMonthly}/mo</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Status</label>
          <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="ACTIVE">Active (skip approval)</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>

        <p className="text-xs text-slate-400">
          An Academy Admin account will be created automatically using the Owner Email above, with a temporary password shown to you once after creation.
        </p>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-outline" onClick={() => navigate("/super-admin/academies")}>Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? "Creating..." : "Create Academy"}</button>
        </div>
      </form>
    </DashboardLayout>
  );
};

export default AcademyCreate;
