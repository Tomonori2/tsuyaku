/* 高坂先生の通訳 サービスワーカー（アプリを裏で支える小さなプログラム）
   役割：アプリ本体をスマホに保存して、次回から一瞬で開けるようにする。
   注意：翻訳はインターネットが要るので、そこは保存しない。 */

const CACHE = 'tsuyaku-v1.2';
const FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable.png'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).catch(() => {}));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // Geminiなど外部への通信は、そのまま通す（保存しない）
  if (new URL(req.url).origin !== self.location.origin) return;

  // まずネットを見て、だめならスマホの中の控えを使う
  e.respondWith(
    fetch(req)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
