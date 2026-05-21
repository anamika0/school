// src/features/accounts/ProfitLossReport.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../config/supabase';
import { ArrowLeft, TrendingUp, TrendingDown, Scale, Download, Calendar, Search, PieChart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ProfitLossReport() {
  const [loading, setLoading] = useState(true);
  
  // ডেটা স্টেট
  const [income, setIncome] = useState(0);
  const [operationalExpense, setOperationalExpense] = useState(0);
  const [payrollExpense, setPayrollExpense] = useState(0);

  // ফিল্টার স্টেট (ডিফল্ট: চলতি মাসের ১ তারিখ থেকে আজ পর্যন্ত)
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const todayStr = today.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(todayStr);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // ১. আয় (Fees Collection)
      let incomeQuery = supabase.from('fees_collection').select('paid_amount');
      if (startDate) incomeQuery = incomeQuery.gte('payment_date', startDate);
      if (endDate) incomeQuery = incomeQuery.lte('payment_date', endDate);
      
      // ২. ব্যয় (Operational Expenses)
      let expenseQuery = supabase.from('expenses').select('amount');
      if (startDate) expenseQuery = expenseQuery.gte('expense_date', startDate);
      if (endDate) expenseQuery = expenseQuery.lte('expense_date', endDate);

      // ৩. স্টাফ স্যালারি (Payroll)
      let payrollQuery = supabase.from('staff_salary').select('net_salary');
      if (startDate) payrollQuery = payrollQuery.gte('payment_date', startDate);
      if (endDate) payrollQuery = payrollQuery.lte('payment_date', endDate);

      // ৩টি রিকোয়েস্ট একসাথে ফায়ার করা (দ্রুত লোড হওয়ার জন্য)
      const [incRes, expRes, payRes] = await Promise.all([incomeQuery, expenseQuery, payrollQuery]);

      // ডেটা ক্যালকুলেশন
      const totalIncome = incRes.data?.reduce((sum, item) => sum + Number(item.paid_amount), 0) || 0;
      const totalOpExpense = expRes.data?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
      const totalPayroll = payRes.data?.reduce((sum, item) => sum + Number(item.net_salary), 0) || 0;

      setIncome(totalIncome);
      setOperationalExpense(totalOpExpense);
      setPayrollExpense(totalPayroll);

    } catch (error) {
      console.error('Error generating Profit/Loss report:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  // ক্যালকুলেটেড ভ্যালু
  const totalExpense = operationalExpense + payrollExpense;
  const netProfit = income - totalExpense;
  const isProfit = netProfit >= 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header (No Print) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2 print:hidden">
        <div className="flex items-center gap-4">
          <Link to="/accounts/reports" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-gray-600" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Profit & Loss Report</h2>
            <p className="text-gray-500 mt-1">Financial statement of income vs expenses.</p>
          </div>
        </div>
        <button 
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm"
        >
          <Download size={18} />
          <span>Export / Print</span>
        </button>
      </div>

      {/* Date Filter (No Print) */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-end print:hidden">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">From Date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">To Date</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500" />
        </div>
        <button onClick={fetchReportData} disabled={loading} className="px-8 bg-indigo-600 text-white py-2.5 rounded-lg font-bold hover:bg-indigo-700 flex items-center justify-center gap-2 shadow-sm">
          <Search size={18} />
          {loading ? 'Calculating...' : 'Generate Report'}
        </button>
      </div>

      {/* Printable Header */}
      <div className="hidden print:block text-center border-b-2 border-gray-800 pb-4 mb-6 mt-4">
        <h1 className="text-2xl font-bold text-gray-900 uppercase">BD School ERP</h1>
        <h2 className="text-lg font-semibold text-gray-700 mt-1">Statement of Profit & Loss</h2>
        <p className="text-sm text-gray-500">
          Period: <span className="font-bold">{new Date(startDate).toLocaleDateString('en-GB')}</span> to <span className="font-bold">{new Date(endDate).toLocaleDateString('en-GB')}</span>
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500 font-medium">হিসাব করা হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...</div>
      ) : (
        <>
          {/* Top Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Income */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 border-l-4 border-l-green-500">
              <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Collection (Income)</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">৳ {income.toLocaleString()}</h3>
              </div>
            </div>

            {/* Total Expense */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 border-l-4 border-l-red-500">
              <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                <TrendingDown size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Expense & Payroll</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">৳ {totalExpense.toLocaleString()}</h3>
              </div>
            </div>

            {/* Net Profit / Loss */}
            <div className={`bg-white p-6 rounded-xl shadow-sm border flex items-center gap-4 border-l-4 ${isProfit ? 'border-l-indigo-500' : 'border-l-orange-500'}`}>
              <div className={`p-3 rounded-lg ${isProfit ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'}`}>
                <Scale size={24} />
              </div>
              <div>
                <p className={`text-sm font-bold uppercase tracking-wider ${isProfit ? 'text-indigo-600' : 'text-orange-600'}`}>
                  {isProfit ? 'Net Profit' : 'Net Loss'}
                </p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">৳ {Math.abs(netProfit).toLocaleString()}</h3>
              </div>
            </div>
          </div>

          {/* Detailed Breakdown Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-6 print:shadow-none print:border-none">
            <div className="p-5 border-b border-gray-100 flex items-center gap-2 bg-gray-50 print:bg-transparent print:border-b-2 print:border-gray-800">
              <PieChart className="text-gray-500 print:hidden" size={20} />
              <h3 className="font-bold text-gray-900 text-lg">Financial Breakdown</h3>
            </div>
            
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b-2 border-gray-200 text-sm">
                  <th className="px-6 py-4 font-bold text-gray-700 uppercase">Particulars</th>
                  <th className="px-6 py-4 font-bold text-gray-700 text-right uppercase">Amount (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {/* Income Section */}
                <tr className="bg-green-50/30">
                  <td className="px-6 py-4 font-bold text-gray-900 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div> Student Fees Collection
                  </td>
                  <td className="px-6 py-4 font-bold text-green-700 text-right">{income.toLocaleString()}</td>
                </tr>
                
                {/* Expenses Section */}
                <tr className="bg-red-50/30">
                  <td className="px-6 py-4 font-medium text-gray-700 flex items-center gap-2 pl-10">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div> Operational Expenses
                  </td>
                  <td className="px-6 py-4 font-medium text-red-600 text-right">{operationalExpense.toLocaleString()}</td>
                </tr>
                <tr className="bg-red-50/30">
                  <td className="px-6 py-4 font-medium text-gray-700 flex items-center gap-2 pl-10">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div> Staff Salary (Payroll)
                  </td>
                  <td className="px-6 py-4 font-medium text-red-600 text-right">{payrollExpense.toLocaleString()}</td>
                </tr>
                <tr className="bg-red-50/50 border-t border-red-100">
                  <td className="px-6 py-3 font-bold text-gray-900 text-right">Total Expenses:</td>
                  <td className="px-6 py-3 font-bold text-red-700 text-right">{totalExpense.toLocaleString()}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className={`border-t-2 ${isProfit ? 'border-indigo-200 bg-indigo-50/30' : 'border-orange-200 bg-orange-50/30'}`}>
                  <td className="px-6 py-5 font-black text-gray-900 text-right text-lg uppercase">
                    {isProfit ? 'Net Profit:' : 'Net Loss:'}
                  </td>
                  <td className={`px-6 py-5 font-black text-right text-xl ${isProfit ? 'text-indigo-700' : 'text-orange-700'}`}>
                    ৳ {Math.abs(netProfit).toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>

            <div className="p-4 text-center text-xs text-gray-400 border-t border-gray-100 hidden print:block mt-8">
              Report generated dynamically from BD School ERP on {new Date().toLocaleString()}.
            </div>
          </div>
        </>
      )}
    </div>
  );
}