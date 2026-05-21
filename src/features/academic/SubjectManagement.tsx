// src/features/academic/SubjectManagement.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { Plus, Trash2, ArrowLeft, BookOpen, Save, ToggleLeft, ToggleRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SubjectManagement() {
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ফর্ম স্টেট
  const [selectedClassId, setSelectedClassId] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectType, setSubjectType] = useState('Mandatory');

  // ডেটাবেস থেকে ডেটা লোড করা
  const fetchData = async () => {
    try {
      setFetchLoading(true);
      
      // ১. ক্লাসের তালিকা আনা
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('*')
        .order('numeric_value', { ascending: true });
      if (classError) throw classError;
      setClasses(classData || []);

      // ২. সাবজেক্টের তালিকা আনা (classes টেবিলের সাথে জয়েন করে)
      const { data: subjectData, error: subjectError } = await supabase
        .from('subjects')
        .select(`
          *,
          classes (class_name, numeric_value)
        `)
        .order('created_at', { ascending: false });
      if (subjectError) throw subjectError;
      setSubjects(subjectData || []);

    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError('ডেটা লোড করতে সমস্যা হয়েছে।');
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // নতুন সাবজেক্ট যুক্ত করার ফাংশন
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !subjectName.trim()) {
      setError('অনুগ্রহ করে ক্লাস সিলেক্ট করুন এবং বিষয়ের নাম দিন।');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const payload = {
        class_id: selectedClassId,
        subject_name: subjectName.trim(),
        subject_code: subjectCode.trim() || null,
        subject_type: subjectType,
        status: 'Active'
      };

      const { error: insertError } = await supabase
        .from('subjects')
        .insert([payload]);

      if (insertError) throw insertError;

      setSuccessMsg(`বিষয় "${subjectName}" সফলভাবে যুক্ত হয়েছে!`);
      setSubjectName('');
      setSubjectCode('');
      // ক্লাস এবং টাইপ সিলেক্টেড থাকবে সুবিধার জন্য
      
      fetchData();
    } catch (err: any) {
      console.error('Error adding subject:', err);
      setError(err.message?.includes('duplicate key') ? 'এই ক্লাসে এই নামের বিষয় ইতিমধ্যে বিদ্যমান!' : err.message);
    } finally {
      setLoading(false);
    }
  };

  // স্ট্যাটাস টগল করা
  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    try {
      const { error } = await supabase
        .from('subjects')
        .update({ status: newStatus })
        .eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err) {
      alert('স্ট্যাটাস পরিবর্তন করা যায়নি।');
    }
  };

  // ডিলিট ফাংশন
  const handleDelete = async (id: string, name: string, className: string) => {
    if (!window.confirm(`আপনি কি নিশ্চিতভাবে ${className}-এর "${name}" বিষয়টি ডিলিট করতে চান?`)) return;

    try {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setSuccessMsg('বিষয়টি সফলভাবে ডিলিট করা হয়েছে।');
      fetchData();
    } catch (err) {
      alert('বিষয়টি ডিলিট করা যায়নি।');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div className="flex items-center gap-4 mb-2">
        <Link to="/academic/management" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-gray-600" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Subject Management</h2>
          <p className="text-gray-500 mt-1">Assign and manage subjects for each class.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ফর্ম অংশ */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Plus className="text-indigo-600" size={20} />
              Add New Subject
            </h3>

            {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm font-medium">{error}</div>}
            {successMsg && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-2.5 rounded-lg text-sm font-medium">{successMsg}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Class *</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  required
                >
                  <option value="">-- ক্লাস নির্বাচন করুন --</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>{cls.class_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Mathematics, English"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject Code (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. MAT-101"
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject Type</label>
                <select
                  value={subjectType}
                  onChange={(e) => setSubjectType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                >
                  <option value="Mandatory">Mandatory (বাধ্যতামূলক)</option>
                  <option value="Optional">Optional (ঐচ্ছিক)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading || classes.length === 0}
                className={`w-full bg-indigo-600 text-white py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-sm ${classes.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Save size={18} />
                {loading ? 'Saving...' : 'Save Subject'}
              </button>
            </form>
          </div>
        </div>

        {/* টেবিল অংশ */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="text-indigo-600" size={20} />
                Active Subjects List
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-sm">
                    <th className="px-6 py-4 font-semibold text-gray-600">Class</th>
                    <th className="px-6 py-4 font-semibold text-gray-600">Subject Details</th>
                    <th className="px-6 py-4 font-semibold text-gray-600">Type</th>
                    <th className="px-6 py-4 font-semibold text-gray-600">Status</th>
                    <th className="px-6 py-4 font-semibold text-gray-600 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {fetchLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-gray-500 font-medium">লোড হচ্ছে...</td>
                    </tr>
                  ) : subjects.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-gray-500">কোনো বিষয় পাওয়া যায়নি।</td>
                    </tr>
                  ) : (
                    subjects.map((sub) => (
                      <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-900">{sub.classes?.class_name || 'Unknown'}</td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-800 font-bold">{sub.subject_name}</p>
                          {sub.subject_code && <p className="text-xs text-gray-500">Code: {sub.subject_code}</p>}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${sub.subject_type === 'Mandatory' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>
                            {sub.subject_type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${sub.status === 'Active' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-gray-100 text-gray-600'}`}>
                            {sub.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 flex items-center justify-center gap-4">
                          <button
                            onClick={() => toggleStatus(sub.id, sub.status)}
                            className="text-gray-400 hover:text-indigo-600 transition-colors"
                          >
                            {sub.status === 'Active' ? <ToggleRight size={24} className="text-green-500" /> : <ToggleLeft size={24} />}
                          </button>
                          <button
                            onClick={() => handleDelete(sub.id, sub.subject_name, sub.classes?.class_name)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
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