import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaPlus, FaTrash, FaCopy, FaArrowUp, FaArrowDown, FaSave } from "react-icons/fa";
import DashboardLayout from "../components/DashboardLayout";
import api from "../api/axios";

const emptyQuestion = () => ({
  questionText: "",
  options: ["", "", "", ""],
  correctOption: 0,
  marks: 1,
  explanation: "",
});

const toLocalInput = (iso) => (iso ? new Date(iso).toISOString().slice(0, 16) : "");

const OnlineTestBuilder = ({ basePath = "/teacher" }) => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    subject: "",
    classes: "",
    duration: 30,
    instructions: "",
    startTime: "",
    endTime: "",
    negativeMarking: 0,
    randomizeQuestions: false,
    showResults: true,
    allowReview: true,
    passPercentage: 40,
  });
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    api
      .get(`/online-tests/${id}`)
      .then((res) => {
        const t = res.data.data;
        setForm({
          title: t.title,
          subject: t.subject,
          classes: t.classes.join(", "),
          duration: t.duration,
          instructions: t.instructions,
          startTime: toLocalInput(t.startTime),
          endTime: toLocalInput(t.endTime),
          negativeMarking: t.negativeMarking,
          randomizeQuestions: t.randomizeQuestions,
          showResults: t.showResults,
          allowReview: t.allowReview,
          passPercentage: t.passPercentage,
        });
        setQuestions(t.questions.length > 0 ? t.questions : [emptyQuestion()]);
      })
      .catch(() => toast.error("Could not load test"))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const totalMarks = questions.reduce((sum, q) => sum + Number(q.marks || 0), 0);

  const updateQuestion = (index, field, value) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, [field]: value } : q)));
  };

  const updateOption = (qIndex, optIndex, value) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qIndex ? { ...q, options: q.options.map((o, oi) => (oi === optIndex ? value : o)) } : q))
    );
  };

  const addQuestion = () => setQuestions((prev) => [...prev, emptyQuestion()]);
  const duplicateQuestion = (index) => setQuestions((prev) => [...prev.slice(0, index + 1), { ...prev[index] }, ...prev.slice(index + 1)]);
  const deleteQuestion = (index) => setQuestions((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  const moveQuestion = (index, dir) => {
    setQuestions((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    for (const q of questions) {
      if (!q.questionText.trim() || q.options.some((o) => !o.trim())) {
        toast.error("Every question needs text and all 4 options filled in");
        return;
      }
    }
    if (new Date(form.endTime) <= new Date(form.startTime)) {
      toast.error("End time must be after start time");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        classes: form.classes.split(",").map((c) => c.trim()).filter(Boolean),
        duration: Number(form.duration),
        negativeMarking: Number(form.negativeMarking),
        passPercentage: Number(form.passPercentage),
        questions: questions.map((q) => ({ ...q, marks: Number(q.marks) })),
      };

      if (isEdit) {
        await api.put(`/online-tests/${id}`, payload);
        toast.success("Test updated");
      } else {
        await api.post("/online-tests", payload);
        toast.success("Test created as a draft — publish it when ready");
      }
      navigate(`${basePath}/online-tests`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Test Builder">
        <div className="card h-40 animate-pulse bg-slate-100 dark:bg-navy-lighter" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={isEdit ? "Edit MCQ Test" : "Create MCQ Test"}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card space-y-4">
          <h3 className="font-display font-semibold text-navy dark:text-white">Test Settings</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="text-sm font-medium block mb-1">Test Title</label><input className="input-field" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><label className="text-sm font-medium block mb-1">Subject</label><input className="input-field" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Classes / Batches (comma-separated)</label>
            <input className="input-field" required placeholder="e.g. Class 10, Class 10 - Morning Batch" value={form.classes} onChange={(e) => setForm({ ...form, classes: e.target.value })} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className="text-sm font-medium block mb-1">Duration (minutes)</label><input type="number" min="1" className="input-field" required value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></div>
            <div><label className="text-sm font-medium block mb-1">Negative Marking (per wrong)</label><input type="number" min="0" step="0.25" className="input-field" value={form.negativeMarking} onChange={(e) => setForm({ ...form, negativeMarking: e.target.value })} /></div>
            <div><label className="text-sm font-medium block mb-1">Pass Percentage</label><input type="number" min="0" max="100" className="input-field" value={form.passPercentage} onChange={(e) => setForm({ ...form, passPercentage: e.target.value })} /></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="text-sm font-medium block mb-1">Start Date & Time</label><input type="datetime-local" className="input-field" required value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></div>
            <div><label className="text-sm font-medium block mb-1">End Date & Time</label><input type="datetime-local" className="input-field" required value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /></div>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Instructions</label>
            <textarea className="input-field" rows={3} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
          </div>

          <div className="flex flex-wrap gap-6 pt-1">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.randomizeQuestions} onChange={(e) => setForm({ ...form, randomizeQuestions: e.target.checked })} /> Randomize question order</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.showResults} onChange={(e) => setForm({ ...form, showResults: e.target.checked })} /> Show results immediately</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.allowReview} onChange={(e) => setForm({ ...form, allowReview: e.target.checked })} /> Allow answer review</label>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-navy dark:text-white">
            Questions <span className="text-slate-400 font-normal text-sm">({questions.length} questions, {totalMarks} total marks)</span>
          </h3>
          <button type="button" onClick={addQuestion} className="btn-secondary flex items-center gap-2 text-sm"><FaPlus /> Add Question</button>
        </div>

        {questions.map((q, i) => (
          <div key={i} className="card space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-navy dark:text-white">Question {i + 1}</span>
              <div className="flex items-center gap-3 text-slate-400">
                <button type="button" onClick={() => moveQuestion(i, -1)} title="Move up"><FaArrowUp className="hover:text-navy dark:hover:text-white" /></button>
                <button type="button" onClick={() => moveQuestion(i, 1)} title="Move down"><FaArrowDown className="hover:text-navy dark:hover:text-white" /></button>
                <button type="button" onClick={() => duplicateQuestion(i)} title="Duplicate"><FaCopy className="hover:text-gold" /></button>
                <button type="button" onClick={() => deleteQuestion(i)} title="Delete"><FaTrash className="hover:text-red-500" /></button>
              </div>
            </div>

            <textarea className="input-field" rows={2} placeholder="Question text" required value={q.questionText} onChange={(e) => updateQuestion(i, "questionText", e.target.value)} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {q.options.map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <input type="radio" name={`correct-${i}`} checked={q.correctOption === oi} onChange={() => updateQuestion(i, "correctOption", oi)} title="Mark as correct answer" />
                  <input className="input-field" required placeholder={`Option ${String.fromCharCode(65 + oi)}`} value={opt} onChange={(e) => updateOption(i, oi, e.target.value)} />
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400">Select the radio button next to the correct option.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="text-sm font-medium block mb-1">Marks</label><input type="number" min="0.5" step="0.5" className="input-field" value={q.marks} onChange={(e) => updateQuestion(i, "marks", e.target.value)} /></div>
              <div><label className="text-sm font-medium block mb-1">Explanation (optional)</label><input className="input-field" value={q.explanation} onChange={(e) => updateQuestion(i, "explanation", e.target.value)} /></div>
            </div>
          </div>
        ))}

        <div className="flex justify-end gap-3 pb-8">
          <button type="button" className="btn-outline" onClick={() => navigate(`${basePath}/online-tests`)}>Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2"><FaSave /> {saving ? "Saving..." : "Save Test"}</button>
        </div>
      </form>
    </DashboardLayout>
  );
};

export default OnlineTestBuilder;
