export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-bold">Terms of Service</h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: July 13, 2026</p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        <section>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            1. Acceptance
          </h2>
          <p>
            By creating an account or using MigSmartCard, you agree to these
            Terms of Service and our Privacy Policy.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            2. Service Description
          </h2>
          <p>
            MigSmartCard provides digital business card profiles, NFC card
            integration, QR codes, analytics, lead capture, and related tools.
            Physical NFC cards are sold separately through our shop.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            3. Accounts & Plans
          </h2>
          <p>
            You are responsible for maintaining account security. Free and paid
            plans have different feature limits. Subscriptions renew until
            cancelled. Refunds are handled per our billing policy.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            4. Acceptable Use
          </h2>
          <p>
            You may not use MigSmartCard for spam, phishing, illegal content, or
            to impersonate others. We may suspend accounts that violate these
            terms.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            5. Intellectual Property
          </h2>
          <p>
            You retain rights to content you upload. You grant us a license to
            host and display it as part of the service. MigSmartCard branding and
            software remain our property.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            6. Limitation of Liability
          </h2>
          <p>
            The service is provided &quot;as is&quot;. We are not liable for
            indirect damages arising from use of the platform, subject to
            applicable law.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            7. Contact
          </h2>
          <p>legal@migsmartcard.com</p>
        </section>
      </div>
    </div>
  );
}
