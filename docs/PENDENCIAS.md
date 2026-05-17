# Pendências

Itens conhecidos que ficaram para depois — pequenos refinamentos, débitos
documentais e verificações ainda não fechadas. Cada item tem um contexto curto
e uma sugestão de quando atacar.

## A verificar visualmente

- [x] **Safelist de `bg-type-*`** — verificado via Playwright MCP em
      `01-listing-light.png` / `02-listing-dark.png`. Todos os badges
      (GRASS, POISON, FIRE, WATER, FLYING, etc.) renderizam coloridos
      em ambos os temas.

## Refinamentos do design system (Fase 1)

- [x] **Botão `Disabled` no dark mode** — resolvido na Fase 7: substituí
      `opacity: 0.55` por `background: color-mix(... surface-muted)` +
      `color: color-mix(... ink)`. Agora muta consistente em ambos os temas.

- [x] **Seção "Search value" do styleguide** — `@if (search())` já envolve
      o bloco; resolvido em commit posterior à anotação original.

- [x] **4 warnings PostCSS "& → Empty sub-selector"** no build — investigado
      em commit `51a9d3b`. Bisectado até a combinação `--color-ink` +
      `--color-ink-muted` no `@theme` do Tailwind v4 (bug interno do
      compilador, não do nosso CSS). Renomeei `ink-muted` → `text-muted`
      e baixou de 5 para 4 warnings. Os 4 remanescentes são baseline
      irreduzível do Tailwind v4 atual; reavaliar quando atualizar o
      Tailwind. Não bloqueiam build nem aparecem no CSS final.

## ADRs

Todos escritos na Fase 8 (`docs/adr/0002` a `0009`):

- [x] **ADR-0002** — Signals como mecanismo primário vs NgRx/NGXS
- [x] **ADR-0003** — Estratégia de cache HTTP (in-memory LRU vs localStorage)
- [x] **ADR-0004** — Tailwind: tokens via `@theme` + `.brutal-*` em
      `@layer components`
- [x] **ADR-0005** — Design tokens neobrutalistas, mapeamento de tipos de
      Pokémon, dark mode em 3 camadas
- [x] **ADR-0006** — i18n: Transloco com troca em runtime + nomes via
      `/pokemon-species` + `Intl.*`
- [x] **ADR-0007** — Vitest builder nativo (`@angular/build:unit-test`)
- [x] **ADR-0008** — Paginação clássica (offset/limit) vs scroll infinito
- [x] **ADR-0009** — Busca client-side sobre índice cacheado

## Processo / quality gate

- [x] **Pré-commit roda só lint-staged** — resolvido no commit `573404a`.
      `.husky/pre-commit` agora também executa
      `npx --no-install tsc -p tsconfig.app.json --noEmit`, capturando
      quebras de import cross-arquivo antes que cheguem ao histórico.

## Testes — smart spec do PokemonDetailPage (Fase 5)

- [x] **`PokemonDetailPage.spec` destravado** — o problema era duplo:
      (1) `@defer` no template do smart bloqueava `TestBed.createComponent`,
      resolvido extraindo o bloco para um wrapper dedicado
      (`PokemonEvolutionSection`); (2) `rxResource` embrulha objetos não-Error
      em `ResourceWrappedError` (Angular runtime), então `resource.error()`
      devolvia o wrapper e o `errorKey` computed via `as AppError` mentia
      para o TS e gerava `undefined` em produção também. Adicionado
      `appErrorOf(unknown): AppError | null` em `core/http/app-error.ts`
      que desembrulha `.cause` quando é um Error. Todos os 4 sites que
      lêem `resource.error()` agora usam o helper. 5 specs do detail page
      passam, suíte total 171.

## i18n / Transloco

- [x] **Plurals ICU** — instalado `@jsverse/transloco-messageformat` no
      commit `e23cf59`. `provideTranslocoMessageformat()` registrado nos
      providers de produção e de teste; chaves `list.count` e
      `search.resultCount` migradas para `{count, plural, one {…}
    other {…}}` em ambos os locales. Pares `countOne` / `countOther`
      removidos.

## Qualidade de testes (Fase 3+)

- [x] **Thresholds de cobertura para `data-access` e `domain`** —
      configurado no commit `ee47bf7` via `vitest.config.ts` na raiz.
      Provider `v8`, include cobre `core/domain`, `core/http`,
      `core/format` e `features/**/data-access/**`. Thresholds 80% para
      lines/branches/functions/statements. `@vitest/coverage-v8` adicionado
      em devDependencies.

- [x] **Pelo menos um teste de integração** (listagem → detalhe) — feito em
      `src/app/integration/listing-to-detail.spec.ts` via
      `RouterTestingHarness`. Monta `/`, settle o `rxResource` da listagem
      com 1 card, segue o `routerLink` para `/pokemon/pikachu`, settle o
      `rxResource` do detalhe e valida que o componente smart de detalhe
      renderizou nome localizado, dex number e genus. Stubs controlados
      por `ReplaySubject` em ambos os repositórios.

## Possíveis melhorias estruturais

- [x] **Dev-only chunk do styleguide ainda é emitido em produção** —
      resolvido no commit `7d131f6`. `app.routes.ts` (dev) inclui o
      styleguide; `app.routes.prod.ts` não importa o styleguide; a troca
      acontece via `fileReplacements` na configuração de produção do
      `angular.json`. Sem o `import()` estático na build prod, o bundler
      não emite o chunk.

- [x] **Padrão decorativo (listras/hachuras)** — aplicado na Fase 7 como
      `.brutal-stripes` no header (faixas diagonais a 12% ink, via
      `color-mix`). Funciona em ambos os temas.
