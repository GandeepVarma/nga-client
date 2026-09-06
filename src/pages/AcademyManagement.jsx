import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FaPlus, FaSearch, FaEye, FaEdit, FaTrash } from "react-icons/fa";
import DashboardLayout from "../components/DashboardLayout";
import api from "../api/axios";

const statusStyle = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-blue-100 text-blue-700",
  REJECTED: "bg-red-100 text-red-700",
  SUSPENDED: "bg-slate-200 text-slate-600",
};

// Which action buttons make sense from each current status
const actionsFor = (status) => {
  if (status === "PENDING") return [{ to: "APPROVED", label: "Approve" }, { to: "REJECTED", label: "Reject" }];
  if (status === "APPROVED") return [{ to: "ACTIVE", label: "Activate" }, { to: "REJECTED", label: "Reject" }];
  if (status === "ACTIVE") return [{ to: "SUSPENDED", label: "Suspend" }];
  if (status === "SUSPENDED") return [{ to: "ACTIVE", label: "Reactivate" }];
  if (status === "REJECTED") return [{ to: "PENDING", label: "Reconsider" }];
  return [];
};

const AcademyManagement = () => {
  const [academies, setAcademies] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState("-createdAt");
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState(null);
  const [plans, setPlans] = useState([]);
  const [approval, setApproval] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState("");
  const limit = 15;

  useEffect(() => {
    api.get("/super-admin/plans").then((res) => setPlans(res.data.data)).catch(() => toast.error("Could not load plans"));
  }, []);

  const fetchAcademies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/super-admin/academies", {
        params: { search: search || undefined, status: statusFilter || undefined, sort, page, limit },
      });
      setAcademies(res.data.data);
      setTotal(res.data.total);
    } catch {
      toast.error("Could not load academies");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, sort, page]);

  useEffect(() => {
    const debounce = setTimeout(fetchAcademies, 300);
    return () => clearTimeout(debounce);
  }, [fetchAcademies]);

  const changeStatus = async (academy, newStatus, label) => {
    if (!confirm(`${label} "${academy.academyName}"?`)) return;
    setWorkingId(academy._id);
    try {
      await api.put(`/super-admin/academies/${academy._id}/status`, { status: newStatus });
      toast.success(`Academy ${label.toLowerCase()}d`);
      fetchAcademies();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setWorkingId(null);
    }
  };

  const openPlanDialog = (academy) => {
    setApproval(academy);
    setSelectedPlan(academy.approvedPlan?._id || academy.requestedPlan?._id || plans[0]?._id || "");
  };

  const assignPlan = async () => {
    if (!selectedPlan) return toast.error("Select a plan");
    setWorkingId(approval._id);
    try {
      await api.put(`/super-admin/academies/${approval._id}/plan`, { planId: selectedPlan });
      toast.success(approval.status === "PENDING" ? "Academy approved with selected plan" : "Academy plan updated");
      setApproval(null);
      fetchAcademies();
    } catch (err) {
      toast.error(err.response?.data?.message || "Plan update failed");
    } finally {
      setWorkingId(null);
    }
  };

  const deleteAcademy = async (academy) => {
    const confirmed = confirm(`Permanently delete ${academy.academyName}? This deletes the academy and all of its students, staff, attendance, fees, tests, submissions, questions, assignments, notifications, and settings. This cannot be undone.`);
    if (!confirmed) return;
    if (prompt(`Type DELETE to permanently delete ${academy.academyName}.`) !== "DELETE") return;
    setWorkingId(academy._id);
    try {
      await api.delete(`/super-admin/academies/${academy._id}`);
      toast.success("Academy and tenant data deleted");
      fetchAcademies();
    } catch (err) {
      toast.error(err.response?.data?.message || "Deletion failed");
    } finally {
      setWorkingId(null);
    }
  };

  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return (
    <DashboardLayout title="Academies">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex flex-wrap gap-3 flex-1">
          <div className="relative max-w-sm flex-1 min-w-[200px]">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input className="input-field pl-9" placeholder="Search name, owner, email, ID..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="input-field max-w-[180px]" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <select className="input-field max-w-[180px]" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="-createdAt">Newest first</option>
            <option value="createdAt">Oldest first</option>
            <option value="academyName">Name (A-Z)</option>
          </select>
        </div>
        <Link to="/super-admin/academies/create" className="btn-primary flex items-center gap-2 shrink-0">
          <FaPlus /> Create Academy
        </Link>
      </div>

      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-navy-lighter">
              <th className="py-3 px-4">Academy Name</th>
              <th className="py-3 px-4">Owner</th>
              <th className="py-3 px-4">Requested Plan</th>
              <th className="py-3 px-4">Approved Plan</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Created</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
                <tr><td colSpan={7} className="text-center py-10 text-slate-400">Loading...</td></tr>
            ) : academies.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-slate-400">No academies found.</td></tr>
            ) : (
              academies.map((a) => (
                <tr key={a._id} className="border-b border-slate-50 dark:border-navy-lighter/50">
                  <td className="py-3 px-4 font-medium text-navy dark:text-white">{a.academyName} <span className="text-slate-400 font-normal text-xs">({a.academyId})</span></td>
                  <td className="py-3 px-4">{a.ownerName}<br /><span className="text-xs text-slate-400">{a.ownerEmail}</span></td>
                  <td className="py-3 px-4">{a.requestedPlan?.name || "—"}</td>
                  <td className="py-3 px-4">{a.approvedPlan?.name || "—"}</td>
                  <td className="py-3 px-4"><span className={`badge ${statusStyle[a.status]}`}>{a.subscriptionStatus || a.status}</span></td>
                  <td className="py-3 px-4">{new Date(a.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2 flex-wrap">
                      <Link to={`/super-admin/academies/${a._id}`} title="View" className="text-slate-500"><FaEye className="hover:text-blue-500" /></Link>
                      <Link to={`/super-admin/academies/${a._id}?edit=1`} title="Edit" className="text-slate-500"><FaEdit className="hover:text-gold" /></Link>
                      <button onClick={() => deleteAcademy(a)} disabled={workingId === a._id} title="Permanently delete academy" className="text-red-500 hover:text-red-700"><FaTrash /></button>
                      <button onClick={() => openPlanDialog(a)} disabled={workingId === a._id} className="text-xs px-2.5 py-1.5 rounded-lg bg-gold text-navy hover:bg-amber-400">
                        {a.status === "PENDING" ? "Approve" : "Change Plan"}
                      </button>
                      {actionsFor(a.status).filter((action) => action.to !== "APPROVED").map((action) => (
                        <button
                          key={action.to}
                          onClick={() => changeStatus(a, action.to, action.label)}
                          disabled={workingId === a._id}
                          className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-navy-lighter text-navy dark:text-white hover:bg-slate-200 dark:hover:bg-navy"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {approval && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="card w-full max-w-md">
            <h2 className="font-display font-bold text-lg text-navy dark:text-white mb-1">{approval.status === "PENDING" ? "Approve Academy" : "Change Academy Plan"}</h2>
            <p className="text-sm text-slate-500 mb-5">{approval.academyName}</p>
            {approval.status === "PENDING" && <p className="text-sm mb-1">Requested plan: <strong>{approval.requestedPlan?.name || "None"}</strong></p>}
            <label className="text-sm font-medium block mb-1">{approval.status === "PENDING" ? "Approve as" : "New plan"}</label>
            <select className="input-field mb-6" value={selectedPlan} onChange={(e) => setSelectedPlan(e.target.value)}>
              <option value="">Select a plan</option>
              {plans.map((plan) => <option key={plan._id} value={plan._id}>{plan.name}</option>)}
            </select>
            <div className="flex justify-end gap-3">
              <button className="btn-outline" onClick={() => setApproval(null)}>Cancel</button>
              <button className="btn-primary" onClick={assignPlan} disabled={workingId === approval._id}>{workingId === approval._id ? "Saving..." : approval.status === "PENDING" ? "Approve Plan" : "Save Plan"}</button>
            </div>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button key={i} onClick={() => setPage(i + 1)} className={`w-8 h-8 rounded-lg text-sm ${page === i + 1 ? "bg-gold text-navy font-semibold" : "bg-white dark:bg-navy-light text-slate-500"}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default AcademyManagement;
