import { Link } from "@tanstack/react-router";
import { Check, Clipboard, Gift, Loader2, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const REWARD_PER_REFERRAL = 10;

type ReferralProfile = {
  coins: number | null;
  referral_code: string | null;
};

export default function ReferralsPage() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["referral-profile", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const [{ data: profile, error: profileError }, { data: transactions, error: transactionError }] =
        await Promise.all([
          (supabase as any)
            .from("profiles")
            .select("coins, referral_code")
            .eq("id", user!.id)
            .single(),
          (supabase as any)
            .from("coin_transactions")
            .select("amount")
            .eq("user_id", user!.id)
            .eq("type", "earned_referral")
            .gt("amount", 0),
        ]);

      if (profileError) throw profileError;
      if (transactionError) throw transactionError;

      return {
        profile: profile as ReferralProfile,
        totalEarned: (transactions ?? []).reduce(
          (total: number, transaction: { amount: number | null }) => total + Number(transaction.amount || 0),
          0,
        ),
      };
    },
  });

  const referralCode = data?.profile.referral_code?.trim().toUpperCase() ?? "";
  const referralLink = referralCode ? `http://192.168.1.12:8080/?ref=${referralCode}` : "";
  const shareMessage = `Prepare smarter with Rankdon. Join me for focused mock tests, performance insights, and better exam readiness. Sign up here: ${referralLink}`;

  const copyShareMessage = async () => {
    if (!referralLink) {
      toast.error("Your referral link is not available yet.");
      return;
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareMessage);
      } else {
        // Fallback for non-secure contexts or local network IPs (e.g., 192.168.x.x)
        const textArea = document.createElement("textarea");
        textArea.value = shareMessage;
        textArea.style.position = "fixed";
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
        } catch (err) {
          throw new Error("Fallback copy failed");
        }
        document.body.removeChild(textArea);
      }

      setCopied(true);
      toast.success("Share message copied to your clipboard.");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy the message. Please try again.");
    }
  };

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
        <div className="rounded-3xl border border-slate-700/70 bg-[#0f172a] p-8 text-center shadow-2xl shadow-slate-950/20">
          <Gift className="mx-auto h-10 w-10 text-cyan-300" />
          <h1 className="mt-5 text-2xl font-semibold text-white">Refer friends. Earn coins.</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">Sign in to view your referral code and start sharing Rankdon.</p>
          <Button asChild className="mt-6 bg-cyan-400 text-slate-950 hover:bg-cyan-300">
            <Link to="/">Back to tests</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-80px)] bg-[#0f172a] px-4 py-10 text-white sm:px-6 lg:py-14">
      <div className="mx-auto max-w-5xl">
        <div className="max-w-2xl">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/15 ring-1 ring-cyan-300/30">
            <Gift className="h-6 w-6 text-cyan-300" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">Rankdon rewards</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Refer &amp; Earn</h1>
          <p className="mt-3 text-slate-400">Invite friends to prepare with Rankdon and earn coins when they join through your link.</p>
        </div>

        {isError ? (
          <div className="mt-8 rounded-2xl border border-rose-400/30 bg-rose-400/10 p-5 text-sm text-rose-200">We could not load your referral details. Please refresh and try again.</div>
        ) : isLoading ? (
          <div className="mt-8 flex items-center gap-3 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" />Loading your rewards...</div>
        ) : (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-cyan-300/20 bg-slate-900/70 p-6">
                <p className="text-sm text-slate-400">Current coin balance</p>
                <p className="mt-3 text-4xl font-semibold text-cyan-300">{data?.profile.coins ?? 0}</p>
                <p className="mt-2 text-xs text-slate-500">Available to use on Rankdon</p>
              </div>
              <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6">
                <p className="text-sm text-slate-400">Total coins earned</p>
                <p className="mt-3 text-4xl font-semibold text-white">{data?.totalEarned ?? 0}</p>
                <p className="mt-2 flex items-center gap-2 text-xs text-slate-500"><Users className="h-3.5 w-3.5" />{REWARD_PER_REFERRAL} coins per successful referral</p>
              </div>
            </div>

            <section className="mt-6 rounded-2xl border border-slate-700 bg-slate-900/70 p-6 sm:p-8">
              <h2 className="text-lg font-semibold">Your personal referral link</h2>
              <p className="mt-1 text-sm text-slate-400">Share this link with friends preparing for their next exam.</p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <div className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 font-mono text-sm text-cyan-200 break-all">{referralLink || "Generating your referral link..."}</div>
                <Button onClick={copyShareMessage} disabled={!referralLink} className="h-auto min-h-12 shrink-0 bg-cyan-400 px-5 font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-50">
                  {copied ? <Check className="mr-2 h-4 w-4" /> : <Clipboard className="mr-2 h-4 w-4" />}
                  {copied ? "Copied" : "Copy Share Message"}
                </Button>
              </div>
              <p className="mt-4 text-xs leading-5 text-slate-500">Your message includes the link and a concise invitation to join Rankdon.</p>
            </section>
          </>
        )}
      </div>
    </main>
  );
}