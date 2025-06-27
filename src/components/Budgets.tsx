import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useBudgets, Budget } from '@/hooks/useBudgets';
import { useExpenses } from '@/hooks/useExpenses';
import { motion } from 'framer-motion';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const Budgets = () => {
  const { budgets, addBudget, isAdding, updateBudget, isUpdatingBudget, deleteBudget, isDeletingBudget } = useBudgets();
  const { expenses } = useExpenses();
  const [newBudget, setNewBudget] = useState({ category: '', budget_amount: '' });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // New state for editing
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Define categories, matching AddExpense.tsx
  const categories = [
    'Food & Dining',
    'Rent',
    'Utilities',
    'Transportation',
    'Entertainment',
    'Healthcare',
    'Shopping',
    'Bills',
    'Other'
  ];

  // Calculate spent amounts for each budget category
  const getSpentAmount = (category: string) => {
    return expenses
      .filter(expense => 
        expense.category === category && 
        new Date(expense.date).getMonth() + 1 === currentMonth &&
        new Date(expense.date).getFullYear() === currentYear
      )
      .reduce((sum, expense) => sum + expense.amount, 0);
  };

  const totalBudget = budgets.reduce((sum, b) => sum + b.budget_amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + getSpentAmount(b.category), 0);

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newBudget.category || !newBudget.budget_amount) {
      // Consider adding a visible error notification here
      return;
    }

    await addBudget({
      category: newBudget.category,
      budget_amount: parseFloat(newBudget.budget_amount),
      month: currentMonth,
      year: currentYear
    });

    setNewBudget({ category: '', budget_amount: '' });
    setIsDialogOpen(false);
  };

  const getBudgetStatus = (spent: number, budget: number) => {
    const percentage = (spent / budget) * 100;
    if (percentage >= 100) return { color: 'text-red-400', status: 'Over Budget', indicatorColor: 'bg-red-500 shadow-red-500/50', trackColor: 'bg-red-900' };
    if (percentage >= 80) return { color: 'text-yellow-400', status: 'Near Limit', indicatorColor: 'bg-yellow-500 shadow-yellow-500/50', trackColor: 'bg-yellow-900' };
    return { color: 'text-green-400', status: 'On Track', indicatorColor: 'bg-green-500 shadow-green-500/50', trackColor: 'bg-green-900' };
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const handleEditClick = (budget: Budget) => {
    setEditingBudget(budget);
    setIsEditDialogOpen(true);
  };

  const handleUpdateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBudget) return;

    if (!editingBudget.category || !editingBudget.budget_amount) {
      // Add validation feedback
      return;
    }

    // Call the updateBudget mutation
    await updateBudget({
      id: editingBudget.id,
      updatedData: {
        category: editingBudget.category,
        budget_amount: parseFloat(editingBudget.budget_amount.toString()), // Ensure number type
      }
    });

    setEditingBudget(null);
    setIsEditDialogOpen(false);
  };

  const handleDeleteBudget = async (id: string) => {
    // Call the deleteBudget mutation
    await deleteBudget(id);
  };

  return (
    // Main container with dark background assumed from Index.tsx
    <div className="p-4 max-w-6xl mx-auto space-y-6 text-gray-100">
      {/* Header with vibrant title and Add Budget button */}
      <motion.div 
        initial="hidden" 
        animate="visible" 
        variants={fadeIn} 
        className="flex justify-between items-center mb-8"
      >
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent py-1">
          Budget Management
        </h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/30 text-white font-semibold py-2 px-4 rounded-lg transition-all hover:scale-105">
              <Plus size={20} />
              Add Budget
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-700 text-gray-100 shadow-2xl shadow-gray-950/70 rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Add New Budget Category</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddBudget} className="space-y-4">
              <div>
                <Label htmlFor="category-select" className="text-gray-300 mb-1 block">Category Name *</Label>
                {/* Changed Input to Select */}
                <Select value={newBudget.category} onValueChange={(value) => setNewBudget({...newBudget, category: value})}>
                  <SelectTrigger id="category-select" className="bg-gray-700/50 border-gray-600 text-gray-50 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-gray-100">
                    {categories.map((category) => (
                      <SelectItem key={category} value={category} className="hover:bg-indigo-400 focus:bg-indigo-400">
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="budget" className="text-gray-300 mb-1 block">Monthly Budget *</Label>
                <Input
                  id="budget"
                  type="number"
                  step="0.01"
                  placeholder="Rp. 0.00"
                  value={newBudget.budget_amount}
                  onChange={(e) => setNewBudget({...newBudget, budget_amount: e.target.value})}
                  className="bg-gray-700/50 border-gray-600 text-gray-50 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-lg font-bold bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/30 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
                disabled={isAdding}
              >
                {isAdding ? 'Adding Budget...' : 'Add Budget'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial="hidden" animate="visible" variants={fadeIn} transition={{ delay: 0.1 }}>
          <Card className="relative bg-blue-900/30 backdrop-blur-md border border-blue-900 shadow-lg shadow-blue-950/50 hover:shadow-blue-900 transition-shadow text-gray-100 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-blue-800/10 to-transparent pointer-events-none rounded-xl"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="text-blue-200">Total Budget</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-blue-50">Rp. {totalBudget.toLocaleString('id-ID')}</div>
              <p className="text-blue-300 text-sm">Monthly allocation</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={fadeIn} transition={{ delay: 0.2 }}>
          <Card className="relative bg-red-900/30 backdrop-blur-md border border-red-900 shadow-lg shadow-red-950/50 hover:shadow-red-900 transition-shadow text-gray-100 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-red-800/10 to-transparent pointer-events-none rounded-xl"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="text-red-200">Total Spent</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-red-50">Rp. {totalSpent.toLocaleString('id-ID')}</div>
              <p className="text-red-300 text-sm">This month</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={fadeIn} transition={{ delay: 0.3 }}>
          <Card className="relative bg-green-900/30 backdrop-blur-md border border-green-900 shadow-lg shadow-green-950/50 hover:shadow-green-900 transition-shadow text-gray-100 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-green-800/10 to-transparent pointer-events-none rounded-xl"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="text-green-200">Remaining</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-green-50">Rp. {(totalBudget - totalSpent).toLocaleString('id-ID')}</div>
              <p className="text-green-300 text-sm">Available to spend</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Overall Progress */}
      {totalBudget > 0 && (
        <motion.div initial="hidden" animate="visible" variants={fadeIn} transition={{ delay: 0.4 }}>
          <Card className="relative bg-gray-800/60 backdrop-blur-md border border-gray-700 shadow-xl shadow-gray-950/40 hover:shadow-gray-900 transition-shadow text-gray-100 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-gray-700/10 to-transparent pointer-events-none rounded-xl"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="text-gray-50">Overall Budget Progress</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-300">
                  <span>Total Spent vs Budget</span>
                  <span>Rp. {totalSpent.toLocaleString('id-ID')} / Rp. {totalBudget.toLocaleString('id-ID')}</span>
                </div>
                <Progress 
                  value={(totalSpent / totalBudget) * 100} 
                  className="h-3 bg-blue-900" // Track color for progress bar
                  indicatorClassName="bg-blue-500 shadow-blue-500/50" // Indicator color with glow
                />
                <p className="text-sm text-gray-400">
                  {((totalSpent / totalBudget) * 100).toFixed(1)}% of monthly budget used
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Budget Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {budgets.map((budget, index) => {
          const spent = getSpentAmount(budget.category);
          const percentage = (spent / budget.budget_amount) * 100;
          const status = getBudgetStatus(spent, budget.budget_amount);
          
          return (
            <motion.div 
              key={budget.id} 
              initial="hidden" 
              animate="visible" 
              variants={fadeIn} 
              transition={{ delay: 0.5 + index * 0.1 }}
            >
              <Card className="relative bg-gray-800/60 backdrop-blur-md border border-gray-700 shadow-xl shadow-gray-950/40 hover:shadow-gray-900 transition-shadow text-gray-100 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-gray-700/10 to-transparent pointer-events-none rounded-xl"></div>
                <CardHeader className="pb-3 relative z-10">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg text-gray-50">{budget.category}</CardTitle>
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:bg-gray-700/50 hover:text-gray-100">
                      <Edit size={16} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-gray-50">Rp. {spent.toLocaleString('id-ID')}</span>
                      <span className="text-gray-400">/ Rp. {budget.budget_amount.toLocaleString('id-ID')}</span>
                    </div>
                    
                    <Progress 
                      value={Math.min(percentage, 100)} 
                      className={`h-3 ${status.trackColor}`}
                      indicatorClassName={status.indicatorColor}
                    />
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className={status.color}>{status.status}</span>
                      <span className="text-gray-400">{percentage.toFixed(1)}% used</span>
                    </div>
                    
                    <div className="text-sm text-gray-400">
                      Remaining: Rp. {Math.max(0, budget.budget_amount - spent).toLocaleString('id-ID')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {budgets.length === 0 && (
        <motion.div initial="hidden" animate="visible" variants={fadeIn} transition={{ delay: 0.6 }}>
          <Card className="relative bg-gray-800/60 backdrop-blur-md border border-gray-700 shadow-xl shadow-gray-950/40 text-gray-100 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-gray-700/10 to-transparent pointer-events-none rounded-xl"></div>
            <CardContent className="text-center py-8 relative z-10">
              <p className="text-gray-400">No budgets set up yet. Add your first budget to get started!</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Budget Tips */}
      <motion.div initial="hidden" animate="visible" variants={fadeIn} transition={{ delay: 0.7 }}>
        <Card className="relative bg-gray-800/60 backdrop-blur-md border border-gray-700 shadow-xl shadow-gray-950/40 text-gray-100 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-gray-700/10 to-transparent pointer-events-none rounded-xl"></div>
          <CardHeader className="relative z-10">
            <CardTitle className="text-xl text-gray-50">Budget Tips</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {/* Tip cards with distinct, slightly transparent backgrounds */}
              <div className="p-4 bg-blue-900/40 rounded-lg border border-blue-700 shadow-md shadow-blue-950/30">
                <h4 className="font-semibold text-blue-300 mb-1">Track Daily</h4>
                <p className="text-blue-400">Log expenses daily to stay on top of your spending habits.</p>
              </div>
              <div className="p-4 bg-green-900/40 rounded-lg border border-green-700 shadow-md shadow-green-950/30">
                <h4 className="font-semibold text-green-300 mb-1">Review Monthly</h4>
                <p className="text-green-400">Adjust budgets based on actual spending patterns.</p>
              </div>
              <div className="p-4 bg-yellow-900/40 rounded-lg border border-yellow-700 shadow-md shadow-yellow-950/30">
                <h4 className="font-semibold text-yellow-300 mb-1">Set Alerts</h4>
                <p className="text-yellow-400">Get notified when you reach 80% of any budget.</p>
              </div>
              <div className="p-4 bg-purple-900/40 rounded-lg border border-purple-700 shadow-md shadow-purple-950/30">
                <h4 className="font-semibold text-purple-300 mb-1">Emergency Fund</h4>
                <p className="text-purple-400">Always allocate 10-20% for unexpected expenses.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Budgets;