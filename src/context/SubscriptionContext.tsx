
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
  const isSubscribed = subscription !== null;
  
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
      // Using a more generic approach with type assertion
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price', { ascending: true }) as { 
          data: SubscriptionPlan[] | null; 
          error: any; 
        };
      
      if (error) {
        throw error;
      }
      
      setPlans(data || []);
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
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data.hasActiveSubscription) {
        setSubscription(data.subscription);
        setUsage(data.usage);
      } else {
        setSubscription(null);
        setUsage(data.usage || null);
      }
    } catch (error: any) {
      console.error('Error checking subscription:', error);
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
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { planId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (!data || !data.url) throw new Error('Keine Checkout-URL erhalten');
      
      return data.url;
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      toast.error('Fehler beim Erstellen der Zahlungssitzung');
      return null;
    }
  };

  const refreshSubscription = async () => {
    await checkSubscription();
  };

  useEffect(() => {
    loadPlans();
  }, []);

  useEffect(() => {
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
