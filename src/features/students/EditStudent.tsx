// src/features/students/EditStudent.tsx
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, User, BookOpen, Users } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../config/supabase';

export default function EditStudent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ডাইনামিক ক্লাস ও সেকশন স্টেট
  const [academicClasses, setAcademicClasses] = useState<any[]>([]);
  const [academicSections, setAcademicSections] = useState<any[]>([]);
  const [filteredSections, setFilteredSections] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    blood_group: '',
    religion: '',
    admission_date: '',
    class_id: '',
    section_id: '',
    roll_no: '',
    father_name: '',
    mother_name: '',
    guardian_phone: '',
    present_address: '',
    status: 'Active'
  });

  // ১. Academic ডেটা লোড করা
  useEffect(() => {
    const fetchAcademicData = async () => {
      const { data: classData } = await supabase.from('classes').select('*').order('numeric_value', { ascending: true });
      if (classData) setAcademicClasses(classData);

      const { data: sectionData } = await supabase.from('sections').select('*');
      if (sectionData) setAcademicSections(sectionData);
    };
    fetchAcademicData();
  }, []);

  // ২. স্টুডেন্টের বর্তমান তথ্য লোড করা
  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        
        if (data) {
          const sanitizedData = Object.keys(data).reduce((acc, key) => {
            acc[key] = data[key] === null ? '' : data[key];
            return acc;
          }, {} as any);
          
          setFormData(sanitizedData);
        }
      } catch (err: any) {
        console.error('Error fetching student:', err);
        setError('স্টুডেন্টের তথ্য লোড করতে সমস্যা হয়েছে।');
      } finally {
        setFetching(false);
      }
    };

    if (id) fetchStudent();
  }, [id]);

  // ৩. ক্লাস সিলেক্ট করলে সেকশন ফিল্টার হওয়া
  useEffect(() => {
    if (formData.class_id) {
      setFilteredSections(academicSections.filter(s => s.class_id === formData.class_id));
    } else {
      setFilteredSections([]);
    }
  }, [formData.class_id, academicSections]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { id: _, created_at: __, admission_no: ___, class_name: ____, section: _____, ...updateData } = formData as any;

      if (updateData.roll_no === '') {
        updateData.roll_no = null;
      } else if (updateData.roll_no) {
        updateData.roll_no = parseInt(updateData.roll_no.toString(), 10);
      }

      // লিস্টের জন্য নামগুলো আপডেট রাখা
      const selectedClass = academicClasses.find(c => c.id === formData.class_id);
      const selectedSection = academicSections.find(s => s.id === formData.section_id);
      
      updateData.class_name = selectedClass?.class_name || '';
      updateData.section = selectedSection?.section_name || null;
      updateData.section_id = updateData.section_id || null;

      const { error: updateError } = await supabase
        .from('students')
        .update(updateData)
        .eq('id', id);

      if (updateError) throw updateError;

      navigate(`/students/${id}`);
    } catch (err: any) {
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
          <Link to={`/students/${id}`} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-gray-600" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Edit Student Information</h2>
            <p className="text-gray-500 mt-1">Update details for {formData.first_name} {formData.last_name}</p>
          </div>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Personal Info */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
            <User className="text-indigo-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
              <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
              <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white font-bold">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Blood Group</label>
              <input type="text" name="blood_group" value={formData.blood_group} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Religion</label>
              <input type="text" name="religion" value={formData.religion} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
        </div>

        {/* Academic Info - Linked with Academic Management */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
            <BookOpen className="text-indigo-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-900">Academic Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Class *</label>
              <select
                name="class_id"
                value={formData.class_id}
                onChange={(e) => {
                  handleChange(e);
                  setFormData(prev => ({ ...prev, section_id: '' }));
                }}
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">Select Class</option>
                {academicClasses.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
              <select
                name="section_id"
                value={formData.section_id}
                onChange={handleChange}
                disabled={!formData.class_id}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">Select Section</option>
                {filteredSections.map(s => <option key={s.id} value={s.id}>{s.section_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Roll No</label>
              <input type="number" name="roll_no" value={formData.roll_no} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
        </div>

        {/* Guardian Info */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
            <Users className="text-indigo-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-900">Guardian & Address</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Father's Name</label>
              <input type="text" name="father_name" value={formData.father_name} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mother's Name</label>
              <input type="text" name="mother_name" value={formData.mother_name} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Guardian Phone</label>
              <input type="tel" name="guardian_phone" value={formData.guardian_phone} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Present Address</label>
              <input type="text" name="present_address" value={formData.present_address} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button type="button" onClick={() => navigate(-1)} className="px-6 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={loading} className="bg-indigo-600 text-white px-8 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700">
            <Save size={20} />
            {loading ? 'Saving...' : 'Update Student'}
          </button>
        </div>
      </form>
    </div>
  );
}