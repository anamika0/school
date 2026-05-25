// src/features/exam/TabulationSheet.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { ArrowLeft, Table as TableIcon, Printer, Search, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SubjectCol {
  setup_id: string;
  subject_name: string;
}

interface StudentRow {
  student_id: string;
  roll_no: string;
  name: string;
  marks: Record<string, { total: number; grade: string; gpa: number }>;
  grand_total: number;
  final_gpa: number;
  final_grade: string;
  has_failed: boolean;
}

export default function TabulationSheet() {
  const [exams, setExams] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');

  const [subjectCols, setSubjectCols] = useState<SubjectCol[]>([]);
  const [tabulationData, setTabulationData] = useState<StudentRow[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Dropdowns
  useEffect(() => {
    const fetchDropdowns = async () => {
      const { data: exData } = await supabase.from('exams').select('*').order('created_at', { ascending: false });
      if (exData) setExams(exData);

      const { data: clsData } = await supabase.from('classes').select('*').order('numeric_value');
      if (clsData) setClasses(clsData);
    };
    fetchDropdowns();
  }, []);

  // Determine Final Grade from GPA
  const getFinalGrade = (gpa: number) => {
    if (gpa >= 5.00) return 'A+';
    if (gpa >= 4.00) return 'A';
    if (gpa >= 3.50) return 'A-';
    if (gpa >= 3.00) return 'B';
    if (gpa >= 2.00) return 'C';
    if (gpa >= 1.00) return 'D';
    return 'F';
  };

  // Generate Tabulation Data
  const handleGenerateTabulation = async () => {
    if (!selectedExamId || !selectedClassId) {
      setError("দয়া করে পরীক্ষা এবং ক্লাস নির্বাচন করুন।");
      return;
    }

    setLoading(true);
    setError(null);
    setSubjectCols([]);
    setTabulationData([]);

    try {
      // 1. Fetch Exam Setups (Subjects)
      const { data: setups, error: setupErr } = await supabase
        .from('exam_setup')
        .select(`id, subjects(subject_name)`)
        .eq('exam_id', selectedExamId)
        .eq('class_id', selectedClassId);

      if (setupErr) throw setupErr;
      if (!setups || setups.length === 0) throw new Error("এই ক্লাসের জন্য কোনো এক্সাম কনফিগারেশন পাওয়া যায়নি।");

      const cols = setups.map((s: any) => ({
        setup_id: s.id,
        subject_name: Array.isArray(s.subjects) ? s.subjects[0]?.subject_name : s.subjects?.subject_name || 'Unknown'
      }));
      setSubjectCols(cols);
      const setupIds = cols.map(c => c.setup_id);

      // 2. Fetch Students
      const { data: students, error: stdErr } = await supabase
        .from('students')
        .select('id, first_name, last_name, roll_no')
        .eq('class_id', selectedClassId)
        .eq('status', 'Active');

      if (stdErr) throw stdErr;

      // 3. Fetch Marks
      const { data: marks, error: marksErr } = await supabase
        .from('marks_entry')
        .select('*')
        .in('exam_setup_id', setupIds);

      if (marksErr) throw marksErr;

      // 4. Process Tabulation
      const processedRows: StudentRow[] = students?.map(student => {
        const studentMarks = marks?.filter(m => m.student_id === student.id) || [];
        
        let grandTotal = 0;
        let totalGPA = 0;
        let subjectCount = cols.length;
        let hasFailed = false;
        const markRecord: Record<string, any> = {};

        cols.forEach(col => {
          const m = studentMarks.find(sm => sm.exam_setup_id === col.setup_id);
          if (m) {
            markRecord[col.setup_id] = { total: m.total_obtained || 0, grade: m.grade || 'N/A', gpa: m.gpa || 0 };
            grandTotal += Number(m.total_obtained || 0);
            totalGPA += Number(m.gpa || 0);
            if (m.grade === 'F' || m.grade === 'N/A') hasFailed = true;
          } else {
            markRecord[col.setup_id] = { total: 0, grade: '-', gpa: 0 };
            hasFailed = true; // No marks entered means incomplete/fail
          }
        });

        const avgGPA = subjectCount > 0 ? (totalGPA / subjectCount) : 0;
        const finalGPA = hasFailed ? 0.00 : parseFloat(avgGPA.toFixed(2));
        const finalGrade = hasFailed ? 'F' : getFinalGrade(finalGPA);

        return {
          student_id: student.id,
          roll_no: student.roll_no || 'N/A',
          name: `${student.first_name} ${student.last_name}`,
          marks: markRecord,
          grand_total: grandTotal,
          final_gpa: finalGPA,
          final_grade: finalGrade,
          has_failed: hasFailed
        };
      }) || [];

      // Sort by Roll Number
      processedRows.sort((a, b) => {
        const rollA = parseInt(a.roll_no) || 9999;
        const rollB = parseInt(b.roll_no) || 9999;
        return rollA - rollB;
      });

      setTabulationData(processedRows);

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
    <div className="max-w-350 mx-auto space-y-6 pb-20">
      {/* Header Area (Hidden in Print) */}
      <div className="flex justify-between items-center mb-6 print:hidden">
        <div className="flex items-center gap-4">
          <Link to="/academic/exams" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-gray-600" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <TableIcon className="text-indigo-600" /> Tabulation Sheet
            </h2>
            <p className="text-gray-500 mt-1">পুরো ক্লাসের সকল বিষয়ের মাস্টার রেজাল্ট ভিউ।</p>
          </div>
        </div>
        
        {tabulationData.length > 0 && (
          <button onClick={handlePrint} className="bg-slate-800 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-slate-900 flex items-center gap-2 shadow-sm transition-colors">
            <Printer size={18} /> Print Sheet
          </button>
        )}
      </div>

      {/* Filter Options (Hidden in Print) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 print:hidden">
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
              onClick={handleGenerateTabulation} 
              disabled={loading} 
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-bold hover:bg-indigo-700 flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
            >
              <Search size={20} />
              {loading ? 'Generating...' : 'Generate Tabulation'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium flex items-start gap-2 print:hidden">
          <AlertCircle size={20} className="shrink-0 mt-0.5" /> <span>{error}</span>
        </div>
      )}

      {/* Printable Tabulation Grid */}
      {tabulationData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:shadow-none print:border-none print:m-0 print:p-0">
          
          {/* Print Header */}
          <div className="hidden print:block text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Your School Name</h1>
            <h3 className="text-xl font-bold mt-2">Tabulation Sheet</h3>
            <p className="text-gray-700 mt-1">
              Exam: {exams.find(e => e.id === selectedExamId)?.exam_name} | Class: {classes.find(c => c.id === selectedClassId)?.class_name}
            </p>
          </div>

          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-left border-collapse min-w-250">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-300 print:bg-gray-100">
                  <th className="p-3 border-r border-gray-200 font-bold text-gray-800 sticky left-0 bg-gray-100 z-10 w-16 text-center">Roll</th>
                  <th className="p-3 border-r border-gray-200 font-bold text-gray-800 sticky left-16 bg-gray-100 z-10 min-w-50">Student Name</th>
                  
                  {subjectCols.map(col => (
                    <th key={col.setup_id} className="p-3 border-r border-gray-200 font-bold text-gray-800 text-center min-w-25 leading-tight">
                      {col.subject_name} <br/><span className="text-xs font-normal text-gray-500">(Marks | Grd)</span>
                    </th>
                  ))}
                  
                  <th className="p-3 border-r border-gray-200 font-bold text-gray-800 text-center w-24">Total<br/>Marks</th>
                  <th className="p-3 border-r border-gray-200 font-bold text-gray-800 text-center w-24">Final<br/>GPA</th>
                  <th className="p-3 font-bold text-gray-800 text-center w-24 bg-indigo-50 print:bg-gray-100">Final<br/>Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tabulationData.map((row) => (
                  <tr key={row.student_id} className="hover:bg-gray-50 transition-colors print:break-inside-avoid">
                    <td className="p-3 border-r border-gray-200 text-center font-bold text-gray-700 sticky left-0 bg-white z-10">{row.roll_no}</td>
                    <td className="p-3 border-r border-gray-200 font-medium text-gray-900 sticky left-16 bg-white z-10">{row.name}</td>
                    
                    {subjectCols.map(col => {
                      const m = row.marks[col.setup_id];
                      return (
                        <td key={col.setup_id} className="p-3 border-r border-gray-200 text-center">
                          <span className="font-bold text-gray-800">{m.total}</span>
                          <span className={`ml-2 text-sm font-bold ${m.grade === 'F' ? 'text-red-600' : 'text-gray-500'}`}>
                            {m.grade}
                          </span>
                        </td>
                      );
                    })}
                    
                    <td className="p-3 border-r border-gray-200 text-center font-bold text-gray-800">
                      {row.grand_total}
                    </td>
                    <td className="p-3 border-r border-gray-200 text-center font-bold text-gray-800">
                      {row.final_gpa.toFixed(2)}
                    </td>
                    <td className={`p-3 text-center font-black text-lg ${row.has_failed ? 'text-red-600 bg-red-50/50' : 'text-green-600 bg-indigo-50/30'}`}>
                      {row.final_grade}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 bg-gray-50 border-t border-gray-200 text-sm text-gray-500 text-center print:hidden">
            * Note: This table is horizontally scrollable. Use the 'Print Sheet' button to generate a physical copy.
          </div>
        </div>
      )}
    </div>
  );
}