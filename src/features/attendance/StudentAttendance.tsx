// src/features/attendance/StudentAttendance.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { ArrowLeft, Search, Save, CheckCircle2, XCircle, Clock, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function StudentAttendance() {
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [filteredSections, setFilteredSections] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<Record<string, string>>({});
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

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

  const handleSearch = async () => {
    if (!selectedClassId || !selectedDate) {
      setError('অনুগ্রহ করে অন্তত ক্লাস এবং তারিখ নির্বাচন করুন।');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    setStudents([]);

    try {
      // ১. কোয়েরি বিল্ড করা (roll_number এর বদলে created_at দিয়ে সেভ করা হয়েছে যাতে ক্র্যাশ না করে)
      let studentQuery = supabase
        .from('students')
        .select('*')
        .eq('class_id', selectedClassId)
        .eq('status', 'Active')
        .order('created_at', { ascending: true }); 

      if (selectedSectionId) {
        studentQuery = studentQuery.eq('section_id', selectedSectionId);
      }

      const { data: studentList, error: studentError } = await studentQuery;

      if (studentError) throw studentError;
      
      if (!studentList || studentList.length === 0) {
        setError('এই ক্লাস/সেকশনে কোনো রানিং স্টুডেন্ট পাওয়া যায়নি। দয়া করে এডমিশন ফর্ম থেকে স্টুডেন্ট ভর্তি করান।');
        setLoading(false);
        return;
      }

      setStudents(studentList);

      // ২. হাজিরা লোড করা
      let attendanceQuery = supabase
        .from('student_attendance')
        .select('student_id, status')
        .eq('class_id', selectedClassId)
        .eq('date', selectedDate);

      if (selectedSectionId) {
        attendanceQuery = attendanceQuery.eq('section_id', selectedSectionId);
      }

      const { data: existingAttendance, error: attendanceError } = await attendanceQuery;
      
      if (attendanceError) throw attendanceError;

      // ৩. হাজিরা ম্যাপ করা
      const newAttendanceMap: Record<string, string> = {};
      studentList.forEach(student => {
        const record = existingAttendance?.find(a => a.student_id === student.id);
        newAttendanceMap[student.id] = record ? record.status : 'Present';
      });

      setAttendanceData(newAttendanceMap);
    } catch (err: any) {
      console.error('Search Error:', err);
      // এখানে সরাসরি ডেটাবেসের এরর মেসেজটি স্ক্রিনে দেখাবে, যাতে আমরা বুঝতে পারি সমস্যা কোথায়!
      setError(`ডাটা লোড করতে সমস্যা: ${err.message || 'Unknown Error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const recordsToUpsert = students.map(student => ({
        student_id: student.id,
        class_id: selectedClassId,
        section_id: selectedSectionId || null,
        date: selectedDate,
        status: attendanceData[student.id]
      }));

      const { error: upsertError } = await supabase
        .from('student_attendance')
        .upsert(recordsToUpsert, { onConflict: 'student_id,date' });

      if (upsertError) throw upsertError;

      setSuccessMsg('হাজিরা সফলভাবে সেভ করা হয়েছে!');
    } catch (err: any) {
      console.error(err);
      setError(`হাজিরা সেভ করতে সমস্যা: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4 mb-2">
        <Link to="/academic/attendance" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-gray-600" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Student Attendance</h2>
          <p className="text-gray-500 mt-1">Take daily attendance for students.</p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Class *</label>
            <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white">
              <option value="">-- Select Class --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Section (Optional)</label>
            <select value={selectedSectionId} onChange={(e) => setSelectedSectionId(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white" disabled={!selectedClassId || filteredSections.length === 0}>
              <option value="">-- Select Section --</option>
              {filteredSections.map(s => <option key={s.id} value={s.id}>{s.section_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Date *</label>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" />
          </div>
          <button onClick={handleSearch} disabled={loading} className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-bold hover:bg-indigo-700 flex items-center justify-center gap-2">
            <Search size={18} />
            {loading ? 'Searching...' : 'Load Students'}
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">{error}</div>}
      {successMsg && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm font-medium">{successMsg}</div>}

      {/* Attendance Sheet */}
      {students.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Users className="text-indigo-600" size={20} />
              Total Students: {students.length}
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-white border-b border-gray-100 text-sm">
                  <th className="px-6 py-4 font-bold text-gray-600 w-24">Roll</th>
                  <th className="px-6 py-4 font-bold text-gray-600">Student Name</th>
                  <th className="px-6 py-4 font-bold text-gray-600 text-center">Attendance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map(student => (
                  <tr key={student.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3 font-bold text-gray-700">{student.roll_no || 'N/A'}</td>
                    <td className="px-6 py-3">
                      <p className="font-bold text-gray-900">{student.first_name} {student.last_name}</p>
                      <p className="text-xs text-gray-500">ID: {student.admission_no}</p>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleStatusChange(student.id, 'Present')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-bold transition-all ${attendanceData[student.id] === 'Present' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-transparent'}`}
                        >
                          <CheckCircle2 size={16} /> Present
                        </button>
                        <button
                          onClick={() => handleStatusChange(student.id, 'Absent')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-bold transition-all ${attendanceData[student.id] === 'Absent' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-transparent'}`}
                        >
                          <XCircle size={16} /> Absent
                        </button>
                        <button
                          onClick={() => handleStatusChange(student.id, 'Late')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-bold transition-all ${attendanceData[student.id] === 'Late' ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-transparent'}`}
                        >
                          <Clock size={16} /> Late
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
            <button
              onClick={handleSaveAttendance}
              disabled={saving}
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-indigo-700 shadow-md transition-all flex items-center gap-2"
            >
              <Save size={20} />
              {saving ? 'Saving Records...' : 'Save Attendance'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}