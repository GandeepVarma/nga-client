import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaSave } from "react-icons/fa";
import DashboardLayout from "../components/DashboardLayout";
import api from "../api/axios";

const emptyStory = { heading: "WHERE LEARNING BECOMES UNDERSTANDING", intro: "", story: "", vision: "", mission: "", leaderName: "", leaderRole: "Principal / Mentor", leaderPhotoUrl: "", leaderPhoto: null };

const StoryManagement = () => {
  const [form, setForm] = useState(emptyStory);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/admin/story").then((response) => {
      if (response.data.data) setForm({ ...emptyStory, ...response.data.data, leaderPhoto: null });
    }).catch((error) => toast.error(error.response?.data?.message || "Could not load story")).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key !== "leaderPhoto" && value !== undefined && value !== null) payload.append(key, value);
      });
      if (form.leaderPhoto) payload.append("leaderPhoto", form.leaderPhoto);
      const response = await api.put("/admin/story", payload);
      setForm({ ...emptyStory, ...response.data.data, leaderPhoto: null });
      toast.success("Our Story updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not save story");
    } finally { setSaving(false); }
  };

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <DashboardLayout title="Our Story">
      <div className="max-w-5xl">
        <div className="mb-6"><h2 className="font-display font-bold text-2xl text-navy dark:text-white">Edit Our Story</h2><p className="text-sm text-slate-500 dark:text-slate-300 mt-1">This content appears on the public Our Story page for your academy.</p></div>
        {loading ? <p className="text-slate-500">Loading story...</p> : <form onSubmit={handleSubmit} className="admin-form-panel card grid gap-4 md:grid-cols-2">
          <label className="admin-form-field md:col-span-2"><span>Page heading</span><input value={form.heading} onChange={(e) => update("heading", e.target.value)} /></label>
          <label className="admin-form-field md:col-span-2"><span>Intro paragraph</span><textarea rows="4" value={form.intro} onChange={(e) => update("intro", e.target.value)} placeholder="How the academy began and what it believes." /></label>
          <label className="admin-form-field md:col-span-2"><span>Our story</span><textarea rows="6" value={form.story} onChange={(e) => update("story", e.target.value)} placeholder="Share the academy story, teaching approach and journey." /></label>
          <label className="admin-form-field"><span>Vision</span><textarea rows="4" value={form.vision} onChange={(e) => update("vision", e.target.value)} placeholder="The future you want to create for students." /></label>
          <label className="admin-form-field"><span>Mission</span><textarea rows="4" value={form.mission} onChange={(e) => update("mission", e.target.value)} placeholder="How your academy supports students every day." /></label>
          <label className="admin-form-field"><span>Principal / mentor name</span><input value={form.leaderName} onChange={(e) => update("leaderName", e.target.value)} placeholder="Optional" /></label>
          <label className="admin-form-field"><span>Role</span><input value={form.leaderRole} onChange={(e) => update("leaderRole", e.target.value)} /></label>
          <label className="admin-form-field"><span>Principal / mentor photo</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => update("leaderPhoto", e.target.files?.[0] || null)} /></label>
          <label className="admin-form-field"><span>Or photo URL</span><input value={form.leaderPhotoUrl || ""} onChange={(e) => update("leaderPhotoUrl", e.target.value)} placeholder="https://..." /></label>
          <div className="md:col-span-2 flex items-center gap-3">{form.leaderPhotoUrl && <img src={form.leaderPhotoUrl} alt="Current principal or mentor" className="h-14 w-14 rounded-full object-cover" />}<button type="submit" disabled={saving} className="btn-primary flex items-center gap-2"><FaSave /> {saving ? "Saving..." : "Save Story"}</button></div>
        </form>}
      </div>
    </DashboardLayout>
  );
};

export default StoryManagement;
