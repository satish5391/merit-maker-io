import { Link } from "@tanstack/react-router";
import { Bell, ChevronDown, Gift, GraduationCap, LogOut, Menu, ShieldCheck, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

import { ADMIN_EMAILS } from "@/lib/admin-access";
import { isSupabaseUserId } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";

export default function Header() {
  const auth = useAuth();
  const isAdmin = Boolean(
    auth.user?.email && ADMIN_EMAILS.includes(auth.user.email.trim().toLowerCase()),
  );

  // Resolved full name: checks full_name first, then name, then user_metadata
  const rawResolvedName =
    (auth.profile as any)?.full_name ||
    (auth.profile as any)?.name ||
    auth.user?.user_metadata?.full_name ||
    auth.user?.user_metadata?.name ||
    "";
  const databaseProfileName = String((auth.profile as any)?.full_name ?? "").trim();

  const cachedNameKey = auth.user?.id ? `rankdon_cached_name:${auth.user.id}` : "rankdon_cached_name";

  const readCachedName = (key: string) => {
    try {
      return localStorage.getItem(key) || "";
    } catch {
      return "";
    }
  };

  // Prefer the cached custom name so auth refreshes cannot overwrite it.
  const [displayName, setDisplayName] = useState<string>(() => {
    return readCachedName(cachedNameKey) || databaseProfileName || rawResolvedName;
  });

  useEffect(() => {
    if (databaseProfileName) {
      setDisplayName(databaseProfileName);
      try {
        localStorage.setItem(cachedNameKey, databaseProfileName);
      } catch {
        // ignore
      }
      return;
    }

    const cachedName = readCachedName(cachedNameKey) || readCachedName("rankdon_cached_name");
    if (cachedName) {
      setDisplayName(cachedName);
      if (auth.user?.id) {
        try {
          localStorage.setItem(cachedNameKey, cachedName);
        } catch {
          // ignore
        }
      }
      return;
    }

    if (rawResolvedName) {
      setDisplayName(rawResolvedName);
      try {
        localStorage.setItem(cachedNameKey, rawResolvedName);
      } catch {
        // ignore
      }
    }
  }, [auth.user?.id, cachedNameKey, databaseProfileName, rawResolvedName]);

  // Fallback label if user hasn't set any name yet (never raw email handle)
  const finalDisplayName = displayName || rawResolvedName || "Learner";
  const initial = finalDisplayName.charAt(0).toUpperCase() || "L";

  const [notifications, setNotifications] = useState<
    Database["public"]["Tables"]["user_notifications"]["Row"][]
  >([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const rawUserId = auth.user?.id;
    if (!rawUserId || !isSupabaseUserId(rawUserId)) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const userId = rawUserId;

    const fetchNotifications = async () => {
      const { data, error } = await (supabase as any)
        .from("user_notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        console.error("Error fetching notifications:", error);
        return;
      }
      const nextNotifications = data ?? [];
      setNotifications(nextNotifications);
      setUnreadCount(nextNotifications.filter((notification: any) => !notification.is_read).length);
    };

    void fetchNotifications();

    const channel = supabase
      .channel(`user-notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const notification = payload.new as Database["public"]["Tables"]["user_notifications"]["Row"];
          setNotifications((previous) => [notification, ...previous].slice(0, 20));
          setUnreadCount((count) => count + 1);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [auth.user?.id]);

  const handleEnrolledNavigation = (event?: { preventDefault?: () => void }) => {
    event?.preventDefault?.();
    const nextUrl = "/?tab=enrolled";
    window.history.pushState(null, "", nextUrl);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-2 px-4 py-3">
        <button
          type="button"
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="order-first rounded-md p-2 text-muted-foreground hover:bg-muted sm:hidden"
        >
          {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
        <Link className="flex items-center gap-2.5 transition-opacity hover:opacity-90" to="/">
          <img
            src="/logo.png"
            alt="Rankdon Emblem"
            className="h-8 w-8 flex-shrink-0 rounded-lg object-contain"
          />
          <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Rank<span className="text-cyan-500">don</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm sm:flex">
          <Link
            to="/"
            className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            activeProps={{ className: "rounded-md px-3 py-1.5 font-medium text-foreground" }}
            activeOptions={{ exact: true }}
          >
            Tests
          </Link>
          <Link
            to="/attempted-tests"
            className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            activeProps={{ className: "rounded-md px-3 py-1.5 font-medium text-foreground" }}
          >
            Attempted Tests
          </Link>
          <Link
            to="/notes"
            className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            activeProps={{ className: "rounded-md px-3 py-1.5 font-medium text-foreground" }}
          >
            Study Notes
          </Link>
          <Link
            to="/referrals"
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            activeProps={{ className: "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium text-foreground" }}
          >
            <Gift className="h-4 w-4 text-cyan-500" />
            Refer &amp; Earn
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: "rounded-md px-3 py-1.5 font-medium text-foreground" }}
            >
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {auth.user ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    aria-label="Notifications"
                    className="relative rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Bell className="size-5" />
                    {unreadCount > 0 && (
                      <span className="absolute right-1 top-1 size-2 rounded-full bg-rose-500" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <p className="px-2 py-2 text-sm font-semibold">Notifications</p>
                  {notifications.length === 0 && (
                    <p className="px-2 py-4 text-sm text-muted-foreground">No notifications yet.</p>
                  )}
                  {notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className="items-start gap-2"
                      onSelect={async () => {
                        if (!notification.is_read) {
                          const { error } = await (supabase as any)
                            .from("user_notifications")
                            .update({ is_read: true })
                            .eq("id", notification.id);
                          if (!error) {
                            setNotifications((previous) =>
                              previous.map((item) =>
                                item.id === notification.id ? { ...item, is_read: true } : item,
                              ),
                            );
                            setUnreadCount((count) => Math.max(0, count - 1));
                          }
                        }
                      }}
                    >
                      <div className="min-w-0">
                        <p className={notification.is_read ? "text-sm" : "text-sm font-semibold"}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground">{notification.message}</p>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full border border-border bg-background px-2 py-1.5 text-left shadow-sm transition-colors hover:bg-accent">
                    <Avatar className="h-8 w-8">
                      {(auth.profile as any)?.avatarUrl ? (
                        <AvatarImage src={(auth.profile as any).avatarUrl} alt={finalDisplayName} />
                      ) : null}
                      <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-semibold text-white">
                        {initial}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden items-center gap-2 sm:flex">
                      <span className="text-sm font-medium text-foreground">{finalDisplayName}</span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </span>
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-64">
                  <div className="flex items-center gap-3 px-2 py-2">
                    <Avatar className="h-9 w-9">
                      {(auth.profile as any)?.avatarUrl ? (
                        <AvatarImage src={(auth.profile as any).avatarUrl} alt={finalDisplayName} />
                      ) : null}
                      <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-semibold text-white">
                        {initial}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{finalDisplayName}</p>
                      <p className="truncate text-xs text-muted-foreground">{auth.user.email}</p>
                    </div>
                  </div>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex cursor-pointer items-center gap-2">
                      <UserRound className="h-4 w-4" />
                      My Profile &amp; Details
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex cursor-pointer items-center gap-2"
                    onSelect={(event) => {
                      event.preventDefault();
                      handleEnrolledNavigation();
                    }}
                  >
                    <GraduationCap className="h-4 w-4" />
                    My Enrolled Tests &amp; Pass
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex cursor-pointer items-center gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        Admin Portal
                      </Link>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    className="flex cursor-pointer items-center gap-2 text-red-600 focus:text-red-600"
                    onSelect={() => {
                      try {
                        localStorage.removeItem("rankdon_cached_name");
                        if (auth.user?.id) {
                          localStorage.removeItem(`rankdon_cached_name:${auth.user.id}`);
                        }
                      } catch {
                        // ignore
                      }
                      void auth.signOut();
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <button
              className="rounded-md px-3 py-1.5 text-sm font-semibold"
              onClick={() => auth.openAuthModal("signin")}
            >
              Login / Sign Up
            </button>
          )}
        </div>
      </div>
      {mobileMenuOpen && (
        <nav className="border-t border-border bg-card px-4 py-3 sm:hidden">
          <div className="flex flex-col gap-1 text-sm">
            <Link onClick={() => setMobileMenuOpen(false)} to="/" className="rounded-md px-3 py-2.5 text-muted-foreground hover:bg-muted hover:text-foreground">Tests</Link>
            <Link onClick={() => setMobileMenuOpen(false)} to="/" search={{ tab: "free" }} className="rounded-md px-3 py-2.5 text-muted-foreground hover:bg-muted hover:text-foreground">Free Mock Tests</Link>
            <Link onClick={() => setMobileMenuOpen(false)} to="/live-tests" className="rounded-md px-3 py-2.5 text-muted-foreground hover:bg-muted hover:text-foreground">Live Tests</Link>
            <Link onClick={() => setMobileMenuOpen(false)} to="/" search={{ tab: "packages" }} className="rounded-md px-3 py-2.5 text-muted-foreground hover:bg-muted hover:text-foreground">Test Series &amp; Combos</Link>
            <Link onClick={() => setMobileMenuOpen(false)} to="/" search={{ tab: "enrolled" }} className="rounded-md px-3 py-2.5 text-muted-foreground hover:bg-muted hover:text-foreground">My Enrolled / Purchased</Link>
            <Link onClick={() => setMobileMenuOpen(false)} to="/attempted-tests" className="rounded-md px-3 py-2.5 text-muted-foreground hover:bg-muted hover:text-foreground">Attempted Tests</Link>
            <Link onClick={() => setMobileMenuOpen(false)} to="/notes" className="rounded-md px-3 py-2.5 text-muted-foreground hover:bg-muted hover:text-foreground">Study Notes</Link>
            <Link onClick={() => setMobileMenuOpen(false)} to="/referrals" className="flex items-center gap-2 rounded-md px-3 py-2.5 text-muted-foreground hover:bg-muted hover:text-foreground"><Gift className="h-4 w-4 text-cyan-500" />Refer &amp; Earn</Link>
            {isAdmin && <Link onClick={() => setMobileMenuOpen(false)} to="/admin" className="rounded-md px-3 py-2.5 text-muted-foreground hover:bg-muted hover:text-foreground">Admin</Link>}
          </div>
        </nav>
      )}
    </header>
  );
}