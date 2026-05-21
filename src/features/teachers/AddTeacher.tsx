// src/features/teachers/AddTeacher.tsx
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, User, Briefcase, Phone, Plus, List } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabase';

export default function AddTeacher() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // বিদ্যমান ডেটা লোড করার স্টেট
  const [existingDesignations, setExistingDesignations] = useState<string[]>([]);
  const [existingDepartments, setExistingDepartments] = useState<string[]>([]);

  // কাস্টম ইনপুট টগল স্টেট
  const [isCustomDesignation, setIsCustomDesignation] = useState(false);
  const [isCustomDepartment, setIsCustomDepartment] = useState(false);

  // ফর্ম ডেটা
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    designation: '',
    department: '',
    joining_date: new Date().toISOString().split('T')[0],
    gender: '',
    blood_group: '',
    religion: '',
    present_address: '',
  });

  // পেজ লোড হলে আগের পদবি ও ডিপার্টমেন্টগুলো নিয়ে আসা
  useEffect(() => {
    const fetchExistingMeta = async () => {
      try {
        const { data } = await supabase.from('teachers').select('designation, department');
        if (data) {
          const desig = data.map(t => t.designation).filter(Boolean);
          const dept = data.map(t => t.department).filter(Boolean);
          setExistingDesignations([...new Set(desig)]);
          setExistingDepartments([...new Set(dept)]);
        }
      } catch (err) {
        console.error('Error fetching metadata:', err);
      }
    };
    fetchExistingMeta();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // ফাঁকা ফিল্ডগুলোকে null করে ক্লিন পেলোড তৈরি
      const payload = {
        ...formData,
        designation: formData.designation.trim(),
        department: formData.department ? formData.department.trim() : null,
        email: formData.email ? formData.email.trim() : null,
        blood_group: formData.blood_group || null,
        religion: formData.religion || null,
        present_address: formData.present_address || null,
        status: 'Active'
      };

      const { error: insertError } = await supabase
        .from('teachers')
        .insert([payload]);

      if (insertError) throw insertError;

      navigate('/teachers'); 

    } catch (err: any) {
      console.error('Error adding teacher:', err);
      setError(err.message || 'শিক্ষক যুক্ত করতে সমস্যা হয়েছে।');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/teachers" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-gray-600" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Add New Teacher</h2>
            <p className="text-gray-500 mt-1">Register a new teaching staff member.</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Section 1: Personal Info */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
            <User className="text-indigo-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name <span className="text-red-500">*</span></label>
              <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name <span className="text-red-500">*</span></label>
              <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gender <span className="text-red-500">*</span></label>
              <select name="gender" value={formData.gender} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white">
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Blood Group</label>
              <select name="blood_group" value={formData.blood_group} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white">
                <option value="">Select Group</option>
                <option value="A+">A+</option>
                <option value="B+">B+</option>
                <option value="O+">O+</option>
                <option value="AB+">AB+</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Religion</label>
              <select name="religion" value={formData.religion} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white">
                <option value="">Select Religion</option>
                <option value="Islam">Islam</option>
                <option value="Hinduism">Hinduism</option>
                <option value="Christianity">Christianity</option>
                <option value="Buddhism">Buddhism</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Professional Info */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
            <Briefcase className="text-indigo-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-900">Professional Details</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Joining Date <span className="text-red-500">*</span></label>
              <input type="date" name="joining_date" value={formData.joining_date} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>

            {/* Dynamic Designation */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Designation <span className="text-red-500">*</span></label>
                <button
                  type="button"
                  onClick={() => { setIsCustomDesignation(!isCustomDesignation); setFormData({ ...formData, designation: '' }); }}
                  className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  {isCustomDesignation ? <List size={14} /> : <Plus size={14} />}
                  {isCustomDesignation ? 'Select Existing' : 'Add Custom'}
                </button>
              </div>
              {isCustomDesignation ? (
                <input type="text" name="designation" value={formData.designation} onChange={handleChange} required placeholder="e.g. Headmaster" className="w-full px-4 py-2 border border-indigo-300 bg-indigo-50/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              ) : (
                <select name="designation" value={formData.designation} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white">
                  <option value="">Select Designation</option>
                  {existingDesignations.length > 0 ? (
                    existingDesignations.map(d => <option key={d} value={d}>{d}</option>)
                  ) : (
                    <>
                      <option value="Senior Teacher">Senior Teacher</option>
                      <option value="Assistant Teacher">Assistant Teacher</option>
                    </>
                  )}
                </select>
              )}
            </div>

            {/* Dynamic Department */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <button
                  type="button"
                  onClick={() => { setIsCustomDepartment(!isCustomDepartment); setFormData({ ...formData, department: '' }); }}
                  className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  {isCustomDepartment ? <List size={14} /> : <Plus size={14} />}
                  {isCustomDepartment ? 'Select Existing' : 'Add Custom'}
                </button>
              </div>
              {isCustomDepartment ? (
                <input type="text" name="department" value={formData.department} onChange={handleChange} placeholder="e.g. Science, Mathematics" className="w-full px-4 py-2 border border-indigo-300 bg-indigo-50/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              ) : (
                <select name="department" value={formData.department} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white">
                  <option value="">Select Department</option>
                  {existingDepartments.length > 0 ? (
                    existingDepartments.map(d => <option key={d} value={d}>{d}</option>)
                  ) : (
                    <>
                      <option value="Science">Science</option>
                      <option value="Arts">Arts</option>
                      <option value="English">English</option>
                    </>
                  )}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Contact Info */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
            <Phone className="text-indigo-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-900">Contact Details</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number <span className="text-red-500">*</span></label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="01XXXXXXXXX" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="teacher@school.com" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Present Address</label>
              <input type="text" name="present_address" value={formData.present_address} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="Full address" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <button type="button" onClick={() => navigate('/teachers')} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
          <button type="submit" disabled={loading} className={`flex items-center gap-2 bg-indigo-600 text-white px-8 py-2 rounded-lg hover:bg-indigo-700 font-medium ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}>
            <Save size={20} />
            <span>{loading ? 'Saving...' : 'Save Teacher'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}