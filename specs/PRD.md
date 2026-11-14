# PRD: Homem e Mulher Perfumaria Artesanal — e-commerce

Documento de produto. Fonte da verdade para O QUE construir. Regras invariantes
em [RULES.md](RULES.md); decisões técnicas em [ARCHITECTURE.md](ARCHITECTURE.md).

## Visão
Vender perfumes artesanais de nicho online com a presença de uma maison
internacional de luxo: editorial, silenciosa, cinematográfica — e rápida no celular.

## Persona alvo
- **Comprador presenteador (principal):** 28–50 anos, compra pelo celular à noite,
  decide por desejo e storytelling, sensível a frete e parcelamento.
- **Colecionador de nicho:** conhece famílias olfativas, compara notas, valoriza
  concentração e tamanho do frasco.
- Tráfego majoritário do Brasil (pt-BR); en e es para turistas e América Latina.

## Jobs to be done
- Descobrir uma fragrância que traduza quem eu sou (ou quem vou presentear).
- Entender o perfume sem sentir o cheiro: notas, família, ocasião, história.
- Comprar em poucos toques, com Pix ou cartão, sabendo o total antes de pagar.

## Escopo do MVP (esta entrega)
| Área | Entrega |
|---|---|
| Home | Barra promocional rotativa, header sticky (menu, busca, logo central, conta, sacola), hero cinematográfico, coleção em destaque, manifesto, famílias olfativas, newsletter |
| Catálogo | Grid editorial, filtros (família, gênero), ordenação, busca tolerante a acento e erro de digitação |
| Produto | Galeria grande, storytelling, pirâmide olfativa, escolha de tamanho, CTA, JSON-LD Product |
| Sacola | Mini cart lateral, quantidades, persistência local, frete grátis acima do limite (R3) |
| Checkout | Uma página, validação cliente+servidor, total recalculado no servidor (R2). Pedido gravado no Supabase; pagamento por **Mercado Pago** (Pix na página, cartão no Checkout Pro) atrás de interface; status confirmado só por webhook; gateway falso apenas para demonstração |
| Conta | Estrutura: login (desabilitado), favoritos funcionais (local), pedidos e endereços como estado vazio |
| i18n | pt (padrão), en, es; URLs traduzidas; seletor com bandeiras; persistência |
| Tema | Claro/escuro, respeita sistema, persiste, sem flash |
| LGPD | Banner de consentimento granular, gestão de cookies, política de privacidade, termos, opt-in de marketing |
| SEO | Metadata dinâmica, Open Graph, hreflang, Schema.org, sitemap, robots |
| Segurança | CSP com nonce, headers seguros, CSRF, sanitização, validação com schema |

## Critérios de sucesso
- Lighthouse mobile ≥ 90 em Performance, Acessibilidade, Boas práticas e SEO na home e no produto.
- Zero violação axe de severidade *serious*/*critical* nas páginas principais.
- Jornada "home → produto → sacola → checkout → confirmação" concluída em ≤ 6 toques no mobile.

## Não objetivos (MVP)
- Emissão de nota fiscal, cálculo de frete por CEP, e-mail transacional, controle de estoque.
- Autenticação real e painel administrativo.
- CMS/ERP/CRM conectados (o catálogo segue em código) (a arquitetura prepara, não integra — ver ARCHITECTURE §Portas).
- Fotografia real: imagens são placeholders gerados até a sessão de fotos.

## Riscos conhecidos
- Sem fotografia real, o impacto "cinematográfico" depende de direção de arte futura.
- Copy em en/es foi escrita sem revisão nativa.
- CSP com nonce obriga renderização dinâmica (custo de servidor, ver ADR-002).
