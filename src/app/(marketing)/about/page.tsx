export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-bold">About MigSmartCard</h1>
      <p className="mt-2 text-lg text-brand-600 font-medium">
        Smarter Way to Connect
      </p>
      <div className="mt-8 space-y-4 text-slate-600 dark:text-slate-300 leading-relaxed">
        <p>
          MigSmartCard is a modern digital business card platform built for
          professionals, sales teams, and enterprises who want to network
          without the waste and friction of paper cards.
        </p>
        <p>
          Share your profile via NFC-enabled physical cards, dynamic QR codes,
          direct links, or email signatures. Capture every lead, understand
          engagement with analytics, and manage teams from one dashboard.
        </p>
        <p>
          We believe first impressions should be digital-first, measurable, and
          always up to date — one profile that evolves with your career.
        </p>
      </div>
    </div>
  );
}
