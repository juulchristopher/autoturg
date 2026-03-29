export default function Privacy() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mt-1">Last updated: March 2026</p>
      </div>

      <section className="space-y-2">
        <h2 className="text-base font-semibold">Who we are</h2>
        <p className="text-sm text-muted-foreground">
          Autoturg is an Estonian used car market intelligence platform. This policy explains what data we collect and how we use it.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold">Data we collect</h2>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li><strong>Email address</strong> — when you create an account. Used only for authentication.</li>
          <li><strong>Subscription status</strong> — whether you have an active subscription or report purchases.</li>
          <li>We do not collect analytics, track page views, or use advertising cookies.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold">Where data is stored</h2>
        <p className="text-sm text-muted-foreground">
          Account data is stored with <strong>Supabase</strong> in the EU (Frankfurt, Germany), which complies with GDPR. Payment data is processed by <strong>Lemon Squeezy</strong>, a Merchant of Record operating under EU data protection law.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold">Your rights</h2>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>Access the data we hold about you</li>
          <li>Delete your account and all associated data</li>
          <li>Export your data</li>
        </ul>
        <p className="text-sm text-muted-foreground">
          To exercise these rights, sign in and use the account settings, or contact us directly.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold">Cookies</h2>
        <p className="text-sm text-muted-foreground">
          We use a single session cookie to keep you signed in. No tracking or advertising cookies are used.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold">Market data</h2>
        <p className="text-sm text-muted-foreground">
          Market statistics shown on this site are sourced from Transpordiamet (Estonian Road Administration) public data releases and Statistikaamet. No personal vehicle owner data is displayed.
        </p>
      </section>
    </main>
  );
}
