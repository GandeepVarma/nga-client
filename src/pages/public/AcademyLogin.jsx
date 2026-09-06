import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaUserTie, FaUserGraduate } from "react-icons/fa";
import PublicLayout from "../../components/PublicLayout";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { PLATFORM_NAME } from "../../config/branding";

const AcademyLogin = () => {
  const [academies, setAcademies] = useState([]);
  const [academyId, setAcademyId] = useState("");
  const [mode, setMode] = useState("staff");
  const [email, setEmail] = useState("");
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { loginStaff, loginStudent } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/public/academies").then((res) => setAcademies(res.data.data)).catch(() => toast.error("Could not load academy list"));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!academyId) {
      toast.error("Select your academy first");
      return;
    }
    setLoading(true);
    try {
      if (mode === "staff") {
        const data = await loginStaff(email, password, academyId);
        navigate(data.role === "admin" ? "/admin/dashboard" : "/teacher/dashboard");
      } else {
        await loginStudent(studentId, password, academyId);
        navigate("/student/dashboard");
      }
      toast.success("Welcome back!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="max-w-md mx-auto px-4 py-16">
        <p className="text-gold font-display font-bold tracking-wide text-center mb-2">{PLATFORM_NAME}</p>
        <h1 className="font-display text-2xl font-bold text-navy dark:text-white mb-1 text-center">Academy Login</h1>
        <p className="text-slate-500 dark:text-slate-400 text-center mb-8">Select your academy to continue</p>

        <div className="card space-y-5">
          <div>
            <label className="text-sm font-medium block mb-1.5">Select Academy</label>
            <select className="input-field" required value={academyId} onChange={(e) => setAcademyId(e.target.value)}>
              <option value="">Choose your academy...</option>
              {academies.map((a) => (
                <option key={a._id} value={a._id}>{a.academyName}</option>
              ))}
            </select>
            {academies.length === 0 && <p className="text-xs text-slate-400 mt-1">No active academies found yet.</p>}
          </div>

          {academyId && (
            <>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-navy rounded-lg">
                <button type="button" onClick={() => setMode("staff")} className={`flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-semibold transition-colors ${mode === "staff" ? "bg-white dark:bg-navy-lighter text-navy dark:text-white shadow" : "text-slate-500 dark:text-slate-400"}`}>
                  <FaUserTie /> Admin / Teacher
                </button>
                <button type="button" onClick={() => setMode("student")} className={`flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-semibold transition-colors ${mode === "student" ? "bg-white dark:bg-navy-lighter text-navy dark:text-white shadow" : "text-slate-500 dark:text-slate-400"}`}>
                  <FaUserGraduate /> Student
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "staff" ? (
                  <div>
                    <label className="text-sm font-medium block mb-1.5">Email</label>
                    <input type="email" required className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                ) : (
                  <div>
                    <label className="text-sm font-medium block mb-1.5">Student ID</label>
                    <input required className="input-field" value={studentId} onChange={(e) => setStudentId(e.target.value)} />
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium block mb-1.5">Password</label>
                  <input type="password" required className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? "Signing in..." : "Sign in"}</button>
              </form>
            </>
          )}
        </div>
      </div>
    </PublicLayout>
  );
};

export default AcademyLogin;
