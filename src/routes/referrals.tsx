import { createFileRoute } from "@tanstack/react-router";
import ReferralsPage from "@/pages/Referrals";

export const Route = createFileRoute("/referrals")({
  component: ReferralsPage,
  head: () => ({
    meta: [{ title: "Refer & Earn — Rankdon" }, { name: "description", content: "Invite friends to Rankdon and earn coins." }],
  }),
});