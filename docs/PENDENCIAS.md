# Pendências

Itens conhecidos que ficaram para depois — pequenos refinamentos, débitos
documentais e verificações ainda não fechadas. Cada item tem um contexto curto
e uma sugestão de quando atacar.

## A verificar visualmente

- [ ] **Safelist de `bg-type-*` no styleguide** — fix aplicado em `129abfb`.
      Recarregar `/__styleguide` em light mode e confirmar que os 18 badges
      agora têm o fundo colorido correto (water/grass/fighting/poison/flying/
      psychic/bug/rock/ghost/dragon/dark/steel). Em dark mode já estavam ok.

## Refinamentos do design system (Fase 1)

- [ ] **Botão `Disabled` no dark mode** — `bg-primary` com `opacity: 0.55`
      sobre fundo escuro vira oliva/khaki. Funcional, mas não é a melhor
      leitura visual. Possíveis caminhos:
  - Substituir `opacity` por classes `disabled:bg-*` dedicadas
  - Usar `color-mix(in srgb, var(--color-primary) 55%, transparent)`
  - Atacar quando: chegar a Fase 7 (polish), ou se feedback de usuário pedir.

- [ ] **Seção "Search value" do styleguide** — exibe `Search value:` mesmo
      quando o input está vazio. Cosmético. Esconder o `<p>` com `@if (search())`
      quando incomodar.

- [ ] **4 warnings PostCSS "& → Empty sub-selector"** no build — não bloqueiam,
      não aparecem no CSS final. Suspeita: vêm de algum processamento interno
      do Tailwind v4 ao lidar com `:not()` chains nas regras `.brutal-interactive`.
      Vale investigar se em algum momento esses warnings escalarem ou se o
      build do Tailwind atualizar.

## ADRs a escrever (planejado para Fase 8)

Decisões já tomadas que precisam virar ADRs antes da entrega final:

- [ ] **ADR-0002** — Signals como mecanismo primário vs NgRx/NGXS
- [ ] **ADR-0003** — Estratégia de cache HTTP (in-memory LRU vs localStorage)
- [ ] **ADR-0004** — Tailwind: tokens via `@theme` + classes `.brutal-*` em
      `@layer components` (vs `@apply`, vs utility-soup nos templates)
- [ ] **ADR-0005** — Design tokens neobrutalistas, mapeamento de tipos de
      Pokémon, dark mode em 3 camadas
- [ ] **ADR-0006** — i18n: Transloco com lazy scopes, nomes via
      `/pokemon-species`, formatação via `Intl.*`
- [ ] **ADR-0007** — Vitest builder nativo (`@angular/build:unit-test`) vs
      wrapper `@analogjs/vitest-angular`
- [ ] **ADR-0008** — Paginação clássica (offset/limit) vs scroll infinito
- [ ] **ADR-0009** — Busca client-side híbrida sobre índice cacheado vs
      server-side

## Processo / quality gate

- [ ] **Pré-commit roda só lint-staged (format + eslint nos arquivos
      modificados)** — não captura quebras de import cross-arquivo, p. ex.
      um `index.ts` que referencia um arquivo ainda não criado. Aconteceu
      no commit `59a19e2` (`refactor(domain)`): commit isolado quebra build,
      mas é "consertado" pelo commit seguinte. Considerar adicionar
      `npm run typecheck` ao pre-commit (custo ~1s) ou cobrir via CI.

## Testes — smart spec do PokemonDetailPage (Fase 5)

- [ ] **`PokemonDetailPage.spec` está com 5 `it.skip`** — `TestBed.createComponent`
      do componente smart falha com "Component '\_PokemonDetailPage' has unresolved
      metadata" mesmo após
      `await TestBed.configureTestingModule({...}).compileComponents()` e
      `deferBlockBehavior: DeferBlockBehavior.Manual`. Causa provável:
      interação entre `@defer` e o runner Vitest do `@angular/build:unit-test`.
      Mitigação atual: as 5 colaboradoras (mapper, repository, dumb skeleton,
      stats panel, stat bar, evolution chain) têm specs próprias; o smart
      component é validado por typecheck + build + run manual. Investigar
      quando atualizar Angular ou descobrir um padrão de teste compatível.

## i18n / Transloco

- [ ] **Plurals ICU** — usar `@jsverse/transloco-messageformat` para suportar
      sintaxe `{count, plural, one {…} other {…}}`. Por ora, traduções usam
      pares `countOne` / `countOther` selecionados pelo chamador. Instalar o
      plugin quando a Fase 4 (listagem) precisar exibir contagem real.

## Qualidade de testes (Fase 3+)

- [ ] **Thresholds de cobertura para `data-access` e `domain`** — meta de 80%
      conforme plano. Configurar no `angular.json` ou via `vitest.config.ts`
      quando os primeiros repositórios/mappers existirem (Fase 3).

- [ ] **Pelo menos um teste de integração** (listagem → detalhe) — exigência
      explícita do plano. Encaixar no fim da Fase 5.

## Possíveis melhorias estruturais

- [ ] **Dev-only chunk do styleguide ainda é emitido em produção** — a rota
      não é registrada quando `isDevMode()` é falso, mas o `import()` dinâmico
      ainda gera o chunk lazy `styleguide-page` em build prod. Trade-off:
      eliminar totalmente exigiria condicional no `loadComponent` ou um
      arquivo separado `app.routes.prod.ts`. Custo atual: ~4 kB lazy chunk
      nunca baixado. Atacar se o tamanho de build virar problema.

- [ ] **Padrão decorativo (listras/hachuras) em seções-chave** previsto na
      identidade visual ainda não foi aplicado. Encaixar quando construir a
      Fase 7 (layout/shell).
