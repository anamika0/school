// src/features/teachers/EditTeacher.tsx
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, User, Briefcase, Phone, Plus, List } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../config/supabase';

export default function EditTeacher() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // বিদ্যমান ডেটা লোড করার স্টেট
  const [existingDesignations, setExistingDesignations] = useState<string[]>([]);
  const [existingDepartments, setExistingDepartments] = useState<string[]>([]);

  // কাস্টম ইনপুট টগল স্টেট
  const [isCustomDesignation, setIsCustomDesignation] = useState(false);
  const [isCustomDepartment, setIsCustomDepartment] = useState(false);

  // ফর্ম ডেটা স্টেট
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    designation: '',
    department: '',
    joining_date: '',
    gender: '',
    blood_group: '',
    religion: '',
    present_address: '',
    status: 'Active'
  });

  // ১. শিক্ষকের বর্তমান তথ্য ফেচ করা এবং Sanitize করা
  useEffect(() => {
    const fetchTeacherAndMeta = async () => {
      try {
        setFetching(true);
        
        // শিক্ষকের ডেটা আনা
        const { data: teacherData, error: teacherError } = await supabase
          .from('teachers')
          .select('*')
          .eq('id', id)
          .single();

        if (teacherError) throw teacherError;

        // ড্রপডাউনের জন্য মেটাডেটা আনা
        const { data: metaData } = await supabase.from('teachers').select('designation, department');
        if (metaData) {
          const desig = metaData.map(t => t.designation).filter(Boolean);
          const dept = metaData.map(t => t.department).filter(Boolean);
          setExistingDesignations([...new Set(desig)]);
          setExistingDepartments([...new Set(dept)]);
        }

        if (teacherData) {
          // React Warning Fix: null ভ্যালুগুলোকে ফাঁকা স্ট্রিং ("") এ রূপান্তর করা
          const sanitizedData = Object.keys(teacherData).reduce((acc, key) => {
            acc[key] = teacherData[key] === null ? '' : teacherData[key];
            return acc;
          }, {} as any);
          
          setFormData(sanitizedData);
        }
      } catch (err: any) {
        console.error('Error fetching teacher data:', err);
        setError('শিক্ষকের তথ্য লোড করতে সমস্যা হয়েছে।');
      } finally {
        setFetching(false);
      }
    };

    if (id) fetchTeacherAndMeta();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ২. তথ্য আপডেট করা
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // সাইলেন্ট ফেইলর এড়াতে id এবং created_at বাদ দিয়ে পেলোড আলাদা করা হলো
      const { id: _, created_at: __, ...updateData } = formData as any;

      const payload = {
        ...updateData,
        designation: updateData.designation.trim(),
        department: updateData.department ? updateData.department.trim() : null,
        email: updateData.email ? updateData.email.trim() : null,
        blood_group: updateData.blood_group || null,
        religion: updateData.religion || null,
        present_address: updateData.present_address || null,
      };

      const { data, error: updateError } = await supabase
        .from('teachers')
        .update(payload)
        .eq('id', id)
        .select();

      if (updateError) throw updateError;

      if (!data || data.length === 0) {
        throw new Error('ডেটাবেসে কোনো পরিবর্তন করা যায়নি।');
      }

      navigate(`/teachers/${id}`); // সফল হলে প্রোফাইলে ফেরত যাবে
    } catch (err: any) {
      console.error('Update error:', err);
      setError(err.message || 'আপডেট করতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-10 text-center">তথ্য লোড হচ্ছে...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={`/teachers/${id}`} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-gray-600" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Edit Teacher Information</h2>
            <p className="text-gray-500 mt-1">Update details for {formData.first_name} {formData.last_name}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg font-medium">{error}</div>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
              <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
              <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-bold">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Blood Group</label>
              <input type="text" name="blood_group" value={formData.blood_group} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Religion</label>
              <input type="text" name="religion" value={formData.religion} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Joining Date</label>
              <input type="date" name="joining_date" value={formData.joining_date} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>

            {/* Dynamic Designation */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Designation</label>
                <button
                  type="button"
                  onClick={() => { setIsCustomDesignation(!isCustomDesignation); setFormData({ ...formData, designation: '' }); }}
                  className="text-xs flex items-center gap-1 text-indigo-600 font-medium"
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
                  {existingDesignations.map(d => <option key={d} value={d}>{d}</option>)}
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
                  className="text-xs flex items-center gap-1 text-indigo-600 font-medium"
                >
                  {isCustomDepartment ? <List size={14} /> : <Plus size={14} />}
                  {isCustomDepartment ? 'Select Existing' : 'Add Custom'}
                </button>
              </div>
              {isCustomDepartment ? (
                <input type="text" name="department" value={formData.department} onChange={handleChange} placeholder="e.g. Science" className="w-full px-4 py-2 border border-indigo-300 bg-indigo-50/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              ) : (
                <select name="department" value={formData.department} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white">
                  <option value="">Select Department</option>
                  {existingDepartments.map(d => <option key={d} value={d}>{d}</option>)}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Present Address</label>
              <input type="text" name="present_address" value={formData.present_address} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button type="button" onClick={() => navigate(-1)} className="px-6 py-2 border rounded-lg font-medium">Cancel</button>
          <button type="submit" disabled={loading} className="bg-indigo-600 text-white px-8 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 font-medium">
            <Save size={20} />
            {loading ? 'Saving...' : 'Update Teacher'}
          </button>
        </div>
      </form>
    </div>
  );
}