-- Orders and newsletter.
--
-- Design notes
--  * One table per aggregate. An order is written and read as a whole, so the
--    priced lines are an immutable snapshot (jsonb): the price paid must never
--    change when the catalogue does, and the catalogue is not in this database.
--  * Money is integer cents (R1) and the database re-checks the arithmetic of R2:
--    total = subtotal - discount + shipping.
--  * The server is the only client. Row Level Security is enabled with NO policies
--    and every grant to anon/authenticated is revoked: the public API keys can
--    neither read nor write. Only the service_role key (server-side, S6) can.
--  * Provider-specific facts (which gateway, its payment id) live in two generic
--    columns; method-specific details sit in payment_details. Changing provider
--    needs no migration.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------- orders --

create table public.orders (
  id                  text primary key,
  created_at          timestamptz not null,
  updated_at          timestamptz not null default now(),

  locale              text not null check (locale in ('pt', 'en', 'es')),
  status              text not null check (status in
                        ('pending_payment', 'paid', 'payment_failed', 'cancelled', 'expired', 'refunded')),
  payment_method      text not null check (payment_method in ('pix', 'card')),

  subtotal_cents      integer not null check (subtotal_cents >= 0),
  shipping_cents      integer not null check (shipping_cents >= 0),
  discount_cents      integer not null check (discount_cents >= 0),
  total_cents         integer not null check (total_cents >= 0),
  constraint orders_total_is_consistent check (total_cents = subtotal_cents - discount_cents + shipping_cents),

  items               jsonb not null
                        check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) > 0),

  customer_name       text not null,
  customer_email      text not null check (customer_email = lower(customer_email)),
  customer_cpf        text not null check (customer_cpf ~ '^[0-9]{11}$'),
  customer_phone      text not null default '',

  address_cep         text not null check (address_cep ~ '^[0-9]{8}$'),
  address_street      text not null,
  address_number      text not null,
  address_complement  text not null default '',
  address_district    text not null,
  address_city        text not null,
  address_state       text not null check (address_state ~ '^[A-Z]{2}$'),

  marketing_opt_in    boolean not null default false,

  payment_provider    text,
  payment_external_id text,
  payment_details     jsonb,
  constraint orders_payment_is_all_or_nothing
    check ((payment_provider is null) = (payment_external_id is null))
);

-- A provider payment belongs to exactly one order.
create unique index orders_payment_unique
  on public.orders (payment_provider, payment_external_id)
  where payment_external_id is not null;

create index orders_status_created_idx on public.orders (status, created_at desc);
create index orders_customer_email_idx on public.orders (customer_email);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

alter table public.orders enable row level security;
revoke all on table public.orders from anon, authenticated;
grant all on table public.orders to service_role;

-- ------------------------------------------------------------ newsletter --

create table public.newsletter_subscribers (
  email       text primary key check (email = lower(email)),
  -- Evidence of consent (LGPD, C2). The first value is kept; a repeat sign-up never rewrites it.
  consent_at  timestamptz not null,
  created_at  timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;
revoke all on table public.newsletter_subscribers from anon, authenticated;
grant all on table public.newsletter_subscribers to service_role;
