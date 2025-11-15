// Define um nome e versão para o cache
const CACHE_NAME = 'extrator-quadros-cache-v2'; // Versão incrementada para limpar caches antigos
// Lista de arquivos a serem cacheados na instalação
const urlsToCache = [
  './',
  './index.html',
  'https://cdn.tailwindcss.com' // Cache do Tailwind
  // O manifest.json é buscado pelo navegador automaticamente
];

// Evento de Instalação: Salva os arquivos no cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Evento de Fetch: Responde com o cache ou busca na rede
self.addEventListener('fetch', event => {
    // Ignora chamadas que não são GET (ex: POST para APIs externas, o que não temos mais)
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

            // Clona a resposta para salvar no cache
            // Apenas cacheia recursos 'basic' (do mesmo domínio) e o Tailwind
            if (response.type === 'basic' || event.request.url.startsWith('https://cdn.tailwindcss.com')) {
                const responseToCache = response.clone();
                caches.open(CACHE_NAME)
                  .then(cache => {
                    cache.put(event.request, responseToCache);
                  });
            }

            return response;
          }
        );
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
  );
});