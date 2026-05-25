   // src/features/academic/ExamConfiguration.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { ArrowLeft, BookOpen, FileText, Settings, Plus, Trash2, Save, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ExamConfiguration() {
  const [activeTab, setActiveTab] = useState<'exams' | 'subjects' | 'setup'>('exams');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // --- States ---
  const [exams, setExams] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);

  // Form States
  const [newExamName, setNewExamName] = useState('');
  const [newExamYear, setNewExamYear] = useState(new Date().getFullYear());
  const [newSubName, setNewSubName] = useState('');
  const [newSubCode, setNewSubCode] = useState('');

  // Setup States
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [setupData, setSetupData] = useState<any[]>([]); // Array of subjects with marks

  // --- Fetch Data ---
  const loadInitialData = async () => {
    try {
      const { data: exData } = await supabase.from('exams').select('*').order('created_at', { ascending: false });
      if (exData) setExams(exData);

      const { data: subData } = await supabase.from('subjects').select('*').order('subject_name');
      if (subData) setSubjects(subData);

      const { data: clsData } = await supabase.from('classes').select('*').order('numeric_value');
      if (clsData) setClasses(clsData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // --- Handlers: Exams ---
  const handleAddExam = async () => {
    if (!newExamName.trim()) return;
    try {
      const { error } = await supabase.from('exams').insert([{ exam_name: newExamName, exam_year: newExamYear }]);
      if (error) throw error;
      setNewExamName('');
      loadInitialData();
      showSuccess("পরীক্ষা সফলভাবে যুক্ত হয়েছে!");
    } catch (err: any) {
      showError("এই নামের পরীক্ষা এই সালে ইতিমধ্যে আছে।");
    }
  };

  const handleDeleteExam = async (id: string) => {
    if (!window.confirm("পরীক্ষাটি মুছে ফেলতে চান?")) return;
    await supabase.from('exams').delete().eq('id', id);
    loadInitialData();
  };

  // --- Handlers: Subjects ---
  const handleAddSubject = async () => {
    if (!newSubName.trim()) return;
    try {
      const { error } = await supabase.from('subjects').insert([{ subject_name: newSubName, subject_code: newSubCode }]);
      if (error) throw error;
      setNewSubName(''); setNewSubCode('');
      loadInitialData();
      showSuccess("বিষয় সফলভাবে যুক্ত হয়েছে!");
    } catch (err: any) {
      showError("এই বিষয়ের নাম ইতিমধ্যে আছে।");
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!window.confirm("বিষয়টি মুছে ফেলতে চান?")) return;
    await supabase.from('subjects').delete().eq('id', id);
    loadInitialData();
  };

  // --- Handlers: Setup ---
  useEffect(() => {
    // Load Setup when Exam or Class changes
    const fetchSetup = async () => {
      if (!selectedExamId || !selectedClassId) {
        setSetupData([]);
        return;
      }
      
      const { data: existingSetup } = await supabase
        .from('exam_setup')
        .select('*')
        .eq('exam_id', selectedExamId)
        .eq('class_id', selectedClassId);

      // Create a merged list of all subjects, injecting existing marks if configured
      const merged = subjects.map(sub => {
        const exist = existingSetup?.find(s => s.subject_id === sub.id);
        return {
          subject_id: sub.id,
          subject_name: sub.subject_name,
          is_included: !!exist,
          full_marks: exist ? exist.full_marks : 100,
          passing_marks: exist ? exist.passing_marks : 33,
          written_marks: exist ? exist.written_marks : 70,
          mcq_marks: exist ? exist.mcq_marks : 30,
          practical_marks: exist ? exist.practical_marks : 0,
        };
      });
      setSetupData(merged);
    };
    fetchSetup();
  }, [selectedExamId, selectedClassId, subjects]);

  const updateSetupField = (index: number, field: string, value: any) => {
    const updated = [...setupData];
    updated[index] = { ...updated[index], [field]: value };
    setSetupData(updated);
  };

  const handleSaveSetup = async () => {
    if (!selectedExamId || !selectedClassId) return;
    setLoading(true);
    try {
      // 1. Delete old setup for this exam + class
      await supabase.from('exam_setup').delete().eq('exam_id', selectedExamId).eq('class_id', selectedClassId);

      // 2. Insert selected subjects
      const toInsert = setupData
        .filter(s => s.is_included)
        .map(s => ({
          exam_id: selectedExamId,
          class_id: selectedClassId,
          subject_id: s.subject_id,
          full_marks: s.full_marks,
          passing_marks: s.passing_marks,
          written_marks: s.written_marks,
          mcq_marks: s.mcq_marks,
          practical_marks: s.practical_marks
        }));

      if (toInsert.length > 0) {
        const { error } = await supabase.from('exam_setup').insert(toInsert);
        if (error) throw error;
      }
      showSuccess("মার্কস ডিস্ট্রিবিউশন সেভ হয়েছে!");
    } catch (err: any) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Utility
  const showSuccess = (msg: string) => { setSuccessMsg(msg); setError(null); setTimeout(() => setSuccessMsg(null), 3000); };
  const showError = (msg: string) => { setError(msg); setSuccessMsg(null); setTimeout(() => setError(null), 4000); };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-gray-600" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Exam & Marks Configuration</h2>
          <p className="text-gray-500 mt-1">Manage exams, subjects, and class-wise marks distribution.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button onClick={() => setActiveTab('exams')} className={`px-6 py-3 font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'exams' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <FileText size={18} /> Exams
        </button>
        <button onClick={() => setActiveTab('subjects')} className={`px-6 py-3 font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'subjects' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <BookOpen size={18} /> Subjects
        </button>
        <button onClick={() => setActiveTab('setup')} className={`px-6 py-3 font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'setup' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <Settings size={18} /> Marks Setup
        </button>
      </div>

      {/* Messages */}
      {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg font-medium">{error}</div>}
      {successMsg && <div className="bg-green-50 text-green-700 p-4 rounded-lg font-medium flex items-center gap-2"><CheckCircle size={18}/> {successMsg}</div>}

      {/* TAB 1: EXAMS */}
      {activeTab === 'exams' && (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-white p-6 rounded-xl border shadow-sm h-fit">
            <h3 className="font-bold text-lg mb-4">Add New Exam</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exam Name (e.g. Half Yearly)</label>
                <input type="text" value={newExamName} onChange={e => setNewExamName(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exam Year</label>
                <input type="number" value={newExamYear} onChange={e => setNewExamYear(Number(e.target.value))} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
              </div>
              <button onClick={handleAddExam} className="w-full bg-indigo-600 text-white p-2 rounded-lg font-bold hover:bg-indigo-700 flex justify-center gap-2">
                <Plus size={20}/> Add Exam
              </button>
            </div>
          </div>
          <div className="md:col-span-2 bg-white p-6 rounded-xl border shadow-sm">
            <h3 className="font-bold text-lg mb-4">Existing Exams</h3>
            <div className="grid gap-3">
              {exams.map(ex => (
                <div key={ex.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                  <div>
                    <span className="font-bold text-gray-900">{ex.exam_name}</span>
                    <span className="ml-2 bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-bold">{ex.exam_year}</span>
                  </div>
                  <button onClick={() => handleDeleteExam(ex.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-md"><Trash2 size={18}/></button>
                </div>
              ))}
              {exams.length === 0 && <p className="text-gray-500 text-center py-4">কোনো পরীক্ষা যুক্ত করা হয়নি।</p>}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SUBJECTS */}
      {activeTab === 'subjects' && (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-white p-6 rounded-xl border shadow-sm h-fit">
            <h3 className="font-bold text-lg mb-4">Add New Subject</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name *</label>
                <input type="text" value={newSubName} onChange={e => setNewSubName(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Code (Optional)</label>
                <input type="text" value={newSubCode} onChange={e => setNewSubCode(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
              </div>
              <button onClick={handleAddSubject} className="w-full bg-indigo-600 text-white p-2 rounded-lg font-bold hover:bg-indigo-700 flex justify-center gap-2">
                <Plus size={20}/> Add Subject
              </button>
            </div>
          </div>
          <div className="md:col-span-2 bg-white p-6 rounded-xl border shadow-sm">
            <h3 className="font-bold text-lg mb-4">Subjects List</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {subjects.map(sub => (
                <div key={sub.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                  <div>
                    <span className="font-bold text-gray-900">{sub.subject_name}</span>
                    {sub.subject_code && <span className="ml-2 text-gray-500 text-xs">Code: {sub.subject_code}</span>}
                  </div>
                  <button onClick={() => handleDeleteSubject(sub.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-md"><Trash2 size={16}/></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MARKS SETUP */}
      {activeTab === 'setup' && (
        <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
          <div className="grid md:grid-cols-2 gap-6 pb-6 border-b">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Select Exam</label>
              <select value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)} className="w-full p-3 border rounded-lg font-medium focus:ring-2 focus:ring-indigo-500">
                <option value="">-- Choose Exam --</option>
                {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.exam_name} ({ex.exam_year})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Select Class</label>
              <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} className="w-full p-3 border rounded-lg font-medium focus:ring-2 focus:ring-indigo-500">
                <option value="">-- Choose Class --</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
              </select>
            </div>
          </div>

          {!selectedExamId || !selectedClassId ? (
            <div className="text-center py-10 text-gray-500 font-medium">
              পরীক্ষা এবং ক্লাস নির্বাচন করুন
            </div>
          ) : (
            <div>
              <h3 className="font-bold text-lg mb-4">Subject & Marks Distribution</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-sm border-b-2 border-gray-200">
                      <th className="p-3 w-10">Include</th>
                      <th className="p-3">Subject Name</th>
                      <th className="p-3 w-24">Full</th>
                      <th className="p-3 w-24">Pass</th>
                      <th className="p-3 w-24">Written</th>
                      <th className="p-3 w-24">MCQ</th>
                      <th className="p-3 w-24">Prac.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {setupData.map((row, idx) => (
                      <tr key={row.subject_id} className={row.is_included ? 'bg-indigo-50/20' : ''}>
                        <td className="p-3 text-center">
                          <input 
                            type="checkbox" 
                            checked={row.is_included} 
                            onChange={(e) => updateSetupField(idx, 'is_included', e.target.checked)}
                            className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                          />
                        </td>
                        <td className="p-3 font-bold text-gray-800">{row.subject_name}</td>
                        <td className="p-3"><input type="number" disabled={!row.is_included} value={row.full_marks} onChange={e => updateSetupField(idx, 'full_marks', e.target.value)} className="w-full p-2 border rounded text-center disabled:bg-gray-100" /></td>
                        <td className="p-3"><input type="number" disabled={!row.is_included} value={row.passing_marks} onChange={e => updateSetupField(idx, 'passing_marks', e.target.value)} className="w-full p-2 border rounded text-center disabled:bg-gray-100" /></td>
                        <td className="p-3"><input type="number" disabled={!row.is_included} value={row.written_marks} onChange={e => updateSetupField(idx, 'written_marks', e.target.value)} className="w-full p-2 border rounded text-center disabled:bg-gray-100" /></td>
                        <td className="p-3"><input type="number" disabled={!row.is_included} value={row.mcq_marks} onChange={e => updateSetupField(idx, 'mcq_marks', e.target.value)} className="w-full p-2 border rounded text-center disabled:bg-gray-100" /></td>
                        <td className="p-3"><input type="number" disabled={!row.is_included} value={row.practical_marks} onChange={e => updateSetupField(idx, 'practical_marks', e.target.value)} className="w-full p-2 border rounded text-center disabled:bg-gray-100" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end mt-6">
                <button onClick={handleSaveSetup} disabled={loading} className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-sm">
                  <Save size={20}/> {loading ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}