// src/features/academic/AcademicManagementHub.tsx
import { Link } from 'react-router-dom';
import { LayoutList, Layers, BookOpen, FileText, ClipboardList, Calendar, ArrowRight, ArrowLeft } from 'lucide-react';

export default function AcademicManagementHub() {
  const managementModules = [
    {
      name: 'Class Management',
      description: 'স্কুলের নতুন ক্লাস তৈরি করুন এবং সেগুলোর স্ট্যাটাস ও ক্রম পরিচালনা করুন।',
      path: '/academic/classes',
      icon: LayoutList,
      color: 'bg-blue-50 text-blue-600 border-blue-100 hover:border-blue-300',
      iconBg: 'bg-blue-100',
    },
    {
      name: 'Section Management',
      description: 'নির্দিষ্ট ক্লাসের অধীনে বিভিন্ন সেকশন (যেমন: A, B, Science, Arts) তৈরি করুন।',
      path: '/academic/sections',
      icon: Layers,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:border-emerald-300',
      iconBg: 'bg-emerald-100',
    },
    {
      name: 'Subject Management',
      description: 'ক্লাস অনুযায়ী বাধ্যতামূলক এবং ঐচ্ছিক বিষয়গুলো (Subjects) নির্ধারণ করুন।',
      path: '/academic/subjects',
      icon: BookOpen,
      color: 'bg-purple-50 text-purple-600 border-purple-100 hover:border-purple-300',
      iconBg: 'bg-purple-100',
    },
    {
      name: 'Syllabus Upload',
      description: 'ক্লাস ও বিষয় অনুযায়ী সিলেবাসের PDF বা ডকুমেন্ট আপলোড এবং ম্যানেজ করুন।',
      path: '/academic/syllabus',
      icon: FileText,
      color: 'bg-pink-50 text-pink-600 border-pink-100 hover:border-pink-300',
      iconBg: 'bg-pink-100',
    },
    {
      name: 'Lesson Plan',
      description: 'শিক্ষকদের জন্য চ্যাপ্টার অনুযায়ী লেসন প্ল্যান তৈরি এবং ট্র্যাকিং সিস্টেম।',
      path: '/academic/lesson-plan',
      icon: ClipboardList,
      color: 'bg-orange-50 text-orange-600 border-orange-100 hover:border-orange-300',
      iconBg: 'bg-orange-100',
    },
    {
      name: 'Academic Calendar',
      description: 'ছুটির দিন, পরীক্ষার তারিখ এবং স্কুলের বার্ষিক ইভেন্ট ক্যালেন্ডার তৈরি করুন।',
      path: '/academic/calendar',
      icon: Calendar,
      color: 'bg-teal-50 text-teal-600 border-teal-100 hover:border-teal-300',
      iconBg: 'bg-teal-100',
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      {/* Header Area */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/academic" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-gray-600" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <LayoutList className="text-indigo-600" size={26} />
            Academic Management
          </h2>
          <p className="text-gray-500 mt-1">একাডেমিক কাঠামোর সম্পূর্ণ কন্ট্রোল প্যানেল।</p>
        </div>
      </div>

      {/* মডিউল কার্ড গ্রিড (এখন ৬টি কার্ড দেখাবে) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {managementModules.map((mod) => {
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
                <span>Enter Setup</span>
                <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}