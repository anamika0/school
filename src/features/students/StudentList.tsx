// src/features/students/StudentList.tsx
import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, Eye, RefreshCw, Users, UserCheck, UserX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../config/supabase';

export default function StudentList() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // নতুন ফিল্টার স্টেট
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  // ১. ডেটা ফেচিং এবং রেস কন্ডিশন ফিক্স (আপনার দেওয়া পারফেক্ট কোড)
  useEffect(() => {
    let isMounted = true;

    const fetchStudents = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        if (isMounted && data) {
          setStudents(data);
        }
      } catch (error) {
        console.error('Error fetching students:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchStudents();

    return () => {
      isMounted = false;
    };
  }, []);

  // ২. ম্যানুয়াল রিফ্রেশ ফাংশন (আপনার দেওয়া)
  const handleRefresh = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setStudents(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // ৩. ডিলিট ফাংশন (আপনার দেওয়া)
  const handleDelete = async (id: string, name: string) => {
    const confirmDelete = window.confirm(`আপনি কি সত্যিই ${name}-এর ডেটা মুছে ফেলতে চান?`);
    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setStudents(students.filter(student => student.id !== id));
      alert('স্টুডেন্টের ডেটা সফলভাবে মুছে ফেলা হয়েছে।');
    } catch (error: any) {
      console.error('Error deleting student:', error);
      alert('ডিলিট করতে সমস্যা হয়েছে: ' + error.message);
    }
  };

  // --- নতুন লজিক: টপ ইনফো কার্ড এবং ডাইনামিক ফিল্টার ---
  
  // কার্ডের জন্য স্টুডেন্টদের সংখ্যা গোনা
  const stats = useMemo(() => {
    const total = students.length;
    const active = students.filter(s => s.status === 'Active').length;
    const inactive = students.filter(s => s.status === 'Inactive').length;
    return { total, active, inactive };
  }, [students]);

  // ডেটাবেস থেকে শুধু ইউনিক ক্লাসগুলো বের করে আনা
  const uniqueClasses = useMemo(() => {
    const classes = students.map(s => s.class_name).filter(Boolean);
    return [...new Set(classes)];
  }, [students]);

  // সিলেক্ট করা ক্লাস অনুযায়ী ইউনিক সেকশনগুলো বের করে আনা
  const uniqueSections = useMemo(() => {
    let filteredForSection = students;
    if (selectedClass) {
      filteredForSection = students.filter(s => s.class_name === selectedClass);
    }
    const sections = filteredForSection.map(s => s.section).filter(Boolean);
    return [...new Set(sections)];
  }, [students, selectedClass]);

  // সার্চ এবং ড্রপডাউন অনুযায়ী টেবিলের ডেটা ফিল্টার করা
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const searchMatch = 
        student.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.admission_no?.includes(searchQuery) ||
        student.guardian_phone?.includes(searchQuery);
      
      const classMatch = selectedClass ? student.class_name === selectedClass : true;
      const sectionMatch = selectedSection ? student.section === selectedSection : true;

      return searchMatch && classMatch && sectionMatch;
    });
  }, [students, searchQuery, selectedClass, selectedSection]);


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Students</h2>
          <p className="text-gray-500 mt-1">Manage all your students from here.</p>
        </div>
        <Link 
          to="/students/admission" 
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={20} />
          <span>New Admission</span>
        </Link>
      </div>

      {/* Top Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Students</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg">
            <UserCheck size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Active Students</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats.active}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-lg">
            <UserX size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Inactive Students</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats.inactive}</h3>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar with Refresh Button */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by name, ID or phone..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          {/* Class Filter */}
          <select 
            value={selectedClass}
            onChange={(e) => {
              setSelectedClass(e.target.value);
              setSelectedSection(''); // ক্লাস চেঞ্জ করলে সেকশন রিসেট হবে
            }}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">All Classes</option>
            {uniqueClasses.map(cls => (
              <option key={cls} value={cls}>Class {cls}</option>
            ))}
          </select>

          {/* Section Filter */}
          <select 
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">All Sections</option>
            {uniqueSections.map(sec => (
              <option key={sec} value={sec}>{sec}</option>
            ))}
          </select>

          <button 
            onClick={handleRefresh}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors font-medium border border-indigo-200"
            title="Refresh Data"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Admission No</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Name</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Class & Section</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Guardian Phone</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Status</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">ডেটা লোড হচ্ছে...</td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">কোনো স্টুডেন্ট পাওয়া যায়নি। নতুন ভর্তি করুন।</td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{student.admission_no}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{student.first_name} {student.last_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      Class {student.class_name} {student.section && `- ${student.section}`}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{student.guardian_phone}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        student.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex items-center justify-end gap-3">
                      <Link to={`/students/${student.id}`} className="text-gray-400 hover:text-indigo-600 transition-colors" title="View Profile">
                        <Eye size={18} />
                      </Link>
                      <Link to={`/students/edit/${student.id}`} className="text-gray-400 hover:text-blue-600 transition-colors" title="Edit">
                        <Edit size={18} />
                      </Link>
                      <button 
                        onClick={() => handleDelete(student.id, student.first_name)} 
                        className="text-gray-400 hover:text-red-600 transition-colors" 
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}

            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}