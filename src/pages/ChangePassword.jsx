import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaEye, FaEyeSlash, FaKey } from "react-icons/fa";
import DashboardLayout from "../components/DashboardLayout";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const requirements = [
  "Minimum 8 characters",
  "At least one uppercase letter",
  "At least one lowercase letter",
  "At least one number",
];

const ChangePassword = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [visible, setVisible] = useState({ currentPassword: false, newPassword: false, confirmPassword: false });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = form;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All password fields are required");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation must match");
      return;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(newPassword)) {
      setError("New password does not meet the requirements");
      return;
    }
    if (newPassword === currentPassword) {
      setError("New password must be different from the current password");
      return;
    }

    setSaving(true);
    try {
      await api.put("/auth/change-password", { currentPassword, newPassword });
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Password changed successfully.");
      logout();
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to change password");
    } finally {
      setSaving(false);
    }
  };

  const passwordField = (field, label, autoComplete) => (
    <div>
      <label className="text-sm font-medium block mb-1" htmlFor={field}>{label}</label>
      <div className="relative">
        <input
          id={field}
          type={visible[field] ? "text" : "password"}
          autoComplete={autoComplete}
          className="input-field pr-11"
          value={form[field]}
          onChange={(event) => updateField(field, event.target.value)}
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy dark:hover:text-white"
          onClick={() => setVisible((current) => ({ ...current, [field]: !current[field] }))}
          aria-label={`${visible[field] ? "Hide" : "Show"} ${label.toLowerCase()}`}
        >
          {visible[field] ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>
    </div>
  );

  return (
    <DashboardLayout title="Change Password">
      <div className="max-w-xl">
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-gold/20 text-gold-dark flex items-center justify-center text-lg"><FaKey /></div>
            <div>
              <h2 className="font-display font-semibold text-xl text-navy dark:text-white">Change Password</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Update the password for your account.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {passwordField("currentPassword", "Current Password", "current-password")}
            {passwordField("newPassword", "New Password", "new-password")}
            {passwordField("confirmPassword", "Confirm New Password", "new-password")}

            <div className="rounded-lg bg-slate-50 dark:bg-navy-lighter/50 p-4 text-sm text-slate-600 dark:text-slate-300">
              <p className="font-medium mb-2">Password must contain:</p>
              <ul className="space-y-1 list-disc list-inside">
                {requirements.map((requirement) => <li key={requirement}>{requirement}</li>)}
              </ul>
            </div>

            {error && <p className="text-sm text-red-500" role="alert">{error}</p>}
            <div className="flex justify-end">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? "Changing..." : "Change Password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ChangePassword;
