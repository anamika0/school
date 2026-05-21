// src/features/accounts/DueReport.tsx
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../config/supabase';
import { AlertCircle, UserX, DollarSign, Download, ArrowLeft, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DueReport() {
  const [students, setStudents] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const currentYear = new Date().getFullYear();
  const currentMonthIndex = new Date().getMonth(); // 0 = Jan, 4 = May
  const allMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const passedMonths = useMemo(() => allMonths.slice(0, currentMonthIndex + 1), [currentMonthIndex]);

  useEffect(() => {
    const fetchDueData = async () => {
      try {
        setLoading(true);
        
        // ১. স্টুডেন্টদের ডেটার সাথে তাদের ক্লাসের monthly_fee জয়েন করে নিয়ে আসা
        const { data: studentsData, error: studentError } = await supabase
          .from('students')
          .select(`
            id, first_name, last_name, admission_no, class_name, guardian_phone, class_id,
            classes ( monthly_fee )
          `)
          .eq('status', 'Active');
          
        if (studentError) throw studentError;

        // ২. চলতি বছরের মাসিক বেতনের ডেটা আনা
        const { data: feesData, error: feeError } = await supabase
          .from('fees_collection')
          .select('student_id, fee_month, paid_amount')
          .eq('fee_type', 'Monthly Fee')
          .eq('fee_year', currentYear);
          
        if (feeError) throw feeError;

        setStudents(studentsData || []);
        setFees(feesData || []);
      } catch (err) {
        console.error('Error fetching due report data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDueData();
  }, [currentYear]);

  // --- সম্পূর্ণ ডাইনামিক ডিউ ক্যালকুলেশন লজিক ---
  const defaulters = useMemo(() => {
    const list = students.map(student => {
      const studentPayments = fees.filter(f => f.student_id === student.id);
      const paidMonths = studentPayments.map(f => f.fee_month);
      const unpaidMonths = passedMonths.filter(m => !paidMonths.includes(m));

      // হার্ডকোডের বদলে সরাসরি ওই স্টুডেন্টের ক্লাসের নির্দিষ্ট ফি রিড করা হচ্ছে
      const studentMonthlyFee = student.classes?.monthly_fee ? Number(student.classes.monthly_fee) : 1500;

      return {
        ...student,
        unpaidMonths,
        dueMonthsCount: unpaidMonths.length,
        totalDueAmount: unpaidMonths.length * studentMonthlyFee
      };
    });

    return list.filter(s => s.dueMonthsCount > 0).sort((a, b) => b.dueMonthsCount - a.dueMonthsCount);
  }, [students, fees, passedMonths]);

  const totalDefaulters = defaulters.length;
  const totalEstimatedDue = defaulters.reduce((sum, s) => sum + s.totalDueAmount, 0);

  const filteredDefaulters = useMemo(() => {
    if (!searchQuery.trim()) return defaulters;
    const query = searchQuery.toLowerCase().trim();
    return defaulters.filter(d => 
      d.first_name.toLowerCase().includes(query) || 
      d.admission_no.toLowerCase().includes(query) ||
      d.class_name.toLowerCase().includes(query)
    );
  }, [defaulters, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2 print:hidden">
        <div className="flex items-center gap-4">
          <Link to="/accounts/reports" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-gray-600" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Student Due Report</h2>
            <p className="text-gray-500 mt-1">Track unpaid monthly fees up to {allMonths[currentMonthIndex]} {currentYear}.</p>
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

      <div className="hidden print:block text-center border-b-2 border-gray-800 pb-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 uppercase">BD School ERP</h1>
        <h2 className="text-lg font-semibold text-gray-700 mt-1">Defaulter List (Due Report)</h2>
        <p className="text-sm text-gray-500">Up to: {allMonths[currentMonthIndex]} {currentYear}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:hidden">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 border-l-4 border-l-red-500">
          <div className="p-3 bg-red-50 text-red-600 rounded-lg">
            <UserX size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Defaulter Students</p>
            <h3 className="text-2xl font-bold text-gray-900">{totalDefaulters} <span className="text-sm text-gray-400 font-normal">students</span></h3>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 border-l-4 border-l-orange-500">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Estimated Total Due Amount</p>
            <h3 className="text-2xl font-bold text-gray-900">৳ {totalEstimatedDue.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2 print:hidden">
        <DollarSign size={16} />
        <span><strong>Note:</strong> The total due amount is now calculated dynamically based on each individual class's fee structure.</span>
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
          <table className="w-full text-left border-collapse print:text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-sm print:bg-transparent print:border-b-2 print:border-gray-800">
                <th className="px-6 py-4 font-semibold text-gray-600">Student Info</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Class</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Guardian Phone</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Unpaid Months</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-right">Total Due (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 print:divide-gray-300">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500 font-medium print:hidden">হিসাব করা হচ্ছে...</td>
                </tr>
              ) : filteredDefaulters.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-green-600 font-bold print:hidden">
                    🎉 কোনো বকেয়া নেই! সব স্টুডেন্ট বর্তমান মাস পর্যন্ত বেতন পরিশোধ করেছে।
                  </td>
                </tr>
              ) : (
                filteredDefaulters.map((student) => {
                  const currentClassFee = student.classes?.monthly_fee ? Number(student.classes.monthly_fee) : 1500;
                  return (
                    <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-gray-900">{student.first_name} {student.last_name}</p>
                        <p className="text-xs text-gray-500">ID: {student.admission_no}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                        {student.class_name} 
                        <span className="block text-xs text-gray-400 font-normal">(৳{currentClassFee}/mo)</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{student.guardian_phone || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {student.unpaidMonths.map((m: string) => (
                            <span key={m} className="px-2 py-1 bg-red-50 text-red-600 border border-red-100 rounded text-xs font-medium print:bg-transparent print:border-none print:p-0 print:after:content-[',_'] last:print:after:content-['']">
                              {m.substring(0, 3)}
                            </span>
                          ))}
                          <span className="ml-1 text-xs text-gray-500 font-bold">({student.dueMonthsCount} M)</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-black text-red-600 text-right">
                        {student.totalDueAmount.toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}