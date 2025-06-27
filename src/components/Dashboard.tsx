import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress'; // Ensure this component supports `indicatorClassName`
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, DollarSign, User, Users, ArrowRight, Plus } from 'lucide-react';
import { Expense, useExpenses } from '@/hooks/useExpenses';
import { useBudgets } from '@/hooks/useBudgets';
import { useProfile } from '@/hooks/useProfile';
import { motion } from 'framer-motion';

interface DashboardProps {
  onTabChange: (tab: string) => void;
}

// Define a simple fadeIn variant for framer-motion animations
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const Dashboard = ({ onTabChange }: DashboardProps) => {
  const { expenses } = useExpenses();
  const { budgets, getCombinedBudgets } = useBudgets();
  const { profile, partnerProfile } = useProfile();

  // Calculate current month's data
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  
  const currentMonthExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate.getMonth() + 1 === currentMonth && 
           expenseDate.getFullYear() === currentYear;
  });

  const totalExpenses = currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  // Calculate expenses by actual user, not by "who" field
  const myExpenses = currentMonthExpenses
    .filter(expense => expense.user_id === profile?.id)
    .reduce((sum, expense) => sum + expense.amount, 0);
  
  const partnerExpenses = currentMonthExpenses
    .filter(expense => expense.user_id === profile?.partner_id)
    .reduce((sum, expense) => sum + expense.amount, 0);

  const combinedBudgets = getCombinedBudgets();
  const totalBudget = Object.values(combinedBudgets).reduce((sum, budget) => sum + budget.amount, 0);
  const budgetUsed = totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0;
  const remainingBudget = totalBudget - totalExpenses;

  // Group expenses by category for budget overview
  const expensesByCategory = currentMonthExpenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const recentExpenses = [...expenses].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  ).slice(0, 3); // Get only the 3 most recent expenses

  const getExpenseOwnerName = (expense: Expense) => {
    if (expense.user_id === profile?.id) {
      return 'Me';
    } else if (expense.user_id === profile?.partner_id) {
      return partnerProfile?.username || 'Partner';
    }
    return 'Unknown';
  };

  return (
    // Main container background for dark theme
    <div className="space-y-6 p-4 max-w-6xl mx-auto bg-gray-900 text-gray-100">
      {/* Header with animated greeting */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="text-center mb-8"
      >
        {/* Text color adjusted for dark theme with vibrant gradient */}
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          {profile?.partner_id ? 'Our Finance Dashboard' : 'Your Finance Dashboard'}
        </h1>
        {/* Muted text color adjusted */}
        <p className="text-gray-400 text-lg">
          {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
        {profile?.partner_id && (
          // Background and text color for linked status adjusted
          <div className="inline-flex items-center mt-2 px-4 py-1.5 rounded-full bg-green-900/60 text-green-300 text-sm border border-green-700">
            <Users size={16} className="mr-1.5" />
            Linked with {partnerProfile?.username || 'Partner'}
          </div>
        )}
      </motion.div>

      {/* Partner Link Prompt */}
      {!profile?.partner_id && (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ delay: 0.1 }}
        >
          {/* Card background, border, and shadow adjusted for dark theme with a subtle glass effect */}
          <Card className="relative bg-blue-950/30 backdrop-blur-md border border-blue-900 shadow-2xl shadow-blue-950/50 hover:shadow-blue-900 transition-shadow text-gray-100 overflow-hidden">
            {/* Subtle inner glow/overlay for depth */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-blue-800/10 to-transparent pointer-events-none rounded-xl"></div>
            <CardContent className="flex flex-col items-center py-6 gap-4 text-center relative z-10">
              <div className="text-center">
                {/* Badge background and text adjusted for frosted look */}
                <div className="inline-flex items-center mb-3 px-3 py-1 rounded-full bg-blue-900/40 backdrop-blur-sm text-white text-sm border border-blue-700">
                  <Users size={16} className="mr-1.5" />
                  Partner Connect
                </div>
                {/* Text colors adjusted */}
                <h3 className="font-semibold text-white text-xl mb-1">Link with Your Partner</h3>
                <p className="text-white max-w-md">
                  Combine finances for better money management together and unlock shared insights.
                </p>
              </div>
              {/* Button with glowing effect */}
              <Button 
                onClick={() => onTabChange('settings')} 
                className="bg-transparent text-white font-semibold border border-blue-500 transition-all hover:bg-blue-600 hover:border-transparent hover:shadow-lg hover:shadow-blue-500/50 mt-4 w-full md:w-auto px-8 py-3 rounded-full"
              >
                Connect Now
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Quick Stats with staggered animation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            title: "Monthly Budget",
            value: totalBudget,
            description: "Total allocated",
            icon: <TrendingUp className="h-5 w-5" />, // Icon size remains good
            iconBg: "bg-green-900/40 border-green-700 text-green-400", // Icon container
            border: "border-green-700", // Card border
            valueText: "text-green-300", // Value text color
            descriptionText: "text-green-400" // Description text color
          },
          {
            title: "Monthly Expenses",
            value: totalExpenses,
            description: `${budgetUsed.toFixed(1)}% of budget used`,
            icon: <TrendingDown className="h-5 w-5" />,
            iconBg: "bg-red-900/40 border-red-700 text-red-400",
            border: "border-red-700",
            valueText: "text-red-300",
            descriptionText: "text-red-400"
          },
          {
            title: "Remaining Budget",
            value: remainingBudget,
            description: "Available to spend",
            icon: <DollarSign className="h-5 w-5" />,
            iconBg: "bg-blue-900/40 border-blue-700 text-blue-400",
            border: "border-blue-700",
            valueText: "text-blue-300",
            descriptionText: "text-blue-400"
          }
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ delay: 0.2 + index * 0.1 }}
          >
            {/* Card background and border adjusted for dark theme, subtle shadow/glow */}
            <Card className={`relative bg-gray-800/60 backdrop-blur-sm ${stat.border} shadow-xl shadow-gray-950/40 hover:shadow-gray-900 transition-shadow text-gray-100 overflow-hidden`}> 
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-gray-700/10 to-transparent pointer-events-none rounded-xl"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className={`text-md font-medium text-gray-300`}>{stat.title}</CardTitle>
                {/* Icon container with border and background adjusted */}
                <div className={`p-2 rounded-full border ${stat.iconBg}`}>
                  {stat.icon}
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold mb-1 text-gray-50"> {/* Value text color adjusted */}
                  Rp. {stat.value.toLocaleString('id-ID')}
                </div>
                <p className={`text-sm ${stat.descriptionText}`}>{stat.description}</p> {/* Description text color adjusted */}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Individual Expenses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ delay: 0.4 }}
        >
          {/* Card background and border adjusted */}
          <Card className="relative bg-gray-800/60 backdrop-blur-sm border-blue-700 shadow-xl shadow-blue-950/40 hover:shadow-blue-900 transition-shadow text-gray-100 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-blue-800/10 to-transparent pointer-events-none rounded-xl"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-3 text-gray-50"> {/* Title text color adjusted */}
                {/* Icon background and color adjusted */}
                <div className="p-2 rounded-full bg-blue-900/40 border border-blue-700 text-blue-300">
                  <User size={18} />
                </div>
                <span>My Expenses</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold mb-3 text-gray-50">Rp. {myExpenses.toLocaleString('id-ID')}</div> {/* Value text color adjusted */}
              <div className="flex items-center gap-3 mb-2">
                {/* Progress bar background and indicator color adjusted */}
                <Progress 
                  value={totalExpenses > 0 ? (myExpenses / totalExpenses) * 100 : 0} 
                  className="h-2 bg-blue-900" // This controls the track color
                  indicatorClassName="bg-blue-500 shadow-blue-500/50" // This controls the filled part color with glow
                />
                <span className="text-sm font-medium text-gray-300"> {/* Percentage text color adjusted */}
                  {totalExpenses > 0 ? ((myExpenses / totalExpenses) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <p className="text-sm text-gray-400"> {/* Muted text color adjusted */}
                of total expenses
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ delay: 0.5 }}
        >
          {/* Card background and border adjusted */}
          <Card className="relative bg-gray-800/60 backdrop-blur-sm border-pink-700 shadow-xl shadow-pink-950/40 hover:shadow-pink-900 transition-shadow text-gray-100 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-pink-800/10 to-transparent pointer-events-none rounded-xl"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-3 text-gray-50"> {/* Title text color adjusted */}
                {/* Icon background and color adjusted */}
                <div className="p-2 rounded-full bg-pink-900/40 border border-pink-700 text-pink-300">
                  <User size={18} />
                </div>
                <span>{partnerProfile?.username || 'Partner'}'s Expenses</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold mb-3 text-gray-50">Rp. {partnerExpenses.toLocaleString('id-ID')}</div> {/* Value text color adjusted */}
              <div className="flex items-center gap-3 mb-2">
                {/* Progress bar background and indicator color adjusted */}
                <Progress 
                  value={totalExpenses > 0 ? (partnerExpenses / totalExpenses) * 100 : 0} 
                  className="h-2 bg-pink-900" // This controls the track color
                  indicatorClassName="bg-pink-500 shadow-pink-500/50" // This controls the filled part color with glow
                />
                <span className="text-sm font-medium text-gray-300"> {/* Percentage text color adjusted */}
                  {totalExpenses > 0 ? ((partnerExpenses / totalExpenses) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <p className="text-sm text-gray-400"> {/* Muted text color adjusted */}
                of total expenses
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Budget Overview */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        transition={{ delay: 0.6 }}
      >
        {/* Card background and text adjusted */}
        <Card className="relative bg-gray-800/60 backdrop-blur-sm border border-gray-700 shadow-xl shadow-gray-950/40 hover:shadow-gray-900 transition-shadow text-gray-100 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-gray-700/10 to-transparent pointer-events-none rounded-xl"></div>
          <CardHeader className="relative z-10">
            <div className="flex justify-between items-center">
              <CardTitle className="text-gray-50">Budget Overview</CardTitle> {/* Title color adjusted */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onTabChange('budgets')}
                className="text-blue-400 hover:bg-blue-300 flex items-center gap-1" // Button text and hover adjusted
              >
                View All <ArrowRight size={16} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-5">
              {Object.entries(combinedBudgets).map(([category, budgetInfo]) => {
                const spent = expensesByCategory[category] || 0;
                const percentage = budgetInfo.amount > 0 ? (spent / budgetInfo.amount) * 100 : 0;
                
                return (
                  <div key={category} className="group">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-medium text-gray-300">{category}</span> {/* Category text adjusted */}
                      <span className="text-sm text-gray-400"> {/* Amount text adjusted */}
                        Rp. {spent.toLocaleString('id-ID')} / Rp. {budgetInfo.amount.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Progress bar background and indicator color logic adjusted for dark with glow */}
                      <Progress 
                        value={Math.min(percentage, 100)} 
                        className={`h-2 ${percentage > 100 ? 'bg-red-900' : 'bg-green-800'}`}
                        indicatorClassName={`h-2 ${percentage > 100 ? 'bg-red-400 shadow-red-500/50' : 'bg-green-500 shadow-green-700'}`}
                      />
                      <span className={`text-sm font-medium ${
                        percentage > 100 ? 'text-red-400' : 'text-green-400'
                      }`}>
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <p className="text-xs text-gray-500"> {/* Muted text adjusted */}
                        Combined from {budgetInfo.budgets.length} budget{budgetInfo.budgets.length !== 1 ? 's' : ''}
                      </p>
                      {percentage > 100 && (
                        <p className="text-xs text-red-400"> {/* Over budget text adjusted */}
                          Over by Rp. {(spent - budgetInfo.amount).toLocaleString('id-ID')}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              {Object.keys(combinedBudgets).length === 0 && (
                <div className="text-center py-6">
                  <p className="text-gray-400 mb-4"> {/* Muted text adjusted */}
                    No budgets set up yet. Start managing your finances better!
                  </p>
                  <Button 
                    onClick={() => onTabChange('budgets')} 
                    className="gap-1 bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/30 text-white" // Button colors adjusted
                  >
                    <Plus size={16} /> Create Budget
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Expenses */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        transition={{ delay: 0.7 }}
      >
        {/* Card background and text adjusted */}
        <Card className="relative bg-gray-800/60 backdrop-blur-sm border border-gray-700 shadow-xl shadow-gray-950/40 hover:shadow-gray-900 transition-shadow text-gray-100 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-gray-700/10 to-transparent pointer-events-none rounded-xl"></div>
          <CardHeader className="relative z-10">
            <div className="flex justify-between items-center">
              <CardTitle className="text-gray-50">Recent Transactions</CardTitle> {/* Title color adjusted */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onTabChange('add-expense')}
                className="text-blue-400 hover:bg-blue-300 flex items-center gap-1" // Button text and hover adjusted
              >
                View All <ArrowRight size={16} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-3">
              {recentExpenses.map((expense) => (
                <motion.div 
                  key={expense.id}
                  whileHover={{ scale: 1.01, boxShadow: '0 8px 16px rgba(0, 0, 0, 0.4)' }} // Subtle hover effect
                  // Item background and border adjusted for dark theme
                  className="flex justify-between items-center p-4 bg-gray-700 rounded-lg border border-gray-600 shadow-sm"
                >
                  <div>
                    <div className="font-medium flex items-center gap-2 text-gray-50"> {/* Text color adjusted */}
                      {/* User indicator dots adjusted */}
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        expense.user_id === profile?.id ? 'bg-blue-400' : 'bg-pink-400'
                      } shadow-md`} />
                      {expense.category}
                    </div>
                    <div className="text-sm text-gray-400"> {/* Muted text adjusted */}
                      {getExpenseOwnerName(expense)} • {expense.payment_method} • {new Date(expense.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="font-bold text-xl text-gray-50"> {/* Amount text adjusted */}
                    Rp. {expense.amount.toLocaleString('id-ID')}
                  </div>
                </motion.div>
              ))}
              {recentExpenses.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-gray-400 mb-4"> {/* Muted text adjusted */}
                    No expenses recorded yet
                  </p>
                  <Button 
                    onClick={() => onTabChange('add-expense')} 
                    className="gap-1 bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/30 text-white" // Button colors adjusted
                  >
                    <Plus size={16} /> Add Expense
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        transition={{ delay: 0.8 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        {/* Button background, text, and shadow adjusted */}
        <Button 
          onClick={() => onTabChange('add-expense')}
          className="py-6 text-lg w-full gap-2 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          size="lg"
        >
          <Plus size={20} /> Add Expense
        </Button>
        {/* Button background, text, and shadow adjusted */}
        <Button 
          onClick={() => onTabChange('investments')}
          variant="outline"
          className="py-6 text-lg w-full gap-2 shadow-lg shadow-gray-950/40 hover:shadow-gray-900 bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600 font-semibold"
          size="lg"
        >
          <ArrowRight size={20} /> View Investments
        </Button>
      </motion.div>
    </div>
  );
};

export default Dashboard;