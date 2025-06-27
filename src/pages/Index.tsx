import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Auth from '@/components/Auth';
import Navigation from '@/components/Navigation';
import Dashboard from '@/components/Dashboard';
import AddExpense from '@/components/AddExpense';
import Investments from '@/components/Investments';
import Budgets from '@/components/Budgets';
import Reports from '@/components/Reports';
import Settings from '@/components/Settings';
import LoadingScreen from '@/components/LoadingScreen';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return <LoadingScreen />
    // return (
    //   <div className="min-h-screen bg-gray-950 flex items-center justify-center">
    //     <div className="text-lg text-gray-100">Loading...</div>
    //   </div>
    // );
  }

  if (!user) {
    return <Auth />;
  }

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onTabChange={setActiveTab} />;
      case 'add-expense':
        return <AddExpense />;
      case 'investments':
        return <Investments />;
      case 'budgets':
        return <Budgets />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onTabChange={setActiveTab} />;
    }
  };

  // Get user's display name
  const userName = user.profile.username;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-900 flex flex-col text-gray-100 font-sans tracking-wide">
      {/* Header */}
      <header className="bg-transparent backdrop-blur-lg shadow-lg shadow-gray-900/40 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-sm sm:text-lg md:text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">Couple Finance Tracker</h1>
              <p className="text-xs sm:text-sm text-gray-400 tracking-wider">Managing our finances together</p>
            </div>
            {/* User Info & Sign Out */}
            <div className="flex flex-col items-end">
              <p className="text-xs sm:text-sm text-gray-300 whitespace-nowrap">Welcome, {userName}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={signOut} 
                className="mt-2 text-cyan-400 border border-cyan-700 bg-transparent px-3 py-1 rounded-md text-sm transition-all hover:bg-cyan-900/30 hover:border-cyan-600 hover:text-white group"
              >
                <LogOut className="w-4 h-4 mr-1 sm:mr-2 group-hover:text-white transition-colors" />
                <span className="inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20">
        {renderActiveComponent()}
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-10">
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
};

export default Index;