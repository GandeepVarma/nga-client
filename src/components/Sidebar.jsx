import React, { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  FaGraduationCap,
  FaThLarge,
  FaUsers,
  FaClipboardList,
  FaBookOpen,
  FaMoneyBillWave,
  FaCalendarCheck,
  FaUserTie,
  FaExchangeAlt,
  FaChartLine,
  FaLaptopCode,
  FaWhatsapp,
  FaHistory,
  FaCog,
  FaBuilding,
  FaPlusCircle,
  FaQuestionCircle,
  FaKey,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { PLATFORM_NAME, PLATFORM_TAGLINE } from "../config/branding";
import { hasFeature } from "../config/planFeatures";
import ngaLogo from "../assets/nga-logo.png.jpeg";

// Admin: full academy control, including teacher management and finances.
const adminLinks = [
  { to: "/admin/dashboard", label: "Dashboard", icon: FaThLarge, feature: "dashboard" },
  { to: "/admin/students", label: "All Students", icon: FaUsers, feature: "students" },
  { to: "/admin/assign-students", label: "Assign Students", icon: FaExchangeAlt, feature: "students" },
  { to: "/admin/teachers", label: "Teachers", icon: FaUserTie, feature: "students" },
  { to: "/admin/attendance", label: "Attendance", icon: FaCalendarCheck, feature: "attendance" },
  { to: "/admin/tests", label: "Tests", icon: FaClipboardList, feature: "tests" },
  { to: "/admin/online-tests", label: "Online MCQ Tests", icon: FaLaptopCode, feature: "tests" },
  { to: "/admin/question-bank", label: "Question Bank", icon: FaQuestionCircle, feature: "studyMaterials" },
  { to: "/admin/assignments", label: "Assignments", icon: FaBookOpen, feature: "assignments" },
  { to: "/admin/fees", label: "Fees", icon: FaMoneyBillWave, feature: "fees" },
  { to: "/admin/earnings", label: "Monthly Earnings", icon: FaMoneyBillWave, feature: "fees" },
  { to: "/admin/teacher-performance", label: "Teacher Performance", icon: FaChartLine, feature: "analytics" },
  { to: "/admin/whatsapp/broadcast", label: "Broadcast", icon: FaWhatsapp, feature: "whatsappReminders" },
  { to: "/admin/whatsapp/logs", label: "WhatsApp Logs", icon: FaHistory, feature: "whatsappReminders" },
  { to: "/admin/whatsapp/settings", label: "WhatsApp Settings", icon: FaCog, feature: "whatsappReminders" },
  { to: "/account/password", label: "Change Password", icon: FaKey, feature: "dashboard" },
];

const adminChangeLinks = [
  { to: "/admin/programs", label: "Programs", icon: FaGraduationCap, feature: "dashboard" },
  { to: "/admin/results", label: "Student Results", icon: FaChartLine, feature: "dashboard" },
  { to: "/admin/story", label: "Our Story", icon: FaBookOpen, feature: "dashboard" },
  { to: "/admin/digital-hub", label: "Digital Hub", icon: FaLaptopCode, feature: "dashboard" },
];

// Teacher: scoped strictly to their own assigned students. No fees, ever.
const teacherLinks = [
  { to: "/teacher/dashboard", label: "Dashboard", icon: FaThLarge, feature: "dashboard" },
  { to: "/teacher/students", label: "My Students", icon: FaUsers, feature: "students" },
  { to: "/teacher/tests", label: "Tests", icon: FaClipboardList, feature: "tests" },
  { to: "/teacher/online-tests", label: "Online MCQ Tests", icon: FaLaptopCode, feature: "tests" },
  { to: "/teacher/question-bank", label: "Question Bank", icon: FaQuestionCircle, feature: "studyMaterials" },
  { to: "/teacher/assignments", label: "Assignments", icon: FaBookOpen, feature: "assignments" },
  { to: "/teacher/attendance", label: "Attendance", icon: FaCalendarCheck, feature: "attendance" },
  { to: "/teacher/whatsapp/broadcast", label: "Broadcast", icon: FaWhatsapp, feature: "whatsappReminders" },
  { to: "/teacher/whatsapp/logs", label: "WhatsApp Logs", icon: FaHistory, feature: "whatsappReminders" },
  { to: "/account/password", label: "Change Password", icon: FaKey, feature: "dashboard" },
];

const studentLinks = [
  { to: "/student/dashboard", label: "Dashboard", icon: FaThLarge, feature: "dashboard" },
  { to: "/student/tests", label: "My Tests", icon: FaClipboardList, feature: "tests" },
  { to: "/student/online-tests", label: "Online Tests", icon: FaLaptopCode, feature: "tests" },
  { to: "/student/assignments", label: "Assignments", icon: FaBookOpen, feature: "assignments" },
  { to: "/student/fees", label: "Fee Status", icon: FaMoneyBillWave, feature: "fees" },
  { to: "/account/password", label: "Change Password", icon: FaKey, feature: "dashboard" },
];

// Super Admin: platform-level, sits above every academy.
const superAdminLinks = [
  { to: "/super-admin/dashboard", label: "Dashboard", icon: FaThLarge },
  { to: "/super-admin/academies", label: "Academies", icon: FaBuilding },
  { to: "/super-admin/academies/create", label: "Create Academy", icon: FaPlusCircle },
  { to: "/account/password", label: "Change Password", icon: FaKey },
];

const Sidebar = ({ open, onClose }) => {
  const { role, user } = useAuth();
  const { pathname } = useLocation();
  const [changesOpen, setChangesOpen] = useState(() => adminChangeLinks.some((item) => item.to === pathname));
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("nga_sidebar_collapsed") === "true");
  const toggleCollapsed = () => {
    setCollapsed((value) => {
      const next = !value;
      localStorage.setItem("nga_sidebar_collapsed", String(next));
      return next;
    });
  };
  let links = role === "super_admin" ? superAdminLinks : role === "admin" ? adminLinks : role === "teacher" ? teacherLinks : studentLinks;
  const changeLinks = role === "admin" ? adminChangeLinks : [];

  if (role !== "super_admin" && user?.academy?.features) {
    links = links.filter((item) => {
      const featureName = item.feature || item.label?.toLowerCase();
      if (!featureName) return true;
      return hasFeature(featureName, user);
    });
  }
  const visibleChangeLinks = changeLinks.filter((item) => hasFeature(item.feature, user));

  useEffect(() => {
    if (role === "admin" && adminChangeLinks.some((item) => item.to === pathname)) setChangesOpen(true);
  }, [pathname, role]);

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose} />}

      <aside
        className={`admin-sidebar fixed lg:sticky z-40 top-0 left-0 h-full lg:h-screen shrink-0 bg-navy flex flex-col p-5 transition-all duration-300 overflow-y-auto ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${collapsed ? "is-collapsed" : ""}`}
      >
        <div className="admin-sidebar-header mb-8">
          <div className="admin-sidebar-controls">
            <button
              type="button"
              className="admin-sidebar-mobile-close lg:hidden"
              onClick={onClose}
              aria-label="Close navigation"
            >
              <FaTimes />
            </button>
            <button
              type="button"
              className="admin-sidebar-collapse hidden lg:flex"
              onClick={toggleCollapsed}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
            </button>
          </div>
          <div className="admin-sidebar-brand flex items-center gap-3 px-2">
            <img src={ngaLogo} alt="Next GenLearning Academy logo" className="admin-brand-logo w-10 h-10 rounded-xl object-contain shrink-0" />
            <div className="leading-tight sidebar-brand-copy">
              <p className="font-display font-bold text-white text-sm">{PLATFORM_NAME}</p>
              {user?.academyName && <p className="text-slate-400 text-xs truncate" title={user.academyName}>{user.academyName}</p>}
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {links.map(({ to, label, icon: Icon }) => (
            <React.Fragment key={to}>
              {to === "/admin/fees" && visibleChangeLinks.length > 0 && (
                <div
                  onMouseEnter={() => setChangesOpen(true)}
                  onMouseLeave={() => setChangesOpen(false)}
                >
                  <button
                    type="button"
                    className={`sidebar-link w-full justify-between ${visibleChangeLinks.some((item) => item.to === pathname) ? "active" : ""}`}
                    aria-expanded={changesOpen}
                    aria-controls="admin-make-changes-menu"
                    onClick={() => setChangesOpen((current) => !current)}
                  >
                    <FaCog /> <span className="sidebar-link-label">Make Changes</span>
                    <FaChevronDown className={`sidebar-link-chevron text-xs transition-transform ${changesOpen ? "rotate-180" : ""}`} />
                  </button>
                  {changesOpen && (
                    <div id="admin-make-changes-menu" className="mt-1 space-y-1">
                      {visibleChangeLinks.map(({ to: changeTo, label: changeLabel, icon: ChangeIcon }) => (
                        <NavLink
                          key={changeTo}
                          to={changeTo}
                          onClick={onClose}
                          title={collapsed ? changeLabel : undefined}
                          aria-label={changeLabel}
                          className={({ isActive }) => `sidebar-link pl-8 text-sm ${isActive ? "active" : ""}`}
                        >
                          <ChangeIcon /> <span className="sidebar-link-label">{changeLabel}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <NavLink
                to={to}
                onClick={onClose}
                title={collapsed ? label : undefined}
                aria-label={label}
                className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
              >
                <Icon /> <span className="sidebar-link-label">{label}</span>
              </NavLink>
            </React.Fragment>
          ))}
        </nav>

        <div className="text-slate-500 text-xs px-2">{PLATFORM_TAGLINE}</div>
      </aside>
    </>
  );
};

export default Sidebar;
