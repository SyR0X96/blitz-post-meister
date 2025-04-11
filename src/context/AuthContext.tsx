
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

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
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
