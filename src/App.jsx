import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentManagement from "./pages/StudentManagement";
import StudentProfile from "./pages/StudentProfile";
import StudentDashboard from "./pages/StudentDashboard";
import TestManagement from "./pages/TestManagement";
import AssignmentManagement from "./pages/AssignmentManagement";
import FeeManagement from "./pages/FeeManagement";
import AttendanceManagement from "./pages/AttendanceManagement";
import StudentTests from "./pages/StudentTests";
import StudentAssignments from "./pages/StudentAssignments";
import StudentFees from "./pages/StudentFees";

function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Teacher routes */}
        <Route
          path="/teacher/dashboard"
          element={
            <ProtectedRoute allowedRole="teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/students"
          element={
            <ProtectedRoute allowedRole="teacher">
              <StudentManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/students/:id"
          element={
            <ProtectedRoute allowedRole="teacher">
              <StudentProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/tests"
          element={
            <ProtectedRoute allowedRole="teacher">
              <TestManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/assignments"
          element={
            <ProtectedRoute allowedRole="teacher">
              <AssignmentManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/fees"
          element={
            <ProtectedRoute allowedRole="teacher">
              <FeeManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/attendance"
          element={
            <ProtectedRoute allowedRole="teacher">
              <AttendanceManagement />
            </ProtectedRoute>
          }
        />

        {/* Student routes */}
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/tests"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentTests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/assignments"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentAssignments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/fees"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentFees />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

export default App;
