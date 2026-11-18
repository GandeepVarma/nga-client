import React, { useState, useEffect, useRef } from "react";
import { FaBars, FaBell, FaChevronDown, FaKey, FaMoon, FaSearch, FaSignOutAlt, FaSun, FaUserCircle } from "react-icons/fa";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Topbar = ({ onMenuClick, title }) => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dark, setDark] = useState(() => localStorage.getItem("nga_theme") === "dark");
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchRef = useRef(null);
  const profileRef = useRef(null);
  const notificationsRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("nga_theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    setProfileOpen(false);
    setNotificationsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const closeMenus = (event) => {
      if (!profileRef.current?.contains(event.target)) setProfileOpen(false);
      if (!notificationsRef.current?.contains(event.target)) setNotificationsOpen(false);
    };
    document.addEventListener("mousedown", closeMenus);
    return () => document.removeEventListener("mousedown", closeMenus);
  }, []);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const submitSearch = (event) => {
    event.preventDefault();
    if (!search.trim()) return;
    const query = encodeURIComponent(search.trim());
    const base = role === "super_admin"
      ? "/super-admin/academies"
      : role === "admin"
        ? "/admin/students"
        : role === "teacher"
          ? "/teacher/students"
          : "/student/dashboard";
    navigate(`${base}?search=${query}`);
  };

  const breadcrumbLabel = title || "Dashboard";
  const roleLabel = role === "super_admin"
    ? "Super Admin"
    : `${role || "admin"}`.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

  const handleLogout = () => {
    logout();
    ["nga_academyId", "nga_tenantId"].forEach((key) => localStorage.removeItem(key));
    navigate("/", { replace: true });
  };

  return (
    <header className="admin-topbar sticky top-0 z-20 flex h-16 min-w-0 w-full items-center justify-between border-b border-slate-100 bg-white px-4 dark:border-navy-lighter dark:bg-navy-light lg:px-8">
      <div className="admin-topbar-left flex min-w-0 flex-1 items-center gap-4">
        <button
          className="lg:hidden text-slate-600 dark:text-slate-300 text-xl"
          onClick={onMenuClick}
          aria-label="Open navigation"
        >
          <FaBars />
        </button>
        <div className="admin-page-heading">
          <nav className="admin-breadcrumb" aria-label="Breadcrumb">
            <span>{roleLabel}</span>
            <span>/</span>
          </nav>
          <h1 className="dashboard-page-title font-display font-semibold text-lg">{breadcrumbLabel}</h1>
        </div>
      </div>

      <div className="admin-topbar-actions flex min-w-0 items-center gap-2 sm:gap-3">
        <form className={`admin-global-search ${searchOpen ? "open" : ""}`} onSubmit={submitSearch}>
          <FaSearch aria-hidden="true" />
          <input
            ref={searchRef}
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => !search && setSearchOpen(false)}
            placeholder="Search..."
            aria-label="Search students"
          />
        </form>
        <button
          type="button"
          className="admin-mobile-search"
          onClick={() => setSearchOpen((value) => !value)}
          aria-label="Open search"
        >
          <FaSearch />
        </button>

        <div className="admin-header-menu" ref={notificationsRef}>
          <button
            type="button"
            className="admin-header-icon"
            onClick={() => setNotificationsOpen((value) => !value)}
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
          >
            <FaBell />
            <span className="admin-notification-dot" />
          </button>
          {notificationsOpen && (
            <div className="admin-header-dropdown notification-dropdown">
              <div className="admin-dropdown-heading"><strong>Notifications</strong><span>All caught up</span></div>
              <p className="admin-notification-empty">No unread notifications</p>
            </div>
          )}
        </div>

        <button
          onClick={() => setDark((d) => !d)}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-100 dark:bg-navy-lighter text-slate-600 dark:text-gold-light transition-colors"
          aria-label="Toggle dark mode"
        >
          {dark ? <FaSun /> : <FaMoon />}
        </button>

        <div className="admin-header-menu" ref={profileRef}>
          <button type="button" className="admin-profile-button" onClick={() => setProfileOpen((value) => !value)} aria-expanded={profileOpen}>
          <div className="w-9 h-9 rounded-full bg-gold flex items-center justify-center font-semibold text-navy text-sm">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="hidden sm:block leading-tight">
            <p className="dashboard-user-name text-sm font-semibold">{user?.name}</p>
            <p className="dashboard-user-role text-xs capitalize">{role}</p>
          </div>
            <FaChevronDown className="admin-profile-chevron" />
          </button>
          {profileOpen && (
            <div className="admin-header-dropdown profile-dropdown">
              <Link to="/account/password"><FaKey /> Change password</Link>
              <Link to="/"><FaUserCircle /> Public website</Link>
              <button type="button" onClick={handleLogout}><FaSignOutAlt /> Sign out</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
