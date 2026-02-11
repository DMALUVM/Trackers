// ===========================================================================
// SERVICE WORKER — Offline shell + cached data
// ===========================================================================
// Strategy:
// - Pre-cache the app shell (key pages, icons)
// - Cache-first for static assets (images, fonts, CSS)
// - Network-first + cache fallback for JS chunks
// - Network-first + cache fallback for navigation (HTML)
// - Network-first + cache fallback for Supabase GET requests
// - Pass through Supabase writes (queued client-side when offline)
// ===========================================================================

const CACHE_NAME = "routines365-v7";
const DATA_CACHE = "routines365-data-v2";

// ---------------------------------------------------------------------------
// Push Notifications
// ---------------------------------------------------------------------------
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try { payload = event.data.json(); }
  catch { payload = { title: "Routine Reminder", body: event.data.text() }; }

  event.waitUntil(
    self.registration.showNotification(payload.title || "Routines 365", {
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
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "dismiss") return;
  const url = event.notification.data?.url || "/app/today";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes("/app/") && "focus" in client) return client.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});

// ---------------------------------------------------------------------------
// Pre-cache shell
// ---------------------------------------------------------------------------
const SHELL_ASSETS = [
  "/app/today",
  "/app/breathwork",
  "/app/movement",
  "/app/focus",
  "/app/journal",
  "/brand/pwa/icon-192.png",
  "/brand/pwa/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(SHELL_ASSETS).catch(() => {})
    )
  );
  self.skipWaiting();
});

// ---------------------------------------------------------------------------
// Activate: clean old caches
// ---------------------------------------------------------------------------
self.addEventListener("activate", (event) => {
  const keep = new Set([CACHE_NAME, DATA_CACHE]);
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !keep.has(k)).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ---------------------------------------------------------------------------
// Clear caches on sign-out (prevents stale user data leaking)
// ---------------------------------------------------------------------------
self.addEventListener("message", (event) => {
  if (event.data === "SIGN_OUT") {
    event.waitUntil(
      caches.delete(DATA_CACHE).then(() =>
        caches.delete(CACHE_NAME)
      )
    );
  }
});

// ---------------------------------------------------------------------------
// Fetch strategies
// ---------------------------------------------------------------------------
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;
  if (!url.protocol.startsWith("http")) return;
  if (url.pathname.includes("/auth/")) return;

  // ── Supabase data: network-first → cache fallback ──
  if (url.hostname.includes("supabase")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const cacheKey = new Request(url.pathname + url.search);
            const clone = response.clone();
            caches.open(DATA_CACHE).then((cache) => cache.put(cacheKey, clone));
          }
          return response;
        })
        .catch(() => {
          const cacheKey = new Request(url.pathname + url.search);
          return caches.match(cacheKey, { cacheName: DATA_CACHE })
            .then((cached) => cached || new Response(JSON.stringify({ offline: true, data: [] }), {
              status: 503,
              headers: { "Content-Type": "application/json" },
            }));
        })
    );
    return;
  }

  // ── Static assets — cache-first ──
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico|woff2?|ttf|css)$/)) {
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

  // ── JS chunks — network-first ──
  if (url.pathname.match(/\.js$/) || url.pathname.startsWith("/_next/static/")) {
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

  // ── Navigation — network-first ──
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

  // ── Everything else — stale-while-revalidate ──
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
