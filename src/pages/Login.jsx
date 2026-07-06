import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaGraduationCap, FaUserTie, FaUserGraduate } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [mode, setMode] = useState("teacher"); // "teacher" | "student"
  const [email, setEmail] = useState("");
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { loginTeacher, loginStudent } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "teacher") {
        await loginTeacher(email, password);
        navigate("/teacher/dashboard");
      } else {
        await loginStudent(studentId, password);
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
    <div className="min-h-screen flex bg-navy">
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-14 relative overflow-hidden bg-navy">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, #F59E0B 1.5px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gold flex items-center justify-center">
            <FaGraduationCap className="text-navy text-xl" />
          </div>
          <span className="font-display font-bold text-white text-lg tracking-tight">
            NextGen Learning Academy
          </span>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="font-display text-5xl font-bold text-white leading-tight mb-4">
            Learn Today.
            <br />
            <span className="text-gold">Lead Tomorrow.</span>
          </h1>
          <p className="text-slate-400 leading-relaxed">
            A single place for teachers and students to track tests,
            assignments, fees, and attendance — built around Mathematics
            coaching, made to grow with every subject after.
          </p>
        </div>

        <p className="relative z-10 text-slate-500 text-sm">
          Founded by Gandeep Varma Ganaraju
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 dark:bg-navy">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-gold flex items-center justify-center">
              <FaGraduationCap className="text-navy text-lg" />
            </div>
            <span className="font-display font-bold text-navy dark:text-white text-lg">
              NextGen Learning Academy
            </span>
          </div>

          <div className="bg-white dark:bg-navy-light rounded-xl2 shadow-card p-8">
            <h2 className="font-display text-2xl font-bold text-navy dark:text-white mb-1">
              Sign in
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              Choose your role to continue
            </p>

            <div className="grid grid-cols-2 gap-2 mb-6 p-1 bg-slate-100 dark:bg-navy rounded-lg">
              <button
                type="button"
                onClick={() => setMode("teacher")}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-semibold transition-colors ${
                  mode === "teacher"
                    ? "bg-white dark:bg-navy-lighter text-navy dark:text-white shadow"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                <FaUserTie /> Teacher
              </button>
              <button
                type="button"
                onClick={() => setMode("student")}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-semibold transition-colors ${
                  mode === "student"
                    ? "bg-white dark:bg-navy-lighter text-navy dark:text-white shadow"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                <FaUserGraduate /> Student
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "teacher" ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    className="input-field"
                    placeholder="you@nextgenacademy.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Student ID
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="e.g. NGA001"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  className="input-field"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>
          </div>

          <p className="text-center text-slate-400 text-xs mt-6">
            NextGen Learning Academy &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
