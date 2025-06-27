import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useExpenses } from '@/hooks/useExpenses';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Trash2, Pencil, CalendarIcon } from 'lucide-react'; // Added CalendarIcon
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter, // Added DialogFooter
} from '@/components/ui/dialog';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'; // Added Popover components
import { Calendar } from '@/components/ui/calendar'; // Added Calendar component
import { cn } from '@/lib/utils'; // Added cn for conditional class joining
import { format } from 'date-fns'; // Added format for date display

const AddExpense = () => {
  const {
    expenses,
    addExpense,
    isAdding,
    updateExpense,
    isUpdatingExpense,
    deleteExpense,
    isDeletingExpense,
  } = useExpenses();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    who: '',
    payment_method: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
  const [isEditDatePopoverOpen, setIsEditDatePopoverOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false); // State for edit dialog visibility
  const [expenseToDeleteId, setExpenseToDeleteId] = useState<string | null>(null); // State for delete confirmation

  const categories = [
    'Food & Dining',
    'Rent',
    'Utilities',
    'Transportation',
    'Laundry',
    'Entertainment',
    'Healthcare',
    'Shopping',
    'Bills',
    'Other'
  ];

  const paymentMethods = [
    'My Credit Card',
    'Partner\'s Credit Card',
    'Debit Card',
    'Cash',
    'Bank Transfer',
    'SPayLater'
  ];

  // Handler for when an expense's Edit button is clicked
  const handleEdit = (expense: typeof expenses[0]) => {
    setFormData({
      amount: expense.amount.toString(),
      category: expense.category,
      who: expense.who,
      payment_method: expense.payment_method,
      date: expense.date,
      description: expense.description || ''
    });
    setEditingExpenseId(expense.id);
    setIsEditDialogOpen(true); // Open the edit dialog
  };

  // Handler for when an expense's Delete button is clicked (prepares for confirmation)
  const handleDeleteClick = (expenseId: string) => {
    setExpenseToDeleteId(expenseId); // Store the ID of the expense to be deleted
  };

  // Handler for confirming deletion in the AlertDialog
  const handleConfirmDelete = () => {
    if (expenseToDeleteId) {
      deleteExpense(expenseToDeleteId);
      // If the deleted expense was currently being edited, clear the form
      if (editingExpenseId === expenseToDeleteId) {
        handleCancelEdit(); // This will clear form and reset editing state
      }
      setExpenseToDeleteId(null); // Clear the ID after deletion
    }
  };

  // Handler to clear the form and exit edit mode/close dialog
  const handleCancelEdit = () => {
    setEditingExpenseId(null);
    setIsEditDialogOpen(false); // Close the edit dialog
    setFormData({
      amount: '',
      category: '',
      who: '',
      payment_method: '',
      date: new Date().toISOString().split('T')[0],
      description: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || !formData.category || !formData.who || !formData.payment_method) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    const expenseData = {
      amount: parseFloat(formData.amount),
      category: formData.category,
      who: formData.who as 'me' | 'partner',
      payment_method: formData.payment_method,
      date: formData.date,
      description: formData.description
    };

    if (editingExpenseId) {
      updateExpense({ id: editingExpenseId, updatedData: expenseData });
      setIsEditDialogOpen(false); // Close dialog on update
    } else {
      addExpense(expenseData);
    }

    // Clear form after successful add/update (handled by onSuccess in useExpenses)
    // Only clear if not already pending a mutation, as onSuccess will reset
    if (!isAdding && !isUpdatingExpense) {
      setFormData({
        amount: '',
        category: '',
        who: '',
        payment_method: '',
        date: new Date().toISOString().split('T')[0],
        description: ''
      });
    }
  };

  const isSubmitting = isAdding || isUpdatingExpense || isDeletingExpense;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-xl mx-auto py-8 px-4 space-y-8"
    >
      <Card className="bg-gray-800 border-gray-700 text-gray-100 shadow-lg relative overflow-hidden rounded-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-gray-700/10 to-transparent pointer-events-none rounded-xl"></div>

        <CardHeader className="relative z-10">
          <CardTitle className="text-2xl text-gray-50">{editingExpenseId ? 'Edit Expense' : 'Add New Expense'}</CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="amount" className="text-gray-300">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="Rp. 0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="bg-gray-700/50 border-gray-600 text-gray-50 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            <div>
              <Label htmlFor="category" className="text-gray-300 mb-1 block">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger className="w-full bg-gray-700/50 border-gray-600 text-gray-50 focus:ring-1 focus:ring-blue-500 transition-colors">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-gray-100">
                  {categories.map((category) => (
                    <SelectItem key={category} value={category} className='hover:bg-indigo-400 focus:bg-indigo-400'>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="who" className="text-gray-300">Who Paid *</Label>
              <Select value={formData.who} onValueChange={(value) => setFormData({ ...formData, who: value })}>
                <SelectTrigger className="w-full bg-gray-700/50 border-gray-600 text-gray-50 focus:ring-1 focus:ring-blue-500 transition-colors">
                  <SelectValue placeholder="Select who paid" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-gray-100">
                  <SelectItem value="me" className='hover:bg-indigo-400 focus:bg-indigo-400'>Me</SelectItem>
                  <SelectItem value="partner" className='hover:bg-indigo-400 focus:bg-indigo-400'>Partner</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="payment_method" className="text-gray-300">Payment Method *</Label>
              <Select value={formData.payment_method} onValueChange={(value) => setFormData({ ...formData, payment_method: value })}>
                <SelectTrigger className="w-full bg-gray-700/50 border-gray-600 text-gray-50 focus:ring-1 focus:ring-blue-500 transition-colors">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-gray-100">
                  {paymentMethods.map((method) => (
                    <SelectItem key={method} value={method} className='hover:bg-indigo-400 focus:bg-indigo-400'>{method}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date" className="text-gray-300">Date</Label>
              <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal bg-gray-700/50 border-gray-600 text-gray-50 hover:bg-indigo-400",
                      !formData.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? format(new Date(formData.date), "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700 text-gray-100">
                  <Calendar
                    mode="single"
                    selected={formData.date ? new Date(formData.date) : undefined}
                    onSelect={(date) => {
                      setFormData({ ...formData, date: format(date, 'yyyy-MM-dd') });
                      setIsDatePopoverOpen(false);
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
                      day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-gray-600 hover:text-white rounded-md",
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

            <div>
              <Label htmlFor="description" className="text-gray-300">Description (Optional)</Label>
              <Input
                id="description"
                type="text"
                placeholder="e.g., Dinner with friends"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-gray-700/50 border-gray-600 text-gray-50 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-lg font-bold bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/30 text-white transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {editingExpenseId ? (isUpdatingExpense ? 'Updating...' : 'Update Expense') : (isAdding ? 'Adding...' : 'Add Expense')}
            </Button>
            {editingExpenseId && (
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelEdit}
                className="w-full h-12 text-lg font-bold mt-2 bg-gray-700 border-gray-600 text-gray-50 hover:bg-gray-600 hover:text-white"
                disabled={isSubmitting}
              >
                Cancel Edit
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700 text-gray-100 shadow-lg relative overflow-hidden rounded-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-gray-700/10 to-transparent pointer-events-none rounded-xl"></div>

        <CardHeader className="relative z-10">
          <CardTitle className="text-xl text-gray-50">Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="space-y-3">
            {expenses.slice(0, 3).map((expense) => (
              <div
                key={expense.id}
                className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg border border-gray-600 shadow-sm text-gray-100"
              >
                <div>
                  <span className="font-medium text-gray-50">{expense.category}</span> -
                  <span className="text-gray-300"> {expense.who === 'me' ? 'Me' : 'Partner'}</span>
                  <p className="text-xs text-gray-400">{new Date(expense.date).toLocaleDateString()}</p>
                </div>
                <span className="font-bold text-lg text-gray-50">Rp. {expense.amount.toLocaleString('id-ID')}</span>
                <div className="flex items-center gap-2">
                  {/* Edit Dialog Trigger */}
                  <Dialog open={isEditDialogOpen && editingExpenseId === expense.id} onOpenChange={setIsEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(expense)}
                        className="text-gray-400 hover:text-blue-400"
                        disabled={isSubmitting}
                      >
                        <Pencil size={18} />
                      </Button>
                    </DialogTrigger>
                    {isEditDialogOpen && editingExpenseId === expense.id && ( // Only render content if dialog is open and this expense is being edited
                      <DialogContent className="sm:max-w-[425px] bg-gray-800 border-gray-700 text-gray-100">
                        <DialogHeader>
                          <DialogTitle className="text-gray-50">Edit Expense</DialogTitle>
                        </DialogHeader>
                        {/* The form content will be here - you can copy it from above or create a separate component */}
                        <form onSubmit={handleSubmit} className="space-y-4 py-4">
                          {/* Replicated form fields for the dialog */}
                          <div>
                            <Label htmlFor="dialog-amount" className="text-gray-300">Amount *</Label>
                            <Input
                              id="dialog-amount"
                              type="number"
                              step="0.01"
                              placeholder="Rp. 0.00"
                              value={formData.amount}
                              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                              className="bg-gray-700/50 border-gray-600 text-gray-50 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </div>
                          <div>
                            <Label htmlFor="dialog-category" className="text-gray-300">Category *</Label>
                            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                              <SelectTrigger id="dialog-category" className="w-full bg-gray-700/50 border-gray-600 text-gray-50 focus:ring-1 focus:ring-blue-500 transition-colors">
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-800 border-gray-700 text-gray-100">
                                {categories.map((category) => (
                                  <SelectItem key={category} value={category} className='hover:bg-indigo-400 focus:bg-indigo-400'>{category}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="dialog-who" className="text-gray-300">Who Paid *</Label>
                            <Select value={formData.who} onValueChange={(value) => setFormData({ ...formData, who: value })}>
                              <SelectTrigger id="dialog-who" className="w-full bg-gray-700/50 border-gray-600 text-gray-50 focus:ring-1 focus:ring-blue-500 transition-colors">
                                <SelectValue placeholder="Select who paid" />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-800 border-gray-700 text-gray-100">
                                <SelectItem value="me" className='hover:bg-indigo-400 focus:bg-indigo-400'>Me</SelectItem>
                                <SelectItem value="partner" className='hover:bg-indigo-400 focus:bg-indigo-400'>Partner</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="dialog-payment_method" className="text-gray-300">Payment Method *</Label>
                            <Select value={formData.payment_method} onValueChange={(value) => setFormData({ ...formData, payment_method: value })}>
                              <SelectTrigger id="dialog-payment_method" className="w-full bg-gray-700/50 border-gray-600 text-gray-50 focus:ring-1 focus:ring-blue-500 transition-colors">
                                <SelectValue placeholder="Select payment method" />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-800 border-gray-700 text-gray-100">
                                {paymentMethods.map((method) => (
                                  <SelectItem key={method} value={method} className='hover:bg-indigo-400 focus:bg-indigo-400'>{method}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="dialog-date" className="text-gray-300">Date</Label>
                            <Popover open={isEditDatePopoverOpen} onOpenChange={setIsEditDatePopoverOpen}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full justify-start text-left font-normal bg-gray-700 border-gray-600 text-gray-50 hover:bg-indigo-300",
                                    !formData.date && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {formData.date ? format(new Date(formData.date), "PPP") : <span>Pick a date</span>}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700 text-gray-100">
                                <Calendar
                                  mode="single"
                                  selected={formData.date ? new Date(formData.date) : undefined}
                                  onSelect={(date) => {
                                    if (date) {
                                      setFormData({ ...formData, date: format(date, 'yyyy-MM-dd') });
                                      setIsEditDatePopoverOpen(false);  
                                    }
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
                          <div>
                            <Label htmlFor="dialog-description" className="text-gray-300">Description (Optional)</Label>
                            <Input
                              id="dialog-description"
                              type="text"
                              placeholder="e.g., Dinner with friends"
                              value={formData.description}
                              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                              className="bg-gray-700/50 border-gray-600 text-gray-50 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                            />
                          </div>
                          <DialogFooter>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleCancelEdit} // Use handleCancelEdit to close and reset
                              className="bg-gray-700 text-gray-200 hover:bg-gray-600 border-gray-600"
                              disabled={isSubmitting}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              className="h-10 text-base font-semibold bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/30 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={isSubmitting}
                            >
                              {isUpdatingExpense ? 'Saving...' : 'Save Changes'}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    )}
                  </Dialog>

                  {/* Delete AlertDialog Trigger */}
                  <AlertDialog open={expenseToDeleteId === expense.id} onOpenChange={(open) => !open && setExpenseToDeleteId(null)}>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(expense.id)}
                        className="text-red-400 hover:text-gray-200 hover:bg-red-800"
                        disabled={isSubmitting}
                      >
                        <Trash2 size={18} />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-gray-800 border-gray-700 text-gray-100">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">Confirm Deletion</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-300 text-pretty">
                          <p>Are you sure you want to delete the expense "{expense.description}"?</p>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-gray-700 text-gray-200 hover:bg-gray-600 border-gray-600">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleConfirmDelete}
                          className="bg-red-600 text-white hover:bg-red-700"
                        >
                          {isDeletingExpense ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
            {expenses.length === 0 && (
              <p className="text-gray-400 text-center py-4">No expenses recorded yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AddExpense;