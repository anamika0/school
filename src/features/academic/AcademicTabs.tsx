// src/features/academic/AcademicTabs.tsx
import { Link, useLocation } from 'react-router-dom';
import { LayoutList, Layers, BookOpen } from 'lucide-react';

export default function AcademicTabs() {
  const location = useLocation();

  const tabs = [
    { name: 'Classes', path: '/academic/classes', icon: LayoutList },
    { name: 'Sections', path: '/academic/sections', icon: Layers },
    { name: 'Subjects', path: '/academic/subjects', icon: BookOpen },
  ];

  return (
    <div className="flex flex-wrap gap-2 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm w-fit mb-6">
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path;
        const Icon = tab.icon;
        
        return (
          <Link
            key={tab.name}
            to={tab.path}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              isActive 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Icon size={18} />
            {tab.name}
          </Link>
        );
      })}
    </div>
  );
}