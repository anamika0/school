// src/features/academic/LessonPlan.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { ClipboardList, Trash2, ArrowLeft, BookOpen, Save, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LessonPlan() {
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<any[]>([]);
  const [lessonPlans, setLessonPlans] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ফর্ম স্টেট
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [chapterName, setChapterName] = useState('');
  const [topicDetails, setTopicDetails] = useState('');
  const [targetDate, setTargetDate] = useState('');

  const fetchData = async () => {
    try {
      setFetchLoading(true);
      
      const { data: classData } = await supabase.from('classes').select('*').order('numeric_value', { ascending: true });
      if (classData) setClasses(classData);

      const { data: subjectData } = await supabase.from('subjects').select('*');
      if (subjectData) setSubjects(subjectData);

      const { data: planData } = await supabase
        .from('lesson_plans')
        .select('*, classes(class_name), subjects(subject_name)')
        .order('target_date', { ascending: true });
      if (planData) setLessonPlans(planData);

    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      const filtered = subjects.filter(s => s.class_id === selectedClassId);
      setFilteredSubjects(filtered);
      setSelectedSubjectId('');
    } else {
      setFilteredSubjects([]);
    }
  }, [selectedClassId, subjects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !selectedSubjectId || !chapterName.trim() || !targetDate) {
      setError('অনুগ্রহ করে সবগুলো প্রয়োজনীয় ঘর পূরণ করুন।');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const { error: dbError } = await supabase
        .from('lesson_plans')
        .insert([{
          class_id: selectedClassId,
          subject_id: selectedSubjectId,
          chapter_name: chapterName.trim(),
          topic_details: topicDetails.trim(),
          target_date: targetDate,
          status: 'Pending'
        }]);

      if (dbError) throw dbError;

      setSuccessMsg('লেসন প্ল্যান সফলভাবে যুক্ত হয়েছে!');
      setChapterName('');
      setTopicDetails('');
      // ক্লাস এবং সাবজেক্ট সিলেক্টেড থাকবে পরবর্তী এন্ট্রির সুবিধার জন্য
      
      fetchData();
    } catch (err: any) {
      console.error('Error adding lesson plan:', err);
      setError('লেসন প্ল্যান সেভ করতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  // স্ট্যাটাস আপডেট করার ফাংশন
  const updateStatus = async (id: string, currentStatus: string) => {
    const statusFlow: Record<string, string> = {
      'Pending': 'In Progress',
      'In Progress': 'Completed',
      'Completed': 'Pending'
    };
    
    const newStatus = statusFlow[currentStatus];

    try {
      const { error } = await supabase
        .from('lesson_plans')
        .update({ status: newStatus })
        .eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err) {
      alert('স্ট্যাটাস আপডেট করা যায়নি।');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('আপনি কি নিশ্চিতভাবে এই লেসন প্ল্যানটি ডিলিট করতে চান?')) return;
    try {
      const { error } = await supabase.from('lesson_plans').delete().eq('id', id);
      if (error) throw error;
      setSuccessMsg('সফলভাবে ডিলিট করা হয়েছে।');
      fetchData();
    } catch (err) {
      alert('ডিলিট করতে সমস্যা হয়েছে।');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 bg-green-100 text-green-700 rounded"><CheckCircle size={14}/> Completed</span>;
      case 'In Progress':
        return <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 bg-blue-100 text-blue-700 rounded"><Clock size={14}/> In Progress</span>;
      default:
        return <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 bg-orange-100 text-orange-700 rounded"><AlertCircle size={14}/> Pending</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      <div className="flex items-center gap-4 mb-2">
        <Link to="/academic/management" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-gray-600" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Lesson Plan</h2>
          <p className="text-gray-500 mt-1">Create and track daily lesson plans.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ফর্ম অংশ */}
        <div className="xl:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ClipboardList className="text-orange-600" size={20} />
              Add Lesson Plan
            </h3>

            {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm font-medium">{error}</div>}
            {successMsg && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-2.5 rounded-lg text-sm font-medium">{successMsg}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Class *</label>
                <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white" required>
                  <option value="">-- ক্লাস নির্বাচন করুন --</option>
                  {classes.map((cls) => (<option key={cls.id} value={cls.id}>{cls.class_name}</option>))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Subject *</label>
                <select value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white" required disabled={!selectedClassId}>
                  <option value="">-- বিষয় নির্বাচন করুন --</option>
                  {filteredSubjects.map((sub) => (<option key={sub.id} value={sub.id}>{sub.subject_name}</option>))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Chapter Name *</label>
                <input type="text" placeholder="e.g. Chapter 1: Introduction" value={chapterName} onChange={(e) => setChapterName(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Target Date *</label>
                <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Topic Details (Optional)</label>
                <textarea placeholder="Brief description of the topics to cover..." value={topicDetails} onChange={(e) => setTopicDetails(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none" rows={3}></textarea>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-orange-600 text-white py-2.5 rounded-lg font-bold hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 shadow-sm">
                <Save size={18} />
                {loading ? 'Saving...' : 'Save Plan'}
              </button>
            </form>
          </div>
        </div>

        {/* টেবিল অংশ */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="text-orange-600" size={20} />
                Upcoming & Running Plans
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-sm">
                    <th className="px-6 py-4 font-semibold text-gray-600 min-w-40">Date</th>
                    <th className="px-6 py-4 font-semibold text-gray-600">Class & Subject</th>
                    <th className="px-6 py-4 font-semibold text-gray-600 min-w-52">Chapter & Topics</th>
                    <th className="px-6 py-4 font-semibold text-gray-600">Status</th>
                    <th className="px-6 py-4 font-semibold text-gray-600 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {fetchLoading ? (
                    <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500 font-medium">লোড হচ্ছে...</td></tr>
                  ) : lessonPlans.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">কোনো লেসন প্ল্যান তৈরি করা হয়নি।</td></tr>
                  ) : (
                    lessonPlans.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-bold text-gray-700">
                          {new Date(item.target_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-gray-900">{item.classes?.class_name}</p>
                          <p className="text-xs text-gray-500">{item.subjects?.subject_name}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-800 text-sm">{item.chapter_name}</p>
                          {item.topic_details && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.topic_details}</p>}
                        </td>
                        <td className="px-6 py-4 cursor-pointer" onClick={() => updateStatus(item.id, item.status)} title="Click to change status">
                          {getStatusBadge(item.status)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}