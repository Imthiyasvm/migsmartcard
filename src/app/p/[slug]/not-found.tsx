import Link from "next/link";

export default function ProfileNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-semibold text-brand-600">Card not found</p>
      <h1 className="mt-2 text-2xl font-bold">This digital card is unavailable</h1>
      <p className="mt-3 max-w-md text-sm text-slate-500">
        The link may be wrong, the profile may be private, or on free Vercel
        hosting the card data may have reset. Open{" "}
        <strong>Dashboard → My Card → Live Preview</strong> to view your card,
        then click <strong>Save &amp; Open Link</strong>.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/dashboard/profile"
          className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Edit my card
        </Link>
        <Link
          href="/p/alex-rivera"
          className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold"
        >
          View demo card
        </Link>
      </div>
    </div>
  );
}
