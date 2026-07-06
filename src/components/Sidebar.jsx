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
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const teacherLinks = [
  { to: "/teacher/dashboard", label: "Dashboard", icon: FaThLarge },
  { to: "/teacher/students", label: "Students", icon: FaUsers },
  { to: "/teacher/tests", label: "Tests", icon: FaClipboardList },
  { to: "/teacher/assignments", label: "Assignments", icon: FaBookOpen },
  { to: "/teacher/fees", label: "Fees", icon: FaMoneyBillWave },
  { to: "/teacher/attendance", label: "Attendance", icon: FaCalendarCheck },
];

const studentLinks = [
  { to: "/student/dashboard", label: "Dashboard", icon: FaThLarge },
  { to: "/student/tests", label: "My Tests", icon: FaClipboardList },
  { to: "/student/assignments", label: "Assignments", icon: FaBookOpen },
  { to: "/student/fees", label: "Fee Status", icon: FaMoneyBillWave },
];

const Sidebar = ({ open, onClose }) => {
  const { role } = useAuth();
  const links = role === "teacher" ? teacherLinks : studentLinks;

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:static z-40 top-0 left-0 h-full w-64 bg-navy flex flex-col p-5 transition-transform duration-300 ${
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

        <div className="text-slate-500 text-xs px-2">
          Learn Today. Lead Tomorrow.
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
