import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { ArrowLeft, Save, Settings, Layers, CheckCircle, Plus, Tag, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FeeConfiguration() {
  const [classes, setClasses] = useState<any[]>([]);
  const [feeTypes, setFeeTypes] = useState<string[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [feeAmounts, setFeeAmounts] = useState<Record<string, string>>({});
  const [newFeeTypeName, setNewFeeTypeName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadInitialData = async () => {
    const { data: classData } = await supabase.from('classes').select('*').order('numeric_value');
    if (classData) setClasses(classData);
    const { data: feeData } = await supabase.from('fee_types').select('name').order('name');
    if (feeData) setFeeTypes(feeData.map(f => f.name));
  };

  useEffect(() => { loadInitialData(); }, []);

  const handleAddNewFeeType = async () => {
    if (!newFeeTypeName.trim()) return;
    const { error } = await supabase.from('fee_types').insert([{ name: newFeeTypeName.trim() }]);
    if (error) setError("এই ক্যাটাগরি আগে থেকেই আছে।");
    else { setNewFeeTypeName(''); loadInitialData(); }
  };

  const handleDeleteFeeType = async (name: string) => {
    if (!window.confirm("ডিলিট করতে চান?")) return;
    await supabase.from('fee_types').delete().eq('name', name);
    loadInitialData();
  };

  const handleSave = async () => {
    if (!selectedClassId) return setError("ক্লাস সিলেক্ট করুন।");
    setLoading(true);
    const records = Object.keys(feeAmounts).map(type => ({
      class_id: selectedClassId, fee_type: type, amount: Number(feeAmounts[type] || 0)
    }));
    await supabase.from('fee_structures').upsert(records, { onConflict: 'class_id,fee_type' });
    setSuccessMsg("সেভ হয়েছে!"); setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/accounts" className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft size={24} /></Link>
        <h2 className="text-2xl font-bold">Fee Configuration</h2>
      </div>

      <div className="bg-white p-6 rounded-xl border">
        <h3 className="font-bold mb-4 flex items-center gap-2"><Tag className="text-orange-500"/> Manage Categories</h3>
        <div className="flex gap-2 mb-4">
          <input className="flex-1 px-4 py-2 border rounded-lg" value={newFeeTypeName} onChange={e => setNewFeeTypeName(e.target.value)} placeholder="নতুন ফি টাইপ..." />
          <button onClick={handleAddNewFeeType} className="bg-orange-600 text-white px-4 py-2 rounded-lg"><Plus /></button>
        </div>
        <div className="flex flex-wrap gap-2">
          {feeTypes.map(type => (
            <div key={type} className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-sm">
              {type} <button onClick={() => handleDeleteFeeType(type)} className="text-red-500"><Trash2 size={14}/></button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border">
        <label className="flex items-center gap-2 font-bold mb-4"><Layers className="text-orange-500" size={18}/> Select Class</label>
        <select onChange={e => setSelectedClassId(e.target.value)} className="w-full p-3 border rounded-lg mb-6">
          <option value="">-- ক্লাস সিলেক্ট করুন --</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
        </select>
        
        {selectedClassId && (
          <div className="grid md:grid-cols-2 gap-4">
            {feeTypes.map(type => (
              <div key={type}>
                <label className="text-sm font-bold">{type}</label>
                <input type="number" onChange={e => setFeeAmounts({...feeAmounts, [type]: e.target.value})} className="w-full p-2 border rounded-lg" placeholder="0.00" />
              </div>
            ))}
            <button onClick={handleSave} className="w-full bg-orange-600 text-white p-3 rounded-lg font-bold mt-4">Save Structure</button>
          </div>
        )}
      </div>
    </div>
  );
}