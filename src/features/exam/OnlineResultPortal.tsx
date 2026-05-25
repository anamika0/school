// src/features/exam/OnlineResultPortal.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { Search, Printer, GraduationCap, Award, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface MarkRow {
  subject_name: string;
  total: number;
  grade: string;
  gpa: number;
  is_absent: boolean;
}

interface ResultData {
  student_name: string;
  roll_no: string;
  admission_no: string;
  class_name: string;
  exam_name: string;
  exam_year: string;
  marks: MarkRow[];
  total_marks: number;
  final_gpa: number;
  final_grade: string;
}

export default function OnlineResultPortal() {
  const [exams, setExams] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  
  // Form States
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [admissionNo, setAdmissionNo] = useState('');

  const [resultData, setResultData] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const getFinalGrade = (gpa: number) => {
    if (gpa >= 5.00) return 'A+';
    if (gpa >= 4.00) return 'A';
    if (gpa >= 3.50) return 'A-';
    if (gpa >= 3.00) return 'B';
    if (gpa >= 2.00) return 'C';
    if (gpa >= 1.00) return 'D';
    return 'F';
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId || !selectedClassId || !rollNo || !admissionNo) {
      setError("দয়া করে ফর্মের সবগুলো তথ্য সঠিকভাবে পূরণ করুন।");
      return;
    }

    setLoading(true);
    setError(null);
    setResultData(null);

    try {
      // 1. Verify Student Credentials
      const { data: student, error: stdErr } = await supabase
        .from('students')
        .select('*')
        .eq('class_id', selectedClassId)
        .eq('roll_no', rollNo)
        .eq('admission_no', admissionNo)
        .eq('status', 'Active')
        .single();

      if (stdErr || !student) {
        throw new Error("দুঃখিত! প্রদত্ত রোল নম্বর এবং স্টুডেন্ট আইডির সাথে কোনো শিক্ষার্থীর মিল পাওয়া যায়নি।");
      }

      // 2. Fetch Exam Setup (Subjects)
      const { data: setups, error: setupErr } = await supabase
        .from('exam_setup')
        .select(`*, subjects(subject_name)`)
        .eq('exam_id', selectedExamId)
        .eq('class_id', selectedClassId);

      if (setupErr || !setups || setups.length === 0) {
        throw new Error("এই পরীক্ষার রেজাল্ট এখনো প্রকাশিত হয়নি।");
      }

      const setupIds = setups.map(s => s.id);

      // 3. Fetch Marks
      const { data: marks, error: marksErr } = await supabase
        .from('marks_entry')
        .select('*')
        .eq('student_id', student.id)
        .in('exam_setup_id', setupIds);

      if (marksErr || !marks || marks.length === 0) {
        throw new Error("এই শিক্ষার্থীর রেজাল্ট এখনো সার্ভারে এন্ট্রি করা হয়নি।");
      }

      // 4. Process Result Data
      let totalMarks = 0;
      let totalGPA = 0;
      let hasFailed = false;
      const processedMarks: MarkRow[] = [];

      setups.forEach((setup: any) => {
        const markRecord = marks.find(m => m.exam_setup_id === setup.id);
        const subName = Array.isArray(setup.subjects) ? setup.subjects[0]?.subject_name : setup.subjects?.subject_name;

        if (markRecord) {
          processedMarks.push({
            subject_name: subName || 'Unknown',
            total: markRecord.total_obtained || 0,
            grade: markRecord.grade || 'N/A',
            gpa: markRecord.gpa || 0,
            is_absent: markRecord.is_absent || false
          });
          
          totalMarks += Number(markRecord.total_obtained || 0);
          totalGPA += Number(markRecord.gpa || 0);
          if (markRecord.grade === 'F' || markRecord.grade === 'N/A') hasFailed = true;
        } else {
          processedMarks.push({ subject_name: subName || 'Unknown', total: 0, grade: '-', gpa: 0, is_absent: true });
          hasFailed = true;
        }
      });

      const avgGPA = setups.length > 0 ? (totalGPA / setups.length) : 0;
      const finalGPA = hasFailed ? 0.00 : parseFloat(avgGPA.toFixed(2));
      const finalGrade = hasFailed ? 'F' : getFinalGrade(finalGPA);

      const examInfo = exams.find(e => e.id === selectedExamId);
      const classInfo = classes.find(c => c.id === selectedClassId);

      setResultData({
        student_name: `${student.first_name} ${student.last_name}`,
        roll_no: student.roll_no || 'N/A',
        admission_no: student.admission_no || 'N/A',
        class_name: classInfo?.class_name || 'Unknown',
        exam_name: examInfo?.exam_name || 'Unknown',
        exam_year: examInfo?.exam_year || 'Unknown',
        marks: processedMarks,
        total_marks: totalMarks,
        final_gpa: finalGPA,
        final_grade: finalGrade
      });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const resetPortal = () => {
    setResultData(null);
    setRollNo('');
    setAdmissionNo('');
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Print Specific Styles */}
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            #printable-result, #printable-result * { visibility: visible; }
            #printable-result { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
            @page { margin: 15mm; }
          }
        `}
      </style>

      {/* Header (Hidden in Print) */}
      <div className="flex items-center gap-4 mb-6 print:hidden">
        <Link to="/academic/exams" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-gray-600" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <GraduationCap className="text-indigo-600" /> Education Board Style Result Portal
          </h2>
          <p className="text-gray-500 mt-1">শিক্ষার্থী এবং অভিভাবকদের জন্য অনলাইন রেজাল্ট যাচাইকরণ সিস্টেম।</p>
        </div>
      </div>

      {/* Search Form OR Result View */}
      {!resultData ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden print:hidden max-w-2xl mx-auto mt-10">
          <div className="bg-indigo-600 p-6 text-center">
            <Award className="text-white mx-auto mb-3" size={48} />
            <h2 className="text-2xl font-bold text-white">Search Result</h2>
            <p className="text-indigo-100 mt-1">Please provide accurate information</p>
          </div>
          
          <form onSubmit={handleSearch} className="p-8 space-y-5">
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-start gap-2 text-sm border border-red-100">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Examination</label>
                <select value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)} required className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-gray-50">
                  <option value="">Select Exam</option>
                  {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.exam_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Class</label>
                <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} required className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-gray-50">
                  <option value="">Select Class</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Roll Number</label>
                <input type="text" required value={rollNo} onChange={e => setRollNo(e.target.value)} placeholder="e.g. 101" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Student ID (Admission No)</label>
                <input type="text" required value={admissionNo} onChange={e => setAdmissionNo(e.target.value)} placeholder="e.g. ADM-2026-001" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-gray-50" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-3.5 rounded-lg font-bold text-lg hover:bg-indigo-700 transition-colors flex justify-center items-center gap-2 mt-4 shadow-md">
              {loading ? <RefreshCw className="animate-spin" /> : <Search />}
              {loading ? 'Searching Database...' : 'Get Result'}
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Action Buttons (Hidden in Print) */}
          <div className="flex justify-end gap-3 print:hidden">
            <button onClick={resetPortal} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition-colors">
              Search Again
            </button>
            <button onClick={handlePrint} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg flex items-center gap-2 shadow-sm transition-colors">
              <Printer size={18} /> Print Copy
            </button>
          </div>

          {/* Printable Result Card */}
          <div id="printable-result" className="bg-white border-2 border-slate-200 p-8 rounded-xl print:border-none print:shadow-none print:p-0">
            {/* Board Style Header */}
            <div className="text-center border-b-2 border-slate-200 pb-6 mb-6">
              <div className="inline-block p-3 rounded-full bg-slate-50 border border-slate-200 mb-3">
                <GraduationCap size={40} className="text-slate-700" />
              </div>
              <h1 className="text-2xl font-black text-slate-800 uppercase tracking-widest">Web Based Result Publication System</h1>
              <p className="text-slate-600 font-bold mt-1">{resultData.exam_name} - {resultData.exam_year}</p>
            </div>

            {/* Student Info Table */}
            <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 mb-6">
              <table className="w-full text-left text-slate-700 text-sm">
                <tbody>
                  <tr>
                    <td className="py-2 font-bold w-1/4">Student Name</td>
                    <td className="py-2 font-bold text-slate-900">: {resultData.student_name}</td>
                    <td className="py-2 font-bold w-1/4 pl-4">Class</td>
                    <td className="py-2">: {resultData.class_name}</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-bold">Roll Number</td>
                    <td className="py-2">: {resultData.roll_no}</td>
                    <td className="py-2 font-bold pl-4">Student ID</td>
                    <td className="py-2">: {resultData.admission_no}</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-bold">Result Status</td>
                    <td className="py-2">
                      : <span className={`font-black ${resultData.final_grade === 'F' ? 'text-red-600' : 'text-green-600'}`}>
                        {resultData.final_grade === 'F' ? 'FAILED' : 'PASSED'}
                      </span>
                    </td>
                    <td className="py-2 font-bold pl-4">Overall GPA</td>
                    <td className="py-2 font-black">: {resultData.final_gpa.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Subject Wise Grade Sheet */}
            <h3 className="font-bold text-lg text-slate-800 mb-3 uppercase border-l-4 border-indigo-600 pl-3">Grade Sheet</h3>
            <table className="w-full text-left border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-slate-700">
                  <th className="p-3 border border-slate-300 font-bold">Subject</th>
                  <th className="p-3 border border-slate-300 font-bold text-center w-24">Marks</th>
                  <th className="p-3 border border-slate-300 font-bold text-center w-24">Grade</th>
                  <th className="p-3 border border-slate-300 font-bold text-center w-24">GPA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {resultData.marks.map((mark, idx) => (
                  <tr key={idx}>
                    <td className="p-3 border border-slate-300 font-medium text-slate-800">{mark.subject_name}</td>
                    <td className="p-3 border border-slate-300 text-center font-bold text-slate-700">
                      {mark.is_absent ? 'AB' : mark.total}
                    </td>
                    <td className={`p-3 border border-slate-300 text-center font-bold ${mark.grade === 'F' ? 'text-red-600' : 'text-slate-800'}`}>
                      {mark.grade}
                    </td>
                    <td className="p-3 border border-slate-300 text-center font-bold text-slate-800">
                      {mark.gpa.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="mt-8 text-center text-sm text-slate-500 print:mt-16">
              <p>This is a system generated document. No signature is required.</p>
              <p>Powered by BDT Live Management System</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}