// src/features/exam/ExamHub.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Settings, PenSquare, Calculator, Table, FileSpreadsheet, Globe, ArrowRight } from 'lucide-react';

export default function ExamHub() {
  const examSubModules = [
    {
      name: 'Exam Setup & Configuration',
      description: 'পরীক্ষার নাম, সাল এবং বিষয়ভিত্তিক পূর্ণাঙ্গ মার্কস ডিস্ট্রিবিউশন নির্ধারণ করুন।',
      path: '/academic/exams/setup',
      icon: Settings,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:border-indigo-300',
      iconBg: 'bg-indigo-100',
    },
    {
      name: 'Marks Entry Panel',
      description: 'শিক্ষকদের জন্য তৈরি করা ইন্টারফেস, যেখানে ক্লাস ও বিষয় অনুযায়ী দ্রুত নম্বর ইনপুট দেওয়া যাবে।',
      path: '/academic/exams/marks',
      icon: PenSquare,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:border-emerald-300',
      iconBg: 'bg-emerald-100',
    },
    {
      name: 'Grade & GPA Calculation',
      description: 'ইনপুট দেওয়া নম্বরের ওপর ভিত্তি করে অটোমেটিক জিপিএ (GPA) এবং গ্রেড প্রসেস ইঞ্জিন।',
      path: '/academic/exams/gpa-engine',
      icon: Calculator,
      color: 'bg-purple-50 text-purple-600 border-purple-100 hover:border-purple-300',
      iconBg: 'bg-purple-100',
    },
    {
      name: 'Tabulation Sheet',
      description: 'পুরো ক্লাসের সব বিষয়ের ফলাফল একসাথে একটি কেন্দ্রীয় শিটে দেখার ব্যবস্থা।',
      path: '/academic/exams/tabulation',
      icon: Table,
      color: 'bg-amber-50 text-amber-600 border-amber-100 hover:border-amber-300',
      iconBg: 'bg-amber-100',
    },
    {
      name: 'PDF Marksheet Generation',
      description: 'স্টুডেন্টদের জন্য প্রাতিষ্ঠানিক লোগো ও সিগনেচারসহ প্রফেশনাল প্রোগ্রেস রিপোর্ট বা নম্বরপত্র প্রিন্ট করুন।',
      path: '/academic/exams/marksheet',
      icon: FileSpreadsheet,
      color: 'bg-rose-50 text-rose-600 border-rose-100 hover:border-rose-300',
      iconBg: 'bg-rose-100',
    },
    {
      name: 'Online Result Portal',
      description: 'অভিভাবক এবং শিক্ষার্থীদের জন্য রোল ও আইডি দিয়ে ঘরে বসে অনলাইনে রেজাল্ট দেখার গেটওয়ে।',
      path: '/academic/exams/portal',
      icon: Globe,
      color: 'bg-teal-50 text-teal-600 border-teal-100 hover:border-teal-300',
      iconBg: 'bg-teal-100',
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/academic" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-gray-600" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Examination & Result System</h2>
          <p className="text-gray-500 mt-1">Manage exam structures, automated grading, and marksheet generation.</p>
        </div>
      </div>

      {/* Grid Menu */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {examSubModules.map((mod) => {
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
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
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