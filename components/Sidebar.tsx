import React from 'react';
import { LayoutDashboard, Gamepad2, Receipt, Wallet, Users, ShoppingBag, Lock } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLock: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLock }) => {
  const menuItems = [
    { 
      id: 'dashboard', 
      label: 'لوحة التحكم', 
      icon: LayoutDashboard, 
      color: 'text-blue-400' 
    },
    { 
      id: 'floor', 
      label: 'الصالة المباشرة', 
      icon: Gamepad2, 
      color: 'text-emerald-400' 
    },
    { 
      id: 'store', 
      label: 'المتجر', 
      icon: ShoppingBag, 
      color: 'text-amber-400' 
    },
    { 
      id: 'credits', 
      label: 'سجل الكريدي', 
      icon: Users, 
      color: 'text-purple-400' 
    },
    { 
      id: 'expenses', 
      label: 'المصروفات', 
      icon: Receipt, 
      color: 'text-red-400' 
    },
    { 
      id: 'reports', 
      label: 'التقرير اليومي', 
      icon: Wallet, 
      color: 'text-yellow-400' 
    },
  ];

  return (
    <aside className="w-64 bg-slate-800 h-screen fixed right-0 top-0 border-l border-slate-700 flex flex-col z-20 shadow-xl">
      <div className="p-6 border-b border-slate-700 flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <Gamepad2 className="text-white w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-white tracking-wide">LARTISTE</h1>
      </div>

      <nav className="flex-1 py-6 space-y-2 px-3">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 group ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20'
                  : 'text-slate-400 hover:bg-slate-700 hover:text-slate-100'
              }`}
            >
              <item.icon 
                className={`w-5 h-5 transition-colors duration-300 ${isActive ? 'text-white' : item.color} ${!isActive && 'group-hover:text-white'}`} 
              />
              <span className="font-semibold text-lg">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700 space-y-4">
        <button 
          onClick={onLock}
          className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white py-2 rounded-lg transition-colors text-sm font-bold border border-slate-600"
        >
           <Lock className="w-4 h-4" /> قفل النظام
        </button>

        <div className="bg-slate-900 rounded-lg p-3 text-center border border-slate-700">
          <p className="text-xs text-slate-500 mb-1">المستخدم الحالي</p>
          <p className="font-bold text-slate-200">أمين الصندوق (Manager)</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;