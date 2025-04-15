
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  connectionError: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setConnectionError(true);
          toast.error('Verbindungsfehler mit dem Authentifizierungsserver');
        } else {
          setSession(data.session);
          setUser(data.session?.user ?? null);
        }
      } catch (error) {
        console.error('Failed to initialize authentication:', error);
        setConnectionError(true);
        toast.error('Verbindungsfehler mit dem Authentifizierungsserver');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    try {
      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up auth listener:', error);
      setConnectionError(true);
      setLoading(false);
      return () => {};
    }
  }, []);

  // New function to assign free plan to new users
  const assignFreePlanToUser = async (userId: string) => {
    try {
      console.log('Checking for free plan assignment for user:', userId);
      
      // Check if user already has a subscription
      const { data: existingSubscription, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
        
      if (subError) {
        console.error('Error checking existing subscription:', subError);
        return;
      }
      
      // If user already has a subscription, don't assign free plan
      if (existingSubscription) {
        console.log('User already has a subscription, skipping free plan assignment');
        return;
      }
      
      // Find the free plan in subscription_plans table
      const { data: freePlan, error: planError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('name', 'Free')
        .maybeSingle();
        
      if (planError) {
        console.error('Error finding free plan:', planError);
        return;
      }
      
      if (!freePlan) {
        console.error('Free plan not found in database');
        return;
      }
      
      console.log('Found free plan:', freePlan);
      
      // Calculate period end date (30 days from now)
      const currentDate = new Date();
      const endDate = new Date();
      endDate.setDate(currentDate.getDate() + 30);
      
      // Create subscription for the user with free plan
      const { error: createError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          subscription_plan_id: freePlan.id,
          status: 'active',
          current_period_start: currentDate.toISOString(),
          current_period_end: endDate.toISOString()
        });
        
      if (createError) {
        console.error('Error creating free plan subscription:', createError);
        return;
      }
      
      // Create initial usage record with zero count
      const { error: usageError } = await supabase
        .from('user_post_usage')
        .insert({
          user_id: userId,
          count: 0,
          reset_date: endDate.toISOString()
        });
        
      if (usageError) {
        console.error('Error creating initial usage record:', usageError);
        return;
      }
      
      console.log('Successfully assigned free plan to user', userId);
    } catch (error) {
      console.error('Error in assignFreePlanToUser:', error);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      
      // If signup is successful and we have a user, assign free plan
      if (data && data.user) {
        // We need a small delay to make sure the user is created in the database
        setTimeout(() => {
          assignFreePlanToUser(data.user.id);
        }, 1000);
      }
      
      toast.success('Registrierung erfolgreich! Bitte überprüfe deine E-Mails für den Bestätigungslink.');
    } catch (error: any) {
      if (error.message === 'Failed to fetch') {
        toast.error('Verbindungsfehler. Bitte überprüfe deine Internetverbindung.');
      } else {
        toast.error(error.message || 'Fehler bei der Registrierung');
      }
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success('Erfolgreich angemeldet!');
    } catch (error: any) {
      if (error.message === 'Failed to fetch') {
        toast.error('Verbindungsfehler. Bitte überprüfe deine Internetverbindung.');
      } else {
        toast.error(error.message || 'Fehler beim Anmelden');
      }
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Erfolgreich abgemeldet');
    } catch (error: any) {
      if (error.message === 'Failed to fetch') {
        toast.error('Verbindungsfehler. Bitte überprüfe deine Internetverbindung.');
      } else {
        toast.error(error.message || 'Fehler beim Abmelden');
      }
      throw error;
    }
  };

  const value = {
    session,
    user,
    loading,
    signUp,
    signIn,
    signOut,
    connectionError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
