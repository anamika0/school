// src/features/academic/SyllabusUpload.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { FileUp, Trash2, ArrowLeft, FileText, Save, Download } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SyllabusUpload() {
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<any[]>([]);
  const [syllabuses, setSyllabuses] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ফর্ম স্টেট
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const fetchData = async () => {
    try {
      setFetchLoading(true);
      
      // ক্লাস লোড
      const { data: classData } = await supabase.from('classes').select('*').order('numeric_value', { ascending: true });
      if (classData) setClasses(classData);

      // সাবজেক্ট লোড
      const { data: subjectData } = await supabase.from('subjects').select('*');
      if (subjectData) setSubjects(subjectData);

      // সিলেবাস লোড
      const { data: syllabusData } = await supabase
        .from('syllabuses')
        .select('*, classes(class_name), subjects(subject_name)')
        .order('created_at', { ascending: false });
      if (syllabusData) setSyllabuses(syllabusData);

    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ক্লাস সিলেক্ট করলে সাবজেক্ট ফিল্টার হওয়া
  useEffect(() => {
    if (selectedClassId) {
      const filtered = subjects.filter(s => s.class_id === selectedClassId);
      setFilteredSubjects(filtered);
      setSelectedSubjectId(''); // ক্লাস চেঞ্জ হলে সাবজেক্ট রিসেট হবে
    } else {
      setFilteredSubjects([]);
    }
  }, [selectedClassId, subjects]);

  // আপলোড হ্যান্ডলার
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !selectedSubjectId || !title.trim() || !file) {
      setError('অনুগ্রহ করে সবগুলো ঘর পূরণ করুন এবং একটি ফাইল সিলেক্ট করুন।');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // ১. ফাইল স্টোরেজে আপলোড করা
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `syllabus/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('academic-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // ২. ফাইলের পাবলিক URL নেওয়া
      const { data: { publicUrl } } = supabase.storage
        .from('academic-files')
        .getPublicUrl(filePath);

      // ৩. ডেটাবেসে এন্ট্রি করা
      const { error: dbError } = await supabase
        .from('syllabuses')
        .insert([{
          class_id: selectedClassId,
          subject_id: selectedSubjectId,
          title: title.trim(),
          file_url: publicUrl,
          file_path: filePath
        }]);

      if (dbError) throw dbError;

      setSuccessMsg('সিলেবাস সফলভাবে আপলোড হয়েছে!');
      setTitle('');
      setFile(null);
      (document.getElementById('fileUpload') as HTMLInputElement).value = '';
      
      fetchData();
    } catch (err: any) {
      console.error('Error uploading syllabus:', err);
      setError(err.message || 'ফাইল আপলোড করতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  // ডিলিট হ্যান্ডলার
  const handleDelete = async (id: string, filePath: string) => {
    if (!window.confirm('আপনি কি নিশ্চিতভাবে এই সিলেবাসটি ডিলিট করতে চান?')) return;

    try {
      // ১. স্টোরেজ থেকে ফাইল ডিলিট
      await supabase.storage.from('academic-files').remove([filePath]);
      
      // ২. ডেটাবেস থেকে ডিলিট
      const { error } = await supabase.from('syllabuses').delete().eq('id', id);
      if (error) throw error;

      setSuccessMsg('সিলেবাসটি সফলভাবে ডিলিট করা হয়েছে।');
      fetchData();
    } catch (err) {
      alert('ডিলিট করতে সমস্যা হয়েছে।');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div className="flex items-center gap-4 mb-2">
        <Link to="/academic/management" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-gray-600" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Syllabus Management</h2>
          <p className="text-gray-500 mt-1">Upload and manage class syllabuses (PDF/Doc).</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ফর্ম অংশ */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileUp className="text-pink-600" size={20} />
              Upload Syllabus
            </h3>

            {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm font-medium">{error}</div>}
            {successMsg && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-2.5 rounded-lg text-sm font-medium">{successMsg}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Class *</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none bg-white"
                  required
                >
                  <option value="">-- ক্লাস নির্বাচন করুন --</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>{cls.class_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Subject *</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none bg-white"
                  required
                  disabled={!selectedClassId}
                >
                  <option value="">-- বিষয় নির্বাচন করুন --</option>
                  {filteredSubjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.subject_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Syllabus Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Half-Yearly Syllabus 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Attach File (PDF/Doc) *</label>
                <input
                  type="file"
                  id="fileUpload"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-pink-600 text-white py-2.5 rounded-lg font-bold hover:bg-pink-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Save size={18} />
                {loading ? 'Uploading...' : 'Upload File'}
              </button>
            </form>
          </div>
        </div>

        {/* টেবিল অংশ */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FileText className="text-pink-600" size={20} />
                Uploaded Syllabuses
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-sm">
                    <th className="px-6 py-4 font-semibold text-gray-600">Details</th>
                    <th className="px-6 py-4 font-semibold text-gray-600">Class & Subject</th>
                    <th className="px-6 py-4 font-semibold text-gray-600 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {fetchLoading ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-10 text-center text-gray-500 font-medium">লোড হচ্ছে...</td>
                    </tr>
                  ) : syllabuses.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-10 text-center text-gray-500">কোনো সিলেবাস আপলোড করা হয়নি।</td>
                    </tr>
                  ) : (
                    syllabuses.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-900">{item.title}</p>
                          <p className="text-xs text-gray-500 mt-1">{new Date(item.created_at).toLocaleDateString()}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-gray-800">{item.classes?.class_name}</p>
                          <p className="text-xs text-gray-500">{item.subjects?.subject_name}</p>
                        </td>
                        <td className="px-6 py-4 flex items-center justify-center gap-3">
                          <a
                            href={item.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
                          >
                            <Download size={16} /> View
                          </a>
                          <button
                            onClick={() => handleDelete(item.id, item.file_path)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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