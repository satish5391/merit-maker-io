import { createFileRoute } from "@tanstack/react-router";
import ProfilePage from "@/pages/Profile";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [{ title: "My Profile — Rankdon" }, { name: "description", content: "Manage your student profile and personal details on Rankdon." }],
  }),
});
