# Supabase (pedidos e newsletter)

Tudo que fala com o Supabase mora **nesta pasta**. O resto do app enxerga só as portas
`OrderRepository` e `NewsletterRepository` (`src/domain/ports.ts`). Trocar de banco = escrever
outro adapter e mudar uma linha em `src/infra/container.ts`.

| Arquivo | Responsabilidade |
|---|---|
| `index.ts` | única superfície pública: `createSupabaseRepositories()` |
| `order-row.ts` | tradução pura `Order ↔ linha da tabela` (todo o conhecimento do schema) |
| `supabase-order-repository.ts` | `create`, `findById`, `update` com compare-and-swap de status |
| `supabase-newsletter-repository.ts` | opt-in; o primeiro consentimento é preservado (C2) |
| `persistence-error.ts` | erro com **código** apenas — a mensagem do banco pode ecoar e-mail/CPF (C5) |

## Modelo de dados

`supabase/migrations/20261114000000_orders_and_newsletter.sql`

- **`orders`** — um agregado por linha. Itens ficam como *snapshot* `jsonb` (o preço pago não pode
  mudar quando o catálogo mudar). Dinheiro em centavos inteiros (R1) e o banco reconfere R2:
  `total = subtotal − desconto + frete`. Status restrito por `check`. Cobrança do provedor em colunas
  genéricas (`payment_provider`, `payment_external_id`, `payment_details`): trocar de gateway não exige migração.
  `unique (payment_provider, payment_external_id)`: um pagamento pertence a um único pedido.
- **`newsletter_subscribers`** — e-mail único em minúsculas + `consent_at`.
- **RLS ligada sem nenhuma policy** e `revoke` para `anon`/`authenticated`: as chaves públicas não leem
  nem escrevem. Só a chave `service_role`, no servidor (S6), acessa.

### Por que `update` é compare-and-swap

O webhook pode chegar duplicado ou em paralelo. `update(next, statusEsperado)` vira um único
`UPDATE … WHERE id = ? AND status = ?`; o Postgres serializa na linha, então só um escritor vence e
os outros releem. A máquina de estados (`src/domain/order.ts`) decide *quais* transições são legais; o
repositório só garante que ninguém sobrescreve ninguém.

## Aplicar a migração

```bash
npx supabase login
npx supabase link --project-ref <ref>   # ref = parte inicial de https://<ref>.supabase.co
npx supabase db push
```

Ou cole o `.sql` no **SQL Editor** do painel. Depois configure `PERSISTENCE=supabase`,
`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` (veja `.env.example`).

## Testes

- `order-row.test.ts` e `supabase-repositories.test.ts` rodam sempre (sem rede): conferem o mapeamento
  e a forma exata das requisições (inclusive o `PATCH … id=eq.X&status=eq.Y`).
- O **contrato** de `OrderRepository` (`src/infra/orders/order-repository.contract.ts`) roda sempre contra
  o adapter em memória e, opcionalmente, contra um projeto Supabase de **desenvolvimento**:

```bash
SUPABASE_TEST_URL=https://<ref>.supabase.co SUPABASE_TEST_SERVICE_ROLE_KEY=... npm test
```

Ele insere pedidos de teste (ids `HM-CONTRACT-…`); não aponte para produção.
