export const metadata = { title: "Cookie Policy" };

export default function CookiesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-bold">Cookie Policy</h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: July 13, 2026</p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        <p>
          MigSmartCard uses cookies and similar technologies to keep you signed
          in, remember preferences (such as dark mode), and understand how the
          product is used.
        </p>
        <section>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Essential Cookies
          </h2>
          <p>
            Required for authentication (session/JWT cookies) and security.
            These cannot be disabled if you use the service.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Preference Cookies
          </h2>
          <p>
            Store UI preferences such as theme (light/dark) in localStorage.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Analytics
          </h2>
          <p>
            Profile view analytics are first-party events stored on our servers.
            We do not use third-party ad trackers by default.
          </p>
        </section>
      </div>
    </div>
  );
}
