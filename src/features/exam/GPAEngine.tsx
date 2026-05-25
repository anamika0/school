// src/features/exam/GPAEngine.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { ArrowLeft, Calculator, Save, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProcessedData {
  mark_id: string;
  student_name: string;
  subject_name: string;
  total_obtained: number;
  full_marks: number;
  passing_marks: number;
  is_absent: boolean;
  grade: string;
  gpa: number;
  // For Upserting
  exam_setup_id: string;
  student_id: string;
  obtained_written: number;
  obtained_mcq: number;
  obtained_practical: number;
}

export default function GPAEngine() {
  const [exams, setExams] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');

  const [processedMarks, setProcessedMarks] = useState<ProcessedData[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load Initial Data
  useEffect(() => {
    const fetchDropdowns = async () => {
      const { data: exData } = await supabase.from('exams').select('*').order('created_at', { ascending: false });
      if (exData) setExams(exData);

      const { data: clsData } = await supabase.from('classes').select('*').order('numeric_value');
      if (clsData) setClasses(clsData);
    };
    fetchDropdowns();
  }, []);

  // Standard Grading Scale Logic
  const calculateGradeAndGPA = (obtained: number, full: number, passing: number, isAbsent: boolean) => {
    if (isAbsent || obtained < passing) return { grade: 'F', gpa: 0.00 };
    
    const percentage = (obtained / full) * 100;
    
    if (percentage >= 80) return { grade: 'A+', gpa: 5.00 };
    if (percentage >= 70) return { grade: 'A', gpa: 4.00 };
    if (percentage >= 60) return { grade: 'A-', gpa: 3.50 };
    if (percentage >= 50) return { grade: 'B', gpa: 3.00 };
    if (percentage >= 40) return { grade: 'C', gpa: 2.00 };
    if (percentage >= 33) return { grade: 'D', gpa: 1.00 };
    
    return { grade: 'F', gpa: 0.00 };
  };

  // Run Processing Engine
  const handleRunProcessing = async () => {
    if (!selectedExamId || !selectedClassId) {
      showError("দয়া করে পরীক্ষা এবং ক্লাস নির্বাচন করুন।");
      return;
    }

    setLoading(true);
    setProcessedMarks([]);
    setError(null);
    setSuccessMsg(null);

    try {
      // 1. Fetch Exam Setups for the selected class & exam
      const { data: setups, error: setupErr } = await supabase
        .from('exam_setup')
        .select(`*, subjects(subject_name)`)
        .eq('exam_id', selectedExamId)
        .eq('class_id', selectedClassId);
      
      if (setupErr) throw setupErr;
      if (!setups || setups.length === 0) throw new Error("এই ক্লাসের জন্য কোনো এক্সাম সেটআপ পাওয়া যায়নি।");

      const setupIds = setups.map(s => s.id);

      // 2. Fetch Marks for those setups
      const { data: marks, error: marksErr } = await supabase
        .from('marks_entry')
        .select(`*, students(first_name, last_name, roll_no)`)
        .in('exam_setup_id', setupIds);

      if (marksErr) throw marksErr;
      if (!marks || marks.length === 0) throw new Error("এই ক্লাসের কোনো সাবজেক্টের নম্বর এন্ট্রি করা হয়নি। আগে Marks Entry সম্পন্ন করুন।");

      // 3. Process Data
      const processed: ProcessedData[] = marks.map((mark: any) => {
        const setupInfo = setups.find(s => s.id === mark.exam_setup_id);
        const { grade, gpa } = calculateGradeAndGPA(
          mark.total_obtained, 
          setupInfo.full_marks, 
          setupInfo.passing_marks, 
          mark.is_absent
        );

        return {
          mark_id: mark.id,
          student_name: `${mark.students?.first_name} ${mark.students?.last_name} (Roll: ${mark.students?.roll_no || 'N/A'})`,
          subject_name: setupInfo.subjects?.subject_name || 'Unknown',
          total_obtained: mark.total_obtained,
          full_marks: setupInfo.full_marks,
          passing_marks: setupInfo.passing_marks,
          is_absent: mark.is_absent,
          grade,
          gpa,
          exam_setup_id: mark.exam_setup_id,
          student_id: mark.student_id,
          obtained_written: mark.obtained_written,
          obtained_mcq: mark.obtained_mcq,
          obtained_practical: mark.obtained_practical
        };
      });

      // Sort by student name
      processed.sort((a, b) => a.student_name.localeCompare(b.student_name));
      setProcessedMarks(processed);
      showSuccess(`সাফল্যজনকভাবে ${processed.length} টি রেকর্ড প্রসেস করা হয়েছে!`);

    } catch (err: any) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Save to Database
  const handleSaveToDatabase = async () => {
    if (processedMarks.length === 0) return;
    setSaving(true);
    
    try {
      const recordsToUpsert = processedMarks.map(pm => ({
        id: pm.mark_id, // Important: ID থাকলে Supabase নতুন রো না বানিয়ে আগেরটাই আপডেট করবে
        exam_setup_id: pm.exam_setup_id,
        student_id: pm.student_id,
        obtained_written: pm.obtained_written,
        obtained_mcq: pm.obtained_mcq,
        obtained_practical: pm.obtained_practical,
        total_obtained: pm.total_obtained,
        is_absent: pm.is_absent,
        grade: pm.grade,
        gpa: pm.gpa
      }));

      const { error } = await supabase.from('marks_entry').upsert(recordsToUpsert);
      if (error) throw error;

      showSuccess("ডাটাবেসে সফলভাবে সমস্ত গ্রেড এবং জিপিএ আপডেট করা হয়েছে!");
      setProcessedMarks([]); // Clear view after saving
    } catch (err: any) {
      showError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const showSuccess = (msg: string) => { setSuccessMsg(msg); setError(null); };
  const showError = (msg: string) => { setError(msg); setSuccessMsg(null); setTimeout(() => setError(null), 5000); };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header Area */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/academic/exams" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-gray-600" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Grade & GPA Engine</h2>
          <p className="text-gray-500 mt-1">অটোমেটিক গ্রেড ক্যালকুলেশন এবং ডাটাবেস আপডেট প্যানেল।</p>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Exam</label>
            <select value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500">
              <option value="">-- Choose Exam --</option>
              {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.exam_name} ({ex.exam_year})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Class</label>
            <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500">
              <option value="">-- Choose Class --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
            </select>
          </div>
          <div>
            <button 
              onClick={handleRunProcessing} 
              disabled={loading} 
              className="w-full bg-purple-600 text-white py-2.5 rounded-lg font-bold hover:bg-purple-700 flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
            >
              {loading ? <RefreshCw className="animate-spin" size={20} /> : <Calculator size={20} />}
              {loading ? 'Processing...' : 'Run Processing Engine'}
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium flex items-start gap-2">
          <AlertCircle size={20} className="shrink-0 mt-0.5" /> <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg font-medium flex items-center gap-2">
          <CheckCircle size={20} /> {successMsg}
        </div>
      )}

      {/* Processed Data Preview */}
      {processedMarks.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
          <div className="bg-purple-50/50 p-4 border-b border-purple-100 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Processed Results Preview</h3>
              <p className="text-sm text-gray-500 mt-1">নিচের ডাটাগুলো সেভ করলে ডাটাবেসে আপডেট হয়ে যাবে।</p>
            </div>
            <button 
              onClick={handleSaveToDatabase} 
              disabled={saving} 
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-sm transition-all disabled:opacity-70"
            >
              {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
              {saving ? 'Updating Database...' : 'Save to Database'}
            </button>
          </div>

          <div className="overflow-x-auto max-h-125">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-gray-100 z-10 shadow-sm">
                <tr className="border-b-2 border-gray-200 text-sm">
                  <th className="p-4 font-bold text-gray-700">Student Info</th>
                  <th className="p-4 font-bold text-gray-700">Subject</th>
                  <th className="p-4 font-bold text-gray-700 text-center">Marks Info</th>
                  <th className="p-4 font-bold text-gray-700 text-center">Calculated Grade</th>
                  <th className="p-4 font-bold text-gray-700 text-center">Calculated GPA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {processedMarks.map((row) => (
                  <tr key={row.mark_id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-gray-900">{row.student_name}</td>
                    <td className="p-4 text-gray-600">{row.subject_name}</td>
                    <td className="p-4 text-center">
                      <div className="text-sm">
                        <span className="font-bold">{row.is_absent ? 'Absent' : row.total_obtained}</span> 
                        <span className="text-gray-400"> / {row.full_marks}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">Pass: {row.passing_marks}</div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 inline-block rounded-full text-sm font-bold ${
                        row.grade === 'F' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {row.grade}
                      </span>
                    </td>
                    <td className="p-4 text-center font-bold text-gray-800">
                      {row.gpa.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}