// src/features/attendance/AbsentSMS.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { ArrowLeft, Search, Send, MessageSquare, Phone, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AbsentSMS() {
  const [classes, setClasses] = useState<any[]>([]);
  const [absentees, setAbsentees] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [messageTemplate, setMessageTemplate] = useState('Dear Guardian, your child {student_name} is absent today ({date}). Please contact the school authority. - School Admin');

  // ক্লাস লোড করা
  useEffect(() => {
    const fetchClasses = async () => {
      const { data } = await supabase.from('classes').select('*').order('numeric_value', { ascending: true });
      if (data) setClasses(data);
    };
    fetchClasses();
  }, []);

  // অনুপস্থিত স্টুডেন্টদের লোড করা
  const handleSearchAbsentees = async () => {
    if (!selectedClassId || !selectedDate) {
      setError('অনুগ্রহ করে ক্লাস এবং তারিখ নির্বাচন করুন।');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    setAbsentees([]);

    try {
      // ১. নির্দিষ্ট তারিখে ওই ক্লাসের যারা Absent তাদের ডেটা আনা
      const { data: attendanceRecords, error: attError } = await supabase
        .from('student_attendance')
        .select('student_id, status')
        .eq('class_id', selectedClassId)
        .eq('date', selectedDate)
        .eq('status', 'Absent');

      if (attError) throw attError;

      if (!attendanceRecords || attendanceRecords.length === 0) {
        setError('এই তারিখে এই ক্লাসে কোনো অনুপস্থিত (Absent) স্টুডেন্ট পাওয়া যায়নি।');
        setLoading(false);
        return;
      }

      const absenteeIds = attendanceRecords.map(r => r.student_id);

      // ২. ওই স্টুডেন্টদের বিস্তারিত তথ্য (নাম, ফোন নাম্বার) আনা
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id, first_name, last_name, admission_no, guardian_phone')
        .in('id', absenteeIds);

      if (studentError) throw studentError;

      setAbsentees(studentData || []);
    } catch (err: any) {
      setError(`ডেটা লোড করতে সমস্যা: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // SMS পাঠানো (সিমুলেশন এবং লগ সেভ করা)
  const handleSendSMS = async () => {
    if (absentees.length === 0) return;
    if (!window.confirm(`আপনি কি নিশ্চিতভাবে ${absentees.length} জন অভিভাবককে SMS পাঠাতে চান?`)) return;

    setSending(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // SMS Log-এর জন্য পেলোড তৈরি করা
      const smsLogs = absentees.map(student => {
        const studentName = `${student.first_name} ${student.last_name || ''}`;
        const finalMessage = messageTemplate
          .replace('{student_name}', studentName)
          .replace('{date}', new Date(selectedDate).toLocaleDateString('en-GB'));

        return {
          recipient_phone: student.guardian_phone,
          message_body: finalMessage,
          student_id: student.id,
          status: 'Sent'
        };
      });

      // ডাটাবেসে লগ সেভ করা
      const { error: logError } = await supabase.from('sms_logs').insert(smsLogs);
      
      if (logError) throw logError;

      // রিয়েল SMS API কল ভবিষ্যতে এখানে বসবে। আপাতত আমরা একটি ছোট ড্যামি ডিলে (Delay) দিচ্ছি।
      await new Promise(resolve => setTimeout(resolve, 1500)); 

      setSuccessMsg(`সফলভাবে ${absentees.length} জনকে SMS পাঠানো হয়েছে (লগে সেভ করা হয়েছে)!`);
      setAbsentees([]); // পাঠানো শেষে লিস্ট ক্লিয়ার করা
    } catch (err: any) {
      setError(`SMS পাঠাতে সমস্যা: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4 mb-2">
        <Link to="/academic/attendance" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-gray-600" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Absent SMS Notification</h2>
          <p className="text-gray-500 mt-1">Send bulk SMS to the guardians of absent students.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Filter & Template Form */}
        <div className="lg:col-span-1 space-y-6">
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Search className="text-orange-600" size={20} />
              Find Absentees
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Date *</label>
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Class *</label>
                <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white">
                  <option value="">-- Select Class --</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                </select>
              </div>
              <button onClick={handleSearchAbsentees} disabled={loading} className="w-full bg-orange-100 text-orange-700 py-2.5 rounded-lg font-bold hover:bg-orange-200 transition-colors border border-orange-200">
                {loading ? 'Searching...' : 'Search Absentees'}
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare className="text-orange-600" size={20} />
              Message Template
            </h3>
            <div className="space-y-4">
              <textarea 
                value={messageTemplate} 
                onChange={(e) => setMessageTemplate(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm"
              />
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <span className="font-bold text-gray-700 mb-1 block">Supported Variables:</span>
                <code>{'{student_name}'}</code> : Auto-replaced with student's name.<br/>
                <code>{'{date}'}</code> : Auto-replaced with selected date.
              </div>
            </div>
          </div>

        </div>

        {/* Right Side: Results & Send Button */}
        <div className="lg:col-span-2">
          {error && <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">{error}</div>}
          {successMsg && <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm font-medium">{successMsg}</div>}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-100 flex flex-col">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Users className="text-orange-600" size={20} />
                Absentee List
              </h3>
              <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-bold">
                {absentees.length} Found
              </span>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white border-b border-gray-100 text-sm">
                    <th className="px-6 py-4 font-bold text-gray-600">Student Info</th>
                    <th className="px-6 py-4 font-bold text-gray-600">Guardian Phone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {absentees.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="px-6 py-20 text-center text-gray-500">
                        কোনো অনুপস্থিত স্টুডেন্ট নেই বা এখনো সার্চ করা হয়নি।
                      </td>
                    </tr>
                  ) : (
                    absentees.map(student => (
                      <tr key={student.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-3">
                          <p className="font-bold text-gray-900">{student.first_name} {student.last_name}</p>
                          <p className="text-xs text-gray-500">ID: {student.admission_no}</p>
                        </td>
                        <td className="px-6 py-3">
                          <span className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-gray-100 w-fit px-3 py-1 rounded-lg">
                            <Phone size={14} className="text-gray-400" />
                            {student.guardian_phone || 'N/A'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-5 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button 
                onClick={handleSendSMS} 
                disabled={sending || absentees.length === 0} 
                className={`bg-orange-600 text-white px-8 py-3 rounded-lg font-bold shadow-md transition-all flex items-center gap-2 ${absentees.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-orange-700'}`}
              >
                <Send size={20} className={sending ? 'animate-pulse' : ''} />
                {sending ? 'Sending SMS...' : `Send SMS to All (${absentees.length})`}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}