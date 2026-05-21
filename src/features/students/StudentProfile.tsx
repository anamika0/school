// src/features/students/StudentProfile.tsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { ArrowLeft, User, BookOpen, Users, Edit } from 'lucide-react';

export default function StudentProfile() {
  const { id } = useParams(); // URL থেকে স্টুডেন্টের আইডি নিচ্ছি
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('id', id)
          .single(); // শুধুমাত্র এই আইডির একটি ডেটাই আনবে

        if (error) throw error;
        setStudent(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchStudent();
  }, [id]);

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-xl text-gray-500">প্রোফাইল লোড হচ্ছে...</div>;
  }

  if (!student) {
    return <div className="text-center text-red-500 mt-10 text-xl">স্টুডেন্টের ডেটা পাওয়া যায়নি!</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      {/* Header Area */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/students" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-gray-600" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Student Profile</h2>
            <p className="text-gray-500 mt-1">Admission No: {student.admission_no}</p>
          </div>
        </div>
        <Link 
          to={`/students/edit/${student.id}`} 
          className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors font-medium border border-indigo-200"
        >
          <Edit size={20} />
          <span>Edit Profile</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Sidebar - Profile Summary */}
        <div className="col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center space-y-4 h-fit">
          <div className="w-32 h-32 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto text-4xl font-bold">
            {student.first_name.charAt(0)}{student.last_name.charAt(0)}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{student.first_name} {student.last_name}</h3>
            <p className="text-gray-500">Class {student.class_name} {student.section && `- ${student.section}`}</p>
          </div>
          <div className="inline-block px-4 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
            {student.status}
          </div>
        </div>

        {/* Right Area - Detailed Information */}
        <div className="col-span-1 md:col-span-2 space-y-6">
          
          {/* Personal Info */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
              <User className="text-indigo-600" size={20} />
              <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div><span className="text-gray-500 block">Date of Birth</span><span className="font-medium">{student.date_of_birth}</span></div>
              <div><span className="text-gray-500 block">Gender</span><span className="font-medium">{student.gender}</span></div>
              <div><span className="text-gray-500 block">Blood Group</span><span className="font-medium">{student.blood_group || 'N/A'}</span></div>
              <div><span className="text-gray-500 block">Religion</span><span className="font-medium">{student.religion || 'N/A'}</span></div>
            </div>
          </div>

          {/* Academic Info */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
              <BookOpen className="text-indigo-600" size={20} />
              <h3 className="text-lg font-semibold text-gray-900">Academic Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div><span className="text-gray-500 block">Admission Date</span><span className="font-medium">{student.admission_date}</span></div>
              <div><span className="text-gray-500 block">Roll No</span><span className="font-medium">{student.roll_no || 'Not Assigned'}</span></div>
            </div>
          </div>

          {/* Guardian Info */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
              <Users className="text-indigo-600" size={20} />
              <h3 className="text-lg font-semibold text-gray-900">Guardian Information</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div><span className="text-gray-500 block">Father's Name</span><span className="font-medium">{student.father_name}</span></div>
              <div><span className="text-gray-500 block">Mother's Name</span><span className="font-medium">{student.mother_name}</span></div>
              <div><span className="text-gray-500 block">Contact Number</span><span className="font-medium">{student.guardian_phone}</span></div>
              <div className="sm:col-span-2"><span className="text-gray-500 block">Present Address</span><span className="font-medium">{student.present_address}</span></div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}