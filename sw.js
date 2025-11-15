// Define um nome e versão para o cache
const CACHE_NAME = 'extrator-quadros-cache-v1';

// Lista de URLs (recursos) para adicionar ao cache durante a instalação
const urlsToCache = [
  './', // Cacheia a raiz (geralmente o index.html)
  './index.html', // Cacheia o arquivo HTML principal
  'https://cdn.tailwindcss.com' // Cacheia o script do Tailwind
  // Adicione aqui outros assets, como ícones ou o manifest.json, se necessário
  // './manifest.json',
  // './icon-192.png', 
];

// Evento 'install': É disparado quando o Service Worker é instalado
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando...');
  // Espera a instalação terminar
  event.waitUntil(
    // Abre o cache com o nome definido
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cache aberto. Adicionando URLs...');
        // Adiciona todos os URLs da lista 'urlsToCache' ao cache
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Todos os recursos foram cacheados com sucesso.');
        // Força o novo Service Worker a se tornar ativo
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Falha ao cachear arquivos durante a instalação.', error);
      })
  );
});

// Evento 'activate': É disparado quando o Service Worker é ativado
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Ativando...');
  event.waitUntil(
    // Limpa caches antigos
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Se o nome do cache não for o cache atual, ele é deletado
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Limpando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Torna este Service Worker o controlador da página imediatamente
      return self.clients.claim();
    })
  );
});

// Evento 'fetch': É disparado sempre que a página faz uma requisição (ex: carregar imagem, script, etc.)
self.addEventListener('fetch', (event) => {
  // Responde à requisição
  event.respondWith(
    // Tenta encontrar a requisição no cache
    caches.match(event.request)
      .then((response) => {
        // Se a requisição for encontrada no cache...
        if (response) {
          // Retorna a resposta do cache
          // console.log('Service Worker: Respondendo com cache para:', event.request.url);
          return response;
        }

        // Se não estiver no cache, faz a requisição à rede
        // console.log('Service Worker: Buscando da rede:', event.request.url);
        return fetch(event.request).then(
          (networkResponse) => {
            // Se a requisição de rede for bem-sucedida
            // (Não cacheamos requisições que não sejam 'GET' ou de extensões)
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' || event.request.method !== 'GET') {
              return networkResponse;
            }

            // Clona a resposta para que possamos colocá-la no cache e retorná-la
            const responseToCache = networkResponse.clone();

            // Abre o cache e armazena a nova resposta
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        ).catch((error) => {
          console.error('Service Worker: Erro ao buscar da rede.', error);
          // Em caso de falha de rede (e não estar no cache), pode-se retornar uma página offline, se houver
        });
      })
  );
});

