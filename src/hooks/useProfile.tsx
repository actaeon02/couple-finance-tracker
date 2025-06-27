
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Profile {
  id: string;
  username: string | null;
  partner_username: string | null;
  partner_id: string | null;
  monthly_income: number | null;
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data as Profile;
    },
  });

  const { data: partnerProfile } = useQuery({
    queryKey: ['partnerProfile', profile?.partner_id],
    queryFn: async () => {
      if (!profile?.partner_id) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profile.partner_id)
        .single();

      if (error) throw error;
      return data as Profile;
    },
    enabled: !!profile?.partner_id,
  });

  const linkPartnerMutation = useMutation({
    mutationFn: async (partnerUsername: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Find partner by username
      const { data: partnerData, error: partnerError } = await supabase
        .from('profiles')
        .select('id, username, partner_id')
        .eq('username', partnerUsername)
        .single();

      if (partnerError || !partnerData) {
        throw new Error('Partner not found with that username');
      }

      if (partnerData.partner_id) {
        throw new Error('This user is already linked to another partner');
      }

      // Update both profiles to link them
      const { error: updateError1 } = await supabase
        .from('profiles')
        .update({ partner_id: partnerData.id })
        .eq('id', user.id);

      if (updateError1) throw updateError1;

      const { error: updateError2 } = await supabase
        .from('profiles')
        .update({ partner_id: user.id })
        .eq('id', partnerData.id);

      if (updateError2) throw updateError2;

      return partnerData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['partnerProfile'] });
      toast({
        title: "Partner Linked!",
        description: "You can now see each other's expenses and budgets.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const unlinkPartnerMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !profile?.partner_id) throw new Error('No partner to unlink');

      // Remove partner link from both profiles
      const { error: updateError1 } = await supabase
        .from('profiles')
        .update({ partner_id: null })
        .eq('id', user.id);

      if (updateError1) throw updateError1;

      const { error: updateError2 } = await supabase
        .from('profiles')
        .update({ partner_id: null })
        .eq('id', profile.partner_id);

      if (updateError2) throw updateError2;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['partnerProfile'] });
      toast({
        title: "Partner Unlinked",
        description: "You no longer share financial data.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    profile,
    partnerProfile,
    isLoading,
    linkPartner: linkPartnerMutation.mutate,
    unlinkPartner: unlinkPartnerMutation.mutate,
    isLinking: linkPartnerMutation.isPending,
    isUnlinking: unlinkPartnerMutation.isPending,
  };
};
