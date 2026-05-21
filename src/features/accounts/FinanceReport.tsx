// src/features/accounts/FinanceReport.tsx
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../config/supabase';
import { TrendingUp, Calendar, DollarSign, Download, ArrowLeft, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FinanceReport() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        // fees_collection এর সাথে students টেবিল জয়েন
        const { data, error } = await supabase
          .from('fees_collection')
          .select(`
            *,
            students (
              first_name,
              last_name,
              admission_no,
              class_name
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) setTransactions(data);
      } catch (err) {
        console.error('Error fetching finance report:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  // --- ডাইনামিক স্ট্যাটস ক্যালকুলেশন ---
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    const currentYear = new Date().getFullYear();

    let todayTotal = 0;
    let monthTotal = 0;
    let grandTotal = 0;

    transactions.forEach(t => {
      const amount = parseFloat(t.paid_amount || 0);
      grandTotal += amount;
      
      if (t.payment_date === today) {
        todayTotal += amount;
      }
      
      const payDate = new Date(t.payment_date);
      if (payDate.toLocaleString('default', { month: 'long' }) === currentMonth && payDate.getFullYear() === currentYear) {
        monthTotal += amount;
      }
    });

    return { todayTotal, monthTotal, grandTotal, currentMonth };
  }, [transactions]);

  // --- সার্চ ও ফিল্টার ---
  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions;
    const query = searchQuery.toLowerCase().trim();
    
    return transactions.filter(t => {
      const receiptNo = (t.receipt_no || '').toLowerCase();
      const fName = (t.students?.first_name || '').toLowerCase();
      const admNo = (t.students?.admission_no || '').toLowerCase();
      return receiptNo.includes(query) || fName.includes(query) || admNo.includes(query);
    });
  }, [transactions, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div className="flex items-center gap-4">
          <Link to="/accounts/reports" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-gray-600" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Finance Report</h2>
            <p className="text-gray-500 mt-1">Overview of income and transactions.</p>
          </div>
        </div>
        <button 
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm print:hidden"
        >
          <Download size={18} />
          <span>Export / Print</span>
        </button>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 border-l-4 border-l-green-500">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Today's Collection</p>
            <h3 className="text-2xl font-bold text-gray-900">৳ {stats.todayTotal.toLocaleString()}</h3>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 border-l-4 border-l-indigo-500">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">This Month ({stats.currentMonth})</p>
            <h3 className="text-2xl font-bold text-gray-900">৳ {stats.monthTotal.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 border-l-4 border-l-purple-500">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Revenue (All Time)</p>
            <h3 className="text-2xl font-bold text-gray-900">৳ {stats.grandTotal.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* Transactions Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden">
          <h3 className="text-lg font-bold text-gray-900">Recent Transactions</h3>
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Search by receipt, name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-sm">
                <th className="px-6 py-4 font-semibold text-gray-600">Date</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Receipt No</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Student Info</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Fee Type</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Method</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-right">Amount (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500 font-medium">ডেটা লোড হচ্ছে...</td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">কোনো পেমেন্ট রেকর্ড পাওয়া যায়নি।</td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-600">{tx.payment_date}</td>
                    <td className="px-6 py-4 text-sm font-medium text-indigo-600">{tx.receipt_no}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-900">
                        {tx.students?.first_name} {tx.students?.last_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        ID: {tx.students?.admission_no} | Class: {tx.students?.class_name}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{tx.fee_type}</p>
                      {tx.fee_month && <p className="text-xs text-gray-500">{tx.fee_month} {tx.fee_year}</p>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium">{tx.payment_method}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                      {tx.paid_amount}
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