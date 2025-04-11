
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSubscription } from '@/context/SubscriptionContext';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';

const SubscriptionSuccess = () => {
  const [searchParams] = useSearchParams();
  const { refreshSubscription } = useSubscription();
  const [isVerifying, setIsVerifying] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const verifySubscription = async () => {
      try {
        await refreshSubscription();
      } catch (error) {
        console.error('Error refreshing subscription status:', error);
      } finally {
        setIsVerifying(false);
      }
    };

    verifySubscription();
  }, [refreshSubscription]);

  const handleGoToPostGenerator = () => {
    navigate('/post-generator');
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-orange-500 mb-4" />
        <h1 className="text-xl">Überprüfe dein Abonnement...</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto glass-card p-8 rounded-xl text-center">
          <div className="flex justify-center mb-6">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          
          <h1 className="text-2xl font-bold mb-4">Abonnement erfolgreich!</h1>
          
          <p className="mb-8 text-muted-foreground">
            Vielen Dank für dein Abonnement. Du kannst jetzt die Post Generator Funktion entsprechend deines Plans nutzen.
          </p>
          
          <div className="space-y-4">
            <Button 
              onClick={handleGoToPostGenerator}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              Zum Post Generator
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="w-full"
            >
              Zurück zur Startseite
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionSuccess;
