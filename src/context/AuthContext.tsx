import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type User = any;

type AuthContextValue = {
  user: User | null;
  session: any | null;
  loading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<{ error: any }>; 
  signUpWithPassword: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  authModalOpen: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    void supabase.auth.getSession().then(({ data: d }) => {
      if (!mounted) return;
      setSession(d.session ?? null);
      setUser(d.session?.user ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session ?? null);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signInWithPassword = async (email: string, password: string) => {
    const res = await supabase.auth.signInWithPassword({ email, password });
    return { error: res.error };
  };

  const signUpWithPassword = async (email: string, password: string) => {
    const res = await supabase.auth.signUp({ email, password });
    return { error: res.error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const openAuthModal = () => setAuthModalOpen(true);
  const closeAuthModal = () => setAuthModalOpen(false);

  const value = useMemo(
    () => ({ user, session, loading, signInWithPassword, signUpWithPassword, signOut, openAuthModal, closeAuthModal, authModalOpen }),
    [user, session, loading, authModalOpen],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
