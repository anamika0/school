// src/features/accounts/FeeConfiguration.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../config/supabase';
import { Settings, Save, AlertCircle, CheckCircle, Edit, Trash2, ArrowLeft, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const CLASSES = ['Play', 'Nursery', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
const DEFAULT_FEE_TYPES = ['Monthly Fee', 'Admission Fee', 'Exam Fee', 'Other Fee'];

export default function FeeConfiguration() {
  const [fees, setFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [className, setClassName] = useState('Play');
  
  // ডাইনামিক ক্যাটাগরির জন্য নতুন স্টেট
  const [feeType, setFeeType] = useState('Monthly Fee');
  const [isAddingNewType, setIsAddingNewType] = useState(false);
  const [customType, setCustomType] = useState('');
  
  const [amount, setAmount] = useState<number | ''>('');

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    const { data, error } = await supabase
      .from('fee_structures')
      .select('*')
      .order('class_name', { ascending: true });
    
    if (!error && data) {
      setFees(data);
    }
  };

  // ডাটাবেস থেকে অটোমেটিক ইউনিক ক্যাটাগরিগুলো বের করার লজিক
  const dynamicFeeTypes = useMemo(() => {
    const dbTypes = fees.map(f => f.fee_type);
    return Array.from(new Set([...DEFAULT_FEE_TYPES, ...dbTypes]));
  }, [fees]);

  const resetForm = () => {
    setEditingId(null);
    setClassName('Play');
    setFeeType('Monthly Fee');
    setIsAddingNewType(false);
    setCustomType('');
    setAmount('');
    setError(null);
  };

  const handleEditClick = (fee: any) => {
    setEditingId(fee.id);
    setClassName(fee.class_name);
    setFeeType(fee.fee_type);
    setIsAddingNewType(false);
    setCustomType('');
    setAmount(fee.amount);
    setError(null);
    setSuccess(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই ফি সেটআপটি ডিলিট করতে চান?')) return;

    try {
      const { error: deleteErr } = await supabase.from('fee_structures').delete().eq('id', id);
      if (deleteErr) throw deleteErr;

      setSuccess("সফলভাবে ডিলিট করা হয়েছে!");
      if (editingId === id) resetForm();
      fetchFees();
    } catch (err: any) {
      setError("ডিলিট করতে সমস্যা হয়েছে।");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // ইউজার নতুন ক্যাটাগরি টাইপ করেছে নাকি ড্রপডাউন থেকে সিলেক্ট করেছে তা চেক করা
      const finalFeeType = isAddingNewType ? customType.trim() : feeType;

      if (!finalFeeType) {
        throw new Error("দয়া করে ফি-এর ধরন (Fee Type) দিন।");
      }
      if (!amount || Number(amount) <= 0) {
        throw new Error("দয়া করে সঠিক টাকার পরিমাণ দিন।");
      }

      if (editingId) {
        const { error: updateErr } = await supabase
          .from('fee_structures')
          .update({ class_name: className, fee_type: finalFeeType, amount: Number(amount) })
          .eq('id', editingId);

        if (updateErr) throw updateErr;
        setSuccess("ফি সফলভাবে আপডেট হয়েছে!");
      } else {
        const isDuplicate = fees.some(f => f.class_name === className && f.fee_type === finalFeeType);
        if (isDuplicate) {
          throw new Error(`"${className}" ক্লাসের জন্য "${finalFeeType}" আগে থেকেই সেট করা আছে।`);
        }

        const { error: insertErr } = await supabase
          .from('fee_structures')
          .insert([{ class_name: className, fee_type: finalFeeType, amount: Number(amount) }]);

        if (insertErr) throw insertErr;
        setSuccess("নতুন ফি সফলভাবে যোগ করা হয়েছে!");
      }

      resetForm();
      fetchFees();
    } catch (err: any) {
      setError(err.message || "ফি সেভ করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/accounts" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-gray-600" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="text-indigo-600" size={28} />
            Fee Configuration
          </h2>
          <p className="text-gray-500 mt-1">ক্লাস অনুযায়ী মাসিক বেতন ও অন্যান্য ফি নির্ধারণ করুন।</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Form: Add/Edit Fee */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
          <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2 border-b pb-3">
            {editingId ? <Edit size={20} className="text-amber-600"/> : <PlusCircle size={20} className="text-indigo-600"/>} 
            {editingId ? 'Update Configured Fee' : 'Add New Fee'}
          </h3>
          
          {error && <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg flex items-start gap-2 text-sm"><AlertCircle size={18} className="shrink-0"/> <p>{error}</p></div>}
          {success && <div className="mb-4 bg-green-50 text-green-700 p-3 rounded-lg flex items-center gap-2 text-sm"><CheckCircle size={18}/> <p>{success}</p></div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Class Name</label>
              <select value={className} onChange={e=>setClassName(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-gray-50 font-medium">
                {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            
            {/* 🚀 Dynamic Fee Category Section */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-bold text-gray-700">Fee Type</label>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNewType(!isAddingNewType);
                    setCustomType('');
                  }}
                  className={`text-xs font-bold px-2 py-1 rounded-md transition-colors ${isAddingNewType ? 'text-gray-600 bg-gray-100 hover:bg-gray-200' : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'}`}
                >
                  {isAddingNewType ? 'Cancel Adding' : '+ Add Category'}
                </button>
              </div>
              
              {isAddingNewType ? (
                <input
                  type="text"
                  value={customType}
                  onChange={e => setCustomType(e.target.value)}
                  className="w-full p-3 border border-indigo-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-indigo-50/30 font-medium"
                  placeholder="e.g. Transport Fee, Library Fee"
                  required={isAddingNewType}
                  autoFocus
                />
              ) : (
                <select 
                  value={feeType} 
                  onChange={e=>setFeeType(e.target.value)} 
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-gray-50 font-medium"
                >
                  {dynamicFeeTypes.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Amount (৳)</label>
              <input 
                type="number" 
                value={amount} 
                onChange={e=>setAmount(Number(e.target.value))} 
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-gray-900" 
                placeholder="0.00" 
                required 
              />
            </div>
            
            <div className="pt-2 flex gap-3">
              {editingId && (
                <button type="button" onClick={resetForm} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
              )}
              <button type="submit" disabled={loading} className={`flex-1 ${editingId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-colors`}>
                <Save size={20} />
                {loading ? 'Saving...' : (editingId ? 'Update Fee' : 'Save Fee')}
              </button>
            </div>
          </form>
        </div>

        {/* Right Panel: Fee List */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 border-b pb-3">
              Configured Fee Structures
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-y border-gray-200">
                    <th className="p-4 font-bold text-gray-700">Class Name</th>
                    <th className="p-4 font-bold text-gray-700">Fee Type</th>
                    <th className="p-4 font-bold text-gray-700 text-right">Amount (৳)</th>
                    <th className="p-4 font-bold text-gray-700 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {fees.map(fee => (
                    <tr key={fee.id} className={`hover:bg-gray-50 transition-colors ${editingId === fee.id ? 'bg-amber-50/50' : ''}`}>
                      <td className="p-4">
                        <span className="font-bold text-indigo-900 bg-indigo-50 px-3 py-1 rounded-lg">{fee.class_name}</span>
                      </td>
                      <td className="p-4 font-medium text-gray-700">
                        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-sm">{fee.fee_type}</span>
                      </td>
                      <td className="p-4 font-black text-gray-900 text-right">৳ {fee.amount}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleEditClick(fee)}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(fee.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {fees.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center p-8 text-gray-500 font-medium">
                        এখনো কোনো ফি সেটআপ করা হয়নি।
                      </td>
                    </tr>
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