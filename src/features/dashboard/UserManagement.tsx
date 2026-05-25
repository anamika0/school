// src/features/dashboard/UserManagement.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { ShieldCheck, UserPlus, CheckSquare, Square, AlertCircle, CheckCircle, ArrowLeft, Users, Edit, Trash2, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const permissionGroups = [
  {
    category: 'Student Management',
    color: 'border-blue-200 bg-blue-50/50',
    items: [
      { id: 'students:view', label: 'View Students List' },
      { id: 'students:manage', label: 'Manage Admissions & Edit' }
    ]
  },
  {
    category: 'Accounts & Finance',
    color: 'border-emerald-200 bg-emerald-50/50',
    items: [
      { id: 'accounts:collect', label: 'Collect Fees' },
      { id: 'accounts:expenses', label: 'Manage Expenses & Payroll' },
      { id: 'accounts:reports', label: 'View Financial Reports' }
    ]
  },
  {
    category: 'Academic & Attendance',
    color: 'border-orange-200 bg-orange-50/50',
    items: [
      { id: 'academic:management', label: 'Manage Classes & Subjects' },
      { id: 'attendance:manage', label: 'Take Attendance & Send SMS' }
    ]
  },
  {
    category: 'Exam & Results',
    color: 'border-purple-200 bg-purple-50/50',
    items: [
      { id: 'exams:setup', label: 'Exam Configuration' },
      { id: 'exams:marks', label: 'Enter Students Marks' },
      { id: 'exams:process', label: 'Process GPA & Tabulation' }
    ]
  }
];

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Teacher');
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase.from('staff_users').select('*').order('created_at', { ascending: false });
    if (!error && data) setUsers(data);
  };

  const togglePermission = (permId: string) => {
    setSelectedPerms(prev => 
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    );
  };

  // Reset Form
  const resetForm = () => {
    setEditingId(null);
    setName('');
    setUsername('');
    setPassword('');
    setRole('Teacher');
    setSelectedPerms([]);
  };

  // Edit User Setup
  const handleEditClick = (user: any) => {
    setEditingId(user.id);
    setName(user.name);
    setUsername(user.username);
    setPassword(''); // সিকিউরিটির জন্য পাসওয়ার্ড ফাঁকা রাখা হয়েছে, নতুন দিলে আপডেট হবে
    setRole(user.role);
    setSelectedPerms(user.permissions || []);
    setError(null);
    setSuccess(null);
    
    // স্ক্রল করে উপরে নিয়ে যাওয়ার জন্য
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete User
  const handleDeleteUser = async (id: string, userName: string) => {
    if (!window.confirm(`আপনি কি নিশ্চিত যে "${userName}"-কে ডিলিট করতে চান?`)) return;

    try {
      setError(null);
      const { error: deleteErr } = await supabase.from('staff_users').delete().eq('id', id);
      if (deleteErr) throw deleteErr;

      setSuccess("ইউজার সফলভাবে ডিলিট করা হয়েছে!");
      if (editingId === id) resetForm(); // যদি ওই ইউজারই এডিট মোডে থাকে তবে ফর্ম রিসেট হবে
      fetchUsers();
    } catch (err: any) {
      setError(err.message || "ইউজার ডিলিট করতে সমস্যা হয়েছে।");
    }
  };

  // Submit Logic (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!name || !username || selectedPerms.length === 0) {
        throw new Error("সবগুলো তথ্য দিন এবং অন্তত একটি পারমিশন সিলেক্ট করুন।");
      }

      if (editingId) {
        // Update User Logic
        const updateData: any = { name, username, role, permissions: selectedPerms };
        if (password) updateData.password = password; // যদি নতুন পাসওয়ার্ড টাইপ করে তবেই আপডেট হবে

        const { error: updateErr } = await supabase
          .from('staff_users')
          .update(updateData)
          .eq('id', editingId);

        if (updateErr) throw updateErr;
        setSuccess("ইউজারের তথ্য সফলভাবে আপডেট হয়েছে!");
      } else {
        // Create New User Logic
        if (!password) throw new Error("নতুন ইউজার তৈরি করতে পাসওয়ার্ড দেওয়া বাধ্যতামূলক।");
        
        const { error: insertErr } = await supabase.from('staff_users').insert([{
          name, username, password, role, permissions: selectedPerms
        }]);

        if (insertErr) throw insertErr;
        setSuccess("নতুন ইউজার সফলভাবে তৈরি হয়েছে!");
      }

      resetForm();
      fetchUsers();
    } catch (err: any) {
      setError(err.message || "কাজটি সম্পন্ন করতে সমস্যা হয়েছে (ইউজারনেম ইউনিক হতে হবে)।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/dashboard" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-gray-600" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="text-indigo-600" size={28} />
            User Access & Permissions
          </h2>
          <p className="text-gray-500 mt-1">স্টাফ এবং শিক্ষকদের একাউন্ট তৈরি করুন এবং কাজের পারমিশন দিন।</p>
        </div>
      </div>

      {/* Main Creation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Form */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
          <div className="flex justify-between items-center mb-5 border-b pb-3">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              {editingId ? <Edit size={20} className="text-amber-600"/> : <UserPlus size={20} className="text-indigo-600"/>} 
              {editingId ? 'Edit Staff Account' : 'Create New User'}
            </h3>
            {editingId && (
              <button onClick={resetForm} className="text-gray-400 hover:text-red-600 transition-colors" title="Cancel Edit">
                <X size={20} />
              </button>
            )}
          </div>
          
          {error && <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg flex items-start gap-2 text-sm"><AlertCircle size={18} className="shrink-0"/> <p>{error}</p></div>}
          {success && <div className="mb-4 bg-green-50 text-green-700 p-3 rounded-lg flex items-center gap-2 text-sm"><CheckCircle size={18}/> <p>{success}</p></div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
              <input type="text" value={name} onChange={e=>setName(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Nazmul Huda" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Role</label>
              <select value={role} onChange={e=>setRole(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                <option value="Teacher">Teacher</option>
                <option value="Manager">Manager</option>
                <option value="Accountant">Accountant</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Username (Login ID)</label>
              <input type="text" value={username} onChange={e=>setUsername(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="e.g. nazmul2026" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Password {editingId && <span className="text-xs font-normal text-gray-400 ml-1">(Optional - leave blank to keep current)</span>}
              </label>
              <input type="text" value={password} onChange={e=>setPassword(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder={editingId ? "Type new password" : "Set a strong password"} />
            </div>
            
            <div className="pt-2 flex gap-2">
              <button type="submit" disabled={loading} className={`flex-1 ${editingId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white py-3 rounded-lg font-bold transition-colors`}>
                {loading ? 'Processing...' : (editingId ? 'Update Account' : 'Create Account')}
              </button>
            </div>
          </form>
        </div>

        {/* Right Permissions Grid */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Assign Permissions</h3>
            <p className="text-sm text-gray-500 mb-6">এই ইউজার কোন কোন মডিউলে কাজ করতে পারবেন তা টিক দিয়ে নির্ধারণ করুন।</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {permissionGroups.map((group, idx) => (
                <div key={idx} className={`p-4 rounded-xl border ${group.color}`}>
                  <h4 className="font-bold text-gray-800 mb-3">{group.category}</h4>
                  <div className="space-y-3">
                    {group.items.map(perm => {
                      const isSelected = selectedPerms.includes(perm.id);
                      return (
                        <div 
                          key={perm.id} 
                          onClick={() => togglePermission(perm.id)}
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-white shadow-sm border border-gray-200' : 'hover:bg-white/50 border border-transparent'}`}
                        >
                          {isSelected ? <CheckSquare className="text-indigo-600" size={20}/> : <Square className="text-gray-400" size={20}/>}
                          <span className={`text-sm font-medium ${isSelected ? 'text-indigo-900 font-bold' : 'text-gray-700'}`}>{perm.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Existing Users List */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
          <Users size={20} className="text-indigo-600"/> Existing Users List
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-3 font-bold text-gray-700">Name & Role</th>
                <th className="p-3 font-bold text-gray-700">Username</th>
                <th className="p-3 font-bold text-gray-700">Permissions Count</th>
                <th className="p-3 font-bold text-gray-700">Status</th>
                <th className="p-3 font-bold text-gray-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(u => (
                <tr key={u.id} className={`transition-colors ${editingId === u.id ? 'bg-amber-50/50' : 'hover:bg-gray-50'}`}>
                  <td className="p-3">
                    <p className="font-bold text-gray-900">{u.name}</p>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{u.role}</span>
                  </td>
                  <td className="p-3 font-medium text-gray-600">{u.username}</td>
                  <td className="p-3 text-sm text-gray-600">{u.permissions?.length || 0} Modules Assigned</td>
                  <td className="p-3"><span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full">{u.status}</span></td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleEditClick(u)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit User"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(u.id, u.name)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete User"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={5} className="text-center p-6 text-gray-500">কোনো ইউজার পাওয়া যায়নি।</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}