// src/components/layout/MainLayout.tsx
import { useState } from 'react'; // 🚀 useState যুক্ত করা হয়েছে
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  LayoutDashboard, Users, GraduationCap, 
  BookOpen, Wallet, LogOut, Menu, ShieldCheck, 
  MonitorPlay, X // 🚀 ক্লোজ আইকন যুক্ত করা হয়েছে
} from 'lucide-react';

export default function MainLayout() {
  const { user, signOut } = useAuthStore();
  const location = useLocation();
  
  // 🚀 মোবাইল মেনু ওপেন/ক্লোজ করার স্টেট
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const hasAccess = (perms: string[], adminOnly: boolean = false) => {
    const userRole = user?.role?.toLowerCase() || '';
    if (userRole === 'admin' || userRole === 'super_admin' || userRole === 'super admin') return true;
    if (adminOnly) return false;
    if (!perms || perms.length === 0) return true;
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

  // মেনু লিংকে ক্লিক করলে যেন মোবাইল মেনু অটোমেটিক বন্ধ হয়ে যায়
  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden relative">
      
      {/* 🚀 Mobile Menu Overlay (কালো ব্যাকগ্রাউন্ড) */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - 🚀 মোবাইলের জন্য রেসপন্সিভ করা হয়েছে */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-indigo-950 text-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out
        md:relative md:w-64 md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        {/* Premium School Header */}
        <div className="p-6 border-b border-indigo-800/50 bg-indigo-900/20 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black tracking-wide text-white">A.K High School</h1>
            <p className="text-[10px] text-indigo-300 font-bold mt-1.5 uppercase tracking-[0.25em]">School Management</p>
          </div>
          {/* 🚀 মোবাইলের জন্য ক্লোজ বাটন */}
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden p-2 rounded-lg text-indigo-300 hover:text-white hover:bg-indigo-800/50 transition-colors"
          >
            <X size={24} />
          </button>
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
                onClick={handleLinkClick}
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

        {/* Premium Footer (BDT-Soft + Logout) */}
        <div className="p-5 border-t border-indigo-800/50 bg-indigo-950/80">
          <div className="flex items-center justify-center gap-2.5 mb-5 text-indigo-400/70 hover:text-indigo-300 transition-colors cursor-default">
            <div className="p-1.5 bg-indigo-900/50 rounded-md border border-indigo-800/50">
              <MonitorPlay size={14} className="text-indigo-300" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Powered by BDT-Soft</span>
          </div>

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
      <main className="flex-1 flex flex-col h-screen relative bg-gray-50/50 w-full overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-4 md:px-6 z-10 border-b border-gray-100">
          <div className="flex items-center gap-4 md:hidden">
            {/* 🚀 মোবাইল মেনু ওপেন করার বাটন */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            >
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
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}