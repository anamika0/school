// src/features/exam/Marksheet.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { ArrowLeft, Printer, Search, AlertCircle, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

interface MarkRow {
  subject_name: string;
  full_marks: number;
  written: number;
  mcq: number;
  practical: number;
  total: number;
  grade: string;
  gpa: number;
  is_absent: boolean;
}

interface MarksheetData {
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

export default function Marksheet() {
  const [exams, setExams] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const [marksheetData, setMarksheetData] = useState<MarksheetData | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Dropdowns (Exams & Classes)
  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: exData } = await supabase.from('exams').select('*').order('created_at', { ascending: false });
      if (exData) setExams(exData);

      const { data: clsData } = await supabase.from('classes').select('*').order('numeric_value');
      if (clsData) setClasses(clsData);
    };
    fetchInitialData();
  }, []);

  // Fetch Students when Class is selected
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedClassId) {
        setStudents([]);
        return;
      }
      const { data: stdData } = await supabase
        .from('students')
        .select('id, first_name, last_name, roll_no')
        .eq('class_id', selectedClassId)
        .eq('status', 'Active')
        .order('roll_no');
      
      if (stdData) setStudents(stdData);
      setSelectedStudentId(''); // Reset student selection
    };
    fetchStudents();
  }, [selectedClassId]);

  const getFinalGrade = (gpa: number) => {
    if (gpa >= 5.00) return 'A+';
    if (gpa >= 4.00) return 'A';
    if (gpa >= 3.50) return 'A-';
    if (gpa >= 3.00) return 'B';
    if (gpa >= 2.00) return 'C';
    if (gpa >= 1.00) return 'D';
    return 'F';
  };

  const handleGenerateMarksheet = async () => {
    if (!selectedExamId || !selectedClassId || !selectedStudentId) {
      setError("দয়া করে পরীক্ষা, ক্লাস এবং স্টুডেন্ট নির্বাচন করুন।");
      return;
    }

    setLoading(true);
    setError(null);
    setMarksheetData(null);

    try {
      // 1. Fetch Exam & Class info
      const examInfo = exams.find(e => e.id === selectedExamId);
      const classInfo = classes.find(c => c.id === selectedClassId);
      const studentInfo = students.find(s => s.id === selectedStudentId);

      // 2. Fetch full student details
      const { data: fullStudent, error: stdErr } = await supabase
        .from('students')
        .select('*')
        .eq('id', selectedStudentId)
        .single();
      if (stdErr) throw stdErr;

      // 3. Fetch Exam Setups for this class
      const { data: setups, error: setupErr } = await supabase
        .from('exam_setup')
        .select(`*, subjects(subject_name)`)
        .eq('exam_id', selectedExamId)
        .eq('class_id', selectedClassId);

      if (setupErr) throw setupErr;
      if (!setups || setups.length === 0) throw new Error("এই ক্লাসের কোনো এক্সাম কনফিগারেশন পাওয়া যায়নি।");

      const setupIds = setups.map(s => s.id);

      // 4. Fetch Marks for this student
      const { data: marks, error: marksErr } = await supabase
        .from('marks_entry')
        .select('*')
        .eq('student_id', selectedStudentId)
        .in('exam_setup_id', setupIds);

      if (marksErr) throw marksErr;

      // 5. Process Data
      let totalMarks = 0;
      let totalGPA = 0;
      let hasFailed = false;
      const processedMarks: MarkRow[] = [];

      setups.forEach((setup: any) => {
        const markRecord = marks?.find(m => m.exam_setup_id === setup.id);
        const subName = Array.isArray(setup.subjects) ? setup.subjects[0]?.subject_name : setup.subjects?.subject_name;

        if (markRecord) {
          processedMarks.push({
            subject_name: subName || 'Unknown',
            full_marks: setup.full_marks,
            written: markRecord.obtained_written || 0,
            mcq: markRecord.obtained_mcq || 0,
            practical: markRecord.obtained_practical || 0,
            total: markRecord.total_obtained || 0,
            grade: markRecord.grade || 'N/A',
            gpa: markRecord.gpa || 0,
            is_absent: markRecord.is_absent || false
          });
          
          totalMarks += Number(markRecord.total_obtained || 0);
          totalGPA += Number(markRecord.gpa || 0);
          if (markRecord.grade === 'F' || markRecord.grade === 'N/A') hasFailed = true;
        } else {
          // No marks entered for this subject
          processedMarks.push({
            subject_name: subName || 'Unknown',
            full_marks: setup.full_marks,
            written: 0, mcq: 0, practical: 0, total: 0,
            grade: '-', gpa: 0, is_absent: true
          });
          hasFailed = true;
        }
      });

      const avgGPA = setups.length > 0 ? (totalGPA / setups.length) : 0;
      const finalGPA = hasFailed ? 0.00 : parseFloat(avgGPA.toFixed(2));
      const finalGrade = hasFailed ? 'F' : getFinalGrade(finalGPA);

      setMarksheetData({
        student_name: `${fullStudent.first_name} ${fullStudent.last_name}`,
        roll_no: fullStudent.roll_no || 'N/A',
        admission_no: fullStudent.admission_no || 'N/A',
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

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Print Specific Styles */}
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            #printable-marksheet, #printable-marksheet * { visibility: visible; }
            #printable-marksheet { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
            @page { size: A4 portrait; margin: 15mm; }
          }
        `}
      </style>

      {/* Header Area (Hidden in Print) */}
      <div className="flex justify-between items-center mb-6 print:hidden">
        <div className="flex items-center gap-4">
          <Link to="/academic/exams" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-gray-600" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="text-indigo-600" /> Marksheet Generator
            </h2>
            <p className="text-gray-500 mt-1">ব্যক্তিগত স্টুডেন্ট প্রোগ্রেস রিপোর্ট এবং মার্কশিট তৈরি করুন।</p>
          </div>
        </div>
        
        {marksheetData && (
          <button onClick={handlePrint} className="bg-slate-800 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-slate-900 flex items-center gap-2 shadow-sm transition-colors">
            <Printer size={18} /> Print Marksheet
          </button>
        )}
      </div>

      {/* Control Panel (Hidden in Print) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Exam</label>
            <select value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500">
              <option value="">-- Choose Exam --</option>
              {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.exam_name}</option>)}
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
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Student</label>
            <select value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} disabled={!selectedClassId || students.length === 0} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50">
              <option value="">-- Choose Student --</option>
              {students.map(s => <option key={s.id} value={s.id}>Roll: {s.roll_no} - {s.first_name}</option>)}
            </select>
          </div>
          <div>
            <button 
              onClick={handleGenerateMarksheet} 
              disabled={loading || !selectedStudentId} 
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-bold hover:bg-indigo-700 flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
            >
              <Search size={20} />
              {loading ? 'Processing...' : 'Generate PDF'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium flex items-start gap-2 print:hidden">
          <AlertCircle size={20} className="shrink-0 mt-0.5" /> <span>{error}</span>
        </div>
      )}

      {/* Printable Marksheet Container */}
      {marksheetData && (
        <div id="printable-marksheet" className="bg-white p-10 rounded-xl shadow-sm border border-gray-200 print:shadow-none print:border-none print:p-0 mt-6 mx-auto">
          
          {/* School Header */}
          <div className="text-center border-b-4 border-slate-800 pb-6 mb-6">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Your School Name</h1>
            <p className="text-lg text-slate-600 font-medium mt-1">123 Education Street, City Name, Country</p>
            <div className="mt-4 inline-block bg-slate-100 border border-slate-300 px-6 py-2 rounded-full">
              <h2 className="text-xl font-bold text-slate-800 uppercase tracking-widest">Academic Transcript</h2>
            </div>
          </div>

          {/* Student Information */}
          <div className="flex justify-between items-start mb-8">
            <div className="space-y-2 text-slate-800">
              <p><span className="font-bold w-32 inline-block">Student Name</span> : <span className="font-bold text-lg">{marksheetData.student_name}</span></p>
              <p><span className="font-bold w-32 inline-block">Student ID</span> : <span>{marksheetData.admission_no}</span></p>
              <p><span className="font-bold w-32 inline-block">Class & Roll</span> : <span>{marksheetData.class_name} | Roll: {marksheetData.roll_no}</span></p>
            </div>
            <div className="space-y-2 text-slate-800 text-right">
              <p><span className="font-bold inline-block mr-2">Examination</span> : <span className="font-bold">{marksheetData.exam_name}</span></p>
              <p><span className="font-bold inline-block mr-2">Session/Year</span> : <span>{marksheetData.exam_year}</span></p>
              <p><span className="font-bold inline-block mr-2">Issue Date</span> : <span>{new Date().toLocaleDateString()}</span></p>
            </div>
          </div>

          {/* Marks Table */}
          <table className="w-full text-left border-collapse border border-slate-300 mb-8">
            <thead>
              <tr className="bg-slate-100 text-slate-800">
                <th className="p-3 border border-slate-300 font-bold uppercase text-sm">Subject Name</th>
                <th className="p-3 border border-slate-300 font-bold uppercase text-sm text-center w-24">Full Marks</th>
                <th className="p-3 border border-slate-300 font-bold uppercase text-sm text-center w-20">Written</th>
                <th className="p-3 border border-slate-300 font-bold uppercase text-sm text-center w-20">MCQ</th>
                <th className="p-3 border border-slate-300 font-bold uppercase text-sm text-center w-20">Practical</th>
                <th className="p-3 border border-slate-300 font-bold uppercase text-sm text-center w-24">Total</th>
                <th className="p-3 border border-slate-300 font-bold uppercase text-sm text-center w-20">Grade</th>
                <th className="p-3 border border-slate-300 font-bold uppercase text-sm text-center w-20">GPA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {marksheetData.marks.map((mark, idx) => (
                <tr key={idx}>
                  <td className="p-3 border border-slate-300 font-bold text-slate-700">{mark.subject_name}</td>
                  <td className="p-3 border border-slate-300 text-center text-slate-600">{mark.full_marks}</td>
                  <td className="p-3 border border-slate-300 text-center text-slate-600">{mark.written || '-'}</td>
                  <td className="p-3 border border-slate-300 text-center text-slate-600">{mark.mcq || '-'}</td>
                  <td className="p-3 border border-slate-300 text-center text-slate-600">{mark.practical || '-'}</td>
                  <td className="p-3 border border-slate-300 text-center font-bold text-slate-800">{mark.is_absent ? 'AB' : mark.total}</td>
                  <td className={`p-3 border border-slate-300 text-center font-bold ${mark.grade === 'F' ? 'text-red-600' : 'text-slate-800'}`}>
                    {mark.grade}
                  </td>
                  <td className="p-3 border border-slate-300 text-center font-bold text-slate-800">{mark.gpa.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Final Result Summary */}
          <div className="flex justify-between items-center bg-slate-50 border border-slate-300 p-6 rounded-lg mb-16">
            <div className="text-center px-8 border-r border-slate-300 flex-1">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Total Marks</p>
              <p className="text-3xl font-black text-slate-800">{marksheetData.total_marks}</p>
            </div>
            <div className="text-center px-8 border-r border-slate-300 flex-1">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Overall GPA</p>
              <p className="text-3xl font-black text-slate-800">{marksheetData.final_gpa.toFixed(2)}</p>
            </div>
            <div className="text-center px-8 flex-1">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Final Result</p>
              <p className={`text-4xl font-black ${marksheetData.final_grade === 'F' ? 'text-red-600' : 'text-green-600'}`}>
                {marksheetData.final_grade === 'F' ? 'FAILED' : `PASSED (${marksheetData.final_grade})`}
              </p>
            </div>
          </div>

          {/* Signatures */}
          <div className="flex justify-between items-end pt-12 px-10">
            <div className="text-center">
              <div className="w-48 border-t-2 border-slate-800 mx-auto"></div>
              <p className="font-bold text-slate-800 mt-2">Class Teacher</p>
            </div>
            <div className="text-center">
              <div className="w-48 border-t-2 border-slate-800 mx-auto"></div>
              <p className="font-bold text-slate-800 mt-2">Guardian's Signature</p>
            </div>
            <div className="text-center">
              <div className="w-48 border-t-2 border-slate-800 mx-auto"></div>
              <p className="font-bold text-slate-800 mt-2">Principal</p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}