import Link from "next/link";
import { DEMO_PROFILES } from "@/lib/demo-profiles";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Demo Profiles",
  description: "Preview Classic, Glass, and Premium MigSmartCard templates.",
};

const ORDER = ["alex-rivera", "jordan-lee", "sam-chen"] as const;

const LABELS: Record<string, { badge: string; style: string }> = {
  "alex-rivera": { badge: "Free", style: "Classic" },
  "jordan-lee": { badge: "Pro+", style: "Glass" },
  "sam-chen": { badge: "Pro+", style: "Premium" },
};

export default function DemosPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <Badge className="mb-4">Live demos</Badge>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Minimal. Premium. Live.
        </h1>
        <p className="mt-3 text-slate-500">
          Three polished demo profiles. Open any profile to experience the full
          digital experience.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        {ORDER.map((slug) => {
          const p = DEMO_PROFILES[slug];
          const meta = LABELS[slug];
          return (
            <Link
              key={slug}
              href={`/p/${slug}`}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-card dark:border-[#1a1a1a] dark:bg-[#111]"
            >
              <div
                className="relative h-32 bg-cover bg-center"
                style={{ backgroundImage: `url(${p.coverImage})` }}
              >
                <span className="absolute right-3 top-3 rounded-full bg-black/55 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-white">
                  {meta.badge}
                </span>
              </div>
              <div className="-mt-11 flex flex-col items-center px-4 pb-7">
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-white bg-[#E8E6E3] shadow-lg ring-1 ring-black/5 dark:border-[#1a1a1a]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.profilePhoto}
                    alt={p.fullName}
                    width={96}
                    height={96}
                    className="h-24 w-24 max-w-none object-cover object-[center_15%]"
                  />
                </div>
                <h2 className="mt-3 text-lg font-bold group-hover:text-brand-600">
                  {p.fullName}
                </h2>
                <p className="text-xs text-slate-500">
                  {p.jobTitle} · {p.companyName}
                </p>
                <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  {meta.style}
                </p>
                <span className="mt-4 text-xs font-semibold text-brand-600">
                  Open live profile →
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
