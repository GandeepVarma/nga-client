import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import ProtectedRoute from "./components/ProtectedRoute";
import FeatureRoute from "./components/FeatureRoute";

const Login = React.lazy(() => import("./pages/Login"));
const Home = React.lazy(() => import("./pages/public/Home"));
const Pricing = React.lazy(() => import("./pages/public/Pricing"));
const RegisterAcademy = React.lazy(() => import("./pages/public/RegisterAcademy"));
const AcademyLogin = React.lazy(() => import("./pages/public/AcademyLogin"));
const SuperAdminLogin = React.lazy(() => import("./pages/public/SuperAdminLogin"));
const About = React.lazy(() => import("./pages/public/About"));
const Contact = React.lazy(() => import("./pages/public/Contact"));
const Programs = React.lazy(() => import("./pages/public/Programs"));
const Results = React.lazy(() => import("./pages/public/Results"));
const DigitalHub = React.lazy(() => import("./pages/public/DigitalHub"));
const ChangePassword = React.lazy(() => import("./pages/ChangePassword"));
const AdminDashboard = React.lazy(() => import("./pages/AdminDashboard"));
const TeacherManagement = React.lazy(() => import("./pages/TeacherManagement"));
const AssignStudents = React.lazy(() => import("./pages/AssignStudents"));
const TeacherPerformance = React.lazy(() => import("./pages/TeacherPerformance"));
const FeeManagement = React.lazy(() => import("./pages/FeeManagement"));
const MonthlyEarnings = React.lazy(() => import("./pages/MonthlyEarnings"));
const StudentManagement = React.lazy(() => import("./pages/StudentManagement"));
const StudentProfile = React.lazy(() => import("./pages/StudentProfile"));
const TestManagement = React.lazy(() => import("./pages/TestManagement"));
const AssignmentManagement = React.lazy(() => import("./pages/AssignmentManagement"));
const AttendanceManagement = React.lazy(() => import("./pages/AttendanceManagement"));
const OnlineTestManagement = React.lazy(() => import("./pages/OnlineTestManagement"));
const OnlineTestBuilder = React.lazy(() => import("./pages/OnlineTestBuilder"));
const OnlineTestAnalytics = React.lazy(() => import("./pages/OnlineTestAnalytics"));
const OnlineTestSubmissions = React.lazy(() => import("./pages/OnlineTestSubmissions"));
const QuestionBank = React.lazy(() => import("./pages/QuestionBank"));
const WhatsAppSettings = React.lazy(() => import("./pages/WhatsAppSettings"));
const WhatsAppLogs = React.lazy(() => import("./pages/WhatsAppLogs"));
const BroadcastMessage = React.lazy(() => import("./pages/BroadcastMessage"));
const SuperAdminDashboard = React.lazy(() => import("./pages/SuperAdminDashboard"));
const AcademyManagement = React.lazy(() => import("./pages/AcademyManagement"));
const AcademyCreate = React.lazy(() => import("./pages/AcademyCreate"));
const AcademyDetails = React.lazy(() => import("./pages/AcademyDetails"));
const ProgramManagement = React.lazy(() => import("./pages/ProgramManagement"));
const ResultsManagement = React.lazy(() => import("./pages/ResultsManagement"));
const StoryManagement = React.lazy(() => import("./pages/StoryManagement"));
const DigitalHubManagement = React.lazy(() => import("./pages/DigitalHubManagement"));
const TeacherDashboard = React.lazy(() => import("./pages/TeacherDashboard"));
const StudentDashboard = React.lazy(() => import("./pages/StudentDashboard"));
const StudentAttendance = React.lazy(() => import("./pages/StudentAttendance"));
const StudentTests = React.lazy(() => import("./pages/StudentTests"));
const StudentAssignments = React.lazy(() => import("./pages/StudentAssignments"));
const StudentFees = React.lazy(() => import("./pages/StudentFees"));
const StudentOnlineTests = React.lazy(() => import("./pages/StudentOnlineTests"));
const StudentTestExam = React.lazy(() => import("./pages/StudentTestExam"));
const StudentTestResult = React.lazy(() => import("./pages/StudentTestResult"));

function App() {
  const location = useLocation();

  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      <div className="route-page-shell" key={location.pathname}>
        <React.Suspense fallback={<div className="min-h-[40vh] flex items-center justify-center text-slate-500">Loading page...</div>}>
          <Routes location={location}>
          {/* ---------------- PUBLIC SOFTWARE WEBSITE ---------------- */}
          <Route path="/" element={<Home />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/register-academy" element={<RegisterAcademy />} />
          <Route path="/academy-login" element={<AcademyLogin />} />
          <Route path="/super-admin/login" element={<SuperAdminLogin />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/programs" element={<Programs />} />
          <Route path="/results" element={<Results />} />
          <Route path="/digital-hub" element={<DigitalHub />} />
          <Route path="/account/password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
          {/* Legacy single-tab login page — kept working for existing bookmarks/links */}
          <Route path="/login" element={<Login />} />

          {/* ---------------- SUPER ADMIN ---------------- */}
          <Route path="/super-admin/dashboard" element={<ProtectedRoute allowedRoles={["super_admin"]}><SuperAdminDashboard /></ProtectedRoute>} />
          <Route path="/super-admin/academies" element={<ProtectedRoute allowedRoles={["super_admin"]}><AcademyManagement /></ProtectedRoute>} />
          <Route path="/super-admin/academies/create" element={<ProtectedRoute allowedRoles={["super_admin"]}><AcademyCreate /></ProtectedRoute>} />
          <Route path="/super-admin/academies/:id" element={<ProtectedRoute allowedRoles={["super_admin"]}><AcademyDetails /></ProtectedRoute>} />

          {/* ---------------- ADMIN ---------------- */}
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/teachers" element={<ProtectedRoute allowedRoles={["admin"]}><TeacherManagement /></ProtectedRoute>} />
          <Route path="/admin/assign-students" element={<ProtectedRoute allowedRoles={["admin"]}><AssignStudents /></ProtectedRoute>} />
          <Route path="/admin/teacher-performance" element={<ProtectedRoute allowedRoles={["admin"]}><TeacherPerformance /></ProtectedRoute>} />
          <Route path="/admin/fees" element={<ProtectedRoute allowedRoles={["admin"]}><FeeManagement /></ProtectedRoute>} />
          <Route path="/admin/earnings" element={<ProtectedRoute allowedRoles={["admin"]}><MonthlyEarnings /></ProtectedRoute>} />
          <Route path="/admin/programs" element={<ProtectedRoute allowedRoles={["admin"]}><ProgramManagement /></ProtectedRoute>} />
          <Route path="/admin/results" element={<ProtectedRoute allowedRoles={["admin"]}><ResultsManagement /></ProtectedRoute>} />
          <Route path="/admin/story" element={<ProtectedRoute allowedRoles={["admin"]}><StoryManagement /></ProtectedRoute>} />
          <Route path="/admin/digital-hub" element={<ProtectedRoute allowedRoles={["admin"]}><DigitalHubManagement /></ProtectedRoute>} />
          <Route path="/admin/students" element={<ProtectedRoute allowedRoles={["admin"]}><StudentManagement basePath="/admin" /></ProtectedRoute>} />
          <Route path="/admin/students/:id" element={<ProtectedRoute allowedRoles={["admin"]}><StudentProfile basePath="/admin" /></ProtectedRoute>} />
          <Route path="/admin/tests" element={<ProtectedRoute allowedRoles={["admin"]}><FeatureRoute feature="tests"><TestManagement /></FeatureRoute></ProtectedRoute>} />
          <Route path="/admin/assignments" element={<ProtectedRoute allowedRoles={["admin"]}><FeatureRoute feature="assignments"><AssignmentManagement /></FeatureRoute></ProtectedRoute>} />
          <Route path="/admin/attendance" element={<ProtectedRoute allowedRoles={["admin"]}><FeatureRoute feature="attendance"><AttendanceManagement /></FeatureRoute></ProtectedRoute>} />
          <Route path="/admin/online-tests" element={<ProtectedRoute allowedRoles={["admin"]}><OnlineTestManagement basePath="/admin" /></ProtectedRoute>} />
          <Route path="/admin/online-tests/new" element={<ProtectedRoute allowedRoles={["admin"]}><OnlineTestBuilder basePath="/admin" /></ProtectedRoute>} />
          <Route path="/admin/online-tests/:id/edit" element={<ProtectedRoute allowedRoles={["admin"]}><OnlineTestBuilder basePath="/admin" /></ProtectedRoute>} />
          <Route path="/admin/online-tests/:id/analytics" element={<ProtectedRoute allowedRoles={["admin"]}><OnlineTestAnalytics basePath="/admin" /></ProtectedRoute>} />
          <Route path="/admin/online-tests/:id/submissions" element={<ProtectedRoute allowedRoles={["admin"]}><OnlineTestSubmissions basePath="/admin" /></ProtectedRoute>} />
          <Route path="/admin/question-bank" element={<ProtectedRoute allowedRoles={["admin"]}><QuestionBank /></ProtectedRoute>} />
          <Route path="/admin/whatsapp/settings" element={<ProtectedRoute allowedRoles={["admin"]}><WhatsAppSettings /></ProtectedRoute>} />
          <Route path="/admin/whatsapp/logs" element={<ProtectedRoute allowedRoles={["admin"]}><WhatsAppLogs /></ProtectedRoute>} />
          <Route path="/admin/whatsapp/broadcast" element={<ProtectedRoute allowedRoles={["admin"]}><BroadcastMessage /></ProtectedRoute>} />

          {/* ---------------- TEACHER ---------------- */}
          {/* No fee routes here at all, by design — teachers have zero fee access */}
          <Route path="/teacher/dashboard" element={<ProtectedRoute allowedRoles={["teacher"]}><TeacherDashboard /></ProtectedRoute>} />
          <Route path="/teacher/students" element={<ProtectedRoute allowedRoles={["teacher"]}><StudentManagement basePath="/teacher" /></ProtectedRoute>} />
          <Route path="/teacher/students/:id" element={<ProtectedRoute allowedRoles={["teacher"]}><StudentProfile basePath="/teacher" /></ProtectedRoute>} />
          <Route path="/teacher/tests" element={<ProtectedRoute allowedRoles={["teacher"]}><FeatureRoute feature="tests"><TestManagement /></FeatureRoute></ProtectedRoute>} />
          <Route path="/teacher/assignments" element={<ProtectedRoute allowedRoles={["teacher"]}><FeatureRoute feature="assignments"><AssignmentManagement /></FeatureRoute></ProtectedRoute>} />
          <Route path="/teacher/attendance" element={<ProtectedRoute allowedRoles={["teacher"]}><FeatureRoute feature="attendance"><AttendanceManagement /></FeatureRoute></ProtectedRoute>} />
          <Route path="/teacher/online-tests" element={<ProtectedRoute allowedRoles={["teacher"]}><OnlineTestManagement basePath="/teacher" /></ProtectedRoute>} />
          <Route path="/teacher/online-tests/new" element={<ProtectedRoute allowedRoles={["teacher"]}><OnlineTestBuilder basePath="/teacher" /></ProtectedRoute>} />
          <Route path="/teacher/online-tests/:id/edit" element={<ProtectedRoute allowedRoles={["teacher"]}><OnlineTestBuilder basePath="/teacher" /></ProtectedRoute>} />
          <Route path="/teacher/online-tests/:id/analytics" element={<ProtectedRoute allowedRoles={["teacher"]}><OnlineTestAnalytics basePath="/teacher" /></ProtectedRoute>} />
          <Route path="/teacher/online-tests/:id/submissions" element={<ProtectedRoute allowedRoles={["teacher"]}><OnlineTestSubmissions basePath="/teacher" /></ProtectedRoute>} />
          <Route path="/teacher/question-bank" element={<ProtectedRoute allowedRoles={["teacher"]}><QuestionBank /></ProtectedRoute>} />
          <Route path="/teacher/whatsapp/logs" element={<ProtectedRoute allowedRoles={["teacher"]}><WhatsAppLogs /></ProtectedRoute>} />
          <Route path="/teacher/whatsapp/broadcast" element={<ProtectedRoute allowedRoles={["teacher"]}><BroadcastMessage /></ProtectedRoute>} />

          {/* ---------------- STUDENT ---------------- */}
          <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={["student"]}><StudentDashboard /></ProtectedRoute>} />
          <Route path="/student/attendance" element={<ProtectedRoute allowedRoles={["student"]}><StudentAttendance /></ProtectedRoute>} />
          <Route path="/student/tests" element={<ProtectedRoute allowedRoles={["student"]}><StudentTests /></ProtectedRoute>} />
          <Route path="/student/assignments" element={<ProtectedRoute allowedRoles={["student"]}><StudentAssignments /></ProtectedRoute>} />
          <Route path="/student/fees" element={<ProtectedRoute allowedRoles={["student"]}><StudentFees /></ProtectedRoute>} />
          <Route path="/student/online-tests" element={<ProtectedRoute allowedRoles={["student"]}><StudentOnlineTests /></ProtectedRoute>} />
          <Route path="/student/online-tests/:id/exam" element={<ProtectedRoute allowedRoles={["student"]}><StudentTestExam /></ProtectedRoute>} />
          <Route path="/student/online-tests/:id/result" element={<ProtectedRoute allowedRoles={["student"]}><StudentTestResult /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </React.Suspense>
      </div>
    </>
  );
}

export default App;
