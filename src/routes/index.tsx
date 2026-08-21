import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Clock, FileText, Plus, Repeat, Trophy, Users, Star, ShoppingBag, BookOpen, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchTests, fetchStudentAttempts, type Test } from "@/lib/mock-test";
import { getStudentName } from "@/lib/student";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "../context/AuthContext";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TestPrep — Free Online Mock Tests & Instant Scorecards" },
      {
        name: "description",
        content:
          "Attempt timed mock tests with negative marking and get an instant scorecard with score, accuracy, rank and percentile.",
      },
      { property: "og:title", content: "TestPrep — Free Online Mock Tests" },
      {
        property: "og:description",
        content: "Timed mock tests with instant rank, percentile and performance comparison.",
      },
    ],
  }),
  component: Home,
});

type TestWithStats = Test & { questionCount: number; attemptCount: number };

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

  const [activeView, setActiveView] = useState<"all" | "free" | "packages" | "enrolled">("all");

  // Safe URL param updater using replaceState (no navigation)
  const updateUrlParam = (key: string, value: string) => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (!value || value === 'All' || value === 'all') params.delete(key);
      else params.set(key, value);
      const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
      window.history.replaceState(null, '', newUrl);
    } catch (e) {
      // ignore (SSR)
    }
  };

  const handleSetView = (v: "all" | "free" | "packages" | "enrolled") => {
    setActiveView((prev) => {
      if (prev === v) return prev;
      updateUrlParam('tab', v === 'all' ? '' : v);
      return v;
    });
  };

  const handleSetCategory = (cat: string) => {
    setActiveCategory((prev) => {
      if (prev === cat) return prev;
      updateUrlParam('category', cat === 'All' ? '' : cat);
      return cat;
    });
  };

  const handleSetSearch = (q: string) => {
    setSearch((prev) => {
      if (prev === q) return prev;
      updateUrlParam('q', q);
      return q;
    });
  };

  // initialize from URL once on mount
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const currentTab = (params.get('tab') as string) || 'all';
      const currentCategory = (params.get('category') as string) || 'All';
      const currentQ = (params.get('q') as string) || '';
      if (currentTab === 'free' || currentTab === 'packages' || currentTab === 'enrolled' || currentTab === 'all') {
        setActiveView(currentTab as any);
      }
      setActiveCategory(currentCategory);
      setSearch(currentQ);
    } catch (e) {
      // ignore
    }
    const onPop = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const t = params.get('tab') || 'all';
        const c = params.get('category') || 'All';
        const q = params.get('q') || '';
        setActiveView((prev) => (prev === t ? prev : (t as any)));
        setActiveCategory((prev) => (prev === c ? prev : c));
        setSearch((prev) => (prev === q ? prev : q));
      } catch (e) {
        // ignore
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const { user, openAuthModal } = useAuth();
  const resolvedUserId = user?.id ?? student;
  const { data: userPurchases, refetch: refetchPurchases } = useQuery({
    queryKey: ["user-purchases", resolvedUserId],
    queryFn: async () => {
      if (!resolvedUserId) return [];
      const { data } = await supabase.from("user_purchases").select("*").eq("user_id", resolvedUserId);
      return data ?? [];
    },
    enabled: Boolean(resolvedUserId),
  });

  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [purchaseItem, setPurchaseItem] = useState<any>(null);
  const [purchaseItemType, setPurchaseItemType] = useState<"test" | "package">("test");
  const [packageViewerOpen, setPackageViewerOpen] = useState(false);
  const [packageViewerPackage, setPackageViewerPackage] = useState<any>(null);

  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "duration" | "questions">("newest");

  const { data: myAttempts } = useQuery({
    queryKey: ["my-attempts", resolvedUserId],
    queryFn: () => fetchStudentAttempts(resolvedUserId),
    enabled: Boolean(resolvedUserId),
  });

  const categories = ["All", ...Array.from(new Set((tests ?? []).map((t) => t.category)))];
  const visibleTests = useMemo(() => {
    const list = (tests ?? []).filter((t) => activeCategory === "All" || t.category === activeCategory);
    const q = search.trim().toLowerCase();
    const searched = q
      ? list.filter(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            t.subject.toLowerCase().includes(q) ||
            t.category.toLowerCase().includes(q),
        )
      : list;

    const sorted = [...searched].sort((a, b) => {
      if (sort === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sort === "duration") return Number(a.duration_minutes) - Number(b.duration_minutes);
      if (sort === "questions") return (b.questionCount ?? 0) - (a.questionCount ?? 0);
      return 0;
    });
    return sorted;
  }, [tests, activeCategory, search, sort]);

  const freeTests = (tests ?? []).filter((t) => (t as any).is_free === true || Number((t as any).price ?? 0) === 0);

  const packagesWithMeta = (packages ?? []).map((p: any) => {
    const included = (packageTests ?? []).filter((pt: any) => pt.package_id === p.id).map((pt: any) => pt.test_id);
    return { ...p, includedTests: included };
  });

  // derive purchased IDs and unlocked test IDs (direct + via packages)
  const { purchasedTestIds, purchasedPackageIds, unlockedIds, packageTestIds } = useMemo(() => {
    const purchased = (userPurchases ?? []).filter((up: any) => up.payment_status === 'completed');
    const purchasedTestIds = purchased.filter((up: any) => up.item_type === 'test').map((up: any) => up.item_id);
    const purchasedPackageIds = purchased.filter((up: any) => up.item_type === 'package').map((up: any) => up.item_id);
    const packageTestIds = (packageTests ?? []).map((pt: any) => pt.test_id);
    // tests unlocked because their package was purchased
    const unlockedFromPackages = (packageTests ?? [])
      .filter((pt: any) => purchasedPackageIds.includes(pt.package_id))
      .map((pt: any) => pt.test_id);

    const unlockedSet = new Set<string>([...purchasedTestIds, ...unlockedFromPackages]);
    return { purchasedTestIds, purchasedPackageIds, unlockedIds: unlockedSet, packageTestIds };
  }, [userPurchases, packageTests]);

  const hasPurchased = (itemType: "test" | "package", id: string) => {
    return (userPurchases ?? []).some((up: any) => up.item_type === itemType && up.item_id === id && up.payment_status === 'completed');
  };

  const openPurchaseModal = (item: any, type: "test" | "package") => {
    if (!user) {
      openAuthModal && openAuthModal();
      return;
    }
    setPurchaseItem(item);
    setPurchaseItemType(type);
    setPurchaseModalOpen(true);
  };

  const completePurchase = async (amount: number) => {
    if (!resolvedUserId || !purchaseItem) return;
    const payload = {
      user_id: resolvedUserId,
      item_type: purchaseItemType,
      item_id: purchaseItem.id,
      amount_paid: amount,
      payment_status: 'completed',
    } as any;
    const { error } = await supabase.from('user_purchases').insert(payload);
    if (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      return;
    }
    await refetchPurchases();
    setPurchaseModalOpen(false);
  };

  const openPackageViewer = (pkg: any) => {
    // if not logged in, prompt auth
    if (!user) {
      openAuthModal && openAuthModal();
      return;
    }
    setPackageViewerPackage(pkg);
    setPackageViewerOpen(true);
  };

  return (
    <div>
      {/* hero moved into right content to keep sidebar flush with left edge */}

      {/* Purchase modal (simple) */}
      {purchaseModalOpen && purchaseItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setPurchaseModalOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="font-display text-lg font-semibold">Unlock {purchaseItemType === 'test' ? 'Test' : 'Series'}</h3>
            <p className="text-sm text-muted-foreground mt-2">{purchaseItem.title}</p>
            {purchaseItemType === 'package' && (
              <div className="mt-3 text-sm">
                <div>{(purchaseItem.includedTests ?? purchaseItem.includedTests)?.length ?? 0} tests included</div>
              </div>
            )}
            <div className="mt-4">
              <div className="text-sm">Amount</div>
              <div className="text-2xl font-semibold mt-1">₹{(purchaseItem.discount_price ?? purchaseItem.price) ?? '—'}</div>
            </div>
            <div className="mt-6 flex gap-2">
              <Button onClick={() => setPurchaseModalOpen(false)} variant="outline">Cancel</Button>
              <Button onClick={() => completePurchase(Number(purchaseItem.discount_price ?? purchaseItem.price ?? 0))}>Complete Mock Payment &amp; Unlock</Button>
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
              <h3 className="font-display text-lg font-semibold">{packageViewerPackage.title} - Included Tests</h3>
              <Button variant="ghost" onClick={() => setPackageViewerOpen(false)}>Close</Button>
            </div>
            <div className="mt-4 space-y-4">
              {(packageTests ?? [])
                .filter((pt: any) => pt.package_id === packageViewerPackage.id)
                .map((pt: any) => {
                  const t = (tests ?? []).find((x: any) => x.id === pt.test_id);
                  if (!t) return null;
                  return (
                    <div key={t.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
                      <div>
                        <div className="font-semibold">{t.title}</div>
                        <div className="text-sm text-muted-foreground">{t.questionCount ?? 0} questions • {t.duration_minutes} min</div>
                      </div>
                      <div>
                        <Button asChild size="sm"><Link to="/test/$testId" params={{ testId: t.id }}>Take Test</Link></Button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

          <main id="tests" className="flex h-[calc(100vh-64px)] overflow-hidden">
          {/* Left sidebar */}
          <aside className="w-56 md:w-60 flex-shrink-0 bg-[#161a1e] border-r border-[#262c35] p-3 flex flex-col justify-between h-full overflow-y-auto">
            <div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase px-3 pt-3 pb-1">TESTS</div>
            <nav className="mt-2 flex flex-col gap-1">
              <button
                onClick={() => handleSetView('all')}
                className={activeView === 'all' ? 'bg-[#222831] text-cyan-400 font-semibold border-l-[3px] border-cyan-400 rounded-r-lg px-3 py-2 text-xs flex items-center gap-3' : 'text-slate-400 hover:text-slate-200 hover:bg-[#1e232a] rounded-lg px-3 py-2 text-xs font-medium transition-colors flex items-center gap-3'}
              >
                <FileText className="size-4" />
                <span>All Tests</span>
              </button>

              <button
                onClick={() => handleSetView('free')}
                className={activeView === 'free' ? 'bg-[#222831] text-cyan-400 font-semibold border-l-[3px] border-cyan-400 rounded-r-lg px-3 py-2 text-xs flex items-center gap-3' : 'text-slate-400 hover:text-slate-200 hover:bg-[#1e232a] rounded-lg px-3 py-2 text-xs font-medium transition-colors flex items-center gap-3'}
              >
                <Star className="size-4" />
                <span>Free Mock Tests</span>
              </button>

              <button
                onClick={() => handleSetView('packages')}
                className={activeView === 'packages' ? 'bg-[#222831] text-cyan-400 font-semibold border-l-[3px] border-cyan-400 rounded-r-lg px-3 py-2 text-xs flex items-center gap-3' : 'text-slate-400 hover:text-slate-200 hover:bg-[#1e232a] rounded-lg px-3 py-2 text-xs font-medium transition-colors flex items-center gap-3'}
              >
                <Trophy className="size-4" />
                <span>Test Series &amp; Combos</span>
              </button>

              <button
                onClick={() => handleSetView('enrolled')}
                className={activeView === 'enrolled' ? 'bg-[#222831] text-cyan-400 font-semibold border-l-[3px] border-cyan-400 rounded-r-lg px-3 py-2 text-xs flex items-center gap-3' : 'text-slate-400 hover:text-slate-200 hover:bg-[#1e232a] rounded-lg px-3 py-2 text-xs font-medium transition-colors flex items-center gap-3'}
              >
                <ShoppingBag className="size-4" />
                <span>My Enrolled / Purchased</span>
              </button>
            </nav>
            <div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase px-3 pt-3 pb-1 mt-4">STUDY MATERIAL</div>
            <nav className="mt-2 flex flex-col gap-1">
              <Link to="/attempted-tests" className="text-slate-400 hover:text-slate-200 hover:bg-[#1e232a] rounded-lg px-3 py-2 text-xs font-medium transition-colors flex items-center gap-3">
                <History className="size-4" />
                <span>Attempted Tests</span>
              </Link>

              <button className="text-slate-400 hover:text-slate-200 hover:bg-[#1e232a] rounded-lg px-3 py-2 text-xs font-medium transition-colors flex items-center gap-3">
                <BookOpen className="size-4" />
                <span>Study Notes</span>
                <span className="ml-auto bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">NEW</span>
              </button>
            </nav>
          </aside>

          {/* Right content */}
          <div className="flex-1 h-full overflow-y-auto bg-[#f8fafc] p-6 md:p-8 min-w-0">
            <section className="border-b border-border mb-6" style={{ background: 'var(--gradient-hero)' }}>
              <div className="mx-auto max-w-5xl px-6 py-5 rounded-2xl mb-6 text-left">
                <Badge className="mb-2 bg-white/15 text-primary-foreground hover:bg-white/20">Practice like the real exam</Badge>
                <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-primary-foreground">Mock tests with real ranks, not just right answers</h1>
                <p className="text-xs md:text-sm text-blue-100 mt-1.5 max-w-2xl leading-relaxed">Timed papers, negative marking, auto-submit and an instant scorecard with accuracy, rank, percentile and a comparison graph against every other student.</p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Button size="lg" variant="secondary" className="px-4 py-2 text-xs font-semibold rounded-lg shadow-sm">Browse tests</Button>
                  <Button asChild size="lg" variant="outline" className="px-4 py-2 text-xs font-semibold rounded-lg shadow-sm border-white/40 bg-transparent text-primary-foreground hover:bg-white/10">
                    <Link to="/admin"><Plus className="mr-1 size-4" /> Admin dashboard</Link>
                  </Button>
                </div>
              </div>
            </section>

            <h2 className="font-display text-xl font-semibold md:text-2xl">Available mock tests</h2>
            <p className="mt-1 text-sm text-muted-foreground">Pick a paper and start whenever you're ready. The timer starts on the first question.</p>

            <div className="mt-4 flex items-center justify-between gap-4">
              <div className="flex-1">
                <input
                  aria-label="Search tests"
                  value={search}
                  onChange={(e) => handleSetSearch(e.target.value)}
                  placeholder={activeView === 'packages' ? 'Search packages by title or category' : 'Search by title, subject or category'}
                  className="w-full h-10 text-xs rounded-xl border-slate-200 bg-white shadow-sm px-3"
                />
              </div>
              <div className="w-44">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as any)}
                  className="w-full h-10 text-xs rounded-xl border-slate-200 bg-white shadow-sm px-3"
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
                  className={activeCategory === c ? 'px-3.5 py-1.5 text-xs font-medium rounded-full transition-all border bg-blue-600 text-white border-blue-600 shadow-sm' : 'px-3.5 py-1.5 text-xs font-medium rounded-full transition-all border bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {isLoading && [0, 1].map((i) => <Skeleton key={i} className="h-44 w-full rounded-xl" />)}

              {/* Packages view strictly shows packages */}
              {activeView === 'packages' && (
                // Show packages first
                <>
                {packagesWithMeta
                .filter((p: any) => {
                  const q = search.trim().toLowerCase();
                  if (!q) return true;
                  return p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
                })
                .map((p: any) => {
                  const bought = hasPurchased('package', p.id);
                  const offerPrice = p.discount_price ?? p.price;
                  const savings = p.price && p.discount_price ? Math.round(((p.price - p.discount_price) / p.price) * 100) : 0;
                  return (
                    <article key={p.id} className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="font-display font-semibold">{p.title}</div>
                            <Badge variant="secondary">{p.category}</Badge>
                            {p.is_combo && <Badge>Combo Offer</Badge>}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">{p.description}</div>
                          <div className="mt-2 text-sm">
                            <span className="font-semibold">₹{offerPrice ?? '—'}</span>
                            {p.price && p.discount_price && <span className="text-xs text-muted-foreground line-through ml-2">₹{p.price}</span>}
                            {savings > 0 && <Badge variant="secondary" className="ml-2">{savings}% OFF</Badge>}
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">{p.includedTests.length} tests included</div>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          {bought ? (
                            <Button size="sm" className="bg-emerald-600 text-white" onClick={() => openPackageViewer(p)}>Access Series</Button>
                          ) : (
                            <Button size="sm" onClick={() => openPurchaseModal(p, 'package')}>Unlock Series / Buy Now</Button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
                {/* standalone paid tests not included in any package (and matching search) */}
                {(tests ?? [])
                  .filter((t) => {
                    const isPaid = !((t as any).is_free === true || Number((t as any).price ?? 0) === 0);
                    if (!isPaid) return false;
                    if ((packageTests ?? []).some((pt: any) => pt.test_id === t.id)) return false; // skip packaged tests
                    const q = search.trim().toLowerCase();
                    return !q || t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q);
                  })
                  .map((t) => {
                    const isPaid = !((t as any).is_free === true || Number((t as any).price ?? 0) === 0);
                    const bought = unlockedIds.has(t.id);
                    return (
                      <article key={t.id} className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
                        <div className="flex flex-wrap gap-2">
                          <Badge className="w-fit">{t.category}</Badge>
                          <Badge variant="secondary" className="w-fit">{t.subject}</Badge>
                          {isPaid && <Badge variant="destructive">PAID</Badge>}
                        </div>
                              <h3 className="mt-3 font-display text-lg font-semibold leading-snug">{t.title}</h3>
                              <div className="mt-2">
                                {t.discount_price && Number(t.discount_price) > 0 && Number(t.discount_price) < Number(t.price ?? 0) ? (
                                  <div className="flex items-center gap-3">
                                    <div className="text-2xl font-semibold">₹{t.discount_price}</div>
                                    <div className="line-through text-slate-400 text-sm">₹{t.price}</div>
                                    {t.price && t.discount_price && Number(t.price) > 0 && Number(t.discount_price) > 0 && (
                                      <div className="bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded text-xs">{Math.round(((Number(t.price) - Number(t.discount_price)) / Number(t.price)) * 100)}% OFF</div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-lg font-semibold">₹{t.price ?? '—'}</div>
                                )}
                              </div>
                        <div className="mt-3 text-sm text-muted-foreground">₹{(t as any).price ?? '—'}</div>
                        <div className="mt-4 flex items-end justify-end">
                          {bought ? (
                            <Button asChild size="sm"><Link to="/test/$testId" params={{ testId: t.id }}>Take test</Link></Button>
                          ) : (
                            <Button size="sm" onClick={() => openPurchaseModal(t, 'test')}>Unlock Test</Button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </>
              )}

              {/* Enrolled: show purchased packages first (if any) and handle empty purchased state */}
              {activeView === 'enrolled' && (purchasedPackageIds ?? []).length > 0 && (
                (packagesWithMeta ?? []).filter((p: any) => (purchasedPackageIds ?? []).includes(p.id)).map((p: any) => {
                  const offerPrice = p.discount_price ?? p.price;
                  const savings = p.price && p.discount_price ? Math.round(((p.price - p.discount_price) / p.price) * 100) : 0;
                  return (
                    <article key={p.id} className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="font-display font-semibold">{p.title}</div>
                            <Badge variant="secondary">{p.category}</Badge>
                            {p.is_combo && <Badge>Combo Offer</Badge>}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">{p.description}</div>
                          <div className="mt-2 text-sm">
                            <span className="font-semibold">₹{offerPrice ?? '—'}</span>
                            {p.price && p.discount_price && <span className="text-xs text-muted-foreground line-through ml-2">₹{p.price}</span>}
                            {savings > 0 && <Badge variant="secondary" className="ml-2">{savings}% OFF</Badge>}
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">{p.includedTests.length} tests included</div>
                        </div>
                          <div className="flex flex-col gap-2 items-end">
                          <Button size="sm" className="bg-emerald-600 text-white" onClick={() => openPackageViewer(p)}>Access Series</Button>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}

              {activeView === 'enrolled' && (unlockedIds.size === 0 && (purchasedPackageIds ?? []).length === 0) && (
                <div className="col-span-full">
                  <div className="mt-6 rounded-xl border border-border bg-card p-6 text-center">
                    <p className="text-sm text-muted-foreground">No purchased test series yet. Explore our test series and combo offers to unlock them.</p>
                    <div className="mt-4">
                      <Button onClick={() => setActiveView('packages')}>Explore Test Series &amp; Combos</Button>
                    </div>
                  </div>
                </div>
              )}

              {/* All / Free / Enrolled views operate on tests or purchases */}
              {(activeView === 'all' || activeView === 'free' || activeView === 'enrolled') && (
                (() => {
                  // derive the strict list depending on view
                  let list: TestWithStats[] = [];
                  if (activeView === 'all') {
                    list = tests ?? [];
                  } else if (activeView === 'free') {
                    list = (tests ?? []).filter((t) => (t as any).is_free === true || !((t as any).price) || Number((t as any).price) === 0);
                  } else if (activeView === 'enrolled') {
                    // strictly only items unlocked (direct purchase or via purchased packages)
                    list = (tests ?? []).filter((t) => unlockedIds.has(t.id));
                  }

                  // apply category/search/sort only for tests views
                  const q = search.trim().toLowerCase();
                  const filtered = list
                    .filter((t) => activeCategory === 'All' || t.category === activeCategory)
                    .filter((t) => (q ? t.title.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q) || t.category.toLowerCase().includes(q) : true))
                    .sort((a, b) => {
                      if (sort === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                      if (sort === 'duration') return Number(a.duration_minutes) - Number(b.duration_minutes);
                      if (sort === 'questions') return (b.questionCount ?? 0) - (a.questionCount ?? 0);
                      return 0;
                    });

                  return filtered.map((t) => {
                    const used = (myAttempts ?? []).filter((a) => a.test_id === t.id).length;
                    const limitReached = t.max_attempts !== null && used >= t.max_attempts;
                    const isPaid = !((t as any).is_free === true || Number((t as any).price ?? 0) === 0);
                    const purchased = unlockedIds.has(t.id);
                    return (
                      <article key={t.id} className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
                        <div className="flex flex-wrap gap-2">
                          <Badge className="w-fit">{t.category}</Badge>
                          <Badge variant="secondary" className="w-fit">{t.subject}</Badge>
                          {isPaid && <Badge variant="destructive">PAID</Badge>}
                        </div>
                        <h3 className="mt-3 font-display text-lg font-semibold leading-snug">{t.title}</h3>
                        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2"><Clock className="size-4" /> {t.duration_minutes} min</div>
                          <div className="flex items-center gap-2"><FileText className="size-4" /> {t.questionCount} questions</div>
                          <div className="flex items-center gap-2"><Trophy className="size-4" /> +{t.positive_marks} / −{t.negative_marks}</div>
                          <div className="flex items-center gap-2"><Users className="size-4" /> {t.attemptCount} attempts</div>
                        </dl>
                        <div className="mt-3">
                          <Badge variant={limitReached ? 'destructive' : 'outline'} className="w-fit"><Repeat className="mr-1 size-3" />Attempts: {used}/{t.max_attempts === null ? '∞' : t.max_attempts}</Badge>
                        </div>

                        {limitReached ? (
                          <Button className="mt-5 w-full" disabled>Attempt limit reached</Button>
                        ) : isPaid ? (
                          purchased ? (
                            <Button asChild className="mt-5 w-full"><Link to="/test/$testId" params={{ testId: t.id }}>Start Test</Link></Button>
                          ) : (
                            <Button className="mt-5 w-full" onClick={() => openPurchaseModal(t, 'test')}>Unlock Test</Button>
                          )
                        ) : (
                          <Button asChild className="mt-5 w-full" disabled={t.questionCount === 0}><Link to="/test/$testId" params={{ testId: t.id }}>{t.questionCount === 0 ? 'No questions yet' : used > 0 ? 'Retake test' : 'Take test'}</Link></Button>
                        )}
                      </article>
                    );
                  });
                })()
              )}

              {/* fallback empty state for tests */}
              {((activeView === 'all' || activeView === 'free' || activeView === 'enrolled') && (tests ?? []).length > 0) || (activeView === 'packages' && (packagesWithMeta ?? []).length > 0) ? null : (
                <p className="text-sm text-muted-foreground">No items to show for this view.</p>
              )}
            </div>
          </div>
      </main>
    </div>
  );
}
