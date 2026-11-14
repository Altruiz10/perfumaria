import { createClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { describeOrderRepositoryContract, sampleOrder } from "../orders/order-repository.contract";
import { orderToRow } from "./order-row";
import { PersistenceError } from "./persistence-error";
import { SupabaseNewsletterRepository } from "./supabase-newsletter-repository";
import { SupabaseOrderRepository } from "./supabase-order-repository";

const URL_ = "https://proj.supabase.co";

function clientWith(respond: (req: Request) => Response) {
  const calls: Request[] = [];
  const fetchStub = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const req = new Request(input, init);
    calls.push(req.clone());
    return respond(req);
  });
  const db = createClient(URL_, "service-key", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: fetchStub as unknown as typeof fetch },
  });
  return { db, calls };
}
const jsonRes = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("SupabaseOrderRepository — forma das requisições", () => {
  it("create: INSERT em orders com a linha completa", async () => {
    const { db, calls } = clientWith(() => new Response(null, { status: 201 }));
    const order = sampleOrder();
    await new SupabaseOrderRepository(db).create(order);
    expect(calls[0].method).toBe("POST");
    expect(new URL(calls[0].url).pathname).toBe("/rest/v1/orders");
    expect(await calls[0].json()).toEqual(orderToRow(order));
  });

  it("update: um único PATCH condicionado a id E status; 1 linha afetada = true, 0 = false", async () => {
    const won = clientWith(() => jsonRes([{ id: "HM-1" }]));
    const order = sampleOrder({ id: "HM-1", status: "paid" });
    expect(await new SupabaseOrderRepository(won.db).update(order, "pending_payment")).toBe(true);
    const url = new URL(won.calls[0].url);
    expect(won.calls[0].method).toBe("PATCH");
    expect(url.searchParams.get("id")).toBe("eq.HM-1");
    expect(url.searchParams.get("status")).toBe("eq.pending_payment");
    expect(Object.keys(await won.calls[0].json()).sort()).toEqual(["payment_details", "payment_external_id", "payment_provider", "status"]);

    const lost = clientWith(() => jsonRes([]));
    expect(await new SupabaseOrderRepository(lost.db).update(order, "pending_payment")).toBe(false);
  });

  it("findById: null quando não há linha; converte a linha em Order", async () => {
    const order = sampleOrder();
    const hit = clientWith(() => jsonRes(orderToRow(order)));
    expect(await new SupabaseOrderRepository(hit.db).findById(order.id)).toEqual(order);
    expect(new URL(hit.calls[0].url).searchParams.get("id")).toBe(`eq.${order.id}`);

    const miss = clientWith(() => jsonRes([]));
    expect(await new SupabaseOrderRepository(miss.db).findById("HM-X")).toBeNull();
  });

  it("erro do banco vira PersistenceError só com o código (a mensagem pode ter dado pessoal, C5)", async () => {
    const { db } = clientWith(() =>
      jsonRes({ code: "23505", message: "duplicate key", details: "Key (customer_email)=(maria@example.com) already exists." }, 409),
    );
    const err = await new SupabaseOrderRepository(db).create(sampleOrder()).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(PersistenceError);
    expect((err as PersistenceError).code).toBe("23505");
    expect(JSON.stringify({ m: (err as Error).message })).not.toContain("maria");
  });
});

describe("SupabaseNewsletterRepository", () => {
  it("upsert que ignora duplicado: o primeiro consentimento é a evidência (C2)", async () => {
    const { db, calls } = clientWith(() => new Response(null, { status: 201 }));
    await new SupabaseNewsletterRepository(db).subscribe("a@x.com", "2026-11-14T12:00:00.000Z");
    const url = new URL(calls[0].url);
    expect(url.pathname).toBe("/rest/v1/newsletter_subscribers");
    expect(url.searchParams.get("on_conflict")).toBe("email");
    expect(calls[0].headers.get("prefer")).toContain("resolution=ignore-duplicates");
    expect(await calls[0].json()).toEqual({ email: "a@x.com", consent_at: "2026-11-14T12:00:00.000Z" });
  });
});

// Opt-in: run the SAME contract the in-memory adapter passes against a real Supabase project.
//   SUPABASE_TEST_URL=https://<ref>.supabase.co SUPABASE_TEST_SERVICE_ROLE_KEY=... npm test
// Use a throwaway/dev project: it inserts orders.
const liveUrl = process.env.SUPABASE_TEST_URL;
const liveKey = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY;
describeOrderRepositoryContract(
  "supabase (live)",
  () => new SupabaseOrderRepository(createClient(liveUrl!, liveKey!, { auth: { persistSession: false } })),
  { skip: !liveUrl || !liveKey },
);
