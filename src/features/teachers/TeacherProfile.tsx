// src/features/teachers/TeacherProfile.tsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { ArrowLeft, User, Briefcase, Phone, Edit } from 'lucide-react';

export default function TeacherProfile() {
  const { id } = useParams(); 
  const [teacher, setTeacher] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const { data, error } = await supabase
          .from('teachers')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setTeacher(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchTeacher();
  }, [id]);

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-xl text-gray-500">প্রোফাইল লোড হচ্ছে...</div>;
  }

  if (!teacher) {
    return <div className="text-center text-red-500 mt-10 text-xl">শিক্ষকের ডেটা পাওয়া যায়নি!</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      {/* Header Area */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/teachers" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-gray-600" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Teacher Profile</h2>
            <p className="text-gray-500 mt-1">Staff details and information</p>
          </div>
        </div>
        <Link 
          to={`/teachers/edit/${teacher.id}`} 
          className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors font-medium border border-indigo-200"
        >
          <Edit size={20} />
          <span>Edit Profile</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Sidebar - Profile Summary */}
        <div className="col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center space-y-4 h-fit">
          <div className="w-32 h-32 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto text-4xl font-bold uppercase">
            {teacher.first_name.charAt(0)}{teacher.last_name.charAt(0)}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{teacher.first_name} {teacher.last_name}</h3>
            <p className="text-gray-500 font-medium mt-1">{teacher.designation}</p>
            {teacher.department && <p className="text-sm text-gray-400">{teacher.department} Department</p>}
          </div>
          <div className={`inline-block px-4 py-1 rounded-full text-sm font-medium ${
            teacher.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {teacher.status}
          </div>
        </div>

        {/* Right Area - Detailed Information */}
        <div className="col-span-1 md:col-span-2 space-y-6">
          
          {/* Professional Info */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
              <Briefcase className="text-indigo-600" size={20} />
              <h3 className="text-lg font-semibold text-gray-900">Professional Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div><span className="text-gray-500 block">Designation</span><span className="font-medium">{teacher.designation}</span></div>
              <div><span className="text-gray-500 block">Department</span><span className="font-medium">{teacher.department || 'N/A'}</span></div>
              <div><span className="text-gray-500 block">Joining Date</span><span className="font-medium">{teacher.joining_date}</span></div>
            </div>
          </div>

          {/* Personal Info */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
              <User className="text-indigo-600" size={20} />
              <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div><span className="text-gray-500 block">Gender</span><span className="font-medium">{teacher.gender}</span></div>
              <div><span className="text-gray-500 block">Blood Group</span><span className="font-medium">{teacher.blood_group || 'N/A'}</span></div>
              <div><span className="text-gray-500 block">Religion</span><span className="font-medium">{teacher.religion || 'N/A'}</span></div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
              <Phone className="text-indigo-600" size={20} />
              <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div><span className="text-gray-500 block">Phone Number</span><span className="font-medium">{teacher.phone}</span></div>
              <div><span className="text-gray-500 block">Email Address</span><span className="font-medium">{teacher.email || 'N/A'}</span></div>
              <div className="sm:col-span-2"><span className="text-gray-500 block">Present Address</span><span className="font-medium">{teacher.present_address || 'N/A'}</span></div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}