import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import {
  Pencil,
  Plus,
  Trash2,
  X,
  Megaphone,
  Search,
  Users,
  FileText,
  Package,
  BookOpen,
  Sparkles,
  Clock,
  CheckCircle2,
  Layers,
  Upload,
  Download,
  AlertCircle,
  ShieldCheck,
  Bell,
  Gift,
  KeyRound,
  Check,
} from "lucide-react";
import {
  DEFAULT_ADVERTISEMENTS,
  HeroCarousel,
  type Advertisement,
} from "@/components/RankdonPromotions";
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
  sectionId: string;
};

const emptyDraft = (): Draft => ({
  body: "",
  options: ["", "", "", ""],
  correct_index: 0,
  explanation: "",
  sectionId: "section-default",
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
  const { user, profile, loading } = useAuth();
  const email = user?.email?.trim().toLowerCase() ?? "";

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <span className="size-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <span className="text-sm font-medium">Verifying admin credentials...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <AlertCircle className="size-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Access Denied</h1>
          <p className="mt-2 text-sm text-slate-500">
            Please log in with an administrator account to access the control panel.
          </p>
          <Button asChild className="mt-6 w-full bg-blue-600 hover:bg-blue-700">
            <Link to="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isAdmin =
    (profile as any)?.role === "admin" ||
    (typeof ADMIN_EMAILS !== "undefined" && ADMIN_EMAILS.includes(email));

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-20">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <ShieldCheck className="size-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Unauthorized Access</h1>
          <p className="mt-2 text-sm text-slate-500">
            Your account (<strong className="text-slate-700">{email}</strong>) does not have administrative permissions.
          </p>
          <Button asChild variant="outline" className="mt-6 w-full">
            <Link to="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <AdminDashboard />;
}

function AdminDashboard() {
  const qc = useQueryClient();
  const { data: tests, isLoading: isLoadingTests } = useQuery({
    queryKey: ["tests"],
    queryFn: fetchTests,
  });

  const [activeTab, setActiveTab] = useState<"tests" | "packages" | "notes" | "ads" | "users">("tests");
  const [testSearch, setTestSearch] = useState("");

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
  const [isLive, setIsLive] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [resultDeclarationTime, setResultDeclarationTime] = useState("");
  const [sections, setSections] = useState([
    { id: `section-${Date.now()}`, name: "Default", subject: subject, duration_minutes: duration },
  ]);
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
    setIsLive(false);
    setStartTime("");
    setEndTime("");
    setResultDeclarationTime("");
    setSections([
      {
        id: `section-${Date.now()}`,
        name: "Default",
        subject: "General",
        duration_minutes: 10,
      },
    ]);
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
      if (isLive && (!startTime || !endTime || !resultDeclarationTime))
        throw new Error("Live tests require all schedule dates");
      if (isLive && new Date(endTime) <= new Date(startTime))
        throw new Error("Live window end must be after its start");
      if (isLive && new Date(resultDeclarationTime) < new Date(endTime))
        throw new Error("Results cannot be declared before the live window ends");

      const payload: Record<string, any> = {
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
        discount_price:
          accessType === "paid" ? (discountPrice === "" ? null : Number(discountPrice)) : null,
        max_attempts: parsedAttempts(),
        sectional_timing: sectionalTiming,
        sections: sections,
        is_live: isLive,
        start_time: isLive ? new Date(startTime).toISOString() : null,
        end_time: isLive ? new Date(endTime).toISOString() : null,
        result_declaration_time: isLive ? new Date(resultDeclarationTime).toISOString() : null,
      };

      let testId = editingId;

      if (editingId) {
        const { error } = await (supabase as any).from("tests").update(payload).eq("id", editingId);
        if (error) throw error;
        const { error: delErr } = await (supabase as any)
          .from("questions")
          .delete()
          .eq("test_id", editingId);
        if (delErr) throw delErr;
      } else {
        const { data: test, error } = await (supabase as any)
          .from("tests")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        testId = test.id;
      }

      const defaultSecId = sections[0]?.id || "section-default";
      const { error: qErr } = await (supabase as any).from("questions").insert(
        valid.map((q, i) => ({
          test_id: testId!,
          position: i + 1,
          body: q.body.trim(),
          options: q.options.map((o) => String(o ?? "").trim()),
          correct_index: q.correct_index,
          explanation: q.explanation.trim(),
          section_id: q.sectionId || defaultSecId,
        })),
      );
      if (qErr) throw qErr;
      return testId!;
    },
    onSuccess: (testId) => {
      toast.success(editingId ? "Test updated successfully" : "Test published successfully");
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
      setAccessType(
        (test as any).access_type ?? ((test as any).is_free === false ? "paid" : "free"),
      );
      setPrice((test as any).price ?? "");
      setDiscountPrice((test as any).discount_price ?? "");
      setMaxAttempts(test.max_attempts === null ? "Unlimited" : String(test.max_attempts));
      setIsLive(Boolean((test as any).is_live));
      setStartTime(
        (test as any).start_time
          ? new Date((test as any).start_time).toISOString().slice(0, 16)
          : "",
      );
      setEndTime(
        (test as any).end_time ? new Date((test as any).end_time).toISOString().slice(0, 16) : "",
      );
      setResultDeclarationTime(
        (test as any).result_declaration_time
          ? new Date((test as any).result_declaration_time).toISOString().slice(0, 16)
          : "",
      );
      setQuestions(
        qs.length
          ? qs.map((q) => ({
              body: q.body,
              options: q.options.length ? q.options : ["", "", "", ""],
              correct_index: q.correct_index,
              explanation: q.explanation ?? "",
              sectionId: String((q as any).section_id ?? sections[0]?.id ?? "section-default"),
            }))
          : [emptyDraft()],
      );
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
      const { error } = await (supabase as any).from("tests").delete().eq("id", id);
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
      [
        "Default",
        "What is 2 + 2?",
        "3",
        "4",
        "5",
        "6",
        "B",
        "2",
        "0.5",
        "Add the numbers together.",
      ],
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
      const fileData = await file.arrayBuffer();
      const workbook = XLSX.read(fileData, {
        type: "array",
        raw: true,
      });
      const sheetName = Array.isArray(workbook?.SheetNames) ? workbook.SheetNames[0] : null;
      if (!sheetName) throw new Error("No sheet found in uploaded file.");

      const firstSheet = workbook.Sheets[sheetName];
      if (!firstSheet) throw new Error("Could not read worksheet.");

      // CRITICAL FIX: SheetJS isolates any cell starting with '=' into cell.f and leaves cell.v as undefined.
      // This restores the formula string into cell.v so sheet_to_json reads the literal option text.
      for (const cellKey of Object.keys(firstSheet)) {
        if (cellKey.startsWith("!")) continue;
        const cell = firstSheet[cellKey];
        if (cell && cell.f && (cell.v === undefined || cell.v === null || cell.v === "")) {
          cell.v = `=${cell.f}`;
          cell.w = `=${cell.f}`;
          cell.t = "s";
        }
      }

      const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(firstSheet, {
        defval: "",
        raw: false,
      });

      const normalizedRows: Record<string, string>[] = rawRows.map((row) => {
        const out: Record<string, string> = {};
        for (const key of Object.keys(row || {})) {
          out[key.trim().toLowerCase()] = String(row[key] ?? "").trim();
        }
        return out;
      });

      const invalidRows: number[] = [];
      const parsedQuestions: any[] = [];

      normalizedRows.forEach((row, index) => {
        const qText = String(row["question_text"] ?? "").trim();
        const optA = String(row["option_a"] ?? "").trim();
        const optB = String(row["option_b"] ?? "").trim();
        const optC = String(row["option_c"] ?? "").trim();
        const optD = String(row["option_d"] ?? "").trim();
        const rawAns = String(row["correct_answer"] ?? "").toLowerCase().trim();

        // 1. Skip completely empty or trailing blank lines
        if (!qText && !optA && !optB && !optC && !optD && !rawAns) {
          return;
        }

        // 2. Validate mandatory fields
        if (!qText || !optA || !optB || !optC || !optD || !rawAns) {
          invalidRows.push(index + 2);
          return;
        }

        const options: string[] = [optA, optB, optC, optD];
        const cleanAns = rawAns.replace(/[^a-d1-4]/g, "");
        let correctIndex = -1;

        if (cleanAns === "a" || cleanAns === "1") correctIndex = 0;
        else if (cleanAns === "b" || cleanAns === "2") correctIndex = 1;
        else if (cleanAns === "c" || cleanAns === "3") correctIndex = 2;
        else if (cleanAns === "d" || cleanAns === "4") correctIndex = 3;
        else {
          correctIndex = options.findIndex((opt) => opt.toLowerCase().trim() === rawAns);
        }

        if (correctIndex < 0 || correctIndex > 3) {
          invalidRows.push(index + 2);
          return;
        }

        const sectionName = String(row["section"] ?? "").trim();
        const matchedSection = sections.find(
          (s: any) =>
            s.id === sectionName ||
            String(s.name ?? "").toLowerCase() === sectionName.toLowerCase(),
        );

        parsedQuestions.push({
          test_id: editingId,
          position: questions.length + parsedQuestions.length + 1,
          body: qText,
          options,
          correct_index: correctIndex,
          explanation: String(row["explanation"] ?? "").trim(),
          section_id: matchedSection?.id ?? sections[0]?.id ?? "section-default",
        });
      });

      if (invalidRows.length > 0) {
        throw new Error(`Invalid required fields in row(s): ${invalidRows.join(", ")}`);
      }

      if (parsedQuestions.length === 0) {
        throw new Error("The file contains no valid question rows.");
      }

      const { error } = await (supabase as any).from("questions").insert(parsedQuestions);
      if (error) throw error;

      setQuestions((previous) => [
        ...previous.filter((q) => q.body.trim()),
        ...parsedQuestions.map((q) => ({
          body: String(q.body),
          options: (q.options as string[]).map((o) => String(o ?? "")),
          correct_index: Number(q.correct_index),
          explanation: String(q.explanation ?? ""),
          sectionId: String(q.section_id),
        })),
      ]);

      qc.invalidateQueries({ queryKey: ["questions", editingId] });
      toast.success(`Successfully imported ${parsedQuestions.length} questions!`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not import questions");
    }
  };

  const filteredTests = (tests ?? []).filter((t) => {
    const q = testSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      t.title.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Top Header Banner */}
      <div className="border-b border-slate-200 bg-white shadow-xs">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-blue-600 font-bold text-white shadow-xs text-xs">
                  ⚡
                </span>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Admin Control Center</h1>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Design mock exams, configure negative marking rules, manage packages, and control student accounts.
              </p>
            </div>
          </div>

          {/* Clean Segmented Tab Navigation */}
          <div className="mt-6 flex flex-wrap gap-2 border-b border-slate-100 pb-2">
            {[
              { id: "tests", label: "Tests & Questions", icon: FileText },
              { id: "packages", label: "Packages & Combos", icon: Package },
              { id: "notes", label: "Study Materials", icon: BookOpen },
              { id: "ads", label: "Promotions", icon: Sparkles },
              { id: "users", label: "User Management", icon: Users },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/20"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                  }`}
                >
                  <Icon className="size-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {activeTab === "tests" && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Left Column: Create & Edit Test Form */}
            <div className="lg:col-span-6 space-y-6">
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      {editingId ? <Pencil className="size-4" /> : <Plus className="size-4" />}
                    </div>
                    <div>
                      <h2 className="font-display font-semibold text-slate-900">
                        {editingId ? "Edit Test Configuration" : "Create New Test"}
                      </h2>
                      <p className="text-xs text-slate-500">Define marking rules and test structure.</p>
                    </div>
                  </div>
                  {editingId && (
                    <Button variant="ghost" size="sm" onClick={resetForm} className="text-xs text-slate-500 hover:text-slate-900">
                      <X className="mr-1 size-3.5" /> Cancel Edit
                    </Button>
                  )}
                </div>

                <div className="mt-5 space-y-4">
                  {/* Title */}
                  <div>
                    <Label htmlFor="title" className="text-xs font-semibold text-slate-700">Test Title</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Reasoning Tier 1 Mock Test 02"
                      className="mt-1.5 h-10 rounded-xl"
                    />
                  </div>

                  {/* Category & Subject */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="category" className="text-xs font-semibold text-slate-700">Exam Category</Label>
                      <Input
                        id="category"
                        list="category-options"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="e.g. SSC CGL"
                        className="mt-1.5 h-10 rounded-xl"
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
                      <Label htmlFor="subject" className="text-xs font-semibold text-slate-700">Subject</Label>
                      <Input
                        id="subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="e.g. General Intelligence"
                        className="mt-1.5 h-10 rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Duration & Marking */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor="duration" className="text-xs font-semibold text-slate-700">Duration (Mins)</Label>
                      <Input
                        id="duration"
                        type="number"
                        min={1}
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                        className="mt-1.5 h-10 rounded-xl"
                      />
                    </div>
                    <div>
                      <Label htmlFor="pos" className="text-xs font-semibold text-slate-700">+ Mark / Right</Label>
                      <Input
                        id="pos"
                        type="number"
                        step="0.25"
                        min={0}
                        value={positive}
                        onChange={(e) => setPositive(Number(e.target.value))}
                        className="mt-1.5 h-10 rounded-xl"
                      />
                    </div>
                    <div>
                      <Label htmlFor="neg" className="text-xs font-semibold text-slate-700">- Mark / Wrong</Label>
                      <Input
                        id="neg"
                        type="number"
                        step="0.25"
                        min={0}
                        value={negative}
                        onChange={(e) => setNegative(Number(e.target.value))}
                        className="mt-1.5 h-10 rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Cutoff Settings */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="cutoff" className="text-xs font-semibold text-slate-700">Expected Cutoff Score</Label>
                      <Input
                        id="cutoff"
                        type="number"
                        min={0}
                        value={cutoff}
                        onChange={(e) => setCutoff(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="Auto (40% default)"
                        className="mt-1.5 h-10 rounded-xl"
                      />
                    </div>
                    <div>
                      <Label htmlFor="attempts" className="text-xs font-semibold text-slate-700">Max Attempt Limit</Label>
                      <Input
                        id="attempts"
                        value={maxAttempts}
                        onChange={(e) => setMaxAttempts(e.target.value)}
                        placeholder="1 or Unlimited"
                        className="mt-1.5 h-10 rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Test Access & Pricing Box */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                    <Label className="text-xs font-semibold text-slate-800">Test Access Type</Label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: "free", label: "Free For All" },
                        { id: "paid", label: "Paid (Standalone)" },
                        { id: "package_only", label: "Combo / Package Exclusive" },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setAccessType(item.id as any)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all ${
                            accessType === item.id
                              ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    {accessType === "paid" && (
                      <div className="mt-3 grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                        <div>
                          <Label htmlFor="price" className="text-xs text-slate-600">Original Price (₹)</Label>
                          <Input
                            id="price"
                            type="number"
                            min={0}
                            value={price}
                            onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
                            placeholder="e.g. 199"
                            className="mt-1 h-9 rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <Label htmlFor="discountPrice" className="text-xs text-slate-600">Offer Price (₹)</Label>
                          <Input
                            id="discountPrice"
                            type="number"
                            min={0}
                            value={discountPrice}
                            onChange={(e) => setDiscountPrice(e.target.value === "" ? "" : Number(e.target.value))}
                            placeholder="e.g. 99"
                            className="mt-1 h-9 rounded-lg bg-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Live Test Window */}
                  <div className="rounded-xl border border-cyan-200 bg-cyan-50/40 p-4">
                    <label className="flex items-center gap-2.5 text-xs font-bold text-cyan-900 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isLive}
                        onChange={(e) => {
                          const enabled = e.target.checked;
                          setIsLive(enabled);
                          if (enabled) setSectionalTiming(false);
                        }}
                        className="size-4 rounded text-blue-600"
                      />
                      <span>Enable Live Test Schedule (Time-Bound)</span>
                    </label>

                    {isLive && (
                      <div className="mt-3 grid gap-3 sm:grid-cols-3 pt-3 border-t border-cyan-200/60">
                        <div>
                          <Label htmlFor="live-start" className="text-[11px] font-semibold text-cyan-900">Window Start</Label>
                          <Input
                            id="live-start"
                            type="datetime-local"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="mt-1 h-8 text-xs rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <Label htmlFor="live-end" className="text-[11px] font-semibold text-cyan-900">Window End</Label>
                          <Input
                            id="live-end"
                            type="datetime-local"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="mt-1 h-8 text-xs rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <Label htmlFor="result-declaration" className="text-[11px] font-semibold text-cyan-900">Result Declaration</Label>
                          <Input
                            id="result-declaration"
                            type="datetime-local"
                            value={resultDeclarationTime}
                            onChange={(e) => setResultDeclarationTime(e.target.value)}
                            className="mt-1 h-8 text-xs rounded-lg bg-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Section Configuration */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="size-4 text-slate-500" />
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Exam Sections</h4>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setSections((s) => [
                            ...s,
                            {
                              id: `section-${Date.now()}`,
                              name: `Section ${s.length + 1}`,
                              subject,
                              duration_minutes: duration,
                            },
                          ])
                        }
                        className="h-7 text-xs"
                      >
                        <Plus className="mr-1 size-3" /> Add Section
                      </Button>
                    </div>

                    <div className="mt-3 space-y-2">
                      <label className="flex items-center gap-2 text-xs text-slate-600">
                        <input
                          type="checkbox"
                          checked={sectionalTiming}
                          disabled={isLive}
                          onChange={(e) => setSectionalTiming(e.target.checked)}
                          className="size-3.5 rounded text-blue-600"
                        />
                        <span>Enforce strict sectional timing timers</span>
                      </label>

                      {sections.map((s, idx) => (
                        <div key={s.id} className="flex items-center gap-2 rounded-lg bg-slate-50 p-2 text-xs">
                          <Input
                            value={s.name}
                            onChange={(e) =>
                              setSections((prev) =>
                                prev.map((ps, i) => (i === idx ? { ...ps, name: e.target.value } : ps)),
                              )
                            }
                            placeholder="Section Name"
                            className="h-8 bg-white"
                          />
                          <Input
                            value={s.subject ?? subject}
                            onChange={(e) =>
                              setSections((prev) =>
                                prev.map((ps, i) => (i === idx ? { ...ps, subject: e.target.value } : ps)),
                              )
                            }
                            placeholder="Subject"
                            className="h-8 bg-white"
                          />
                          <Input
                            type="number"
                            value={s.duration_minutes}
                            onChange={(e) =>
                              setSections((prev) =>
                                prev.map((ps, i) =>
                                  i === idx ? { ...ps, duration_minutes: Number(e.target.value) } : ps,
                                ),
                              )
                            }
                            placeholder="Mins"
                            className="h-8 w-20 bg-white"
                          />
                          {sections.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSections((prev) => prev.filter((_, i) => i !== idx))}
                              className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Question Editor Area */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-800 text-sm">Question Bank ({questions.length})</h3>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={downloadBulkTemplate}
                          className="h-7 text-xs"
                        >
                          <Download className="mr-1 size-3" /> Template
                        </Button>
                        <label className="inline-flex cursor-pointer items-center rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium hover:bg-slate-50">
                          <Upload className="mr-1 size-3" /> Import Excel/CSV
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

                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                      {questions.map((q, i) => (
                        <div key={i} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-xs space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-700">Question #{i + 1}</span>
                            {questions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setQuestions((prev) => prev.filter((_, idx) => idx !== i))}
                                className="text-slate-400 hover:text-rose-600"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            )}
                          </div>

                          <Textarea
                            value={q.body}
                            onChange={(e) => patch(i, { body: e.target.value })}
                            placeholder="Type the question content or problem statement here..."
                            className="bg-white min-h-[60px]"
                          />

                          <div className="grid grid-cols-2 gap-2">
                            {q.options.map((opt, oi) => (
                              <div
                                key={oi}
                                className={`flex items-center gap-2 rounded-lg border p-1.5 transition-all bg-white ${
                                  q.correct_index === oi ? "border-emerald-500 ring-1 ring-emerald-500/20" : "border-slate-200"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`correct-${i}`}
                                  checked={q.correct_index === oi}
                                  onChange={() => patch(i, { correct_index: oi })}
                                  className="size-3.5 accent-emerald-600"
                                />
                                <input
                                  value={opt}
                                  onChange={(e) =>
                                    patch(i, {
                                      options: q.options.map((o, idx) => (idx === oi ? e.target.value : o)),
                                    })
                                  }
                                  placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                                  className="w-full text-xs outline-none bg-transparent"
                                />
                              </div>
                            ))}
                          </div>

                          <div>
                            <Textarea
                              value={q.explanation}
                              onChange={(e) => patch(i, { explanation: e.target.value })}
                              placeholder="Step-by-step solution / explanation (Optional)..."
                              className="bg-white min-h-[50px] text-xs"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setQuestions((prev) => [
                          ...prev,
                          { ...emptyDraft(), sectionId: String(sections[0]?.id || "section-default") },
                        ])
                      }
                      className="w-full text-xs"
                    >
                      <Plus className="mr-1 size-3.5" /> Add Another Question
                    </Button>
                  </div>

                  <Button
                    onClick={() => saveTest.mutate()}
                    disabled={saveTest.isPending}
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-xs"
                  >
                    {saveTest.isPending
                      ? "Saving..."
                      : editingId
                        ? "Update Test"
                        : "Save & Publish Mock Test"}
                  </Button>
                </div>
              </section>
            </div>

            {/* Right Column: Published Tests Inventory */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                  <Input
                    placeholder="Search tests by title, subject or exam..."
                    value={testSearch}
                    onChange={(e) => setTestSearch(e.target.value)}
                    className="pl-9 h-9 text-xs rounded-xl border-slate-200 bg-slate-50 focus:bg-white"
                  />
                </div>
                <Badge variant="secondary" className="px-3 py-1 font-semibold">
                  {filteredTests.length} Tests
                </Badge>
              </div>

              {isLoadingTests ? (
                <div className="flex h-40 items-center justify-center rounded-2xl border border-slate-200 bg-white">
                  <span className="size-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                </div>
              ) : filteredTests.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
                  No mock tests match your search criteria.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTests.map((t) => {
                    const isPaid = (t as any).is_free === false || (t as any).access_type === "paid";
                    return (
                      <div
                        key={t.id}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-slate-300"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-slate-900">{t.title}</span>
                              {isPaid ? (
                                <Badge className="bg-rose-50 text-rose-700 border-rose-200">
                                  PAID ₹{(t as any).discount_price ?? (t as any).price ?? "—"}
                                </Badge>
                              ) : (
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">FREE</Badge>
                              )}
                              <Badge variant="outline">{t.category}</Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <Clock className="size-3.5 text-slate-400" /> {t.duration_minutes} mins
                              </span>
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="size-3.5 text-emerald-600" /> +{t.positive_marks} / -{t.negative_marks}
                              </span>
                              <span className="text-slate-400">• Subject: {t.subject}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void startEdit(t.id)}
                              className="h-8 rounded-lg text-xs"
                            >
                              <Pencil className="mr-1 size-3" /> Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteTest.mutate(t.id)}
                              className="h-8 w-8 p-0 rounded-lg"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* Expandable Question Preview */}
                        <div className="mt-3 border-t border-slate-100 pt-3">
                          <Accordion type="single" collapsible>
                            <AccordionItem value="qs" className="border-none">
                              <AccordionTrigger className="py-0 text-xs text-blue-600 hover:no-underline">
                                View Questions for this Test
                              </AccordionTrigger>
                              <AccordionContent className="pt-2">
                                <QuestionList testId={t.id} />
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "packages" && <PackagesManager />}
        {activeTab === "notes" && <StudyMaterialsManager />}
        {activeTab === "ads" && <AdvertisementManager />}
        {activeTab === "users" && <UserManagement />}
      </div>
    </div>
  );
}

function PackagesManager() {
  const qc = useQueryClient();
  const { data: tests } = useQuery({ queryKey: ["tests"], queryFn: fetchTests });
  const [pkgTitle, setPkgTitle] = useState("");
  const [pkgDescription, setPkgDescription] = useState("");
  const [pkgCategory, setPkgCategory] = useState("General");
  const [pkgPrice, setPkgPrice] = useState<number | "">("");
  const [pkgDiscountPrice, setPkgDiscountPrice] = useState<number | "">("");
  const [pkgIsCombo, setPkgIsCombo] = useState(false);
  const [pkgSelectedTests, setPkgSelectedTests] = useState<string[]>([]);

  const { data: packagesData, refetch: refetchPackages } = useQuery({
    queryKey: ["packages-with-links"],
    queryFn: async () => {
      const { data: packages } = await (supabase as any).from("test_packages").select("*");
      const { data: links } = await (supabase as any).from("package_tests").select("*");
      return { packages: packages ?? [], links: links ?? [] };
    },
  });

  const createPackage = useMutation({
    mutationFn: async () => {
      const payload = {
        title: pkgTitle.trim(),
        description: pkgDescription.trim(),
        category: pkgCategory.trim() || "General",
        price: pkgPrice === "" ? null : Number(pkgPrice),
        discount_price: pkgDiscountPrice === "" ? null : Number(pkgDiscountPrice),
        is_combo: Boolean(pkgIsCombo),
        is_active: true,
      };

      const { data: pkg, error } = await (supabase as any)
        .from("test_packages")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      const packageId = pkg.id;
      if (pkgSelectedTests.length) {
        const links = pkgSelectedTests.map((tId) => ({ package_id: packageId, test_id: tId }));
        const { error: linkErr } = await (supabase as any).from("package_tests").insert(links);
        if (linkErr) throw linkErr;
      }
      return pkg;
    },
    onSuccess: () => {
      toast.success("Package created successfully");
      setPkgTitle("");
      setPkgDescription("");
      setPkgCategory("General");
      setPkgPrice("");
      setPkgDiscountPrice("");
      setPkgIsCombo(false);
      setPkgSelectedTests([]);
      void refetchPackages();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deletePackage = useMutation({
    mutationFn: async (id: string) => {
      const { error: delLinks } = await (supabase as any)
        .from("package_tests")
        .delete()
        .eq("package_id", id);
      if (delLinks) throw delLinks;
      const { error } = await (supabase as any).from("test_packages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Package deleted");
      void refetchPackages();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      {/* Create Package Form */}
      <div className="lg:col-span-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Package className="size-5 text-blue-600" />
            <h3 className="font-semibold text-slate-900">Create Test Series Package</h3>
          </div>

          <div>
            <Label htmlFor="pkgTitle" className="text-xs font-semibold text-slate-700">Package Title</Label>
            <Input
              id="pkgTitle"
              value={pkgTitle}
              onChange={(e) => setPkgTitle(e.target.value)}
              placeholder="e.g. SSC CGL Complete Mock Series 2026"
              className="mt-1 h-9 text-xs rounded-xl"
            />
          </div>

          <div>
            <Label htmlFor="pkgDescription" className="text-xs font-semibold text-slate-700">Description</Label>
            <Textarea
              id="pkgDescription"
              value={pkgDescription}
              onChange={(e) => setPkgDescription(e.target.value)}
              placeholder="Detailed overview of tests included in this bundle..."
              className="mt-1 min-h-[60px] text-xs rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="pkgPrice" className="text-xs font-semibold text-slate-700">Price (₹)</Label>
              <Input
                id="pkgPrice"
                type="number"
                min={0}
                value={pkgPrice}
                onChange={(e) => setPkgPrice(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="1299"
                className="mt-1 h-9 text-xs rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="pkgDiscountPrice" className="text-xs font-semibold text-slate-700">Offer Price (₹)</Label>
              <Input
                id="pkgDiscountPrice"
                type="number"
                min={0}
                value={pkgDiscountPrice}
                onChange={(e) => setPkgDiscountPrice(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="899"
                className="mt-1 h-9 text-xs rounded-xl"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
            <input
              type="checkbox"
              checked={pkgIsCombo}
              onChange={(e) => setPkgIsCombo(e.target.checked)}
              className="size-3.5 rounded text-blue-600"
            />
            <span>Mark as Combo Offer (Featured Badge)</span>
          </label>

          <div>
            <Label className="text-xs font-semibold text-slate-700">Select Mock Tests to Include</Label>
            <div className="mt-1.5 max-h-48 overflow-y-auto rounded-xl border border-slate-200 p-2 space-y-1 bg-slate-50">
              {(tests ?? []).map((t) => (
                <label key={t.id} className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-white text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pkgSelectedTests.includes(t.id)}
                    onChange={(e) =>
                      setPkgSelectedTests((prev) =>
                        e.target.checked ? [...prev, t.id] : prev.filter((id) => id !== t.id),
                      )
                    }
                    className="size-3.5 rounded text-blue-600"
                  />
                  <span className="truncate text-slate-800 font-medium">{t.title}</span>
                </label>
              ))}
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => createPackage.mutate()}
            disabled={createPackage.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 text-xs font-semibold"
          >
            {createPackage.isPending ? "Creating..." : "Publish Package"}
          </Button>
        </div>
      </div>

      {/* Existing Packages List */}
      <div className="lg:col-span-7 space-y-3">
        <h4 className="font-bold text-slate-900 text-sm">Published Series & Combos</h4>
        {packagesData?.packages.length ? (
          packagesData.packages.map((p: any) => {
            const linkedCount = packagesData.links.filter((l: any) => l.package_id === p.id).length;
            return (
              <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{p.title}</span>
                    <Badge variant="outline">{p.category}</Badge>
                    {p.is_combo && <Badge className="bg-cyan-50 text-cyan-700 border-cyan-200">Combo</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{p.description}</p>
                  <div className="mt-2 text-xs">
                    <span className="font-bold text-slate-900">₹{p.discount_price ?? p.price}</span>
                    {p.price && p.discount_price && (
                      <span className="text-slate-400 line-through ml-2">₹{p.price}</span>
                    )}
                    <span className="ml-3 text-slate-500">• {linkedCount} Tests included</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deletePackage.mutate(p.id)}
                  className="h-8 rounded-lg text-xs"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
            No package series created yet.
          </div>
        )}
      </div>
    </div>
  );
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
  banner_type: "standard",
  gradient_theme: "blue_glow",
  display_order: 0,
});

function AdvertisementManager() {
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyAd());
  const { data: ads = [] } = useQuery({
    queryKey: ["advertisements", "admin"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("advertisements")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Advertisement[];
    },
  });

  const saveAd = useMutation({
    mutationFn: async () => {
      if (form.banner_type === "direct_image") {
        if (!form.image_url.trim() || !form.cta_link.trim())
          throw new Error("Banner image and destination link are required");
      } else if (!form.title.trim() || !form.cta_link.trim()) {
        throw new Error("Title and CTA link are required");
      }
      const payload = {
        ...form,
        title: form.title.trim(),
        subtitle: form.subtitle?.trim() || null,
        cta_link: form.cta_link.trim(),
      };
      const result = editingId
        ? await (supabase as any).from("advertisements").update(payload).eq("id", editingId)
        : await (supabase as any).from("advertisements").insert(payload);
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
      const { error } = await (supabase as any)
        .from("advertisements")
        .update({ is_active: !ad.is_active })
        .eq("id", ad.id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["advertisements"] }),
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteAd = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("advertisements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Promotion deleted");
      void qc.invalidateQueries({ queryKey: ["advertisements"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const update = (key: keyof typeof form, value: string | boolean | number) =>
    setForm((current) => ({ ...current, [key]: value }));
  const previewAd = { ...form, id: "preview", created_at: "" } as Advertisement;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-semibold text-slate-900">
              {editingId ? "Edit Promotion Banner" : "New Campaign Banner"}
            </h3>
            <Megaphone className="size-4 text-blue-600" />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 text-xs">
            <div className="sm:col-span-2 space-y-1">
              <Label>Banner Title</Label>
              <Input
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="e.g. Special SSC Tier 1 Mock Series"
                className="h-9"
              />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <Label>Subtitle / Secondary Offer Text</Label>
              <Textarea
                value={form.subtitle ?? ""}
                onChange={(e) => update("subtitle", e.target.value)}
                placeholder="Sharpen your accuracy with instant percentiles..."
                className="min-h-[50px]"
              />
            </div>
            <div className="space-y-1">
              <Label>Target Link / Tab</Label>
              <Input
                value={form.cta_link}
                onChange={(e) => update("cta_link", e.target.value)}
                placeholder="/?tab=packages"
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label>Button Text</Label>
              <Input
                value={form.cta_text}
                onChange={(e) => update("cta_text", e.target.value)}
                placeholder="Unlock Now"
                className="h-9"
              />
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button onClick={() => saveAd.mutate()} disabled={saveAd.isPending} size="sm" className="bg-blue-600">
              {saveAd.isPending ? "Saving..." : editingId ? "Update Campaign" : "Publish Campaign"}
            </Button>
            {editingId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyAd());
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </section>

        {/* Live Preview */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 text-sm">Live Banner Preview</h3>
            <Badge variant="secondary">Dynamic</Badge>
          </div>
          <HeroCarousel ads={[previewAd]} />
        </section>
      </div>

      {/* Published Ads List */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="font-semibold text-slate-900 text-sm mb-4">Active Campaign Records</h3>
        <div className="space-y-2">
          {ads.map((ad) => (
            <div key={ad.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-xs bg-slate-50">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">{ad.title}</span>
                  <Badge variant={ad.is_active ? "default" : "outline"}>{ad.is_active ? "Active" : "Paused"}</Badge>
                </div>
                <span className="text-slate-500 mt-1 block">{ad.cta_link}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => toggleAd.mutate(ad)} className="h-7 text-xs">
                  {ad.is_active ? "Pause" : "Activate"}
                </Button>
                <Button size="sm" variant="destructive" onClick={() => deleteAd.mutate(ad.id)} className="h-7 text-xs">
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

type ManagedUser = {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  user_metadata?: { phone?: string | null };
  raw_user_meta_data?: { phone?: string | null };
  avatar_url: string;
  has_free_pass: boolean;
  is_banned: boolean;
  free_pass_expires_at: string | null;
  created_at?: string;
  joined_at: string;
  attempts?: number;
  is_paid?: boolean;
};

function UserManagement() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [action, setAction] = useState<"notification" | "pass" | "offer" | null>(null);
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [actionUrl, setActionUrl] = useState("");
  const [passEnabled, setPassEnabled] = useState(true);
  const [passDuration, setPassDuration] = useState("30");
  const [offerCode, setOfferCode] = useState("");
  const [discount, setDiscount] = useState("");
  const [offerExpiry, setOfferExpiry] = useState("");

  const fetchUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = (supabase as any)
        .from("profiles")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      if (searchTerm.trim()) {
        query = query.or(
          `full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`,
        );
      }

      if (filterType === "pass") {
        query = query.eq("has_free_pass", true);
      }

      const { data, count, error } = await query.range(from, to);
      if (error) {
        console.error("Error fetching users:", error);
        setUsers([]);
        setTotalCount(0);
      } else {
        const rows = (data ?? []) as ManagedUser[];
        setUsers(rows);
        setTotalCount(count ?? 0);

        try {
          const { data: attempts } = await (supabase as any).from("attempts").select("user_id");
          const attemptsByUser = new Map<string, number>();
          for (const attempt of attempts ?? []) {
            if (attempt.user_id)
              attemptsByUser.set(attempt.user_id, (attemptsByUser.get(attempt.user_id) ?? 0) + 1);
          }
          setUsers((current) =>
            current.map((user) => ({ ...user, attempts: attemptsByUser.get(user.id) ?? 0 })),
          );
        } catch (error) {
          console.error("Unexpected error fetching attempt counts:", error);
        }
      }
    } catch (error) {
      console.error("Catch error:", error);
      setUsers([]);
      setTotalCount(0);
    } finally {
      setIsLoadingUsers(false);
    }
  }, [currentPage, filterType, pageSize, searchTerm]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, searchTerm]);

  const handleSavePass = async (userId: string = targetUserId ?? selected[0] ?? "") => {
    if (!userId) return;
    const expiryDate =
      passDuration === "lifetime"
        ? null
        : new Date(Date.now() + Number(passDuration) * 86400000).toISOString();
    const { error } = await (supabase as any)
      .from("profiles")
      .update({ has_free_pass: passEnabled, free_pass_expires_at: passEnabled ? expiryDate : null })
      .eq("id", userId);
    if (error) throw error;
    setUsers((current) =>
      current.map((user) =>
        user.id === userId
          ? {
              ...user,
              has_free_pass: passEnabled,
              free_pass_expires_at: passEnabled ? expiryDate : null,
            }
          : user,
      ),
    );
    await (supabase as any)
      .from("user_notifications")
      .insert({
        user_id: userId,
        title: passEnabled ? "Pro Pass granted" : "Pro Pass revoked",
        message: passEnabled
          ? "You now have access to all tests and packages."
          : "Your Pro Pass has been revoked.",
      });
    toast.success(passEnabled ? "Pro Pass granted" : "Pro Pass revoked");
  };

  const moderateUser = async (user: ManagedUser) => {
    const { error } = await (supabase as any)
      .from("profiles")
      .update({ is_banned: !user.is_banned })
      .eq("id", user.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setUsers((current) =>
      current.map((item) => (item.id === user.id ? { ...item, is_banned: !user.is_banned } : item)),
    );
    toast.success(user.is_banned ? "User unbanned" : "User banned");
  };

  const deleteUser = async (user: ManagedUser) => {
    if (!window.confirm(`Delete the profile for ${user.full_name || user.email || "this user"}?`))
      return;
    const { error } = await (supabase as any).from("profiles").delete().eq("id", user.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setUsers((current) => current.filter((item) => item.id !== user.id));
    setSelected((current) => current.filter((id) => id !== user.id));
    toast.success("Profile deleted");
  };

  const toggle = (id: string) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );

  const runAction = async () => {
    if (!selected.length) return;
    if (action === "notification") {
      if (!title.trim() || !message.trim())
        throw new Error("Notification title and message are required");
      const { error } = await (supabase as any).from("user_notifications").insert(
        selected.map((user_id) => ({
          user_id,
          title: title.trim(),
          message: message.trim(),
          action_url: actionUrl.trim() || null,
        })),
      );
      if (error) throw error;
    } else if (action === "pass") {
      await Promise.all(selected.map((userId) => handleSavePass(userId)));
    } else if (action === "offer") {
      if (!title.trim()) throw new Error("Offer title is required");
      const { error } = await (supabase as any).from("assigned_offers").insert(
        selected.map((user_id) => ({
          user_id,
          title: title.trim(),
          coupon_code: offerCode.trim() || null,
          discount_percent: discount ? Number(discount) : null,
          expires_at: offerExpiry ? new Date(offerExpiry).toISOString() : null,
        })),
      );
      if (error) throw error;
      await (supabase as any).from("user_notifications").insert(
        selected.map((user_id) => ({
          user_id,
          title: "New offer available",
          message: title.trim(),
        })),
      );
    }
    toast.success("Action applied successfully");
    setAction(null);
    setTitle("");
    setMessage("");
    setSelected([]);
    await fetchUsers();
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
      {/* Header & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Student & Learner Accounts</h3>
          <p className="text-xs text-slate-500">Manage user access, grant Pro Passes, send offers, or moderate accounts.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
            <Input
              className="pl-9 h-9 text-xs rounded-xl"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <select
            className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700"
            value={filterType}
            onChange={(event) => setFilterType(event.target.value)}
          >
            <option value="all">All Registered Students</option>
            <option value="pass">Active Pro Pass Holders</option>
          </select>
        </div>
      </div>

      {/* Selected Action Floating Strip */}
      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/80 p-3 shadow-xs">
          <span className="mr-auto text-xs font-bold text-blue-900 flex items-center gap-1.5">
            <Check className="size-4 text-blue-600" /> {selected.length} student(s) selected
          </span>
          <Button
            size="sm"
            onClick={() => {
              setTargetUserId(null);
              setAction("notification");
            }}
            className="h-8 bg-blue-600 hover:bg-blue-700 text-xs rounded-lg"
          >
            <Bell className="mr-1.5 size-3.5" /> Send Notification
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setTargetUserId(null);
              setAction("pass");
            }}
            className="h-8 bg-white text-xs rounded-lg"
          >
            <KeyRound className="mr-1.5 size-3.5" /> Grant / Revoke Pass
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setTargetUserId(null);
              setAction("offer");
            }}
            className="h-8 bg-white text-xs rounded-lg"
          >
            <Gift className="mr-1.5 size-3.5" /> Assign Special Offer
          </Button>
        </div>
      )}

      {/* Full Users Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th className="p-3.5 w-10">
                <input
                  type="checkbox"
                  className="size-3.5 rounded text-blue-600"
                  checked={users.length > 0 && users.every((user) => selected.includes(user.id))}
                  onChange={() =>
                    setSelected(
                      users.every((user) => selected.includes(user.id))
                        ? []
                        : users.map((user) => user.id),
                    )
                  }
                />
              </th>
              <th className="p-3.5">Student</th>
              <th className="p-3.5">Email</th>
              <th className="p-3.5">Phone</th>
              <th className="p-3.5 text-center">Tests Attempted</th>
              <th className="p-3.5">Pass Status</th>
              <th className="p-3.5">Joined Date</th>
              <th className="p-3.5 text-right">Quick Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoadingUsers ? (
              <tr>
                <td className="p-8 text-center text-slate-400" colSpan={8}>
                  <span className="inline-flex items-center gap-2">
                    <span className="size-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                    Loading registered student records...
                  </span>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500 font-medium">
                  No students found matching your filters.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className={`hover:bg-slate-50/70 transition-colors ${selected.includes(u.id) ? "bg-blue-50/30" : ""}`}>
                  <td className="p-3.5">
                    <input
                      type="checkbox"
                      className="size-3.5 rounded text-blue-600"
                      checked={selected.includes(u.id)}
                      onChange={() => toggle(u.id)}
                    />
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={u.avatar_url || "/logo.png"}
                        alt=""
                        className="size-8 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <div className="font-semibold text-slate-800">{u.full_name || "Rankdon Learner"}</div>
                        {u.is_banned && <Badge variant="destructive" className="text-[10px] h-4">BANNED</Badge>}
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 text-slate-600 font-mono text-[11px]">{u.email}</td>
                  <td className="p-3.5 text-slate-500">
                    {u.phone || u.user_metadata?.phone || u.raw_user_meta_data?.phone || "—"}
                  </td>
                  <td className="p-3.5 text-center font-bold text-slate-700">{u.attempts ?? 0}</td>
                  <td className="p-3.5">
                    {u.has_free_pass ? (
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                        Pro Pass ACTIVE
                      </Badge>
                    ) : (
                      <span className="text-slate-400">Standard</span>
                    )}
                  </td>
                  <td className="p-3.5 text-slate-500">{new Date(u.created_at || u.joined_at).toLocaleDateString()}</td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px] px-2"
                        onClick={() => {
                          setSelected([u.id]);
                          setTargetUserId(u.id);
                          setAction("notification");
                        }}
                      >
                        Notify
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px] px-2"
                        onClick={() => {
                          setSelected([u.id]);
                          setTargetUserId(u.id);
                          setAction("pass");
                        }}
                      >
                        Pass
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px] px-2"
                        onClick={() => {
                          setSelected([u.id]);
                          setTargetUserId(u.id);
                          setAction("offer");
                        }}
                      >
                        Offer
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px] px-2"
                        onClick={() => void moderateUser(u)}
                      >
                        {u.is_banned ? "Unban" : "Ban"}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-7 w-7 p-0"
                        onClick={() => void deleteUser(u)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pt-2">
        <span>
          Showing {totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{" "}
          {Math.min(currentPage * pageSize, totalCount)} of {totalCount} registered students
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg h-8 text-xs"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg h-8 text-xs"
            disabled={currentPage * pageSize >= totalCount}
            onClick={() => setCurrentPage((page) => page + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Full Modal Layer */}
      {action && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display text-base font-bold text-slate-900">
                {action === "notification"
                  ? "Send Learner Notification"
                  : action === "pass"
                    ? "Configure Student Pro Pass"
                    : "Assign Discount Coupon / Offer"}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setAction(null)} className="h-7 w-7 p-0">
                <X className="size-4" />
              </Button>
            </div>

            {action === "notification" && (
              <div className="space-y-3 text-xs">
                <div>
                  <Label>Notification Title</Label>
                  <Input
                    className="mt-1 h-9 rounded-xl"
                    placeholder="e.g. New All-India Mock Test is Live!"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                  />
                </div>
                <div>
                  <Label>Message Content</Label>
                  <Textarea
                    className="mt-1 min-h-[80px] rounded-xl text-xs"
                    placeholder="Describe the update or instructions..."
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                  />
                </div>
                <div>
                  <Label>Destination Action URL (Optional)</Label>
                  <Input
                    className="mt-1 h-9 rounded-xl font-mono text-xs"
                    placeholder="/?tab=packages"
                    value={actionUrl}
                    onChange={(event) => setActionUrl(event.target.value)}
                  />
                </div>
              </div>
            )}

            {action === "pass" && (
              <div className="space-y-3 text-xs">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={passEnabled}
                    onChange={(event) => setPassEnabled(event.target.checked)}
                    className="size-4 rounded text-blue-600"
                  />
                  <span>Enable Pro Pass (Full Access to All Tests)</span>
                </label>
                <div>
                  <Label>Pass Validity Duration</Label>
                  <select
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs"
                    value={passDuration}
                    onChange={(event) => setPassDuration(event.target.value)}
                  >
                    <option value="7">7 Days</option>
                    <option value="30">30 Days</option>
                    <option value="90">90 Days</option>
                    <option value="lifetime">Lifetime</option>
                  </select>
                </div>
              </div>
            )}

            {action === "offer" && (
              <div className="space-y-3 text-xs">
                <div>
                  <Label>Offer Headline / Title</Label>
                  <Input
                    className="mt-1 h-9 rounded-xl"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="e.g. 50% Off on SSC Combo Series"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Coupon Code</Label>
                    <Input
                      className="mt-1 h-9 rounded-xl font-mono"
                      value={offerCode}
                      onChange={(event) => setOfferCode(event.target.value)}
                      placeholder="RANK50"
                    />
                  </div>
                  <div>
                    <Label>Discount %</Label>
                    <Input
                      className="mt-1 h-9 rounded-xl"
                      type="number"
                      value={discount}
                      onChange={(event) => setDiscount(event.target.value)}
                      placeholder="50"
                    />
                  </div>
                </div>
                <div>
                  <Label>Expiry Date & Time</Label>
                  <Input
                    className="mt-1 h-9 rounded-xl"
                    type="datetime-local"
                    value={offerExpiry}
                    onChange={(event) => setOfferExpiry(event.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <Button variant="outline" size="sm" onClick={() => setAction(null)} className="rounded-xl h-9 text-xs">
                Cancel
              </Button>
              <Button size="sm" onClick={() => void runAction()} className="bg-blue-600 hover:bg-blue-700 rounded-xl h-9 text-xs">
                Apply Action
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type StudyNote = {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  file_url: string;
  is_free: boolean;
  price?: number | null;
  discount_price?: number | null;
  created_at?: string;
};

function StudyMaterialsManager() {
  const qc = useQueryClient();
  const { data: notes = [] } = useQuery({
    queryKey: ["study-notes"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("study_notes")
        .select("*")
        .order("created_at", { ascending: false });
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
  const [price, setPrice] = useState<number | "">("");
  const [discountPrice, setDiscountPrice] = useState<number | "">("");

  const reset = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setCategory("General Awareness");
    setFileUrl("");
    setIsFree(true);
    setPrice("");
    setDiscountPrice("");
  };

  const startEdit = (note: StudyNote) => {
    setEditingId(note.id);
    setTitle(note.title);
    setDescription(note.description ?? "");
    setCategory(note.category);
    setFileUrl(note.file_url);
    setIsFree(Boolean(note.is_free));
    setPrice(note.price ?? "");
    setDiscountPrice(note.discount_price ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = async () => {
    if (!title.trim() || !fileUrl.trim()) {
      toast.error("Title and resource URL are required");
      return;
    }

    const finalPrice = isFree ? 0 : price === "" ? null : Number(price);
    const finalDiscount = isFree ? 0 : discountPrice === "" ? null : Number(discountPrice);

    const payload: Record<string, any> = {
      title: title.trim(),
      description: description.trim(),
      category: category.trim() || "General",
      file_url: fileUrl.trim(),
      is_free: isFree,
      price: finalPrice,
      discount_price: finalDiscount,
    };

    const result = editingId
      ? await (supabase as any).from("study_notes").update(payload).eq("id", editingId)
      : await (supabase as any).from("study_notes").insert(payload);

    if (result.error) {
      toast.error(result.error.message);
      return;
    }

    toast.success(editingId ? "Material updated" : "Material published");
    reset();
    void qc.invalidateQueries({ queryKey: ["study-notes"] });
  };

  const deleteNote = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this study material?")) return;

    const { error } = await (supabase as any).from("study_notes").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Study material deleted");
    if (editingId === id) reset();
    void qc.invalidateQueries({ queryKey: ["study-notes"] });
  };

  const toggleFree = async (note: StudyNote) => {
    const nextStatus = !note.is_free;
    const { error } = await (supabase as any)
      .from("study_notes")
      .update({ is_free: nextStatus })
      .eq("id", note.id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(`Set to ${nextStatus ? "Free" : "Paid"}`);
    void qc.invalidateQueries({ queryKey: ["study-notes"] });
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      {/* Creation / Edit Form */}
      <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-semibold text-slate-900 text-sm">
            {editingId ? "Edit Study Material" : "Add Study PDF / Material"}
          </h3>
          {editingId && (
            <Button variant="ghost" size="sm" onClick={reset} className="h-7 text-xs text-slate-500">
              <X className="mr-1 size-3.5" /> Cancel
            </Button>
          )}
        </div>

        <div>
          <Label className="text-xs font-semibold text-slate-700">Title</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Maths notes 1"
            className="mt-1 h-9 text-xs rounded-xl"
          />
        </div>

        <div>
          <Label className="text-xs font-semibold text-slate-700">Category</Label>
          <Input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="General Awareness"
            className="mt-1 h-9 text-xs rounded-xl"
          />
        </div>

        <div>
          <Label className="text-xs font-semibold text-slate-700">Resource Link (PDF / Cloud URL)</Label>
          <Input
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
            placeholder="https://..."
            className="mt-1 h-9 text-xs rounded-xl font-mono"
          />
        </div>

        <div>
          <Label className="text-xs font-semibold text-slate-700">Description (Optional)</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Key highlights or covered syllabus..."
            className="mt-1 min-h-[50px] text-xs rounded-xl"
          />
        </div>

        {/* Pricing Selection */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-3">
          <Label className="text-xs font-semibold text-slate-800">Access Mode</Label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsFree(true)}
              className={`flex-1 rounded-lg py-1.5 text-xs font-semibold border transition-all ${
                isFree
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              Free Access
            </button>
            <button
              type="button"
              onClick={() => setIsFree(false)}
              className={`flex-1 rounded-lg py-1.5 text-xs font-semibold border transition-all ${
                !isFree
                  ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              Paid Document
            </button>
          </div>

          {!isFree && (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
              <div>
                <Label className="text-[11px] text-slate-600">Original Price (₹)</Label>
                <Input
                  type="number"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="99"
                  className="mt-1 h-8 text-xs bg-white rounded-lg"
                />
              </div>
              <div>
                <Label className="text-[11px] text-slate-600">Offer Price (₹)</Label>
                <Input
                  type="number"
                  min={0}
                  value={discountPrice}
                  onChange={(e) => setDiscountPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="49"
                  className="mt-1 h-8 text-xs bg-white rounded-lg"
                />
              </div>
            </div>
          )}
        </div>

        <Button onClick={() => void save()} size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 text-xs font-semibold mt-2">
          {editingId ? "Update Material" : "Publish Material"}
        </Button>
      </div>

      {/* Published Documents List */}
      <div className="lg:col-span-7 space-y-3">
        <h4 className="font-bold text-slate-900 text-sm">Published Documents ({notes.length})</h4>
        
        {notes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
            No study materials uploaded yet.
          </div>
        ) : (
          notes.map((n) => {
            const hasDiscount = n.discount_price != null && n.price != null && Number(n.discount_price) < Number(n.price);
            return (
              <div
                key={n.id}
                className="rounded-xl border border-slate-200 bg-white p-4 text-xs flex justify-between items-center shadow-xs hover:border-slate-300 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-sm">{n.title}</span>
                    <button
                      type="button"
                      onClick={() => void toggleFree(n)}
                      title="Click to toggle Free/Paid status"
                      className="cursor-pointer"
                    >
                      <Badge variant={n.is_free ? "secondary" : "destructive"}>
                        {n.is_free ? "FREE" : "PAID"}
                      </Badge>
                    </button>
                    {!n.is_free && (
                      <span className="text-xs font-bold text-slate-700">
                        ₹{n.discount_price ?? n.price ?? 0}
                        {hasDiscount && (
                          <span className="text-slate-400 line-through text-[11px] ml-1">
                            ₹{n.price}
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  <span className="text-slate-400 block">{n.category}</span>
                  {n.description && <p className="text-slate-500 text-[11px] line-clamp-1">{n.description}</p>}
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startEdit(n)}
                    className="h-8 text-xs rounded-lg px-2.5"
                  >
                    <Pencil className="mr-1 size-3" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => void deleteNote(n.id)}
                    className="h-8 w-8 p-0 rounded-lg"
                    title="Delete document"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
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
    <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-xs text-slate-600">
      {data?.map((q) => (
        <li key={q.id} className="leading-relaxed">
          {q.body}
        </li>
      ))}
    </ol>
  );
}