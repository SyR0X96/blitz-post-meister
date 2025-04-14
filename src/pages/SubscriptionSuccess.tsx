
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSubscription } from '@/context/SubscriptionContext';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const SubscriptionSuccess = () => {
  const [searchParams] = useSearchParams();
  const { refreshSubscription, isSubscribed } = useSubscription();
  const [isVerifying, setIsVerifying] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const verifySubscription = async () => {
      try {
        console.log('Verifying subscription status...');
        await refreshSubscription();
        
        // Check if subscription was updated successfully
        if (!isSubscribed && retryCount < 3) {
          // If not subscribed yet, we will retry a few times
          console.log(`Subscription not detected yet, retrying... (${retryCount + 1}/3)`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 2000); // Retry after 2 seconds
        } else if (!isSubscribed && retryCount >= 3) {
          // After multiple retries, show an error
          toast.error('Ihr Abonnement konnte nicht verifiziert werden. Bitte kontaktieren Sie den Support.');
          setIsVerifying(false);
        } else {
          // Subscription verified successfully
          toast.success('Ihr Abonnement wurde erfolgreich aktiviert!');
          setIsVerifying(false);
        }
      } catch (error) {
        console.error('Error refreshing subscription status:', error);
        toast.error('Fehler beim Aktualisieren des Abonnementstatus');
        setIsVerifying(false);
      }
    };

    if (isVerifying) {
      verifySubscription();
    }
  }, [refreshSubscription, isSubscribed, retryCount, isVerifying]);

  const handleGoToPostGenerator = () => {
    navigate('/post-generator');
  };

  const handleManualRefresh = async () => {
    setIsVerifying(true);
    setRetryCount(0); // Reset retry count for a fresh attempt
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-orange-500 mb-4" />
        <h1 className="text-xl mb-2">Überprüfe dein Abonnement...</h1>
        <p className="text-muted-foreground mb-4">
          Dies kann einen Moment dauern, während wir deine Zahlung verarbeiten.
        </p>
        {retryCount > 0 && (
          <p className="text-sm text-muted-foreground">
            Versuch {retryCount}/3...
          </p>
        )}
      </div>
    );
  }

  // If verification completed but no subscription detected
  if (!isSubscribed) {
    return (
      <div className="min-h-screen bg-background text-foreground py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto glass-card p-8 rounded-xl text-center">
            <h1 className="text-2xl font-bold mb-4">Abo-Bestätigung ausstehend</h1>
            
            <p className="mb-8 text-muted-foreground">
              Dein Abonnement wird noch verarbeitet. Dies kann einige Minuten dauern.
            </p>
            
            <div className="space-y-4">
              <Button 
                onClick={handleManualRefresh}
                className="w-full bg-orange-500 hover:bg-orange-600"
              >
                Status aktualisieren
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => navigate('/subscriptions')}
                className="w-full"
              >
                Zurück zur Abonnement-Seite
              </Button>
            </div>
          </div>
        </div>
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
