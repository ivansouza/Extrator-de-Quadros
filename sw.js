/*
  Service Worker (sw.js)
  
  Este arquivo gerencia o cache e o ciclo de vida da atualização.
  
  IMPORTANTE: Toda vez que você alterar QUALQUER COISA neste arquivo 
  (mesmo um comentário ou espaço) e der deploy, o navegador
  irá considerá-lo uma "nova versão" e iniciar o fluxo de atualização.
*/

// Mude este nome do cache sempre que quiser invalidar o cache antigo
// por completo (ex: v1, v2, etc.)
const CACHE_NAME = 'frame-extractor-cache-v1';

// Lista de arquivos essenciais para o "app shell"
// Adicionamos o manifest.json aqui!
const FILES_TO_CACHE = [
  './', // O index.html
  './index.html',
  './manifest.json', // <-- ADICIONADO
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap'
];

// 1. Evento 'install'
self.addEventListener('install', (event) => {
  console.log('[SW] Evento de Instalação');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cache aberto, cacheando arquivos principais...');
        const cachePromises = FILES_TO_CACHE.map(url => {
          return cache.add(url).catch(err => {
            console.warn(`[SW] Falha ao cachear ${url}:`, err);
          });
        });
        return Promise.all(cachePromises);
      })
  );
  
  // Não usamos self.skipWaiting() aqui
});

// 2. Evento 'activate'
self.addEventListener('activate', (event) => {
  console.log('[SW] Evento de Ativação');
  
  // Limpa caches antigos
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Limpando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  return self.clients.claim();
});

// 3. Evento 'fetch'
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          // console.log('[SW] Servindo do cache:', event.request.url);
          return response;
        }
        
        // console.log('[SW] Servindo da rede:', event.request.url);
        return fetch(event.request)
          .then((networkResponse) => {
            return networkResponse;
          })
          .catch(err => {
            console.error('[SW] Falha no Fetch:', err);
          });
      })
  );
});

// 4. Evento 'message'
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    console.log('[SW] Recebeu 'skipWaiting', ativando agora...');
    self.skipWaiting();
  }
});


