import React from "react";
import { NavLink } from "react-router-dom";
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
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { PLATFORM_NAME, PLATFORM_TAGLINE } from "../config/branding";
import { hasFeature } from "../config/planFeatures";
import ngaLogo from "../assets/nga-logo.png.jpeg";

// Admin: full academy control, including teacher management and finances.
const adminLinks = [
  { to: "/admin/dashboard", label: "Dashboard", icon: FaThLarge, feature: "dashboard" },
  { to: "/admin/teachers", label: "Teachers", icon: FaUserTie, feature: "students" },
  { to: "/admin/assign-students", label: "Assign Students", icon: FaExchangeAlt, feature: "students" },
  { to: "/admin/students", label: "All Students", icon: FaUsers, feature: "students" },
  { to: "/admin/tests", label: "Tests", icon: FaClipboardList, feature: "tests" },
  { to: "/admin/online-tests", label: "Online MCQ Tests", icon: FaLaptopCode, feature: "tests" },
  { to: "/admin/question-bank", label: "Question Bank", icon: FaQuestionCircle, feature: "studyMaterials" },
  { to: "/admin/assignments", label: "Assignments", icon: FaBookOpen, feature: "assignments" },
  { to: "/admin/fees", label: "Fees", icon: FaMoneyBillWave, feature: "fees" },
  { to: "/admin/programs", label: "Programs", icon: FaGraduationCap, feature: "dashboard" },
  { to: "/admin/results", label: "Student Results", icon: FaChartLine, feature: "dashboard" },
  { to: "/admin/story", label: "Our Story", icon: FaBookOpen, feature: "dashboard" },
  { to: "/admin/digital-hub", label: "Digital Hub", icon: FaLaptopCode, feature: "dashboard" },
  { to: "/admin/attendance", label: "Attendance", icon: FaCalendarCheck, feature: "attendance" },
  { to: "/admin/teacher-performance", label: "Teacher Performance", icon: FaChartLine, feature: "analytics" },
  { to: "/admin/whatsapp/broadcast", label: "Broadcast", icon: FaWhatsapp, feature: "whatsappReminders" },
  { to: "/admin/whatsapp/logs", label: "WhatsApp Logs", icon: FaHistory, feature: "whatsappReminders" },
  { to: "/admin/whatsapp/settings", label: "WhatsApp Settings", icon: FaCog, feature: "whatsappReminders" },
  { to: "/account/password", label: "Change Password", icon: FaKey, feature: "dashboard" },
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
  let links = role === "super_admin" ? superAdminLinks : role === "admin" ? adminLinks : role === "teacher" ? teacherLinks : studentLinks;

  if (role !== "super_admin" && user?.academy?.features) {
    links = links.filter((item) => {
      const featureName = item.feature || item.label?.toLowerCase();
      if (!featureName) return true;
      return hasFeature(featureName, user);
    });
  }

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose} />}

      <aside
        className={`admin-sidebar fixed lg:static z-40 top-0 left-0 h-full w-64 bg-navy flex flex-col p-5 transition-transform duration-300 overflow-y-auto ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center gap-3 px-2 mb-8">
          <img src={ngaLogo} alt="Next GenLearning Academy logo" className="admin-brand-logo w-10 h-10 rounded-xl object-contain shrink-0" />
          <div className="leading-tight">
            <p className="font-display font-bold text-white text-sm">{PLATFORM_NAME}</p>
            {user?.academyName && <p className="text-slate-400 text-xs truncate" title={user.academyName}>{user.academyName}</p>}
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
            >
              <Icon /> {label}
            </NavLink>
          ))}
        </nav>

        <div className="text-slate-500 text-xs px-2">{PLATFORM_TAGLINE}</div>
      </aside>
    </>
  );
};

export default Sidebar;
