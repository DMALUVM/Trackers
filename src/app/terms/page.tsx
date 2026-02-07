export default function TermsPage() {
  return (
    <main className="min-h-dvh bg-black text-white">
      <div className="mx-auto w-full max-w-md px-6 py-10 space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Terms of Service</h1>
        <p className="text-sm text-neutral-300">
          By using Routines365, you agree to use the service responsibly. The app
          is provided “as is” without warranties. It is not medical advice.
        </p>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">Accounts</h2>
          <p className="text-sm text-neutral-300">
            You are responsible for maintaining the confidentiality of your login
            link and access to your email account.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">Acceptable use</h2>
          <p className="text-sm text-neutral-300">
            Don’t misuse the service, attempt to break security, or interfere with
            other users.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">Data</h2>
          <p className="text-sm text-neutral-300">
            You can export your data from Settings. We may change features over
            time. If the service changes, we will do our best to keep your data
            accessible.
          </p>
        </section>

        <p className="text-xs text-neutral-500">
          This is a draft for V1. We will refine for public launch.
        </p>

        <a className="text-sm text-neutral-300 underline" href="/">
          Back
        </a>
      </div>
    </main>
  );
}
