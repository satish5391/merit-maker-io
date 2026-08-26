import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from '@/context/AuthContext';
import AuthModal from '@/components/AuthModal';
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { ADMIN_EMAILS } from "../lib/admin-access";


function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Rankdon — Practice • Analyze • Rank" },
      { name: "description", content: "Practice full-length mock tests, track percentiles, and access subject-wise study notes on Rankdon." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700&family=Inter+Tight:wght@400;500;600&display=swap",
      },
      { rel: "icon", href: "/logo.png", type: "image/png" },
    ],
  }),

  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2 sm:py-3">
        <Link className="flex items-center gap-2.5 hover:opacity-90 transition-opacity" to="/">
          <img src="/logo.png" alt="Rankdon Emblem" className="h-8 w-8 object-contain rounded-lg flex-shrink-0" />
          <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Rank<span className="text-cyan-500">don</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
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
        </nav>
      </div>
    </header>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="flex min-h-screen flex-col font-sans">
          <SiteHeaderWithAuth />
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <main className="flex-1">
            <Outlet />
          </main>
          <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">© 2026 Rankdon — Practice mock tests with instant analysis.</footer>
          <AuthModal />
        </div>
      </AuthProvider>
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );
}

function SiteHeaderWithAuth() {
  const auth = useAuth();
  const isAdmin = Boolean(auth.user?.email && ADMIN_EMAILS.includes(auth.user.email.trim().toLowerCase()));
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2 sm:py-3">
        <Link className="flex items-center gap-2.5 hover:opacity-90 transition-opacity" to="/"><img src="/logo.png" alt="Rankdon Emblem" className="h-8 w-8 object-contain rounded-lg flex-shrink-0" /><span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Rank<span className="text-cyan-500">don</span></span></Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link to="/" className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" activeProps={{ className: "rounded-md px-3 py-1.5 font-medium text-foreground" }} activeOptions={{ exact: true }}>Tests</Link>
          <Link to="/attempted-tests" className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" activeProps={{ className: "rounded-md px-3 py-1.5 font-medium text-foreground" }}>Attempted Tests</Link>
          <Link to="/notes" className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" activeProps={{ className: "rounded-md px-3 py-1.5 font-medium text-foreground" }}>Study Notes</Link>
          {isAdmin && <Link to="/admin" className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" activeProps={{ className: "rounded-md px-3 py-1.5 font-medium text-foreground" }}>Admin</Link>}
        </nav>
        <div>
          {auth.user ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-semibold">{(auth.user.email ?? '').charAt(0).toUpperCase()}</div>
              <div className="text-sm text-muted-foreground">{auth.user.email}</div>
              <button className="ml-3 rounded-md px-3 py-1.5 text-sm" onClick={() => void auth.signOut()}>Sign Out</button>
            </div>
          ) : (
            <button className="rounded-md px-3 py-1.5 text-sm font-semibold" onClick={() => auth.openAuthModal()}>Login / Sign Up</button>
          )}
        </div>
      </div>
    </header>
  );
}
