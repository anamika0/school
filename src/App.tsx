import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import Login from './features/auth/Login';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './features/dashboard/Dashboard';

// Students
import StudentList from './features/students/StudentList';
import AdmissionForm from './features/students/AdmissionForm';
import StudentProfile from './features/students/StudentProfile';
import EditStudent from './features/students/EditStudent';

// Teachers
import TeacherList from './features/teachers/TeacherList';
import AddTeacher from './features/teachers/AddTeacher';
import TeacherProfile from './features/teachers/TeacherProfile';
import EditTeacher from './features/teachers/EditTeacher';

// Accounts
import AccountsHub from './features/accounts/AccountsHub';
import CollectFee from './features/accounts/CollectFee';
import ReportsHub from './features/accounts/ReportsHub';
import FinanceReport from './features/accounts/FinanceReport';
import DueReport from './features/accounts/DueReport';
import ExpenseTracking from './features/accounts/ExpenseTracking';
import Payroll from './features/accounts/Payroll';
import ProfitLossReport from './features/accounts/ProfitLossReport';
import FeeConfiguration from './features/accounts/FeeConfiguration';

// Academic
import AcademicHub from './features/academic/AcademicHub';
import ClassManagement from './features/academic/ClassManagement';
import SectionManagement from './features/academic/SectionManagement';
import SubjectManagement from './features/academic/SubjectManagement';
import AcademicManagementHub from './features/academic/AcademicManagementHub';
import SyllabusUpload from './features/academic/SyllabusUpload';
import LessonPlan from './features/academic/LessonPlan';
import AcademicCalendar from './features/academic/AcademicCalendar';

// Attendance
import AttendanceHub from './features/attendance/AttendanceHub';
import StudentAttendance from './features/attendance/StudentAttendance';
import TeacherAttendance from './features/attendance/TeacherAttendance';
import MonthlyReport from './features/attendance/MonthlyReport';
import AbsentSMS from './features/attendance/AbsentSMS';

// Exam & Results
import ExamHub from './features/exam/ExamHub';
import ExamConfiguration from './features/exam/ExamConfiguration';
import MarksEntry from './features/exam/MarksEntry';
import GPAEngine from './features/exam/GPAEngine';
import TabulationSheet from './features/exam/TabulationSheet';
import Marksheet from './features/exam/Marksheet';
import OnlineResultPortal from './features/exam/OnlineResultPortal';
import UserManagement from './features/dashboard/UserManagement';

function App() {
  const { initialize, isLoading, user } = useAuthStore();

  // অ্যাপ লোড হওয়ার সাথে সাথে Auth State চেক করা হবে
  useEffect(() => {
    initialize();
  }, [initialize]);

  // সেশন চেক করা পর্যন্ত একটি লোডিং স্ক্রিন দেখাবে
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg text-gray-600">Loading App...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* ইউজার লগইন করা থাকলে ড্যাশবোর্ডে পাঠাবে, না থাকলে লগইন পেজেই রাখবে */}
        <Route 
          path="/login" 
          element={!user ? <Login /> : <Navigate to="/dashboard" replace />} 
        />
        
        {/* PUBLIC ROUTE FOR PARENTS & STUDENTS (কোনো লগইন লাগবে না) */}
        <Route path="/result" element={<OnlineResultPortal />} />
        
        {/* Protected Routes */}
        <Route 
          path="/" 
          element={user ? <MainLayout /> : <Navigate to="/login" replace />}
        >
          {/* ডিফল্ট রাউট হিসেবে ড্যাশবোর্ডে রিডাইরেক্ট করবে */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<UserManagement />} />
          
          {/* Students Module */}
          <Route path="students">
            <Route index element={<StudentList />} />
            <Route path="admission" element={<AdmissionForm />} />
            <Route path=":id" element={<StudentProfile />} />
            <Route path="edit/:id" element={<EditStudent />} />
          </Route>

          {/* Teachers Module */}
          <Route path="teachers">
            <Route index element={<TeacherList />} />
            <Route path="add" element={<AddTeacher />} />
            <Route path=":id" element={<TeacherProfile />} />
            <Route path="edit/:id" element={<EditTeacher />} />
          </Route>

          {/* Accounts Module */}
          <Route path="accounts">
            <Route index element={<AccountsHub />} />
            <Route path="collect" element={<CollectFee />} />
            <Route path="fee-setup" element={<FeeConfiguration />} />
            <Route path="expenses" element={<ExpenseTracking />} />
            <Route path="payroll" element={<Payroll />} />
            
            <Route path="reports">
              <Route index element={<ReportsHub />} />
              <Route path="finance" element={<FinanceReport />} />
              <Route path="due" element={<DueReport />} />
              <Route path="profit-loss" element={<ProfitLossReport />} />

            </Route>
          </Route>

          {/* Academic Module */}
          <Route path="academic">
            <Route index element={<AcademicHub />} /> 
            
            <Route path="management" element={<AcademicManagementHub />} /> 
            <Route path="classes" element={<ClassManagement />} /> 
            <Route path="sections" element={<SectionManagement />} />
            <Route path="subjects" element={<SubjectManagement />} />
            <Route path="syllabus" element={<SyllabusUpload />} />
            <Route path="lesson-plan" element={<LessonPlan />} />
            <Route path="calendar" element={<AcademicCalendar />} />
            
            {/* Attendance System */}
            <Route path="attendance" element={<AttendanceHub />} />
            <Route path="attendance/student" element={<StudentAttendance />} />
            <Route path="attendance/teacher" element={<TeacherAttendance />} />
            <Route path="attendance/report" element={<MonthlyReport />} />
            <Route path="attendance/sms" element={<AbsentSMS />} />
            
            {/* Exam & Result System (নতুন আর্কিটেকচার) */}
            <Route path="exams">
              <Route index element={<ExamHub />} />
              <Route path="setup" element={<ExamConfiguration />} />
              <Route path="marks" element={<MarksEntry />} />
              <Route path="gpa-engine" element={<GPAEngine />} />
              <Route path="tabulation" element={<TabulationSheet />} />
              <Route path="marksheet" element={<Marksheet />} />
              {/* অ্যাডমিন প্রিভিউ এর জন্য */}
              <Route path="portal" element={<OnlineResultPortal />} />
            </Route>
          </Route>
          
        </Route>

        {/* অন্য যেকোনো ভুল লিংকে গেলে অটোমেটিক ড্যাশবোর্ডে পাঠাবে */}
        <Route 
          path="*" 
          element={<Navigate to={user ? "/dashboard" : "/login"} replace />} 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;