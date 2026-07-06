import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("nga_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [role, setRole] = useState(() => localStorage.getItem("nga_role") || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Optionally re-validate the session on first load
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
        setUser(null);
        setRole(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const loginTeacher = async (email, password) => {
    const res = await api.post("/auth/teacher/login", { email, password });
    const data = res.data.data;
    localStorage.setItem("nga_token", data.token);
    localStorage.setItem("nga_user", JSON.stringify(data));
    localStorage.setItem("nga_role", "teacher");
    setUser(data);
    setRole("teacher");
    return data;
  };

  const loginStudent = async (studentId, password) => {
    const res = await api.post("/auth/student/login", { studentId, password });
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
    <AuthContext.Provider
      value={{ user, role, loading, loginTeacher, loginStudent, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
