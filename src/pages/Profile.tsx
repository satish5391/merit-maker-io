import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, MapPin, Phone, ShieldCheck, TrendingUp, UserRound } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEFAULT_TARGET_EXAM, TARGET_EXAM_OPTIONS_WITH_LABELS } from "@/constants/exams";
import { useAuth } from "@/context/AuthContext";
import { getAttemptHistory } from "@/lib/attempt-history";
import { getDisplayName, type UserProfile } from "@/lib/user-profile";

export default function ProfilePage() {
  const { user, profile, updateProfile } = useAuth();
  const [form, setForm] = useState<UserProfile>(profile ?? {
    id: "RD-2026-001",
    name: "",
    email: user?.email ?? "",
    phone: "+91 ",
    targetExam: DEFAULT_TARGET_EXAM,
    avatarUrl: "",
    joinedDate: new Date().toISOString(),
    subscriptionTier: "Free",
    grantedTestIds: [],
    state: "",
    city: "",
  });

  useEffect(() => {
    if (profile) {
      setForm(profile);
    }
  }, [profile]);

  const history = useMemo(() => getAttemptHistory(), []);
  const totalTestsAttempted = history.length;
  const averageAccuracy = totalTestsAttempted > 0 ? history.reduce((sum, item) => sum + Number(item.accuracy || 0), 0) / totalTestsAttempted : 0;
  const ranked = [...history].sort((a, b) => Number(b.accuracy) - Number(a.accuracy));
  const overallRank = totalTestsAttempted > 0 ? ranked.findIndex((item) => item.attemptId === ranked[0]?.attemptId) + 1 : "Unranked";

  if (!user) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-[var(--shadow-card)]">
          <h1 className="text-2xl font-semibold text-foreground">Please log in to view your profile</h1>
          <p className="mt-2 text-sm text-muted-foreground">Your student details, test history, and account settings are stored here.</p>
          <Button asChild className="mt-6">
            <Link to="/">Back to tests</Link>
          </Button>
        </div>
      </main>
    );
  }

  const currentBadge =
    profile?.subscriptionTier === "Pass_Pro"
      ? "Pass Pro Active"
      : profile?.subscriptionTier === "Pro"
        ? "Pro Active"
        : "Free Plan";

  const handleSave = () => {
    const sanitizedName = form.name.trim() || getDisplayName(undefined, user.email);
    const nextProfile = updateProfile({
      ...form,
      name: sanitizedName,
      email: user.email ?? form.email,
      phone: form.phone.trim() || "+91 ",
      state: form.state.trim(),
      city: form.city.trim(),
    });
    setForm(nextProfile);
    toast.success("Profile updated successfully.");
  };

  const initials = (form.name || user.email || "Student").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.includes("image/")) {
      toast.error("Please choose a valid image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const nextAvatarUrl = typeof reader.result === "string" ? reader.result : "";
      if (!nextAvatarUrl) return;

      const nextProfile = updateProfile({
        ...form,
        avatarUrl: nextAvatarUrl,
      });
      setForm(nextProfile);
      toast.success("Profile picture updated.");
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <Badge variant="secondary">Student profile</Badge>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">Profile & account settings</h1>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-6">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-cyan-500 via-sky-500 to-blue-700 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/70 bg-white/10 text-xl font-bold overflow-hidden">
                  {form.avatarUrl ? <img src={form.avatarUrl} alt={form.name} className="h-full w-full rounded-full object-cover" /> : initials}
                </div>
                <Badge className="border border-white/30 bg-white/10 text-white">{currentBadge}</Badge>
              </div>

              <div className="mt-3">
                <input id="profile-photo-input" type="file" accept="image/png, image/jpeg" className="hidden" onChange={handlePhotoChange} />
                <label htmlFor="profile-photo-input" className="inline-flex cursor-pointer items-center rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-white/90 transition hover:bg-white/25">
                  Change Photo
                </label>
              </div>

              <h2 className="mt-5 text-2xl font-semibold">{form.name || getDisplayName(undefined, user.email)}</h2>
              <p className="mt-1 text-sm text-cyan-50">{form.email || user.email}</p>
            </div>

            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-3">
                <span className="text-sm text-muted-foreground">Student ID</span>
                <span className="text-sm font-semibold text-foreground">{form.id || "RD-2026-001"}</span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-3">
                <span className="text-sm text-muted-foreground">Target exam</span>
                <span className="text-sm font-semibold text-foreground">{form.targetExam}</span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-3">
                <span className="text-sm text-muted-foreground">Subscription</span>
                <span className="text-sm font-semibold text-foreground">{form.subscriptionTier}</span>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4 text-cyan-600" />
                Joined {new Date(form.joinedDate || Date.now()).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-cyan-600" />
                Test statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-border bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">Attempted</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{totalTestsAttempted}</p>
                </div>
                <div className="rounded-xl border border-border bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">Accuracy</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{averageAccuracy.toFixed(1)}%</p>
                </div>
                <div className="rounded-xl border border-border bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">Rank</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">#{overallRank === "Unranked" ? "—" : overallRank}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <UserRound className="h-5 w-5 text-cyan-600" />
              Personal details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Full Name</label>
                <Input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email Address</label>
                <Input value={form.email || user.email || ""} readOnly className="bg-muted/40" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Phone / WhatsApp Number</label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={form.phone}
                    onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                    placeholder="+91 9876543210"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Target Exam</label>
                <Select value={form.targetExam} onValueChange={(value) => setForm((current) => ({ ...current, targetExam: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select exam" />
                  </SelectTrigger>
                  <SelectContent>
                    {TARGET_EXAM_OPTIONS_WITH_LABELS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">State</label>
                <Input
                  value={form.state}
                  onChange={(event) => setForm((current) => ({ ...current, state: event.target.value }))}
                  placeholder="e.g. Maharashtra"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">City</label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={form.city}
                    onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
                    placeholder="e.g. Mumbai"
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-dashed border-cyan-200 bg-cyan-50/60 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-cyan-700">
                <ShieldCheck className="h-4 w-4" />
                Verified account
              </div>
              <p className="mt-1 text-sm text-cyan-700/80">Your email is verified and used for secure login and account recovery.</p>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} className="min-w-[200px]">
                Save Profile Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
