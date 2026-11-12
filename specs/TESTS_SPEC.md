# Estratégia de testes

## Níveis
- **Unitários (Vitest)** — `src/**/*.test.ts`: todo o `domain/`, `i18n/routes`, `lib/security`.
- **Integração (Vitest)** — route handlers chamados com `Request` real: `/api/checkout`, `/api/newsletter`.
- **E2E (Playwright, viewport mobile + desktop)** — `e2e/`: jornadas principais + axe.
- **Regressão** — todo bug corrigido ganha teste citando o bug no nome.

Pirâmide alvo: ~70% unitário, ~20% integração, ~10% e2e.

## Casos críticos
- CT-001 Somar/formatar centavos sem erro de ponto flutuante (R1)
- CT-002 Servidor ignora preço adulterado pelo cliente (R2)
- CT-003 Fronteira do frete: 29899 paga frete, 29900 não paga (R3)
- CT-004 Desconto Pix de 5% arredonda para baixo e não incide no frete (R4)
- CT-005 Quantidade 0, 11, -1, 2.5 é ajustada/rejeitada (R5)
- CT-006 Mesmo slug+tamanho soma; tamanhos diferentes geram linhas distintas (R6)
- CT-007 Sacola reidratada descarta item inexistente (R7)
- CT-008 "ambar" encontra "Âmbar"; "vetiveer" encontra "vetiver" (R8)
- CT-009 CPF com dígito errado/repetido é inválido; CEP com 7 dígitos é inválido (R9)
- CT-010 POST sem Origin ou com token CSRF divergente → 403 (S3)
- CT-011 Nome com `<script>` chega ao pedido sem tag (S4)
- CT-012 `serializeJsonLd` escapa `</script>` (S5)
- CT-013 CSP gerada contém nonce e não contém `unsafe-inline` em script-src (S1)
- CT-014 Consentimento padrão recusa analytics/marketing; versão nova invalida registro (C1, C2)
- CT-015 Todo dicionário tem exatamente as chaves do `pt`
- CT-016 Tradução de URL é bijetiva: interno → público → interno retorna o original, para todo idioma e rota
- CT-017 E2E: home → produto → adicionar → mini cart mostra item → checkout → confirmação
- CT-018 E2E: trocar idioma preserva a página e traduz a URL; preferência persiste
- CT-019 E2E: tema escuro persiste após reload
- CT-020 E2E: axe sem violações serious/critical em home, coleção, produto, checkout (A1)

## Resultado atual (22/09/2026)
- Unitários + integração: 78 passando (Vitest).
- E2E: 26 passando (13 cenários × mobile Pixel 7 + desktop 1440), incluindo axe WCAG 2.2 AA sem violações serious/critical.
- Lighthouse mobile (mediana de 3, servidor local): home perf 86–93, produto ~92, coleção 88–97; acessibilidade, boas práticas e SEO 100.

## O que NÃO testar
- Estilo visual fino (cores, tamanhos) — verificado por screenshot manual.
- Internals do Next.js/React.
