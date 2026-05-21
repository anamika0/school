// src/components/layout/MainLayout.tsx
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  LayoutDashboard, Users, GraduationCap, 
  BookOpen, Wallet, LogOut, Menu 
} from 'lucide-react';

const sidebarLinks = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Students', path: '/students', icon: Users },
  { name: 'Teachers', path: '/teachers', icon: GraduationCap },
  { name: 'Academic', path: '/academic', icon: BookOpen },
  { name: 'Accounts', path: '/accounts', icon: Wallet }, // শুধুমাত্র এই একটি মেইন ট্যাব থাকবে
];

export default function MainLayout() {
  const { user, signOut } = useAuthStore();
  const location = useLocation();

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-indigo-900 text-white hidden md:flex flex-col">
        <div className="h-16 flex items-center justify-center border-b border-indigo-800">
          <h1 className="text-xl font-bold tracking-wider">BD School ERP</h1>
        </div>
        
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {sidebarLinks.map((link) => {
            // সাব-পেজে গেলেও যেন মেইন মেনু আইটেমটি একটিভ থাকে তার লজিক
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