# Gateways de pagamento

Contrato: `PaymentGateway` em `src/domain/ports.ts`. Hoje só existe `FakePaymentGateway`.

Para ligar um gateway real:

1. Criar `stripe-payment-gateway.ts` ou `mercado-pago-payment-gateway.ts` implementando `charge(order)`.
   - Mercado Pago: Pix nativo (`payment_method_id: "pix"`) devolve `qr_code` → mapear para `pixCode`.
   - Stripe: `PaymentIntent` com `payment_method_types: ["card", "pix"]`.
2. Cartão: usar o elemento hospedado do provedor (Stripe Elements / Mercado Pago Bricks). O número do cartão **nunca** passa pelo nosso servidor (PCI SAQ-A).
3. Webhook em `src/app/api/webhooks/<provedor>/route.ts` validando assinatura; só ele marca pedido como pago.
4. Credenciais em variáveis de ambiente **sem** prefixo `NEXT_PUBLIC_` (S6); chave pública do provedor pode ter o prefixo.
5. Atualizar a CSP (`src/lib/security.ts`) com os domínios do provedor em `script-src`/`frame-src`/`connect-src`.
6. Trocar a instância em `src/infra/container.ts`.
