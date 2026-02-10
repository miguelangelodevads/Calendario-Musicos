const CACHE_NAME = "meus-shows-dark-v7"; // Mudei para v7
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json",
  "./icon.png", // Certifique-se que o arquivo existe com esse nome!
];

/* ... mantenha o resto do código igual ... */
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener("fetch", (e) => {
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keyList) =>
      Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        }),
      ),
    ),
  );
});
