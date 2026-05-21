// src/features/accounts/ExpenseTracking.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../config/supabase';
import { ArrowLeft, Save, Receipt, List as ListIcon, TrendingDown, Calendar, Search, Plus, Edit, Trash2, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ExpenseTracking() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  
  // Edit Mode State
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    expense_date: new Date().toISOString().split('T')[0],
    category: '',
    amount: '',
    payment_method: 'Cash',
    description: ''
  });

  const fetchData = async () => {
    try {
      setFetching(true);
      const { data: catData } = await supabase.from('expense_categories').select('name').order('name');
      if (catData) {
        const catList = catData.map(c => c.name);
        setCategories(catList);
        if (catList.length > 0 && !formData.category && !editingId) {
          setFormData(prev => ({ ...prev, category: catList[0] }));
        }
      }

      const { data: expData, error: expError } = await supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false });

      if (expError) throw expError;
      if (expData) setExpenses(expData);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const amount = parseFloat(formData.amount);
      if (amount <= 0) throw new Error("Amount অবশ্যই ০ এর চেয়ে বেশি হতে হবে।");
      if (!formData.category.trim()) throw new Error("ক্যাটাগরি নির্বাচন করুন বা লিখুন।");

      const finalCategory = formData.category.trim();

      if (isCustomCategory) {
        const { error: catError } = await supabase
          .from('expense_categories')
          .upsert([{ name: finalCategory }], { onConflict: 'name' });
        if (catError) console.error("Error saving new category", catError);
      }

      if (editingId) {
        // Update Existing Expense
        const { error: updateError } = await supabase
          .from('expenses')
          .update({
            expense_date: formData.expense_date,
            category: finalCategory,
            amount,
            payment_method: formData.payment_method,
            description: formData.description
          })
          .eq('id', editingId);

        if (updateError) throw updateError;
        setSuccessMsg('খরচের এন্ট্রি সফলভাবে আপডেট করা হয়েছে!');
      } else {
        // Insert New Expense
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const voucher_no = `EXP-${new Date().getFullYear()}-${randomNum}`;

        const { error: insertError } = await supabase
          .from('expenses')
          .insert([{
            expense_date: formData.expense_date,
            category: finalCategory,
            amount,
            payment_method: formData.payment_method,
            description: formData.description,
            voucher_no
          }]);

        if (insertError) throw insertError;
        setSuccessMsg('নতুন খরচ সফলভাবে সেভ করা হয়েছে!');
      }
      
      // Reset Form
      setFormData({ 
        ...formData, 
        amount: '', 
        description: '',
        category: isCustomCategory ? finalCategory : categories[0] || ''
      });
      setIsCustomCategory(false);
      setEditingId(null);
      
      fetchData(); 
    } catch (err: any) {
      setError(err.message || 'ডেটা সেভ করতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  // এডিট বাটনে ক্লিক করলে ডেটা ফর্মে নিয়ে আসা
  const handleEditClick = (exp: any) => {
    setEditingId(exp.id);
    setFormData({
      expense_date: exp.expense_date,
      category: exp.category,
      amount: exp.amount.toString(),
      payment_method: exp.payment_method,
      description: exp.description || ''
    });
    setIsCustomCategory(false);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // স্ক্রল করে উপরে নিয়ে যাবে
  };

  // ডিলিট করার ফাংশন
  const handleDelete = async (id: string, voucher_no: string) => {
    if (!window.confirm(`আপনি কি নিশ্চিতভাবে ${voucher_no} ভাউচারটি ডিলিট করতে চান?`)) return;

    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
      
      setSuccessMsg(`${voucher_no} সফলভাবে ডিলিট করা হয়েছে।`);
      fetchData();
    } catch (err: any) {
      alert(`ডিলিট করতে সমস্যা হয়েছে: ${err.message}`);
    }
  };

  // এডিট ক্যানসেল করার ফাংশন
  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ 
      ...formData, 
      amount: '', 
      description: '',
      category: categories[0] || ''
    });
    setIsCustomCategory(false);
    setError(null);
    setSuccessMsg(null);
  };

  const stats = useMemo(() => {
    const currentMonthNum = new Date().getMonth() + 1;
    const currentYearNum = new Date().getFullYear();
    const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

    let thisMonthTotal = 0;
    let allTimeTotal = 0;

    expenses.forEach(exp => {
      const amt = parseFloat(exp.amount || 0);
      allTimeTotal += amt;
      const expDate = new Date(exp.expense_date);
      if (expDate.getMonth() + 1 === currentMonthNum && expDate.getFullYear() === currentYearNum) {
        thisMonthTotal += amt;
      }
    });

    return { thisMonthTotal, allTimeTotal, currentMonth };
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    if (!searchQuery.trim()) return expenses;
    const query = searchQuery.toLowerCase();
    return expenses.filter(e => 
      e.voucher_no.toLowerCase().includes(query) || 
      e.category.toLowerCase().includes(query) ||
      (e.description && e.description.toLowerCase().includes(query))
    );
  }, [expenses, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4 mb-2">
        <Link to="/accounts" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-gray-600" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Expense Tracking</h2>
          <p className="text-gray-500 mt-1">Record and monitor daily school expenses.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 border-l-4 border-l-red-500">
          <div className="p-3 bg-red-50 text-red-600 rounded-lg">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Expense This Month ({stats.currentMonth})</p>
            <h3 className="text-2xl font-bold text-gray-900">৳ {stats.thisMonthTotal.toLocaleString()}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 border-l-4 border-l-gray-700">
          <div className="p-3 bg-gray-100 text-gray-700 rounded-lg">
            <TrendingDown size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Expense (All Time)</p>
            <h3 className="text-2xl font-bold text-gray-900">৳ {stats.allTimeTotal.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className={`bg-white p-6 rounded-xl shadow-sm border ${editingId ? 'border-yellow-400 ring-2 ring-yellow-100' : 'border-gray-100'}`}>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
              {editingId ? <Edit className="text-yellow-600" size={20} /> : <Receipt className="text-red-600" size={20} />}
              {editingId ? 'Edit Expense Record' : 'Add New Expense'}
            </h3>

            {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">{error}</div>}
            {successMsg && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm font-medium">{successMsg}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Date *</label>
                <input type="date" value={formData.expense_date} onChange={(e) => setFormData({...formData, expense_date: e.target.value})} required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500" />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-medium text-gray-700">Category *</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomCategory(!isCustomCategory);
                      setFormData({ ...formData, category: '' });
                    }}
                    className="text-xs flex items-center gap-1 text-red-600 hover:text-red-800 font-medium"
                  >
                    {isCustomCategory ? <ListIcon size={14} /> : <Plus size={14} />}
                    {isCustomCategory ? 'Select Existing' : 'Add Custom'}
                  </button>
                </div>
                
                {isCustomCategory ? (
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    placeholder="Enter new category name..."
                    required
                    className="w-full px-4 py-2 border border-red-300 bg-red-50/30 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                  />
                ) : (
                  <select 
                    value={formData.category} 
                    onChange={(e) => setFormData({...formData, category: e.target.value})} 
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 bg-white"
                  >
                    {categories.length === 0 && <option value="">Select Category</option>}
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount (৳) *</label>
                <input type="number" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} required min="1" placeholder="e.g. 500" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 font-bold" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Method *</label>
                <select value={formData.payment_method} onChange={(e) => setFormData({...formData, payment_method: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 bg-white">
                  <option value="Cash">Cash</option>
                  <option value="Bank">Bank Transfer</option>
                  <option value="Bkash">Bkash / Mobile Banking</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description (Optional)</label>
                <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} placeholder="Write details about this expense..." className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500"></textarea>
              </div>

              <div className="flex gap-3 pt-2">
                {editingId && (
                  <button type="button" onClick={handleCancelEdit} className="w-1/3 bg-gray-100 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-1">
                    <X size={18} /> Cancel
                  </button>
                )}
                <button type="submit" disabled={loading} className={`${editingId ? 'w-2/3 bg-yellow-500 hover:bg-yellow-600' : 'w-full bg-red-600 hover:bg-red-700'} text-white py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 shadow-sm`}>
                  <Save size={18} />
                  {loading ? 'Saving...' : (editingId ? 'Update Expense' : 'Save Expense')}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <ListIcon className="text-gray-500" size={20} />
                Recent Expenses
              </h3>
              <div className="relative w-full sm:w-64">
                <input type="text" placeholder="Search voucher or category..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 text-sm" />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-sm">
                    <th className="px-6 py-4 font-semibold text-gray-600">Date & Voucher</th>
                    <th className="px-6 py-4 font-semibold text-gray-600">Details</th>
                    <th className="px-6 py-4 font-semibold text-gray-600">Method</th>
                    <th className="px-6 py-4 font-semibold text-gray-600 text-right">Amount (৳)</th>
                    <th className="px-6 py-4 font-semibold text-gray-600 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {fetching ? (
                    <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500 font-medium">লোড হচ্ছে...</td></tr>
                  ) : filteredExpenses.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">কোনো খরচের রেকর্ড পাওয়া যায়নি।</td></tr>
                  ) : (
                    filteredExpenses.map((exp) => (
                      <tr key={exp.id} className={`transition-colors ${editingId === exp.id ? 'bg-yellow-50/50' : 'hover:bg-gray-50/50'}`}>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-gray-900">{exp.expense_date}</p>
                          <p className="text-xs font-medium text-red-600">{exp.voucher_no}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-gray-900">{exp.category}</p>
                          {exp.description && <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{exp.description}</p>}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium">{exp.payment_method}</span>
                        </td>
                        <td className="px-6 py-4 text-sm font-black text-gray-900 text-right">
                          {exp.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center items-center gap-3">
                            <button onClick={() => handleEditClick(exp)} className="text-gray-400 hover:text-yellow-600 transition-colors" title="Edit">
                              <Edit size={18} />
                            </button>
                            <button onClick={() => handleDelete(exp.id, exp.voucher_no)} className="text-gray-400 hover:text-red-600 transition-colors" title="Delete">
                              <Trash2 size={18} />
                            </button>
                          </div>
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
  );
}