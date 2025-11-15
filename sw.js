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
const FILES_TO_CACHE = [
  './', // O index.html
  './index.html',
  './manifest.json',
  // Adicione aqui os caminhos para ícones, CSS ou JS se eles existirem
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap'
];

// 1. Evento 'install'
// Chamado quando o novo SW é baixado.
self.addEventListener('install', (event) => {
  console.log('[SW] Evento de Instalação');
  
  // Pré-cache dos arquivos essenciais
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cache aberto, cacheando arquivos principais...');
        // O `addAll` falha se *um* arquivo falhar.
        // Usamos `add` individualmente com `catch` para ser mais robusto.
        const cachePromises = FILES_TO_CACHE.map(url => {
          return cache.add(url).catch(err => {
            console.warn(`[SW] Falha ao cachear ${url}:`, err);
          });
        });
        return Promise.all(cachePromises);
      })
  );
  
  // NÃO usamos self.skipWaiting() aqui
  // Queremos que o index.html controle quando o SW deve assumir.
});

// 2. Evento 'activate'
// Chamado quando o SW antigo é liberado e o novo assume.
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
  
  // Assume o controle de todas as abas abertas imediatamente
  return self.clients.claim();
});

// 3. Evento 'fetch'
// Intercepta todas as requisições de rede (imagens, CSS, JS, etc.)
self.addEventListener('fetch', (event) => {
  // Usamos a estratégia "Cache-First" (Primeiro o Cache)
  // É rápido e funciona offline.
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Se encontramos no cache, retorna do cache
        if (response) {
          // console.log('[SW] Servindo do cache:', event.request.url);
          return response;
        }
        
        // Se não, vai para a rede
        // console.log('[SW] Servindo da rede:', event.request.url);
        return fetch(event.request)
          .then((networkResponse) => {
            // (Opcional) Podemos clonar e salvar a resposta da rede no cache 
            // para a próxima vez, mas isso não é necessário para os arquivos
            // principais que já estão no 'install'.
            return networkResponse;
          })
          .catch(err => {
            console.error('[SW] Falha no Fetch:', err);
            // (Opcional) Poderíamos retornar uma página offline aqui
          });
      })
  );
});

// 4. Evento 'message'
// Ouve por mensagens do index.html
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    console.log('[SW] Recebeu 'skipWaiting', ativando agora...');
    self.skipWaiting();
  }
});

