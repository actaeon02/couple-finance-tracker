
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Budget {
  id: string;
  category: string;
  budget_amount: number;
  month: number;
  year: number;
  user_id: string;
  created_at: string;
}

export const useBudgets = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['budgets', currentMonth, currentYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .order('category');

      if (error) throw error;
      return data as Budget[];
    },
  });

  // Get combined budget amounts for the same category from both partners
  const getCombinedBudgets = () => {
    const combined: Record<string, { amount: number; budgets: Budget[] }> = {};
    
    budgets.forEach(budget => {
      if (!combined[budget.category]) {
        combined[budget.category] = { amount: 0, budgets: [] };
      }
      combined[budget.category].amount += budget.budget_amount;
      combined[budget.category].budgets.push(budget);
    });
    
    return combined;
  };

  const addBudgetMutation = useMutation({
    mutationFn: async (budget: Omit<Budget, 'id' | 'created_at' | 'user_id'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('budgets')
        .insert([{ ...budget, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({
        title: "Budget Added!",
        description: "Your budget has been set successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Adding Budget",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateBudgetMutation = useMutation({
    mutationFn: async ({ id, updatedData }: { id: string; updatedData: Partial<Omit<Budget, 'id' | 'created_at' | 'user_id' | 'month' | 'year'>> }) => {
      const { data, error } = await supabase
        .from('budgets')
        .update(updatedData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({
        title: "Budget Updated!",
        description: "Your budget has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Updating Budget",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteBudgetMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({
        title: "Budget Deleted!",
        description: "The budget has been removed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Deleting Budget",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    budgets,
    isLoading,
    addBudget: addBudgetMutation.mutate,
    isAdding: addBudgetMutation.isPending,
    updateBudget: updateBudgetMutation.mutate,
    isUpdatingBudget: updateBudgetMutation.isPending,
    deleteBudget: deleteBudgetMutation.mutate,
    isDeletingBudget: deleteBudgetMutation.isPending,
    getCombinedBudgets,
  };
};
