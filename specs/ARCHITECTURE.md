# Arquitetura

Como o sistema é organizado e por quê. Regras em [RULES.md](RULES.md).

## Stack
Next.js 16 (App Router, Turbopack) · React 19 · TypeScript estrito · Tailwind CSS 4 ·
zod · Vitest · Playwright + axe-core.

## Camadas (dependência só aponta para dentro)

```
app/ (rotas, páginas, route handlers)        ← apresentação + entrega HTTP
components/ (UI; cliente só onde há interação)
        │
        ▼
application/ (casos de uso: placeOrder, subscribeNewsletter)
        │
        ▼
domain/ (puro: money, cart, catalog query, checkout schema, consent)   ← zero import de Next/React
        ▲
        │ implementa portas
infra/ (repositórios, gateways de pagamento, analytics)
```

- `domain/` não conhece framework. Todo teste unitário mora aqui.
- `infra/` implementa **portas** declaradas em `domain/ports.ts`.
- `application/` recebe as portas por parâmetro (injeção simples, sem container).

## Portas (pontos de extensão)
| Porta | Implementação MVP | Trocar por |
|---|---|---|
| `ProductRepository` | `InMemoryProductRepository` (dados em `infra/catalog/products.ts`) | CMS headless, ERP, API própria |
| `PaymentGateway` | `FakePaymentGateway` (aprova cartão, gera Pix fictício) | `StripeGateway`, `MercadoPagoGateway` (Pix nativo) |
| `OrderRepository` | `InMemoryOrderRepository` | banco (Postgres/Prisma) |
| `NewsletterRepository` | em memória | CRM (RD Station, HubSpot, Klaviyo) |
| `AnalyticsSink` | no-op, só dispara com consentimento (C1) | GA4, Meta Pixel, Segment |

A escolha da implementação acontece em um único lugar: `infra/container.ts`.

## i18n
- Rotas sob `app/[lang]`. Locales: `pt` (padrão), `en`, `es`.
- O proxy roda também em prefetches do `next/link` (diferente do exemplo da doc de CSP), senão as URLs traduzidas prefetchadas dão 404.
- URLs traduzidas: pasta interna em inglês, segmento público por idioma
  (`/pt/colecao` ↔ `/en/collection` ↔ `/es/coleccion`). Mapeamento puro em
  `i18n/routes.ts`; o `proxy.ts` reescreve público → interno.
- Negociação: cookie `hm_locale` → `Accept-Language` → `pt`.
- Dicionários por idioma em `i18n/dictionaries/*.ts`, tipados pelo `pt` (chave faltando = erro de compilação).

## Estado no cliente
- Sacola e favoritos: reducer puro do domínio sobre um store externo em `localStorage` (essencial, ADR-007).
- Favoritos: idem.
- Tema: atributo `data-theme` no `<html>`, script inline com nonce evita flash.
- Consentimento: `localStorage` + evento; analytics lê antes de disparar.

## Decisões (ADR)
- **ADR-001 URLs traduzidas via rewrite no proxy.** Alternativa (pastas duplicadas por idioma) triplica rotas. Custo: um mapa central que precisa de teste.
- **ADR-002 CSP com nonce ⇒ renderização dinâmica.** Perde-se SSG; ganha-se CSP sem `unsafe-inline` (S1). Mitigação: dados em memória/cache, páginas leves. Revisitar com SRI quando sair de experimental.
- **ADR-003 Fontes self-hosted (Fontsource + next/font/local).** Performance (P2) e LGPD: nenhum IP de visitante vai a terceiros.
- **ADR-004 Checkout em página única com Route Handler + CSRF double-submit** em vez de Server Action, para controlar Origin/token explicitamente (S3) e servir de contrato para app móvel futuro.
- **ADR-005 Imagens placeholder geradas** (`scripts/generate-images.mjs`, SVG → WebP via sharp) para exercitar `next/image` real até a fotografia chegar. Otimizador serve só WebP: a primeira codificação AVIF custava dezenas de segundos para ganho irrelevante nesses tamanhos.
- **ADR-006 Busca no servidor (`GET /api/search`).** O cliente recebe só um resumo do catálogo (`ProductSummary`) e o dicionário sem textos legais. Motivo: payload RSC de 131 KB e 1,7 s de render delay no LCP. Caminho de crescimento: trocar `queryCatalog` por um motor de busca.
- **ADR-007 Armazenamento do navegador como store externo** (`useSyncExternalStore`): sacola, favoritos e consentimento sem setState em efeito, SSR estável e sincronização entre abas.
- **ADR-008 Gavetas carregadas sob demanda** (menu, busca, sacola) e zod importado só no submit do checkout — reduz JS da primeira pintura.
- **ADR-009 Fontes: só o subconjunto latin.** `next/font/local` emite um `@font-face` por arquivo sem `unicode-range`; incluir latin-ext fazia o último arquivo capturar os acentos (ã, â) e quebrava a renderização.
