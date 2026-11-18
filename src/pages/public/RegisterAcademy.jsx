import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import PublicLayout from "../../components/PublicLayout";
import api from "../../api/axios";
import { PLATFORM_NAME } from "../../config/branding";

const RegisterAcademy = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState({
    academyName: "", ownerName: "", ownerEmail: "", phone: "",
    address: "", city: "", state: "", country: "",
    password: "",
    plan: searchParams.get("plan") || "",
    billingCycle: searchParams.get("cycle") || "monthly",
    paymentMethod: "online",
    paymentProofUrl: "",
  });
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  useEffect(() => {
    api.get("/public/plans").then((res) => setPlans(res.data.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post("/public/register-academy", form);
      setSubmitted(res.data.data);
      toast.success("Registration submitted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setSaving(false);
    }
  };

  if (submitted) {
    return (
      <PublicLayout>
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center text-3xl mx-auto mb-5">⏳</div>
          <h1 className="font-display text-2xl font-bold text-navy dark:text-white mb-2">Registration Submitted</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Academy ID <span className="font-mono font-semibold">{submitted.academyId}</span> has been created with status{" "}
            <span className="font-semibold">{submitted.status}</span>. Our team will review your registration
            {form.paymentMethod === "offline" ? " and verify your payment" : ""} shortly, then activate your academy.
            You'll be able to log in as soon as it's approved.
          </p>
          <Link to="/" className="btn-primary inline-block">Back to Home</Link>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="font-display text-2xl lg:text-3xl font-bold text-navy dark:text-white mb-1">Register Your Academy</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">Create your academy on {PLATFORM_NAME}. It goes live once we review and approve it.</p>

        <form onSubmit={handleSubmit} className="card space-y-5">
          <div>
            <h3 className="font-display font-semibold text-navy dark:text-white mb-3">Academy Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="text-sm font-medium block mb-1">Academy Name</label><input className="input-field" required value={form.academyName} onChange={(e) => setForm({ ...form, academyName: e.target.value })} /></div>
              <div><label className="text-sm font-medium block mb-1">Owner Name</label><input className="input-field" required value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} /></div>
              <div><label className="text-sm font-medium block mb-1">Owner Email</label><input type="email" className="input-field" required value={form.ownerEmail} onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })} /></div>
              <div><label className="text-sm font-medium block mb-1">Phone</label><input className="input-field" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><label className="text-sm font-medium block mb-1">Choose a Password</label><input type="password" className="input-field" required minLength={8} pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}" title="Use at least 8 characters with uppercase, lowercase, and a number" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /><p className="text-xs text-slate-500 mt-1">At least 8 characters, including uppercase, lowercase, and a number.</p></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div><label className="text-sm font-medium block mb-1">City</label><input className="input-field" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
              <div><label className="text-sm font-medium block mb-1">State</label><input className="input-field" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
              <div><label className="text-sm font-medium block mb-1">Country</label><input className="input-field" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></div>
            </div>
            <div className="mt-4">
              <label className="text-sm font-medium block mb-1">Address</label>
              <input className="input-field" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
          </div>

          <div>
            <h3 className="font-display font-semibold text-navy dark:text-white mb-3">Plan</h3>
            <select className="input-field" value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}>
              <option value="">No plan selected</option>
              {plans.map((p) => (
                <option key={p._id} value={p._id}>{p.name} — ₹{p.priceMonthly}/mo</option>
              ))}
            </select>
          </div>

          <div>
            <h3 className="font-display font-semibold text-navy dark:text-white mb-3">Payment Method</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button type="button" onClick={() => setForm({ ...form, paymentMethod: "online" })} className={`py-2.5 rounded-lg text-sm font-medium border ${form.paymentMethod === "online" ? "border-gold bg-gold/10 text-navy dark:text-white" : "border-slate-200 dark:border-navy-lighter text-slate-500"}`}>Online</button>
              <button type="button" onClick={() => setForm({ ...form, paymentMethod: "offline" })} className={`py-2.5 rounded-lg text-sm font-medium border ${form.paymentMethod === "offline" ? "border-gold bg-gold/10 text-navy dark:text-white" : "border-slate-200 dark:border-navy-lighter text-slate-500"}`}>Offline</button>
            </div>

            {form.paymentMethod === "online" && (
              <p className="text-xs text-slate-400 bg-slate-50 dark:bg-navy-lighter rounded-lg p-3">
                Online payment collection isn't wired up to a gateway yet — your registration will still be created and reviewed by our team, same as offline.
              </p>
            )}

            {form.paymentMethod === "offline" && (
              <div className="bg-slate-50 dark:bg-navy-lighter rounded-lg p-4 space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  <span className="font-medium">Bank / UPI details:</span> UPI ID <span className="font-mono">nextgenacademy@upi</span> — contact us at{" "}
                  <span className="font-mono">hello@nextgenacademy.com</span> for bank transfer details.
                </p>
                <div>
                  <label className="text-sm font-medium block mb-1">Payment Proof Link (optional)</label>
                  <input className="input-field" placeholder="Link to a screenshot of your payment" value={form.paymentProofUrl} onChange={(e) => setForm({ ...form, paymentProofUrl: e.target.value })} />
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-400">
            Your academy will show as <span className="font-semibold">PENDING</span> until our team reviews and activates it — you won't be able to log in before then.
          </p>

          <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? "Submitting..." : "Submit Registration"}</button>
        </form>
      </div>
    </PublicLayout>
  );
};

export default RegisterAcademy;
