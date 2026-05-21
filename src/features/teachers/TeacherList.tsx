// src/features/teachers/TeacherList.tsx
import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, Eye, RefreshCw, Users, UserCheck, UserX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../config/supabase';

export default function TeacherList() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ফিল্টার স্টেট
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDesignation, setSelectedDesignation] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');

  // ১. ডেটা ফেচিং (রেস কন্ডিশন প্রটেকশন সহ)
  useEffect(() => {
    let isMounted = true;

    const fetchTeachers = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('teachers')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        if (isMounted && data) {
          setTeachers(data);
        }
      } catch (error) {
        console.error('Error fetching teachers:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchTeachers();

    return () => {
      isMounted = false;
    };
  }, []);

  // ২. রিফ্রেশ ফাংশন
  const handleRefresh = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setTeachers(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // ৩. ডিলিট ফাংশন
  const handleDelete = async (id: string, name: string) => {
    const confirmDelete = window.confirm(`আপনি কি সত্যিই ${name} স্যারের ডেটা মুছে ফেলতে চান?`);
    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from('teachers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTeachers(teachers.filter(teacher => teacher.id !== id));
      alert('শিক্ষকের ডেটা সফলভাবে মুছে ফেলা হয়েছে।');
    } catch (error: any) {
      console.error('Error deleting teacher:', error);
      alert('ডিলিট করতে সমস্যা হয়েছে: ' + error.message);
    }
  };

  // --- টপ ইনফো কার্ডের ডেটা ---
  const stats = useMemo(() => {
    const total = teachers.length;
    const active = teachers.filter(t => t.status === 'Active').length;
    const inactive = teachers.filter(t => t.status === 'Inactive').length;
    return { total, active, inactive };
  }, [teachers]);

  // --- ডাইনামিক ফিল্টার অপশন ---
  const uniqueDesignations = useMemo(() => {
    const designations = teachers.map(t => t.designation).filter(Boolean);
    return [...new Set(designations)];
  }, [teachers]);

  const uniqueDepartments = useMemo(() => {
    let filtered = teachers;
    if (selectedDesignation) {
      filtered = teachers.filter(t => t.designation === selectedDesignation);
    }
    const departments = filtered.map(t => t.department).filter(Boolean);
    return [...new Set(departments)];
  }, [teachers, selectedDesignation]);

  // --- টেবিলের ডেটা ফিল্টার করা ---
  const filteredTeachers = useMemo(() => {
    return teachers.filter(teacher => {
      const searchMatch = 
        teacher.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.phone?.includes(searchQuery);
      
      const desigMatch = selectedDesignation ? teacher.designation === selectedDesignation : true;
      const deptMatch = selectedDepartment ? teacher.department === selectedDepartment : true;

      return searchMatch && desigMatch && deptMatch;
    });
  }, [teachers, searchQuery, selectedDesignation, selectedDepartment]);


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Teachers</h2>
          <p className="text-gray-500 mt-1">Manage teaching staff and departments.</p>
        </div>
        <Link 
          to="/teachers/add" 
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={20} />
          <span>Add New Teacher</span>
        </Link>
      </div>

      {/* Top Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Teachers</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg">
            <UserCheck size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Active Staff</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats.active}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-lg">
            <UserX size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">On Leave / Inactive</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats.inactive}</h3>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by name or phone..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          {/* Designation Filter */}
          <select 
            value={selectedDesignation}
            onChange={(e) => {
              setSelectedDesignation(e.target.value);
              setSelectedDepartment(''); 
            }}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">All Designations</option>
            {uniqueDesignations.map(desig => (
              <option key={desig} value={desig}>{desig}</option>
            ))}
          </select>

          {/* Department Filter */}
          <select 
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">All Departments</option>
            {uniqueDepartments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
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
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Name</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Designation</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Department</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Phone</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Status</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">ডেটা লোড হচ্ছে...</td>
                </tr>
              ) : filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">কোনো শিক্ষকের ডেটা পাওয়া যায়নি।</td>
                </tr>
              ) : (
                filteredTeachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{teacher.first_name} {teacher.last_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{teacher.designation}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{teacher.department || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{teacher.phone}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        teacher.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {teacher.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex items-center justify-end gap-3">
                      <Link to={`/teachers/${teacher.id}`} className="text-gray-400 hover:text-indigo-600 transition-colors" title="View Profile">
                        <Eye size={18} />
                      </Link>
                      <Link to={`/teachers/edit/${teacher.id}`} className="text-gray-400 hover:text-blue-600 transition-colors" title="Edit">
                        <Edit size={18} />
                      </Link>
                      <button 
                        onClick={() => handleDelete(teacher.id, teacher.first_name)} 
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