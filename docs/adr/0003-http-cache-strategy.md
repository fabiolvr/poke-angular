# ADR-0003: Cache HTTP in-memory LRU via interceptor

- **Status**: Accepted
- **Data**: 2026-05-16
- **Decisores**: Tech Lead

## Contexto

A PokéAPI tem rate limits, e os recursos que a Pokédex consome
(`/pokemon/*`, `/pokemon-species/*`, `/evolution-chain/*`, `/pokemon
?limit=20000`) são **funcionalmente imutáveis** para uma sessão de
usuário: os dados não mudam ao longo da navegação, e a chance de
um Pokémon ser editado entre dois cliques é nula.

A listagem faz fan-out N+1 (1 chamada de lista + 20 detalhes por
página), o detalhe faz 2-3 chamadas, e a busca depende de um índice
único de ~120 kB. Sem cache, **cada clique em "voltar" e cada page-1
revisitada custaria 21 requests**.

## Decisão

Implementar **`HttpCacheStore` + `cacheInterceptor`** como cache LRU
em memória, cap de 200 entradas, keyed por `urlWithParams`. Apenas
métodos GET são cacheados; respostas com erro **não** entram no
store.

Implementação:

- `HttpCacheStore` (`providedIn: 'root'`) — `Map<string, HttpResponse>`
  com promoção LRU via delete+set em hit.
- `cacheInterceptor` (functional) — antes do error interceptor.
- Sem TTL. Sem `Cache-Control` honrando o servidor. Eviction só por
  capacidade.

## Alternativas Consideradas

- **`localStorage`** — descartado: payloads grandes (índice de busca
  sozinho é ~120 kB; uma sessão de browsing pode acumular 5+ MB),
  serialização/desserialização cara, invalidação frágil entre versões
  de schema da PokéAPI.
- **Sem cache, confiar em `Cache-Control` do navegador** — descartado:
  PokéAPI envia `Cache-Control: public, max-age=86400` mas SPAs ainda
  pagam o RTT a cada `fetch`. Em conexões 3G/4G é perceptível.
- **Service Worker com cache strategy** — descartado: o plano explícito
  proíbe PWA e offline-first. SW adiciona complexidade de invalidação
  e deploy.
- **`shareReplay(1)` em observables de repositório** — funciona para a
  vida de uma referência, mas não atravessa diferentes instâncias de
  `rxResource` (cada componente cria a sua).

## Consequências

### Positivas

- Visitas repetidas a uma página de detalhe ou paginação anterior
  rendem instantaneamente, sem rede.
- O fan-out N+1 da listagem só é pago uma vez por sessão.
- Retry após erro só refaz as requests que falharam — as 19/20 que
  passaram batem no cache.

### Negativas / Trade-offs

- Cap fixo de 200 entradas: usuário que paginar até ~10 páginas começa
  a sofrer eviction. Aceitável — paginação raramente vai tão longe e
  o re-fetch só custa o que saiu do cache.
- Cache zerado a cada refresh de página. Tradeoff explícito vs
  localStorage (ver alternativas).
- Não respeita `Cache-Control` do servidor; se a PokéAPI mudar o shape
  de uma resposta no meio da sessão, o usuário não recebe a atualização
  até refresh — aceitável para nosso caso de uso.

### Neutras / Implicações futuras

- Se o app ganhar mutações (favoritar Pokémon, anotações), o cache
  precisa de invalidação seletiva. O store já expõe `clear()`; basta
  adicionar `invalidate(urlPattern)` quando necessário.

## Referências

- `src/app/core/http/http-cache.store.ts`
- `src/app/core/http/cache.interceptor.ts`
- `src/app/core/http/cache.interceptor.spec.ts`
