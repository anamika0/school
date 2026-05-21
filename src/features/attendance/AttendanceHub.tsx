// src/features/attendance/AttendanceHub.tsx
import { Link } from 'react-router-dom';
import { Users, GraduationCap, CalendarDays, MessageSquare, ArrowRight, ArrowLeft, ClipboardCheck } from 'lucide-react';

export default function AttendanceHub() {
  const attendanceModules = [
    {
      name: 'Student Attendance',
      description: 'ক্লাস ও সেকশন অনুযায়ী স্টুডেন্টদের প্রতিদিনের হাজিরা (Present/Absent) এন্ট্রি করুন।',
      path: '/academic/attendance/student',
      icon: Users,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:border-emerald-300',
      iconBg: 'bg-emerald-100',
    },
    {
      name: 'Teacher Attendance',
      description: 'স্কুলের শিক্ষক এবং স্টাফদের রিয়েল-টাইম চেক-ইন ও চেক-আউট ম্যানেজমেন্ট।',
      path: '/academic/attendance/teacher',
      icon: GraduationCap,
      color: 'bg-blue-50 text-blue-600 border-blue-100 hover:border-blue-300',
      iconBg: 'bg-blue-100',
    },
    {
      name: 'Monthly Report',
      description: 'মাস শেষে কে কতদিন উপস্থিত বা অনুপস্থিত ছিল তার বিস্তারিত রিপোর্ট ও প্রিন্ট।',
      path: '/academic/attendance/report',
      icon: CalendarDays,
      color: 'bg-purple-50 text-purple-600 border-purple-100 hover:border-purple-300',
      iconBg: 'bg-purple-100',
    },
    {
      name: 'Absent SMS Notification',
      description: 'অনুপস্থিত স্টুডেন্টদের অভিভাবকদের কাছে এক ক্লিকে স্বয়ংক্রিয় SMS পাঠানো।',
      path: '/academic/attendance/sms',
      icon: MessageSquare,
      color: 'bg-orange-50 text-orange-600 border-orange-100 hover:border-orange-300',
      iconBg: 'bg-orange-100',
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      {/* Header Area */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/academic" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-gray-600" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardCheck className="text-indigo-600" size={26} />
            Attendance System
          </h2>
          <p className="text-gray-500 mt-1">স্টুডেন্ট ও টিচারদের রিয়েল-টাইম হাজিরা এবং SMS নোটিফিকেশন হাব।</p>
        </div>
      </div>

      {/* মডিউল কার্ড গ্রিড */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {attendanceModules.map((mod) => {
          const Icon = mod.icon;
          return (
            <Link
              key={mod.name}
              to={mod.path}
              className={`p-6 bg-white border rounded-xl shadow-sm transition-all flex flex-col justify-between group hover:shadow-md ${mod.color}`}
            >
              <div className="space-y-4">
                <div className={`p-3 rounded-lg w-fit ${mod.iconBg}`}>
                  <Icon size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {mod.name}
                  </h3>
                  <p className="text-gray-500 text-sm mt-2 leading-relaxed">
                    {mod.description}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm font-bold mt-6 pt-4 border-t border-gray-50 text-indigo-600 w-full justify-end">
                <span>Enter Module</span>
                <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}