# ADR-0009: Busca client-side sobre índice cacheado

- **Status**: Accepted
- **Data**: 2026-05-16
- **Decisores**: Tech Lead

## Contexto

A PokéAPI **não expõe um endpoint de full-text search** — só
`/pokemon/{name}` (exato) e `/pokemon?limit=N&offset=M` (lista
paginada com `{name, url}`). O endpoint de lista, com `limit` alto,
retorna o nome + URL de **todas** as espécies/forms em uma resposta
única (~120 kB para `limit=20000`).

O requisito do plano permite escolher client-side ou server-side e
exige justificativa. Server-side não existe; resta client-side.

## Decisão

**Busca client-side híbrida**:

1. Ao entrar em `/search`, o `PokemonIndexHttpRepository.getIndex()`
   faz **uma única** chamada `GET /pokemon?limit=20000&offset=0` e
   mapeia para `{ id, name }[]`.
2. O `cacheInterceptor` armazena a resposta; revisitas a `/search`
   na mesma sessão são render instantâneo.
3. O input do usuário alimenta um signal `query`; uma versão
   debounced (300 ms via `toObservable + debounceTime + toSignal`)
   alimenta o filtro.
4. O filtro faz `name.toLowerCase().includes(query.toLowerCase())`,
   limitado a `MAX_RESULTS = 50` com indicador "Showing first N of M"
   quando há mais.
5. Highlight do termo via componente `HighlightedText` (split em
   TypeScript + `<mark>`; nunca via `innerHTML`).
6. Keyboard nav padrão WAI-ARIA listbox lite: ↑↓ navega, Enter abre,
   Esc limpa.

## Alternativas Consideradas

- **Buscar por endpoint da PokéAPI a cada keystroke** — descartado:
  endpoint não existe; só `GET /pokemon/{name}` faz busca exata.
- **Carregar paginas conforme usuário rola e procura dentro do que
  foi visto** — descartado: UX inconsistente (resultado depende de
  quantas páginas o usuário paginou).
- **Pré-warm do índice no bootstrap da app** — descartado: usuário
  que nunca usa busca pagaria ~120 kB sem motivo. O custo extra de
  esperar 1-2s na primeira visita a `/search` é aceitável e cobertura
  via skeleton.
- **GraphQL proxy** — descartado: novo serviço para um problema sem
  ganho proporcional.
- **IndexedDB / OPFS** — descartado: payload é leve o bastante para
  caber em memória; persistência além da sessão não compensa
  complexidade de invalidação.
- **Fuzzy search (Fuse.js)** — descartado por enquanto: nome de
  Pokémon não tem tantas variações ortográficas para justificar a
  dependência. `String.includes` cobre o caso 99%.

## Consequências

### Positivas

- Resposta da busca é **instantânea** após a debounce (sem RTT por
  keystroke).
- Cache do interceptor torna revisitas a `/search` grátis.
- Filter logic é trivialmente testável (pure function).
- Highlight é XSS-safe por construção (split + `@for`, sem `innerHTML`).

### Negativas / Trade-offs

- Primeira visita custa ~120 kB e ~1-2s (rede + JSON parse) — coberto
  por skeleton.
- Match é case-insensitive `includes` apenas — não tolera typos.
  Aceitável como baseline.
- Se a PokéAPI um dia expor full-text search, vale revisitar (o
  repository por trás de `POKEMON_INDEX_REPOSITORY` torna a troca
  local).

### Neutras / Implicações futuras

- Pode ganhar filtros (tipo, geração) sem mudar arquitetura — basta
  acrescentar campos ao `PokemonRef` (vindo de outro endpoint
  cacheado) e ao filter.

## Referências

- `src/app/features/pokemon-search/feature/pokemon-search.page.ts`
- `src/app/features/pokemon-search/data-access/pokemon-index-http.repository.ts`
- `src/app/features/pokemon-search/ui/highlighted-text.component.ts`
