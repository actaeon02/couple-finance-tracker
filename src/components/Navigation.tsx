import React from 'react';
import { Home, Plus, TrendingUp, Target, BarChart3 } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'add-expense', label: 'Add Expense', icon: Plus },
    { id: 'investments', label: 'Investments', icon: TrendingUp },
    { id: 'budgets', label: 'Budgets', icon: Target },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  return (
    <nav className="bg-gray-800 border-t border-gray-700 shadow-lg shadow-gray-950/50">
      <div className="flex justify-around items-center py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center px-3 py-2 rounded-lg transition-all 
                ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-400 hover:text-gray-100 hover:bg-gray-700'
                }
              `}
            >
              <Icon size={20} />
              <span className="text-xs mt-1">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;