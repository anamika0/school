// src/features/dashboard/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { Link } from 'react-router-dom';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  UserCheck,
  UserPlus, 
  DollarSign, 
  ClipboardCheck, 
  Award,
  ArrowRight,
  Clock,
  RefreshCw
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    todayAttendance: 0
  });
  const [recentStudents, setRecentStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        
        // ১. সক্রিয় ছাত্র-ছাত্রীর সংখ্যা কাউন্ট করা
        const { count: studentCount } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'Active');

        // ২. মোট শিক্ষকের সংখ্যা কাউন্ট করা
        const { count: teacherCount } = await supabase
          .from('teachers')
          .select('*', { count: 'exact', head: true });

        // ৩. মোট ক্লাসের সংখ্যা কাউন্ট করা
        const { count: classCount } = await supabase
          .from('classes')
          .select('*', { count: 'exact', head: true });

        // ৪. সম্প্রতি ভর্তি হওয়া ৫ জন শিক্ষার্থীর লিস্ট আনা
        const { data: recentSt } = await supabase
          .from('students')
          .select('id, first_name, last_name, admission_no, roll_no, created_at')
          .order('created_at', { ascending: false })
          .limit(5);

        setStats({
          totalStudents: studentCount || 0,
          totalTeachers: teacherCount || 0,
          totalClasses: classCount || 0,
          todayAttendance: studentCount ? Math.round(studentCount * 0.92) : 0 // আপাতত একটি এস্টিমেটেড রেশিও দেওয়া হলো
        });

        if (recentSt) setRecentStudents(recentSt);

      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center gap-2 text-indigo-600 font-bold">
        <RefreshCw className="animate-spin" size={24} />
        <span>Loading Dashboard Analytics...</span>
      </div>
    );
  }

  const kpiCards = [
    { title: 'Active Students', value: stats.totalStudents, icon: Users, color: 'text-blue-600 bg-blue-50 border-blue-100' },
    { title: 'Total Teachers', value: stats.totalTeachers, icon: GraduationCap, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    { title: 'Total Classes', value: stats.totalClasses, icon: BookOpen, color: 'text-purple-600 bg-purple-50 border-purple-100' },
    { title: "Today's Attendance (Est.)", value: stats.todayAttendance, icon: UserCheck, color: 'text-amber-600 bg-amber-50 border-amber-100' },
  ];

  const quickActions = [
    { name: 'New Admission', path: '/students/admission', icon: UserPlus, desc: 'নতুন ছাত্র ভর্তি করুন', color: 'hover:border-blue-300 text-blue-600 bg-blue-50/50' },
    { name: 'Collect Fees', path: '/accounts/collect', icon: DollarSign, desc: 'শিক্ষার্থীর বেতন গ্রহণ', color: 'hover:border-emerald-300 text-emerald-600 bg-emerald-50/50' },
    { name: 'Take Attendance', path: '/academic/attendance/student', icon: ClipboardCheck, desc: 'দৈনিক হাজিরা নিশ্চিত করুন', color: 'hover:border-purple-300 text-purple-600 bg-purple-50/50' },
    { name: 'Exam Hub', path: '/academic/exams', icon: Award, desc: 'পরীক্ষা ও রেজাল্ট সিস্টেম', color: 'hover:border-amber-300 text-amber-600 bg-amber-50/50' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="bg-linear-to-r align-middle from-indigo-600 to-indigo-700 p-8 rounded-2xl shadow-sm text-white flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Welcome to Management Dashboard</h2>
          <p className="text-indigo-100 mt-2 font-medium">আপনার শিক্ষা প্রতিষ্ঠানের দৈনন্দিন কার্যক্রম পরিচালনা ও পর্যবেক্ষণের কেন্দ্রীয় প্যানেল।</p>
        </div>
        <div className="hidden md:block text-right text-indigo-200 text-sm font-bold bg-indigo-800/30 px-4 py-2 rounded-xl border border-indigo-500/20">
          <Clock size={16} className="inline mr-1.5 mb-0.5" />
          {new Date().toLocaleDateString('bn-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className={`bg-white p-6 rounded-2xl border shadow-sm flex items-center justify-between transition-all hover:shadow-md`}>
              <div className="space-y-2">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">{card.title}</p>
                <h3 className="text-3xl font-black text-gray-900">{card.value}</h3>
              </div>
              <div className={`p-4 rounded-xl ${card.color.split(' ')[1]} ${card.color.split(' ')[0]}`}>
                <Icon size={26} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Layout (Two Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left/Middle Column: Quick Actions & Navigation */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-3 border-gray-50">
              Quick Management Shortcuts
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickActions.map((act, idx) => {
                const Icon = act.icon;
                return (
                  <Link 
                    key={idx} 
                    to={act.path}
                    className={`p-4 border border-gray-100 rounded-xl transition-all flex items-center gap-4 group ${act.color}`}
                  >
                    <div className="p-3 bg-white rounded-lg shadow-sm group-hover:scale-105 transition-transform">
                      <Icon size={22} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 text-base">{act.name}</h4>
                      <p className="text-xs text-gray-500 mt-0.5 font-medium">{act.desc}</p>
                    </div>
                    <ArrowRight size={16} className="text-gray-400 transform group-hover:translate-x-1 transition-transform" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Recent Admissions */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-fit">
          <div className="flex justify-between items-center mb-4 border-b pb-3 border-gray-50">
            <h3 className="text-lg font-bold text-gray-900">Recent Admissions</h3>
            <Link to="/students" className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1">
              View All <ArrowRight size={12} />
            </Link>
          </div>

          {recentStudents.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">কোনো সাম্প্রতিক ভর্তির তথ্য পাওয়া যায়নি।</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentStudents.map((st) => (
                <div key={st.id} className="py-3 flex justify-between items-center first:pt-0 last:pb-0 hover:bg-gray-50/50 px-1 rounded transition-colors">
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{st.first_name} {st.last_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">ID: {st.admission_no} | Roll: {st.roll_no || 'N/A'}</p>
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded font-bold">
                    {st.created_at ? new Date(st.created_at).toLocaleDateString('bn-BD', { month: 'short', day: 'numeric' }) : 'New'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}