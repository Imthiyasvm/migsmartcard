export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-bold">Privacy Policy</h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: July 13, 2026</p>
      <div className="prose prose-slate mt-8 dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        <section>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            1. Introduction
          </h2>
          <p>
            MigSmartCard (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is
            committed to protecting your privacy. This policy explains how we
            collect, use, and safeguard your personal data when you use our
            digital business card platform.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            2. Data We Collect
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Account information (name, email, password hash)</li>
            <li>Digital profile content you provide</li>
            <li>Lead/contact exchange data submitted by visitors</li>
            <li>
              Analytics (profile views, device type, approximate location,
              link clicks)
            </li>
            <li>Order and billing information for NFC cards</li>
          </ul>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            3. How We Use Data
          </h2>
          <p>
            We use your data to provide digital card services, analytics,
            lead notifications, order fulfillment, and product improvement. We
            do not sell personal data to third parties.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            4. GDPR Rights
          </h2>
          <p>
            If you are in the EEA/UK, you have rights to access, rectify, erase,
            restrict processing, data portability, and object. Contact
            privacy@migsmartcard.com to exercise these rights. You may export
            your leads as CSV from the dashboard.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            5. Security
          </h2>
          <p>
            Passwords are hashed with bcrypt. Sessions use JWT. Production
            deployments use SSL/TLS. Access is role-based (user, company admin,
            platform admin).
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            6. Cookies
          </h2>
          <p>
            We use essential cookies for authentication and optional analytics
            cookies. See our Cookie Policy for details.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            7. Contact
          </h2>
          <p>
            For privacy inquiries: privacy@migsmartcard.com
          </p>
        </section>
      </div>
    </div>
  );
}
