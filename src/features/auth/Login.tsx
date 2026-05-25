// src/features/auth/Login.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { useAuthStore } from '../../store/useAuthStore';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // পেজ রিলোড না করে স্মুথলি ড্যাশবোর্ডে যাওয়ার জন্য
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // ১. সুপার অ্যাডমিন লগইন (যদি ইনপুটে @ থাকে, অর্থাৎ ইমেইল ব্যবহার করা হয়)
      if (username.includes('@')) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: username,
          password,
        });

        if (signInError) throw signInError;
        
        // Supabase নিজে থেকেই সেশন আপডেট করবে, আমরা শুধু রিডাইরেক্ট করবো
        navigate('/dashboard', { replace: true });
        return;
      }

      // ২. স্টাফ/শিক্ষক লগইন (কাস্টম ইউজারনেম/আইডি দিয়ে)
      const { data: staff, error: staffErr } = await supabase
        .from('staff_users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .eq('status', 'Active')
        .single();

      if (staffErr || !staff) {
        throw new Error('ইউজার আইডি বা পাসওয়ার্ড ভুল হয়েছে, অথবা অ্যাকাউন্টটি বন্ধ আছে।');
      }

      // MainLayout-এ নাম দেখানোর জন্য name কে full_name হিসেবে ম্যাপ করা
      const userData = { ...staff, full_name: staff.name || staff.username };

      // ৩. লোকাল স্টোরেজে ডেটা সেভ করা
      localStorage.setItem('staff_session', JSON.stringify(userData));
      
      // ৪. সরাসরি Zustand স্টেট আপডেট করা (যাতে অ্যাপ সাথে সাথে ইউজারকে চিনে নেয়)
      useAuthStore.setState({ user: userData, session: null, isLoading: false });
      
      // ৫. সফল লগইনের পর পেজ রিলোড না করেই ড্যাশবোর্ডে রিডাইরেক্ট
      navigate('/dashboard', { replace: true });

    } catch (err: any) {
      setError(err.message === 'Invalid login credentials' ? 'লগইন তথ্য ভুল হয়েছে।' : err.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-10 shadow-lg border border-gray-100">
        
        <div className="text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
            <span className="text-indigo-600 font-black text-xl">ERP</span>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            School Management
          </h2>
          <p className="mt-2 text-sm text-gray-500 font-medium">
            অ্যাডমিন ইমেইল অথবা ইউজার আইডি দিয়ে লগইন করুন
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          
          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm font-medium text-red-700 border border-red-100 flex items-start gap-2">
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5" htmlFor="username">User ID / Email</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="off"
                required
                className="relative block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all sm:text-sm"
                placeholder="e.g. nazmul2026 or admin@school.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5" htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="relative block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all sm:text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`group relative flex w-full justify-center rounded-lg border border-transparent bg-indigo-600 px-4 py-3.5 text-base font-bold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-md transition-all ${
                loading ? 'cursor-not-allowed opacity-70' : ''
              }`}
            >
              {loading ? 'যাচাই করা হচ্ছে...' : 'লগইন করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}