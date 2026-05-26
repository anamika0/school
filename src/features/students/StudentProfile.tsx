// src/features/students/StudentProfile.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ArrowLeft, User, BookOpen, Users, Edit, Download, FileText, CreditCard } from 'lucide-react';

export default function StudentProfile() {
  const { id } = useParams(); 
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const idCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('id', id)
          .single(); 

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

  // 🚀 PDF জেনারেটরের লজিক
  const handleDownloadPDF = async () => {
    const element = idCardRef.current;
    if (!element) return;

    try {
      // CORS পারমিশন দিয়ে ক্যানভাস তৈরি
      const canvas = await html2canvas(element, { 
        scale: 3, 
        useCORS: true, 
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', [54, 86]); 
      pdf.addImage(imgData, 'PNG', 0, 0, 54, 86);
      pdf.save(`${student.admission_no}_ID_Card.pdf`);
    } catch (error) {
      console.error('PDF Generation Error:', error);
      alert('PDF তৈরি করতে সমস্যা হয়েছে। দয়া করে কনসোল চেক করুন।');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64 text-xl text-gray-500">প্রোফাইল লোড হচ্ছে...</div>;
  if (!student) return <div className="text-center text-red-500 mt-10 text-xl">স্টুডেন্টের ডেটা পাওয়া যায়নি!</div>;

  const qrData = JSON.stringify({ 
    id: student.admission_no, 
    name: `${student.first_name} ${student.last_name}`,
    class: student.class_name
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
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
        <div className="flex gap-3">
          <button 
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors font-medium shadow-sm"
          >
            <Download size={20} />
            <span>ID Card</span>
          </button>
          <Link 
            to={`/students/edit/${student.id}`} 
            className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors font-medium border border-indigo-200"
          >
            <Edit size={20} />
            <span>Edit Profile</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Sidebar */}
        <div className="col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center space-y-4 h-fit">
            <div className="w-32 h-32 bg-indigo-100 text-indigo-600 rounded-full mx-auto flex items-center justify-center text-4xl font-bold overflow-hidden">
              {student.photo_url ? (
                <img src={student.photo_url} alt="Profile" className="w-full h-full object-cover" crossOrigin="anonymous" />
              ) : (
                `${student.first_name.charAt(0)}${student.last_name.charAt(0)}`
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{student.first_name} {student.last_name}</h3>
              <p className="text-gray-500">Class {student.class_name} {student.section && `- ${student.section}`}</p>
            </div>
            <div className="inline-block px-4 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
              {student.status}
            </div>
          </div>

          {/* 🚀 Virtual ID Card Preview (Tailwind colors removed and replaced with HEX styles) */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
            <h4 className="font-bold text-gray-800 mb-4 border-b pb-2 w-full text-center text-sm uppercase tracking-wider">Virtual ID Card</h4>
            
            <div className="flex justify-center bg-gray-50 p-4 rounded-xl shadow-inner w-full">
              
              <div 
                ref={idCardRef} 
                className="w-51 h-81.25 rounded-lg shadow-md relative overflow-hidden flex flex-col items-center pt-4 border shrink-0"
                style={{ fontFamily: 'sans-serif', backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}
              >
                {/* Header banner */}
                <div className="absolute top-0 left-0 w-full h-16 rounded-t-lg" style={{ backgroundColor: '#4338ca' }}></div>
                <h2 className="relative z-10 font-black text-sm tracking-wider uppercase" style={{ color: '#ffffff' }}>BD School ERP</h2>
                
                {/* Photo area */}
                <div className="relative z-10 w-20 h-20 rounded-full border-2 overflow-hidden mt-3 shadow-sm flex items-center justify-center" style={{ backgroundColor: '#f3f4f6', borderColor: '#ffffff' }}>
                  {student.photo_url ? (
                    <img src={student.photo_url} className="w-full h-full object-cover" crossOrigin="anonymous" />
                  ) : (
                    <User size={40} style={{ color: '#d1d5db', marginTop: '8px' }} />
                  )}
                </div>

                {/* Info area */}
                <h3 className="font-bold mt-2 text-sm text-center px-2" style={{ color: '#111827' }}>{student.first_name} {student.last_name}</h3>
                <p className="text-[10px] font-bold px-2 py-0.5 rounded mt-1" style={{ color: '#4f46e5', backgroundColor: '#e0e7ff' }}>ID: {student.admission_no}</p>

                <div className="w-full px-4 mt-2 text-[10px] grid grid-cols-2 gap-1 font-medium" style={{ color: '#374151' }}>
                  <p>Class: <span className="font-bold" style={{ color: '#111827' }}>{student.class_name}</span></p>
                  <p>Roll: <span className="font-bold" style={{ color: '#111827' }}>{student.roll_no || 'N/A'}</span></p>
                  <p>Blood: <span className="font-bold" style={{ color: '#dc2626' }}>{student.blood_group || 'N/A'}</span></p>
                  <p>DOB: <span className="font-bold" style={{ color: '#111827' }}>{student.date_of_birth || 'N/A'}</span></p>
                </div>

                {/* QR Code */}
                <div className="mt-auto mb-3">
                  <QRCodeSVG value={qrData} size={45} level="M" />
                </div>
                
                <div className="w-full h-1.5 mt-auto" style={{ backgroundColor: '#4338ca' }}></div>
              </div>

            </div>
          </div>
        </div>

        {/* Right Area - Detailed Information */}
        <div className="col-span-1 md:col-span-2 space-y-6">
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

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
              <FileText className="text-indigo-600" size={20} />
              <h3 className="text-lg font-semibold text-gray-900">Official Documents</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div>
                <span className="text-gray-500  flex items-center gap-1 mb-1"><CreditCard size={14}/> Birth Certificate / NID</span>
                <span className="font-medium bg-gray-50 px-3 py-1 rounded inline-block border border-gray-100">
                  {student.birth_cert_nid || 'Not Provided'}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-gray-500 block mb-1">Previous School Info</span>
                <span className="font-medium bg-gray-50 p-3 rounded block border border-gray-100 whitespace-pre-wrap min-h-15">
                  {student.prev_school_info || 'No previous records'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}