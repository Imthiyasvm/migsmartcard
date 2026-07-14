import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const faqs = [
  {
    q: "How do I create my digital card?",
    a: "Sign up free, then edit your profile under Dashboard → My Card. Your public URL is /p/your-slug.",
  },
  {
    q: "How does NFC work?",
    a: "Each physical MigSmartCard has a unique chip ID. When tapped, phones open /api/nfc/{uid}, which redirects to your live profile and logs an NFC tap event.",
  },
  {
    q: "Can I update my card after printing a QR?",
    a: "Yes. QR codes and NFC always open your live profile, so edits appear immediately without reprinting.",
  },
  {
    q: "How do leads work?",
    a: "Visitors tap Exchange Contact on your profile, submit their details, and they appear in Dashboard → Leads. You can export CSV on Pro+ plans.",
  },
  {
    q: "What are the demo logins?",
    a: "demo@migsmartcard.com, admin@migsmartcard.com, and ceo@acme.com — all use password password123.",
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Badge className="mb-4">Help Center</Badge>
      <h1 className="font-display text-3xl font-bold">How can we help?</h1>
      <p className="mt-2 text-slate-500">
        Quick answers for getting the most from MigSmartCard.
      </p>
      <div className="mt-10 space-y-4">
        {faqs.map((f) => (
          <div
            key={f.q}
            className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800"
          >
            <h2 className="font-semibold">{f.q}</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {f.a}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-8 text-sm text-slate-500">
        Still stuck?{" "}
        <Link href="/contact" className="font-semibold text-brand-600">
          Contact support
        </Link>
      </p>
    </div>
  );
}
