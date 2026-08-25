import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

// `role` is one of "super_admin" | "admin" | "teacher" | "student" throughout the app.
// Admin and Teacher accounts both log in via the same staff endpoint;
// the backend tells us which one they are via `data.role`. Super Admin
// uses a completely separate login endpoint (see loginSuperAdmin below).
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("nga_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [role, setRole] = useState(() => localStorage.getItem("nga_role") || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("nga_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((res) => {
        setUser(res.data.data);
        setRole(res.data.role);
      })
      .catch(() => {
        localStorage.removeItem("nga_token");
        localStorage.removeItem("nga_user");
        localStorage.removeItem("nga_role");
        setUser(null);
        setRole(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // Used for Admin and Teacher. `academyId`, when provided (from the
  // /academy-login flow), is verified server-side against the account's
  // own stored academyId — never trusted on its own.
  const loginStaff = async (email, password, academyId = null) => {
    const res = await api.post("/auth/teacher/login", { email, password, academyId });
    const data = res.data.data;
    localStorage.setItem("nga_token", data.token);
    localStorage.setItem("nga_user", JSON.stringify(data));
    localStorage.setItem("nga_role", data.role); // "admin" | "teacher"
    setUser(data);
    setRole(data.role);
    return data;
  };

  // Deliberately a separate endpoint from loginStaff — Super Admin never
  // shares a login path with academy-branded pages.
  const loginSuperAdmin = async (email, password) => {
    const res = await api.post("/auth/super-admin/login", { email, password });
    const data = res.data.data;
    localStorage.setItem("nga_token", data.token);
    localStorage.setItem("nga_user", JSON.stringify(data));
    localStorage.setItem("nga_role", "super_admin");
    setUser(data);
    setRole("super_admin");
    return data;
  };

  const loginStudent = async (studentId, password, academyId = null) => {
    const res = await api.post("/auth/student/login", { studentId, password, academyId });
    const data = res.data.data;
    localStorage.setItem("nga_token", data.token);
    localStorage.setItem("nga_user", JSON.stringify(data));
    localStorage.setItem("nga_role", "student");
    setUser(data);
    setRole("student");
    return data;
  };

  const logout = () => {
    localStorage.removeItem("nga_token");
    localStorage.removeItem("nga_user");
    localStorage.removeItem("nga_role");
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, loginStaff, loginSuperAdmin, loginStudent, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
