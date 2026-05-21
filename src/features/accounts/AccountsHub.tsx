// src/features/accounts/AccountsHub.tsx
import { Link } from 'react-router-dom';
import { Wallet, FileText, ArrowRight, Receipt, Banknote,Settings } from 'lucide-react'; // Banknote যোগ করা হলো

export default function AccountsHub() {
  const accountModules = [
    {
      name: 'Collect Fee',
      description: 'স্টুডেন্ট সার্চ করে তাদের মাসিক বেতন, ভর্তি ফি বা অন্যান্য ফি জমা নিন এবং অটোমেটিক মানি রিসিট প্রিন্ট করুন।',
      path: '/accounts/collect',
      icon: Wallet,
      color: 'bg-green-50 text-green-600 border-green-100 hover:border-green-300',
      iconBg: 'bg-green-100',
    },
    {
      name: 'Expense Tracking',
      description: 'স্কুলের দৈনন্দিন খরচ এন্ট্রি করুন এবং ভাউচার মেইনটেইন করে মাসিক খরচের রিপোর্ট দেখুন।',
      path: '/accounts/expenses',
      icon: Receipt,
      color: 'bg-red-50 text-red-600 border-red-100 hover:border-red-300',
      iconBg: 'bg-red-100',
    },
    // --- নতুন Payroll কার্ডটি যোগ করা হলো ---
    {
      name: 'Payroll / Staff Salary',
      description: 'শিক্ষক ও স্টাফদের মাসিক বেতন, ভাতা ও কর্তন হিসাব করে পে-স্লিপ জেনারেট করুন।',
      path: '/accounts/payroll',
      icon: Banknote,
      color: 'bg-teal-50 text-teal-600 border-teal-100 hover:border-teal-300',
      iconBg: 'bg-teal-100',
    },
    {
      name: 'Reports Management',
      description: 'স্কুলের ফাইন্যান্সিয়াল ট্রানজেকশন রিপোর্ট এবং স্টুডেন্টদের বকেয়া বা ডিউ রিপোর্টের কেন্দ্রীয় হাব।',
      path: '/accounts/reports',
      icon: FileText,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:border-indigo-300',
      iconBg: 'bg-indigo-100',
    },
    {
      name: 'Fee Setup & Config',
      description: 'প্রতিটি ক্লাসের জন্য মাসিক বেতন, ভর্তি ফি, পরীক্ষার ফি সহ যাবতীয় ফি-এর পরিমাণ নির্দিষ্ট করুন।',
      path: '/accounts/fee-setup',
      icon: Settings,
      color: 'bg-orange-50 text-orange-600 border-orange-100 hover:border-orange-300',
      iconBg: 'bg-orange-100',
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Wallet className="text-indigo-600" size={26} />
          Accounts Management
        </h2>
        <p className="text-gray-500 mt-1">ফি কালেকশন এবং সমস্ত আর্থিক হিসাবনিকাশ এখান থেকে পরিচালনা করুন।</p>
      </div>

      {/* মডিউল কার্ড গ্রিড (৪টি কার্ডের জন্য grid-cols-2 সবচেয়ে ভালো মানায়) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        {accountModules.map((mod) => {
          const Icon = mod.icon;
          return (
            <Link
              key={mod.name}
              to={mod.path}
              className={`p-6 bg-white border rounded-xl shadow-sm transition-all flex flex-col justify-between group hover:shadow-md ${mod.color}`}
            >
              <div className="space-y-4">
                <div className={`p-3 rounded-lg w-fit ${mod.iconBg}`}>
                  <Icon size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {mod.name}
                  </h3>
                  <p className="text-gray-500 text-sm mt-2 leading-relaxed">
                    {mod.description}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm font-bold mt-6 pt-4 border-t border-gray-50 text-indigo-600 w-full justify-end">
                <span>Open Module</span>
                <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}