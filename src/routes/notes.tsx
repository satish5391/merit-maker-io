import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Download, FileText, Lock, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "../context/AuthContext";

export const Route = createFileRoute("/notes")({ component: NotesPage });

type StudyNote = {
  id: string;
  title: string;
  description: string;
  category: string;
  file_url: string;
  is_free: boolean;
};

function NotesPage() {
  const { user, openAuthModal } = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["study-notes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_notes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as StudyNote[];
    },
  });

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(notes.map((n) => n.category))).sort()],
    [notes],
  );

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return notes
      .filter((n) => category === "All" || n.category === category)
      .filter((n) => !query || `${n.title} ${n.description}`.toLowerCase().includes(query));
  }, [category, notes, search]);

  const handleAccess = (url: string, download = false) => {
    if (!user) {
      openAuthModal?.();
      return;
    }

    if (download) {
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "";
      anchor.target = "_blank";
      anchor.rel = "noreferrer";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } else {
      window.open(url, "_blank", "noreferrer");
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge variant="secondary">Study library</Badge>
          <h1 className="mt-3 font-display text-2xl font-bold md:text-3xl">
            Study Notes &amp; Materials
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Revision notes and resources for your next attempt.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <input
            aria-label="Search study notes"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes"
            className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm"
          />
        </div>
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {categories.map((item) => (
          <button
            key={item}
            onClick={() => setCategory(item)}
            className={`whitespace-nowrap rounded-md px-3 py-2 text-sm ${
              category === item
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-background text-muted-foreground"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {isLoading && <p className="mt-8 text-sm text-muted-foreground">Loading study materials...</p>}

      {!isLoading && visible.length === 0 && (
        <div className="mt-8 rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No study materials match your search.
        </div>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {visible.map((note) => {
          const isPdf = note.file_url.toLowerCase().includes(".pdf");
          return (
            <article
              key={note.id}
              className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {isPdf ? <FileText className="size-5" /> : <BookOpen className="size-5" />}
                </div>
                <div className="flex flex-1 flex-wrap justify-end gap-2">
                  <Badge variant="secondary">{note.category}</Badge>
                  <Badge variant={note.is_free ? "secondary" : "destructive"}>
                    {note.is_free ? "FREE" : "PAID"}
                  </Badge>
                </div>
              </div>

              <h2 className="mt-4 font-display text-lg font-semibold">{note.title}</h2>
              <p className="mt-2 min-h-10 text-sm text-muted-foreground">
                {note.description || "Study resource"}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => handleAccess(note.file_url, false)}>
                  {!user && <Lock className="mr-1 size-3.5" />}
                  View Note
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAccess(note.file_url, true)}
                >
                  <Download className="mr-1 size-4" />
                  Download PDF
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}