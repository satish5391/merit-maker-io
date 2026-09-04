import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 pt-16 pb-12 mt-24 text-sm text-slate-600">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-10">
        
        {/* Brand & Bio */}
        <div className="space-y-4 md:col-span-1">
          <Link to="/" className="inline-block">
            <img src="/logo.png" alt="Rankdon" className="h-9 w-auto object-contain" />
          </Link>
          <p className="text-slate-500 text-xs leading-relaxed">
            India's reliable mock test platform designed for aspirants to practice full-length exams, analyze performance, and track national percentiles.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wider mb-4">Platform</h4>
          <ul className="space-y-2.5 text-xs">
            <li><Link to="/" className="hover:text-blue-600 transition-colors">All Mock Tests</Link></li>
            <li><Link to="/notes" className="hover:text-blue-600 transition-colors">Study Materials</Link></li>
            <li><Link to="/live-tests" className="hover:text-blue-600 transition-colors">Live Exams</Link></li>
          </ul>
        </div>

        {/* Legal & Compliance (Required for Gateway Approval) */}
        <div>
          <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wider mb-4">Legal & Compliance</h4>
          <ul className="space-y-2.5 text-xs">
            <li><Link to="/terms" className="hover:text-blue-600 transition-colors">Terms & Conditions</Link></li>
            <li><Link to="/privacy" className="hover:text-blue-600 transition-colors">Privacy Policy</Link></li>
            <li><Link to="/refund" className="hover:text-blue-600 transition-colors">Refund & Cancellation</Link></li>
          </ul>
        </div>

        {/* Contact Support */}
        <div className="space-y-2.5 text-xs">
          <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wider mb-4">Support & Contact</h4>
          <p className="text-slate-500">Email: <span className="text-slate-800 font-medium">support@rankdon.com</span></p>
          <p className="text-slate-500">Phone: <span className="text-slate-800 font-medium">+91 XXXXX XXXXX</span></p>
          <div className="pt-1">
            <Link to="/contact" className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-1">
              View Full Contact Details →
            </Link>
          </div>
        </div>

      </div>

      {/* Bottom Copyright bar */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
        <p>© {new Date().getFullYear()} Rankdon. All rights reserved.</p>
        <p className="text-slate-400">Payments securely processed via RBI-authorized gateway partners.</p>
      </div>
    </footer>
  );
}