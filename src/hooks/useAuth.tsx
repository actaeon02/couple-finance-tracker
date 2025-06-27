import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  username: string | null;
  partner_username: string | null;
  monthly_income: number | null;
  created_at: string;
  updated_at: string;
  partner_id: string | null;
}

interface AuthUserWithProfile extends User {
  profile?: UserProfile | null;
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUserWithProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialCheckComplete, setInitialCheckComplete] = useState(false);

  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      return null;
    }
  };

  const updateUserState = async (supabaseUser: User | null) => {
    if (!supabaseUser) {
      setUser(null);
      return;
    }

    const profile = await fetchUserProfile(supabaseUser.id);
    setUser({ ...supabaseUser, profile });
  };

  useEffect(() => {
    let isMounted = true;

    const handleAuthChange = async (event: string, session: { user: User } | null) => {
      if (!isMounted) return;

      setLoading(true);
      try {
        await updateUserState(session?.user || null);
      } catch (error) {
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // Initial session check
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw error;
        await handleAuthChange('INITIAL_CHECK', session);
      } catch (error) {
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) {
          setLoading(false);
          setInitialCheckComplete(true);
        }
      }
    };

    initializeAuth();

    // Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (initialCheckComplete) {
          handleAuthChange(event, session);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [initialCheckComplete]);

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    signOut,
    isAuthenticated: !!user,
    hasProfile: !!user?.profile
  };
};