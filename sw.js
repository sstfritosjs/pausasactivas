/* ==========================================================
 * Service Worker · Pausas Activas SST
 * Permite abrir y usar la app sin señal en planta o bodega.
 * Al cambiar archivos, sube CACHE_VERSION para forzar la actualización.
 * ========================================================== */
const CACHE_VERSION = "pausas-sst-v9";

const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css?v=9",
  "./illustrations.js?v=9",
  "./routines.js?v=9",
  "./app.js?v=9",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./img/talones.jpg",
  "./img/lumbar.jpg",
  "./img/cuadriceps.jpg",
  "./img/hombros.jpg",
  "./img/cuello.jpg",
  "./img/pectoral.jpg",
  "./img/cadera.jpg",
  "./img/isquios.jpg",
  "./img/gemelos.jpg",
  "./img/muneca.jpg",
  "./img/manos.jpg"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(c => Promise.allSettled(APP_SHELL.map(u => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // NUNCA se guarda en caché la base de datos ni servicios externos:
  // deben responder siempre en vivo.
  if (url.hostname.includes("script.google.com") ||
      url.hostname.includes("googleusercontent.com") ||
      url.hostname.includes("qrserver.com")) {
    return;
  }

  // Imágenes de ejercicios: primero caché (son fijas y pesan poco)
  if (url.pathname.includes("/img/") || url.pathname.endsWith(".png")) {
    event.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_VERSION).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => hit))
    );
    return;
  }

  // Resto (html, css, js): primero red para recibir siempre la versión nueva,
  // con la caché como respaldo cuando no hay señal.
  event.respondWith(
    fetch(req)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE_VERSION).then(c => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then(hit => hit || caches.match("./index.html")))
  );
});
