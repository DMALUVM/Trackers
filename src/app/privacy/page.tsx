export default function PrivacyPage() {
  return (
    <main className="min-h-dvh bg-black text-white">
      <div className="mx-auto w-full max-w-md px-6 py-10 space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-neutral-300">
          Routines365 is a personal routines tracker. We collect the minimum data
          needed to run the app and sync your progress across devices.
        </p>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">What we collect</h2>
          <ul className="text-sm text-neutral-300 space-y-1">
            <li>• Account email (for authentication)</li>
            <li>• Your routines, checkmarks, and activity logs (so the app works)</li>
            <li>• Basic technical data required to operate the service</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">How we use your data</h2>
          <ul className="text-sm text-neutral-300 space-y-1">
            <li>• To authenticate you and keep you signed in</li>
            <li>• To sync your routines and progress to the cloud</li>
            <li>• To improve reliability and fix bugs</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">Your choices</h2>
          <p className="text-sm text-neutral-300">
            You can export your data from Settings. If you want your account and
            data deleted, contact us.
          </p>
        </section>

        <p className="text-xs text-neutral-500">
          This is a draft policy for V1. We will refine as we finalize public
          launch.
        </p>

        <a className="text-sm text-neutral-300 underline" href="/">
          Back
        </a>
      </div>
    </main>
  );
}
