#!/usr/bin/env node

/**
 * Vercel watchdog for routines365.
 *
 * Reads:
 * - VERCEL_TOKEN from env
 *
 * Behavior:
 * - Fetch most recent deployment via Vercel API
 * - If newest READY deployment is older than MAX_AGE_MIN (default 30), print a short alert message.
 * - Otherwise print nothing.
 */

const MAX_AGE_MIN = Number(process.env.MAX_AGE_MIN ?? "30");

// We accept either a Vercel project ID or a project name.
// - VERCEL_PROJECT_ID: recommended (unambiguous)
// - VERCEL_PROJECT: name fallback (e.g. "trackers-ebon")
const PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const PROJECT_NAME = process.env.VERCEL_PROJECT ?? "trackers-ebon";

const token = process.env.VERCEL_TOKEN;
if (!token) process.exit(0);

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function minutesAgo(tsMs) {
  return Math.round((Date.now() - tsMs) / 60000);
}

(async () => {
  try {
    // Resolve project ID if caller provided only a name.
    let projectId = PROJECT_ID;
    if (!projectId) {
      // https://vercel.com/docs/rest-api/endpoints/projects#get-a-project-by-id-or-name
      const proj = await fetchJson(`https://api.vercel.com/v9/projects/${encodeURIComponent(PROJECT_NAME)}`);
      projectId = proj?.id;
    }
    if (!projectId) return;

    // Get deployments, newest first
    // https://vercel.com/docs/rest-api/endpoints/deployments#get-deployments
    const qs = new URLSearchParams({
      projectId,
      limit: "5",
    });
    const data = await fetchJson(`https://api.vercel.com/v6/deployments?${qs}`);
    const deployments = data?.deployments ?? [];
    const ready = deployments.find((d) => d.state === "READY") ?? deployments[0];
    if (!ready) return;

    const createdMs = Number(ready.createdAt);
    const age = minutesAgo(createdMs);

    if (age <= MAX_AGE_MIN) return;

    const url = ready.url ? `https://${ready.url}` : "(no url)";
    const name = ready.name ?? PROJECT_NAME;

    // Single line so cron message stays compact
    process.stdout.write(
      `ALERT: routines365 last Vercel deploy for ${name} is ~${age}m ago. ${url}`
    );
  } catch {
    // silent on error
  }
})();
