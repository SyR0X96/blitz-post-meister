
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useSubscription, SubscriptionPlan } from '@/context/SubscriptionContext';
import { Button } from '@/components/ui/button';
import { Check, Loader2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const Subscriptions = () => {
  const { user, loading: authLoading } = useAuth();
  const { plans, subscription, subscribeToNewPlan, loading, plansLoading } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleSubscribe = async () => {
    if (!selectedPlan) return;

    setIsProcessing(true);
    try {
      const checkoutUrl = await subscribeToNewPlan(selectedPlan);
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Function to format price in euros
  const formatPrice = (price: number) => {
    return `${(price / 100).toFixed(2)}€`;
  };
  
  // Function to format post limit
  const formatPostLimit = (limit: number) => {
    return limit === -1 ? 'Unbegrenzt' : limit;
  };

  if (authLoading || plansLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
        <span className="ml-2">Laden...</span>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in effect
  }
  
  // Function to determine if a plan can be subscribed to
  const isPlanSelectable = (plan: SubscriptionPlan) => {
    // Free plan cannot be selected manually through Stripe
    return plan.name !== 'Free'; 
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">Wählen Sie Ihr Abonnement</h1>
          
          {subscription ? (
            <div className="mb-8 p-6 bg-muted rounded-lg">
              <h2 className="text-xl font-semibold mb-2">Ihr aktuelles Abonnement</h2>
              <div className="flex flex-col space-y-2">
                <p><strong>Plan:</strong> {subscription.subscription_plans.name}</p>
                <p><strong>Preis:</strong> {
                  subscription.subscription_plans.price === 0 
                    ? 'Kostenlos' 
                    : `${formatPrice(subscription.subscription_plans.price)} / Monat`
                }</p>
                <p>
                  <strong>Monatliches Post-Limit:</strong> {
                    subscription.subscription_plans.monthly_post_limit === -1 
                      ? 'Unbegrenzt' 
                      : subscription.subscription_plans.monthly_post_limit
                  }
                </p>
              </div>
              <p className="mt-4 text-muted-foreground">
                Um Ihr Abonnement zu ändern, wählen Sie unten einen anderen Plan.
              </p>
            </div>
          ) : null}

          <RadioGroup className="space-y-6" value={selectedPlan || undefined} onValueChange={handleSelectPlan}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {plans.map((plan: SubscriptionPlan) => (
                <div 
                  key={plan.id}
                  className={`
                    relative flex flex-col p-6 bg-card rounded-lg border-2 transition-all
                    ${selectedPlan === plan.id ? 'border-orange-500 shadow-md' : 'border-border'}
                    ${subscription?.subscription_plans.id === plan.id ? 'ring-2 ring-offset-2 ring-orange-500' : ''}
                    ${!isPlanSelectable(plan) ? 'opacity-75' : ''}
                  `}
                >
                  {subscription?.subscription_plans.id === plan.id && (
                    <div className="absolute -top-3 -right-3 bg-orange-500 text-white px-3 py-1 rounded-full text-xs">
                      Aktuell
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    {isPlanSelectable(plan) && (
                      <RadioGroupItem value={plan.id} id={plan.id} className="h-5 w-5" />
                    )}
                  </div>
                  <div className="text-3xl font-bold mb-4">
                    {plan.price === 0 ? (
                      'Kostenlos'
                    ) : (
                      <>
                        {formatPrice(plan.price)}<span className="text-sm font-normal text-muted-foreground"> / Monat</span>
                      </>
                    )}
                  </div>
                  <ul className="space-y-3 mb-6 flex-grow">
                    <li className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-500" /> 
                      <span>{formatPostLimit(plan.monthly_post_limit)} Posts pro Monat</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-500" /> 
                      <span>AI-generierte Posts</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-500" /> 
                      <span>Bildgenerierung</span>
                    </li>
                  </ul>
                  
                  {subscription?.subscription_plans.id === plan.id ? (
                    <Button variant="outline" className="w-full" disabled>
                      Aktiver Plan
                    </Button>
                  ) : !isPlanSelectable(plan) ? (
                    <Button variant="outline" className="w-full" disabled>
                      Automatisch bei Registrierung
                    </Button>
                  ) : (
                    <Button
                      className="w-full bg-orange-500 hover:bg-orange-600"
                      onClick={() => handleSelectPlan(plan.id)}
                    >
                      Auswählen
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </RadioGroup>

          <div className="mt-8 flex justify-center">
            <Button 
              onClick={handleSubscribe} 
              disabled={!selectedPlan || isProcessing}
              className="bg-orange-500 hover:bg-orange-600 px-8 py-6 text-lg"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verarbeitung...
                </>
              ) : (
                'Jetzt abonnieren'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscriptions;
