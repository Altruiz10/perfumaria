# Regras invariantes

Numeração estável: testes citam "valida R3", commits citam "corrige S2".
Nunca renumere. Mudança nesta lista exige aprovação humana.

## Domínio
R1. Dinheiro é sempre inteiro em centavos (`number` inteiro, BRL). Nunca `float` em cálculo.
R2. O servidor recalcula preço, frete, desconto e total a partir do catálogo. Preço vindo do cliente é ignorado.
R3. Frete grátis quando subtotal ≥ R$ 299,00 (29900); abaixo disso, frete fixo de R$ 29,90 (2990).
R4. Pix concede 5% de desconto sobre o subtotal (arredondado para baixo ao centavo). Frete não recebe desconto.
R5. Quantidade por linha da sacola: inteiro entre 1 e 10. Fora disso é ajustado (cliente) ou rejeitado (servidor).
R6. Uma linha da sacola é identificada por `slug + tamanho`. Adicionar o mesmo par soma quantidades.
R7. Item cujo produto/tamanho não existe mais no catálogo é descartado ao reidratar a sacola.
R8. Busca ignora caixa e acento e tolera um erro de digitação em termos com 5+ letras.
R9. Pedido só é criado com checkout válido: nome, e-mail, CPF válido (dígitos verificadores), CEP com 8 dígitos, endereço, e aceite dos termos.

## Segurança
S1. Toda resposta HTML leva CSP com nonce por requisição; sem `unsafe-inline` e sem `unsafe-eval` em script de produção.
S2. Headers obrigatórios: HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, frame-ancestors 'none'.
S3. Toda rota que muda estado (POST) exige Origin igual ao host E token CSRF double-submit válido.
S4. Toda entrada externa passa por schema (zod) antes de uso; texto livre é normalizado e tem HTML removido.
S5. Nenhum `dangerouslySetInnerHTML` exceto: JSON-LD serializado por `serializeJsonLd` (escapa `<`) e o script estático de tema (`lib/theme.ts`, sem dado dinâmico, com nonce).
S6. Segredos só em variáveis de ambiente de servidor; nada de chave privada com prefixo `NEXT_PUBLIC_`.

## Performance
P1. Imagens via `next/image` com dimensões explícitas; somente o hero e a primeira imagem do produto usam `priority`.
P2. Fontes self-hosted com `display: swap`; zero requisição a domínio de terceiros no carregamento.
P3. Componentes cliente só onde há interação; páginas são Server Components por padrão.

## Compliance (LGPD)
C1. Cookies/armazenamento não essenciais (analytics, marketing) só após consentimento explícito e granular. Padrão: recusado.
C2. Consentimento registrado com versão da política e data; mudança de versão reabre o banner.
C3. Opt-in de marketing nunca vem pré-marcado e é separado do aceite dos termos.
C4. O usuário consegue revogar o consentimento a qualquer momento pelo rodapé.
C5. Nenhum dado pessoal em log, URL ou analytics.

## Acessibilidade
A1. WCAG 2.2 AA: contraste ≥ 4.5:1 em texto, foco visível, alvos ≥ 24px, navegação completa por teclado.
A2. Diálogos (menu, busca, sacola, banner) prendem o foco, fecham com Esc e devolvem o foco ao gatilho.
A3. Movimento respeita `prefers-reduced-motion`.
