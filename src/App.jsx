import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";

// Admin-only pages
import AdminDashboard from "./pages/AdminDashboard";
import TeacherManagement from "./pages/TeacherManagement";
import AssignStudents from "./pages/AssignStudents";
import TeacherPerformance from "./pages/TeacherPerformance";
import FeeManagement from "./pages/FeeManagement";

// Shared between Admin + Teacher (backend scopes data automatically)
import StudentManagement from "./pages/StudentManagement";
import StudentProfile from "./pages/StudentProfile";
import TestManagement from "./pages/TestManagement";
import AssignmentManagement from "./pages/AssignmentManagement";
import AttendanceManagement from "./pages/AttendanceManagement";
import OnlineTestManagement from "./pages/OnlineTestManagement";
import OnlineTestBuilder from "./pages/OnlineTestBuilder";
import OnlineTestAnalytics from "./pages/OnlineTestAnalytics";
import OnlineTestSubmissions from "./pages/OnlineTestSubmissions";
import WhatsAppSettings from "./pages/WhatsAppSettings";
import WhatsAppLogs from "./pages/WhatsAppLogs";
import BroadcastMessage from "./pages/BroadcastMessage";

// Teacher-only
import TeacherDashboard from "./pages/TeacherDashboard";

// Student-only
import StudentDashboard from "./pages/StudentDashboard";
import StudentTests from "./pages/StudentTests";
import StudentAssignments from "./pages/StudentAssignments";
import StudentFees from "./pages/StudentFees";
import StudentOnlineTests from "./pages/StudentOnlineTests";
import StudentTestExam from "./pages/StudentTestExam";
import StudentTestResult from "./pages/StudentTestResult";

function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* ---------------- ADMIN ---------------- */}
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/teachers" element={<ProtectedRoute allowedRoles={["admin"]}><TeacherManagement /></ProtectedRoute>} />
        <Route path="/admin/assign-students" element={<ProtectedRoute allowedRoles={["admin"]}><AssignStudents /></ProtectedRoute>} />
        <Route path="/admin/teacher-performance" element={<ProtectedRoute allowedRoles={["admin"]}><TeacherPerformance /></ProtectedRoute>} />
        <Route path="/admin/fees" element={<ProtectedRoute allowedRoles={["admin"]}><FeeManagement /></ProtectedRoute>} />
        <Route path="/admin/students" element={<ProtectedRoute allowedRoles={["admin"]}><StudentManagement basePath="/admin" /></ProtectedRoute>} />
        <Route path="/admin/students/:id" element={<ProtectedRoute allowedRoles={["admin"]}><StudentProfile basePath="/admin" /></ProtectedRoute>} />
        <Route path="/admin/tests" element={<ProtectedRoute allowedRoles={["admin"]}><TestManagement /></ProtectedRoute>} />
        <Route path="/admin/assignments" element={<ProtectedRoute allowedRoles={["admin"]}><AssignmentManagement /></ProtectedRoute>} />
        <Route path="/admin/attendance" element={<ProtectedRoute allowedRoles={["admin"]}><AttendanceManagement /></ProtectedRoute>} />
        <Route path="/admin/online-tests" element={<ProtectedRoute allowedRoles={["admin"]}><OnlineTestManagement basePath="/admin" /></ProtectedRoute>} />
        <Route path="/admin/online-tests/new" element={<ProtectedRoute allowedRoles={["admin"]}><OnlineTestBuilder basePath="/admin" /></ProtectedRoute>} />
        <Route path="/admin/online-tests/:id/edit" element={<ProtectedRoute allowedRoles={["admin"]}><OnlineTestBuilder basePath="/admin" /></ProtectedRoute>} />
        <Route path="/admin/online-tests/:id/analytics" element={<ProtectedRoute allowedRoles={["admin"]}><OnlineTestAnalytics basePath="/admin" /></ProtectedRoute>} />
        <Route path="/admin/online-tests/:id/submissions" element={<ProtectedRoute allowedRoles={["admin"]}><OnlineTestSubmissions basePath="/admin" /></ProtectedRoute>} />
        <Route path="/admin/whatsapp/settings" element={<ProtectedRoute allowedRoles={["admin"]}><WhatsAppSettings /></ProtectedRoute>} />
        <Route path="/admin/whatsapp/logs" element={<ProtectedRoute allowedRoles={["admin"]}><WhatsAppLogs /></ProtectedRoute>} />
        <Route path="/admin/whatsapp/broadcast" element={<ProtectedRoute allowedRoles={["admin"]}><BroadcastMessage /></ProtectedRoute>} />

        {/* ---------------- TEACHER ---------------- */}
        {/* No fee routes here at all, by design — teachers have zero fee access */}
        <Route path="/teacher/dashboard" element={<ProtectedRoute allowedRoles={["teacher"]}><TeacherDashboard /></ProtectedRoute>} />
        <Route path="/teacher/students" element={<ProtectedRoute allowedRoles={["teacher"]}><StudentManagement basePath="/teacher" /></ProtectedRoute>} />
        <Route path="/teacher/students/:id" element={<ProtectedRoute allowedRoles={["teacher"]}><StudentProfile basePath="/teacher" /></ProtectedRoute>} />
        <Route path="/teacher/tests" element={<ProtectedRoute allowedRoles={["teacher"]}><TestManagement /></ProtectedRoute>} />
        <Route path="/teacher/assignments" element={<ProtectedRoute allowedRoles={["teacher"]}><AssignmentManagement /></ProtectedRoute>} />
        <Route path="/teacher/attendance" element={<ProtectedRoute allowedRoles={["teacher"]}><AttendanceManagement /></ProtectedRoute>} />
        <Route path="/teacher/online-tests" element={<ProtectedRoute allowedRoles={["teacher"]}><OnlineTestManagement basePath="/teacher" /></ProtectedRoute>} />
        <Route path="/teacher/online-tests/new" element={<ProtectedRoute allowedRoles={["teacher"]}><OnlineTestBuilder basePath="/teacher" /></ProtectedRoute>} />
        <Route path="/teacher/online-tests/:id/edit" element={<ProtectedRoute allowedRoles={["teacher"]}><OnlineTestBuilder basePath="/teacher" /></ProtectedRoute>} />
        <Route path="/teacher/online-tests/:id/analytics" element={<ProtectedRoute allowedRoles={["teacher"]}><OnlineTestAnalytics basePath="/teacher" /></ProtectedRoute>} />
        <Route path="/teacher/online-tests/:id/submissions" element={<ProtectedRoute allowedRoles={["teacher"]}><OnlineTestSubmissions basePath="/teacher" /></ProtectedRoute>} />
        <Route path="/teacher/whatsapp/logs" element={<ProtectedRoute allowedRoles={["teacher"]}><WhatsAppLogs /></ProtectedRoute>} />
        <Route path="/teacher/whatsapp/broadcast" element={<ProtectedRoute allowedRoles={["teacher"]}><BroadcastMessage /></ProtectedRoute>} />

        {/* ---------------- STUDENT ---------------- */}
        <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={["student"]}><StudentDashboard /></ProtectedRoute>} />
        <Route path="/student/tests" element={<ProtectedRoute allowedRoles={["student"]}><StudentTests /></ProtectedRoute>} />
        <Route path="/student/assignments" element={<ProtectedRoute allowedRoles={["student"]}><StudentAssignments /></ProtectedRoute>} />
        <Route path="/student/fees" element={<ProtectedRoute allowedRoles={["student"]}><StudentFees /></ProtectedRoute>} />
        <Route path="/student/online-tests" element={<ProtectedRoute allowedRoles={["student"]}><StudentOnlineTests /></ProtectedRoute>} />
        <Route path="/student/online-tests/:id/exam" element={<ProtectedRoute allowedRoles={["student"]}><StudentTestExam /></ProtectedRoute>} />
        <Route path="/student/online-tests/:id/result" element={<ProtectedRoute allowedRoles={["student"]}><StudentTestResult /></ProtectedRoute>} />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

export default App;
