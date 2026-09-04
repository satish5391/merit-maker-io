import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/contact")({
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 text-slate-800">
      <h1 className="text-3xl font-bold">Contact Us</h1>
      <p className="mt-2 text-xs text-slate-500">Get in touch with the Rankdon support team.</p>
      
      <div className="mt-6 space-y-4 text-sm leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-200">
        <p><strong>Support Email:</strong> support@rankdon.com</p>
        <p><strong>Support Phone:</strong> +91 XXXXX XXXXX</p>
        <p><strong>Operational Address:</strong> Jammu, Jammu and Kashmir, India</p>
        <p className="text-xs text-slate-500 pt-2">We typically review and respond to inquiries within 24 to 48 hours.</p>
      </div>

      <div className="mt-8">
        <Button asChild variant="outline"><Link to="/">Return Home</Link></Button>
      </div>
    </div>
  );
}