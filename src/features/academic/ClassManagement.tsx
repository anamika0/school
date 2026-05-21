// src/features/academic/ClassManagement.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { Plus, Trash2, ArrowLeft, BookOpen, Save, ToggleLeft, ToggleRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import AcademicTabs from './AcademicTabs';

export default function ClassManagement() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ফর্ম স্টেট
  const [className, setClassName] = useState('');
  const [numericValue, setNumericValue] = useState('');

  // ডেটাবেস থেকে ক্লাসের তালিকা আনা
  const fetchClasses = async () => {
    try {
      setFetchLoading(true);
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('numeric_value', { ascending: true });

      if (error) throw error;
      if (data) setClasses(data);
    } catch (err: any) {
      console.error('Error fetching classes:', err);
      setError(err.message || 'ক্লাস লিস্ট লোড করতে সমস্যা হয়েছে।');
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  // নতুন ক্লাস যুক্ত করার ফাংশন
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim() || !numericValue.trim()) {
      setError('অনুগ্রহ করে সবগুলো ঘর পূরণ করুন।');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const payload = {
        class_name: className.trim(),
        numeric_value: parseInt(numericValue, 10),
        status: 'Active'
      };

      // সরাসরি ইনসার্ট (হ্যাং প্রুফ লজিক)
      const { error: insertError } = await supabase
        .from('classes')
        .insert([payload]);

      if (insertError) throw insertError;

      setSuccessMsg(`"${className}" সফলভাবে যুক্ত হয়েছে!`);
      setClassName('');
      setNumericValue('');
      
      // লিস্ট রিফ্রেশ করা
      fetchClasses();
    } catch (err: any) {
      console.error('Error adding class:', err);
      setError(err.message?.includes('duplicate key') ? 'এই ক্লাস বা নিউমেরিক ভ্যালু ইতিমধ্যে বিদ্যমান!' : err.message);
    } finally {
      setLoading(false);
    }
  };

  // স্ট্যাটাস পরিবর্তন করার ফাংশন (Active/Inactive)
  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    try {
      const { error } = await supabase
        .from('classes')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      fetchClasses(); // লিস্ট রিফ্রেশ
    } catch (err: any) {
      console.error('Error toggling status:', err);
      alert('স্ট্যাটাস পরিবর্তন করা যায়নি।');
    }
  };

  // ক্লাস ডিলিট করার ফাংশন
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`আপনি কি নিশ্চিতভাবে "${name}" ডিলিট করতে চান?`)) return;

    try {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSuccessMsg('ক্লাসটি সফলভাবে ডিলিট করা হয়েছে।');
      fetchClasses();
    } catch (err: any) {
      console.error('Error deleting class:', err);
      alert('ক্লাসটি ডিলিট করা যায়নি।');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <Link to="/academic/management" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-gray-600" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Class Management</h2>
          <p className="text-gray-500 mt-1">Create and manage your school classes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* বাম পাশে: ক্লাস যোগ করার ফর্ম */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Plus className="text-indigo-600" size={20} />
              Add New Class
            </h3>

            {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm font-medium">{error}</div>}
            {successMsg && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-2.5 rounded-lg text-sm font-medium">{successMsg}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Class Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Class 6"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Numeric Value *</label>
                <input
                  type="number"
                  placeholder="e.g. 6 (সিরিয়াল ঠিক রাখার জন্য)"
                  value={numericValue}
                  onChange={(e) => setNumericValue(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                  min="1"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Save size={18} />
                {loading ? 'Saving...' : 'Save Class'}
              </button>
            </form>
          </div>
        </div>

        {/* ডানপাশে: বর্তমান ক্লাসের তালিকা */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="text-indigo-600" size={20} />
                Active Classes List
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-sm">
                    <th className="px-6 py-4 font-semibold text-gray-600">Class Name</th>
                    <th className="px-6 py-4 font-semibold text-gray-600">Numeric Code</th>
                    <th className="px-6 py-4 font-semibold text-gray-600">Status</th>
                    <th className="px-6 py-4 font-semibold text-gray-600 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {fetchLoading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-gray-500 font-medium">লোড হচ্ছে...</td>
                    </tr>
                  ) : classes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-gray-500">কোনো ক্লাস পাওয়া যায়নি। নতুন ক্লাস তৈরি করুন।</td>
                    </tr>
                  ) : (
                    classes.map((cls) => (
                      <tr key={cls.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-900">{cls.class_name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 font-medium">{cls.numeric_value}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${cls.status === 'Active' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-gray-100 text-gray-600'}`}>
                            {cls.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 flex items-center justify-center gap-4">
                          <button
                            onClick={() => toggleStatus(cls.id, cls.status)}
                            title="Toggle Status"
                            className="text-gray-400 hover:text-indigo-600 transition-colors"
                          >
                            {cls.status === 'Active' ? <ToggleRight size={24} className="text-green-500" /> : <ToggleLeft size={24} />}
                          </button>
                          <button
                            onClick={() => handleDelete(cls.id, cls.class_name)}
                            title="Delete Class"
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