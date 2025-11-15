// Define um nome e versão para o cache
const CACHE_NAME = 'extrator-quadros-cache-v4'; // Versão incrementada para atualizar o cache com os novos ícones
// Lista de arquivos a serem cacheados na instalação
const urlsToCache = [
  './',
  './index.html',
  './manifest.json', 
  'https://cdn.tailwindcss.com',
  // ATUALIZADO: Adiciona os URLs dos ícones placeholder ao cache
  'https://placehold.co/192x192/4f46e5/ffffff?text=Quadros&font=inter',
  'https://placehold.co/512x512/4f46e5/ffffff?text=Extrator+de+Quadros&font=inter'
];

// Evento de Instalação: Salva os arquivos no cache
self.addEventListener('install', event => {
  // Pula a espera para ativar o novo service worker mais rápido
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        // Tenta adicionar todos os URLs, mas não falha se um falhar (ex: placehold.co offline)
        cache.addAll(urlsToCache).catch(err => {
            console.warn('Não foi possível cachear todos os recursos iniciais:', err);
        });
      })
  );
});

// Evento de Fetch: Responde com o cache ou busca na rede
self.addEventListener('fetch', event => {
    // Ignora chamadas que não são GET
    if (event.request.method !== 'GET') {
        return;
    }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se o recurso estiver no cache, retorna ele
        if (response) {
          return response;
        }

        // Se não, busca na rede, salva no cache e retorna
        return fetch(event.request).then(
          response => {
            // Verifica se a resposta é válida
            if (!response || response.status !== 200) {
              return response;
            }
            
            // ATUALIZADO: Lógica para cachear recursos externos
            const url = event.request.url;
            if (response.type === 'basic' || url.startsWith('https://cdn.tailwindcss.com') || url.startsWith('https://placehold.co')) {
                const responseToCache = response.clone();
                caches.open(CACHE_NAME)
                  .then(cache => {
                    cache.put(event.request, responseToCache);
                  });
            }

            return response;
          }
        ).catch(err => {
            // Em caso de falha na rede (offline), tenta encontrar algo no cache
            console.warn('Fetch falhou, tentando cache:', err);
        });
      })
  );
});

// Evento de Ativação: Limpa caches antigos
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // Deleta caches que não estão na whitelist (caches antigos)
            console.log('Limpando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    // Força o service worker ativado a tomar controle imediato da página
    .then(() => self.clients.claim())
  );
});
