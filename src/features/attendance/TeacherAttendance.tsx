// src/features/attendance/TeacherAttendance.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { ArrowLeft, Search, Save, CheckCircle2, XCircle, Clock, CalendarX, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TeacherAttendance() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<Record<string, { status: string; in_time: string; out_time: string }>>({});
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSearch = async () => {
    if (!selectedDate) {
      setError('অনুগ্রহ করে তারিখ নির্বাচন করুন।');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    setTeachers([]);

    try {
      const { data: teacherList, error: teacherError } = await supabase
        .from('teachers')
        .select('*')
        .eq('status', 'Active')
        .order('employee_id', { ascending: true });

      if (teacherError) throw teacherError;
      
      if (!teacherList || teacherList.length === 0) {
        setError('সিস্টেমে কোনো Active শিক্ষক পাওয়া যায়নি। দয়া করে আগে শিক্ষক যুক্ত করুন।');
        setLoading(false);
        return;
      }

      setTeachers(teacherList);

      const { data: existingAttendance, error: attendanceError } = await supabase
        .from('teacher_attendance')
        .select('teacher_id, status, in_time, out_time')
        .eq('date', selectedDate);
      
      if (attendanceError) throw attendanceError;

      const newAttendanceMap: Record<string, { status: string; in_time: string; out_time: string }> = {};
      
      teacherList.forEach(teacher => {
        const record = existingAttendance?.find(a => a.teacher_id === teacher.id);
        if (record) {
          newAttendanceMap[teacher.id] = { 
            status: record.status, 
            in_time: record.in_time ? record.in_time.substring(0, 5) : '', 
            out_time: record.out_time ? record.out_time.substring(0, 5) : '' 
          };
        } else {
          newAttendanceMap[teacher.id] = { status: 'Present', in_time: '09:00', out_time: '17:00' };
        }
      });

      setAttendanceData(newAttendanceMap);
    } catch (err: any) {
      setError(`ডাটা লোড করতে সমস্যা: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDataChange = (teacherId: string, field: 'status' | 'in_time' | 'out_time', value: string) => {
    setAttendanceData(prev => ({
      ...prev,
      // ফিক্স: যদি prev[teacherId] না থাকে, তবে ডিফল্ট ভ্যালু নেবে
      [teacherId]: { ...(prev[teacherId] || { status: 'Present', in_time: '09:00', out_time: '17:00' }), [field]: value }
    }));
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const recordsToUpsert = teachers.map(teacher => {
        // ফিক্স: Safety Check যোগ করা হয়েছে
        const data = attendanceData[teacher.id] || { status: 'Present', in_time: '09:00', out_time: '17:00' };
        return {
          teacher_id: teacher.id,
          date: selectedDate,
          status: data.status,
          in_time: data.status === 'Absent' || data.status === 'Leave' ? null : data.in_time || null,
          out_time: data.status === 'Absent' || data.status === 'Leave' ? null : data.out_time || null,
        };
      });

      const { error: upsertError } = await supabase
        .from('teacher_attendance')
        .upsert(recordsToUpsert, { onConflict: 'teacher_id,date' });

      if (upsertError) throw upsertError;

      setSuccessMsg('শিক্ষকদের হাজিরা সফলভাবে সেভ করা হয়েছে!');
    } catch (err: any) {
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
          <h2 className="text-2xl font-bold text-gray-900">Teacher Attendance</h2>
          <p className="text-gray-500 mt-1">Track daily check-in and check-out for staff.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Date *</label>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>
        <button onClick={handleSearch} disabled={loading} className="w-full sm:w-auto px-8 bg-blue-600 text-white py-2.5 rounded-lg font-bold hover:bg-blue-700 flex items-center justify-center gap-2">
          <Search size={18} />
          {loading ? 'Loading...' : 'Load Teachers'}
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">{error}</div>}
      {successMsg && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm font-medium">{successMsg}</div>}

      {teachers.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <GraduationCap className="text-blue-600" size={20} />
              Total Staff: {teachers.length}
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-white border-b border-gray-100 text-sm">
                  <th className="px-6 py-4 font-bold text-gray-600">Employee Details</th>
                  <th className="px-6 py-4 font-bold text-gray-600">In Time</th>
                  <th className="px-6 py-4 font-bold text-gray-600">Out Time</th>
                  <th className="px-6 py-4 font-bold text-gray-600 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {teachers.map(teacher => {
                  // ফিক্স: Safety Check যোগ করা হয়েছে। যদি ডেটা না পায় তবে ডিফল্ট ডেটা দেখাবে।
                  const tData = attendanceData[teacher.id] || { status: 'Present', in_time: '09:00', out_time: '17:00' };
                  const isDisabled = tData.status === 'Absent' || tData.status === 'Leave';
                  
                  return (
                    <tr key={teacher.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-3">
  <p className="font-bold text-gray-900">
    {/* ফার্স্ট নেম এবং লাস্ট নেম আলাদা থাকলে জোড়া লাগবে, না থাকলে ফুল নেম চেক করবে */}
    {teacher.first_name 
      ? `${teacher.first_name} ${teacher.last_name || ''}` 
      : (teacher.full_name || teacher.name || teacher.teacher_name || 'নাম পাওয়া যায়নি')}
  </p>
  <p className="text-xs text-gray-500">
    {teacher.designation} • ID: {teacher.employee_id || 'N/A'}
  </p>
</td>
                      <td className="px-6 py-3">
                        <input 
                          type="time" 
                          value={tData.in_time} 
                          onChange={(e) => handleDataChange(teacher.id, 'in_time', e.target.value)}
                          disabled={isDisabled}
                          className={`px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${isDisabled ? 'bg-gray-100 text-gray-400 border-gray-200' : 'border-gray-300'}`}
                        />
                      </td>
                      <td className="px-6 py-3">
                        <input 
                          type="time" 
                          value={tData.out_time} 
                          onChange={(e) => handleDataChange(teacher.id, 'out_time', e.target.value)}
                          disabled={isDisabled}
                          className={`px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${isDisabled ? 'bg-gray-100 text-gray-400 border-gray-200' : 'border-gray-300'}`}
                        />
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleDataChange(teacher.id, 'status', 'Present')} className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all ${tData.status === 'Present' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}><CheckCircle2 size={16} className="inline mr-1"/> Present</button>
                          <button onClick={() => handleDataChange(teacher.id, 'status', 'Absent')} className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all ${tData.status === 'Absent' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}><XCircle size={16} className="inline mr-1"/> Absent</button>
                          <button onClick={() => handleDataChange(teacher.id, 'status', 'Late')} className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all ${tData.status === 'Late' ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}><Clock size={16} className="inline mr-1"/> Late</button>
                          <button onClick={() => handleDataChange(teacher.id, 'status', 'Leave')} className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all ${tData.status === 'Leave' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}><CalendarX size={16} className="inline mr-1"/> Leave</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
            <button onClick={handleSaveAttendance} disabled={saving} className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 shadow-md transition-all flex items-center gap-2">
              <Save size={20} />
              {saving ? 'Saving Records...' : 'Save Attendance'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}