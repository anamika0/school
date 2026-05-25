// src/components/layout/MainLayout.tsx
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  LayoutDashboard, Users, GraduationCap, 
  BookOpen, Wallet, LogOut, Menu, ShieldCheck 
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
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-indigo-900 text-white hidden md:flex flex-col">
        <div className="h-16 flex items-center justify-center border-b border-indigo-800">
          <h1 className="text-xl font-bold tracking-wider">BD School ERP</h1>
        </div>
        
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {visibleLinks.map((link) => {
            const isActive = location.pathname.startsWith(link.path);
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                  isActive ? 'bg-indigo-800 text-white' : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{link.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-indigo-800">
          <button 
            onClick={signOut}
            className="flex items-center gap-3 w-full px-3 py-2 text-indigo-200 hover:text-white hover:bg-indigo-800 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen relative">
        {/* Header */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4 md:hidden">
            <button className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100">
              <Menu size={24} />
            </button>
          </div>
          
          <div className="ml-auto flex items-center gap-4">
            <div className="text-sm text-right hidden sm:block">
              {/* user?.name মুছে ফেলা হয়েছে, শুধু full_name ব্যবহার করা হয়েছে */}
              <p className="font-medium text-gray-900">{user?.full_name || 'Admin User'}</p>
              <p className="text-gray-500 capitalize">{user?.role || 'Super Admin'}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold border border-indigo-200">
              {(user?.full_name || 'A').charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}