import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getUserProfile, setUserProfile, type UserProfile } from '@/lib/user-profile';

type User = any;

type AuthContextValue = {
  user: User | null;
  session: any | null;
  loading: boolean;
  profile: UserProfile | null;
  signInWithPassword: (email: string, password: string) => Promise<{ error: any }>;
  signUpWithPassword: (email: string, password: string) => Promise<{ error: any }>;
  updateProfile: (updates: Partial<UserProfile>) => UserProfile;
  signOut: () => Promise<void>;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  authModalOpen: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    void supabase.auth.getSession().then(({ data: d }) => {
      if (!mounted) return;
      setSession(d.session ?? null);
      const nextUser = d.session?.user ?? null;
      setUser(nextUser);
      setProfile(nextUser ? getUserProfile(nextUser.email ?? '') : null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      const nextUser = session?.user ?? null;
      setSession(session ?? null);
      setUser(nextUser);
      setProfile(nextUser ? getUserProfile(nextUser.email ?? '') : null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const updateProfile = (updates: Partial<UserProfile>) => {
    const email = user?.email ?? updates.email ?? '';
    const nextProfile = setUserProfile({ ...(profile ?? getUserProfile(email)), ...updates, email }, email);
    setProfile(nextProfile);
    return nextProfile;
  };

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
    setProfile(null);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('rankdon.user-profile');
    }
  };

  const openAuthModal = () => setAuthModalOpen(true);
  const closeAuthModal = () => setAuthModalOpen(false);

  const value = useMemo(
    () => ({ user, session, loading, profile, signInWithPassword, signUpWithPassword, updateProfile, signOut, openAuthModal, closeAuthModal, authModalOpen }),
    [user, session, loading, profile, authModalOpen],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
