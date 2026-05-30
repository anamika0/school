// src/features/finance/CollectFee.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Search, CreditCard, Save, CheckCircle, ArrowLeft, Printer, X, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../config/supabase';

const allMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function CollectFee() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // স্টুডেন্ট সার্চ স্টেট
  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // ডিউ রিপোর্ট দেখানোর জন্য স্টেট
  const [feeStructures, setFeeStructures] = useState<any[]>([]);
  const [dueSummary, setDueSummary] = useState<any>(null);

  // রসিদ প্রিন্ট করার স্টেট
  const [receiptData, setReceiptData] = useState<any>(null);

  const currentYear = new Date().getFullYear();
  const [formData, setFormData] = useState({
    fee_type: 'Monthly Fee',
    fee_month: new Date().toLocaleString('default', { month: 'long' }),
    fee_year: currentYear,
    total_amount: '',
    discount: '0',
    paid_amount: '',
    payment_method: 'Cash',
    payment_date: new Date().toISOString().split('T')[0],
    remarks: ''
  });

  // পেজ লোড হলে স্টুডেন্ট এবং ফি স্ট্রাকচার ডেটা আনা
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const { data: stdData } = await supabase
          .from('students')
          .select('id, first_name, last_name, admission_no, class_name, section, guardian_phone, status');
        if (stdData) setStudents(stdData);

        const { data: structData } = await supabase.from('fee_structures').select('*');
        if (structData) setFeeStructures(structData);
      } catch (err) {
        console.error('Error fetching initial data:', err);
      }
    };
    fetchInitialData();
  }, []);

  // স্টুডেন্ট সিলেক্ট করলে তার ডিউ হিসাব করে বের করার লজিক
  useEffect(() => {
    const calculateDueSummary = async () => {
      if (!selectedStudent || feeStructures.length === 0) {
        setDueSummary(null);
        return;
      }

      try {
        const { data: payments } = await supabase
          .from('fees_collection')
          .select('*')
          .eq('student_id', selectedStudent.id)
          .eq('fee_year', currentYear);

        const allPayments = payments || [];
        const currentMonthIndex = new Date().getMonth();
        const targetMonths = allMonths.slice(0, currentMonthIndex + 1);

        const paidMonthly = allPayments
          .filter(f => (f.fee_type || '').toLowerCase().includes('month') || (f.fee_type || '').toLowerCase().includes('tuition'))
          .map(f => (f.fee_month || '').trim());

        const unpaidMonths = targetMonths.filter(m => !paidMonthly.includes(m));

        const hasPaidAdmission = allPayments.some(f => (f.fee_type || '').toLowerCase().includes('admission'));

        const classFees = feeStructures.filter(s => 
          s.class_name && selectedStudent.class_name && 
          s.class_name.toLowerCase() === selectedStudent.class_name.toLowerCase()
        );

        const monthlyFeeConfig = classFees.find(s => s.fee_type && (s.fee_type.toLowerCase().includes('month') || s.fee_type.toLowerCase().includes('tuition')));
        const monthlyRate = monthlyFeeConfig ? Number(monthlyFeeConfig.amount) : 0;

        const admissionFeeConfig = classFees.find(s => s.fee_type && s.fee_type.toLowerCase().includes('admission'));
        const admissionRate = admissionFeeConfig ? Number(admissionFeeConfig.amount) : 0;

        const monthlyDueAmount = unpaidMonths.length * monthlyRate;
        const admissionDueAmount = hasPaidAdmission ? 0 : admissionRate;
        const totalDueAmount = monthlyDueAmount + admissionDueAmount;

        setDueSummary({
          unpaidMonths,
          monthlyDueAmount,
          hasPaidAdmission,
          admissionDueAmount,
          totalDueAmount,
          monthlyRate,
          admissionRate
        });

      } catch (err) {
        console.error("Error calculating due:", err);
      }
    };

    calculateDueSummary();
  }, [selectedStudent, feeStructures, currentYear]);

  // অটোমেটিক অ্যামাউন্ট আনার লজিক
  useEffect(() => {
    async function fetchConfiguredFee() {
      if (!selectedStudent || !formData.fee_type) return;
      
      try {
        const { data, error } = await supabase
          .from('fee_structures') 
          .select('amount') 
          .eq('class_name', selectedStudent.class_name) 
          .eq('fee_type', formData.fee_type) 
          .maybeSingle();

        if (data && !error && data.amount) {
          setFormData(prev => ({ 
            ...prev, 
            total_amount: data.amount.toString(),
            paid_amount: data.amount.toString() 
          }));
        } else {
          setFormData(prev => ({ 
            ...prev, 
            total_amount: '',
            paid_amount: '' 
          }));
        }
      } catch (err) {
        console.error("Fee setup fetch error", err);
      }
    }

    fetchConfiguredFee();
  }, [selectedStudent, formData.fee_type]);

  // ড্রপডাউনের জন্য সার্চ ফিল্টার
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();
    return students.filter(student => {
      const fName = (student.first_name || '').toLowerCase();
      const lName = (student.last_name || '').toLowerCase();
      const admNo = (student.admission_no || '').toLowerCase();
      const phone = (student.guardian_phone || '').toLowerCase();
      return fName.includes(query) || lName.includes(query) || admNo.includes(query) || phone.includes(query);
    }).slice(0, 5);
  }, [students, searchQuery]);

  const handleSelectStudent = (student: any) => {
    setSelectedStudent(student);
    setSearchQuery(''); 
    setError(null);
    setSuccessMsg(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'discount') {
      const discountVal = parseFloat(value || '0');
      const totalVal = parseFloat(formData.total_amount || '0');
      const newPaidAmount = totalVal - discountVal;
      
      setFormData({ 
        ...formData, 
        discount: value,
        paid_amount: newPaidAmount > 0 ? newPaidAmount.toString() : '0'
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // পেমেন্ট সেভ করার ফাংশন
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      setError("অনুগ্রহ করে আগে বাম পাশ থেকে একজন স্টুডেন্ট সিলেক্ট করুন।");
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const totalAmount = parseFloat(formData.total_amount || '0');
      const discountAmount = parseFloat(formData.discount || '0');
      const paidAmount = parseFloat(formData.paid_amount || '0');

      if (totalAmount <= 0) throw new Error("Total Amount অবশ্যই ০-এর বেশি হতে হবে।");
      if (paidAmount <= 0) throw new Error("Paid Amount অবশ্যই ০-এর বেশি হতে হবে।");

      // 🚀 ---------------- ডুপ্লিকেট পেমেন্ট প্রোটেকশন ---------------- 🚀
      let duplicateQuery = supabase
        .from('fees_collection')
        .select('id')
        .eq('student_id', selectedStudent.id)
        .eq('fee_type', formData.fee_type)
        .eq('fee_year', parseInt(formData.fee_year.toString(), 10));

      // যদি Monthly Fee হয়, তবে নির্দিষ্ট মাস চেক করবে
      if (formData.fee_type === 'Monthly Fee') {
        duplicateQuery = duplicateQuery.eq('fee_month', formData.fee_month);
      }

      const { data: existingData, error: duplicateCheckError } = await duplicateQuery;
      
      if (duplicateCheckError) throw duplicateCheckError;
      
      // যদি ডাটাবেসে পেমেন্ট পাওয়া যায়, তাহলে সেভ না করে এরর দেখাবে
      if (existingData && existingData.length > 0) {
        if (formData.fee_type === 'Monthly Fee') {
          throw new Error(`⚠️ এই স্টুডেন্ট ইতিমধ্যে ${formData.fee_month} মাসের ফি জমা দিয়েছে! একই মাসের ফি দুইবার নেওয়া যাবে না।`);
        } else if (formData.fee_type === 'Admission Fee') {
          throw new Error(`⚠️ এই স্টুডেন্ট ইতিমধ্যে ভর্তি ফি (Admission Fee) জমা দিয়েছে!`);
        } else {
          throw new Error(`⚠️ এই স্টুডেন্ট ইতিমধ্যে ${formData.fee_type} জমা দিয়েছে!`);
        }
      }
      // 🚀 ----------------------------------------------------------------- 🚀

      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const receipt_no = `REC-${currentYear}-${randomNum}`;

      const payload = {
        receipt_no,
        student_id: selectedStudent.id,
        fee_type: formData.fee_type,
        fee_month: formData.fee_type === 'Monthly Fee' ? formData.fee_month : null,
        fee_year: parseInt(formData.fee_year.toString(), 10),
        total_amount: totalAmount,
        discount: discountAmount,
        paid_amount: paidAmount,
        payment_method: formData.payment_method,
        payment_date: formData.payment_date,
        remarks: formData.remarks || null,
        payment_status: paidAmount >= (totalAmount - discountAmount) ? 'Paid' : 'Partial'
      };

      const { error: insertError } = await supabase.from('fees_collection').insert([payload]);
      
      if (insertError) throw insertError;

      setReceiptData({
        ...payload,
        student: selectedStudent
      });
      
      setSuccessMsg(`ফি সফলভাবে গ্রহণ করা হয়েছে!`);
      
      setSelectedStudent({...selectedStudent});

      setFormData({
        ...formData,
        total_amount: '',
        discount: '0',
        paid_amount: '',
        remarks: ''
      });

    } catch (err: any) {
      console.error('Fee collection error:', err);
      setError(err.message || 'ফি সেভ করতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div className="max-w-6xl mx-auto space-y-6 pb-10 print:hidden relative z-0">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/accounts" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-gray-600" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Collect Fees</h2>
            <p className="text-gray-500 mt-1">Search student and process payments.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Search & Selected Student Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Search className="text-indigo-600" size={20} />
                Find Student
              </h3>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="Name, ID or Phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                
                {searchQuery.trim().length > 0 && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden divide-y divide-gray-100">
                    {searchResults.length > 0 ? (
                      <>
                        <div className="bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                          Select a student below 👇
                        </div>
                        {searchResults.map(student => (
                          <div 
                            key={student.id} 
                            onClick={() => handleSelectStudent(student)} 
                            className="p-3 hover:bg-indigo-50 cursor-pointer transition-colors"
                          >
                            <div className="font-bold text-gray-900 text-sm">{student.first_name} {student.last_name}</div>
                            <div className="text-xs text-gray-500 mt-1">ID: {student.admission_no} | Class: {student.class_name}</div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="p-4 text-center text-sm text-gray-500 bg-gray-50">
                        কোনো স্টুডেন্ট পাওয়া যায়নি!
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {selectedStudent && (
              <div className="bg-indigo-600 p-6 rounded-xl shadow-md text-white transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
                    {selectedStudent.first_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{selectedStudent.first_name} {selectedStudent.last_name}</h3>
                    <p className="text-indigo-100 text-sm">ID: {selectedStudent.admission_no}</p>
                  </div>
                </div>
                <div className="space-y-2 border-t border-indigo-500/50 pt-4 mt-2">
                  <p className="flex justify-between"><span className="text-indigo-200">Class:</span> <span className="font-semibold">{selectedStudent.class_name}</span></p>
                  <p className="flex justify-between"><span className="text-indigo-200">Phone:</span> <span className="font-semibold">{selectedStudent.guardian_phone}</span></p>
                </div>
                <button 
                  onClick={() => setSelectedStudent(null)} 
                  className="mt-6 w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
                >
                  Change Student
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Due Summary & Payment Details */}
          <div className="lg:col-span-2 space-y-6">
            
            {selectedStudent && dueSummary && (
              <div className={`p-6 rounded-xl shadow-sm border transition-all ${dueSummary.totalDueAmount > 0 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 border-b pb-2 ${dueSummary.totalDueAmount > 0 ? 'text-red-800 border-red-200' : 'text-green-800 border-green-200'}`}>
                  {dueSummary.totalDueAmount > 0 ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
                  Current Due Summary (Till {allMonths[new Date().getMonth()]})
                </h3>
                
                {dueSummary.totalDueAmount > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                     <div className="bg-white p-4 rounded-lg border border-red-100 shadow-sm">
                       <p className="text-sm text-gray-500 font-bold mb-1">Monthly Dues ({dueSummary.unpaidMonths.length} M)</p>
                       <p className="text-xl font-black text-red-600">৳ {dueSummary.monthlyDueAmount}</p>
                       {dueSummary.unpaidMonths.length > 0 && (
                         <div className="flex flex-wrap gap-1 mt-2">
                           {dueSummary.unpaidMonths.map((m: string) => <span key={m} className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">{m.substring(0,3)}</span>)}
                         </div>
                       )}
                     </div>
                     
                     <div className="bg-white p-4 rounded-lg border border-red-100 shadow-sm">
                       <p className="text-sm text-gray-500 font-bold mb-1">Admission Fee</p>
                       {dueSummary.hasPaidAdmission ? (
                         <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded">Paid</span>
                       ) : (
                         <p className="text-xl font-black text-red-600">৳ {dueSummary.admissionDueAmount}</p>
                       )}
                     </div>
                     
                     <div className="bg-red-600 p-4 rounded-lg shadow-sm flex flex-col justify-center items-center text-white">
                       <p className="text-sm font-bold text-red-200 mb-1">Total Due</p>
                       <p className="text-2xl font-black">৳ {dueSummary.totalDueAmount}</p>
                     </div>
                  </div>
                ) : (
                  <div className="bg-white p-4 rounded-lg border border-green-200 shadow-sm flex items-center justify-center gap-3">
                    <CheckCircle className="text-green-500" size={28} />
                    <div>
                      <p className="text-lg font-bold text-green-700">All Clear!</p>
                      <p className="text-sm text-green-600">This student has no pending dues up to the current month.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Payment Details Form */}
            <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all ${!selectedStudent ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
                <CreditCard className="text-indigo-600" size={20} />
                Payment Details
              </h3>

              {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">{error}</div>}
              {successMsg && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2"><CheckCircle size={18} />{successMsg}</div>}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fee Type</label>
                    <select name="fee_type" value={formData.fee_type} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white">
                      <option value="Monthly Fee">Monthly Tuition Fee</option>
                      <option value="Admission Fee">Admission Fee</option>
                      <option value="Exam Fee">Exam Fee</option>
                      <option value="Other Fee">Other Fee</option>
                    </select>
                  </div>
                  
                  {formData.fee_type === 'Monthly Fee' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                      <select name="fee_month" value={formData.fee_month} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white">
                        {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Total Amount (৳) <span className="text-red-500">*</span></label>
                    <input type="number" name="total_amount" value={formData.total_amount} onChange={handleChange} required min="0" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 font-bold" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Discount (৳)</label>
                    <input type="number" name="discount" value={formData.discount} onChange={handleChange} min="0" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Paid Amount (৳) <span className="text-red-500">*</span></label>
                    <input type="number" name="paid_amount" value={formData.paid_amount} onChange={handleChange} required min="0" className="w-full px-4 py-2 border border-indigo-300 bg-indigo-50/50 rounded-lg focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-700" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                    <select name="payment_method" value={formData.payment_method} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white">
                      <option value="Cash">Cash</option>
                      <option value="Bkash">Bkash</option>
                      <option value="Bank">Bank Transfer</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <button type="submit" disabled={loading || !selectedStudent} className={`bg-indigo-600 text-white px-8 py-3 rounded-lg flex items-center gap-2 hover:bg-indigo-700 font-bold shadow-md transition-all ${loading ? 'opacity-70' : ''}`}>
                    <Save size={20} />
                    {loading ? 'Processing...' : 'Collect Payment'}
                  </button>
                </div>
              </form>
            </div>
            
            {!selectedStudent && (
              <div className="text-center mt-6">
                <span className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full text-sm font-medium border border-indigo-100">
                  👈 ফর্মটি আনলক করতে বাম পাশ থেকে স্টুডেন্ট সিলেক্ট করুন
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {receiptData && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 print:bg-white print:static print:inset-auto print:flex print:items-start print:justify-start overflow-y-auto pt-10 pb-10">
          <div className="bg-white w-full max-w-lg mx-auto rounded-xl shadow-2xl overflow-hidden print:shadow-none print:w-full print:max-w-none">
            
            <div className="flex justify-between items-center bg-gray-50 px-6 py-4 border-b border-gray-100 print:hidden">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <CheckCircle className="text-green-600" size={20} /> Payment Successful
              </h3>
              <button onClick={() => setReceiptData(null)} className="text-gray-400 hover:text-red-500 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-8 bg-white" id="receipt-print-area">
              <div className="text-center border-b-2 border-gray-800 pb-6 mb-6">
                <h1 className="text-3xl font-black text-gray-900 tracking-wider">BD SCHOOL ERP</h1>
                <p className="text-gray-600 mt-1">123 Education Road, Dhaka, Bangladesh</p>
                <div className="mt-4 inline-block bg-gray-100 px-4 py-1 rounded-full text-sm font-bold tracking-widest uppercase">
                  Payment Receipt
                </div>
              </div>

              <div className="flex justify-between text-sm mb-6">
                <div>
                  <p className="text-gray-500">Receipt No:</p>
                  <p className="font-bold text-gray-900">{receiptData.receipt_no}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500">Date:</p>
                  <p className="font-bold text-gray-900">{receiptData.payment_date}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-100">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 border-b border-gray-200 pb-2">Student Info</h4>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <p><span className="text-gray-500">Name:</span> <span className="font-bold">{receiptData.student.first_name} {receiptData.student.last_name}</span></p>
                  <p className="text-right"><span className="text-gray-500">ID:</span> <span className="font-bold">{receiptData.student.admission_no}</span></p>
                  <p><span className="text-gray-500">Class:</span> <span className="font-bold">{receiptData.student.class_name}</span></p>
                </div>
              </div>

              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="border-b-2 border-gray-800">
                    <th className="text-left py-2">Description</th>
                    <th className="text-right py-2">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="py-3">
                      <p className="font-bold">{receiptData.fee_type}</p>
                      {receiptData.fee_month && <p className="text-xs text-gray-500">Month: {receiptData.fee_month} {receiptData.fee_year}</p>}
                    </td>
                    <td className="py-3 text-right font-medium">৳ {receiptData.total_amount}</td>
                  </tr>
                  {receiptData.discount > 0 && (
                    <tr>
                      <td className="py-3 text-red-600 font-medium">Discount</td>
                      <td className="py-3 text-right text-red-600 font-medium">- ৳ {receiptData.discount}</td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-800">
                    <td className="py-3 text-right font-bold text-gray-900">Total Paid:</td>
                    <td className="py-3 text-right font-black text-xl text-gray-900">৳ {receiptData.paid_amount}</td>
                  </tr>
                </tfoot>
              </table>

              <div className="flex justify-between items-end mt-12 pt-6 border-t border-gray-200 text-sm">
                <div>
                  <p className="text-gray-500">Payment Method: <span className="font-bold text-gray-900">{receiptData.payment_method}</span></p>
                </div>
                <div className="text-center">
                  <div className="w-32 border-b border-gray-400 mb-2"></div>
                  <p className="text-gray-500 text-xs">Authorized Signature</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-4 print:hidden">
              <button 
                onClick={() => setReceiptData(null)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition-colors"
              >
                Close
              </button>
              <button 
                onClick={handlePrint}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold flex items-center gap-2 transition-colors shadow-sm"
              >
                <Printer size={18} /> Print Receipt
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}