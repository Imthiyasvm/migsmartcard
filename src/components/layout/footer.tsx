import Link from "next/link";
import { Logo } from "@/components/logo";

const footerLinks = {
  Product: [
    { href: "/#features", label: "Features" },
    { href: "/#pricing", label: "Pricing" },
    { href: "/shop", label: "NFC Cards" },
    { href: "/p/alex-rivera", label: "Demo Profile" },
  ],
  Company: [
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
    { href: "/blog", label: "Blog" },
  ],
  Legal: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
    { href: "/cookies", label: "Cookie Policy" },
  ],
  Support: [
    { href: "/help", label: "Help Center" },
    { href: "/contact", label: "Contact Support" },
    { href: "/dashboard", label: "Dashboard" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-[#faf9f7] dark:border-[#1a1a1a] dark:bg-[#0a0a0a]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-slate-500 dark:text-slate-400">
              The smarter way to connect. Share your digital business profile via
              NFC, QR code, or link — and capture every lead.
            </p>
          </div>
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                {title}
              </h4>
              <ul className="mt-3 space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-500 transition-colors hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 dark:border-[#1a1a1a] sm:flex-row">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} MigSmartCard. All rights reserved.
          </p>
          <p className="text-xs text-slate-400">
            GDPR Compliant · SSL Encrypted · Built for professionals
          </p>
        </div>
      </div>
    </footer>
  );
}
