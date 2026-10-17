import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaUserTie, FaUserGraduate, FaLock, FaUser } from "react-icons/fa";
import PublicLayout, { LogoMark } from "../../components/PublicLayout";
import { useAuth } from "../../context/AuthContext";
import { PLATFORM_NAME } from "../../config/branding";

const AcademyLogin = () => {
  const [mode, setMode] = useState("staff");
  const [email, setEmail] = useState("");
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { loginStaff, loginStudent } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "staff") {
        const data = await loginStaff(email, password);
        navigate(data.role === "admin" ? "/admin/dashboard" : "/teacher/dashboard");
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
    <PublicLayout>
      <div className="portal-login-wrapper">
        <div className="portal-login-shell">
          <div className="portal-brand-row">
            <div className="portal-brand">
              <LogoMark className="portal-logo" />
              <div>
                <h1>{PLATFORM_NAME}</h1>
                <span>Learn Today. Lead Tomorrow.</span>
              </div>
            </div>
          </div>

          <div className="portal-login-card">
            <div className="portal-header-block">
              <h2>Academy Portal</h2>
              <p>CONCEPT CLARITY + SUCCESS THROUGH DISCIPLINE</p>
            </div>

            <div className="portal-mode-tabs">
              <button
                type="button"
                className={mode === "student" ? "portal-tab active" : "portal-tab"}
                onClick={() => setMode("student")}
              >
                <FaUserGraduate /> Student
              </button>
              <button
                type="button"
                className={mode === "staff" ? "portal-tab active" : "portal-tab"}
                onClick={() => setMode("staff")}
              >
                <FaUserTie /> Admin
              </button>
            </div>

            <form onSubmit={handleSubmit} className="portal-login-form">
              <p className="portal-academy-context">{PLATFORM_NAME}</p>

              {mode === "student" ? (
                <div className="field-block">
                  <label className="field-label">Student ID</label>
                  <div className="input-with-icon">
                    <FaUser />
                    <input type="text" value={studentId} onChange={(e) => setStudentId(e.target.value)} required placeholder="Enter student ID" />
                  </div>
                </div>
              ) : (
                <div className="field-block">
                  <label className="field-label">Username / ID</label>
                  <div className="input-with-icon">
                    <FaUser />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Enter email" />
                  </div>
                </div>
              )}

              <div className="field-block">
                <label className="field-label">Password</label>
                <div className="input-with-icon">
                  <FaLock />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Enter password" />
                </div>
              </div>

              <button type="submit" className="portal-submit-button" disabled={loading}>
                {loading ? "Signing in..." : "Login to Dashboard"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default AcademyLogin;
