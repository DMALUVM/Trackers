// ===========================================================================
// SERVICE WORKER — Offline shell + instant launch
// ===========================================================================
// Strategy: "App Shell" model
// - Cache the HTML shell, CSS, JS, and images on install
// - Network-first for API calls (Supabase data always fresh)
// - Cache-first for static assets (instant paint)
// - Stale-while-revalidate for everything else
// ===========================================================================

const CACHE_NAME = "routines365-v5";

// ---------------------------------------------------------------------------
// Push Notifications
// ---------------------------------------------------------------------------
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Routine Reminder", body: event.data.text() };
  }

  const options = {
    body: payload.body || "Time to check in!",
    icon: "/brand/pwa/icon-192.png",
    badge: "/brand/pwa/icon-192.png",
    tag: payload.tag || "routine-reminder",
    data: { url: payload.url || "/app/today" },
    vibrate: [100, 50, 100],
    actions: [
      { action: "open", title: "Open" },
      { action: "dismiss", title: "Dismiss" },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(payload.title || "Routines 365", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const url = event.notification.data?.url || "/app/today";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // Focus existing window if available
      for (const client of clients) {
        if (client.url.includes("/app/") && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      return self.clients.openWindow(url);
    })
  );
});
const SHELL_ASSETS = [
  "/app/today",
  "/brand/pwa/icon-192.png",
  "/brand/pwa/apple-touch-icon.png",
];

// Install: pre-cache the shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(SHELL_ASSETS).catch(() => {
        // Some assets may fail — that's OK, we'll cache them on first visit
      });
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: route-based strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip non-http(s) schemes (chrome-extension://, etc.)
  if (!url.protocol.startsWith("http")) return;

  // Skip Supabase API calls — always network-first for fresh data
  if (url.hostname.includes("supabase")) return;

  // Skip auth-related requests
  if (url.pathname.includes("/auth/")) return;

  // Immutable static assets (images, fonts, CSS) — cache-first
  // NOTE: JS is NOT here — JS chunks must be network-first to prevent
  // hydration crashes when deployments change chunk hashes.
  if (
    url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico|woff2?|ttf|css)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // JS chunks and _next/static — network-first with cache fallback
  // This prevents the #1 PWA crash: stale JS chunks from old deployments
  // trying to manipulate DOM rendered by new HTML.
  if (
    url.pathname.match(/\.js$/) ||
    url.pathname.startsWith("/_next/static/")
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request).then((c) => c || Response.error()))
    );
    return;
  }

  // Navigation requests (HTML pages) — network-first with cache fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((c) => c || caches.match("/app/today")))
    );
    return;
  }

  // Everything else — stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
      return cached || fetchPromise;
    })
  );
});
