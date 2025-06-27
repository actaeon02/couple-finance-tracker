
-- Add partner linking to profiles table
ALTER TABLE public.profiles ADD COLUMN partner_id UUID REFERENCES auth.users;

-- Create a function to check if two users are partners
CREATE OR REPLACE FUNCTION public.are_partners(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE (id = user1_id AND partner_id = user2_id) 
       OR (id = user2_id AND partner_id = user1_id)
  );
$$;

-- Create a function to get partner's user ID
CREATE OR REPLACE FUNCTION public.get_partner_id(user_id UUID)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT partner_id FROM public.profiles WHERE id = user_id;
$$;

-- Update RLS policies for expenses to allow partner access
DROP POLICY IF EXISTS "Users can view their own expenses" ON public.expenses;
CREATE POLICY "Users can view their own and partner's expenses" 
  ON public.expenses 
  FOR SELECT 
  USING (
    auth.uid() = user_id 
    OR public.are_partners(auth.uid(), user_id)
  );

DROP POLICY IF EXISTS "Users can update their own expenses" ON public.expenses;
CREATE POLICY "Users can update their own and partner's expenses" 
  ON public.expenses 
  FOR UPDATE 
  USING (
    auth.uid() = user_id 
    OR public.are_partners(auth.uid(), user_id)
  );

DROP POLICY IF EXISTS "Users can delete their own expenses" ON public.expenses;
CREATE POLICY "Users can delete their own and partner's expenses" 
  ON public.expenses 
  FOR DELETE 
  USING (
    auth.uid() = user_id 
    OR public.are_partners(auth.uid(), user_id)
  );

-- Update RLS policies for budgets to allow partner access
DROP POLICY IF EXISTS "Users can view their own budgets" ON public.budgets;
CREATE POLICY "Users can view their own and partner's budgets" 
  ON public.budgets 
  FOR SELECT 
  USING (
    auth.uid() = user_id 
    OR public.are_partners(auth.uid(), user_id)
  );

DROP POLICY IF EXISTS "Users can update their own budgets" ON public.budgets;
CREATE POLICY "Users can update their own and partner's budgets" 
  ON public.budgets 
  FOR UPDATE 
  USING (
    auth.uid() = user_id 
    OR public.are_partners(auth.uid(), user_id)
  );

DROP POLICY IF EXISTS "Users can delete their own budgets" ON public.budgets;
CREATE POLICY "Users can delete their own and partner's budgets" 
  ON public.budgets 
  FOR DELETE 
  USING (
    auth.uid() = user_id 
    OR public.are_partners(auth.uid(), user_id)
  );

-- Allow users to view partner profiles
CREATE POLICY "Users can view partner profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (
    auth.uid() = id 
    OR public.are_partners(auth.uid(), id)
  );

-- Create a function to get combined monthly totals for partners
CREATE OR REPLACE FUNCTION public.get_combined_monthly_totals(target_month INTEGER, target_year INTEGER)
RETURNS TABLE (
  total_expenses DECIMAL,
  my_expenses DECIMAL,
  partner_expenses DECIMAL,
  partner_name TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH partner_info AS (
    SELECT p.partner_id, pp.username as partner_name
    FROM public.profiles p
    LEFT JOIN public.profiles pp ON p.partner_id = pp.id
    WHERE p.id = auth.uid()
  )
  SELECT 
    COALESCE(SUM(e.amount), 0) as total_expenses,
    COALESCE(SUM(CASE WHEN e.user_id = auth.uid() THEN e.amount ELSE 0 END), 0) as my_expenses,
    COALESCE(SUM(CASE WHEN e.user_id = pi.partner_id THEN e.amount ELSE 0 END), 0) as partner_expenses,
    pi.partner_name
  FROM partner_info pi
  LEFT JOIN public.expenses e ON (e.user_id = auth.uid() OR e.user_id = pi.partner_id)
    AND EXTRACT(MONTH FROM e.date) = target_month 
    AND EXTRACT(YEAR FROM e.date) = target_year
  GROUP BY pi.partner_name;
$$;
