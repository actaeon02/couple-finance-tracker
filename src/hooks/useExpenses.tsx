import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Expense {
  id: string;
  amount: number;
  category: string;
  who: 'me' | 'partner';
  payment_method: string;
  description?: string;
  date: string;
  user_id: string;
  created_at: string;
}

export const useExpenses = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ['expenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      return data as Expense[];
    },
  });

  // Get current user's expenses vs partner's expenses
  const getCurrentUserExpenses = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return expenses.filter(expense => expense.user_id === user?.id);
  };

  const getPartnerExpenses = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return expenses.filter(expense => expense.user_id !== user?.id);
  };

  const addExpenseMutation = useMutation({
    mutationFn: async (expense: Omit<Expense, 'id' | 'created_at' | 'user_id'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // If 'who' is 'partner', we need to get the partner's user_id
      let targetUserId = user.id;
      
      if (expense.who === 'partner') {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('partner_id')
          .eq('id', user.id)
          .single();

        if (profileError || !profile?.partner_id) {
          throw new Error('Partner not linked. Please link your partner first.');
        }
        
        targetUserId = profile.partner_id;
      }

      const { data, error } = await supabase
        .from('expenses')
        .insert([{ ...expense, user_id: targetUserId }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({
        title: "Expense Added!",
        description: "Your expense has been recorded successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Adding Expense",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: async ({ id, updatedData }: { id: string; updatedData: Partial<Omit<Expense, 'id' | 'created_at'>> }) => {
      // Re-evaluate targetUserId if 'who' is part of updatedData and changes
      let finalUpdatedData: Partial<Omit<Expense, 'id' | 'created_at'>> = { ...updatedData };
      if (updatedData.who) { // If 'who' is being updated
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        let newTargetUserId = user.id;

        if (updatedData.who === 'partner') {
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('partner_id')
                .eq('id', user.id)
                .single();

            if (profileError || !profile?.partner_id) {
                throw new Error('Partner not linked. Please link your partner first.');
            }
            newTargetUserId = profile.partner_id;
        }
        finalUpdatedData.user_id = newTargetUserId; // Update user_id based on new 'who'
      }


      const { data, error } = await supabase
        .from('expenses')
        .update(finalUpdatedData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({
        title: "Expense Updated!",
        description: "Your expense has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Updating Expense",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id; 
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({
        title: "Expense Deleted!",
        description: "The expense has been removed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Deleting Expense",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    expenses,
    isLoading,
    addExpense: addExpenseMutation.mutate,
    isAdding: addExpenseMutation.isPending,
    updateExpense: updateExpenseMutation.mutate,
    isUpdatingExpense: updateExpenseMutation.isPending,
    deleteExpense: deleteExpenseMutation.mutate,
    isDeletingExpense: deleteExpenseMutation.isPending,
    getCurrentUserExpenses,
    getPartnerExpenses,
  };
};