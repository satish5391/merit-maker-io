import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 text-slate-800">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="mt-2 text-xs text-slate-500">Last updated: June 2026</p>
      
      <div className="mt-6 space-y-4 text-sm leading-relaxed">
        <p>At Rankdon, we respect your privacy. This Privacy Policy describes how we collect, use, and protect your personal information when you use our web platform.</p>
        
        <h2 className="text-lg font-semibold pt-2">Information We Collect</h2>
        <p>We collect basic profile details (Name, Email, Phone number) provided during signup or authentication, alongside performance metrics, test attempt histories, and secure payment transaction logs.</p>

        <h2 className="text-lg font-semibold pt-2">How We Use Data</h2>
        <p>Your data is used strictly to track test analytics, grant secure access to purchased packages, and deliver service-related alerts or updates. We never sell or share user data with third-party advertisers.</p>
      </div>

      <div className="mt-8">
        <Button asChild variant="outline"><Link to="/">Return Home</Link></Button>
      </div>
    </div>
  );
}