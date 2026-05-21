import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import Login from './features/auth/Login';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './features/dashboard/Dashboard';
import StudentList from './features/students/StudentList';
import AdmissionForm from './features/students/AdmissionForm';
import StudentProfile from './features/students/StudentProfile';
import EditStudent from './features/students/EditStudent';
import TeacherList from './features/teachers/TeacherList';
import AddTeacher from './features/teachers/AddTeacher';
import TeacherProfile from './features/teachers/TeacherProfile';
import EditTeacher from './features/teachers/EditTeacher';
import AccountsHub from './features/accounts/AccountsHub';
import CollectFee from './features/accounts/CollectFee';
import ReportsHub from './features/accounts/ReportsHub';
import FinanceReport from './features/accounts/FinanceReport';
import DueReport from './features/accounts/DueReport';
import AcademicHub from './features/academic/AcademicHub';
import ClassManagement from './features/academic/ClassManagement';
import SectionManagement from './features/academic/SectionManagement';
import SubjectManagement from './features/academic/SubjectManagement';
import AcademicManagementHub from './features/academic/AcademicManagementHub';
import SyllabusUpload from './features/academic/SyllabusUpload';
import LessonPlan from './features/academic/LessonPlan';
import AcademicCalendar from './features/academic/AcademicCalendar';
import AttendanceHub from './features/attendance/AttendanceHub';
import StudentAttendance from './features/attendance/StudentAttendance';
import TeacherAttendance from './features/attendance/TeacherAttendance';
import MonthlyReport from './features/attendance/MonthlyReport';
import AbsentSMS from './features/attendance/AbsentSMS';
import ExpenseTracking from './features/accounts/ExpenseTracking';
import Payroll from './features/accounts/Payroll';
import ProfitLossReport from './features/accounts/ProfitLossReport';
import FeeConfiguration from './features/accounts/FeeConfiguration';
function App() {
  const { initialize, isLoading, user } = useAuthStore();

  // অ্যাপ লোড হওয়ার সাথে সাথে Auth State চেক করা হবে
  useEffect(() => {
    initialize();
  }, [initialize]);

  // সেশন চেক করা পর্যন্ত একটি লোডিং স্ক্রিন দেখাবে (আপনার দেওয়া ডিজাইন অনুযায়ী)
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
        
        {/* Protected Routes: ইউজার লগইন করা না থাকলে লগইন পেজে পাঠাবে, থাকলে MainLayout-এর ভেতর ঢুকতে দেবে */}
        <Route 
          path="/" 
          element={user ? <MainLayout /> : <Navigate to="/login" replace />}
        >
          {/* ডিফল্ট রাউট হিসেবে ড্যাশবোর্ডে রিডাইরেক্ট করবে */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          
          {/* আমাদের নতুন ড্যাশবোর্ড পেজ */}
          <Route path="dashboard" element={<Dashboard />} />
          
          {/* পরবর্তীতে আমরা এখানে স্টুডেন্ট, টিচার পেজগুলো অ্যাড করবো */}
          {/* আগের ডামি <Route path="students" ... /> মুছে নিচের এটি দিন */}
          <Route path="students">
            <Route index element={<StudentList />} />
            {/* ডামি কোড মুছে নিচের এই লাইনটি দিন */}
            <Route path="admission" element={<AdmissionForm />} />
            <Route path=":id" element={<StudentProfile />} />
            <Route path="edit/:id" element={<EditStudent />} />
    
          </Route>
         <Route path="teachers">
  <Route index element={<TeacherList />} />
  <Route path="add" element={<AddTeacher />} />
  <Route path=":id" element={<TeacherProfile />} />
    <Route path="edit/:id" element={<EditTeacher />} />
</Route>
<Route path="accounts">
    <Route index element={<AccountsHub />} /> {/* /accounts এ গেলে কার্ড ২টি দেখাবে */}
    <Route path="collect" element={<CollectFee />} /> {/* /accounts/collect */}
    <Route path="fee-setup" element={<FeeConfiguration />} />
    <Route path="expenses" element={<ExpenseTracking />} />
    <Route path="payroll" element={<Payroll />} />
    <Route path="reports/profit-loss" element={<ProfitLossReport />} />
    {/* রিপোর্টস এর সাব-হাব */}
    <Route path="reports">
      <Route index element={<ReportsHub />} />
      <Route path="finance" element={<FinanceReport />} />
      <Route path="due" element={<DueReport />} />
      
    </Route>
  </Route>
        <Route path="academic">
    <Route index element={<AcademicHub />} /> 
    
    {/* সাব-হাব */}
    <Route path="management" element={<AcademicManagementHub />} /> 
    
    {/* এই ৩টি লাইন খুব সাবধানে চেক করুন */}
    <Route path="classes" element={<ClassManagement />} /> 
    <Route path="sections" element={<SectionManagement />} />
    <Route path="subjects" element={<SubjectManagement />} />
    <Route path="syllabus" element={<SyllabusUpload />} />
    <Route path="lesson-plan" element={<LessonPlan />} />
   <Route path="calendar" element={<AcademicCalendar />} />
   {/* Attendance System Routes */}
   <Route path="attendance" element={<AttendanceHub />} />
   <Route path="attendance/student" element={<StudentAttendance />} />
    <Route path="attendance/student" element={<div className="p-6">Student Attendance Coming Soon...</div>} />
    <Route path="attendance/teacher" element={<TeacherAttendance />} />
    <Route path="attendance/report" element={<MonthlyReport />} />
    <Route path="attendance/sms" element={<AbsentSMS />} />
    
  </Route>
          
        </Route>

        {/* অন্য যেকোনো ভুল লিংকে গেলে অটোমেটিক সঠিক জায়গায় পাঠাবে */}
        <Route 
          path="*" 
          element={<Navigate to={user ? "/dashboard" : "/login"} replace />} 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;