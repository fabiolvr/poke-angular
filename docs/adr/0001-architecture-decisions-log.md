# ADR-0001: Manter um Architecture Decisions Log

- **Status**: Accepted
- **Data**: 2026-05-16
- **Decisores**: Tech Lead

## Contexto

O projeto Pokédex Angular tem um conjunto considerável de decisões
arquiteturais já tomadas (Signals como mecanismo primário de estado, Tailwind
v4, Vitest, neobrutalismo, Transloco para i18n, SPA sem SSR, busca client-side
etc.) e outras que ainda serão tomadas durante a evolução. Sem um registro
explícito, perderemos a memória do "porquê" cada escolha foi feita — e
pagaremos esse custo em discussões repetidas, refatorações desnecessárias e
trade-offs invisíveis para quem chegar depois.

## Decisão

Adotar Architecture Decision Records (formato Nygard, em pt-BR) como mecanismo
canônico para documentar decisões arquiteturais. Os ADRs vivem em
`docs/adr/NNNN-titulo-em-kebab-case.md`, são numerados sequencialmente e
imutáveis após aceitos (revisões são feitas via novos ADRs marcando o anterior
como `Superseded`).

## Alternativas Consideradas

- **Documentar apenas no README** — descartado: README cresce sem limite e
  perde a granularidade temporal de "quando/por quê" cada decisão foi tomada.
- **Wiki externa (Notion, Confluence)** — descartado: documentação versionada
  com o código é mais durável e revisável em PRs; ferramentas externas tendem
  a desincronizar.
- **Não documentar (confiar em commit messages)** — descartado: mensagens de
  commit são granulares demais para capturar decisões transversais.

## Consequências

### Positivas

- Decisões transversais ficam rastreáveis e revisáveis em code review.
- Onboarding fica mais rápido: ler `docs/adr/` dá panorama do "porquê".
- Reduz o risco de refatorar contra restrições intencionais sem perceber.

### Negativas / Trade-offs

- Custo de escrever ADRs (mitigado pelo template enxuto).
- Risco de ADRs ficarem desatualizados — mitigado pelo princípio de imutabilidade
  combinado com o status `Superseded`.

### Neutras / Implicações futuras

- ADRs futuros previstos no plano: Signals vs NgRx, cache HTTP, paginação,
  Tailwind utilities vs componentização, design tokens, i18n, Vitest runner,
  busca híbrida.

## Referências

- [Documenting Architecture Decisions — Michael Nygard](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- `docs/adr/template.md`
