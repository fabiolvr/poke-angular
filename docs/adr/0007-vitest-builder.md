# ADR-0007: Vitest via builder nativo `@angular/build:unit-test`

- **Status**: Accepted
- **Data**: 2026-05-16
- **Decisores**: Tech Lead

## Contexto

O plano proíbe Karma/Jasmine. As opções viáveis em 2026 são Vitest
ou Jest (com Testing Library opcional). O Angular trouxe um
**builder nativo** `@angular/build:unit-test` que orquestra Vitest
via `angular.json`, dispensando wrappers de terceiros.

## Decisão

Usar **Vitest através do `@angular/build:unit-test`**, sem o wrapper
`@analogjs/vitest-angular`.

Configuração mínima em `angular.json`:

```json
"test": { "builder": "@angular/build:unit-test" }
```

Defaults do builder: `runner: 'vitest'`, ambiente `jsdom`,
detecção automática de `*.spec.ts`.

Specs usam Angular `TestBed` direto, sem Testing Library — o
boilerplate dos helpers próprios (`setup()`, `flushResource()`,
host components em `@Component({ template })`) cobre os casos sem
adicionar dependência.

## Alternativas Consideradas

- **`@analogjs/vitest-angular`** — descartado: faz o mesmo que o
  builder nativo, com uma dependência extra para manter sincronizada
  com versões do Angular.
- **Jest** — descartado: Vitest tem melhor integração com Vite/ESM,
  startup mais rápido em local, e o builder nativo do Angular 21 já
  o suporta.
- **Karma/Jasmine** — proibido pelo plano.
- **Cypress Component Testing** — feature-rich mas pesado; deixado
  para e2e (ADR futuro se aparecer).

## Consequências

### Positivas

- Zero deps extras além de `vitest` (já presente como devDep).
- `npm test` roda em ~1.5s; cobertura via `--coverage` em ~3s.
- `TestBed.tick()` flush de effects funciona naturalmente.

### Negativas / Trade-offs

- **`@defer` blocks** foram mitigados extraindo o conteúdo do bloco
  para um componente wrapper dedicado (`PokemonEvolutionSection`),
  eliminando o `it.skip` que existia antes. Todos os specs do
  `PokemonDetailPage` passam — ver `docs/PENDENCIAS.md`.
- `prefers-color-scheme`, `matchMedia` e `Intl` precisam de stubs
  em jsdom para alguns specs (Theme/Language services). Padrão
  resolvido com helpers nos próprios specs.

### Neutras / Implicações futuras

- Migrar para Jest se o builder do Angular descontinuar Vitest é um
  swap de `runner` no `angular.json` + ajustar imports — sem trauma.
- Threshold de cobertura ainda não enforçado (PENDENCIAS).

## Referências

- `angular.json` (architect.test)
- `tsconfig.spec.json` (`vitest/globals`)
- `src/app/features/pokemon-detail/feature/pokemon-detail.page.spec.ts` (skipped specs)
- `docs/PENDENCIAS.md` (item de `@defer` + Vitest)
