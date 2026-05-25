// src/features/exam/MarksEntry.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { ArrowLeft, Save, Search, AlertCircle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MarksEntry() {
  // --- Master Data States ---
  const [exams, setExams] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [filteredSections, setFilteredSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  // --- Filter States ---
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  // --- Operation States ---
  const [examSetup, setExamSetup] = useState<any | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [marksData, setMarksData] = useState<Record<string, any>>({});
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Initial Data Load
  useEffect(() => {
    const loadInitialData = async () => {
      const { data: exData } = await supabase.from('exams').select('*').order('created_at', { ascending: false });
      if (exData) setExams(exData);

      const { data: clsData } = await supabase.from('classes').select('*').order('numeric_value');
      if (clsData) setClasses(clsData);

      const { data: secData } = await supabase.from('sections').select('*');
      if (secData) setSections(secData);

      const { data: subData } = await supabase.from('subjects').select('*').order('subject_name');
      if (subData) setSubjects(subData);
    };
    loadInitialData();
  }, []);

  // Filter Sections based on Class
  useEffect(() => {
    if (selectedClassId) {
      setFilteredSections(sections.filter(s => s.class_id === selectedClassId));
      setSelectedSectionId(''); // Reset section
    } else {
      setFilteredSections([]);
    }
  }, [selectedClassId, sections]);

  // Fetch Students & Setup & Existing Marks
  const handleFetchStudents = async () => {
    if (!selectedExamId || !selectedClassId || !selectedSubjectId) {
      showError("দয়া করে পরীক্ষা, ক্লাস এবং বিষয় নির্বাচন করুন।");
      return;
    }

    setFetching(true);
    setExamSetup(null);
    setStudents([]);
    setMarksData({});

    try {
      // 1. Check if Exam Setup exists for this combination
      const { data: setupData, error: setupError } = await supabase
        .from('exam_setup')
        .select('*')
        .eq('exam_id', selectedExamId)
        .eq('class_id', selectedClassId)
        .eq('subject_id', selectedSubjectId)
        .single();

      if (setupError || !setupData) {
        throw new Error("এই ক্লাসের জন্য নির্বাচিত বিষয়ের কোনো মার্কস কনফিগারেশন পাওয়া যায়নি। দয়া করে আগে 'Exam Setup' থেকে মার্কস ডিস্ট্রিবিউশন সেভ করুন।");
      }
      setExamSetup(setupData);

      // 2. Fetch Active Students
      let stdQuery = supabase.from('students').select('*').eq('class_id', selectedClassId).eq('status', 'Active');
      if (selectedSectionId) stdQuery = stdQuery.eq('section_id', selectedSectionId);
      
      const { data: stdData, error: stdError } = await stdQuery;
      if (stdError) throw stdError;

      // 3. Fetch Existing Marks
      const { data: existingMarks, error: marksError } = await supabase
        .from('marks_entry')
        .select('*')
        .eq('exam_setup_id', setupData.id);
      
      if (marksError) throw marksError;

      // 4. Map existing marks into state
      const initialMarks: Record<string, any> = {};
      stdData?.forEach(student => {
        const markRecord = existingMarks?.find(m => m.student_id === student.id);
        initialMarks[student.id] = {
          obtained_written: markRecord?.obtained_written || '',
          obtained_mcq: markRecord?.obtained_mcq || '',
          obtained_practical: markRecord?.obtained_practical || '',
          is_absent: markRecord?.is_absent || false,
          total: markRecord?.total_obtained || 0
        };
      });

      setStudents(stdData || []);
      setMarksData(initialMarks);

    } catch (err: any) {
      showError(err.message);
    } finally {
      setFetching(false);
    }
  };

  // Update specific mark field
  const handleMarkChange = (studentId: string, field: string, value: string | boolean) => {
    const updated = { ...marksData };
    
    // Check absent toggle
    if (field === 'is_absent') {
      updated[studentId] = {
        ...updated[studentId],
        is_absent: value,
        obtained_written: value ? 0 : updated[studentId].obtained_written,
        obtained_mcq: value ? 0 : updated[studentId].obtained_mcq,
        obtained_practical: value ? 0 : updated[studentId].obtained_practical,
      };
    } else {
      updated[studentId] = { ...updated[studentId], [field]: value };
    }

    // Auto calculate total
    if (!updated[studentId].is_absent) {
      const w = Number(updated[studentId].obtained_written) || 0;
      const m = Number(updated[studentId].obtained_mcq) || 0;
      const p = Number(updated[studentId].obtained_practical) || 0;
      updated[studentId].total = w + m + p;
    } else {
      updated[studentId].total = 0;
    }

    setMarksData(updated);
  };

  // Save all marks to Database
  const handleSaveAllMarks = async () => {
    if (!examSetup) return;
    setLoading(true);

    try {
      const recordsToUpsert = students.map(student => {
        const mark = marksData[student.id];
        return {
          exam_setup_id: examSetup.id,
          student_id: student.id,
          obtained_written: Number(mark.obtained_written) || 0,
          obtained_mcq: Number(mark.obtained_mcq) || 0,
          obtained_practical: Number(mark.obtained_practical) || 0,
          total_obtained: mark.total,
          is_absent: mark.is_absent,
          // Grade ও GPA ক্যালকুলেশন আমরা পরের মডিউলে (Tabulation-এ) একসাথে ডাইনামিক্যালি করবো। 
          // আপাতত এখানে ফাঁকা বা ডিফল্ট রাখা হলো।
        };
      });

      const { error } = await supabase
        .from('marks_entry')
        .upsert(recordsToUpsert, { onConflict: 'exam_setup_id,student_id' });

      if (error) throw error;
      showSuccess("সব স্টুডেন্টের নম্বর সফলভাবে সেভ হয়েছে!");
    } catch (err: any) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg: string) => { setSuccessMsg(msg); setError(null); setTimeout(() => setSuccessMsg(null), 3000); };
  const showError = (msg: string) => { setError(msg); setSuccessMsg(null); setTimeout(() => setError(null), 5000); };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/academic/exams" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-gray-600" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Marks Entry Panel</h2>
          <p className="text-gray-500 mt-1">Input and manage subject-wise marks for students.</p>
        </div>
      </div>

      {/* Filter Options */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Exam *</label>
            <select value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white">
              <option value="">-- Choose Exam --</option>
              {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.exam_name} ({ex.exam_year})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Class *</label>
            <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white">
              <option value="">-- Choose Class --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Section (Optional)</label>
            <select value={selectedSectionId} onChange={e => setSelectedSectionId(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white" disabled={!selectedClassId || filteredSections.length === 0}>
              <option value="">-- Choose Section --</option>
              {filteredSections.map(s => <option key={s.id} value={s.id}>{s.section_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Subject *</label>
            <select value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white">
              <option value="">-- Choose Subject --</option>
              {subjects.map(sub => <option key={sub.id} value={sub.id}>{sub.subject_name}</option>)}
            </select>
          </div>
          <div>
            <button onClick={handleFetchStudents} disabled={fetching} className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-bold hover:bg-indigo-700 flex items-center justify-center gap-2">
              <Search size={18} />
              {fetching ? 'Searching...' : 'Search Students'}
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium flex items-start gap-2">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg font-medium flex items-center gap-2">
          <CheckCircle size={20} /> {successMsg}
        </div>
      )}

      {/* Marks Entry Data Grid */}
      {students.length > 0 && examSetup && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          
          {/* Info Banner */}
          <div className="bg-indigo-50/50 p-4 border-b border-indigo-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="font-bold text-gray-900">Data Entry for: {subjects.find(s => s.id === selectedSubjectId)?.subject_name}</h3>
              <p className="text-sm text-gray-500 mt-1">
                Full Marks: <span className="font-bold text-gray-700">{examSetup.full_marks}</span> | 
                Pass Marks: <span className="font-bold text-gray-700">{examSetup.passing_marks}</span>
              </p>
            </div>
            <button onClick={handleSaveAllMarks} disabled={loading} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-sm transition-colors">
              <Save size={18} />
              {loading ? 'Saving Data...' : 'Save All Marks'}
            </button>
          </div>

          <div className="overflow-x-auto p-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-200 text-sm">
                  <th className="p-3 font-bold text-gray-700">Student Name & ID</th>
                  <th className="p-3 font-bold text-gray-700 text-center w-24">Absent?</th>
                  <th className="p-3 font-bold text-gray-700 text-center w-28">Written ({examSetup.written_marks})</th>
                  <th className="p-3 font-bold text-gray-700 text-center w-28">MCQ ({examSetup.mcq_marks})</th>
                  <th className="p-3 font-bold text-gray-700 text-center w-28">Prac. ({examSetup.practical_marks})</th>
                  <th className="p-3 font-bold text-indigo-700 text-center w-28 bg-indigo-50 rounded-tr-lg">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((student) => {
                  const mark = marksData[student.id];
                  if (!mark) return null;

                  return (
                    <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-3">
                        <p className="font-bold text-gray-900">{student.first_name} {student.last_name}</p>
                        <p className="text-xs text-gray-500">ID: {student.admission_no} | Roll: {student.roll_no || 'N/A'}</p>
                      </td>
                      
                      <td className="p-3 text-center">
                        <input 
                          type="checkbox" 
                          checked={mark.is_absent}
                          onChange={(e) => handleMarkChange(student.id, 'is_absent', e.target.checked)}
                          className="w-5 h-5 accent-red-500 rounded cursor-pointer"
                        />
                      </td>

                      <td className="p-3">
                        <input 
                          type="number" 
                          disabled={mark.is_absent || examSetup.written_marks == 0}
                          value={mark.obtained_written}
                          onChange={(e) => handleMarkChange(student.id, 'obtained_written', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded text-center focus:ring-2 focus:ring-indigo-500 font-bold text-gray-700 disabled:bg-gray-100 disabled:text-gray-400"
                          max={examSetup.written_marks}
                        />
                      </td>

                      <td className="p-3">
                        <input 
                          type="number" 
                          disabled={mark.is_absent || examSetup.mcq_marks == 0}
                          value={mark.obtained_mcq}
                          onChange={(e) => handleMarkChange(student.id, 'obtained_mcq', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded text-center focus:ring-2 focus:ring-indigo-500 font-bold text-gray-700 disabled:bg-gray-100 disabled:text-gray-400"
                          max={examSetup.mcq_marks}
                        />
                      </td>

                      <td className="p-3">
                        <input 
                          type="number" 
                          disabled={mark.is_absent || examSetup.practical_marks == 0}
                          value={mark.obtained_practical}
                          onChange={(e) => handleMarkChange(student.id, 'obtained_practical', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded text-center focus:ring-2 focus:ring-indigo-500 font-bold text-gray-700 disabled:bg-gray-100 disabled:text-gray-400"
                          max={examSetup.practical_marks}
                        />
                      </td>

                      <td className="p-3 text-center bg-indigo-50/30">
                        <span className={`text-lg font-black ${mark.total >= examSetup.passing_marks ? 'text-green-600' : 'text-red-600'}`}>
                          {mark.is_absent ? 'AB' : mark.total}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}