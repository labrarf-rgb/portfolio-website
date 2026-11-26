/*
 * TTePub service worker: the app shell, offline.
 *
 * Adapted from Estoria's worker (same hard-won fixes, same shape). TTePub keeps every book,
 * score and saved place in this browser already, so the only thing between a reader and
 * typing offline is the HTML, JS, CSS, fonts and the bundled sample. This caches those.
 *
 * Shared origin (ingestion.md 4.3): www.labrarf.com is one origin for every app on the site.
 * This worker is registered from /ttepub/sw.js with scope /ttepub/, so it only ever controls
 * TTePub's pages, and every cache it creates or deletes starts with "ttepub-". Estoria's and
 * Twenty Q's caches are never touched.
 *
 * Versioning: this file is static (public/, Vite never touches it), so the page registers it
 * as `sw.js?v=<commit>`, the same short SHA that the build stamps into index.html
 * (<meta name="ttepub-build">) and dist/version.json. A new deploy means a new script URL,
 * so the browser installs a new worker, which fills a new cache and drops the old ones.
 *
 * It deliberately does NOT call skipWaiting() on install: a new version waits, and the app
 * offers a reload (never on the typing screen) instead of swapping the code out from under
 * someone mid-chapter. See src/ui/sw.ts.
 */

/**
 * KILL SWITCH: flip to `true`, commit, `npm run deploy`.
 *
 * Every installed copy then tears itself down on its next visit: ttepub- caches deleted,
 * registration unregistered, every request straight to the network. The browser re-fetches
 * sw.js from the network on navigation, so a deployed `true` reaches clients even when the
 * cached shell is broken. It does not reload anyone. Flip it back once the cause is fixed.
 *
 * For one person instead of everyone, send them to …/ttepub/?sw=off (src/ui/sw.ts).
 */
const KILL_SWITCH = false;

const PREFIX = "ttepub-";
const BUILD = new URL(self.location.href).searchParams.get("v") || "dev";
const SHELL = `${PREFIX}shell-${BUILD}`;
const FONTS = `${PREFIX}fonts`; // survives builds: the webfonts don't change

/** Same-origin files that aren't named in index.html but the app needs offline. */
const EXTRAS = [
  "./manifest.webmanifest",
  "./favicon-32.png",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
  // "Try a sample chapter" (src/ingest/sample.ts) fetches both.
  "./sample/masque-of-the-red-death.json",
  "./sample/masque-of-the-red-death.epub",
];

/** Delete every cache this app has ever created, and nothing else on the origin. */
async function dropAllCaches() {
  const names = await caches.keys();
  await Promise.all(names.filter((n) => n.startsWith(PREFIX)).map((n) => caches.delete(n)));
}

/**
 * Drop shell caches belonging to neither this worker nor the one running the app. Runs at
 * install, not only at activate: a worker that installs but never activates (the update
 * hasn't been taken yet) still fills a cache, so this bounds them to two.
 */
async function dropSupersededShells() {
  const keep = new Set([SHELL]);
  const active = self.registration.active?.scriptURL;
  if (active) keep.add(`${PREFIX}shell-${new URL(active).searchParams.get("v") || "dev"}`);
  const names = await caches.keys();
  await Promise.all(
    names.filter((n) => n.startsWith(`${PREFIX}shell-`) && !keep.has(n)).map((n) => caches.delete(n)),
  );
}

/** Which build an index.html belongs to, from the stamp the build injects. Null if none. */
function htmlBuild(html) {
  const m = html.match(/<meta name="ttepub-build" content="([^"]+)"/);
  return m ? m[1] : null;
}

/**
 * The shell gate: store an index.html as the offline shell only if it is *this* worker's.
 *
 * - A different build: after a deploy the old worker is still active and sees the new HTML.
 *   Filing it under the old SHELL pairs new markup with old hashed assets, and offline the
 *   page comes up blank.
 * - Not an app at all: cache.put happily stores a 404 or a 502, which GitHub Pages serves
 *   mid-deploy. Cached once, an error page would be the offline shell.
 */
async function cacheShell(res) {
  if (!res.ok) return;
  const html = await res.text();
  const build = htmlBuild(html);
  if (build === null || build !== BUILD) return;
  const cache = await caches.open(SHELL);
  await cache.put("./", new Response(html, { headers: res.headers }));
  return html;
}

/** Every "assets/…" path a text file names (index.html, the JS bundles, the CSS). */
function assetRefs(text) {
  return [...text.matchAll(/assets\/[^"'`)\s?#]+/g)].map((m) => `./${m[0]}`);
}

/**
 * Precache the shell at install, so the app works offline after the very first visit.
 *
 * index.html names the entry script and stylesheet, but the EPUB import worker is named only
 * inside the entry script, so each script is read too and what it names is added (to a
 * fixed point, in case a chunk names another).
 */
async function precache() {
  await dropSupersededShells(); // free the space before claiming more of it
  const cache = await caches.open(SHELL);
  const urls = new Set(EXTRAS);
  let html;
  try {
    // "./" itself is written only by cacheShell, with its checks. A deploy can land between
    // install and this fetch, so the same build check applies.
    html = await cacheShell(await fetch("./", { cache: "reload" }));
  } catch {
    // Offline or a failed fetch: cache what we can. A rejected install would leave no worker.
  }
  if (html) {
    const queue = assetRefs(html);
    const seen = new Set();
    while (queue.length) {
      const u = queue.shift();
      if (seen.has(u)) continue;
      seen.add(u);
      urls.add(u);
      if (!/\.(js|css)$/.test(u)) continue;
      try {
        const res = await fetch(u);
        if (!res.ok) continue;
        await cache.put(u, res.clone());
        for (const ref of assetRefs(await res.text())) if (!seen.has(ref)) queue.push(ref);
      } catch {
        // left for the runtime handler
      }
    }
    await precacheFonts(html);
  }
  await Promise.all(
    [...urls].map(async (u) => {
      if (await cache.match(u)) return;
      await cache.add(u).catch(() => {});
    }),
  );
}

/**
 * The Google Fonts stylesheet and its Latin files, so the type looks right offline too.
 * The page fetched them before this worker existed, so the runtime handler never saw them.
 * Other scripts (Cyrillic, Greek, Vietnamese) are fetched and cached on first use.
 */
async function precacheFonts(html) {
  const m = html.match(/href="(https:\/\/fonts\.googleapis\.com\/css2[^"]+)"/);
  if (!m) return;
  try {
    const href = m[1].replace(/&amp;/g, "&");
    const cache = await caches.open(FONTS);
    const res = await fetch(href);
    if (!res.ok) return;
    await cache.put(href, res.clone());
    const css = await res.text();
    const files = new Set();
    for (const block of css.split("/* ").slice(1)) {
      if (!/^latin(-ext)? \*\//.test(block)) continue;
      const f = block.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/);
      if (f) files.add(f[1]);
    }
    await Promise.all([...files].map((f) => cache.add(f).catch(() => {})));
  } catch {
    // Fonts are a nicety; the app works with the fallback stack.
  }
}

self.addEventListener("install", (e) => {
  if (KILL_SWITCH) return void self.skipWaiting();
  e.waitUntil(precache());
});

self.addEventListener("activate", (e) =>
  e.waitUntil(
    (async () => {
      if (KILL_SWITCH) {
        await dropAllCaches();
        await self.registration.unregister();
        return;
      }
      const names = await caches.keys();
      await Promise.all(
        names.filter((n) => n.startsWith(`${PREFIX}shell-`) && n !== SHELL).map((n) => caches.delete(n)),
      );
      await self.clients.claim();
    })(),
  ),
);

self.addEventListener("message", (e) => {
  if (e.data?.type === "SKIP_WAITING") self.skipWaiting();
});

async function cacheFirst(req, cacheName, matchOpts) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req, matchOpts);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === "opaque") cache.put(req, res.clone());
  return res;
}

self.addEventListener("fetch", (e) => {
  if (KILL_SWITCH) return; // answer nothing: every request goes to the network
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Webfonts: cross-origin and immutable. Google varies the stylesheet on Sec-Fetch-*, and
  // the page's request (a no-cors style load) never matches the worker's own, so ignore Vary.
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(cacheFirst(req, FONTS, { ignoreVary: true }));
    return;
  }

  if (url.origin !== self.location.origin) return;

  // version.json is how a deploy is verified: never stale, never from a cache.
  if (url.pathname.endsWith("/version.json")) return;

  // Navigations: network first, so a fresh deploy is picked up as soon as it exists; the
  // cached shell is the fallback with no network.
  if (req.mode === "navigate") {
    e.respondWith(
      (async () => {
        try {
          const res = await fetch(req);
          e.waitUntil(cacheShell(res.clone()).catch(() => {}));
          return res;
        } catch {
          const cache = await caches.open(SHELL);
          return (await cache.match("./")) ?? (await caches.match("./")) ?? Response.error();
        }
      })(),
    );
    return;
  }

  // Hashed build assets are immutable by construction: a cache hit is always correct.
  if (url.pathname.includes("/assets/")) {
    e.respondWith(cacheFirst(req, SHELL));
    return;
  }

  // Everything else same-origin (icons, manifest, the sample): cached, refreshed in the
  // background so a changed file isn't pinned for the life of the build.
  e.respondWith(
    (async () => {
      const cache = await caches.open(SHELL);
      const hit = await cache.match(req);
      const net = fetch(req)
        .then((res) => {
          if (res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => hit ?? Response.error());
      return hit ?? net;
    })(),
  );
});
