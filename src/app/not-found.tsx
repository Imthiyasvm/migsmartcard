import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-semibold text-brand-600">404</p>
      <h1 className="mt-2 text-2xl font-bold">Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        If you expected the MigSmartCard home page, check that Vercel Root
        Directory is the folder containing package.json, Framework is Next.js,
        and the deployment build succeeded.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white"
      >
        Go home
      </Link>
    </div>
  );
}
