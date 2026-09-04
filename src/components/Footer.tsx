import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Mail, Phone, ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative mt-0 overflow-hidden border-t border-slate-700/80 bg-slate-950 text-sm text-slate-300">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent" />

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-x-10 gap-y-12 px-5 py-14 sm:px-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-y-10 lg:px-10">
        <div className="space-y-5">
          <Link to="/" className="inline-flex items-center transition-opacity hover:opacity-80">
            <img src="/logo.png" alt="Rankdon" className="h-10 w-auto object-contain" />
          </Link>
          <p className="max-w-xs text-sm leading-6 text-slate-400">
            Practice with purpose. Rankdon helps aspirants prepare smarter with realistic mock tests and meaningful performance insights.
          </p>
          <p className="max-w-xs border-l-2 border-cyan-400/70 pl-3 text-xs leading-5 text-slate-500">
            Built for focused preparation, trusted by learners across India.
          </p>
        </div>

        <div>
          <h2 className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Platform</h2>
          <ul className="space-y-3 text-sm">
            <li><Link to="/" className="group inline-flex items-center gap-1 transition-colors hover:text-cyan-300">All Tests <ArrowUpRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" /></Link></li>
            <li><Link to="/notes" className="transition-colors hover:text-cyan-300">Study Notes</Link></li>
            <li><Link to="/live-tests" className="transition-colors hover:text-cyan-300">Live Exams</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Legal & Compliance</h2>
          <ul className="space-y-3 text-sm">
            <li><Link to="/terms" className="transition-colors hover:text-cyan-300">Terms &amp; Conditions</Link></li>
            <li><Link to="/privacy" className="transition-colors hover:text-cyan-300">Privacy Policy</Link></li>
            <li><Link to="/refund" className="transition-colors hover:text-cyan-300">Refund &amp; Cancellation</Link></li>
            <li><Link to="/contact" className="transition-colors hover:text-cyan-300">Contact Us</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Support &amp; Contact</h2>
          <div className="space-y-3 text-sm">
            <a href="mailto:support@rankdon.in" className="flex items-start gap-2.5 transition-colors hover:text-cyan-300">
              <Mail className="mt-0.5 size-4 shrink-0 text-cyan-400" />
              <span>support@rankdon.in</span>
            </a>
            <a href="tel:+919541405230" className="flex items-start gap-2.5 transition-colors hover:text-cyan-300">
              <Phone className="mt-0.5 size-4 shrink-0 text-cyan-400" />
              <span>+91 9541405230</span>
            </a>
            <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-emerald-400/20 bg-emerald-400/5 p-3 text-xs leading-5 text-slate-400">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-400" />
              <span>Secured via RBI-authorized gateway partners.</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-3 border-t border-slate-800 px-5 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
        <p>&copy; {new Date().getFullYear()} Rankdon. All rights reserved.</p>
        <p>Online exam preparation, made more measurable.</p>
      </div>
    </footer>
  );
}