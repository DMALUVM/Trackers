import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Routines365 terms of service. Read the terms governing your use of the app.",
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <main className="min-h-dvh bg-black text-white">
      <div className="mx-auto w-full max-w-2xl px-6 py-12 space-y-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">
            Terms of Service
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Effective February 10, 2026 · Last updated February 10, 2026
          </p>
        </header>

        <p className="text-sm text-neutral-300 leading-relaxed">
          These Terms of Service (&quot;Terms&quot;) govern your use of the
          Routines365 application and website (collectively, the
          &quot;Service&quot;). By creating an account or using the Service, you
          agree to these Terms.
        </p>

        {/* ── 1. Eligibility ── */}
        <Section title="1. Eligibility">
          <p>
            You must be at least 13 years old to use Routines365. By using the
            Service, you represent that you meet this requirement.
          </p>
        </Section>

        {/* ── 2. Accounts ── */}
        <Section title="2. Your Account">
          <p>
            You are responsible for maintaining the security of your account
            credentials, including your email and any sign-in links. You agree to
            notify us promptly if you suspect unauthorized access to your
            account. We are not liable for losses resulting from unauthorized use
            of your account.
          </p>
        </Section>

        {/* ── 3. Acceptable Use ── */}
        <Section title="3. Acceptable Use">
          <p>You agree not to:</p>
          <ul className="mt-2 list-disc list-inside space-y-1.5 text-neutral-300">
            <li>
              Use the Service for any unlawful purpose or in violation of any
              applicable laws
            </li>
            <li>
              Attempt to gain unauthorized access to the Service, other user
              accounts, or our systems
            </li>
            <li>
              Interfere with or disrupt the Service or servers connected to it
            </li>
            <li>
              Reverse-engineer, decompile, or disassemble any part of the
              Service
            </li>
            <li>
              Use automated systems (bots, scrapers) to access the Service
              without our written permission
            </li>
          </ul>
        </Section>

        {/* ── 4. Subscriptions ── */}
        <Section title="4. Subscriptions and Payments">
          <p>
            Routines365 offers a free tier and optional premium subscriptions.
            Premium subscriptions are billed through Apple&rsquo;s App Store. By
            subscribing, you agree to Apple&rsquo;s payment terms. Subscriptions
            automatically renew unless canceled at least 24 hours before the end
            of the current billing period. You can manage or cancel your
            subscription in your device&rsquo;s Settings → Subscriptions.
          </p>
          <p className="mt-2">
            Standard pricing is $3.99 per month or $29.99 per year.
            Introductory offers may be available for new subscribers at a
            reduced rate for a limited time. We may change pricing with
            reasonable notice. Free trial periods, if offered, convert to paid
            subscriptions unless canceled before the trial ends.
          </p>
        </Section>

        {/* ── 5. Health Disclaimer ── */}
        <Section title="5. Health Information Disclaimer">
          <p>
            Routines365 is a habit-tracking and wellness tool. It is{" "}
            <strong className="text-neutral-200">not</strong> a medical device
            and does not provide medical advice, diagnoses, or treatment. Health
            data displayed in the app (including Apple Health metrics) is for
            informational purposes only. Always consult a qualified healthcare
            provider before making changes to your health routine.
          </p>
        </Section>

        {/* ── 6. Your Data ── */}
        <Section title="6. Your Data">
          <p>
            You retain ownership of all data you enter into Routines365. We use
            your data solely to provide and improve the Service as described in
            our{" "}
            <a
              href="/privacy"
              className="text-emerald-400 underline underline-offset-2"
            >
              Privacy Policy
            </a>
            . You can delete your account and all associated data at any time
            from Settings → Security → Delete Account within the app.
          </p>
        </Section>

        {/* ── 7. Intellectual Property ── */}
        <Section title="7. Intellectual Property">
          <p>
            The Service, including its design, code, content, and branding, is
            owned by Routines365 and protected by intellectual property laws. You
            are granted a limited, non-exclusive, non-transferable license to use
            the Service for personal, non-commercial purposes.
          </p>
        </Section>

        {/* ── 8. Service Availability ── */}
        <Section title="8. Service Availability and Changes">
          <p>
            We strive to keep Routines365 available and reliable, but we do not
            guarantee uninterrupted access. We may modify, suspend, or
            discontinue features at any time. If we make material changes that
            affect your data, we will provide reasonable notice and do our best
            to keep your data accessible.
          </p>
        </Section>

        {/* ── 9. Disclaimers ── */}
        <Section title="9. Disclaimers">
          <p>
            The Service is provided &quot;as is&quot; and &quot;as
            available&quot; without warranties of any kind, whether express or
            implied, including but not limited to implied warranties of
            merchantability, fitness for a particular purpose, and
            non-infringement. We do not warrant that the Service will be
            error-free or meet your specific requirements.
          </p>
        </Section>

        {/* ── 10. Limitation of Liability ── */}
        <Section title="10. Limitation of Liability">
          <p>
            To the maximum extent permitted by law, Routines365 shall not be
            liable for any indirect, incidental, special, consequential, or
            punitive damages, or any loss of data, profits, or goodwill, arising
            from your use of or inability to use the Service. Our total liability
            for any claim arising from these Terms shall not exceed the amount
            you paid us in the 12 months preceding the claim.
          </p>
        </Section>

        {/* ── 11. Termination ── */}
        <Section title="11. Termination">
          <p>
            You may stop using the Service and delete your account at any time.
            We reserve the right to suspend or terminate your access if you
            violate these Terms. Upon termination, your right to use the Service
            ceases and we may delete your data in accordance with our Privacy
            Policy.
          </p>
        </Section>

        {/* ── 12. Changes ── */}
        <Section title="12. Changes to These Terms">
          <p>
            We may update these Terms from time to time. If we make material
            changes, we will notify you through the app or by email. Continued
            use of the Service after changes take effect constitutes your
            acceptance of the revised Terms.
          </p>
        </Section>

        {/* ── 13. Governing Law ── */}
        <Section title="13. Governing Law">
          <p>
            These Terms are governed by the laws of the United States. Any
            disputes arising from these Terms will be resolved in accordance with
            applicable law.
          </p>
        </Section>

        {/* ── 14. Contact ── */}
        <Section title="14. Contact Us">
          <p>
            If you have questions about these Terms, please contact us at{" "}
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
