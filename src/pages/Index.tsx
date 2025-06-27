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
import { ModeToggle } from '@/components/ui/Mode-toggle';

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return <LoadingScreen />;
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

  const userName = user.profile.username;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans tracking-wide transition-colors duration-300">
      <header className="bg-transparent backdrop-blur-lg shadow-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-sm sm:text-lg md:text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">Couple Finance Tracker</h1>
              <p className="text-xs sm:text-sm text-muted-foreground tracking-wider">Managing our finances together</p>
            </div>
            
            <div className="flex items-center space-x-6">
              {/* <ModeToggle /> */}

              <div className="flex flex-col items-end">
                <p className="text-xs sm:text-sm text-foreground whitespace-nowrap">Welcome, {userName}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={signOut} 
                  className="mt-2 border-border bg-transparent px-3 py-1 rounded-md text-sm transition-all hover:bg-accent hover:text-accent-foreground group"
                >
                  <LogOut className="w-4 h-4 mr-1 sm:mr-2 group-hover:text-accent-foreground transition-colors" />
                  <span className="inline text-foreground group-hover:text-accent-foreground">Sign Out</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-20 p-4">
        {renderActiveComponent()}
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-10">
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
};

export default Index;