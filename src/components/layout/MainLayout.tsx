// src/components/layout/MainLayout.tsx
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  LayoutDashboard, Users, GraduationCap, 
  BookOpen, Wallet, LogOut, Menu, ShieldCheck, 
  MonitorPlay // 🚀 BDT-Soft এর লোগোর জন্য নতুন আইকন
} from 'lucide-react';

export default function MainLayout() {
  const { user, signOut } = useAuthStore();
  const location = useLocation();

  // পারমিশন চেক করার কোর লজিক
  const hasAccess = (perms: string[], adminOnly: boolean = false) => {
    const userRole = user?.role?.toLowerCase() || '';
    
    // ১. Admin বা Super Admin হলে কোনো পারমিশন ছাড়াই সবকিছুর অ্যাক্সেস পাবে
    if (userRole === 'admin' || userRole === 'super_admin' || userRole === 'super admin') return true;

    // ২. যদি পেজটি শুধুমাত্র অ্যাডমিনদের জন্য হয়, তাহলে সাধারণ টিচারদের ঢুকতে দেবে না
    if (adminOnly) return false;

    // ৩. যদি কোনো পারমিশন রিকোয়ারমেন্ট না থাকে, তবে সবাই দেখতে পাবে
    if (!perms || perms.length === 0) return true;

    // ৪. টাইপস্ক্রিপ্ট এরর ফিক্স: অ্যারেটিকে স্পষ্টভাবে string[] হিসেবে ডিফাইন করা হয়েছে
    const userPerms: string[] = Array.isArray(user?.permissions) ? user.permissions : [];
    return perms.some(p => userPerms.includes(p));
  };

  const sidebarLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, perms: [] },
    { name: 'Students', path: '/students', icon: Users, perms: ['students:view', 'students:manage'] },
    { name: 'Teachers', path: '/teachers', icon: GraduationCap, perms: [], adminOnly: true },
    { name: 'Academic', path: '/academic', icon: BookOpen, perms: ['academic:management', 'attendance:manage', 'exams:setup', 'exams:marks', 'exams:process'] },
    { name: 'Accounts', path: '/accounts', icon: Wallet, perms: ['accounts:collect', 'accounts:expenses', 'accounts:reports'] },
    { name: 'User Management', path: '/users', icon: ShieldCheck, perms: [], adminOnly: true },
  ];

  const visibleLinks = sidebarLinks.filter(link => hasAccess(link.perms || [], link.adminOnly));

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-indigo-950 text-white hidden md:flex flex-col shadow-2xl relative z-20">
        
        {/* 🚀 ১. Premium School Header */}
        <div className="p-6 border-b border-indigo-800/50 bg-indigo-900/20">
          <h1 className="text-2xl font-black tracking-wide text-white">
            A.K High School
          </h1>
          <p className="text-[10px] text-indigo-300 font-bold mt-1.5 uppercase tracking-[0.25em]">
            School Management
          </p>
        </div>
        
        {/* Navigation Links */}
        <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {visibleLinks.map((link) => {
            const isActive = location.pathname.startsWith(link.path);
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-indigo-600 shadow-md shadow-indigo-900/50 text-white font-bold' 
                    : 'text-indigo-200/80 hover:bg-indigo-800/50 hover:text-white font-medium'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-white' : 'text-indigo-300'} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* 🚀 ২. Premium Footer (BDT-Soft + Logout) */}
        <div className="p-5 border-t border-indigo-800/50 bg-indigo-950/80">
          
          {/* BDT-Soft Branding */}
          <div className="flex items-center justify-center gap-2.5 mb-5 text-indigo-400/70 hover:text-indigo-300 transition-colors cursor-default">
            <div className="p-1.5 bg-indigo-900/50 rounded-md border border-indigo-800/50">
              <MonitorPlay size={14} className="text-indigo-300" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Powered by BDT-Soft</span>
          </div>

          {/* Premium Logout Button */}
          <button 
            onClick={signOut}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 rounded-xl transition-all duration-300 font-bold shadow-sm"
          >
            <LogOut size={18} />
            <span>Log Out</span>
          </button>

        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen relative bg-gray-50/50">
        {/* Header */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 z-10 border-b border-gray-100">
          <div className="flex items-center gap-4 md:hidden">
            <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
              <Menu size={24} />
            </button>
          </div>
          
          <div className="ml-auto flex items-center gap-4">
            <div className="text-sm text-right hidden sm:block">
              <p className="font-bold text-gray-900">{user?.full_name || 'Admin User'}</p>
              <p className="text-xs text-indigo-600 font-semibold capitalize bg-indigo-50 inline-block px-2 py-0.5 rounded-full mt-0.5">
                {user?.role || 'Super Admin'}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-md shadow-indigo-200">
              {(user?.full_name || 'A').charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="flex-1 overflow-auto p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}