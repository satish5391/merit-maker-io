import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pencil, Plus, Trash2, X, Megaphone } from "lucide-react";
import { DEFAULT_ADVERTISEMENTS, HeroCarousel, SidebarPromotions, type Advertisement } from "@/components/RankdonPromotions";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { useAuth } from "@/context/AuthContext";
import { ADMIN_EMAILS } from "@/lib/admin-access";
import { supabase } from "@/integrations/supabase/client";
import { fetchTests, fetchQuestions } from "@/lib/mock-test";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Create & Edit Mock Tests | Rankdon" },
      {
        name: "description",
        content:
          "Create and edit mock tests with exam categories, custom duration, positive and negative marking, explanations and attempt limits.",
      },
      { property: "og:title", content: "Admin Dashboard — Rankdon" },
      {
        property: "og:description",
        content: "Create, edit and delete mock tests by exam category with full marking control.",
      },
    ],
  }),
  component: Admin,
});

type Draft = {
  body: string;
  options: string[];
  correct_index: number;
  explanation: string;
  sectionId?: string;
};

const emptyDraft = (): Draft => ({
  body: "",
  options: ["", "", "", ""],
  correct_index: 0,
  explanation: "",
});

const CATEGORY_SUGGESTIONS = [
  "Junior Assistant",
  "FAA Exam",
  "Banking",
  "SSC",
  "Railways",
  "General",
];

const BULK_UPLOAD_HEADERS = [
  "section",
  "question_text",
  "option_a",
  "option_b",
  "option_c",
  "option_d",
  "correct_answer",
  "marks",
  "negative_marks",
  "explanation",
];

function Admin() {
  const { user, loading } = useAuth();
  const email = user?.email?.trim().toLowerCase() ?? "";

  if (loading) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-muted-foreground">Checking admin access...</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="rounded-xl border border-border bg-card p-6 text-center shadow-[var(--shadow-card)]">
          <h1 className="text-xl font-semibold">Access Denied — Please Log In</h1>
          <p className="mt-2 text-sm text-muted-foreground">You must be logged in to access the Admin panel.</p>
          <Button asChild className="mt-6"><Link to="/">Back to Home</Link></Button>
        </div>
      </div>
    );
  }

  if (!ADMIN_EMAILS.includes(email)) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="rounded-xl border border-border bg-card p-6 text-center shadow-[var(--shadow-card)]">
          <h1 className="text-xl font-semibold">Unauthorized Access</h1>
          <p className="mt-2 text-sm text-muted-foreground">You do not have administrative privileges to view this page.</p>
          <Button asChild className="mt-6"><Link to="/">Back to Home</Link></Button>
        </div>
      </div>
    );
  }

  return <AdminDashboard />;
}

const emptyAd = (): Omit<Advertisement, "id" | "created_at"> => ({
  title: "",
  subtitle: "",
  badge_text: "Featured",
  image_url: "",
  cta_text: "Explore Now",
  cta_link: "/",
  placement: "hero_carousel",
  is_external: false,
  is_active: true,
  gradient_theme: "blue_glow",
  display_order: 0,
});

function AdvertisementManager() {
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyAd());
  const { data: ads = [], isLoading } = useQuery({
    queryKey: ["advertisements", "admin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("advertisements").select("*").order("display_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Advertisement[];
    },
  });

  const saveAd = useMutation({
    mutationFn: async () => {
      if (!form.title.trim() || !form.cta_link.trim()) throw new Error("Title and CTA link are required");
      const payload = { ...form, title: form.title.trim(), subtitle: form.subtitle?.trim() || null, cta_link: form.cta_link.trim() };
      const result = editingId
        ? await supabase.from("advertisements").update(payload).eq("id", editingId)
        : await supabase.from("advertisements").insert(payload);
      if (result.error) throw result.error;
    },
    onSuccess: () => {
      toast.success(editingId ? "Promotion updated" : "Promotion published");
      setEditingId(null);
      setForm(emptyAd());
      void qc.invalidateQueries({ queryKey: ["advertisements"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const toggleAd = useMutation({
    mutationFn: async (ad: Advertisement) => {
      const { error } = await supabase.from("advertisements").update({ is_active: !ad.is_active }).eq("id", ad.id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["advertisements"] }),
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteAd = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("advertisements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Promotion deleted"); void qc.invalidateQueries({ queryKey: ["advertisements"] }); },
    onError: (error: Error) => toast.error(error.message),
  });

  const update = (key: keyof typeof form, value: string | boolean | number) => setForm((current) => ({ ...current, [key]: value }));
  const previewAd = { ...form, id: "preview", created_at: "" } as Advertisement;

  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between gap-3"><div><h3 className="font-display text-lg font-semibold">{editingId ? "Edit promotion" : "New promotion"}</h3><p className="mt-1 text-sm text-muted-foreground">Publish to the learner portal with a live preview.</p></div><Megaphone className="size-5 text-cyan-600" /></div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label htmlFor="ad-title">Title</Label><Input id="ad-title" value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Exam Prep Masterclass" className="mt-1.5" /></div>
            <div className="sm:col-span-2"><Label htmlFor="ad-subtitle">Subtitle</Label><Textarea id="ad-subtitle" value={form.subtitle ?? ""} onChange={(e) => update("subtitle", e.target.value)} placeholder="A sharper practice loop for your next rank." className="mt-1.5" /></div>
            <div><Label htmlFor="ad-badge">Badge text</Label><Input id="ad-badge" value={form.badge_text} onChange={(e) => update("badge_text", e.target.value)} className="mt-1.5" /></div>
            <div><Label htmlFor="ad-cta">CTA text</Label><Input id="ad-cta" value={form.cta_text} onChange={(e) => update("cta_text", e.target.value)} className="mt-1.5" /></div>
            <div className="sm:col-span-2"><Label htmlFor="ad-link">CTA link</Label><Input id="ad-link" value={form.cta_link} onChange={(e) => update("cta_link", e.target.value)} placeholder="/?tab=packages or https://partner.example" className="mt-1.5" /><label className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_external} onChange={(e) => update("is_external", e.target.checked)} /> Open as external affiliate link</label></div>
            <div><Label htmlFor="ad-placement">Placement</Label><select id="ad-placement" value={form.placement} onChange={(e) => update("placement", e.target.value)} className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="hero_carousel">Hero carousel</option><option value="sidebar_banner">Sidebar banner</option><option value="inline_card">Inline card</option><option value="floating_bar">Floating bar</option></select></div>
            <div><Label htmlFor="ad-theme">Gradient theme</Label><select id="ad-theme" value={form.gradient_theme} onChange={(e) => update("gradient_theme", e.target.value)} className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="blue_glow">Blue glow</option><option value="purple_magic">Purple magic</option><option value="sunset_amber">Sunset amber</option><option value="emerald_pro">Emerald pro</option></select></div>
            <div><Label htmlFor="ad-image">Image URL (optional)</Label><Input id="ad-image" value={form.image_url} onChange={(e) => update("image_url", e.target.value)} className="mt-1.5" /></div>
            <div><Label htmlFor="ad-order">Display order</Label><Input id="ad-order" type="number" value={form.display_order} onChange={(e) => update("display_order", Number(e.target.value))} className="mt-1.5" /></div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2"><Button onClick={() => saveAd.mutate()} disabled={saveAd.isPending}>{saveAd.isPending ? "Publishing..." : editingId ? "Save promotion" : "Publish promotion"}</Button>{editingId && <Button variant="outline" onClick={() => { setEditingId(null); setForm(emptyAd()); }}>Cancel edit</Button>}</div>
        </section>
        <section className="space-y-3"><div className="flex items-center justify-between"><h3 className="font-display text-lg font-semibold">Live preview</h3><Badge variant="secondary">Updates as you type</Badge></div>{form.placement === "sidebar_banner" ? <SidebarPromotions ads={[previewAd]} /> : <HeroCarousel ads={[previewAd]} />}</section>
      </div>
      <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"><div className="flex items-center justify-between"><div><h3 className="font-display text-lg font-semibold">Published promotions</h3><p className="mt-1 text-sm text-muted-foreground">Manage every campaign across the portal.</p></div><Badge>{ads.length} live records</Badge></div>{isLoading ? <p className="mt-5 text-sm text-muted-foreground">Loading promotions...</p> : <div className="mt-5 space-y-3">{ads.length === 0 && <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">No saved promotions yet. Rankdon is using its default campaign cards.</p>}{ads.map((ad) => <div key={ad.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4"><div><div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{ad.title}</span><Badge variant="secondary">{ad.placement}</Badge><Badge variant={ad.is_active ? "default" : "outline"}>{ad.is_active ? "Active" : "Paused"}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{ad.cta_link} · order {ad.display_order}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => { setEditingId(ad.id); setForm({ ...ad }); }}>Edit</Button><Button size="sm" variant="outline" onClick={() => toggleAd.mutate(ad)}>{ad.is_active ? "Pause" : "Activate"}</Button><Button size="sm" variant="destructive" onClick={() => deleteAd.mutate(ad.id)}><Trash2 className="size-4" /></Button></div></div>)}</div>}</section>
      <p className="text-xs text-muted-foreground">Default campaigns remain available on the home page when no active records exist: {DEFAULT_ADVERTISEMENTS.length} fallback cards configured.</p>
    </div>
  );
}

function AdminDashboard() {
  const qc = useQueryClient();
  const { data: tests } = useQuery({ queryKey: ["tests"], queryFn: fetchTests });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("General");
  const [subject, setSubject] = useState("General");
  const [duration, setDuration] = useState(10);
  const [positive, setPositive] = useState(2);
  const [negative, setNegative] = useState(0.5);
  const [cutoff, setCutoff] = useState<number | "">("");
  const [cutoffMax, setCutoffMax] = useState<number | "">("");
  const [maxAttempts, setMaxAttempts] = useState<string>("1");
  const [accessType, setAccessType] = useState<"free" | "paid" | "package_only">("free");
  const [price, setPrice] = useState<number | "">("");
  const [discountPrice, setDiscountPrice] = useState<number | "">("");
  const [questions, setQuestions] = useState<Draft[]>([emptyDraft()]);
  const [sections, setSections] = useState(
    [{ id: `section-${Date.now()}`, name: "Default", subject: subject, duration_minutes: duration }],
  );
  const [sectionalTiming, setSectionalTiming] = useState(false);

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setCategory("General");
    setSubject("General");
    setDuration(10);
    setPositive(2);
    setNegative(0.5);
    setCutoff("");
    setCutoffMax("");
    setAccessType("free");
    setPrice("");
    setDiscountPrice("");
    setMaxAttempts("1");
    setQuestions([emptyDraft()]);
    setSections([{ id: `section-${Date.now()}`, name: "Default", subject: subject, duration_minutes: duration }]);
    setSectionalTiming(false);
  };

  const parsedAttempts = () =>
    maxAttempts.trim().toLowerCase() === "unlimited" || maxAttempts.trim() === ""
      ? null
      : Math.max(1, Number(maxAttempts));

  const validQuestions = () =>
    questions.filter((q) => q.body.trim() && q.options.every((o) => o.trim().length > 0));

  const saveTest = useMutation({
    mutationFn: async () => {
      const valid = validQuestions();
      if (!title.trim()) throw new Error("Test title is required");
      if (valid.length === 0) throw new Error("Add at least one complete question");

      const payload = {
        title: title.trim(),
        category: category.trim() || "General",
        subject: subject.trim() || "General",
        duration_minutes: duration,
        positive_marks: positive,
        negative_marks: negative,
        cutoff: cutoff === "" ? null : Number(cutoff),
        cutoff_max:
          cutoffMax === ""
            ? cutoff === ""
              ? null
              : Math.round(Number(cutoff) * 1.15) || Number(cutoff) + 1
            : Number(cutoffMax),
        access_type: accessType,
        is_free: accessType === "free",
        price: accessType === "paid" ? (price === "" ? null : Number(price)) : null,
        discount_price: accessType === "paid" ? (discountPrice === "" ? null : Number(discountPrice)) : null,
        max_attempts: parsedAttempts(),
        sectional_timing: sectionalTiming,
        sections: sections,
      };

      let testId = editingId;

      if (editingId) {
        const { error } = await supabase.from("tests").update(payload).eq("id", editingId);
        if (error) throw error;
        const { error: delErr } = await supabase
          .from("questions")
          .delete()
          .eq("test_id", editingId);
        if (delErr) throw delErr;
      } else {
        const { data: test, error } = await supabase
          .from("tests")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        testId = test.id;
      }

      const { error: qErr } = await supabase.from("questions").insert(
        valid.map((q, i) => ({
          test_id: testId!,
          position: i + 1,
          body: q.body.trim(),
          options: q.options.map((o) => o.trim()),
          correct_index: q.correct_index,
          explanation: q.explanation.trim(),
          section_id: q.sectionId ?? sections[0].id,
        })),
      );
      if (qErr) throw qErr;
      return testId!;
    },
    onSuccess: (testId) => {
      toast.success(editingId ? "Test updated" : "Test created");
      resetForm();
      qc.invalidateQueries({ queryKey: ["tests"] });
      qc.invalidateQueries({ queryKey: ["tests-with-stats"] });
      qc.invalidateQueries({ queryKey: ["questions", testId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const startEdit = async (testId: string) => {
    const test = tests?.find((t) => t.id === testId);
    if (!test) return;
    try {
      const qs = await qc.fetchQuery({
        queryKey: ["questions", testId],
        queryFn: () => fetchQuestions(testId),
      });
      setEditingId(test.id);
      setTitle(test.title);
      setCategory(test.category ?? "General");
      setSubject(test.subject);
      setDuration(test.duration_minutes);
      setPositive(Number(test.positive_marks));
      setNegative(Number(test.negative_marks));
      setCutoff((test as any).cutoff ?? "");
      setCutoffMax((test as any).cutoff_max ?? "");
      setAccessType((test as any).access_type ?? ((test as any).is_free === false ? "paid" : "free"));
      setPrice((test as any).price ?? "");
      setDiscountPrice((test as any).discount_price ?? "");
      setMaxAttempts(test.max_attempts === null ? "Unlimited" : String(test.max_attempts));
      setQuestions(
        qs.length
          ? qs.map((q) => ({
              body: q.body,
              options: q.options.length ? q.options : ["", "", "", ""],
              correct_index: q.correct_index,
              explanation: q.explanation ?? "",
              sectionId: (q as any).section_id ?? undefined,
            }))
          : [emptyDraft()],
      );
      // load sections if present on test
      const rawSections = (test as any).sections;
      if (Array.isArray(rawSections) && rawSections.length > 0) setSections(rawSections);
      setSectionalTiming(Boolean((test as any).sectional_timing));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load test");
    }
  };

  const deleteTest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Test deleted");
      resetForm();
      qc.invalidateQueries({ queryKey: ["tests"] });
      qc.invalidateQueries({ queryKey: ["tests-with-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const patch = (i: number, next: Partial<Draft>) =>
    setQuestions((prev) => prev.map((q, idx) => (idx === i ? { ...q, ...next } : q)));

  const downloadBulkTemplate = () => {
    const worksheet = XLSX.utils.aoa_to_sheet([
      BULK_UPLOAD_HEADERS,
      ["Default", "What is 2 + 2?", "3", "4", "5", "6", "B", "2", "0.5", "Add the numbers together."],
    ]);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sample-questions-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const importBulkQuestions = async (file: File) => {
    if (!editingId) {
      toast.error("Save or select a test before importing questions.");
      return;
    }

    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: "" });
      const normalizedRows = rows.map((row) =>
        Object.fromEntries(Object.entries(row).map(([key, value]) => [key.trim().toLowerCase(), String(value ?? "").trim()])),
      );
      const invalidRows: number[] = [];
      const parsedQuestions = normalizedRows.flatMap((row, index) => {
        const options = [row.option_a, row.option_b, row.option_c, row.option_d];
        if (!row.question_text || options.some((option) => !option) || !row.correct_answer) {
          invalidRows.push(index + 2);
          return [];
        }

        const answer = row.correct_answer.toLowerCase();
        const letterIndex = ["a", "b", "c", "d"].indexOf(answer.replace(/[^a-d]/g, ""));
        const numericIndex = Number(answer) - 1;
        const textIndex = options.findIndex((option) => option.toLowerCase() === answer);
        const correctIndex = letterIndex >= 0 ? letterIndex : numericIndex >= 0 && numericIndex < 4 ? numericIndex : textIndex;
        if (correctIndex < 0 || correctIndex > 3) {
          invalidRows.push(index + 2);
          return [];
        }

        const sectionName = row.section || sections[0]?.name || "Default";
        const section = sections.find((item) => item.id === sectionName || item.name.trim().toLowerCase() === sectionName.toLowerCase());
        return [{
          test_id: editingId,
          position: questions.length + index + 1,
          body: row.question_text,
          options,
          correct_index: correctIndex,
          explanation: row.explanation || "",
          section_id: section?.id ?? sections[0]?.id,
        }];
      });

      if (invalidRows.length) {
        throw new Error(`Invalid required fields or correct answer in row(s): ${invalidRows.join(", ")}`);
      }
      if (!parsedQuestions.length) throw new Error("The file contains no question rows.");

      const { error } = await supabase.from("questions").insert(parsedQuestions);
      if (error) throw error;
      setQuestions((previous) => [
        ...previous.filter((question) => question.body.trim()),
        ...parsedQuestions.map((question) => ({
          body: question.body,
          options: question.options,
          correct_index: question.correct_index,
          explanation: question.explanation,
          sectionId: question.section_id,
        })),
      ]);
      qc.invalidateQueries({ queryKey: ["questions", editingId] });
      toast.success(`Successfully imported ${parsedQuestions.length} questions!`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not import questions");
    }
  };

  // Packages & combos manager state
  const [activeTab, setActiveTab] = useState<'tests' | 'packages' | 'notes' | 'ads'>('tests');
  const [pkgTitle, setPkgTitle] = useState('');
  const [pkgDescription, setPkgDescription] = useState('');
  const [pkgCategory, setPkgCategory] = useState('General');
  const [pkgPrice, setPkgPrice] = useState<number | ''>('');
  const [pkgDiscountPrice, setPkgDiscountPrice] = useState<number | ''>('');
  const [pkgIsCombo, setPkgIsCombo] = useState(false);
  const [pkgSelectedTests, setPkgSelectedTests] = useState<string[]>([]);

  const { data: packagesData, refetch: refetchPackages } = useQuery({
    queryKey: ['packages-with-links'],
    queryFn: async () => {
      const { data: packages } = await supabase.from('test_packages').select('*');
      const { data: links } = await supabase.from('package_tests').select('*');
      return { packages: packages ?? [], links: links ?? [] };
    },
  });

  const createPackage = useMutation({
    mutationFn: async () => {
      const payload = {
        title: pkgTitle.trim(),
        description: pkgDescription.trim(),
        category: pkgCategory.trim() || 'General',
        price: pkgPrice === '' ? null : Number(pkgPrice),
        discount_price: pkgDiscountPrice === '' ? null : Number(pkgDiscountPrice),
        is_combo: Boolean(pkgIsCombo),
        is_active: true,
      };

      const { data: pkg, error } = await supabase.from('test_packages').insert(payload).select().single();
      if (error) throw error;
      const packageId = pkg.id;
      if (pkgSelectedTests.length) {
        const links = pkgSelectedTests.map((tId) => ({ package_id: packageId, test_id: tId }));
        const { error: linkErr } = await supabase.from('package_tests').insert(links);
        if (linkErr) throw linkErr;
      }
      return pkg;
    },
    onSuccess: () => {
      toast.success('Package created');
      // reset package form
      setPkgTitle('');
      setPkgDescription('');
      setPkgCategory('General');
      setPkgPrice('');
      setPkgDiscountPrice('');
      setPkgIsCombo(false);
      setPkgSelectedTests([]);
      void refetchPackages();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deletePackage = useMutation({
    mutationFn: async (id: string) => {
      const { error: delLinks } = await supabase.from('package_tests').delete().eq('package_id', id);
      if (delLinks) throw delLinks;
      const { error } = await supabase.from('test_packages').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Package deleted');
      void refetchPackages();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-2xl font-bold md:text-3xl">Admin dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Create, edit and delete mock tests with exam categories, marking schemes, explanations and
        attempt limits.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-lg font-semibold">
              {editingId ? "Edit test" : "New test"}
            </h2>
            {editingId && (
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X className="mr-1 size-4" /> Cancel edit
              </Button>
            )}
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="title">Test title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Reasoning Mock Test 2"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="category">Exam category</Label>
              <Input
                id="category"
                list="category-options"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Junior Assistant"
                className="mt-1.5"
              />
              <datalist id="category-options">
                {Array.from(
                  new Set([...(tests ?? []).map((t) => t.category), ...CATEGORY_SUGGESTIONS]),
                ).map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min={1}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="attempts">Max attempts allowed</Label>
              <Input
                id="attempts"
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(e.target.value)}
                placeholder="1 or Unlimited"
                className="mt-1.5"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Enter a number, or type "Unlimited" for no limit.
              </p>
            </div>
            <div>
              <Label htmlFor="pos">Marks per correct answer</Label>
              <Input
                id="pos"
                type="number"
                step="0.25"
                min={0}
                value={positive}
                onChange={(e) => setPositive(Number(e.target.value))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="neg">Negative marks per wrong answer</Label>
              <Input
                id="neg"
                type="number"
                step="0.25"
                min={0}
                value={negative}
                onChange={(e) => setNegative(Number(e.target.value))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="cutoff">Qualifying / Expected Cutoff Score</Label>
              <Input
                id="cutoff"
                type="number"
                min={0}
                value={cutoff}
                onChange={(e) => setCutoff(e.target.value === "" ? "" : Number(e.target.value))}
                className="mt-1.5"
                placeholder="Optional: absolute cutoff score"
              />
              <p className="mt-1 text-xs text-muted-foreground">If empty, cutoff defaults to 40% of max marks.</p>
            </div>
            <div>
              <Label htmlFor="cutoffMax">Upper bound for cutoff (optional)</Label>
              <Input
                id="cutoffMax"
                type="number"
                min={0}
                value={cutoffMax}
                onChange={(e) => setCutoffMax(e.target.value === "" ? "" : Number(e.target.value))}
                className="mt-1.5"
                placeholder="Optional: upper bound for cutoff range"
              />
              <p className="mt-1 text-xs text-muted-foreground">If empty, upper bound is auto-calculated (+15% of lower bound).</p>
            </div>
            <div>
              <Label>Test Type</Label>
              <div className="mt-1 flex items-center gap-3">
                <label className="flex items-center gap-2">
                  <input type="radio" name="test-type" checked={accessType === "free"} onChange={() => setAccessType("free")} />
                  <span className="text-sm">Free (Accessible to everyone)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="test-type" checked={accessType === "paid"} onChange={() => setAccessType("paid")} />
                  <span className="text-sm">Paid (Standalone)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="test-type" checked={accessType === "package_only"} onChange={() => setAccessType("package_only")} />
                  <span className="text-sm">Package Only (Combo Exclusive)</span>
                </label>
              </div>

              {accessType === "paid" && (
                <div className="mt-3 grid gap-2">
                  <Label htmlFor="price">Original Price (₹)</Label>
                  <Input id="price" type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))} />
                  <Label htmlFor="discountPrice">Discount / Offer Price (₹)</Label>
                  <Input id="discountPrice" type="number" min={0} value={discountPrice} onChange={(e) => setDiscountPrice(e.target.value === "" ? "" : Number(e.target.value))} />
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 space-y-5">
            <h3 className="font-display text-base font-semibold">Questions</h3>
            <div className="mt-3 rounded-lg border border-border bg-background p-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Sections</h4>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSections((s) => [...s, { id: `section-${Date.now()}`, name: `Section ${s.length + 1}`, subject, duration_minutes: duration }])}
                >
                  <Plus className="mr-1 size-4" /> Add section
                </Button>
              </div>
              <div className="mt-3 space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={sectionalTiming} onChange={(e) => setSectionalTiming(e.target.checked)} />
                  <span>Enable sectional timing</span>
                </label>
                {sections.map((s, idx) => (
                  <div key={s.id} className="grid gap-2 sm:grid-cols-3 items-center">
                    <Input value={s.name} onChange={(e) => setSections((prev) => prev.map((ps, i) => i === idx ? { ...ps, name: e.target.value } : ps))} />
                    <Input value={s.subject ?? subject} onChange={(e) => setSections((prev) => prev.map((ps, i) => i === idx ? { ...ps, subject: e.target.value } : ps))} />
                    <Input type="number" value={s.duration_minutes} onChange={(e) => setSections((prev) => prev.map((ps, i) => i === idx ? { ...ps, duration_minutes: Number(e.target.value) } : ps))} />
                    <div>
                      <Button variant="ghost" size="sm" onClick={() => setSections((prev) => prev.filter((_, i) => i !== idx))}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {questions.map((q, i) => (
              <div key={i} className="rounded-lg border border-border bg-background p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Question {i + 1}</span>
                  {questions.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuestions((prev) => prev.filter((_, idx) => idx !== i))}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
                <Textarea
                  value={q.body}
                  onChange={(e) => patch(i, { body: e.target.value })}
                  placeholder="Enter the question"
                  className="mt-2"
                />
                <div className="mt-2">
                  <Label>Assign section</Label>
                  <select className="mt-1 w-full" value={q.sectionId ?? sections[0]?.id} onChange={(e) => patch(i, { sectionId: e.target.value })}>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {q.options.map((opt, oi) => (
                    <label key={oi} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${i}`}
                        checked={q.correct_index === oi}
                        onChange={() => patch(i, { correct_index: oi })}
                        className="size-4 accent-[var(--primary)]"
                        aria-label={`Mark option ${oi + 1} correct`}
                      />
                      <Input
                        value={opt}
                        onChange={(e) =>
                          patch(i, {
                            options: q.options.map((o, idx) =>
                              idx === oi ? e.target.value : o,
                            ),
                          })
                        }
                        placeholder={`Option ${oi + 1}`}
                      />
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Select the radio next to the correct option.
                </p>
                <div className="mt-3">
                  <Label htmlFor={`explanation-${i}`}>Answer explanation / solution</Label>
                  <Textarea
                    id={`explanation-${i}`}
                    value={q.explanation}
                    onChange={(e) => patch(i, { explanation: e.target.value })}
                    placeholder="Explain how the correct answer is derived…"
                    className="mt-1.5 min-h-24"
                  />
                </div>
              </div>
            ))}

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => setQuestions((prev) => [...prev, { ...emptyDraft(), sectionId: sections[0]?.id }])}
              >
                <Plus className="mr-1 size-4" /> Add question
              </Button>
              <Button type="button" variant="outline" onClick={downloadBulkTemplate}>
                Download Sample CSV Template
              </Button>
              <label className="inline-flex cursor-pointer items-center rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted">
                Bulk Upload CSV / Excel
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void importBulkQuestions(file);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
            </div>
          </div>

          <Button
            className="mt-8 w-full"
            size="lg"
            onClick={() => saveTest.mutate()}
            disabled={saveTest.isPending}
          >
            {saveTest.isPending
              ? "Saving…"
              : editingId
                ? "Save changes"
                : "Create test"}
          </Button>
        </section>

        <section>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Admin</h2>
            <div className="flex gap-2">
              <button className={`px-3 py-1 rounded ${activeTab === 'tests' ? 'bg-primary text-white' : 'bg-transparent'}`} onClick={() => setActiveTab('tests')}>Manage Tests & Questions</button>
              <button className={`px-3 py-1 rounded ${activeTab === 'packages' ? 'bg-primary text-white' : 'bg-transparent'}`} onClick={() => setActiveTab('packages')}>Manage Packages & Combos</button>
              <button className={`px-3 py-1 rounded ${activeTab === 'notes' ? 'bg-primary text-white' : 'bg-transparent'}`} onClick={() => setActiveTab('notes')}>Study Materials / Notes</button>
              <button className={`px-3 py-1 rounded ${activeTab === 'ads' ? 'bg-primary text-white' : 'bg-transparent'}`} onClick={() => setActiveTab('ads')}>Promotions</button>
            </div>
          </div>

          {activeTab === 'tests' && (
            <div className="mt-3">
              <h3 className="sr-only">Existing tests</h3>
              <Accordion type="single" collapsible className="mt-3">
                {tests?.map((t) => (
                  <AccordionItem key={t.id} value={t.id}>
                    <AccordionTrigger className="text-left">
                      <span className="pr-2">{t.title}</span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <Badge>{t.category}</Badge>
                        <Badge variant="secondary">{t.subject}</Badge>
                        <Badge variant="secondary">{t.duration_minutes} min</Badge>
                        <Badge variant="secondary">
                          +{t.positive_marks} / −{t.negative_marks}
                        </Badge>
                        <Badge variant="secondary">
                          {t.max_attempts === null
                            ? "Unlimited attempts"
                            : `${t.max_attempts} attempt(s)`}
                        </Badge>
                      </div>
                      <QuestionList testId={t.id} />
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => void startEdit(t.id)}>
                          <Pencil className="mr-1 size-4" /> Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteTest.mutate(t.id)}
                        >
                          <Trash2 className="mr-1 size-4" /> Delete test
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              {tests && tests.length === 0 && (
                <p className="mt-3 text-sm text-muted-foreground">No tests created yet.</p>
              )}
            </div>
          )}

          {activeTab === 'packages' && (
            <div className="mt-3 space-y-4">
              <h3 className="font-display text-sm font-semibold">Create Package / Combo</h3>
              <div className="rounded-lg border border-border bg-background p-4">
                <div className="grid gap-2">
                  <Label htmlFor="pkgTitle">Package Title</Label>
                  <Input id="pkgTitle" value={pkgTitle} onChange={(e) => setPkgTitle(e.target.value)} />
                  <Label htmlFor="pkgDescription">Description</Label>
                  <Textarea id="pkgDescription" value={pkgDescription} onChange={(e) => setPkgDescription(e.target.value)} />
                  <Label htmlFor="pkgCategory">Category</Label>
                  <Input id="pkgCategory" list="pkg-category-options" value={pkgCategory} onChange={(e) => setPkgCategory(e.target.value)} />
                  <datalist id="pkg-category-options">
                    {Array.from(new Set([...(tests ?? []).map((t) => t.category), ...CATEGORY_SUGGESTIONS])).map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="pkgPrice">Original Price (₹)</Label>
                      <Input id="pkgPrice" type="number" min={0} value={pkgPrice} onChange={(e) => setPkgPrice(e.target.value === '' ? '' : Number(e.target.value))} />
                    </div>
                    <div>
                      <Label htmlFor="pkgDiscountPrice">Offer / Discount Price (₹)</Label>
                      <Input id="pkgDiscountPrice" type="number" min={0} value={pkgDiscountPrice} onChange={(e) => setPkgDiscountPrice(e.target.value === '' ? '' : Number(e.target.value))} />
                    </div>
                  </div>

                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={pkgIsCombo} onChange={(e) => setPkgIsCombo(e.target.checked)} />
                    <span>Is Combo Offer?</span>
                  </label>

                  <div>
                    <Label>Select Included Tests</Label>
                    <div className="mt-2 max-h-40 overflow-auto border p-2 rounded">
                      {(tests ?? []).map((t) => (
                        <label key={t.id} className="flex items-center gap-2 mb-1">
                          <input
                            type="checkbox"
                            checked={pkgSelectedTests.includes(t.id)}
                            onChange={(e) => setPkgSelectedTests((prev) => e.target.checked ? [...prev, t.id] : prev.filter((id) => id !== t.id))}
                          />
                          <span className="text-sm">{t.title}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => createPackage.mutate()} disabled={createPackage.isPending}>Create package</Button>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-display text-sm font-semibold">Existing Packages</h4>
                <div className="mt-2 space-y-2">
                  {packagesData?.packages.length ? packagesData.packages.map((p: any) => {
                    const linkedCount = packagesData.links.filter((l: any) => l.package_id === p.id).length;
                    return (
                      <div key={p.id} className="rounded-lg border border-border bg-card p-3 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="font-medium">{p.title}</div>
                            <Badge variant="secondary">{p.category}</Badge>
                            {p.is_combo && <Badge>Combo</Badge>}
                          </div>
                          <div className="text-sm text-muted-foreground">{p.description}</div>
                          <div className="mt-1">
                            <span className="text-sm font-semibold">₹{p.discount_price ?? p.price}</span>
                            {p.price && p.discount_price && (
                              <span className="text-xs text-muted-foreground line-through ml-2">₹{p.price}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-sm text-muted-foreground">{linkedCount} tests</div>
                          <Button size="sm" variant="destructive" onClick={() => deletePackage.mutate(p.id)}>Delete</Button>
                        </div>
                      </div>
                    );
                  }) : (
                    <p className="text-sm text-muted-foreground">No packages yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notes' && <StudyMaterialsManager />}
          {activeTab === 'ads' && <AdvertisementManager />}
        </section>
      </div>
    </div>
  );
}

type StudyNote = {
  id: string;
  title: string;
  description: string;
  category: string;
  file_url: string;
  is_free: boolean;
  created_at: string;
};

function StudyMaterialsManager() {
  const qc = useQueryClient();
  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["study-notes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("study_notes").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as StudyNote[];
    },
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General Awareness");
  const [fileUrl, setFileUrl] = useState("");
  const [isFree, setIsFree] = useState(true);

  const reset = () => {
    setEditingId(null); setTitle(""); setDescription(""); setCategory("General Awareness"); setFileUrl(""); setIsFree(true);
  };
  const save = async () => {
    if (!title.trim() || !fileUrl.trim()) { toast.error("Title and resource URL are required"); return; }
    const payload = { title: title.trim(), description: description.trim(), category: category.trim() || "General", file_url: fileUrl.trim(), is_free: isFree };
    const result = editingId
      ? await supabase.from("study_notes").update(payload).eq("id", editingId)
      : await supabase.from("study_notes").insert(payload);
    if (result.error) { toast.error(result.error.message); return; }
    toast.success(editingId ? "Note updated" : "Note published"); reset(); void qc.invalidateQueries({ queryKey: ["study-notes"] });
  };
  const edit = (note: StudyNote) => { setEditingId(note.id); setTitle(note.title); setDescription(note.description); setCategory(note.category); setFileUrl(note.file_url); setIsFree(note.is_free); };
  const remove = async (id: string) => {
    const { error } = await supabase.from("study_notes").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Note deleted"); void qc.invalidateQueries({ queryKey: ["study-notes"] }); }
  };

  return (
    <div className="mt-3 space-y-4">
      <h3 className="font-display text-sm font-semibold">{editingId ? "Update study material" : "Add study material"}</h3>
      <div className="rounded-lg border border-border bg-background p-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label htmlFor="note-title">Note Title</Label><Input id="note-title" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div><Label htmlFor="note-category">Category</Label><Input id="note-category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="SSC CGL, Maths, Reasoning" /></div>
        </div>
        <div><Label htmlFor="note-description">Description</Label><Textarea id="note-description" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
        <div><Label htmlFor="note-url">PDF / resource URL</Label><Input id="note-url" type="url" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="https://.../study-notes.pdf" /></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} /> Free for students</label>
        <div className="flex gap-2"><Button onClick={() => void save()}>{editingId ? "Update Note" : "Publish Note"}</Button>{editingId && <Button variant="outline" onClick={reset}>Cancel</Button>}</div>
      </div>
      <div className="space-y-2">
        <h3 className="font-display text-sm font-semibold">Published materials</h3>
        {isLoading && <p className="text-sm text-muted-foreground">Loading notes...</p>}
        {notes.map((note) => <div key={note.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-3"><div><div className="flex flex-wrap gap-2"><span className="font-medium">{note.title}</span><Badge variant="secondary">{note.category}</Badge><Badge variant={note.is_free ? "secondary" : "destructive"}>{note.is_free ? "FREE" : "PAID"}</Badge></div><p className="text-sm text-muted-foreground">{note.description}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => edit(note)}>Edit</Button><Button size="sm" variant="destructive" onClick={() => void remove(note.id)}>Delete</Button></div></div>)}
        {!isLoading && notes.length === 0 && <p className="text-sm text-muted-foreground">No study materials published yet.</p>}
      </div>
    </div>
  );
}

function QuestionList({ testId }: { testId: string }) {
  const { data } = useQuery({
    queryKey: ["questions", testId],
    queryFn: () => fetchQuestions(testId),
  });
  return (
    <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
      {data?.map((q) => <li key={q.id}>{q.body}</li>)}
    </ol>
  );
}
