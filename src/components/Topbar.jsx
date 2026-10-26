import React, { useState, useEffect } from "react";
import { FaBars, FaMoon, FaSun, FaSignOutAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Topbar = ({ onMenuClick, title }) => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => localStorage.getItem("nga_theme") === "dark");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("nga_theme", dark ? "dark" : "light");
  }, [dark]);

  const handleLogout = () => {
    logout();
    ["nga_academyId", "nga_tenantId"].forEach((key) => localStorage.removeItem(key));
    navigate("/", { replace: true });
  };

  return (
    <header className="admin-topbar h-16 flex items-center justify-between px-4 lg:px-8 bg-white dark:bg-navy-light border-b border-slate-100 dark:border-navy-lighter sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <button
          className="lg:hidden text-slate-600 dark:text-slate-300 text-xl"
          onClick={onMenuClick}
        >
          <FaBars />
        </button>
        <h1 className="dashboard-page-title font-display font-semibold text-lg">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => setDark((d) => !d)}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-100 dark:bg-navy-lighter text-slate-600 dark:text-gold-light transition-colors"
          aria-label="Toggle dark mode"
        >
          {dark ? <FaSun /> : <FaMoon />}
        </button>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gold flex items-center justify-center font-semibold text-navy text-sm">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="hidden sm:block leading-tight">
            <p className="dashboard-user-name text-sm font-semibold">{user?.name}</p>
            <p className="dashboard-user-role text-xs capitalize">{role}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="text-slate-500 hover:text-red-500 transition-colors"
          aria-label="Log out"
          title="Log out"
        >
          <FaSignOutAlt className="text-lg" />
        </button>
      </div>
    </header>
  );
};

export default Topbar;
