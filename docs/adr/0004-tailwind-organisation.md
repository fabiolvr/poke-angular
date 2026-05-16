# ADR-0004: Tailwind v4 — tokens via `@theme` + `.brutal-*` em `@layer components`

- **Status**: Accepted
- **Data**: 2026-05-16
- **Decisores**: Tech Lead

## Contexto

O design system é **neobrutalista**: bordas grossas, hard shadows,
cores saturadas, e um conjunto fixo de comportamentos (hover "afunda
na sombra", press "encosta no chão", borda + shadow seguem o ink
color de cada tema). Esse vocabulário é compartilhado por **todos**
os componentes do design system (`BrutalButton`, `BrutalCard`,
`BrutalInput`, `BrutalBadge`, `BrutalSkeleton`) e por alguns acentos
de layout (`brutal-stripes`).

Tailwind v4 oferece duas alavancas distintas:

1. **`@theme`** — declara design tokens (cores, fontes, raios,
   espaçamentos custom). Tailwind gera utilities automaticamente a
   partir desses tokens (`bg-type-fire`, `font-display`, etc.).
2. **`@layer components`** — classes CSS reutilizáveis que podem
   compor utilities ou propriedades brutas.

## Decisão

Combinar as duas:

- **Tokens** (cores brand, cores dos 18 tipos, fontes, raios, borda
  brutal, shadows brutal, motion) ficam em `src/styles/tokens.css`
  dentro de `@theme`. Toda cor vira utility (`bg-primary`,
  `text-type-electric`, `border-ink`).
- **Comportamentos brutalistas reutilizáveis** (`brutal-surface`,
  `brutal-interactive`, `brutal-focusable`, `brutal-pulse`,
  `brutal-stripes`, `skip-link`) ficam em `src/styles/components.css`
  dentro de `@layer components`.
- **Composição final** acontece no componente Angular via `cn(...)`
  - utility classes do Tailwind. Componentes do design system
    consomem as classes `.brutal-*` no template; features não as
    reescrevem.

`@apply` **não** é usado.

## Alternativas Consideradas

- **`@apply` em cada componente Angular** — descartado: cada
  primitivo brutalista re-declararia o mesmo combo de borda + shadow.
  Drift garantido ao longo do tempo, e a "linguagem visual" deixa
  de ser revisável em um arquivo central.
- **Utility-soup direto nos templates de feature** — descartado: cards
  da listagem, da busca, dos detalhes e do styleguide teriam o mesmo
  combo `border-[3px] border-ink shadow-[4px_4px_0_0_var(--ink)]`
  repetido. Refatoração futura vira caça ao tesouro.
- **CSS Modules / SCSS por componente** — descartado: incompatível com
  Tailwind v4 sem perder a colocalização dos tokens; o ganho de
  isolamento não compensa o custo.
- **CSS-in-TS / Vanilla Extract** — descartado: nova dependência, nova
  ferramentaria de build; tokens em CSS puro já cobrem o caso.

## Consequências

### Positivas

- Tokens são fonte única da verdade — adicionar uma cor de tipo é
  uma linha em `tokens.css`.
- Comportamentos brutalistas (hover/press/focus) ficam em um único
  arquivo; ajuste de transição afeta todos os componentes
  automaticamente.
- Features escrevem templates curtos: `<app-brutal-card interactive>`
  encapsula o que seriam 8+ utilities Tailwind.
- Dark mode em 3 camadas (ver ADR-0005) só precisa redefinir as CSS
  vars; nenhuma classe `.brutal-*` precisa mudar.

### Negativas / Trade-offs

- Classes dinâmicas (ex.: `bg-type-${name}`) precisam ser
  safelisted via `@source inline(...)` em `styles.css`, senão
  Tailwind não as gera. Documentado em comentário.
- Há dois "lugares" para colocar CSS — devs novos precisam aprender
  a regra "token: em `@theme`; comportamento reutilizável: em
  `@layer components`; visual de feature: em utility no template".

### Neutras / Implicações futuras

- Migrar para outro engine de design (ex.: vanilla-extract) seria um
  rewrite, não um refactor — aceitável dado o lock-in deliberado em
  Tailwind v4.

## Referências

- `src/styles/tokens.css`
- `src/styles/components.css`
- `src/styles.css` (entry + safelist)
- `src/app/core/utils/cn.ts`
- `src/app/shared/ui/brutal-button/brutal-button-classes.ts`
