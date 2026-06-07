# ADR-0002: Signals como mecanismo primário de estado, sem NgRx

- **Status**: Accepted
- **Data**: 2026-05-16
- **Decisores**: Tech Lead

## Contexto

A Pokédex é uma SPA leitora — busca, lista e detalha um catálogo
imutável da PokéAPI. Não há autenticação, mutações, formulários
complexos ou colaboração em tempo real. As "fontes de verdade" são:

- **URL** (page, name, query) — já resolvido pelo Router + component
  input binding.
- **Estado remoto** (resultados de fetch) — naturalmente
  request/response.
- **Preferências locais** (tema, idioma) — duas chaves em
  `localStorage`.

Angular 22 oferece um modelo de reatividade nativo (`signal`,
`computed`, `effect`, `linkedSignal`, `resource`/`rxResource`) com
zero boilerplate, além de **Signal Forms** estáveis (`@angular/forms/signals`).

## Decisão

Usar **Angular signals** como mecanismo único de estado.

- Estado de componente: `signal()` e `computed()`.
- Estado assíncrono: `rxResource` de `@angular/core/rxjs-interop` ou
  `httpResource`.
- Estado compartilhado (tema, idioma, histórico de navegação):
  serviços `@Service()` expondo signals, injetados via `inject(...)`.
- Formulários (validação de campos): **Signal Forms** via `form()` +
  `[formField]` — estável no Angular 22, sem boilerplate de
  `FormControl`/`FormGroup`.

Sem store global. Sem actions/reducers/effects. Cada feature consome
seus dados via repository → resource e expõe signals locais para o
template.

## Alternativas Consideradas

- **NgRx (Store + Effects)** — descartado: boilerplate enorme (actions,
  reducers, effects, selectors, action types) para uma SPA cuja
  superfície de estado é trivial. Custo de manutenção alto, ganho
  nulo.
- **NGXS / Akita** — descartado: mesma análise, com a desvantagem
  adicional de comunidades menores e ferramental menos maduro que
  signals nativos.
- **NgRx SignalStore** — interessante para apps maiores com domínios
  com mutações; aqui ainda adiciona uma camada de indireção que não
  paga seu custo.
- **RxJS `BehaviorSubject` direto** — descartado por dois motivos: (1)
  templates precisariam de `async` pipe ou subscribe manual; (2)
  signals integram com `OnPush` sem precisar `markForCheck`.

## Consequências

### Positivas

- Boilerplate mínimo; cada feature é entendível lendo um único arquivo
  por camada (smart, dumb, repo).
- `rxResource` entrega `value/isLoading/error/reload` como signals —
  substitui o trio "loading$ + data$ + error$" + `combineLatest` que
  era a dor crônica do RxJS-only.
- `OnPush` em toda parte sem necessidade de `ChangeDetectorRef`.

### Negativas / Trade-offs

- Se o escopo crescer (auth, mutações concorrentes, optimistic
  updates), pode ser necessário introduzir um store mais formal — em
  particular `@ngrx/signals` (SignalStore) é o caminho de migração com
  menor atrito por ser API signal-first.
- Effects que precisam reagir a múltiplos signals exigem cuidado para
  não criar loops; `effect` cleanup é explícito.

### Neutras / Implicações futuras

- A interoperação RxJS↔Signals está concentrada em dois lugares:
  `rxResource` (na borda de repositórios) e `toObservable+toSignal` (na
  busca, para `debounceTime`). Documentado nos respectivos arquivos.

## Referências

- `src/app/features/pokemon-list/feature/pokemon-list.page.ts`
- `src/app/core/i18n/language.service.ts`
- `src/app/core/theme/theme.service.ts`
