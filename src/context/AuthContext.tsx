import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getDefaultProfile, type UserProfile } from "@/lib/user-profile";
import { isSupabaseUserId } from "@/lib/utils";

type User = any;

type AuthModalTab = "signin" | "signup";

type AuthContextValue = {
  user: User | null;
  session: any | null;
  loading: boolean;
  profile: UserProfile | null;
  signInWithPassword: (email: string, password: string) => Promise<{ error: any }>;
  signUpWithPassword: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ error: any }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<UserProfile>;
  signOut: () => Promise<void>;
  openAuthModal: (mode?: AuthModalTab) => void;
  closeAuthModal: () => void;
  authModalOpen: boolean;
  authModalTab: AuthModalTab;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<AuthModalTab>("signin");

  useEffect(() => {
    let mounted = true;

    void supabase.auth.getSession().then(({ data: d }) => {
      if (!mounted) return;
      setSession(d.session ?? null);
      const nextUser = d.session?.user ?? null;
      setUser(nextUser);
      setProfile(null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setSession(session ?? null);
      setUser(nextUser);
      setProfile(null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user?.id || !isSupabaseUserId(user.id)) return;
    let active = true;

    void (async () => {
      try {
        const { data, error }: { data: Record<string, any> | null; error: Error | null } =
          await (supabase as any)
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();
        if (error) {
          console.warn("Unable to load profile from Supabase:", error);
          return;
        }
          if (!active || !data?.["full_name"]) return;

          const email = user.email ?? "";
          const defaultProfile = getDefaultProfile(email);
          setProfile({
            ...defaultProfile,
            ...data,
            id: user.id,
            email,
            name: data["full_name"],
            full_name: data["full_name"],
            avatarUrl: data["avatar_url"] ?? defaultProfile.avatarUrl,
            joinedDate: data["joined_at"] ?? data["created_at"] ?? defaultProfile.joinedDate,
          });
      } catch (error) {
        console.warn("Unable to load profile from Supabase:", error);
      }
    })();

    return () => {
      active = false;
    };
  }, [user?.email, user?.id]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user?.id || !isSupabaseUserId(user.id)) {
      throw new Error("You must be signed in to update your profile.");
    }
    const email = user?.email ?? updates.email ?? "";
    const updatedName = updates.name ?? updates.full_name;
    const { data, error } = await (supabase as any)
      .from("profiles")
      .upsert({
        id: user.id,
        full_name: updatedName ?? "",
        email,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    const nextProfile = { ...(data as UserProfile), name: data.full_name ?? "", email };
    setProfile(nextProfile);

    return nextProfile;
  };

  const signInWithPassword = async (email: string, password: string) => {
    const res = await supabase.auth.signInWithPassword({ email, password });
    return { error: res.error };
  };

  const signUpWithPassword = async (email: string, password: string, fullName: string) => {
    const res = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
    if (!res.error && res.data.user) {
      const { error } = await (supabase as any).from("profiles").upsert({
        id: res.data.user.id,
        full_name: fullName,
        email,
        updated_at: new Date().toISOString(),
      });
      if (error) return { error };
    }
    return { error: res.error };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
      if (typeof window !== "undefined") {
        for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
          const key = window.localStorage.key(index);
          if (key?.startsWith("sb-")) window.localStorage.removeItem(key);
        }
      }
    }
  };

  useEffect(() => {
    const userId = user?.id;
    if (!userId || !isSupabaseUserId(userId)) return;
    let active = true;

    void (supabase as any)
      .from("profiles")
      .select("is_banned")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }: any) => {
        if (active && data?.is_banned) {
          window.alert("Your account has been suspended by the administrator.");
          void signOut();
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [user?.id]);

  const openAuthModal = (mode: AuthModalTab = "signin") => {
    setAuthModalTab(mode);
    setAuthModalOpen(true);
  };
  const closeAuthModal = () => setAuthModalOpen(false);

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      profile,
      signInWithPassword,
      signUpWithPassword,
      updateProfile,
      signOut,
      openAuthModal,
      closeAuthModal,
      authModalOpen,
      authModalTab,
    }),
    [user, session, loading, profile, authModalOpen, authModalTab],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export default AuthContext;