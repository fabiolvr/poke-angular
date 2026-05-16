# ADR-0005: Design tokens neobrutalistas + dark mode em três camadas

- **Status**: Accepted
- **Data**: 2026-05-16
- **Decisores**: Tech Lead

## Contexto

A identidade visual exige:

1. **Bordas grossas (3px) + hard shadows (offset puro, sem blur)** em
   praticamente todos elementos interativos.
2. **18 cores oficiais de tipos Pokémon** disponíveis como background
   e text utility — sem hardcode em componentes.
3. **Dark mode** com inversão visível (fundo escuro, ink claro,
   bordas e shadows seguindo o ink atual), respeitando
   `prefers-color-scheme` mas permitindo override explícito do
   usuário.
4. **Cores saturadas** permanecem; sem gradientes, sem glassmorphism.

A implementação precisa não duplicar valores entre LightMode e
DarkMode, e shadows precisam acompanhar a cor de ink correta sem
re-declaração por tema.

## Decisão

### Tokens

Todas as cores e dimensões viram CSS custom properties em
`src/styles/tokens.css` dentro de `@theme`:

```css
--color-bg, --color-surface, --color-surface-muted
--color-ink, --color-ink-soft, --color-ink-mute
--color-primary, --color-secondary, --color-accent
--color-success, --color-danger, --color-warning
--color-type-{normal..fairy} (18 entradas)
--font-display, --font-sans, --font-mono
--border-brutal-width: 3px
--radius-brutal: 6px
--shadow-brutal-sm/md/lg (compostos com var(--color-ink))
--motion-fast, --motion-base, --motion-ease
```

### Dark mode em três camadas

Cascata de prioridade, da menor para a maior:

1. **`@theme` defaults (light)** — primeiro paint, sempre.
2. **`@media (prefers-color-scheme: dark)`** com seletor
   `:root:not([data-theme="light"])` — usuário do sistema em dark
   ganha tema escuro automaticamente, **a menos que** tenha
   explicitamente escolhido light.
3. **`[data-theme="dark"]` / `[data-theme="light"]`** em
   `<html>` — `ThemeService` escreve esse atributo quando o
   usuário toca o `ThemeToggle`. Wins sobre tudo.

Como `--shadow-brutal*` é definido como
`4px 4px 0 0 var(--color-ink)`, ele **automaticamente** segue a cor
de ink ativa em cada tema. Zero duplicação de declaração de shadow
entre temas.

### Mapeamento de tipos

`POKEMON_TYPES` (lista de 18) vive em `@core/domain`. As CSS vars
estão em `tokens.css`. As funções `pokemonTypeBgClass(type)` e
`pokemonTypeNeedsDarkLabel(type)` em `@core/theme` traduzem entre
domínio e visual.

As utilities `bg-type-*` / `text-type-*` são **safelisted** via
`@source inline(...)` em `styles.css` porque são construídas via
template literal em runtime (Tailwind não as detecta no scan estático).

## Alternativas Consideradas

- **CSS vars apenas em `:root`, sem `@theme`** — descartado: Tailwind
  v4 só gera utilities a partir de tokens declarados em `@theme`.
- **Tema via classes (`dark:bg-X`) sem CSS vars** — descartado: cada
  componente teria que listar duplicata de classes. Vars + override
  por seletor é DRY.
- **Build-time dark mode (CSS @import condicional)** — descartado:
  exige reload para trocar tema, contradiz o requisito de toggle em
  runtime.
- **JS calcula cor invertida em runtime** — descartado: caro,
  flickers, e a paleta de design não é mecânica (dark não é apenas
  light invertido).

## Consequências

### Positivas

- Trocar de tema = um `setAttribute` em `<html>`; o CSS faz o resto.
- Shadows e bordas seguem o ink ativo sem código adicional.
- Adicionar um tipo de Pokémon novo é uma linha em `tokens.css`
  - uma em `POKEMON_TYPES` (TS) — o resto se propaga.
- `prefers-color-scheme` honrado por padrão.

### Negativas / Trade-offs

- O safelist de `bg-type-*` precisa ser mantido manualmente
  (adicionar um tipo exige atualizar 3 lugares: `tokens.css`,
  `POKEMON_TYPES`, `@source inline` em `styles.css`).
- O FOUC inicial sempre renderiza em light (defaults do `@theme`)
  por uma fração de segundo antes do `ThemeService` aplicar o
  atributo persistido. Aceitável para SPA bootstrap.
- `LIGHT_TYPE_BACKGROUNDS` (electric, ice, fairy, ground, normal)
  é uma lista manual em `core/theme` para forçar `text-ink` em vez
  de `text-white`. Se um tipo novo entrar com paleta similar, precisa
  ser adicionado aqui.

### Neutras / Implicações futuras

- Se um terceiro tema for adicionado (ex.: high-contrast), basta uma
  nova entrada `[data-theme="hc"]` em `tokens.css` + uma opção no
  `ThemeService`.

## Referências

- `src/styles/tokens.css`
- `src/styles.css` (safelist)
- `src/app/core/domain/pokemon-type.ts`
- `src/app/core/theme/pokemon-type.tokens.ts`
- `src/app/core/theme/theme.service.ts`
