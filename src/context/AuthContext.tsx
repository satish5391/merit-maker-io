import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getUserProfile, setUserProfile, type UserProfile } from "@/lib/user-profile";

type User = any;

type AuthModalTab = "signin" | "signup";

type AuthContextValue = {
  user: User | null;
  session: any | null;
  loading: boolean;
  profile: UserProfile | null;
  signInWithPassword: (email: string, password: string) => Promise<{ error: any }>;
  signUpWithPassword: (email: string, password: string) => Promise<{ error: any }>;
  updateProfile: (updates: Partial<UserProfile>) => UserProfile;
  completeDevAuth: (payload: {
    email: string;
    phone?: string;
    name?: string;
    avatarUrl?: string;
    targetExam?: string;
  }) => UserProfile;
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

    const restoreDevSession = () => {
      if (typeof window === "undefined") return;
      const raw = window.localStorage.getItem("rankdon.dev-auth-session");
      if (!raw) return;

      try {
        const parsed = JSON.parse(raw) as {
          id?: string;
          email?: string;
          phone?: string;
          name?: string;
          avatarUrl?: string;
        };
        if (!parsed.email) return;
        const storedProfile = getUserProfile(parsed.email);
        const mergedProfile = {
          ...storedProfile,
          id: parsed.id || storedProfile.id || `RD-${new Date().getFullYear()}-001`,
          email: parsed.email,
          phone: parsed.phone || storedProfile.phone,
          name: parsed.name || storedProfile.name,
          avatarUrl: parsed.avatarUrl || storedProfile.avatarUrl,
        };
        setUser({
          id: mergedProfile.id,
          email: mergedProfile.email,
          phone: mergedProfile.phone,
          name: mergedProfile.name,
        });
        setSession({
          access_token: "dev-token",
          user: { id: mergedProfile.id, email: mergedProfile.email, phone: mergedProfile.phone },
        });
        setProfile(mergedProfile);
      } catch {
        window.localStorage.removeItem("rankdon.dev-auth-session");
      }
    };

    restoreDevSession();

    void supabase.auth.getSession().then(({ data: d }) => {
      if (!mounted) return;
      setSession(d.session ?? null);
      const nextUser = d.session?.user ?? null;
      setUser(nextUser);
      setProfile(
        nextUser
          ? getUserProfile(nextUser.email ?? "")
          : window.localStorage.getItem("rankdon.dev-auth-session")
            ? getUserProfile(
                (JSON.parse(window.localStorage.getItem("rankdon.dev-auth-session") ?? "{}") as any)
                  ?.email ?? "",
              )
            : null,
      );
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      const nextUser = session?.user ?? null;
      setSession(session ?? null);
      setUser(nextUser);
      setProfile(nextUser ? getUserProfile(nextUser.email ?? "") : null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const updateProfile = (updates: Partial<UserProfile>) => {
    const email = user?.email ?? updates.email ?? "";
    const nextProfile = setUserProfile(
      { ...(profile ?? getUserProfile(email)), ...updates, email },
      email,
    );
    setProfile(nextProfile);
    if (user && user.email) {
      window.localStorage.setItem(
        "rankdon.dev-auth-session",
        JSON.stringify({
          id: nextProfile.id,
          email: nextProfile.email,
          phone: nextProfile.phone,
          name: nextProfile.name,
          avatarUrl: nextProfile.avatarUrl,
        }),
      );
    }
    return nextProfile;
  };

  const completeDevAuth = (payload: {
    email: string;
    phone?: string;
    name?: string;
    avatarUrl?: string;
    targetExam?: string;
  }) => {
    const generatedId = `RD-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const baseProfile = getUserProfile(payload.email);
    const nextProfile = setUserProfile(
      {
        ...baseProfile,
        id: baseProfile.id && baseProfile.id !== "RD-2026-001" ? baseProfile.id : generatedId,
        email: payload.email,
        phone: payload.phone || baseProfile.phone,
        name: payload.name || baseProfile.name,
        avatarUrl: payload.avatarUrl || baseProfile.avatarUrl,
        targetExam: payload.targetExam || baseProfile.targetExam,
        joinedDate: new Date().toISOString(),
      },
      payload.email,
    );

    const devUser = {
      id: nextProfile.id,
      email: nextProfile.email,
      phone: nextProfile.phone,
      name: nextProfile.name,
      avatarUrl: nextProfile.avatarUrl,
    };

    if (typeof window !== "undefined") {
      window.localStorage.setItem("rankdon.dev-auth-session", JSON.stringify(devUser));
    }

    setUser(devUser as any);
    setSession({ access_token: "dev-token", user: devUser });
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
    try {
      await supabase.auth.signOut();
    } catch {
      // no-op in dev mode if Supabase is unavailable
    }
    setUser(null);
    setSession(null);
    setProfile(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("rankdon.user-profile");
      window.localStorage.removeItem("rankdon.dev-auth-session");
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    void supabase
      .from("profiles")
      .select("is_banned")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
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
      completeDevAuth,
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
