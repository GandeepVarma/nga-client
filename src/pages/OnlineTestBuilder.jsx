import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaPlus, FaTrash, FaCopy, FaArrowUp, FaArrowDown, FaSave, FaPaste, FaTimes } from "react-icons/fa";
import DashboardLayout from "../components/DashboardLayout";
import MathText from "../components/MathText";
import api from "../api/axios";
import * as XLSX from "xlsx";

const emptyQuestion = () => ({
  questionText: "",
  options: ["", "", "", ""],
  correctOption: 0,
  marks: 1,
  explanation: "",
});

const toLocalInput = (iso) => (iso ? new Date(iso).toISOString().slice(0, 16) : "");

const parseBulkQuestions = (source) => {
  const lines = source.split(/\r?\n/);
  const starts = lines.reduce((result, line, index) => {
    if (/^\s*(?:#+\s*)?(?:question\s*)?\d+[.)\-:]?(?:\s+|$)/i.test(line)) result.push(index);
    return result;
  }, []);

  if (!starts.length && lines.some((line) => /^\s*[A-D][).:]\s+/i.test(line))) starts.push(0);

  return starts.map((start, position) => {
    const block = lines.slice(start, starts[position + 1] || lines.length);
    const first = block.shift().replace(/^\s*(?:#+\s*)?(?:question\s*)?\d+[.)\-:]?(?:\s+|$)/i, "").trim();
    const options = ["", "", "", ""];
    let answer = "";
    const questionLines = [];
    block.forEach((line) => {
      const cleanLine = line.replace(/^\s*\*\*/, "").replace(/\*\*\s*$/, "").trim();
      const option = cleanLine.match(/^\s*([A-D])[).:]\s*(.*)$/i);
      const answerMatch = cleanLine.match(/^(?:answer|correct answer)\s*:\s*([A-D])\b/i);
      if (option) options[option[1].toUpperCase().charCodeAt(0) - 65] = option[2].trim();
      else if (answerMatch) answer = answerMatch[1].toUpperCase();
      else if (cleanLine) questionLines.push(line.trim());
    });
    const errors = [];
    const questionText = [first, ...questionLines].filter(Boolean).join(" ").trim();
    if (!questionText) errors.push("Empty question");
    if (options.some((option) => !option)) errors.push("Missing option");
    if (!/^[A-D]$/.test(answer)) errors.push("Invalid answer");
    return {
      questionText,
      options,
      correctOption: /^[A-D]$/.test(answer) ? answer.charCodeAt(0) - 65 : 0,
      marks: 1,
      explanation: "",
      errors,
    };
  });
};

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
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [pastePreview, setPastePreview] = useState([]);
  const [showBank, setShowBank] = useState(false);
  const [bankQuestions, setBankQuestions] = useState([]);
  const [selectedBank, setSelectedBank] = useState([]);
  const [bankFilters, setBankFilters] = useState({ search: "", class: "", subject: "", chapter: "", difficulty: "" });
  const [spreadsheetRows, setSpreadsheetRows] = useState([]);
  const [showAi, setShowAi] = useState(false);
  const [aiForm, setAiForm] = useState({ class: "", subject: "", chapter: "", topic: "", count: 5, difficulty: "Medium", questionType: "MCQ", marks: 1 });
  const [aiQuestions, setAiQuestions] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [showRandom, setShowRandom] = useState(false);
  const [randomForm, setRandomForm] = useState({ class: "", subject: "", chapter: "", count: 10, easy: 0, medium: 0, hard: 0 });

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
  const openPaste = () => {
    setShowAddMenu(false);
    setPastePreview([]);
    setShowPaste(true);
  };
  const openBank = async () => {
    setShowAddMenu(false);
    setSelectedBank([]);
    setShowBank(true);
    try {
      const response = await api.get("/question-bank", { params: bankFilters });
      setBankQuestions(response.data.data);
    } catch (error) { toast.error(error.response?.data?.message || "Could not load question bank"); }
  };
  const generateAi = async () => {
    setAiLoading(true);
    try { const response = await api.post("/ai-questions/generate", aiForm); setAiQuestions(response.data.data.map((question) => ({ questionText: question.question, options: [question.optionA, question.optionB, question.optionC, question.optionD], correctOption: question.correctAnswer.charCodeAt(0) - 65, marks: question.marks, explanation: question.explanation, selected: true }))); } catch (error) { toast.error(error.response?.data?.message || "AI generation failed"); } finally { setAiLoading(false); }
  };
  const addAiQuestions = () => {
    const additions = aiQuestions.filter((question) => question.selected).map(({ selected, ...question }) => question);
    if (!additions.length) { toast.error("Select at least one generated question"); return; }
    setQuestions((prev) => (prev.length === 1 && !prev[0].questionText ? additions : [...prev, ...additions])); setShowAi(false); toast.success(`${additions.length} AI questions added to this test`);
  };
  const generateRandom = async () => {
    const distribution = [["Easy", Number(randomForm.easy)], ["Medium", Number(randomForm.medium)], ["Hard", Number(randomForm.hard)]].filter(([, count]) => count > 0);
    const total = Number(randomForm.count);
    if (distribution.length && distribution.reduce((sum, [, count]) => sum + count, 0) !== total) { toast.error("Difficulty distribution must equal total questions"); return; }
    try {
      const groups = distribution.length ? distribution : [["All", total]];
      const responses = await Promise.all(groups.map(([difficulty, count]) => api.get("/question-bank/random", { params: { class: randomForm.class, subject: randomForm.subject, chapter: randomForm.chapter, difficulty, count } })));
      const existing = new Set(questions.map((question) => question.questionText.trim()));
      const selected = new Set(existing);
      const additions = responses.flatMap((response) => response.data.data).filter((question) => { const key = question.question.trim(); if (selected.has(key)) return false; selected.add(key); return true; }).map((question) => ({ questionText: question.question, options: [question.optionA, question.optionB, question.optionC, question.optionD], correctOption: question.correctAnswer.charCodeAt(0) - 65, marks: question.marks, explanation: "" }));
      setQuestions((prev) => (prev.length === 1 && !prev[0].questionText ? additions : [...prev, ...additions])); setShowRandom(false); toast.success(`${additions.length} random questions added`);
    } catch (error) { toast.error(error.response?.data?.message || "Not enough matching questions"); }
  };
  const reloadBank = async (nextFilters = bankFilters) => {
    setBankFilters(nextFilters);
    try { setBankQuestions((await api.get("/question-bank", { params: nextFilters })).data.data); } catch (error) { toast.error("Could not filter question bank"); }
  };
  const addBankQuestions = () => {
    const existing = new Set(questions.map((question) => question.questionText.trim()));
    const additions = bankQuestions.filter((question) => selectedBank.includes(question._id) && !existing.has(question.question.trim())).map((question) => ({
      questionText: question.question,
      options: [question.optionA, question.optionB, question.optionC, question.optionD],
      correctOption: question.correctAnswer.charCodeAt(0) - 65,
      marks: question.marks,
      explanation: "",
    }));
    if (!additions.length) { toast.error("Select new questions to add"); return; }
    setQuestions((prev) => (prev.length === 1 && !prev[0].questionText ? additions : [...prev, ...additions]));
    setShowBank(false);
    toast.success(`${additions.length} questions added to this test`);
  };
  const previewPaste = () => setPastePreview(parseBulkQuestions(pasteText));
  const updatePasteText = (value) => {
    setPasteText(value);
    setPastePreview(parseBulkQuestions(value));
  };
  const updatePasteQuestion = (index, field, value) => {
    setPastePreview((prev) => prev.map((question, i) => {
      if (i !== index) return question;
      const next = { ...question, [field]: value };
      const errors = [];
      if (!next.questionText.trim()) errors.push("Empty question");
      if (next.options.some((option) => !option.trim())) errors.push("Missing option");
      if (new Set(next.options.map((option) => option.trim().toLowerCase())).size !== 4) errors.push("Duplicate option");
      next.errors = errors;
      return next;
    }));
  };
  const updatePasteOption = (questionIndex, optionIndex, value) => {
    setPastePreview((prev) => prev.map((question, index) => {
      if (index !== questionIndex) return question;
      const options = question.options.map((option, index) => index === optionIndex ? value : option);
      const errors = [];
      if (!question.questionText.trim()) errors.push("Empty question");
      if (options.some((option) => !option.trim())) errors.push("Missing option");
      if (new Set(options.map((option) => option.trim().toLowerCase())).size !== 4) errors.push("Duplicate option");
      return { ...question, options, errors };
    }));
  };
  const importPastedQuestions = () => {
    const valid = pastePreview.filter((question) => !question.errors?.length);
    if (!valid.length || valid.length !== pastePreview.length) {
      toast.error("Fix all invalid questions before importing");
      return;
    }
    setQuestions((prev) => (prev.length === 1 && !prev[0].questionText ? valid : [...prev, ...valid]));
    setShowPaste(false);
    toast.success(`${valid.length} questions added to this test`);
  };
  const readSpreadsheet = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: "" });
    const required = ["Question", "Option A", "Option B", "Option C", "Option D", "Answer"];
    setSpreadsheetRows(rows.map((row) => {
      const answer = String(row.Answer || "").trim().toUpperCase();
      const question = { questionText: String(row.Question || "").trim(), options: ["Option A", "Option B", "Option C", "Option D"].map((field) => String(row[field] || "").trim()), correctOption: /^[A-D]$/.test(answer) ? answer.charCodeAt(0) - 65 : 0, marks: Number(row.Marks || 1), explanation: "" };
      question.errors = required.filter((field) => !String(row[field] || "").trim()).map((field) => `Missing ${field}`);
      if (!/^[A-D]$/.test(answer)) question.errors.push("Invalid answer");
      if (!Number.isFinite(question.marks) || question.marks < 0.5) question.errors.push("Invalid marks");
      return question;
    }));
  };
  const importSpreadsheet = () => {
    if (!spreadsheetRows.length || spreadsheetRows.some((row) => row.errors.length)) { toast.error("Fix all invalid spreadsheet rows before importing"); return; }
    setQuestions((prev) => (prev.length === 1 && !prev[0].questionText ? spreadsheetRows : [...prev, ...spreadsheetRows]));
    setSpreadsheetRows([]); toast.success(`${spreadsheetRows.length} questions added to this test`);
  };
  const updateSpreadsheetRow = (index, field, value) => setSpreadsheetRows((prev) => prev.map((row, rowIndex) => {
    if (rowIndex !== index) return row;
    const next = { ...row, [field]: value, options: [...row.options] };
    if (field.startsWith("option")) next.options[Number(field.slice(-1))] = value;
    if (field === "correctOption") next.correctOption = Number(value);
    const errors = [];
    if (!next.questionText.trim()) errors.push("Empty question");
    if (next.options.some((option) => !option.trim())) errors.push("Missing option");
    if (!Number.isFinite(Number(next.marks)) || Number(next.marks) < 0.5) errors.push("Invalid marks");
    next.errors = errors;
    return next;
  }));
  const downloadTemplate = () => {
    const sheet = XLSX.utils.aoa_to_sheet([["Question", "Option A", "Option B", "Option C", "Option D", "Answer", "Marks", "Difficulty", "Subject", "Chapter"], ["What is 25 + 35?", "25", "50", "60", "70", "C", 1, "Easy", "Mathematics", "Addition"]]);
    const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book, sheet, "Questions"); XLSX.writeFile(book, "nextgen-question-template.xlsx");
  };
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

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="font-display font-semibold text-navy dark:text-white">
            Questions <span className="text-slate-400 font-normal text-sm">({questions.length} questions, {totalMarks} total marks)</span>
          </h3>
          <div className="relative">
            <button type="button" onClick={() => setShowAddMenu((open) => !open)} className="btn-primary flex items-center gap-2 text-sm"><FaPlus /> Add Questions</button>
            {showAddMenu && (
              <div className="absolute right-0 z-10 mt-2 w-56 card space-y-1 p-2">
                <button type="button" onClick={() => { setShowAddMenu(false); addQuestion(); }} className="w-full text-left px-3 py-2 rounded hover:bg-slate-100 dark:hover:bg-navy-lighter">Create Manually</button>
                <button type="button" onClick={openPaste} className="w-full text-left px-3 py-2 rounded hover:bg-slate-100 dark:hover:bg-navy-lighter"><FaPaste className="inline mr-2" />Paste Questions</button>
                <label className="block w-full text-left px-3 py-2 rounded hover:bg-slate-100 dark:hover:bg-navy-lighter cursor-pointer">Upload Excel / CSV<input type="file" accept=".xlsx,.csv" className="hidden" onChange={(e) => { setShowAddMenu(false); setSpreadsheetRows([]); readSpreadsheet(e); }} /></label>
                <button type="button" onClick={openBank} className="w-full text-left px-3 py-2 rounded hover:bg-slate-100 dark:hover:bg-navy-lighter">Add from Question Bank</button>
                <button type="button" onClick={() => { setShowAddMenu(false); setShowAi(true); }} className="w-full text-left px-3 py-2 rounded hover:bg-slate-100 dark:hover:bg-navy-lighter">Generate with AI</button>
              </div>
            )}
          </div>
        </div>

        <div className="card flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium">Quick Add</span>
          <button type="button" onClick={openPaste} className="btn-secondary text-sm"><FaPaste className="inline mr-2" />Paste Questions</button>
          <label className="btn-secondary text-sm cursor-pointer">Upload Excel<input type="file" accept=".xlsx,.csv" className="hidden" onChange={readSpreadsheet} /></label>
          <button type="button" onClick={openBank} className="btn-secondary text-sm">Question Bank</button>
          <button type="button" onClick={() => setShowAi(true)} className="btn-secondary text-sm">AI Generate</button>
          <button type="button" onClick={() => setShowRandom(true)} className="btn-secondary text-sm">Generate Random Test</button>
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

            <textarea className="input-field" rows={2} placeholder="Question text — wrap math in $...$, e.g. Solve $x^2+5x+6=0$" required value={q.questionText} onChange={(e) => updateQuestion(i, "questionText", e.target.value)} />
            {q.questionText.includes("$") && (
              <div className="bg-slate-50 dark:bg-navy-lighter rounded-lg px-3 py-2 text-sm text-navy dark:text-white">
                <span className="text-xs text-slate-400 mr-2">Preview:</span>
                <MathText text={q.questionText} />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {q.options.map((opt, oi) => (
                <div key={oi} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <input type="radio" name={`correct-${i}`} checked={q.correctOption === oi} onChange={() => updateQuestion(i, "correctOption", oi)} title="Mark as correct answer" />
                    <input className="input-field" required placeholder={`Option ${String.fromCharCode(65 + oi)} — e.g. $\\frac{1}{2}$`} value={opt} onChange={(e) => updateOption(i, oi, e.target.value)} />
                  </div>
                  {opt.includes("$") && (
                    <p className="text-xs text-navy dark:text-white pl-6"><MathText text={opt} /></p>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400">Select the radio button next to the correct option. Wrap any math in single $ signs for inline formulas (powers, fractions, roots, etc.) — a live preview appears once you type a $.</p>

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

      {showPaste && (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center">
          <div className="bg-white dark:bg-navy rounded-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto p-5 space-y-4">
            <div className="flex items-center justify-between"><h2 className="font-display font-semibold text-xl text-navy dark:text-white">Bulk Paste Questions</h2><button type="button" onClick={() => setShowPaste(false)} title="Close"><FaTimes /></button></div>
            <textarea className="input-field" rows={8} value={pasteText} onChange={(e) => updatePasteText(e.target.value)} placeholder={'1. What is 2345 + 1234?\nA) 3479\nB) 3579\nC) 3679\nD) 3589\nAnswer: B'} />
            <button type="button" onClick={previewPaste} disabled={!pasteText.trim()} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">Preview Questions</button>
            {!pastePreview.length && pasteText.trim() && <p className="text-sm text-red-500">No questions detected. Start each question with a number, for example: 1. Your question?</p>}
            {pastePreview.length > 0 && <>
              <p className="text-sm font-medium">{pastePreview.length} questions detected</p>
              <div className="space-y-3">
                {pastePreview.map((question, index) => (
                  <div key={index} className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between gap-3"><span className="font-medium">Question {index + 1}</span><span className={question.errors?.length ? "text-red-500 text-sm" : "text-green-600 text-sm"}>{question.errors?.length ? question.errors.join(", ") : "Valid"}</span></div>
                    <textarea className="input-field" rows={2} value={question.questionText} onChange={(e) => updatePasteQuestion(index, "questionText", e.target.value)} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{question.options.map((option, optionIndex) => <input key={optionIndex} className="input-field" value={option} placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`} onChange={(e) => updatePasteOption(index, optionIndex, e.target.value)} />)}</div>
                    <select className="input-field" value={question.correctOption} onChange={(e) => updatePasteQuestion(index, "correctOption", Number(e.target.value))}>{[0, 1, 2, 3].map((optionIndex) => <option key={optionIndex} value={optionIndex}>Correct answer: {String.fromCharCode(65 + optionIndex)}</option>)}</select>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-3"><button type="button" className="btn-outline" onClick={() => setShowPaste(false)}>Cancel</button><button type="button" className="btn-primary" onClick={importPastedQuestions}>Import Questions</button></div>
            </>}
          </div>
        </div>
      )}
      {showBank && (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center"><div className="bg-white dark:bg-navy rounded-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto p-5 space-y-4"><div className="flex items-center justify-between"><h2 className="font-display font-semibold text-xl text-navy dark:text-white">Add from Question Bank</h2><button type="button" onClick={() => setShowBank(false)} title="Close"><FaTimes /></button></div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">{["class", "subject", "chapter"].map((field) => <input key={field} className="input-field" placeholder={field[0].toUpperCase() + field.slice(1)} value={bankFilters[field]} onChange={(e) => reloadBank({ ...bankFilters, [field]: e.target.value })} />)}<select className="input-field" value={bankFilters.difficulty} onChange={(e) => reloadBank({ ...bankFilters, difficulty: e.target.value })}><option value="">All difficulty</option><option>Easy</option><option>Medium</option><option>Hard</option></select><input className="input-field" placeholder="Search" value={bankFilters.search} onChange={(e) => reloadBank({ ...bankFilters, search: e.target.value })} /></div><p className="text-sm text-slate-500">{bankQuestions.length} questions available</p><div className="space-y-2">{bankQuestions.map((question) => <label key={question._id} className="block border border-slate-200 dark:border-slate-700 rounded-lg p-3 cursor-pointer"><div className="flex gap-3"><input type="checkbox" checked={selectedBank.includes(question._id)} onChange={(e) => setSelectedBank((prev) => e.target.checked ? [...prev, question._id] : prev.filter((id) => id !== question._id))} /><div className="space-y-1"><MathText text={question.question} /><p className="text-xs text-slate-500">{question.subject} | {question.chapter} | {question.difficulty} | {question.marks} marks</p></div></div></label>)}</div><div className="flex justify-end gap-3"><button type="button" className="btn-outline" onClick={() => setShowBank(false)}>Cancel</button><button type="button" className="btn-primary" onClick={addBankQuestions}>Add Selected Questions</button></div></div></div>
      )}
      {spreadsheetRows.length > 0 && <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center"><div className="bg-white dark:bg-navy rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-5 space-y-4"><div className="flex items-center justify-between"><h2 className="font-display font-semibold text-xl text-navy dark:text-white">Review Spreadsheet Questions</h2><button type="button" onClick={() => setSpreadsheetRows([])} title="Close"><FaTimes /></button></div><button type="button" className="btn-outline" onClick={downloadTemplate}>Download Template</button><p className="text-sm">{spreadsheetRows.length} questions found, {spreadsheetRows.filter((row) => !row.errors.length).length} valid, {spreadsheetRows.filter((row) => row.errors.length).length} errors</p><div className="space-y-2">{spreadsheetRows.map((row, index) => <div key={index} className="border border-slate-200 dark:border-slate-700 rounded p-3 space-y-2"><input className="input-field" value={row.questionText} onChange={(e) => updateSpreadsheetRow(index, "questionText", e.target.value)} /> <div className="grid sm:grid-cols-2 gap-2">{row.options.map((option, optionIndex) => <input key={optionIndex} className="input-field" value={option} onChange={(e) => updateSpreadsheetRow(index, `option${optionIndex}`, e.target.value)} />)}</div><select className="input-field" value={row.correctOption} onChange={(e) => updateSpreadsheetRow(index, "correctOption", e.target.value)}>{[0, 1, 2, 3].map((optionIndex) => <option key={optionIndex} value={optionIndex}>Correct answer: {String.fromCharCode(65 + optionIndex)}</option>)}</select><span className={row.errors.length ? "text-red-500 text-sm" : "text-green-600 text-sm"}>{row.errors.length ? row.errors.join(", ") : "Valid"}</span></div>)}</div><div className="flex justify-end gap-3"><button type="button" className="btn-outline" onClick={() => setSpreadsheetRows([])}>Cancel</button><button type="button" className="btn-primary" onClick={importSpreadsheet}>Import Questions</button></div></div></div>}
      {showAi && <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center"><div className="bg-white dark:bg-navy rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-5 space-y-4"><div className="flex items-center justify-between"><h2 className="font-display font-semibold text-xl text-navy dark:text-white">Generate with AI</h2><button type="button" onClick={() => setShowAi(false)} title="Close"><FaTimes /></button></div>{!aiQuestions.length && <><div className="grid sm:grid-cols-2 gap-2">{["class", "subject", "chapter", "topic"].map((field) => <input key={field} className="input-field" placeholder={field[0].toUpperCase() + field.slice(1)} value={aiForm[field]} onChange={(e) => setAiForm({ ...aiForm, [field]: e.target.value })} />)}<input className="input-field" type="number" min="1" max="50" placeholder="Number of questions" value={aiForm.count} onChange={(e) => setAiForm({ ...aiForm, count: e.target.value })} /><select className="input-field" value={aiForm.difficulty} onChange={(e) => setAiForm({ ...aiForm, difficulty: e.target.value })}><option>Easy</option><option>Medium</option><option>Hard</option></select><input className="input-field" type="number" min="0.5" step="0.5" value={aiForm.marks} onChange={(e) => setAiForm({ ...aiForm, marks: e.target.value })} /></div><button type="button" className="btn-primary" disabled={aiLoading} onClick={generateAi}>{aiLoading ? "Generating..." : "Generate Questions"}</button></>}{aiQuestions.length > 0 && <><p className="text-sm font-medium">{aiQuestions.length} questions generated. Review before adding.</p><div className="space-y-3">{aiQuestions.map((question, index) => <div key={index} className="border border-slate-200 dark:border-slate-700 rounded p-3 space-y-2"><label className="flex gap-2 items-start"><input type="checkbox" checked={question.selected} onChange={(e) => setAiQuestions((prev) => prev.map((item, i) => i === index ? { ...item, selected: e.target.checked } : item))} /><textarea className="input-field" rows={2} value={question.questionText} onChange={(e) => setAiQuestions((prev) => prev.map((item, i) => i === index ? { ...item, questionText: e.target.value } : item))} /></label>{question.options.map((option, optionIndex) => <input key={optionIndex} className="input-field" value={option} onChange={(e) => setAiQuestions((prev) => prev.map((item, i) => i === index ? { ...item, options: item.options.map((value, oi) => oi === optionIndex ? e.target.value : value) } : item))} />)}<select className="input-field" value={question.correctOption} onChange={(e) => setAiQuestions((prev) => prev.map((item, i) => i === index ? { ...item, correctOption: Number(e.target.value) } : item))}>{[0, 1, 2, 3].map((optionIndex) => <option key={optionIndex} value={optionIndex}>Correct answer: {String.fromCharCode(65 + optionIndex)}</option>)}</select><p className="text-sm text-slate-500">{question.explanation}</p></div>)}</div><div className="flex justify-end gap-3"><button type="button" className="btn-outline" onClick={() => setAiQuestions([])}>Regenerate</button><button type="button" className="btn-primary" onClick={addAiQuestions}>Add Selected Questions</button></div></>}</div></div>}
      {showRandom && <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center"><div className="bg-white dark:bg-navy rounded-xl w-full max-w-2xl p-5 space-y-4"><div className="flex items-center justify-between"><h2 className="font-display font-semibold text-xl text-navy dark:text-white">Generate Random Test</h2><button type="button" onClick={() => setShowRandom(false)} title="Close"><FaTimes /></button></div><div className="grid sm:grid-cols-2 gap-2">{["class", "subject", "chapter"].map((field) => <input key={field} className="input-field" placeholder={field[0].toUpperCase() + field.slice(1)} value={randomForm[field]} onChange={(e) => setRandomForm({ ...randomForm, [field]: e.target.value })} />)}<input className="input-field" type="number" min="1" value={randomForm.count} onChange={(e) => setRandomForm({ ...randomForm, count: e.target.value })} /></div><p className="text-sm font-medium">Optional difficulty distribution</p><div className="grid grid-cols-3 gap-2">{[["easy", "Easy"], ["medium", "Medium"], ["hard", "Hard"]].map(([field, label]) => <label key={field} className="text-sm">{label}<input className="input-field" type="number" min="0" value={randomForm[field]} onChange={(e) => setRandomForm({ ...randomForm, [field]: e.target.value })} /></label>)}</div><div className="flex justify-end gap-3"><button type="button" className="btn-outline" onClick={() => setShowRandom(false)}>Cancel</button><button type="button" className="btn-primary" onClick={generateRandom}>Generate Test</button></div></div></div>}
    </DashboardLayout>
  );
};

export default OnlineTestBuilder;
