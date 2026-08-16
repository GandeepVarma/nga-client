import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaWhatsapp, FaCheckCircle, FaTimesCircle, FaPaperPlane } from "react-icons/fa";
import DashboardLayout from "../components/DashboardLayout";
import api from "../api/axios";

const WhatsAppSettings = () => {
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState({ phoneNumberId: "", accessToken: "", webhookVerifyToken: "", businessAccountName: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testNumber, setTestNumber] = useState("");
  const [testing, setTesting] = useState(false);

  const fetchSettings = () => {
    setLoading(true);
    api
      .get("/whatsapp/settings")
      .then((res) => {
        setSettings(res.data.data);
        setForm((f) => ({
          ...f,
          phoneNumberId: res.data.data.phoneNumberId || "",
          businessAccountName: res.data.data.businessAccountName || "",
        }));
      })
      .catch(() => toast.error("Could not load WhatsApp settings"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { phoneNumberId: form.phoneNumberId, businessAccountName: form.businessAccountName };
      if (form.accessToken) payload.accessToken = form.accessToken;
      if (form.webhookVerifyToken) payload.webhookVerifyToken = form.webhookVerifyToken;
      await api.put("/whatsapp/settings", payload);
      toast.success("Settings saved");
      setForm((f) => ({ ...f, accessToken: "", webhookVerifyToken: "" }));
      fetchSettings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleNotification = async (key) => {
    try {
      await api.put("/whatsapp/settings", {
        notificationsEnabled: { [key]: !settings.notificationsEnabled[key] },
      });
      fetchSettings();
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleTest = async (e) => {
    e.preventDefault();
    setTesting(true);
    try {
      const res = await api.post("/whatsapp/settings/test", { to: testNumber });
      if (res.data.success) toast.success("Test message sent successfully!");
      else toast.error(res.data.data?.errorMessage || "Test message failed");
      fetchSettings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Test failed");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="WhatsApp Integration">
        <div className="card h-40 animate-pulse bg-slate-100 dark:bg-navy-lighter" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="WhatsApp Integration">
      <div className="card mb-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center text-xl">
          <FaWhatsapp />
        </div>
        <div className="flex-1">
          <p className="font-display font-semibold text-navy dark:text-white">Connection Status</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {settings.lastTestedAt ? `Last tested: ${new Date(settings.lastTestedAt).toLocaleString()}` : "Never tested yet"}
          </p>
        </div>
        {settings.connected ? (
          <span className="badge bg-emerald-100 text-emerald-700 flex items-center gap-1"><FaCheckCircle /> Connected</span>
        ) : (
          <span className="badge bg-red-100 text-red-700 flex items-center gap-1"><FaTimesCircle /> Not Connected</span>
        )}
      </div>

      <div className="card mb-6">
        <h3 className="font-display font-semibold text-navy dark:text-white mb-4">Meta WhatsApp Cloud API Credentials</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Get these from your app in{" "}
          <a href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">
            Meta for Developers
          </a>{" "}
          under WhatsApp &gt; API Setup.
        </p>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Business Account Name</label>
            <input className="input-field" value={form.businessAccountName} onChange={(e) => setForm({ ...form, businessAccountName: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">WhatsApp Business Phone Number ID</label>
            <input className="input-field" value={form.phoneNumberId} onChange={(e) => setForm({ ...form, phoneNumberId: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">
              Meta Access Token {settings.accessTokenSet && <span className="text-emerald-500 text-xs">(already set — leave blank to keep it)</span>}
            </label>
            <input type="password" className="input-field" placeholder={settings.accessTokenSet ? "••••••••••••" : ""} value={form.accessToken} onChange={(e) => setForm({ ...form, accessToken: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">
              Webhook Verify Token {settings.webhookVerifyTokenSet && <span className="text-emerald-500 text-xs">(already set — leave blank to keep it)</span>}
            </label>
            <input type="password" className="input-field" placeholder={settings.webhookVerifyTokenSet ? "••••••••••••" : ""} value={form.webhookVerifyToken} onChange={(e) => setForm({ ...form, webhookVerifyToken: e.target.value })} />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : "Save Credentials"}</button>
          </div>
        </form>
      </div>

      <div className="card mb-6">
        <h3 className="font-display font-semibold text-navy dark:text-white mb-4">Send Test Message</h3>
        <form onSubmit={handleTest} className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium block mb-1">WhatsApp Number (with country code)</label>
            <input className="input-field" placeholder="919876543210" required value={testNumber} onChange={(e) => setTestNumber(e.target.value)} />
          </div>
          <button type="submit" disabled={testing} className="btn-secondary flex items-center gap-2"><FaPaperPlane /> {testing ? "Sending..." : "Send Test"}</button>
        </form>
      </div>

      <div className="card">
        <h3 className="font-display font-semibold text-navy dark:text-white mb-4">Notification Types</h3>
        <div className="space-y-3">
          {Object.entries({
            feeReminder: "Fee Reminders",
            attendanceAlert: "Attendance Alerts",
            testAnnouncement: "Test Announcements",
            resultNotification: "Result Notifications",
            homeworkReminder: "Homework Reminders",
          }).map(([key, label]) => (
            <label key={key} className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-navy-lighter/50 last:border-0">
              <span className="text-sm text-navy dark:text-white">{label}</span>
              <input type="checkbox" checked={settings.notificationsEnabled[key]} onChange={() => toggleNotification(key)} />
            </label>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default WhatsAppSettings;
