import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 text-slate-800">
      <h1 className="text-3xl font-bold">Terms and Conditions</h1>
      <p className="mt-2 text-xs text-slate-500">Last updated: June 2026</p>
      
      <div className="mt-6 space-y-4 text-sm leading-relaxed">
        <p>Welcome to Rankdon. By accessing or using our website, mock tests, and study materials, you agree to comply with and be bound by the following terms.</p>
        
        <h2 className="text-lg font-semibold pt-2">1. Accounts & Access</h2>
        <p>You must provide accurate information when creating an account. Your login credentials are for your personal use only. Sharing accounts or distributing test content externally is strictly prohibited.</p>

        <h2 className="text-lg font-semibold pt-2">2. Pricing & Payments</h2>
        <p>All prices for individual tests, packages, or pro passes are listed clearly in Indian Rupees (INR). Payments are processed securely via RBI-authorized payment gateways (such as Razorpay).</p>

        <h2 className="text-lg font-semibold pt-2">3. Limitation of Liability</h2>
        <p>Rankdon provides mock exam practice material to assist with preparation. We do not guarantee selection or specific outcomes in official competitive examinations.</p>
      </div>

      <div className="mt-8">
        <Button asChild variant="outline">
          <Link to="/">Return Home</Link>
        </Button>
      </div>
    </div>
  );
}