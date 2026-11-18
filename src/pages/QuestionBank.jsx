import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaPlus, FaTrash, FaEdit, FaCopy } from "react-icons/fa";
import DashboardLayout from "../components/DashboardLayout";
import MathText from "../components/MathText";
import api from "../api/axios";

const blank = { question: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "A", marks: 1, class: "", subject: "", chapter: "", topic: "", difficulty: "Medium" };
const PAGE_SIZE = 12;

const QuestionBank = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: "", class: "", subject: "", chapter: "", topic: "", difficulty: "" });
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/question-bank", { params: filters });
      setQuestions(response.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load question bank");
    } finally {
      setLoading(false);
    }
  }, [filters]);
  useEffect(() => {
    setPage(1);
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  const save = async (event) => {
    event.preventDefault();
    try {
      if (editing) await api.put(`/question-bank/${editing}`, form);
      else await api.post("/question-bank", form);
      toast.success(editing ? "Question updated" : "Question added");
      setForm(blank); setEditing(false); setShowForm(false); await load();
    } catch (error) { toast.error(error.response?.data?.message || "Could not save question"); }
  };
  const remove = async (id) => {
    if (!window.confirm("Delete this question?")) return;
    try {
      await api.delete(`/question-bank/${id}`);
      toast.success("Question deleted");
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not delete question");
    }
  };
  const duplicate = async (question) => {
    const { _id, createdAt, updatedAt, createdBy, academyId, ...copy } = question;
    try {
      await api.post("/question-bank", copy);
      toast.success("Question duplicated");
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not duplicate question");
    }
  };
  const totalPages = Math.max(Math.ceil(questions.length / PAGE_SIZE), 1);
  const visibleQuestions = questions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return <DashboardLayout title="Question Bank">
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap"><div><h2 className="font-display text-2xl font-semibold text-navy dark:text-white">Question Bank</h2><p className="text-sm text-slate-500">Reusable MCQs for your academy</p></div><button className="btn-primary flex items-center gap-2" onClick={() => { setForm(blank); setEditing(false); setShowForm(true); }}><FaPlus /> Add Question</button></div>
      <div className="card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3"><input className="input-field lg:col-span-2" placeholder="Search questions and topics..." aria-label="Search questions and topics" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />{["class", "subject", "chapter", "topic"].map((field) => <input key={field} className="input-field" placeholder={field[0].toUpperCase() + field.slice(1)} value={filters[field]} onChange={(e) => setFilters({ ...filters, [field]: e.target.value })} />)}<select className="input-field" value={filters.difficulty} onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}><option value="">All difficulty</option><option>Easy</option><option>Medium</option><option>Hard</option></select></div>
      {showForm && <form onSubmit={save} className="card space-y-3"><textarea className="input-field" required rows={2} placeholder="Question text; preserve $...$ math" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} /><div className="grid sm:grid-cols-2 gap-2">{["A", "B", "C", "D"].map((letter) => <input key={letter} className="input-field" required placeholder={`Option ${letter}`} value={form[`option${letter}`]} onChange={(e) => setForm({ ...form, [`option${letter}`]: e.target.value })} />)}</div><div className="grid sm:grid-cols-3 gap-2"><select className="input-field" value={form.correctAnswer} onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}>{["A", "B", "C", "D"].map((letter) => <option key={letter}>{letter}</option>)}</select><input className="input-field" placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /><input className="input-field" placeholder="Class" value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })} /></div><div className="grid sm:grid-cols-4 gap-2"><input className="input-field" placeholder="Chapter" value={form.chapter} onChange={(e) => setForm({ ...form, chapter: e.target.value })} /><input className="input-field" placeholder="Topic" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} /><select className="input-field" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}><option>Easy</option><option>Medium</option><option>Hard</option></select><input className="input-field" type="number" min="0.5" step="0.5" value={form.marks} onChange={(e) => setForm({ ...form, marks: e.target.value })} /></div><div className="flex justify-end gap-2"><button type="button" className="btn-outline" onClick={() => setShowForm(false)}>Cancel</button><button className="btn-primary">Save Question</button></div></form>}
      <div className="space-y-3">{loading ? <div className="card py-10 text-center text-slate-500">Loading question bank...</div> : visibleQuestions.map((question) => <div className="card space-y-2" key={question._id}><MathText text={question.question} /><div className="grid sm:grid-cols-2 gap-1 text-sm text-slate-600 dark:text-slate-300">{["A", "B", "C", "D"].map((letter) => <div key={letter} className={question.correctAnswer === letter ? "font-semibold text-green-600" : ""}><span className="mr-1">{letter})</span><MathText text={question[`option${letter}`]} /></div>)}</div><div className="flex flex-wrap gap-2 text-xs text-slate-500"><span>{question.class || "All classes"}</span><span>{question.subject || "No subject"}</span><span>{question.chapter || "No chapter"}</span><span>{question.topic || "No topic"}</span><span>{question.difficulty}</span><span>{question.marks} marks</span></div><div className="flex gap-3 text-slate-500"><button title="Edit" aria-label="Edit question" onClick={() => { setForm(Object.fromEntries(Object.keys(blank).map((field) => [field, question[field] ?? blank[field]]))); setEditing(question._id); setShowForm(true); }}><FaEdit /></button><button title="Duplicate" aria-label="Duplicate question" onClick={() => duplicate(question)}><FaCopy /></button><button title="Delete" aria-label="Delete question" className="text-red-500" onClick={() => remove(question._id)}><FaTrash /></button></div></div>)}{!loading && !questions.length && <div className="card text-center text-slate-500 py-10">No questions match these filters.</div>}</div>
      {!loading && totalPages > 1 && <div className="flex items-center justify-between gap-3"><p className="text-sm text-slate-500">Page {page} of {totalPages} · {questions.length} questions</p><div className="flex gap-2"><button type="button" className="btn-outline" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>Previous</button><button type="button" className="btn-outline" disabled={page === totalPages} onClick={() => setPage((current) => current + 1)}>Next</button></div></div>}
    </div>
  </DashboardLayout>;
};
export default QuestionBank;
