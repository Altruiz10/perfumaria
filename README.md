# Homem & Mulher — Perfumaria Artesanal

E-commerce de perfumaria de nicho. Next.js 16 · React 19 · TypeScript · Tailwind CSS 4.
Construído pelo método spec → teste → código: a fonte da verdade está em [`specs/`](specs/).

| Documento | Para quê |
|---|---|
| [specs/PRD.md](specs/PRD.md) | O que construir e o que **não** construir |
| [specs/RULES.md](specs/RULES.md) | Regras invariantes numeradas (R, S, P, C, A) citadas por testes e commits |
| [specs/ARCHITECTURE.md](specs/ARCHITECTURE.md) | Camadas, portas de extensão e ADRs |
| [specs/TESTS_SPEC.md](specs/TESTS_SPEC.md) | Casos críticos CT-001…CT-020 |
| [specs/AGENTS.md](specs/AGENTS.md) | Como agentes de IA devem trabalhar aqui |

## Rodar

```bash
npm install
npm run dev              # http://localhost:3000  → redireciona para /pt
npm run verify           # tipos + lint + testes unitários/integração
npm run build && ./scripts/serve.sh   # produção em :3100
npm run e2e              # Playwright (mobile + desktop) + axe; requer o servidor em :3100
```

Variáveis de ambiente: veja `.env.example`. Em produção o app **recusa subir sem escolha explícita** de
`PERSISTENCE` (`supabase`|`memory`) e `PAYMENT_GATEWAY` (`mercadopago`|`fake`): esquecer uma variável nunca
vira pedido em memória nem pagamento falso. Em desenvolvimento o padrão é `memory` + `fake`.

## Mapa rápido

```
src/
  domain/        regras puras (dinheiro, sacola, catálogo, checkout, consentimento) — sem React/Next
  application/   casos de uso (placeOrder, reconcilePayment, getOrderStatus)
  infra/         implementações das portas: catálogo, pedidos, pagamento, analytics
                 ├ supabase/     pedidos + newsletter (única pasta que conhece o Supabase)
                 ├ mercadopago/  cobrança Pix/cartão + webhook (única pasta que conhece o MP)
                 └ container.ts  ← único lugar para trocar CMS / ERP / gateway
supabase/        migrações SQL
  i18n/          dicionários pt/en/es + mapa de URLs traduzidas
  lib/           segurança (CSP, CSRF, sanitização), SEO, armazenamento no navegador
  components/    UI (cliente só onde há interação)
  app/[lang]/    páginas;  app/api/  checkout, newsletter, busca
  proxy.ts       idioma + URLs traduzidas + CSP com nonce + cookie CSRF
```

## Trocar as imagens placeholder

As imagens em `public/images/` são arte gerada (`npm run images`) até a sessão de fotos.
Substitua mantendo os nomes de arquivo (4:5 para produto, 2400×1350 e 1080×1620 para o hero).
O otimizador do Next guarda variantes por 4 horas: depois de trocar uma foto com o mesmo nome,
apague `.next/cache/images` ou faça um novo deploy.

## Serviços

- **Pedidos e newsletter → Supabase:** [`src/infra/supabase/README.md`](src/infra/supabase/README.md) (schema, RLS, como aplicar a migração)
- **Pagamento → Mercado Pago (Pix + cartão):** [`src/infra/payments/README.md`](src/infra/payments/README.md) (fluxo, webhook, configuração)
- **CMS / ERP:** implemente `ProductRepository` e troque em `src/infra/container.ts` (hoje o catálogo é o seed em `infra/catalog/products.ts`)
- **CRM de newsletter:** implemente `NewsletterRepository`
- **Analytics:** `setAnalyticsSink()` em `src/infra/analytics/analytics.ts` — só dispara com consentimento (C1)
- Todo domínio de terceiro precisa entrar na CSP (`src/lib/security.ts`) e na Política de Cookies.

## Pendências conhecidas

- Textos legais são **modelo** — revisar com advogado antes de publicar.
- Copy em inglês e espanhol sem revisão nativa.
- Catálogo ainda é o seed em código (sem estoque); login/conta, e-mail transacional, frete por CEP, nota fiscal e painel administrativo não existem.
- A tela de confirmação diz que o cliente "receberá a confirmação por e-mail": enquanto não houver e-mail transacional, ajustar o texto.
