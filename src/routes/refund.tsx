import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/refund")({
  component: RefundPage,
});

function RefundPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 text-slate-800">
      <h1 className="text-3xl font-bold">Refund and Cancellation Policy</h1>
      <p className="mt-2 text-xs text-slate-500">Last updated: June 2026</p>
      
      <div className="mt-6 space-y-4 text-sm leading-relaxed">
        <p>Because Rankdon provides instant digital access to online mock test papers, test series packages, and downloadable study documents, all purchases are generally final.</p>
        
        <h2 className="text-lg font-semibold pt-2">Duplicate or Erroneous Transactions</h2>
        <p>If you experience a technical failure where money was debited from your account multiple times for a single test purchase, please contact us immediately. Verified duplicate transactions will be fully refunded to your original payment method within 5–7 business days.</p>

        <h2 className="text-lg font-semibold pt-2">Cancellations</h2>
        <p>Users may cancel their account or subscription preferences at any time through their profile settings. Active digital content already unlocked cannot be cancelled or refunded.</p>
      </div>

      <div className="mt-8">
        <Button asChild variant="outline"><Link to="/">Return Home</Link></Button>
      </div>
    </div>
  );
}