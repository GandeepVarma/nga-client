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
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

// Admin: full academy control, including teacher management and finances.
const adminLinks = [
  { to: "/admin/dashboard", label: "Dashboard", icon: FaThLarge },
  { to: "/admin/teachers", label: "Teachers", icon: FaUserTie },
  { to: "/admin/assign-students", label: "Assign Students", icon: FaExchangeAlt },
  { to: "/admin/students", label: "All Students", icon: FaUsers },
  { to: "/admin/tests", label: "Tests", icon: FaClipboardList },
  { to: "/admin/online-tests", label: "Online MCQ Tests", icon: FaLaptopCode },
  { to: "/admin/assignments", label: "Assignments", icon: FaBookOpen },
  { to: "/admin/fees", label: "Fees", icon: FaMoneyBillWave },
  { to: "/admin/attendance", label: "Attendance", icon: FaCalendarCheck },
  { to: "/admin/teacher-performance", label: "Teacher Performance", icon: FaChartLine },
  { to: "/admin/whatsapp/broadcast", label: "Broadcast", icon: FaWhatsapp },
  { to: "/admin/whatsapp/logs", label: "WhatsApp Logs", icon: FaHistory },
  { to: "/admin/whatsapp/settings", label: "WhatsApp Settings", icon: FaCog },
];

// Teacher: scoped strictly to their own assigned students. No fees, ever.
const teacherLinks = [
  { to: "/teacher/dashboard", label: "Dashboard", icon: FaThLarge },
  { to: "/teacher/students", label: "My Students", icon: FaUsers },
  { to: "/teacher/tests", label: "Tests", icon: FaClipboardList },
  { to: "/teacher/online-tests", label: "Online MCQ Tests", icon: FaLaptopCode },
  { to: "/teacher/assignments", label: "Assignments", icon: FaBookOpen },
  { to: "/teacher/attendance", label: "Attendance", icon: FaCalendarCheck },
  { to: "/teacher/whatsapp/broadcast", label: "Broadcast", icon: FaWhatsapp },
  { to: "/teacher/whatsapp/logs", label: "WhatsApp Logs", icon: FaHistory },
];

const studentLinks = [
  { to: "/student/dashboard", label: "Dashboard", icon: FaThLarge },
  { to: "/student/tests", label: "My Tests", icon: FaClipboardList },
  { to: "/student/online-tests", label: "Online Tests", icon: FaLaptopCode },
  { to: "/student/assignments", label: "Assignments", icon: FaBookOpen },
  { to: "/student/fees", label: "Fee Status", icon: FaMoneyBillWave },
];

// Super Admin: platform-level, sits above every academy.
const superAdminLinks = [
  { to: "/super-admin/dashboard", label: "Dashboard", icon: FaThLarge },
  { to: "/super-admin/academies", label: "Academies", icon: FaBuilding },
  { to: "/super-admin/academies/create", label: "Create Academy", icon: FaPlusCircle },
];

const Sidebar = ({ open, onClose }) => {
  const { role } = useAuth();
  const links =
    role === "super_admin" ? superAdminLinks :
    role === "admin" ? adminLinks :
    role === "teacher" ? teacherLinks :
    studentLinks;

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose} />}

      <aside
        className={`fixed lg:static z-40 top-0 left-0 h-full w-64 bg-navy flex flex-col p-5 transition-transform duration-300 overflow-y-auto ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gold flex items-center justify-center shrink-0">
            <FaGraduationCap className="text-navy text-lg" />
          </div>
          <div className="leading-tight">
            <p className="font-display font-bold text-white text-sm">NextGen</p>
            <p className="text-slate-400 text-xs">Learning Academy</p>
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

        <div className="text-slate-500 text-xs px-2">Learn Today. Lead Tomorrow.</div>
      </aside>
    </>
  );
};

export default Sidebar;
