// src/features/academic/AcademicHub.tsx
import { Link } from 'react-router-dom';
import { BookOpen, ClipboardCheck, Award, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function AcademicHub() {
  const academicModules = [
    {
      id: 'management',
      title: 'Academic Management',
      description: 'স্কুলের মূল কাঠামো, ক্লাস, বিষয় এবং সিলেবাস পরিচালনা করুন।',
      path: '/academic/management',
      icon: BookOpen,
      color: 'bg-blue-50 text-blue-600 border-blue-100 hover:border-blue-300',
      iconBg: 'bg-blue-100',
      features: [
        'Class Management',
        'Section Management',
        'Subject Management',
        'Syllabus Upload',
        'Lesson Plan',
        'Academic Calendar'
      ]
    },
    {
      id: 'attendance',
      title: 'Attendance System',
      description: 'স্টুডেন্ট ও টিচারদের রিয়েল-টাইম হাজিরা এবং SMS নোটিফিকেশন।',
      path: '/academic/attendance',
      icon: ClipboardCheck,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:border-emerald-300',
      iconBg: 'bg-emerald-100',
      features: [
        'Student Attendance',
        'Teacher Attendance',
        'Monthly Report',
        'Absent SMS Notification (Auto)'
      ]
    },
    {
      id: 'exams',
      title: 'Exam & Result System',
      description: 'সম্পূর্ণ স্বয়ংক্রিয় রেজাল্ট প্রসেসিং এবং মার্কশিট জেনারেশন।',
      path: '/academic/exams',
      icon: Award,
      color: 'bg-purple-50 text-purple-600 border-purple-100 hover:border-purple-300',
      iconBg: 'bg-purple-100',
      features: [
        'Exam Setup & Marks Entry',
        'Grade & GPA Calculation',
        'Tabulation & Progress Report',
        'Auto Result Calculation (Advanced)',
        'PDF Marksheet Generation (Advanced)',
        'Online Result Portal (Advanced)'
      ]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      <div className="border-b border-gray-200 pb-5">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BookOpen className="text-indigo-600" size={28} />
          Academic & Examination Hub
        </h2>
        <p className="text-gray-500 mt-2">
          একাডেমিক কার্যক্রম, হাজিরা এবং পরীক্ষার ফলাফল সংক্রান্ত সমস্ত সেটিংস ও মডিউল এখান থেকে নিয়ন্ত্রণ করুন।
        </p>
      </div>

      {/* মডিউল কার্ড গ্রিড (৩ কলাম) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {academicModules.map((mod) => {
          const Icon = mod.icon;
          return (
            <div
              key={mod.id}
              className={`bg-white border rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group ${mod.color.replace('bg-', 'hover:border-').split(' ')[0]}`}
            >
              {/* Card Header */}
              <div className={`p-6 pb-4 border-b border-gray-100/50 ${mod.color.split(' ')[0]} bg-opacity-30`}>
                <div className="flex items-center gap-4 mb-3">
                  <div className={`p-3 rounded-xl ${mod.iconBg}`}>
                    <Icon size={26} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">
                    {mod.title}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 font-medium">
                  {mod.description}
                </p>
              </div>

              {/* Feature List (আপনার দেওয়া লিস্ট অনুযায়ী) */}
              <div className="p-6 flex-1 bg-white">
                <ul className="space-y-3">
                  {mod.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-700 font-medium">
                      <CheckCircle2 size={16} className={`mt-0.5 shrink-0 ${mod.color.split(' ')[1]}`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Card Footer / Button */}
              <div className="p-4 bg-gray-50 border-t border-gray-100">
                <Link
                  to={mod.path}
                  className={`w-full py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-bold transition-colors ${mod.iconBg} ${mod.color.split(' ')[1]} hover:brightness-95`}
                >
                  <span>Enter Module</span>
                  <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}