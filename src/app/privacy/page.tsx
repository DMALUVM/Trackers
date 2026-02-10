import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Routines365 privacy policy. Learn how we collect, use, and protect your personal data.",
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-dvh bg-black text-white">
      <div className="mx-auto w-full max-w-2xl px-6 py-12 space-y-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Effective February 10, 2026 · Last updated February 10, 2026
          </p>
        </header>

        <p className="text-sm text-neutral-300 leading-relaxed">
          Routines365 (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is a
          daily habit-tracking application. We respect your privacy and are
          committed to collecting only the minimum data needed to provide and
          improve the service. This policy explains what data we collect, how we
          use it, and your rights.
        </p>

        {/* ── 1. Data We Collect ── */}
        <Section title="1. Data We Collect">
          <SubSection title="Account information">
            <p>
              When you create an account we collect your email address.
              Authentication is handled by Supabase Auth (magic link, email +
              password, or one-time passcode).
            </p>
          </SubSection>

          <SubSection title="Routine and activity data">
            <p>
              Your routines, daily check-ins, journal entries, activity logs,
              streak history, quest progress, and settings are stored so the app
              can function and sync across devices.
            </p>
          </SubSection>

          <SubSection title="Apple Health data (optional)">
            <p>
              If you grant permission, the app reads health metrics from Apple
              Health (HealthKit), including sleep stages, heart rate, heart rate
              variability (HRV), resting heart rate, blood oxygen (SpO₂),
              respiratory rate, and step count. This data is used exclusively to
              display insights within the app and to auto-complete habits based
              on your health goals.
            </p>
            <p className="mt-2 font-semibold text-neutral-200">
              We do not sell, share, or transfer Apple Health data to any third
              party for any purpose — including advertising, data brokering, or
              analytics. Health data is processed on your device and is never
              stored on our servers.
            </p>
          </SubSection>

          <SubSection title="Technical data">
            <p>
              We automatically collect minimal technical data required to operate
              the service, such as device type, operating system version, and
              crash reports. We do not use third-party analytics or advertising
              SDKs.
            </p>
          </SubSection>
        </Section>

        {/* ── 2. How We Use Your Data ── */}
        <Section title="2. How We Use Your Data">
          <ul className="list-disc list-inside space-y-1.5 text-neutral-300">
            <li>To authenticate your account and keep you signed in</li>
            <li>To sync your routines, progress, and settings across devices</li>
            <li>To display streaks, milestones, reports, and insights</li>
            <li>
              To auto-complete habits when Apple Health data meets your
              configured goals (on-device only)
            </li>
            <li>To send reminders and notifications you have opted into</li>
            <li>To improve reliability, fix bugs, and develop new features</li>
          </ul>
        </Section>

        {/* ── 3. Data Storage and Security ── */}
        <Section title="3. Data Storage and Security">
          <p>
            Account and routine data is stored in a Supabase-hosted PostgreSQL
            database secured with row-level security (RLS). All data is
            transmitted over HTTPS/TLS. We follow industry best practices to
            protect your information, but no method of electronic transmission or
            storage is 100% secure.
          </p>
        </Section>

        {/* ── 4. Data Sharing ── */}
        <Section title="4. Data Sharing">
          <p>
            We do not sell or rent your personal data. We share data only in
            these limited circumstances:
          </p>
          <ul className="mt-2 list-disc list-inside space-y-1.5 text-neutral-300">
            <li>
              <strong className="text-neutral-200">
                Accountability partners:
              </strong>{" "}
              If you opt into the partner feature, your daily completion status
              is shared with your linked partner.
            </li>
            <li>
              <strong className="text-neutral-200">
                Service providers:
              </strong>{" "}
              We use Supabase for database hosting and authentication, and Vercel
              for web hosting. These providers process data on our behalf under
              their respective privacy policies.
            </li>
            <li>
              <strong className="text-neutral-200">Legal obligations:</strong>{" "}
              We may disclose data if required by law or to protect the rights
              and safety of our users.
            </li>
          </ul>
        </Section>

        {/* ── 5. Data Retention ── */}
        <Section title="5. Data Retention">
          <p>
            We retain your data for as long as your account is active. If you
            delete your account, all associated data is permanently removed from
            our servers within 30 days.
          </p>
        </Section>

        {/* ── 6. Your Rights ── */}
        <Section title="6. Your Rights and Choices">
          <ul className="list-disc list-inside space-y-1.5 text-neutral-300">
            <li>
              <strong className="text-neutral-200">Delete your account:</strong>{" "}
              You can permanently delete your account and all associated data
              from Settings → Security → Delete Account within the app.
            </li>
            <li>
              <strong className="text-neutral-200">Revoke health access:</strong>{" "}
              You can revoke Apple Health permissions at any time in your
              device&rsquo;s Settings → Health → Data Access.
            </li>
            <li>
              <strong className="text-neutral-200">
                Manage notifications:
              </strong>{" "}
              You can disable push notifications from Settings → Notifications
              within the app or your device settings.
            </li>
            <li>
              <strong className="text-neutral-200">Export your data:</strong>{" "}
              You can request a copy of your data by contacting us at the email
              below.
            </li>
          </ul>
        </Section>

        {/* ── 7. Children's Privacy ── */}
        <Section title="7. Children&rsquo;s Privacy">
          <p>
            Routines365 is not intended for children under 13. We do not
            knowingly collect personal information from children. If you believe
            a child has provided us with personal data, please contact us and we
            will delete it.
          </p>
        </Section>

        {/* ── 8. Changes ── */}
        <Section title="8. Changes to This Policy">
          <p>
            We may update this privacy policy from time to time. If we make
            material changes, we will notify you through the app or by email. The
            &quot;last updated&quot; date at the top reflects the most recent
            revision.
          </p>
        </Section>

        {/* ── 9. Contact ── */}
        <Section title="9. Contact Us">
          <p>
            If you have questions about this privacy policy or your data, please
            contact us at{" "}
            <a
              href="mailto:support@routines365.com"
              className="text-emerald-400 underline underline-offset-2"
            >
              support@routines365.com
            </a>
            .
          </p>
        </Section>

        <footer className="pt-4 border-t border-white/10">
          <a
            className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
            href="/"
          >
            ← Back to Routines365
          </a>
        </footer>
      </div>
    </main>
  );
}

/* ── Helper components ── */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <div className="text-sm text-neutral-300 leading-relaxed">{children}</div>
    </section>
  );
}

function SubSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-3">
      <h3 className="text-sm font-semibold text-neutral-200">{title}</h3>
      <div className="mt-1">{children}</div>
    </div>
  );
}
