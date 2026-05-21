// src/features/accounts/Payroll.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../config/supabase';
import { ArrowLeft, Save, Banknote, Users, Calculator, Search, Printer, CheckCircle, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Payroll() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [payslipData, setPayslipData] = useState<any>(null); // প্রিন্ট করার জন্য

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });

  const [formData, setFormData] = useState({
    teacher_id: '',
    salary_month: currentMonth,
    salary_year: currentYear,
    base_salary: '',
    allowances: '0',
    deductions: '0',
    payment_method: 'Bank Transfer',
    payment_date: new Date().toISOString().split('T')[0],
    remarks: ''
  });

  // নেট স্যালারি লাইভ ক্যালকুলেশন
  const netSalary = useMemo(() => {
    const base = parseFloat(formData.base_salary) || 0;
    const allow = parseFloat(formData.allowances) || 0;
    const deduct = parseFloat(formData.deductions) || 0;
    return base + allow - deduct;
  }, [formData.base_salary, formData.allowances, formData.deductions]);

  const fetchData = async () => {
    try {
      setFetching(true);
      // স্টাফ লিস্ট আনা
      const { data: staffData } = await supabase.from('teachers').select('*').eq('status', 'Active');
      if (staffData) setTeachers(staffData);

      // রিসেন্ট পেরোল আনা
      const { data: payrollData } = await supabase
        .from('staff_salary')
        .select('*, teachers(*)')
        .order('created_at', { ascending: false });
      if (payrollData) setPayrolls(payrollData);
    } catch (err) {
      console.error('Error fetching payroll data:', err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.teacher_id) {
      setError('অনুগ্রহ করে একজন স্টাফ নির্বাচন করুন।');
      return;
    }
    if (netSalary <= 0) {
      setError('Net Salary শূন্য বা নেগেটিভ হতে পারে না।');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      const transaction_id = `PAY-${formData.salary_year}-${randomNum}`;
      const selectedStaff = teachers.find(t => t.id === formData.teacher_id);

      const payload = {
        ...formData,
        base_salary: parseFloat(formData.base_salary),
        allowances: parseFloat(formData.allowances),
        deductions: parseFloat(formData.deductions),
        net_salary: netSalary,
        transaction_id
      };

      const { error: insertError } = await supabase.from('staff_salary').insert([payload]);
      if (insertError) throw insertError;

      setSuccessMsg('বেতন সফলভাবে পরিশোধ করা হয়েছে!');
      
      // প্রিন্ট করার জন্য ডেটা সেট করা
      setPayslipData({
        ...payload,
        staff: selectedStaff
      });

      // ফর্ম রিসেট
      setFormData({
        ...formData,
        base_salary: '',
        allowances: '0',
        deductions: '0',
        remarks: ''
      });

      fetchData();
    } catch (err: any) {
      setError(`বেতন সেভ করতে সমস্যা: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayrolls = useMemo(() => {
    if (!searchQuery.trim()) return payrolls;
    const query = searchQuery.toLowerCase();
    return payrolls.filter(p => {
      const name = p.teachers?.first_name ? `${p.teachers.first_name} ${p.teachers.last_name || ''}` : (p.teachers?.full_name || '');
      return name.toLowerCase().includes(query) || p.transaction_id.toLowerCase().includes(query);
    });
  }, [payrolls, searchQuery]);

  // টিচারের নাম পাওয়ার হেল্পার ফাংশন
  const getStaffName = (t: any) => {
    if (!t) return 'Unknown';
    return t.first_name ? `${t.first_name} ${t.last_name || ''}` : (t.full_name || t.name);
  };

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-6 pb-20 print:hidden relative z-0">
        <div className="flex items-center gap-4 mb-2">
          <Link to="/accounts" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-gray-600" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Payroll & Salary</h2>
            <p className="text-gray-500 mt-1">Process staff salaries and generate payslips.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left: Salary Form */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-3">
                <Calculator className="text-teal-600" size={20} />
                Process Salary
              </h3>

              {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">{error}</div>}
              {successMsg && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm font-medium">{successMsg}</div>}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Staff *</label>
                  <select name="teacher_id" value={formData.teacher_id} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white">
                    <option value="">-- Choose Employee --</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{getStaffName(t)} ({t.designation || 'Staff'})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Month *</label>
                    <select name="salary_month" value={formData.salary_month} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white">
                      {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Year *</label>
                    <input type="number" name="salary_year" value={formData.salary_year} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Base Salary (৳) *</label>
                  <input type="number" name="base_salary" value={formData.base_salary} onChange={handleChange} required min="0" placeholder="e.g. 25000" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 font-bold" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Allowances (+)</label>
                    <input type="number" name="allowances" value={formData.allowances} onChange={handleChange} min="0" className="w-full px-4 py-2 border border-green-200 bg-green-50/30 rounded-lg focus:ring-2 focus:ring-green-500 text-green-700 font-bold" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Deductions (-)</label>
                    <input type="number" name="deductions" value={formData.deductions} onChange={handleChange} min="0" className="w-full px-4 py-2 border border-red-200 bg-red-50/30 rounded-lg focus:ring-2 focus:ring-red-500 text-red-700 font-bold" />
                  </div>
                </div>

                <div className="bg-teal-50 border border-teal-100 p-4 rounded-lg flex justify-between items-center mt-2">
                  <span className="font-bold text-teal-800">Net Payable:</span>
                  <span className="text-xl font-black text-teal-700">৳ {netSalary.toLocaleString()}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Date *</label>
                    <input type="date" name="payment_date" value={formData.payment_date} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Method</label>
                    <select name="payment_method" value={formData.payment_method} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white">
                      <option value="Bank Transfer">Bank</option>
                      <option value="Cash">Cash</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="w-full bg-teal-600 text-white py-3 rounded-lg font-bold hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 shadow-sm mt-4">
                  <Save size={18} />
                  {loading ? 'Processing...' : 'Pay Salary'}
                </button>
              </form>
            </div>
          </div>

          {/* Right: Salary History */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Banknote className="text-teal-600" size={20} />
                  Recent Salary Payments
                </h3>
                <div className="relative w-full sm:w-64">
                  <input type="text" placeholder="Search name or ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm" />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-sm">
                      <th className="px-6 py-4 font-semibold text-gray-600">Employee</th>
                      <th className="px-6 py-4 font-semibold text-gray-600">Month</th>
                      <th className="px-6 py-4 font-semibold text-gray-600">Method & Date</th>
                      <th className="px-6 py-4 font-semibold text-gray-600 text-right">Net Salary</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {fetching ? (
                      <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-500 font-medium">লোড হচ্ছে...</td></tr>
                    ) : filteredPayrolls.length === 0 ? (
                      <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-500">কোনো পেমেন্ট রেকর্ড পাওয়া যায়নি।</td></tr>
                    ) : (
                      filteredPayrolls.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-sm font-bold text-gray-900">{getStaffName(p.teachers)}</p>
                            <p className="text-xs text-gray-500">ID: {p.teachers?.employee_id || 'N/A'}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="bg-teal-50 text-teal-700 px-2.5 py-1 rounded-md text-xs font-bold border border-teal-100">
                              {p.salary_month} {p.salary_year}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-gray-900">{p.payment_method}</p>
                            <p className="text-xs text-gray-500">{p.payment_date}</p>
                          </td>
                          <td className="px-6 py-4 text-sm font-black text-teal-700 text-right">
                            ৳ {p.net_salary.toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- PAYSLIP MODAL --- */}
      {payslipData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 print:bg-white print:static print:inset-auto print:flex print:items-start print:justify-start overflow-y-auto py-10">
          <div className="bg-white w-full max-w-lg mx-auto rounded-xl shadow-2xl overflow-hidden print:shadow-none print:w-full print:max-w-none">
            
            <div className="flex justify-between items-center bg-gray-50 px-6 py-4 border-b border-gray-100 print:hidden">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <CheckCircle className="text-green-600" size={20} /> Salary Paid
              </h3>
              <button onClick={() => setPayslipData(null)} className="text-gray-400 hover:text-red-500 transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Printable Payslip */}
            <div className="p-8 bg-white" id="payslip-print-area">
              <div className="text-center border-b-2 border-gray-800 pb-6 mb-6">
                <h1 className="text-3xl font-black text-gray-900 tracking-wider">BD SCHOOL ERP</h1>
                <p className="text-gray-600 mt-1">123 Education Road, Dhaka, Bangladesh</p>
                <div className="mt-4 inline-block bg-teal-100 text-teal-800 px-6 py-1 rounded-full text-sm font-bold tracking-widest uppercase border border-teal-200">
                  PAYSLIP
                </div>
              </div>

              <div className="flex justify-between text-sm mb-6 border-b border-gray-100 pb-4">
                <div>
                  <p className="text-gray-500">Transaction ID:</p>
                  <p className="font-bold text-gray-900">{payslipData.transaction_id}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500">Salary Month:</p>
                  <p className="font-bold text-gray-900 uppercase">{payslipData.salary_month} {payslipData.salary_year}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                <div className="grid grid-cols-2 gap-y-3 text-sm">
                  <p><span className="text-gray-500">Employee Name:</span> <span className="font-bold block text-base">{getStaffName(payslipData.staff)}</span></p>
                  <p className="text-right"><span className="text-gray-500">Employee ID:</span> <span className="font-bold block">{payslipData.staff?.employee_id || 'N/A'}</span></p>
                  <p><span className="text-gray-500">Designation:</span> <span className="font-bold block">{payslipData.staff?.designation || 'Staff'}</span></p>
                  <p className="text-right"><span className="text-gray-500">Payment Date:</span> <span className="font-bold block">{payslipData.payment_date}</span></p>
                </div>
              </div>

              <table className="w-full text-sm mb-8">
                <thead>
                  <tr className="border-b-2 border-gray-800">
                    <th className="text-left py-2 text-gray-600 uppercase text-xs">Earnings & Deductions</th>
                    <th className="text-right py-2 text-gray-600 uppercase text-xs">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="py-3 font-medium text-gray-800">Basic Salary</td>
                    <td className="py-3 text-right font-medium">৳ {payslipData.base_salary.toLocaleString()}</td>
                  </tr>
                  {payslipData.allowances > 0 && (
                    <tr>
                      <td className="py-3 font-medium text-green-600">Allowances (+)</td>
                      <td className="py-3 text-right text-green-600 font-medium">৳ {payslipData.allowances.toLocaleString()}</td>
                    </tr>
                  )}
                  {payslipData.deductions > 0 && (
                    <tr>
                      <td className="py-3 font-medium text-red-600">Deductions (-)</td>
                      <td className="py-3 text-right text-red-600 font-medium">৳ {payslipData.deductions.toLocaleString()}</td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-800 bg-gray-50">
                    <td className="py-4 px-2 text-right font-bold text-gray-900 uppercase">Net Payable Salary:</td>
                    <td className="py-4 px-2 text-right font-black text-2xl text-teal-700">৳ {payslipData.net_salary.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>

              <div className="flex justify-between items-end mt-16 pt-6 border-t border-gray-200 text-sm">
                <div>
                  <p className="text-gray-500">Paid via: <span className="font-bold text-gray-900">{payslipData.payment_method}</span></p>
                </div>
                <div className="text-center">
                  <div className="w-40 border-b border-gray-800 mb-2"></div>
                  <p className="text-gray-600 font-medium text-xs uppercase tracking-wider">Authorized Signature</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-4 print:hidden">
              <button onClick={() => setPayslipData(null)} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition-colors">
                Close
              </button>
              <button onClick={() => window.print()} className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-bold flex items-center gap-2 transition-colors shadow-sm">
                <Printer size={18} /> Print Payslip
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}