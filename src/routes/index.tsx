import { toast } from "sonner";
import { createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  Clock,
  FileText,
  Repeat,
  Trophy,
  Users,
  Star,
  ShoppingBag,
  BookOpen,
  History,
  Sparkles,
  Radio,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchTests, fetchStudentAttempts, type Test } from "@/lib/mock-test";
import { getStudentName } from "@/lib/student";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "../context/AuthContext";
import {
  DEFAULT_ADVERTISEMENTS,
  HeroCarousel,
  InlinePromotion,
  PromoStrip,
  SidebarPromotions,
  type Advertisement,
} from "@/components/RankdonPromotions";
import { isSupabaseUserId } from "@/lib/utils";
import { loadRazorpayScript } from "@/utils/razorpay";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rankdon — Free Online Mock Tests & Instant Scorecards" },
      {
        name: "description",
        content:
          "Attempt timed mock tests with negative marking and get an instant scorecard with score, accuracy, rank and percentile.",
      },
      { property: "og:title", content: "Rankdon — Free Online Mock Tests" },
      {
        property: "og:description",
        content: "Timed mock tests with instant rank, percentile and performance comparison.",
      },
    ],
  }),
  component: Home,
});

type TestWithStats = Test & {
  questionCount: number;
  attemptCount: number;
  price?: number | null;
  discount_price?: number | null;
};

type RazorpayResponse = {
  razorpay_payment_id?: string;
  error?: { description?: string };
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
  handler: (response: RazorpayResponse) => void | Promise<void>;
  modal?: { ondismiss?: () => void };
};

type RazorpayInstance = {
  open: () => void;
  on: (event: string, callback: (response: RazorpayResponse) => void) => void;
};

type RazorpayConstructor = new (options: RazorpayOptions) => RazorpayInstance;

async function fetchTestsWithStats(): Promise<TestWithStats[]> {
  const tests = await fetchTests();
  const [{ data: qs }, { data: as }] = await Promise.all([
    supabase.from("questions").select("test_id"),
    supabase.from("attempts").select("test_id"),
  ]);
  return tests.map((t) => ({
    ...t,
    questionCount: (qs ?? []).filter((q) => q.test_id === t.id).length,
    attemptCount: (as ?? []).filter((a) => a.test_id === t.id).length,
  }));
}

function Home() {
  const { data: tests, isLoading } = useQuery({
    queryKey: ["tests-with-stats"],
    queryFn: fetchTestsWithStats,
  });

  const [student, setStudent] = useState("");
  useEffect(() => setStudent(getStudentName()), []);

  const { data: packages } = useQuery({
    queryKey: ["packages"],
    queryFn: async () => {
      const { data } = await supabase.from("test_packages").select("*");
      return data ?? [];
    },
  });

  const { data: packageTests } = useQuery({
    queryKey: ["package-tests"],
    queryFn: async () => {
      const { data } = await supabase.from("package_tests").select("*");
      return data ?? [];
    },
  });

  const { data: advertisements = [] } = useQuery({
    queryKey: ["advertisements", "active"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("advertisements")
          .select("*")
          .eq("is_active", true)
          .order("display_order", { ascending: true });
        if (error) {
          console.warn("Unable to load advertisements; using Rankdon defaults.", error);
          return DEFAULT_ADVERTISEMENTS;
        }
        return (data ?? []) as Advertisement[];
      } catch (error) {
        console.warn("Advertisement request failed; using Rankdon defaults.", error);
        return DEFAULT_ADVERTISEMENTS;
      }
    },
  });

  const [activeView, setActiveView] = useState<"home" | "all" | "free" | "packages" | "enrolled">(
    "home",
  );
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "duration" | "questions">("newest");

  const routerSearch = useRouterState({
    select: (state) => state.location.search as Record<string, string | undefined>,
  });

  useEffect(() => {
    const currentTab = routerSearch["tab"] || "home";
    const currentCategory = routerSearch["category"] || "All";
    const currentQ = routerSearch["q"] || "";

    if (
      currentTab === "home" ||
      currentTab === "free" ||
      currentTab === "packages" ||
      currentTab === "enrolled" ||
      currentTab === "all"
    ) {
      setActiveView(currentTab as "home" | "all" | "free" | "packages" | "enrolled");
    }

    setActiveCategory(currentCategory);
    setSearch(currentQ);
  }, [routerSearch]);

  const updateUrlParam = (key: string, value: string) => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (!value || value === "All" || value === "all") params.delete(key);
      else params.set(key, value);
      const newUrl = `${window.location.pathname}${params.toString() ? "?" + params.toString() : ""}`;
      window.history.replaceState(null, "", newUrl);
    } catch {
      // ignore
    }
  };

  const handleSetView = (v: "home" | "all" | "free" | "packages" | "enrolled") => {
    setActiveView(v);
    updateUrlParam("tab", v === "home" || v === "all" ? "" : v);
  };

  const showPackages = () => {
    handleSetView("packages");
    requestAnimationFrame(() =>
      document.getElementById("tests")?.scrollIntoView({ behavior: "smooth" }),
    );
  };

  const handleSetCategory = (cat: string) => {
    setActiveCategory(cat);
    updateUrlParam("category", cat === "All" ? "" : cat);
  };

  const handleSetSearch = (q: string) => {
    setSearch(q);
    updateUrlParam("q", q);
  };

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const currentTab = (params.get("tab") as string) || "home";
      const currentCategory = (params.get("category") as string) || "All";
      const currentQ = (params.get("q") as string) || "";
      if (
        currentTab === "home" ||
        currentTab === "free" ||
        currentTab === "packages" ||
        currentTab === "enrolled" ||
        currentTab === "all"
      ) {
        setActiveView(currentTab as any);
      }
      setActiveCategory(currentCategory);
      setSearch(currentQ);
    } catch {
      // ignore
    }
    const onPop = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const t = params.get("tab") || "home";
        const c = params.get("category") || "All";
        const q = params.get("q") || "";
        setActiveView(t as any);
        setActiveCategory(c);
        setSearch(q);
      } catch {
        // ignore
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const { user, profile, openAuthModal } = useAuth();

  const getItemPayableAmount = (item: any): number => {
    if (!item) return 99;

    const discount =
      item.discount_price ??
      item.discounted_price ??
      item.offer_price ??
      item.sale_price;

    if (
      discount !== undefined &&
      discount !== null &&
      !Number.isNaN(Number(discount)) &&
      Number(discount) > 0
    ) {
      return Number(discount);
    }

    return Number(item.price ?? 99);
  };

  const resolvedUserId = user?.id && isSupabaseUserId(user.id) ? user.id : null;

  const { data: databaseProfile } = useQuery({
    queryKey: ["profile-access", resolvedUserId],
    enabled: Boolean(resolvedUserId),
    queryFn: async () => {
      if (!resolvedUserId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("has_free_pass, free_pass_expires_at")
        .eq("id", resolvedUserId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const hasFreePass = Boolean(
    (databaseProfile?.has_free_pass ?? profile?.has_free_pass) &&
      (!(databaseProfile?.free_pass_expires_at ?? profile?.free_pass_expires_at) ||
        new Date(
          databaseProfile?.free_pass_expires_at ?? profile?.free_pass_expires_at!,
        ).getTime() > Date.now()),
  );

  const { data: userPurchases = [], refetch: refetchPurchases } = useQuery({
    queryKey: ["user-purchases", resolvedUserId],
    queryFn: async () => {
      if (!resolvedUserId) return [];
      const { data, error } = await supabase
        .from("user_purchases")
        .select("*")
        .eq("user_id", resolvedUserId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: true,
  });

  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [purchaseItem, setPurchaseItem] = useState<any>(null);
  const [purchaseItemType, setPurchaseItemType] = useState<"test" | "package">("test");
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [packageViewerOpen, setPackageViewerOpen] = useState(false);
  const [packageViewerPackage, setPackageViewerPackage] = useState<any>(null);

  const { data: myAttempts = [] } = useQuery({
    queryKey: ["my-attempts", resolvedUserId],
    queryFn: async () => {
      if (!resolvedUserId) return [];
      const { data, error } = await supabase
        .from("attempts")
        .select("*")
        .eq("user_id", resolvedUserId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
    enabled: Boolean(resolvedUserId),
  });

  const categories = ["All", ...Array.from(new Set((tests ?? []).map((t) => t.category)))];

  const packagesWithMeta = (packages ?? []).map((p: any) => {
    const included = (packageTests ?? [])
      .filter((pt: any) => String(pt.package_id) === String(p.id))
      .map((pt: any) => pt.test_id);
    return { ...p, includedTests: included };
  });

  const { purchasedPackageIds, unlockedIds } = useMemo(() => {
    const purchased = (userPurchases ?? []).filter(
      (up: any) => !up.status || up.status === "completed" || up.payment_status === "completed",
    );

    const pTestIds: string[] = [];
    const pPackageIds: string[] = [];

    purchased.forEach((up: any) => {
      const type = String(up["item_type"] || "");
      const itemId = String(up["item_id"] || "");
      const testId = String(up["test_id"] || "");
      const packageId = String(up["package_id"] || "");

      if (type === "package" || packageId) {
        if (itemId) pPackageIds.push(itemId);
        if (packageId) pPackageIds.push(packageId);
      } else {
        if (itemId) pTestIds.push(itemId);
        if (testId) pTestIds.push(testId);
      }
    });

    const pkgTestIds = (packageTests ?? []).map((pt: any) => pt.test_id);

    const unlockedFromPackages = (packageTests ?? [])
      .filter((pt: any) => pPackageIds.includes(String(pt.package_id)))
      .map((pt: any) => String(pt.test_id));

    const unlockedSet = new Set<string>([
      ...pTestIds.map((id) => String(id)),
      ...unlockedFromPackages,
      ...(hasFreePass ? (tests ?? []).map((test) => String(test.id)) : []),
    ]);

    return {
      purchasedTestIds: pTestIds,
      purchasedPackageIds: pPackageIds,
      unlockedIds: unlockedSet,
      packageTestIds: pkgTestIds,
    };
  }, [hasFreePass, packageTests, tests, userPurchases]);

  const hasPurchased = (itemType: "test" | "package", id: string) => {
    if (hasFreePass) return true;
    const targetId = String(id);

    return (userPurchases ?? []).some((up: any) => {
      const statusOk = !up.status || up.status === "completed" || up.payment_status === "completed";
      if (!statusOk) return false;

      const pType = String(up["item_type"] || "");
      const pItemId = String(up["item_id"] || "");
      const pTestId = String(up["test_id"] || "");
      const pPackageId = String(up["package_id"] || "");

      if (itemType === "package") {
        return pItemId === targetId || pPackageId === targetId;
      }
      return pItemId === targetId || pTestId === targetId;
    });
  };

  const isTestUnlocked = (testItem: any): boolean => {
    if (!testItem) return false;
    if (testItem.is_free === true || Number(testItem.price ?? 0) === 0) return true;
    if (!user) return false;
    if (hasFreePass) return true;

    const targetId = String(testItem.id);
    if (unlockedIds.has(targetId)) return true;

    return hasPurchased("test", targetId);
  };

  const openPurchaseModal = (item: any, type: "test" | "package") => {
    if (!user) {
      openAuthModal && openAuthModal();
      return;
    }
    setPurchaseItem(item);
    setPurchaseItemType(type);
    setPurchaseModalOpen(true);
    setIsUnlockModalOpen(true);
  };

  const closePurchaseModal = () => {
    setPurchaseModalOpen(false);
    setIsUnlockModalOpen(false);
  };

  const completePurchase = async (amount: number) => {
    if (!purchaseItem) return;

    try {
      setIsPaymentLoading(true);
      const effectiveAmount = Number(amount || getItemPayableAmount(purchaseItem) || 99);

      if (!user?.id || !isSupabaseUserId(user.id)) {
        throw new Error("Please sign in before completing a purchase.");
      }
      const activeUserId = user.id;
      const activeUserName = user.user_metadata?.full_name || profile?.full_name || "";
      const activeUserEmail = user.email || "";
      const activeUserPhone = user.phone || (profile as any)?.phone || "";

      const targetItemId = purchaseItem.id ? String(purchaseItem.id) : null;
      if (!targetItemId) {
        toast.error("Could not identify the item to purchase.");
        return;
      }

      if (!(await loadRazorpayScript())) {
        toast.error("Could not load Razorpay checkout. Please try again.");
        return;
      }

      const razorpayKey = import.meta.env["VITE_RAZORPAY_KEY_ID"];
      if (!razorpayKey) {
        toast.error("Razorpay Key is missing in .env configuration.");
        return;
      }

      const Razorpay = (window as Window & { Razorpay?: RazorpayConstructor }).Razorpay;
      if (!Razorpay) {
        toast.error("Razorpay checkout is unavailable. Please try again.");
        return;
      }

      const options: RazorpayOptions = {
        key: razorpayKey,
        amount: Math.round(effectiveAmount * 100),
        currency: "INR",
        name: "Rankdon Test Prep",
        description: `Unlock ${purchaseItem.title || "Test Series"}`,
        prefill: {
          name: activeUserName,
          email: activeUserEmail,
          contact: activeUserPhone,
        },
        theme: { color: "#2563eb" },
        handler: async (response) => {
          const isPackage = purchaseItemType === "package" || "tests_count" in purchaseItem;
          const currentItemType = isPackage ? "package" : "test";
          const currentItemId = String(purchaseItem.id);

          const { error } = await (supabase as any).from("user_purchases").insert({
            user_id: activeUserId,
            item_type: currentItemType,
            item_id: currentItemId,
            amount: Number(effectiveAmount),
            payment_id: response.razorpay_payment_id || `pay_${Date.now()}`,
            status: "completed",
            test_id: isPackage ? null : currentItemId,
            package_id: isPackage ? currentItemId : null,
          });

          if (error) {
            console.error("Supabase insert error details:", error);
            toast.error("Payment received, but failed to record purchase. Please contact support.");
            return;
          }

          toast.success("Payment successful! Test unlocked.");
          closePurchaseModal();
          await refetchPurchases();
        },
        modal: { ondismiss: () => setIsPaymentLoading(false) },
      };

      const razorpay = new Razorpay(options);
      razorpay.on("payment.failed", (response) => {
        toast.error(response.error?.description || "Payment failed.");
      });
      razorpay.open();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to initialize payment.";
      console.error("Payment initiation error:", error);
      toast.error(message);
    } finally {
      setIsPaymentLoading(false);
    }
  };

  const openPackageViewer = (pkg: any) => {
    if (!user) {
      openAuthModal && openAuthModal();
      return;
    }
    setPackageViewerPackage(pkg);
    setPackageViewerOpen(true);
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#f8fafc]">
      {/* Purchase modal */}
      {(purchaseModalOpen || isUnlockModalOpen) && purchaseItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closePurchaseModal} />
          <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="font-display text-lg font-semibold">
              Unlock {purchaseItemType === "test" ? "Test" : "Series"}
            </h3>
            <p className="text-sm text-muted-foreground mt-2">{purchaseItem.title}</p>
            {purchaseItemType === "package" && (
              <div className="mt-3 text-sm">
                <div>
                  {(purchaseItem.includedTests ?? purchaseItem.includedTests)?.length ?? 0} tests
                  included
                </div>
              </div>
            )}
            <div className="mt-4">
              <div className="text-sm">Amount</div>
              <div className="text-2xl font-semibold mt-1">
                ₹{getItemPayableAmount(purchaseItem)}
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <Button onClick={closePurchaseModal} variant="outline">
                Cancel
              </Button>
              <button
                disabled={isPaymentLoading}
                onClick={() => completePurchase(getItemPayableAmount(purchaseItem))}
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {isPaymentLoading ? "Processing..." : "Pay with Razorpay & Unlock"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Package viewer modal */}
      {packageViewerOpen && packageViewerPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPackageViewerOpen(false)} />
          <div className="relative z-10 w-full max-w-2xl h-full bg-white p-6 overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">
                {packageViewerPackage.title} - Included Tests
              </h3>
              <Button variant="ghost" onClick={() => setPackageViewerOpen(false)}>
                Close
              </Button>
            </div>
            <div className="mt-4 space-y-4">
              {(packageTests ?? [])
                .filter((pt: any) => pt.package_id === packageViewerPackage.id)
                .map((pt: any) => {
                  const t = (tests ?? []).find((x: any) => x.id === pt.test_id);
                  if (!t) return null;
                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
                    >
                      <div>
                        <div className="font-semibold">{t.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {t.questionCount ?? 0} questions • {t.duration_minutes} min
                        </div>
                      </div>
                      <div>
                        <Button asChild size="sm">
                          <Link to="/test/$testId" params={{ testId: t.id }}>
                            Take Test
                          </Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {activeView === "home" && <PromoStrip ads={advertisements} />}
      
      <div id="tests" className="flex flex-1 min-h-0 w-full flex-col overflow-hidden md:flex-row">
        {/* Left sidebar */}
        <aside className="hidden md:flex w-64 shrink-0 flex-col justify-between h-full overflow-y-auto border-r border-[#262c35] bg-[#161a1e] p-3">
          <div>
            <div className="px-3 py-4 flex justify-center items-center border-b border-slate-800/60 mb-2">
              <Link to="/" aria-label="Rankdon home" className="block w-full">
                <img
                  src="/logo.png"
                  alt="Rankdon"
                  className="w-full max-w-[190px] h-auto object-contain mx-auto rounded-xl block"
                />
              </Link>
            </div>
            <div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase px-3 pt-3 pb-1">
              TESTS
            </div>
            <nav className="mt-2 flex flex-col gap-1">
              <button
                type="button"
                onClick={() => handleSetView("home")}
                className={
                  activeView === "home"
                    ? "bg-[#222831] text-cyan-400 font-semibold border-l-[3px] border-cyan-400 rounded-r-lg px-3 py-2 text-xs flex items-center gap-3"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#1e232a] rounded-lg px-3 py-2 text-xs font-medium transition-colors flex items-center gap-3"
                }
              >
                <Sparkles className="size-4" />
                <span>Home</span>
              </button>

              <button
                type="button"
                onClick={() => handleSetView("all")}
                className={
                  activeView === "all"
                    ? "bg-[#222831] text-cyan-400 font-semibold border-l-[3px] border-cyan-400 rounded-r-lg px-3 py-2 text-xs flex items-center gap-3"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#1e232a] rounded-lg px-3 py-2 text-xs font-medium transition-colors flex items-center gap-3"
                }
              >
                <FileText className="size-4" />
                <span>All Tests</span>
              </button>

              <button
                type="button"
                onClick={() => handleSetView("free")}
                className={
                  activeView === "free"
                    ? "bg-[#222831] text-cyan-400 font-semibold border-l-[3px] border-cyan-400 rounded-r-lg px-3 py-2 text-xs flex items-center gap-3"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#1e232a] rounded-lg px-3 py-2 text-xs font-medium transition-colors flex items-center gap-3"
                }
              >
                <Star className="size-4" />
                <span>Free Mock Tests</span>
              </button>

              <Link
                to="/live-tests"
                preload="intent"
                className="text-slate-400 hover:text-white hover:bg-[#1e232a] rounded-lg px-3 py-2 text-xs font-medium transition-colors flex items-center gap-3"
              >
                <span className="relative">
                  <Radio className="size-4 text-rose-400" />
                  <span className="absolute -right-1 -top-1 size-1.5 animate-pulse rounded-full bg-emerald-400 ring-2 ring-[#161a1e]" />
                </span>
                <span>Live Tests</span>
              </Link>

              <button
                type="button"
                onClick={() => handleSetView("packages")}
                className={
                  activeView === "packages"
                    ? "bg-[#222831] text-cyan-400 font-semibold border-l-[3px] border-cyan-400 rounded-r-lg px-3 py-2 text-xs flex items-center gap-3"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#1e232a] rounded-lg px-3 py-2 text-xs font-medium transition-colors flex items-center gap-3"
                }
              >
                <Trophy className="size-4" />
                <span>Test Series &amp; Combos</span>
              </button>

              <button
                type="button"
                onClick={() => handleSetView("enrolled")}
                className={
                  activeView === "enrolled"
                    ? "bg-[#222831] text-cyan-400 font-semibold border-l-[3px] border-cyan-400 rounded-r-lg px-3 py-2 text-xs flex items-center gap-3"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#1e232a] rounded-lg px-3 py-2 text-xs font-medium transition-colors flex items-center gap-3"
                }
              >
                <ShoppingBag className="size-4" />
                <span>My Enrolled / Purchased</span>
              </button>
            </nav>
            <div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase px-3 pt-3 pb-1 mt-4">
              STUDY MATERIAL
            </div>
            <nav className="mt-2 flex flex-col gap-1">
              <Link
                to="/attempted-tests"
                preload="intent"
                className="text-slate-400 hover:text-slate-200 hover:bg-[#1e232a] rounded-lg px-3 py-2 text-xs font-medium transition-colors flex items-center gap-3"
              >
                <History className="size-4" />
                <span>Attempted Tests</span>
              </Link>

              <Link
                to="/notes"
                preload="intent"
                className="text-slate-400 hover:text-slate-200 hover:bg-[#1e232a] rounded-lg px-3 py-2 text-xs font-medium transition-colors flex items-center gap-3"
              >
                <BookOpen className="size-4" />
                <span>Study Notes</span>
                <span className="ml-auto bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  NEW
                </span>
              </Link>
            </nav>
          </div>
        </aside>

        {/* Right content with independent scroller */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto bg-[#f8fafc] p-4 md:p-8">
          {activeView === "home" ? (
            <section className="space-y-8">
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_270px]">
                <HeroCarousel ads={advertisements} />
                <aside className="hidden xl:block xl:sticky xl:top-6 xl:self-start">
                  <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                    <Sparkles className="size-4 text-cyan-600" /> Featured now
                  </div>
                  <SidebarPromotions ads={advertisements} />
                </aside>
              </div>

              <div>
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">
                      Your next advantage
                    </p>
                    <h1 className="mt-2 font-display text-2xl font-bold md:text-3xl">
                      Practice with a plan
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Jump into a focused category or unlock a complete series.
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => handleSetView("all")}>
                    Browse all tests
                  </Button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {categories.slice(0, 6).map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => {
                        handleSetCategory(category);
                        handleSetView("all");
                      }}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-cyan-400 hover:text-cyan-700"
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-display text-xl font-semibold">Featured test series</h2>
                  <button
                    type="button"
                    onClick={() => handleSetView("packages")}
                    className="text-sm font-semibold text-cyan-700 hover:text-cyan-900"
                  >
                    View all series
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {packagesWithMeta.slice(0, 3).map((pkg: any, index: number) => (
                    <article
                      key={pkg?.id ?? `featured-${index}`}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                    >
                      <Badge variant="secondary">{pkg?.category ?? "Rankdon series"}</Badge>
                      <h3 className="mt-3 font-display text-lg font-semibold">
                        {pkg?.title ?? "Rankdon Mock Series"}
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {pkg?.description ??
                          "A focused bundle for consistent practice and better ranks."}
                      </p>
                      <Button size="sm" className="mt-5" onClick={() => handleSetView("packages")}>
                        Explore series
                      </Button>
                    </article>
                  ))}
                  {packagesWithMeta.length === 0 && (
                    <article className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-muted-foreground sm:col-span-2 lg:col-span-3">
                      Rankdon Mock Series bundles will appear here as soon as they are published.
                    </article>
                  )}
                </div>
              </div>
            </section>
          ) : (
            <>
              <h2 className="font-display text-xl font-semibold md:text-2xl">
                Available mock tests
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Pick a paper and start whenever you're ready. The timer starts on the first question.
              </p>

              <div className="mt-4 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <input
                    id="search-input"
                    name="search-input"
                    aria-label="Search tests"
                    value={search}
                    onChange={(e) => handleSetSearch(e.target.value)}
                    placeholder={
                      activeView === "packages"
                        ? "Search packages by title or category"
                        : "Search by title, subject or category"
                    }
                    className="w-full h-10 text-xs rounded-xl border border-slate-200 bg-white shadow-sm px-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="w-44">
                  <select
                    id="sort-select"
                    name="sort-select"
                    aria-label="Sort tests"
                    value={sort}
                    onChange={(e) => setSort(e.target.value as any)}
                    className="w-full h-10 text-xs rounded-xl border border-slate-200 bg-white shadow-sm px-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="newest">Newest First</option>
                    <option value="duration">Duration (Low to High)</option>
                    <option value="questions">Total Questions</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={activeCategory === c}
                    onClick={() => handleSetCategory(c)}
                    className={
                      activeCategory === c
                        ? "px-3.5 py-1.5 text-xs font-medium rounded-full transition-all border bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "px-3.5 py-1.5 text-xs font-medium rounded-full transition-all border bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }
                  >
                    {c}
                  </button>
                ))}
              </div>

              <InlinePromotion ads={advertisements} />

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {isLoading &&
                  [0, 1].map((i) => <Skeleton key={i} className="h-44 w-full rounded-xl" />)}

                {/* Packages view */}
                {activeView === "packages" && (
                  <>
                    {packagesWithMeta
                      .filter((p: any) => {
                        const q = search.trim().toLowerCase();
                        if (!q) return true;
                        return (
                          p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
                        );
                      })
                      .map((p: any) => {
                        const bought = hasPurchased("package", p.id);
                        const offerPrice = p.discount_price ?? p.price;
                        const savings =
                          p.price && p.discount_price
                            ? Math.round(((p.price - p.discount_price) / p.price) * 100)
                            : 0;
                        return (
                          <article
                            key={p.id}
                            className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <div className="font-display font-semibold">{p.title}</div>
                                  <Badge variant="secondary">{p.category}</Badge>
                                  {p.is_combo && <Badge>Combo Offer</Badge>}
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                  {p.description}
                                </div>
                                <div className="mt-2 text-sm">
                                  <span className="font-semibold">₹{offerPrice ?? "—"}</span>
                                  {p.price && p.discount_price && (
                                    <span className="text-xs text-muted-foreground line-through ml-2">
                                      ₹{p.price}
                                    </span>
                                  )}
                                  {savings > 0 && (
                                    <Badge variant="secondary" className="ml-2">
                                      {savings}% OFF
                                    </Badge>
                                  )}
                                </div>
                                <div className="mt-2 text-xs text-muted-foreground">
                                  {p.includedTests.length} tests included
                                </div>
                              </div>
                              <div className="flex flex-col gap-2 items-end">
                                {bought ? (
                                  <Button
                                    size="sm"
                                    className="bg-emerald-600 text-white"
                                    onClick={() => openPackageViewer(p)}
                                  >
                                    Access Series
                                  </Button>
                                ) : (
                                  <Button size="sm" onClick={() => openPurchaseModal(p, "package")}>
                                    Unlock Series / Buy Now
                                  </Button>
                                )}
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    {/* Standalone paid tests */}
                    {(tests ?? [])
                      .filter((t) => {
                        const isPaid = !(
                          (t as any).is_free === true || Number((t as any).price ?? 0) === 0
                        );
                        if (!isPaid) return false;
                        if ((packageTests ?? []).some((pt: any) => pt.test_id === t.id))
                          return false;
                        const q = search.trim().toLowerCase();
                        return (
                          !q ||
                          t.title.toLowerCase().includes(q) ||
                          t.category.toLowerCase().includes(q) ||
                          t.subject.toLowerCase().includes(q)
                        );
                      })
                      .map((t) => {
                        const isPaid = !(
                          (t as any).is_free === true || Number((t as any).price ?? 0) === 0
                        );
                        const bought = isTestUnlocked(t);
                        const userAttemptCount = (myAttempts ?? []).filter(
                          (a: any) => a.test_id === t.id,
                        ).length;
                        const hasSavedSession = false;
                        const attemptLimit = t.max_attempts || 1;
                        const limitReached = Boolean(t.max_attempts && userAttemptCount >= attemptLimit);
                        const canAccessPaidTest = bought && !limitReached;
                        return (
                          <article
                            key={t.id}
                            className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
                          >
                            <div className="flex flex-wrap gap-2">
                              <Badge className="w-fit">{t.category}</Badge>
                              <Badge variant="secondary" className="w-fit">
                                {t.subject}
                              </Badge>
                              {isPaid && <Badge variant="destructive">PAID</Badge>}
                            </div>
                            <h3 className="mt-3 font-display text-lg font-semibold leading-snug">
                              {t.title}
                            </h3>
                            <div className="mt-2">
                              {t.discount_price &&
                              Number(t.discount_price) > 0 &&
                              Number(t.discount_price) < Number(t.price ?? 0) ? (
                                <div className="flex items-center gap-3">
                                  <div className="text-2xl font-semibold">₹{t.discount_price}</div>
                                  <div className="line-through text-slate-400 text-sm">
                                    ₹{t.price}
                                  </div>
                                  {t.price &&
                                    t.discount_price &&
                                    Number(t.price) > 0 &&
                                    Number(t.discount_price) > 0 && (
                                      <div className="bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded text-xs">
                                        {Math.round(
                                          ((Number(t.price) - Number(t.discount_price)) /
                                            Number(t.price)) *
                                            100,
                                        )}
                                        % OFF
                                      </div>
                                    )}
                                </div>
                              ) : (
                                <div className="text-lg font-semibold">₹{t.price ?? "—"}</div>
                              )}
                            </div>
                            <div className="mt-3 text-sm text-muted-foreground">
                              ₹{(t as any).price ?? "—"}
                            </div>
                            <div className="mt-3">
                              <Badge
                                variant={limitReached ? "destructive" : "outline"}
                                className="w-fit"
                              >
                                Attempts: {userAttemptCount}/{attemptLimit}
                              </Badge>
                            </div>
                            <div className="mt-4 flex items-end justify-end">
                              {bought ? (
                                canAccessPaidTest ? (
                                  <Button
                                    asChild
                                    size="sm"
                                    className={
                                      hasSavedSession ? "bg-cyan-600 hover:bg-cyan-700" : ""
                                    }
                                  >
                                    <Link to="/test/$testId" params={{ testId: t.id }}>
                                      {hasSavedSession
                                        ? "Resume Test"
                                        : userAttemptCount === 0
                                          ? "Start Test"
                                          : `Retake Test (${userAttemptCount}/${attemptLimit})`}
                                    </Link>
                                  </Button>
                                ) : (
                                  <Button size="sm" disabled>
                                    Attempt Limit Reached
                                  </Button>
                                )
                              ) : (
                                <Button size="sm" onClick={() => openPurchaseModal(t, "test")}>
                                  Unlock Test
                                </Button>
                              )}
                            </div>
                          </article>
                        );
                      })}
                  </>
                )}

                {/* Enrolled view */}
                {activeView === "enrolled" &&
                  (purchasedPackageIds ?? []).length > 0 &&
                  (packagesWithMeta ?? [])
                    .filter((p: any) => (purchasedPackageIds ?? []).includes(p.id))
                    .map((p: any) => {
                      const offerPrice = p.discount_price ?? p.price;
                      const savings =
                        p.price && p.discount_price
                          ? Math.round(((p.price - p.discount_price) / p.price) * 100)
                          : 0;
                      return (
                        <article
                          key={p.id}
                          className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <div className="font-display font-semibold">{p.title}</div>
                                <Badge variant="secondary">{p.category}</Badge>
                                {p.is_combo && <Badge>Combo Offer</Badge>}
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {p.description}
                              </div>
                              <div className="mt-2 text-sm">
                                <span className="font-semibold">₹{offerPrice ?? "—"}</span>
                                {p.price && p.discount_price && (
                                  <span className="text-xs text-muted-foreground line-through ml-2">
                                    ₹{p.price}
                                  </span>
                                )}
                                {savings > 0 && (
                                  <Badge variant="secondary" className="ml-2">
                                    {savings}% OFF
                                  </Badge>
                                )}
                              </div>
                              <div className="mt-2 text-xs text-muted-foreground">
                                {p.includedTests.length} tests included
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 items-end">
                              <Button
                                size="sm"
                                className="bg-emerald-600 text-white"
                                onClick={() => openPackageViewer(p)}
                              >
                                Access Series
                              </Button>
                            </div>
                          </div>
                        </article>
                      );
                    })}

                {activeView === "enrolled" &&
                  unlockedIds.size === 0 &&
                  (purchasedPackageIds ?? []).length === 0 && (
                    <div className="col-span-full">
                      <div className="mt-6 rounded-xl border border-border bg-card p-6 text-center">
                        <p className="text-sm text-muted-foreground">
                          No purchased test series yet. Explore our test series and combo offers to
                          unlock them.
                        </p>
                        <div className="mt-4">
                          <Button onClick={() => setActiveView("packages")}>
                            Explore Test Series &amp; Combos
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                {/* All / Free / Enrolled views */}
                {(activeView === "all" || activeView === "free" || activeView === "enrolled") &&
                  (() => {
                    let list: TestWithStats[] = [];
                    if (activeView === "all") {
                      list = tests ?? [];
                    } else if (activeView === "free") {
                      list = (tests ?? []).filter(
                        (t) =>
                          (t as any).is_free === true ||
                          !(t as any).price ||
                          Number((t as any).price) === 0,
                      );
                    } else if (activeView === "enrolled") {
                      list = (tests ?? []).filter((t) => unlockedIds.has(String(t.id)));
                    }

                    const q = search.trim().toLowerCase();
                    const filtered = list
                      .filter((t) => activeCategory === "All" || t.category === activeCategory)
                      .filter((t) =>
                        q
                          ? t.title.toLowerCase().includes(q) ||
                            t.subject.toLowerCase().includes(q) ||
                            t.category.toLowerCase().includes(q)
                          : true,
                      )
                      .sort((a, b) => {
                        if (sort === "newest")
                          return (
                            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                          );
                        if (sort === "duration")
                          return Number(a.duration_minutes) - Number(b.duration_minutes);
                        if (sort === "questions")
                          return (b.questionCount ?? 0) - (a.questionCount ?? 0);
                        return 0;
                      });

                    return filtered.map((t) => {
                      const userAttemptCount = (myAttempts ?? []).filter(
                        (a: any) => a.test_id === t.id,
                      ).length;
                      const attemptLimit = t.max_attempts || 1;
                      const limitReached =
                        t.max_attempts !== null && userAttemptCount >= attemptLimit;
                      const accessType =
                        (t as any).access_type ??
                        ((t as any).is_free === true || Number((t as any).price ?? 0) === 0
                          ? "free"
                          : "paid");
                      const isPackageOnly = accessType === "package_only";
                      const isPaid = accessType === "paid";
                      const purchased = isTestUnlocked(t);
                      const hasSavedSession = false;
                      return (
                        <article
                          key={t.id}
                          className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
                        >
                          <div className="flex flex-wrap gap-2">
                            <Badge className="w-fit">{t.category}</Badge>
                            <Badge variant="secondary" className="w-fit">
                              {t.subject}
                            </Badge>
                            {isPackageOnly ? (
                              <Badge variant="secondary">PACKAGE ONLY</Badge>
                            ) : (
                              isPaid && <Badge variant="destructive">PAID</Badge>
                            )}
                          </div>
                          <h3 className="mt-3 font-display text-lg font-semibold leading-snug">
                            {t.title}
                          </h3>
                          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Clock className="size-4" /> {t.duration_minutes} min
                            </div>
                            <div className="flex items-center gap-2">
                              <FileText className="size-4" /> {t.questionCount} questions
                            </div>
                            <div className="flex items-center gap-2">
                              <Trophy className="size-4" /> +{t.positive_marks} / −
                              {t.negative_marks}
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="size-4" /> {t.attemptCount} attempts
                            </div>
                          </dl>
                          <div className="mt-3">
                            <Badge
                              variant={limitReached ? "destructive" : "outline"}
                              className="w-fit"
                            >
                              <Repeat className="mr-1 size-3" />
                              Attempts: {userAttemptCount}/{attemptLimit}
                            </Badge>
                          </div>

                          {isPackageOnly && !purchased ? (
                            <Button className="mt-5 w-full" onClick={showPackages}>
                              Unlock via Series
                            </Button>
                          ) : isPaid ? (
                            purchased ? (
                              userAttemptCount >= attemptLimit ? (
                                <Button className="mt-5 w-full" disabled>
                                  Attempt Limit Reached
                                </Button>
                              ) : (
                                <Button
                                  asChild
                                  className={`mt-5 w-full ${hasSavedSession ? "bg-cyan-600 hover:bg-cyan-700" : ""}`}
                                >
                                  <Link to="/test/$testId" params={{ testId: t.id }}>
                                    {hasSavedSession
                                      ? "Resume Test"
                                      : userAttemptCount === 0
                                        ? "Start Test"
                                        : `Retake Test (${userAttemptCount}/${attemptLimit})`}
                                  </Link>
                                </Button>
                              )
                            ) : (
                              <Button
                                className="mt-5 w-full"
                                onClick={() => openPurchaseModal(t, "test")}
                              >
                                Unlock Test
                              </Button>
                            )
                          ) : (
                            <Button
                              asChild
                              className="mt-5 w-full"
                              disabled={t.questionCount === 0}
                            >
                              <Link to="/test/$testId" params={{ testId: t.id }}>
                                {t.questionCount === 0
                                  ? "No questions yet"
                                  : userAttemptCount > 0
                                    ? "Retake test"
                                    : "Take test"}
                              </Link>
                            </Button>
                          )}
                        </article>
                      );
                    });
                  })()}

                {/* Fallback empty state */}
                {((activeView === "all" || activeView === "free" || activeView === "enrolled") &&
                  (tests ?? []).length > 0) ||
                (activeView === "packages" && (packagesWithMeta ?? []).length > 0) ? null : (
                  <p className="text-sm text-muted-foreground">No items to show for this view.</p>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}