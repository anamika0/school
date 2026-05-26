// src/features/accounts/ReportsHub.tsx
import { Link } from 'react-router-dom';
import { PieChart, AlertCircle, ArrowRight, FileText, Scale, ArrowLeft } from 'lucide-react';

export default function ReportsHub() {
  const reportCards = [
    {
      name: 'Finance Report',
      description: 'স্কুলের মোট আয়, আজকের কালেকশন এবং চলতি মাসের ট্রানজেকশন রিপোর্ট দেখুন।',
      path: '/accounts/reports/finance',
      icon: PieChart,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:border-indigo-300',
      iconBg: 'bg-indigo-100',
    },
    {
      name: 'Due Report',
      description: 'কোন কোন স্টুডেন্টের কত মাসের বেতন বকেয়া আছে এবং মোট ডিউ অ্যামাউন্টের তালিকা।',
      path: '/accounts/reports/due',
      icon: AlertCircle,
      color: 'bg-red-50 text-red-600 border-red-100 hover:border-red-300',
      iconBg: 'bg-red-100',
    },
    // --- নতুন Profit & Loss কার্ড ---
    {
      name: 'Profit & Loss Summary',
      description: 'সর্বমোট কালেকশন, দৈনিক খরচ এবং স্টাফ স্যালারি হিসাব করে স্কুলের নিট লাভ/ক্ষতি (P&L) দেখুন।',
      path: '/accounts/reports/profit-loss',
      icon: Scale,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:border-emerald-300',
      iconBg: 'bg-emerald-100',
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      
      {/* 🚀 Header with Back Button */}
      <div className="flex items-center gap-4 mb-2">
        <Link to="/accounts" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-gray-600" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="text-indigo-600" size={26} />
            Reports Management
          </h2>
          <p className="text-gray-500 mt-1">সফটওয়্যারের যাবতীয় আর্থিক ও বকেয়া রিপোর্টগুলো এখান থেকে পরিচালনা করুন।</p>
        </div>
      </div>

      {/* রিপোর্ট কার্ড গ্রিড */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        {reportCards.map((report) => {
          const Icon = report.icon;
          return (
            <Link
              key={report.name}
              to={report.path}
              className={`p-6 bg-white border rounded-xl shadow-sm transition-all flex flex-col justify-between group hover:shadow-md ${report.color}`}
            >
              <div className="space-y-4">
                <div className={`p-3 rounded-lg w-fit ${report.iconBg}`}>
                  <Icon size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {report.name}
                  </h3>
                  <p className="text-gray-500 text-sm mt-2 leading-relaxed">
                    {report.description}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm font-bold mt-6 pt-4 border-t border-gray-50 text-indigo-600 w-full justify-end">
                <span>Open Report</span>
                <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}