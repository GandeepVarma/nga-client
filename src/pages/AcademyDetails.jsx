import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FaArrowLeft, FaUserGraduate, FaUserTie, FaUsers } from "react-icons/fa";
import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import api from "../api/axios";

const AcademyDetails = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(searchParams.get("edit") === "1");
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);

  const fetchData = () => {
    setLoading(true);
    api
      .get(`/super-admin/academies/${id}`)
      .then((res) => {
        setData(res.data.data);
        setForm(res.data.data.academy);
      })
      .catch(() => toast.error("Could not load academy"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/super-admin/academies/${id}`, form);
      toast.success("Academy updated");
      setEditing(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const statusStyle = {
    ACTIVE: "bg-emerald-100 text-emerald-700",
    PENDING: "bg-amber-100 text-amber-700",
    APPROVED: "bg-blue-100 text-blue-700",
    REJECTED: "bg-red-100 text-red-700",
    SUSPENDED: "bg-slate-200 text-slate-600",
  };

  const actionsFor = (status) => {
    if (status === "PENDING") return [{ to: "APPROVED", label: "Approve" }, { to: "REJECTED", label: "Reject" }];
    if (status === "APPROVED") return [{ to: "ACTIVE", label: "Activate" }, { to: "REJECTED", label: "Reject" }];
    if (status === "ACTIVE") return [{ to: "SUSPENDED", label: "Suspend" }];
    if (status === "SUSPENDED") return [{ to: "ACTIVE", label: "Reactivate" }];
    if (status === "REJECTED") return [{ to: "PENDING", label: "Reconsider" }];
    return [];
  };

  const changeStatus = async (newStatus, label) => {
    if (!confirm(`${label} "${data.academy.academyName}"? ${newStatus !== "ACTIVE" ? "Its staff will be blocked from logging in until it's ACTIVE again." : ""}`)) return;
    setToggling(true);
    try {
      await api.put(`/super-admin/academies/${id}/status`, { status: newStatus });
      toast.success(`Academy ${label.toLowerCase()}d`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setToggling(false);
    }
  };

  if (loading || !data) {
    return (
      <DashboardLayout title="Academy Details">
        <div className="card h-40 animate-pulse bg-slate-100 dark:bg-navy-lighter" />
      </DashboardLayout>
    );
  }

  const { academy, usage, adminAccount } = data;

  return (
    <DashboardLayout title="Academy Details">
      <Link to="/super-admin/academies" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-navy dark:hover:text-white mb-4">
        <FaArrowLeft /> Back to Academies
      </Link>

      <div className="card flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display font-bold text-xl text-navy dark:text-white">{academy.academyName}</h2>
          <p className="text-slate-400 text-sm">{academy.academyId} &middot; Created {new Date(academy.createdAt).toDateString()}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`badge ${statusStyle[academy.status]}`}>{academy.status}</span>
          {actionsFor(academy.status).map((action) => (
            <button key={action.to} onClick={() => changeStatus(action.to, action.label)} disabled={toggling} className="text-xs px-3 py-2 rounded-lg bg-slate-100 dark:bg-navy-lighter text-navy dark:text-white hover:bg-slate-200 dark:hover:bg-navy">
              {toggling ? "Working..." : action.label}
            </button>
          ))}
          <button onClick={() => setEditing((e) => !e)} className="btn-outline text-xs py-2">{editing ? "Cancel Edit" : "Edit"}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
        <StatCard icon={FaUserGraduate} label="Students" value={usage.students} accent="bg-blue-500/15 text-blue-500" />
        <StatCard icon={FaUserTie} label="Teachers" value={usage.teachers} accent="bg-navy/15 text-navy" />
        <StatCard icon={FaUsers} label="Parent Contacts (linked via students)" value={usage.parentContactsLinkedViaStudents} accent="bg-gold/15 text-gold" />
      </div>

      {editing ? (
        <form onSubmit={handleSave} className="card space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="text-sm font-medium block mb-1">Academy Name</label><input className="input-field" required value={form.academyName} onChange={(e) => setForm({ ...form, academyName: e.target.value })} /></div>
            <div><label className="text-sm font-medium block mb-1">Owner Name</label><input className="input-field" required value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} /></div>
          </div>
          <div><label className="text-sm font-medium block mb-1">Phone</label><input className="input-field" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><label className="text-sm font-medium block mb-1">Address</label><input className="input-field" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className="text-sm font-medium block mb-1">City</label><input className="input-field" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
            <div><label className="text-sm font-medium block mb-1">State</label><input className="input-field" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
            <div><label className="text-sm font-medium block mb-1">Country</label><input className="input-field" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></div>
          </div>
          <div><label className="text-sm font-medium block mb-1">Logo URL</label><input className="input-field" value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })} /></div>
          <p className="text-xs text-slate-400">Owner email can't be changed here — it's linked to the Academy Admin login.</p>
          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : "Save Changes"}</button>
          </div>
        </form>
      ) : (
        <div className="card grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <Info label="Owner" value={academy.ownerName} />
          <Info label="Owner Email" value={academy.ownerEmail} />
          <Info label="Phone" value={academy.phone} />
          <Info label="Address" value={academy.address || "-"} />
          <Info label="City / State" value={`${academy.city || "-"} / ${academy.state || "-"}`} />
          <Info label="Country" value={academy.country || "-"} />
          <Info label="Academy Admin Login" value={adminAccount?.email || "Not found"} />
        </div>
      )}
    </DashboardLayout>
  );
};

const Info = ({ label, value }) => (
  <div>
    <p className="text-slate-400 text-xs">{label}</p>
    <p className="font-medium text-navy dark:text-white">{value}</p>
  </div>
);

export default AcademyDetails;
