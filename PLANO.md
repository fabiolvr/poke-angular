# PLANO.md — Auditoria & Refatoração faseada (poke-angular)

## Context

`poke-angular` é uma SPA Pokédex (estética neobrutalista) construída em **Angular 21.2 / TypeScript 5.9**, já num patamar de qualidade alto e raro: **standalone + zoneless + signals-first**, `OnPush` em todos os componentes, `inject()`, controle de fluxo nativo (`@if`/`@for`/`@switch`/`@defer`), rotas lazy, **tsconfig extremamente estrito** (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `strictTemplates`…) e **ESLint 9 flat** que _impõe_ OnPush, standalone, `no-explicit-any`, controle de fluxo e acessibilidade. Há **41 specs** (Vitest) com gate de cobertura de 80% nas camadas de lógica.

Ou seja: as regras do CLAUDE.md já estão quase 100% cumpridas. A dívida real **não é de framework** — é **Clean Code**, concentrada em **duplicação (DRY)** e em alguns **bugs pontuais** de baixo volume. Este plano corrige isso de forma incremental, do menor risco/maior retorno para o maior risco, sem nunca misturar renomeação pura com mudança de lógica no mesmo passo.

---

## Resultado da auditoria

### Etapa 2A — Conformidade com o CLAUDE.md (poucas violações)

| #   | Arquivo                                                  | Local                                         | Regra do CLAUDE.md                                                  | Severidade        |
| --- | -------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------- | ----------------- |
| A1  | `layout/header/header.component.ts`                      | `<img src="poke_ball_icon.svg">` (~l.48)      | "Use `NgOptimizedImage` for all static images"                      | Médio             |
| A2  | `features/pokemon-search/feature/pokemon-search.page.ts` | `<img [src]=…>` sprite (~l.123-131)           | `NgOptimizedImage` (imagem estática remota)                         | Médio             |
| A3  | `shared/ui/brutal-input/brutal-input.ts`                 | `placeholder:text-text-mutedd` (~l.89)        | Acessibilidade WCAG AA (classe inválida → contraste não controlado) | Médio             |
| A4  | `features/pokemon-detail/feature/pokemon-detail.page.ts` | `class="text-text-mutedd"` (l.157)            | Acessibilidade WCAG AA (mesmo typo)                                 | Médio             |
| A5  | `features/pokemon-detail/feature/pokemon-detail.page.ts` | `.subscribe()` manual no `effect` (l.353-373) | "Use the async pipe to handle observables"                          | Baixo (limítrofe) |

**Conformes (sem ação):** zero `@NgModule`; zero `standalone: true` redundante; signals + `computed()` em todo lugar; `input()`/`output()`/`model()`; zero `*ngIf/*ngFor`; `inject()` 100%; sem `ngModel`; sem `ngClass/ngStyle` (usa `[class]`/`[style.x]`); sem `@HostBinding/@HostListener` (usa `host`); rotas lazy; **zero `any`**; sem casts perigosos.

### Etapa 2B — Clean Code (o grosso da dívida)

| #   | Arquivo(s)                                                                                           | Problema                                                                                                                                          | Princípio                             | Severidade        | Esforço |
| --- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ----------------- | ------- |
| C1  | `pokeapi.mapper.ts` + `pokeapi-detail.mapper.ts` (+ `.dto.ts`)                                       | `extractIdFromUrl`, `mapSprites`, `mapTypes`, `mapStats`, `mapAbilities`, `mapPokemon` e DTOs duplicados (duplicação **deliberada**, documentada) | DRY × baixo acoplamento               | **Alto** (volume) | Alto    |
| C2  | `pokemon-detail.page.ts` (397 linhas)                                                                | 3 `computed` `localized*` clones; 2 `displayed*` clones; `effect` gigante com bloco flavor/genus duplicado                                        | DRY / SRP / função longa              | **Alto**          | Médio   |
| C3  | `pokemon-search.page.ts`, `pokemon-evolution-chain.component.ts`                                     | `formatDex`/`padded` reimplementam `formatPokedexNumber` (`@core/format`)                                                                         | DRY                                   | Médio             | Baixo   |
| C4  | `pokemon-detail.page.ts`, `…evolution-chain`, `…search.page`, `…card`                                | `FALLBACK_SPRITE` (×4) + URL de artwork hardcoded (×2)                                                                                            | DRY / magic string                    | Médio             | Baixo   |
| C5  | `core/i18n/transloco.testing.ts`                                                                     | cópia manual do JSON divergiu: faltam `list.pageStatus`/`list.range`/…; sobram `list.pageOf`/`list.count`                                         | DRY / fonte única de verdade          | Médio             | Médio   |
| C6  | transversal (`pokemon-detail.page.ts:109`, `:125/176`; `brutal-skeleton.ts`; `language-switcher.ts`) | strings PT/EN hardcoded fora do i18n (`'mythical'/'legendary'`, `ariaLabel="Carregando"`, etc.)                                                   | consistência de idioma / magic string | Médio             | Médio   |
| C7  | `pokemon-stats-panel.component.ts`                                                                   | `get orderedStats()` recomputa a cada CD (devia ser `computed`)                                                                                   | performance / consistência            | Médio             | Baixo   |
| C8  | `pokemon-stat-bar.component.ts`                                                                      | magic numbers `255`, `30`, `60`                                                                                                                   | magic number                          | Médio             | Baixo   |
| C9  | `extractIdFromUrl` + `ID_PATTERN`                                                                    | mesma função pura em ≥3 arquivos                                                                                                                  | DRY                                   | Médio             | Baixo   |
| C10 | `pokemon-list-paginator.component.ts`                                                                | 6 strings de classe quase iguais; window/breakpoint mágicos                                                                                       | DRY / magic string                    | Baixo             | Baixo   |
| C11 | `pokemon-detail.skeleton.ts:44`                                                                      | `[0,1,2,3,4,5]` mágico (vs `Array.from` usado na list)                                                                                            | magic number / consistência           | Baixo             | Baixo   |
| C12 | i18n JSON + mock                                                                                     | chaves mortas `list.pageOf`, `list.count`                                                                                                         | dado morto                            | Baixo             | Baixo   |
| C13 | `pokemon-list.page.ts`                                                                               | possível morto: `hasNext`/`hasPrev`/`pageSize` `protected` sem uso no template                                                                    | código morto                          | Baixo             | Baixo   |
| C14 | transversal                                                                                          | inconsistência de nome de arquivo (`*.component.ts` vs nome puro)                                                                                 | convenção                             | Baixo             | Médio   |
| C15 | `core/` `layout/` `features/` `shared/ui/`                                                           | `.gitkeep` em pastas já populadas                                                                                                                 | resíduo de scaffolding                | Baixo             | Baixo   |
| C16 | `brutal-input.ts:21/61`                                                                              | `let nextId = 0` (estado global mutável de módulo) p/ id único                                                                                    | efeito colateral oculto               | Baixo             | Baixo   |

---

## Plano faseado

Princípio de ordenação: **rede de segurança → bugs isolados → extrações puras de baixo risco → refatoração de lógica → consolidação estrutural → cosmético.** Cada fase é um conjunto de commits pequenos e revisáveis; renomeações puras nunca compartilham commit com mudança de lógica.

### Fase 0 — Rede de segurança / baseline ✅ pré-requisito

**Objetivo:** garantir que a rede que vai pegar regressões está verde _e confiável_ antes de tocar em qualquer código.

- [ ] Rodar e registrar baseline verde: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
- [ ] **Corrigir o drift do mock de i18n de teste (C5):** fazer `transloco.testing.ts` importar os JSON reais (`public/i18n/pt-BR.json` / `en.json`) via `import … with { type: 'json' }` em vez da cópia manual — elimina a divergência e a manutenção dupla de uma vez.
- **Arquivos:** `core/i18n/transloco.testing.ts`, `tsconfig.spec.json` (talvez `resolveJsonModule`).
- **Risco:** Baixo. É melhoria de teste, sem efeito em produção.
- **Validar:** `npm test` continua verde; chaves antes divergentes (`list.pageStatus`, `list.range`) agora resolvem nos specs do paginator.

### Fase 1 — Bugs pontuais (alto retorno, baixo risco)

**Objetivo:** corrigir falhas reais e silenciosas; cada item é um diff isolado.

- [ ] **A3/A4** — trocar `text-text-mutedd` por `text-ink-soft` (token usado no resto do detalhe) em `pokemon-detail.page.ts:157` e `brutal-input.ts:89`. _(confirmar o token contra `src/styles/tokens.css`.)_
- [ ] **A1** — `header.component.ts`: logo SVG estático → `[ngSrc]` (`NgOptimizedImage`).
- [ ] **A2** — `pokemon-search.page.ts`: sprite → `[ngSrc]`, **preservando** o fallback `(error)`. Se o `NgOptimizedImage` conflitar com a troca dinâmica em erro, documentar a exceção em vez de forçar.
- **Risco:** Baixo–Médio (A2 tem o detalhe do `(error)`).
- **Validar:** build sem warnings de imagem; `eslint` ok; checagem visual + AXE nas duas telas; specs verdes.

### Fase 2 — Extrações puras de baixo risco (sem mudança de comportamento)

**Objetivo:** matar a duplicação de utilitários puros; comportamento idêntico, validável por specs existentes.

- [ ] **C9** — mover `extractIdFromUrl` + `ID_PATTERN` para `@core/pokeapi/resource-id.ts` (semente do módulo da Fase 5); reusar nos 2 mappers e no `pokemon-index-http.repository.ts`. _(Seguro mesmo mantendo os mappers separados — é função pura sem acoplamento de feature.)_
- [ ] **C3** — substituir `formatDex`/`padded` por `formatPokedexNumber` de `@core/format`.
- [ ] **C4** — extrair `FALLBACK_SPRITE` + `pokemonArtworkUrl(id)`/`spriteUrl(id)` para `@core` (ex.: `core/format/sprite-url.ts` — helper de **URL de view**, distinto do `mapSprites` de data-access da Fase 5); substituir as 4 cópias.
- [ ] **C8/C10/C11** — magic numbers → constantes nomeadas: `MAX_BASE_STAT = 255` (+ thresholds de cor), window/breakpoint do paginator, `Array.from({length: POKEMON_STAT_NAMES.length})` no skeleton.
- **Risco:** Baixo (puro, coberto por testes na camada `format`/`data-access`).
- **Validar:** specs de mapper/format/repo verdes; `typecheck`; conferir lista, busca, detalhe e evolução renderizam sprites/números iguais.

### Fase 3 — Refatoração de lógica da `pokemon-detail.page.ts` (C2)

**Objetivo:** reduzir as 397 linhas extraindo os clones; **só lógica**, sem renomear arquivos.

- [ ] Extrair helper `pickLocalized(map, fallbacks, fallbackValue='')` → colapsa os 3 `localized*`.
- [ ] Extrair `displayWithMachineFallback(native, needsMT, machineSignal)` → colapsa os 2 `displayed*`.
- [ ] Extrair método privado `translateField(sourceText, needsMT, target, loading)` → o `effect` cai de ~47 p/ ~12 linhas.
- [ ] Mover `LANG_LOOKUP_FALLBACKS` para `@core/i18n` (é lógica de domínio i18n).
- [ ] **C7** — `pokemon-stats-panel`: `get orderedStats()` → `readonly orderedStats = computed(...)`.
- **Risco:** Médio (mexe no caminho de tradução de máquina pt-BR — o mais sutil do app).
- **Validar:** specs do detalhe; teste manual em pt-BR **e** en do flavor/genus (nativo, fallback de máquina, e troca de idioma); AXE.

### Fase 4 — i18n de strings hardcoded (C6)

**Objetivo:** tirar strings visíveis/aria do código para o Transloco.

- [ ] Adicionar chaves (`detail.mythical`, `detail.legendary`, `common.loading` já existe, `language.label` já existe) ao JSON pt-BR/en **e** ao mock de teste (já sincronizado na Fase 0).
- [ ] Substituir `'mythical'/'legendary'` (l.109), `ariaLabel="Carregando"` (l.125/176), default de `brutal-skeleton`, ternário do `language-switcher`.
- **Risco:** Baixo–Médio (i18n).
- **Validar:** render correto nos 2 idiomas; AXE; specs.

### Fase 5 — Consolidação parcial dos mappers PokéAPI (C1) — meio-termo ✔ decidido

**Objetivo:** matar a duplicação de lógica de mapeamento **pura**, preservando a fronteira "feature deletável" (DTOs e mapeadores de alto nível ficam na feature).

- [ ] Estender `@core/pokeapi/`:
  - `resource-id.ts` — `extractIdFromUrl` (já criado na Fase 2).
  - `sprite-mapper.ts` — `mapSprites(dto)`. **Unificar para a versão superset** (com o `?? dto.front_default` extra no `shiny` do detalhe); validar que a list/summary não regride.
  - `slots.ts` — `mapTypes` / `mapStats` / `mapAbilities`.
  - Tipos de entrada **estruturais mínimos** vivem aqui; os `*.dto.ts` de cada feature **permanecem** e são estruturalmente compatíveis (sem reintroduzir acoplamento de DTO entre features).
- [ ] Reduzir `pokeapi.mapper.ts` e `pokeapi-detail.mapper.ts` ao que é específico — `mapPokemon`/`mapPokemonSummary`/`mapPokemonPage` e `mapPokemonDetail`/`mapSpecies`/`mapEvolutionChain` — delegando aos helpers de `@core/pokeapi`.
- **Arquivos:** novos `@core/pokeapi/{sprite-mapper,slots}.ts`; `features/pokemon-list/data-access/pokeapi.mapper.ts`; `features/pokemon-detail/data-access/pokeapi-detail.mapper.ts`.
- **Risco:** Médio. A única mudança de comportamento é o `mapSprites` superset (mínima, adiciona fallback); o resto é movimentação pura coberta por specs.
- **Validar:** specs de ambos os mappers (cobertura ≥80% nessa camada) + specs de integração (`back-button-flow`, `listing-to-detail`); conferir que cards e detalhe renderizam sprites idênticos.

### Fase 6 — Cosmético / opcional

**Objetivo:** higiene final.

- [ ] **C12/C13** — remover chaves i18n mortas e código morto **após confirmar via grep** que não há uso.
- [ ] **C15** — remover `.gitkeep` de pastas já populadas.
- [ ] **C16** — opcional: trocar `let nextId` por `crypto.randomUUID()`.
- [ ] Tornar zoneless explícito: `provideZonelessChangeDetection()` em `app.config.ts`; adicionar `forceConsistentCasingInFileNames` ao tsconfig.
- [ ] **C14** — _(decidido: pular)_ renomeação de arquivos **não** será feita agora (alto churn de imports, valor cosmético); fica registrada como dívida de baixa prioridade.
- **Risco:** Baixo (exceto C14 = alto churn de imports).
- **Validar:** build, lint, typecheck, testes verdes; `git mv` preserva histórico.

---

## Tabela-resumo (problema → princípio/regra → severidade → fase)

| Problema                                                       | Princípio / Regra violada           | Severidade  | Fase                         |
| -------------------------------------------------------------- | ----------------------------------- | ----------- | ---------------------------- |
| Mock de i18n divergente do JSON real                           | DRY / fonte única                   | Médio       | 0                            |
| `text-text-mutedd` (×2)                                        | A11y WCAG AA / erro silencioso      | Médio       | 1                            |
| `<img>` em vez de `NgOptimizedImage` (×2)                      | Regra CLAUDE.md (imagens estáticas) | Médio       | 1                            |
| `extractIdFromUrl`/`ID_PATTERN` duplicado                      | DRY                                 | Médio       | 2                            |
| `formatDex`/`padded` reimplementam util                        | DRY                                 | Médio       | 2                            |
| `FALLBACK_SPRITE` + URL artwork hardcoded                      | DRY / magic string                  | Médio       | 2                            |
| Magic numbers (255/30/60, window, `[0..5]`)                    | magic number                        | Médio/Baixo | 2                            |
| `localized*`/`displayed*`/effect duplicados                    | DRY / SRP / função longa            | **Alto**    | 3                            |
| `get orderedStats()` vs `computed`                             | performance / consistência          | Médio       | 3                            |
| Strings PT/EN fora do i18n                                     | consistência de idioma              | Médio       | 4                            |
| Mappers PokéAPI duplicados → consolidação parcial (meio-termo) | DRY × baixo acoplamento             | **Alto**    | 5                            |
| Chaves i18n / código mortos                                    | dado/código morto                   | Baixo       | 6                            |
| `.gitkeep`, zoneless implícito, casing                         | higiene / convenção                 | Baixo       | 6                            |
| Inconsistência de nome de arquivo                              | convenção                           | Baixo       | — (pular: dívida registrada) |
| `let nextId` global                                            | efeito colateral oculto             | Baixo       | 6 (opcional)                 |
| `.subscribe()` manual no detalhe                               | async pipe (limítrofe)              | Baixo       | — (avaliar na Fase 3)        |

---

## Verificação de ponta a ponta (toda fase)

1. `npm run lint` · `npm run typecheck` · `npm test` (e `npm run test:coverage` ao tocar camadas `domain/http/format/data-access`, gate 80%).
2. `npm run build` sem erros/regressão de budget.
3. `npm run dev` + checagem manual das 3 rotas (lista, detalhe, busca) nos 2 idiomas e nos 2 temas; AXE nas telas tocadas.
4. Specs de integração (`src/app/integration/*`) verdes.

## Decisões tomadas

1. **Fase 5 — mappers:** _meio-termo_ — centralizar só os helpers puros (`extractIdFromUrl`, `mapSprites`, `mapTypes/Stats/Abilities`) em `@core/pokeapi`; manter DTOs e `mapPokemon*`/`mapSpecies` por feature.
2. **Fase 6 — renomeação de arquivos (C14):** _pular_ — registrada como dívida de baixa prioridade.

---

## Status de execução — CONCLUÍDO ✅

Todas as fases 0–6 implementadas no branch `refactor/clean-code-phases` (11 commits pequenos e revisáveis). Gate final verde: `lint` ✅ · `typecheck` ✅ · **210 testes / 45 arquivos** ✅ · cobertura **93,7% stmts / 90,7% branch** (gate 80%) ✅ · `build` ✅. Verificado em runtime via Playwright (lista, detalhe e busca, pt-BR **e** en, tema escuro): sprites/tipos/stats corretos, badge Lendário/Legendary localizado, troca de idioma reativa, paginação reativa sob zoneless explícito, **0 erros de console**.

### Desvios conscientes do plano

- **A2 (`NgOptimizedImage` na busca):** _exceção documentada_ em vez de conversão. Os sprites da lista de busca derivam a URL do id e precisam recuperar de 404 em runtime (`(error)→placeholder`); `NgOptimizedImage` trata `ngSrc` como imutável (lança em dev/testes ao reatribuir) e não expõe API de fallback. Card/detalhe/evolução — que conhecem a disponibilidade do sprite na camada de dados — usam `NgOptimizedImage`.
- **A5 (`.subscribe()` manual no detalhe):** _avaliado e mantido_. Extraído para `translateField()` (Fase 3), mas o padrão `.subscribe` é o correto aqui — efeito colateral que escreve em múltiplos signals com loading/error, dentro de um `effect` que reseta estado; o observable completa (sem vazamento). Converter para `toSignal`/`rxResource` perderia o batching de cache-hit síncrono.
- **C16 (`let nextId` global):** _mantido_ (era opcional). O contador de módulo é determinístico por execução e idiomático; `crypto.randomUUID()` não é claramente melhor e adiciona risco em contextos não-browser. Sem mudança.
- **A3/A4 (`text-text-mutedd`):** corrigido para `text-ink-soft` (não `text-muted`) — o token usado no resto do detalhe e que passa WCAG AA em ambos os temas (~8,9:1 claro / ~7,3:1 escuro); `--color-text-muted` ficaria ~4,2:1 no escuro.

### Observação fora de escopo (pré-existente, não tocada)

- Build emite `5 rules skipped — Empty sub-selector` (Tailwind v4 + lightningcss) e `NG02956` (preconnect para o sprite `priority` cross-origin do detalhe). Ambos pré-existentes e cosméticos; não estavam na auditoria. Candidatos a um item futuro se incomodarem.
