
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type SubscriptionPlan = {
  id: string;
  name: string;
  price: number;
  monthly_post_limit: number;
};

export type Subscription = {
  id: string;
  status: string;
  current_period_end: string;
  subscription_plans: SubscriptionPlan;
};

export type Usage = {
  count: number;
  reset_date: string;
};

type SubscriptionContextType = {
  loading: boolean;
  subscription: Subscription | null;
  plans: SubscriptionPlan[];
  usage: Usage | null;
  remainingPosts: number;
  subscribeToNewPlan: (planId: string) => Promise<string | null>;
  refreshSubscription: () => Promise<void>;
  isSubscribed: boolean;
  plansLoading: boolean;
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, session } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);
  const [plansLoading, setPlansLoading] = useState(true);
  // Changed this to check for user existence instead of subscription, since free plan users are also subscribed
  const isSubscribed = user !== null && subscription !== null; 
  
  // Calculate remaining posts based on subscription limit and usage
  const remainingPosts = React.useMemo(() => {
    if (!subscription || !usage) return 0;
    
    // For unlimited plan
    if (subscription.subscription_plans.monthly_post_limit === -1) {
      return Infinity;
    }
    
    // For other plans
    return Math.max(0, subscription.subscription_plans.monthly_post_limit - usage.count);
  }, [subscription, usage]);

  const loadPlans = async () => {
    try {
      setPlansLoading(true);
      console.log('Loading subscription plans...');
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('id, name, price, monthly_post_limit');
      
      if (error) {
        console.error('Error loading plans:', error);
        throw error;
      }
      
      console.log('Plans loaded:', data);
      setPlans(data as SubscriptionPlan[] || []);
    } catch (error: any) {
      console.error('Error loading plans:', error);
      toast.error('Fehler beim Laden der Abonnementpläne');
    } finally {
      setPlansLoading(false);
    }
  };

  const checkSubscription = async () => {
    if (!user || !session) {
      setSubscription(null);
      setUsage(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Checking subscription status...');
      
      // First check if there's a DB-based free plan subscription
      const { data: dbSubscription, error: dbError } = await supabase
        .from('user_subscriptions')
        .select(`
          id, 
          status, 
          current_period_end,
          subscription_plans (
            id, 
            name, 
            price, 
            monthly_post_limit
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();
      
      if (dbError && dbError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
        console.error('Error checking database subscription:', dbError);
      }
      
      // If we found an active subscription in the database
      if (dbSubscription) {
        console.log('Found active subscription in database:', dbSubscription);
        setSubscription(dbSubscription as Subscription);
        
        // Get usage data
        const { data: usageData, error: usageError } = await supabase
          .from('user_post_usage')
          .select('count, reset_date')
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (usageError) {
          console.error('Error fetching usage data:', usageError);
        }
        
        setUsage(usageData || { count: 0, reset_date: new Date().toISOString() });
        setLoading(false);
        return;
      }
      
      // If no DB subscription found, check Stripe subscription via Edge Function
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error checking subscription:', error);
        throw error;
      }

      console.log('Subscription check response:', data);

      if (data.hasActiveSubscription) {
        console.log('Active subscription found:', data.subscription);
        setSubscription(data.subscription);
        setUsage(data.usage);
      } else {
        console.log('No active subscription found');
        setSubscription(null);
        setUsage(data.usage || null);
      }
    } catch (error: any) {
      console.error('Error checking subscription:', error);
      toast.error('Fehler beim Prüfen des Abonnementstatus');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToNewPlan = async (planId: string) => {
    if (!user || !session) {
      toast.error('Bitte melden Sie sich an, um zu abonnieren');
      return null;
    }

    try {
      console.log('Creating checkout for plan:', planId);
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { planId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error creating checkout:', error);
        throw error;
      }
      
      if (!data || !data.url) {
        console.error('No checkout URL received');
        throw new Error('Keine Checkout-URL erhalten');
      }
      
      console.log('Checkout URL created:', data.url);
      return data.url;
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      toast.error('Fehler beim Erstellen der Zahlungssitzung');
      return null;
    }
  };

  const refreshSubscription = async () => {
    console.log('Refreshing subscription status...');
    await checkSubscription();
  };

  useEffect(() => {
    console.log('Loading subscription plans on mount');
    loadPlans();
  }, []);

  useEffect(() => {
    console.log('Checking subscription status on auth change', { user: !!user, session: !!session });
    checkSubscription();
  }, [user, session]);

  const value = {
    loading,
    subscription,
    plans,
    usage,
    remainingPosts,
    subscribeToNewPlan,
    refreshSubscription,
    isSubscribed,
    plansLoading
  };

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
