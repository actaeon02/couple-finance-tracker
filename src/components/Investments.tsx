// Investments.tsx
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, TrendingDown, Plus, CalendarIcon, Edit, Trash2 } from 'lucide-react'; // Added Edit, Trash2
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
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
} from '@/components/ui/alert-dialog'; // Added AlertDialog components
import { useProfile } from '@/hooks/useProfile'; // Added useProfile

// Define the shape of an investment fetched from the DB, plus calculated fields
interface Investment {
  id: string;
  user_id: string;
  name: string; // From DB schema
  category: string; // From DB schema
  investment_amount: number; // From DB schema (initial investment)
  date: string; // From DB schema
  created_at: string;
  updated_at: string;
  currentValue: number; // Calculated client-side
}

const calculateGrowth = (initial: number, startDate: string): number => {
  const start = new Date(startDate);
  const today = new Date();
  const days = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  let amount = initial;
  let baseRate = 0.07 / 365;
  for (let d = 0; d < days; d++) {
    amount *= 1 + (baseRate + d * 0.000001);
  }
  return parseFloat(amount.toFixed(2));
};

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const Investments = () => {
  const { toast } = useToast();
  const { profile, partnerProfile } = useProfile(); // Use the profile hook
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [newInvestment, setNewInvestment] = useState({
    name: '',
    category: '',
    investment_amount: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false); // Renamed for clarity

  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null); // State for editing
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false); // State for edit dialog

  const [isAddDatePopoverOpen, setIsAddDatePopoverOpen] = useState(false); // New state for add investment date popover
  const [isEditDatePopoverOpen, setIsEditDatePopoverOpen] = useState(false); // New state for edit investment date popover

  const [isDeleting, setIsDeleting] = useState(false); // Loading state for delete
  const [isUpdating, setIsUpdating] = useState(false); // Loading state for update

  const investmentCategories = ['Stocks', 'Bonds', 'ETF', 'Mutual Funds', 'Crypto', 'Real Estate', 'Other'];

  const fetchInvestments = async () => {
    const { data, error } = await supabase
      .from('investment')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      toast({ title: 'Error fetching investments', description: error.message, variant: 'destructive' });
      return;
    }

    const enriched: Investment[] = data.map((inv: any) => ({
      id: inv.id,
      user_id: inv.user_id,
      name: inv.name,
      category: inv.category,
      investment_amount: inv.investment_amount,
      date: inv.date,
      created_at: inv.created_at,
      updated_at: inv.updated_at,
      currentValue: calculateGrowth(inv.investment_amount, inv.date)
    }));
    setInvestments(enriched);
  };

  useEffect(() => {
    fetchInvestments();
  }, []);

  const totalInvested = investments.reduce((sum, inv) => sum + inv.investment_amount, 0);
  const totalCurrentValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
  const totalGainLoss = totalCurrentValue - totalInvested;
  const gainLossPercentage = totalInvested ? ((totalGainLoss / totalInvested) * 100).toFixed(2) : '0.00';

  const handleAddInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, category, investment_amount, date } = newInvestment;

    if (!name || !category || !investment_amount) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields (Name, Category, Initial Amount).",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        toast({ title: 'Authentication Error', description: 'User not logged in.', variant: 'destructive' });
        return;
    }

    const { error } = await supabase.from('investment').insert([
      {
        user_id: user.id,
        name,
        category,
        investment_amount: parseFloat(investment_amount),
        date
      }
    ]);

    if (error) {
      toast({ title: "Insert failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Investment Added!", description: `${name} has been added.` });
      setNewInvestment({
        name: '',
        category: '',
        investment_amount: '',
        date: new Date().toISOString().split('T')[0],
      });
      setIsAddDialogOpen(false);
      fetchInvestments();
    }
  };

  const getInvestmentOwnerName = (investment: Investment) => {
    if (investment.user_id === profile?.id) return 'Me';
    if (investment.user_id === partnerProfile?.id) return partnerProfile?.username || 'Partner';
    return 'Unknown';
  };

  const handleEditClick = (investment: Investment) => {
    setEditingInvestment(investment);
    setIsEditDialogOpen(true);
  };

  const handleUpdateInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvestment) return;

    setIsUpdating(true);
    const { id, name, category, investment_amount, date } = editingInvestment;

    if (!name || !category || !investment_amount) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      setIsUpdating(false);
      return;
    }

    const { error } = await supabase.from('investment').update({
      name,
      category,
      investment_amount: parseFloat(investment_amount.toString()), // Ensure it's a number
      date,
    }).eq('id', id);

    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Investment Updated!", description: `${name} has been updated.` });
      setEditingInvestment(null);
      setIsEditDialogOpen(false);
      fetchInvestments();
    }
    setIsUpdating(false);
  };

  const handleDeleteInvestment = async (id: string, name: string) => {
    setIsDeleting(true);
    const { error } = await supabase.from('investment').delete().eq('id', id);

    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Investment Deleted!", description: `${name} has been removed.` });
      fetchInvestments();
    }
    setIsDeleting(false);
  };

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-6 text-gray-100">
      <motion.div initial="hidden" animate="visible" variants={fadeIn} className="flex justify-between items-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent py-1">
          Investment Portfolio
        </h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-500/30 text-white font-semibold py-2 px-4 rounded-lg transition-all hover:scale-105">
              <Plus size={20} />
              Add Investment
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-700 text-gray-100 shadow-2xl shadow-gray-950/70 rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Add New Investment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddInvestment} className="space-y-4">
              <div>
                <Label htmlFor="investment-name" className="text-gray-300 mb-1 block">Investment Name *</Label>
                <Input
                  id="investment-name"
                  placeholder="e.g., Apple Stocks, Bitcoin"
                  value={newInvestment.name}
                  onChange={(e) => setNewInvestment({ ...newInvestment, name: e.target.value })}
                  className="bg-gray-700/50 border-gray-600 text-gray-50 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
              <div>
                <Label htmlFor="category-select" className="text-gray-300 mb-1 block">Category *</Label>
                <Select value={newInvestment.category} onValueChange={(value) => setNewInvestment({ ...newInvestment, category: value })}>
                  <SelectTrigger id="category-select" className="bg-gray-700/50 border-gray-600 text-gray-50 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-gray-100">
                    {investmentCategories.map((cat) => (
                      <SelectItem key={cat} value={cat} className="hover:bg-purple-400 focus:bg-purple-400">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount" className="text-gray-300 mb-1 block">Initial Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="Rp. 0.00"
                    value={newInvestment.investment_amount}
                    onChange={(e) => setNewInvestment({ ...newInvestment, investment_amount: e.target.value })}
                    className="bg-gray-700/50 border-gray-600 text-gray-50 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div>
                  <Label htmlFor="date" className="text-gray-300 mb-1 block">Purchase Date *</Label>
                  <Popover open={isAddDatePopoverOpen} onOpenChange={setIsAddDatePopoverOpen} >
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal bg-gray-700/50 border-gray-600 text-gray-50 hover:bg-purple-400",
                          !newInvestment.date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newInvestment.date ? format(new Date(newInvestment.date), "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700 text-gray-100">
                      <Calendar
                        mode="single"
                        selected={newInvestment.date ? new Date(newInvestment.date) : undefined}
                        onSelect={(date) => {
                          setNewInvestment({...newInvestment, date: date ? format(date, 'yyyy-MM-dd') : ''});
                          setIsAddDatePopoverOpen(false);
                        }}
                        initialFocus
                        className="text-gray-100"
                        classNames={{
                          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                          month: "space-y-4",
                          caption: "flex justify-center pt-1 relative items-center",
                          caption_label: "text-sm font-medium text-gray-100",
                          nav: "space-x-1 flex items-center",
                          nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-gray-100",
                          nav_button_previous: "absolute left-1",
                          nav_button_next: "absolute right-1",
                          table: "w-full border-collapse space-y-1",
                          head_row: "flex",
                          head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                          row: "flex w-full mt-2",
                          cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-range-start)]:rounded-l-md [&:has([aria-selected])]:bg-gray-700 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                          day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-gray-700 hover:text-white rounded-md",
                          day_range_end: "day-range-end",
                          day_selected: "bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white rounded-md",
                          day_today: "bg-gray-800 text-white rounded-md",
                          day_outside: "day-outside text-muted-foreground opacity-50",
                          day_disabled: "text-muted-foreground opacity-50",
                          day_range_middle: "aria-selected:bg-gray-700 aria-selected:text-gray-50",
                          day_hidden: "invisible"
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full h-12 text-lg font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30 text-white transition-all">Add Investment</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Portfolio Summary */}
      <motion.div initial="hidden" animate="visible" variants={fadeIn} transition={{ delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="relative bg-blue-900/30 backdrop-blur-md border border-blue-700 shadow-xl shadow-blue-950/50 hover:shadow-blue-900 transition-shadow text-gray-100 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-blue-800/10 to-transparent pointer-events-none rounded-xl"></div>
          <CardHeader className="relative z-10">
            <CardTitle className="text-blue-200">Total Invested</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-blue-50">Rp. {totalInvested.toLocaleString('id-ID')}</div>
          </CardContent>
        </Card>
        <Card className="relative bg-green-900/30 backdrop-blur-md border border-green-700 shadow-xl shadow-green-950/50 hover:shadow-green-900 transition-shadow text-gray-100 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-green-800/10 to-transparent pointer-events-none rounded-xl"></div>
          <CardHeader className="relative z-10">
            <CardTitle className="text-green-200">Current Value</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-green-50">Rp. {totalCurrentValue.toLocaleString('id-ID')}</div>
          </CardContent>
        </Card>
        <Card className={`relative backdrop-blur-md border shadow-xl ${totalGainLoss >= 0 ? 'bg-green-900/30 border-green-700 shadow-green-950/50 hover:shadow-green-900' : 'bg-red-900/30 border-red-700 shadow-red-950/50 hover:shadow-red-900'} text-gray-100 overflow-hidden`}>
          <div className={`absolute inset-0 bg-gradient-to-br from-transparent via-${totalGainLoss >= 0 ? 'green' : 'red'}-800/10 to-transparent pointer-events-none rounded-xl`}></div>
          <CardHeader className="relative z-10">
            <CardTitle className={totalGainLoss >= 0 ? 'text-green-200' : 'text-red-200'}>Total Gain/Loss</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className={`text-3xl font-bold flex items-center gap-2 ${totalGainLoss >= 0 ? 'text-green-50' : 'text-red-50'}`}>
              {totalGainLoss >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
              Rp. {Math.abs(totalGainLoss).toLocaleString('id-ID')}
            </div>
            <p className={`text-sm ${totalGainLoss >= 0 ? 'text-green-300' : 'text-red-300'}`}>{gainLossPercentage}%</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Investment List */}
      <motion.div initial="hidden" animate="visible" variants={fadeIn} transition={{ delay: 0.2 }}>
        <Card className="relative bg-gray-800/60 backdrop-blur-md border border-gray-700 shadow-xl shadow-gray-950/40 hover:shadow-gray-900 transition-shadow text-gray-100 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-gray-700/10 to-transparent pointer-events-none rounded-xl"></div>
          <CardHeader className="relative z-10">
            <CardTitle className="text-gray-50">Your Investments</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-4">
              {investments.length > 0 ? investments.map((investment) => {
                const gainLoss = investment.currentValue - investment.investment_amount;
                const gainLossPercent = investment.investment_amount ? ((gainLoss / investment.investment_amount) * 100).toFixed(2) : '0.00';

                return (
                  <motion.div
                    key={investment.id}
                    whileHover={{ scale: 1.01 }}
                    className="p-4 border rounded-lg bg-gray-700/50 border-gray-600 shadow-md hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg text-gray-50">{investment.name}</h3>
                        <p className="text-sm text-gray-400">
                          {investment.category} • Added by {getInvestmentOwnerName(investment)} • {new Date(investment.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-gray-50">Rp. {investment.currentValue.toLocaleString('id-ID')}</div>
                        <div className={`text-sm flex items-center justify-end gap-1 ${gainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {gainLoss >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                          Rp. {Math.abs(gainLoss).toLocaleString('id-ID')} ({gainLossPercent}%)
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 flex justify-between items-center">
                      <div className="text-sm text-gray-400">Initial Investment: Rp. {investment.investment_amount.toLocaleString('id-ID')}</div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:bg-gray-700/50 hover:text-gray-100"
                          onClick={() => handleEditClick(investment)}
                        >
                          <Edit size={16} />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:bg-red-700/50 hover:text-red-100"
                              disabled={isDeleting}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-gray-900 border-gray-700 text-gray-100 shadow-2xl shadow-gray-950/70 rounded-xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">Confirm Deletion</AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-300 text-pretty">
                                <p>Are you sure you want to delete the investment "{investment.name}"?</p>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-gray-700 text-gray-200 hover:bg-gray-300 border-gray-600">Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteInvestment(investment.id, investment.name)}
                                className="bg-red-600 hover:bg-red-800 text-white"
                                disabled={isDeleting}
                              >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </motion.div>
                );
              }) : (
                <div className="text-center py-6 text-gray-400">
                  <p className="mb-4">No investments recorded yet. Add your first investment!</p>
                  <Button
                    onClick={() => setIsAddDialogOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 shadow-blue-500/30 text-white"
                  >
                    <Plus size={20} />
                    Add Investment
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Edit Investment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-700 text-gray-100 shadow-2xl shadow-gray-950/70 rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Edit Investment</DialogTitle>
          </DialogHeader>
          {editingInvestment && (
            <form onSubmit={handleUpdateInvestment} className="space-y-4">
              <div>
                <Label htmlFor="edit-investment-name" className="text-gray-300 mb-1 block">Investment Name *</Label>
                <Input
                  id="edit-investment-name"
                  value={editingInvestment.name}
                  onChange={(e) => setEditingInvestment({ ...editingInvestment, name: e.target.value })}
                  className="bg-gray-700/50 border-gray-600 text-gray-50 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
              <div>
                <Label htmlFor="edit-category-select" className="text-gray-300 mb-1 block">Category *</Label>
                <Select value={editingInvestment.category} onValueChange={(value) => setEditingInvestment({ ...editingInvestment, category: value })}>
                  <SelectTrigger id="edit-category-select" className="bg-gray-700/50 border-gray-600 text-gray-50 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-gray-100">
                    {investmentCategories.map((cat) => (
                      <SelectItem key={cat} value={cat} className="hover:bg-purple-400 focus:bg-purple-400">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-amount" className="text-gray-300 mb-1 block">Initial Amount *</Label>
                  <Input
                    id="edit-amount"
                    type="number"
                    value={editingInvestment.investment_amount}
                    onChange={(e) => setEditingInvestment({ ...editingInvestment, investment_amount: parseFloat(e.target.value) })}
                    className="bg-gray-700/50 border-gray-600 text-gray-50 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-date" className="text-gray-300 mb-1 block">Purchase Date *</Label>
                  <Popover open={isEditDatePopoverOpen} onOpenChange={setIsEditDatePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"ghost"}
                        className={cn(
                          "w-full justify-start text-left font-normal bg-gray-700/50 border-gray-600 text-gray-50 hover:bg-purple-400",
                          !editingInvestment.date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editingInvestment.date ? format(new Date(editingInvestment.date), "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700">
                      <Calendar
                        mode="single"
                        selected={editingInvestment.date ? new Date(editingInvestment.date) : undefined}
                        onSelect={(date) => {
                          setEditingInvestment({...editingInvestment, date: date ? format(date, 'yyyy-MM-dd') : ''});
                          setIsEditDatePopoverOpen(false);
                        }}
                        initialFocus
                        className="text-gray-100"
                        classNames={{
                          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                          month: "space-y-4",
                          caption: "flex justify-center pt-1 relative items-center",
                          caption_label: "text-sm font-medium text-gray-100",
                          nav: "space-x-1 flex items-center",
                          nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-gray-100",
                          nav_button_previous: "absolute left-1",
                          nav_button_next: "absolute right-1",
                          table: "w-full border-collapse space-y-1",
                          head_row: "flex",
                          head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                          row: "flex w-full mt-2",
                          cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-range-start)]:rounded-l-md [&:has([aria-selected])]:bg-gray-700 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                          day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-gray-700 hover:text-white rounded-md",
                          day_range_end: "day-range-end",
                          day_selected: "bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white rounded-md",
                          day_today: "bg-gray-800 text-white rounded-md",
                          day_outside: "day-outside text-muted-foreground opacity-50",
                          day_disabled: "text-muted-foreground opacity-50",
                          day_range_middle: "aria-selected:bg-gray-700 aria-selected:text-gray-50",
                          day_hidden: "invisible"
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="bg-gray-700 text-gray-200 hover:bg-gray-600 border-gray-600"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="h-10 text-base font-semibold bg-purple-600 hover:bg-purple-700 shadow-sm shadow-purple-500/30 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Investments;