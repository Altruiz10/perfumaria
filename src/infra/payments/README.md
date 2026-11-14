# Pagamentos

Duas portas pequenas em `src/domain/ports.ts`, porque cobrar e reconciliar são casos de uso diferentes:

- `PaymentGateway.charge(order, ctx)` — começa a cobrança (usado por `placeOrder`).
- `PaymentNotifications.parse()/fetchPayment()` — autentica o aviso do provedor e consulta o estado real
  do pagamento (usado por `reconcilePayment`).

Implementações: `FakePaymentGateway` (demonstração) e `src/infra/mercadopago/` (real). Só o
`src/infra/container.ts` escolhe qual usar, por `PAYMENT_GATEWAY`.

## Mercado Pago — como funciona aqui

| Meio | Fluxo |
|---|---|
| **Pix** | `POST /v1/payments` (`payment_method_id: "pix"`, expira em 30 min). O `qr_code` volta ao cliente e é exibido na nossa página de confirmação. |
| **Cartão** | `POST /checkout/preferences` (Checkout Pro, só cartão, até 12x). O cliente conclui na página do Mercado Pago e volta para `/…/confirmacao?order=<id>`. **O número do cartão nunca toca o nosso servidor** (PCI SAQ-A) e não há script de terceiros no nosso site: a CSP não mudou. |

O pedido é gravado como `pending_payment` **antes** de cobrar. Só o webhook marca como pago:

1. `POST /api/webhooks/payments` recebe o aviso. A assinatura `x-signature` (HMAC-SHA256 com o segredo
   do webhook) é conferida; inválida → 401.
2. O corpo do aviso **não** é confiado: consultamos `GET /v1/payments/{id}` com o nosso token.
3. O `external_reference` identifica o pedido; o valor cobrado precisa bater com o total calculado no
   servidor (R2), senão o pedido não é marcado como pago.
4. A transição passa pela máquina de estados (`src/domain/order.ts`) e é gravada com compare-and-swap.
   Aviso repetido ou atrasado não muda nada.

Respostas ao Mercado Pago: 2xx = "pare de reenviar", 401 = forjado, 5xx = "tente de novo".

## Configurar (painel do Mercado Pago)

1. *Suas integrações* → criar aplicação (Checkout Pro / API de pagamentos).
2. *Credenciais* → `MERCADOPAGO_ACCESS_TOKEN` (`TEST-…` no sandbox, `APP_USR-…` em produção).
3. *Webhooks* → URL `https://SEU-DOMINIO/api/webhooks/payments`, evento **Pagamentos**; copie a
   **assinatura secreta** para `MERCADOPAGO_WEBHOOK_SECRET`.
4. Teste no sandbox com usuários de teste antes de usar credenciais de produção.

## Trocar de provedor (Stripe etc.)

Criar `src/infra/<provedor>/` com as duas portas, uma função `create…()` como no Mercado Pago, e um `case`
em `container.ts`. Nenhum caso de uso, rota ou componente muda.
