// src/features/academic/AcademicCalendar.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { Calendar as CalendarIcon, Plus, Trash2, ArrowLeft, Save, CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AcademicCalendar() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ফর্ম স্টেট
  const [eventTitle, setEventTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [eventType, setEventType] = useState('Holiday');
  const [description, setDescription] = useState('');

  // ডেটাবেস থেকে ইভেন্ট লিস্ট আনা
  const fetchEvents = async () => {
    try {
      setFetchLoading(true);
      const { data, error } = await supabase
        .from('academic_calendar')
        .select('*')
        .order('start_date', { ascending: true });

      if (error) throw error;
      if (data) setEvents(data);
    } catch (err: any) {
      console.error('Error fetching calendar events:', err);
      setError('ক্যালেন্ডার ডাটা লোড করতে সমস্যা হয়েছে।');
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // নতুন ইভেন্ট/ছুটি যোগ করার ফাংশন
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !startDate || !endDate) {
      setError('অনুগ্রহ করে প্রয়োজনীয় সব ঘর পূরণ করুন।');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('শুরুর তারিখ শেষের তারিখের চেয়ে বড় হতে পারে না!');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const { error: dbError } = await supabase
        .from('academic_calendar')
        .insert([{
          event_title: eventTitle.trim(),
          start_date: startDate,
          end_date: endDate,
          event_type: eventType,
          description: description.trim() || null
        }]);

      if (dbError) throw dbError;

      setSuccessMsg('ক্যালেন্ডার ইভেন্টটি সফলভাবে যুক্ত হয়েছে!');
      setEventTitle('');
      setStartDate('');
      setEndDate('');
      setDescription('');
      
      fetchEvents();
    } catch (err: any) {
      console.error('Error adding event:', err);
      setError('ইভেন্ট সেভ করতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  // ইভেন্ট ডিলিট করার ফাংশন
  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`আপনি কি নিশ্চিতভাবে "${title}" ক্যালেন্ডার থেকে মুছে ফেলতে চান?`)) return;
    try {
      const { error } = await supabase.from('academic_calendar').delete().eq('id', id);
      if (error) throw error;
      setSuccessMsg('ইভেন্টটি সফলভাবে ডিলিট করা হয়েছে।');
      fetchEvents();
    } catch (err) {
      alert('ডিলিট করতে সমস্যা হয়েছে।');
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'Holiday':
        return <span className="px-2.5 py-1 text-xs font-bold bg-red-50 text-red-700 border border-red-100 rounded-full">Holiday</span>;
      case 'Exam':
        return <span className="px-2.5 py-1 text-xs font-bold bg-purple-50 text-purple-700 border border-purple-100 rounded-full">Exam</span>;
      case 'Event':
        return <span className="px-2.5 py-1 text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100 rounded-full">Event</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold bg-gray-50 text-gray-700 border border-gray-100 rounded-full">Other</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <Link to="/academic/management" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-gray-600" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Academic Calendar</h2>
          <p className="text-gray-500 mt-1">Manage school holidays, exams, and academic events.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ফর্ম অংশ */}
        <div className="xl:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Plus className="text-teal-600" size={20} />
              Add Event / Holiday
            </h3>

            {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm font-medium">{error}</div>}
            {successMsg && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-2.5 rounded-lg text-sm font-medium">{successMsg}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Event / Holiday Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Eid-ul-Fitr Holiday, 1st Term Exam"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Event Type</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
                >
                  <option value="Holiday">Holiday (ছুটি)</option>
                  <option value="Exam">Exam Schedule (পরীক্ষা)</option>
                  <option value="Event">School Event (অনুষ্ঠান)</option>
                  <option value="Other">Other (অন্যান্য)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date *</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Short Description (Optional)</label>
                <textarea
                  placeholder="Brief details about the event..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  rows={3}
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-600 text-white py-2.5 rounded-lg font-bold hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Save size={18} />
                {loading ? 'Saving...' : 'Save Event'}
              </button>
            </form>
          </div>
        </div>

        {/* টেবিল অংশ */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <CalendarDays className="text-teal-600" size={20} />
                Annual Event List
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-sm">
                    <th className="px-6 py-4 font-semibold text-gray-600 min-w-44">Duration / Date</th>
                    <th className="px-6 py-4 font-semibold text-gray-600">Event Title & Details</th>
                    <th className="px-6 py-4 font-semibold text-gray-600">Type</th>
                    <th className="px-6 py-4 font-semibold text-gray-600 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {fetchLoading ? (
                    <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-500 font-medium">লোড হচ্ছে...</td></tr>
                  ) : events.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-500">ক্যালেন্ডারে কোনো ইভেন্ট পাওয়া যায়নি।</td></tr>
                  ) : (
                    events.map((item) => {
                      const isSingleDay = item.start_date === item.end_date;
                      return (
                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 text-sm font-bold text-gray-700">
                            {isSingleDay ? (
                              new Date(item.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                            ) : (
                              <>
                                <span className="text-gray-800">{new Date(item.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                                <span className="text-gray-400 mx-1">→</span>
                                <span className="text-gray-800">{new Date(item.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                              </>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-gray-900 text-sm">{item.event_title}</p>
                            {item.description && <p className="text-xs text-gray-500 mt-1 max-w-sm leading-relaxed">{item.description}</p>}
                          </td>
                          <td className="px-6 py-4">
                            {getTypeBadge(item.event_type)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => handleDelete(item.id, item.event_title)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}