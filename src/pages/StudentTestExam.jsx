import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import MathText from "../components/MathText";

const TAB_SWITCH_AUTO_SUBMIT_THRESHOLD = 5;

const formatTime = (totalSeconds) => {
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
};

const StudentTestExam = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({}); // { questionId: { selectedOption, markedForReview } }
  const [current, setCurrent] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const submittedRef = useRef(false);

  // Load / resume the attempt
  useEffect(() => {
    api
      .post(`/online-tests/student/${id}/start`)
      .then((res) => {
        const { test: t, submission, remainingSeconds } = res.data.data;
        setTest(t);
        setRemaining(remainingSeconds);
        setTabSwitchCount(submission.tabSwitchCount || 0);
        const initial = {};
        submission.answers.forEach((a) => {
          initial[a.questionId] = { selectedOption: a.selectedOption, markedForReview: a.markedForReview };
        });
        setAnswers(initial);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || "Could not start test");
        navigate("/student/tests");
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const doSubmit = useCallback(
    async (auto = false) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setSubmitting(true);
      try {
        const answerPayload = Object.entries(answers).map(([questionId, a]) => ({ questionId, selectedOption: a.selectedOption }));
        await api.post(`/online-tests/student/${id}/submit`, { answers: answerPayload, autoSubmitted: auto });
        toast.success(auto ? "Time's up — test auto-submitted" : "Test submitted successfully");
        navigate(`/student/online-tests/${id}/result`);
      } catch (err) {
        toast.error(err.response?.data?.message || "Submit failed");
        submittedRef.current = false;
      } finally {
        setSubmitting(false);
      }
    },
    [answers, id, navigate]
  );

  // Countdown timer — auto-submits at 0
  useEffect(() => {
    if (loading || !test) return;
    if (remaining <= 0) {
      doSubmit(true);
      return;
    }
    const timer = setInterval(() => setRemaining((r) => Math.max(r - 1, 0)), 1000);
    return () => clearInterval(timer);
  }, [loading, test, remaining, doSubmit]);

  // Autosave every 10 seconds
  useEffect(() => {
    if (loading || !test) return;
    const interval = setInterval(() => {
      const answerPayload = Object.entries(answers).map(([questionId, a]) => ({
        questionId,
        selectedOption: a.selectedOption,
        markedForReview: a.markedForReview,
      }));
      api.post(`/online-tests/student/${id}/save`, { answers: answerPayload, tabSwitchCount }).catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [loading, test, answers, tabSwitchCount, id]);

  // Tab-switch / visibility detection
  useEffect(() => {
    if (loading || !test) return;
    const handleVisibility = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => {
          const next = prev + 1;
          if (next >= TAB_SWITCH_AUTO_SUBMIT_THRESHOLD) {
            toast.error("Too many tab switches detected — auto-submitting");
            doSubmit(true);
          } else {
            toast.error(`Tab switch detected (${next}/${TAB_SWITCH_AUTO_SUBMIT_THRESHOLD}) — this is logged`);
          }
          return next;
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [loading, test, doSubmit]);

  if (loading || !test) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-navy">
        <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const q = test.questions[current];
  const qAnswer = answers[q._id] || { selectedOption: null, markedForReview: false };

  const setAnswer = (selectedOption) => setAnswers((prev) => ({ ...prev, [q._id]: { ...prev[q._id], selectedOption } }));
  const toggleReview = () => setAnswers((prev) => ({ ...prev, [q._id]: { ...prev[q._id], markedForReview: !prev[q._id]?.markedForReview } }));
  const clearAnswer = () => setAnswers((prev) => ({ ...prev, [q._id]: { ...prev[q._id], selectedOption: null } }));

  const statusFor = (question) => {
    const a = answers[question._id];
    if (a?.markedForReview) return "review";
    if (a?.selectedOption !== null && a?.selectedOption !== undefined) return "answered";
    return "unanswered";
  };

  const answeredCount = test.questions.filter((qq) => statusFor(qq) === "answered").length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy flex flex-col">
      <header className="bg-navy text-white px-4 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-20">
        <div>
          <h1 className="font-display font-semibold">{test.title}</h1>
          <p className="text-xs text-slate-400">{answeredCount} / {test.questions.length} answered</p>
        </div>
        <div className={`font-mono text-xl font-bold px-4 py-1.5 rounded-lg ${remaining < 60 ? "bg-red-500" : "bg-gold text-navy"}`}>
          {formatTime(remaining)}
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-5 p-4 lg:p-8">
        <div className="flex-1 card">
          <p className="text-xs text-slate-400 mb-2">Question {current + 1} of {test.questions.length} &middot; {q.marks} mark(s)</p>
          <p className="text-navy dark:text-white font-medium mb-5"><MathText text={q.questionText} /></p>

          <div className="space-y-3 mb-6">
            {q.options.map((opt, i) => (
              <label
                key={i}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  qAnswer.selectedOption === i
                    ? "border-gold bg-gold/10"
                    : "border-slate-200 dark:border-navy-lighter hover:bg-slate-50 dark:hover:bg-navy-lighter"
                }`}
              >
                <input type="radio" name={`q-${q._id}`} checked={qAnswer.selectedOption === i} onChange={() => setAnswer(i)} />
                <span className="text-sm text-navy dark:text-white">{String.fromCharCode(65 + i)}. <MathText text={opt} /></span>
              </label>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setCurrent((c) => Math.max(c - 1, 0))} disabled={current === 0} className="btn-outline disabled:opacity-40">Previous</button>
            <button type="button" onClick={() => setCurrent((c) => Math.min(c + 1, test.questions.length - 1))} disabled={current === test.questions.length - 1} className="btn-outline disabled:opacity-40">Next</button>
            <button type="button" onClick={toggleReview} className="btn-outline">{qAnswer.markedForReview ? "Unmark Review" : "Mark for Review"}</button>
            <button type="button" onClick={clearAnswer} className="btn-outline">Clear Answer</button>
            <button type="button" onClick={() => setShowConfirm(true)} className="btn-primary ml-auto">Submit Test</button>
          </div>
        </div>

        <aside className="lg:w-64 card h-fit">
          <h3 className="font-display font-semibold text-navy dark:text-white mb-3 text-sm">Questions</h3>
          <div className="grid grid-cols-5 lg:grid-cols-4 gap-2 mb-4">
            {test.questions.map((qq, i) => {
              const status = statusFor(qq);
              return (
                <button
                  key={qq._id}
                  onClick={() => setCurrent(i)}
                  className={`w-9 h-9 rounded-lg text-xs font-semibold flex items-center justify-center ${
                    current === i ? "ring-2 ring-navy dark:ring-white" : ""
                  } ${
                    status === "answered" ? "bg-emerald-500 text-white" :
                    status === "review" ? "bg-amber-500 text-white" :
                    "bg-slate-200 dark:bg-navy-lighter text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
            <p><span className="inline-block w-3 h-3 rounded bg-emerald-500 mr-2" />Answered</p>
            <p><span className="inline-block w-3 h-3 rounded bg-amber-500 mr-2" />Marked for review</p>
            <p><span className="inline-block w-3 h-3 rounded bg-slate-300 mr-2" />Unanswered</p>
          </div>
        </aside>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-light rounded-xl2 shadow-card-hover w-full max-w-sm p-6">
            <h3 className="font-display font-bold text-lg text-navy dark:text-white mb-2">Submit Test?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              You've answered {answeredCount} of {test.questions.length} questions. You can't change your answers after submitting.
            </p>
            <div className="flex justify-end gap-3">
              <button className="btn-outline" onClick={() => setShowConfirm(false)}>Keep Working</button>
              <button disabled={submitting} className="btn-primary" onClick={() => doSubmit(false)}>{submitting ? "Submitting..." : "Submit Now"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentTestExam;
