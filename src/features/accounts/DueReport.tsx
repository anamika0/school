// src/features/accounts/DueReport.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../config/supabase';
import { AlertCircle, UserX, DollarSign, Download, ArrowLeft, Search, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DueReport() {
  const [students, setStudents] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const currentYear = new Date().getFullYear();
  const currentMonthIndex = new Date().getMonth(); 
  const allMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const [filterType, setFilterType] = useState<'Specific' | 'Cumulative'>('Cumulative');
  const [selectedMonth, setSelectedMonth] = useState(allMonths[currentMonthIndex]);

  const targetMonths = useMemo(() => {
    if (filterType === 'Specific') return [selectedMonth];
    const selectedIdx = allMonths.indexOf(selectedMonth);
    return allMonths.slice(0, selectedIdx + 1); 
  }, [filterType, selectedMonth]);

  useEffect(() => {
    const fetchDueData = async () => {
      try {
        setLoading(true);
        
        // ১. ক্র্যাশ-প্রুফ ফেচিং: select('*') ব্যবহার করা হয়েছে যাতে কলাম মিসিং থাকলেও ক্র্যাশ না করে
        const { data: studentsData, error: studentError } = await supabase.from('students').select('*');
        if (studentError) console.error("Student Fetch Error:", studentError);

        // ২. ফি কালেকশন আনা
        const { data: feesData, error: feeError } = await supabase.from('fees_collection').select('*');
        if (feeError) console.error("Fee Fetch Error:", feeError);

        // ৩. ফি স্ট্রাকচার আনা
        const { data: structData, error: structError } = await supabase.from('fee_structures').select('*');
        if (structError) console.error("Structure Fetch Error:", structError);

        // স্টুডেন্ট ফিল্টার: Inactive বা Left না হলে সবাই অ্যাক্টিভ হিসেবে গণ্য হবে
        const activeStudents = (studentsData || []).filter(s => {
          const stat = (s.status || '').toLowerCase();
          return stat !== 'inactive' && stat !== 'left' && stat !== 'passed';
        });

        // চলতি বছরের ফি ফিল্টার
        const currentYearFees = (feesData || []).filter(f => f.fee_year == currentYear || !f.fee_year);

        setStudents(activeStudents);
        setFees(currentYearFees);
        setStructures(structData || []);
        
      } catch (err) {
        console.error('Error fetching due report data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDueData();
  }, [currentYear]);

  // --- ডিউ ক্যালকুলেশন লজিক ---
  const defaulters = useMemo(() => {
    const list = students.map(student => {
      // এই স্টুডেন্টের সব পেমেন্ট (Loose equality '==' ব্যবহার করা হয়েছে টাইপ এরর এড়াতে)
      const allPayments = fees.filter(f => f.student_id == student.id);
      
      const paidMonthly = allPayments
        .filter(f => {
          const type = (f.fee_type || '').toLowerCase();
          return type.includes('month') || type.includes('tuition');
        })
        .map(f => (f.fee_month || '').trim());
        
      const unpaidMonths = targetMonths.filter(m => !paidMonthly.includes(m));

      const hasPaidAdmission = allPayments.some(f => {
        const type = (f.fee_type || '').toLowerCase();
        return type.includes('admission');
      });

      // 🚀 ফিক্সড: class_id এর বদলে class_name দিয়ে ডাটাবেস থেকে ফি কনফিগারেশন ম্যাচ করানো হয়েছে
      const classFees = structures.filter(s => 
        s.class_name && student.class_name && 
        s.class_name.toLowerCase() === student.class_name.toLowerCase()
      );
      
      const monthlyFeeConfig = classFees.find(s => s.fee_type && (s.fee_type.toLowerCase().includes('month') || s.fee_type.toLowerCase().includes('tuition')));
      const monthlyRate = monthlyFeeConfig ? Number(monthlyFeeConfig.amount) : 1500;

      const admissionFeeConfig = classFees.find(s => s.fee_type && s.fee_type.toLowerCase().includes('admission'));
      const admissionRate = admissionFeeConfig ? Number(admissionFeeConfig.amount) : 3000;

      const monthlyDueAmount = unpaidMonths.length * monthlyRate;
      const admissionDueAmount = hasPaidAdmission ? 0 : admissionRate;
      const totalDueAmount = monthlyDueAmount + admissionDueAmount;

      return {
        ...student,
        unpaidMonths,
        monthlyDueAmount,
        hasPaidAdmission,
        admissionDueAmount,
        totalDueAmount,
        monthlyRate,
        admissionRate
      };
    });

    return list.filter(s => s.totalDueAmount > 0).sort((a, b) => b.totalDueAmount - a.totalDueAmount);
  }, [students, fees, structures, targetMonths]);

  const totalDefaulters = defaulters.length;
  const totalEstimatedDue = defaulters.reduce((sum, s) => sum + s.totalDueAmount, 0);

  const filteredDefaulters = useMemo(() => {
    if (!searchQuery.trim()) return defaulters;
    const query = searchQuery.toLowerCase().trim();
    return defaulters.filter(d => 
      (d.first_name || '').toLowerCase().includes(query) || 
      (d.admission_no || '').toLowerCase().includes(query) ||
      (d.class_name || '').toLowerCase().includes(query)
    );
  }, [defaulters, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2 print:hidden">
        <div className="flex items-center gap-4">
          <Link to="/accounts/reports" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-gray-600" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Student Due Report</h2>
            <p className="text-gray-500 mt-1">Track unpaid tuition & admission fees.</p>
          </div>
        </div>
        <button 
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm"
        >
          <Download size={18} />
          <span>Print Report</span>
        </button>
      </div>

      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 print:hidden flex flex-col md:flex-row gap-6 items-end">
        <div className="w-full md:w-1/3">
          <label className=" text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-2">
            <Filter size={16} className="text-indigo-600"/> Calculation Method
          </label>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value as 'Specific' | 'Cumulative')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium bg-gray-50"
          >
            <option value="Cumulative">January to Selected Month (বছরের শুরু থেকে)</option>
            <option value="Specific">Specific Month Only (শুধু নির্দিষ্ট মাসের)</option>
          </select>
        </div>
        
        <div className="w-full md:w-1/3">
          <label className="block text-sm font-bold text-gray-700 mb-1.5">Select Target Month</label>
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium"
          >
            {allMonths.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      <div className="hidden print:block text-center border-b-2 border-gray-800 pb-4 mb-6 mt-4">
        <h1 className="text-2xl font-bold text-gray-900 uppercase">BD School ERP</h1>
        <h2 className="text-lg font-semibold text-gray-700 mt-1">Defaulter List (Due Report)</h2>
        <p className="text-sm text-gray-500 font-medium mt-1">
          {filterType === 'Specific' ? `Due for the month of: ${selectedMonth} ${currentYear}` : `Cumulative Dues (Jan to ${selectedMonth} ${currentYear})`}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:hidden">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 border-l-4 border-l-red-500">
          <div className="p-3 bg-red-50 text-red-600 rounded-lg">
            <UserX size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Defaulters</p>
            <h3 className="text-2xl font-bold text-gray-900">{totalDefaulters} <span className="text-sm text-gray-400 font-normal">students</span></h3>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 border-l-4 border-l-orange-500">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Estimated Due</p>
            <h3 className="text-2xl font-bold text-gray-900">৳ {totalEstimatedDue.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none print:border-none">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center print:hidden">
          <h3 className="text-lg font-bold text-gray-900">Defaulters List</h3>
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Search by name, ID or class..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace nowrap print:text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-sm print:bg-transparent print:border-b-2 print:border-gray-800">
                <th className="px-6 py-4 font-semibold text-gray-600">Student Info</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Monthly Dues</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Admission Fee</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-right">Total Due (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 print:divide-gray-300">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-500 font-medium print:hidden">হিসাব করা হচ্ছে...</td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-red-500 font-bold print:hidden">
                    ⚠️ ডাটাবেস থেকে কোনো স্টুডেন্ট ডাটা পাওয়া যায়নি! দয়া করে ইন্টারনেট কানেকশন বা স্টুডেন্ট ডাটাবেস চেক করুন।
                  </td>
                </tr>
              ) : filteredDefaulters.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-green-600 font-bold print:hidden">
                    🎉 চমৎকার! নির্বাচিত সময়ের জন্য কোনো বকেয়া নেই।
                  </td>
                </tr>
              ) : (
                filteredDefaulters.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-900">{student.first_name} {student.last_name}</p>
                      <p className="text-xs text-gray-500 mb-1">ID: {student.admission_no} | Phone: {student.guardian_phone || 'N/A'}</p>
                      <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded font-medium">
                        {student.class_name}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4">
                      {student.unpaidMonths.length > 0 ? (
                        <>
                          <div className="flex flex-wrap gap-1 mb-1">
                            {student.unpaidMonths.map((m: string) => (
                              <span key={m} className="px-2 py-1 bg-red-50 text-red-600 border border-red-100 rounded text-xs font-medium print:bg-transparent print:border-none print:p-0 print:after:content-[',_'] last:print:after:content-['']">
                                {m.substring(0, 3)}
                              </span>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500">
                            {student.unpaidMonths.length} M × ৳{student.monthlyRate} = <span className="font-bold text-red-600">৳{student.monthlyDueAmount}</span>
                          </p>
                        </>
                      ) : (
                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">Clear</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {!student.hasPaidAdmission ? (
                        <div>
                          <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100 print:bg-transparent print:border-none print:p-0">
                            Unpaid
                          </span>
                          <p className="text-xs text-gray-500 mt-1">Due: <span className="font-bold text-red-600">৳{student.admissionRate}</span></p>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100 print:bg-transparent print:border-none print:p-0">
                          Paid
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4  font-black text-red-600 text-right text-lg">
                      {student.totalDueAmount.toLocaleString()}
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