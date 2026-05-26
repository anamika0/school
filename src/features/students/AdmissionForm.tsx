// src/features/students/AdmissionForm.tsx
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, User, BookOpen, Users, Camera, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabase';

export default function AdmissionForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ডাইনামিক ক্লাস ও সেকশন লোড করার স্টেট
  const [academicClasses, setAcademicClasses] = useState<any[]>([]);
  const [academicSections, setAcademicSections] = useState<any[]>([]);
  const [filteredSections, setFilteredSections] = useState<any[]>([]);

  // 🚀 ছবি আপলোডের স্টেট
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    blood_group: '',
    religion: '',
    admission_date: new Date().toISOString().split('T')[0],
    class_id: '',
    section_id: '',
    father_name: '',
    mother_name: '',
    guardian_phone: '',
    present_address: '',
    // 🚀 নতুন যুক্ত হওয়া ফিল্ড
    birth_cert_nid: '',
    prev_school_info: ''
  });

  // Academic Management থেকে ডেটা ফেচ করা
  useEffect(() => {
    const fetchAcademicData = async () => {
      const { data: classData } = await supabase.from('classes').select('*').order('numeric_value', { ascending: true });
      if (classData) setAcademicClasses(classData);

      const { data: sectionData } = await supabase.from('sections').select('*');
      if (sectionData) setAcademicSections(sectionData);
    };
    fetchAcademicData();
  }, []);

  // ক্লাস সিলেক্ট করলে সেকশন ফিল্টার হওয়া
  useEffect(() => {
    if (formData.class_id) {
      setFilteredSections(academicSections.filter(s => s.class_id === formData.class_id));
    } else {
      setFilteredSections([]);
    }
  }, [formData.class_id, academicSections]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 🚀 ছবি সিলেক্ট করলে প্রিভিউ দেখানোর লজিক
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const currentYear = new Date().getFullYear();
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const admission_no = `${currentYear}${randomNum}`;

      // সিলেক্ট করা ক্লাস ও সেকশনের নাম বের করা
      const selectedClass = academicClasses.find(c => c.id === formData.class_id);
      const selectedSection = academicSections.find(s => s.id === formData.section_id);

      let uploadedPhotoUrl = null;

      // 🚀 ১. যদি ছবি সিলেক্ট করা থাকে, আগে সেটি Supabase Storage-এ আপলোড হবে
      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        const filePath = `profile_pictures/${fileName}`;

        const { error: uploadErr } = await supabase.storage
          .from('student-photos')
          .upload(filePath, photoFile);

        if (uploadErr) throw uploadErr;

        const { data: publicUrlData } = supabase.storage
          .from('student-photos')
          .getPublicUrl(filePath);

        uploadedPhotoUrl = publicUrlData.publicUrl;
      }

      const payload = {
        ...formData,
        photo_url: uploadedPhotoUrl, // 🚀 ছবির লিংক
        class_name: selectedClass?.class_name || '', 
        section: selectedSection?.section_name || null, 
        section_id: formData.section_id || null, 
        blood_group: formData.blood_group || null,
        religion: formData.religion || null,
        admission_no,
        status: 'Active'
      };

      const { error: insertError } = await supabase.from('students').insert([payload]);
      if (insertError) throw insertError;

      navigate('/students'); 
    } catch (err: any) {
      console.error('Error adding student:', err);
      setError(err.message || 'স্টুডেন্ট অ্যাড করতে সমস্যা হয়েছে।');
      setLoading(false); 
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/students" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-gray-600" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">New Student Admission</h2>
            <p className="text-gray-500 mt-1">Fill all the required information to admit a new student.</p>
          </div>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg font-medium">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* 🚀 Photo Upload Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
          <div className="relative">
            <div className="w-32 h-32 rounded-full border-4 border-indigo-50 shadow-sm overflow-hidden bg-gray-50 flex items-center justify-center">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <Camera size={40} className="text-gray-300" />
              )}
            </div>
            {photoPreview ? (
              <button type="button" onClick={removePhoto} className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full hover:bg-red-600">
                <X size={16} />
              </button>
            ) : (
              <label className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2.5 rounded-full cursor-pointer hover:bg-indigo-700 shadow-md">
                <Camera size={18} />
                <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
              </label>
            )}
          </div>
          <p className="text-sm font-medium text-gray-500 mt-3">Upload Student Photo (Optional)</p>
        </div>

        {/* Personal Info */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
            <User className="text-indigo-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
              <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
              <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
              <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gender *</label>
              <select name="gender" value={formData.gender} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Blood Group</label>
              <select name="blood_group" value={formData.blood_group} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="">Select Group</option>
                <option value="A+">A+</option><option value="B+">B+</option><option value="O+">O+</option><option value="AB+">AB+</option><option value="A-">A-</option><option value="B-">B-</option><option value="O-">O-</option><option value="AB-">AB-</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Religion</label>
              <select name="religion" value={formData.religion} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="">Select Religion</option>
                <option value="Islam">Islam</option><option value="Hinduism">Hinduism</option><option value="Christianity">Christianity</option><option value="Buddhism">Buddhism</option>
              </select>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Admission Date *</label>
              <input type="date" name="admission_date" value={formData.admission_date} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>

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
          </div>
        </div>

        {/* Guardian Info */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
            <Users className="text-indigo-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-900">Guardian Information</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Father's Name *</label>
              <input type="text" name="father_name" value={formData.father_name} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mother's Name *</label>
              <input type="text" name="mother_name" value={formData.mother_name} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Guardian Phone *</label>
              <input type="tel" name="guardian_phone" value={formData.guardian_phone} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Present Address *</label>
              <input type="text" name="present_address" value={formData.present_address} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
        </div>

        {/* 🚀 Official Documents */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-4 border-b border-gray-100">Official Documents & Records</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Birth Certificate / NID</label>
              <input type="text" name="birth_cert_nid" value={formData.birth_cert_nid} onChange={handleChange} placeholder="Enter tracking number" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Previous School Info</label>
              <textarea name="prev_school_info" value={formData.prev_school_info} onChange={handleChange} placeholder="School name, transfer details..." className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 h-11" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <button type="button" onClick={() => navigate('/students')} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
          <button type="submit" disabled={loading} className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-2 rounded-lg hover:bg-indigo-700 font-medium">
            <Save size={20} />
            <span>{loading ? 'Saving...' : 'Save Student'}</span>
          </button>
        </div>

      </form>
    </div>
  );
}