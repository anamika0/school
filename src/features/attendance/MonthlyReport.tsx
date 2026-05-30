// src/features/attendance/MonthlyReport.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { ArrowLeft, FileText, Printer, Search, CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MonthlyReport() {
  const [reportType, setReportType] = useState<'Student' | 'Teacher'>('Student');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM
  
  // স্টুডেন্টের জন্য ফিল্টার
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [filteredSections, setFilteredSections] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');

  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ক্লাস ও সেকশন লোড করা (স্টুডেন্ট রিপোর্টের জন্য)
  useEffect(() => {
    const fetchClassData = async () => {
      const { data: classData } = await supabase.from('classes').select('*').order('numeric_value', { ascending: true });
      if (classData) setClasses(classData);

      const { data: sectionData } = await supabase.from('sections').select('*');
      if (sectionData) setSections(sectionData);
    };
    fetchClassData();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      setFilteredSections(sections.filter(s => s.class_id === selectedClassId));
      setSelectedSectionId('');
    } else {
      setFilteredSections([]);
    }
  }, [selectedClassId, sections]);

  // রিপোর্ট জেনারেট করার লজিক
  const handleGenerateReport = async () => {
    if (reportType === 'Student' && !selectedClassId) {
      setError('স্টুডেন্ট রিপোর্টের জন্য ক্লাস নির্বাচন করা বাধ্যতামূলক।');
      return;
    }
    if (!selectedMonth) {
      setError('মাসের তারিখ নির্বাচন করুন।');
      return;
    }

    setLoading(true);
    setError(null);
    setReportData([]);

    try {
      const year = selectedMonth.split('-')[0];
      const month = selectedMonth.split('-')[1];
      const startDate = `${year}-${month}-01`;
      const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];

      if (reportType === 'Student') {
        // ১. স্টুডেন্টদের লোড করা
        let studentQuery = supabase.from('students').select('*').eq('class_id', selectedClassId).eq('status', 'Active');
        if (selectedSectionId) studentQuery = studentQuery.eq('section_id', selectedSectionId);
        const { data: students, error: studentError } = await studentQuery;
        if (studentError) throw studentError;

        // ২. ওই মাসের হাজিরা লোড করা
        let attQuery = supabase.from('student_attendance')
          .select('student_id, status')
          .eq('class_id', selectedClassId)
          .gte('date', startDate)
          .lte('date', endDate);
        if (selectedSectionId) attQuery = attQuery.eq('section_id', selectedSectionId);
        const { data: attendances, error: attError } = await attQuery;
        if (attError) throw attError;

        // ৩. ডেটা ক্যালকুলেট করা
        const formattedData = students?.map(student => {
          const studentAtts = attendances?.filter(a => a.student_id === student.id) || [];
          const present = studentAtts.filter(a => a.status === 'Present').length;
          const absent = studentAtts.filter(a => a.status === 'Absent').length;
          const late = studentAtts.filter(a => a.status === 'Late').length;
          const totalDays = studentAtts.length;
          const percentage = totalDays > 0 ? Math.round(((present + late) / totalDays) * 100) : 0;

          return {
            id: student.id,
            name: `${student.first_name} ${student.last_name || ''}`,
            identifier: student.admission_no || student.roll_no || 'N/A',
            present, absent, late, totalDays, percentage
          };
        }) || [];
        setReportData(formattedData);

      } else {
        // ১. শিক্ষকদের লোড করা
        const { data: teachers, error: teacherError } = await supabase.from('teachers').select('*').eq('status', 'Active');
        if (teacherError) throw teacherError;

        // ২. ওই মাসের হাজিরা লোড করা
        const { data: attendances, error: attError } = await supabase.from('teacher_attendance')
          .select('teacher_id, status')
          .gte('date', startDate)
          .lte('date', endDate);
        if (attError) throw attError;

        // ৩. ডেটা ক্যালকুলেট করা
        const formattedData = teachers?.map(teacher => {
          const teacherAtts = attendances?.filter(a => a.teacher_id === teacher.id) || [];
          const present = teacherAtts.filter(a => a.status === 'Present').length;
          const absent = teacherAtts.filter(a => a.status === 'Absent').length;
          const late = teacherAtts.filter(a => a.status === 'Late').length;
          const leave = teacherAtts.filter(a => a.status === 'Leave').length;
          const totalDays = teacherAtts.length;
          const percentage = totalDays > 0 ? Math.round(((present + late) / totalDays) * 100) : 0;

          return {
            id: teacher.id,
            name: teacher.first_name ? `${teacher.first_name} ${teacher.last_name || ''}` : (teacher.full_name || teacher.name || 'Unknown'),
            identifier: teacher.employee_id || teacher.designation || 'N/A',
            present, absent, late, leave, totalDays, percentage
          };
        }) || [];
        setReportData(formattedData);
      }

    } catch (err: any) {
      console.error(err);
      setError(`রিপোর্ট জেনারেট করতে সমস্যা হয়েছে: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // রিপোর্ট প্রিন্ট করার ফাংশন
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header - No Print Zone */}
      <div className="flex items-center justify-between mb-2 print:hidden">
        <div className="flex items-center gap-4">
          <Link to="/academic/attendance" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-gray-600" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Monthly Attendance Report</h2>
            <p className="text-gray-500 mt-1">Generate and print monthly summary reports.</p>
          </div>
        </div>
      </div>

      {/* Filters - No Print Zone */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Report Type</label>
            <select value={reportType} onChange={(e) => { setReportType(e.target.value as 'Student' | 'Teacher'); setReportData([]); }} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white font-bold text-purple-700">
              <option value="Student">Student Report</option>
              <option value="Teacher">Teacher/Staff Report</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Month *</label>
            <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500" />
          </div>

          {reportType === 'Student' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Class *</label>
                <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white">
                  <option value="">-- Select --</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Section (Optional)</label>
                <select value={selectedSectionId} onChange={(e) => setSelectedSectionId(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white" disabled={!selectedClassId || filteredSections.length === 0}>
                  <option value="">-- Select --</option>
                  {filteredSections.map(s => <option key={s.id} value={s.id}>{s.section_name}</option>)}
                </select>
              </div>
            </>
          )}

          <div className={reportType === 'Teacher' ? 'md:col-span-3' : ''}>
            <button onClick={handleGenerateReport} disabled={loading} className="w-full bg-purple-600 text-white py-2.5 rounded-lg font-bold hover:bg-purple-700 flex items-center justify-center gap-2">
              <Search size={18} />
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium print:hidden">{error}</div>}

      {/* Report Paper - Printable Zone */}
      {reportData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          
          {/* Printable Header */}
          <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50">
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-2">
                <CalendarDays className="text-purple-600" size={24} />
                {reportType === 'Student' ? 'Student' : 'Staff'} Attendance Summary
              </h3>
              <p className="text-sm text-gray-600 font-medium">Report Month: <span className="text-gray-900 font-bold">{new Date(selectedMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}</span></p>
              {reportType === 'Student' && selectedClassId && (
                <p className="text-sm text-gray-600 font-medium mt-1">Class: <span className="text-gray-900">{classes.find(c => c.id === selectedClassId)?.class_name} {selectedSectionId && `(${sections.find(s => s.id === selectedSectionId)?.section_name})`}</span></p>
              )}
            </div>
            <button onClick={handlePrint} className="bg-gray-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 print:hidden shadow-sm">
              <Printer size={18} /> Print Report
            </button>
          </div>
          
          <div className="overflow-x-auto p-4">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-200 text-sm">
                  <th className="p-4 font-bold text-gray-700">Name & ID</th>
                  <th className="p-4 font-bold text-center text-green-700">Present</th>
                  <th className="p-4 font-bold text-center text-red-700">Absent</th>
                  <th className="p-4 font-bold  text-center text-orange-700">Late</th>
                  {reportType === 'Teacher' && <th className="p-4 font-bold text-center text-purple-700">Leave</th>}
                  <th className="p-4 font-bold text-gray-700 text-center bg-gray-200 rounded-tr-lg">Rate (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reportData.map((data, index) => (
                  <tr key={data.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}>
                    <td className="p-4">
                      <p className="font-bold text-gray-900">{data.name}</p>
                      <p className="text-xs text-gray-500">ID: {data.identifier}</p>
                    </td>
                    <td className="p-4 text-center font-bold text-green-600 bg-green-50/30">{data.present}</td>
                    <td className="p-4 text-center font-bold text-red-600 bg-red-50/30">{data.absent}</td>
                    <td className="p-4 text-center font-bold text-orange-600 bg-orange-50/30">{data.late}</td>
                    {reportType === 'Teacher' && <td className="p-4 text-center font-bold text-purple-600 bg-purple-50/30">{data.leave}</td>}
                    <td className="p-4 text-center bg-gray-50">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${data.percentage >= 80 ? 'bg-green-100 text-green-800' : data.percentage >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                        {data.percentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 text-center text-xs text-gray-400 border-t border-gray-100 hidden print:block mt-10">
            Report generated on {new Date().toLocaleString()} by System Admin.
          </div>
        </div>
      )}
    </div>
  );
}