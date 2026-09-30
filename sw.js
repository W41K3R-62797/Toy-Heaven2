/* Toy Haven service worker — caches the shell so the shop works offline. */

const CACHE = "toy-haven-v3";

const CORE = [
  "./html/index.html",
  "./html/products.html",
  "./html/cart.html",
  "./html/checkout.html",
  "./html/wishlist.html",
  "./html/feedback.html",
  "./css/shared.css",
  "./css/home.css",
  "./css/products.css",
  "./css/cart.css",
  "./css/checkout.css",
  "./css/wishlist.css",
  "./css/feedback.css",
  "./js/products-data.js",
  "./js/app.js",
  "./js/home.js",
  "./js/products.js",
  "./js/cart.js",
  "./js/checkout.js",
  "./js/wishlist.js",
  "./js/feedback.js",
  "./json/products.json",
  "./offline.html",
  "./manifest.json",
  "./favicon.ico",
  "./favicon-32.png",
  "./apple-touch-icon.png",
  "./icon-192.png",
  "./icon-512.png",
  "./images/logo-mark.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return Promise.all(
        CORE.map(function (url) {
          return cache.add(url).catch(function () {
            return undefined;
          });
        })
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (key) {
            return key !== CACHE;
          })
          .map(function (key) {
            return caches.delete(key);
          })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") {
    return;
  }
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) {
        return cached;
      }
      return fetch(event.request)
        .then(function (response) {
          const copy = response.clone();
          caches.open(CACHE).then(function (cache) {
            cache.put(event.request, copy);
          });
          return response;
        })
        .catch(function () {
          if (event.request.mode === "navigate") {
            return caches.match("./offline.html");
          }
          return new Response("", { status: 503, statusText: "Offline" });
        });
    })
  );
});
