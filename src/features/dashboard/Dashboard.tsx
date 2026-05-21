// src/features/dashboard/Dashboard.tsx
import { Users, GraduationCap, Wallet, Activity } from 'lucide-react';

const stats = [
  { name: 'Total Students', value: '1,250', icon: Users, color: 'bg-blue-500' },
  { name: 'Total Teachers', value: '45', icon: GraduationCap, color: 'bg-green-500' },
  { name: 'Monthly Revenue', value: '৳ 4.5L', icon: Wallet, color: 'bg-purple-500' },
  { name: 'Avg. Attendance', value: '92%', icon: Activity, color: 'bg-orange-500' },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-gray-500 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className={`${stat.color} p-4 rounded-lg text-white`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}