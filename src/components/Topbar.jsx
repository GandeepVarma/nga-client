import React, { useState, useEffect } from "react";
import { FaBars, FaMoon, FaSun, FaSignOutAlt } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const Topbar = ({ onMenuClick, title }) => {
  const { user, role, logout } = useAuth();
  const [dark, setDark] = useState(() => localStorage.getItem("nga_theme") === "dark");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("nga_theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <header className="h-16 flex items-center justify-between px-4 lg:px-8 bg-white dark:bg-navy-light border-b border-slate-100 dark:border-navy-lighter sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <button
          className="lg:hidden text-slate-600 dark:text-slate-300 text-xl"
          onClick={onMenuClick}
        >
          <FaBars />
        </button>
        <h1 className="font-display font-semibold text-lg text-navy dark:text-white">
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
            <p className="text-sm font-semibold text-navy dark:text-white">{user?.name}</p>
            <p className="text-xs text-slate-400 capitalize">{role}</p>
          </div>
        </div>

        <button
          onClick={logout}
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
