// Keeps the installed app quick to open: build files and fonts come from the saved copy,
// pages wait at most 1.5s for the network before falling back to it, and everything works offline.
const CACHE = 'page234-v2';
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) =>
  e.waitUntil((async () => {
    for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })()),
);

const save = (req, res) => {
  if (res.ok || res.type === 'opaque') {
    const copy = res.clone();
    caches.open(CACHE).then((c) => c.put(req, copy));
  }
  return res;
};

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  if (!sameOrigin && !FONT_HOSTS.includes(url.hostname)) return;

  // Hashed build files and fonts never change once published: cache first.
  if (!sameOrigin || url.pathname.includes('/assets/')) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => save(req, res))));
    return;
  }

  // Pages and other files: network first, but never keep the app waiting more than 1.5s.
  const fromCache = async () => (await caches.match(req)) ?? (req.mode === 'navigate' ? await caches.match(self.registration.scope) : undefined);
  e.respondWith(new Promise((resolve) => {
    let done = false;
    const finish = (res) => { if (!done) { done = true; resolve(res); } };
    const timer = setTimeout(async () => { const hit = await fromCache(); if (hit) finish(hit); }, 1500);
    fetch(req)
      .then((res) => { clearTimeout(timer); finish(save(req, res)); })
      .catch(async () => { clearTimeout(timer); finish((await fromCache()) ?? Response.error()); });
  }));
});
