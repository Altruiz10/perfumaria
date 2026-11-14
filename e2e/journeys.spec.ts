import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/** Skip the banner in journeys that are not about consent. */
async function preConsent(page: Page) {
  await page.addInitScript(() =>
    localStorage.setItem(
      "hm_consent",
      JSON.stringify({ version: "2026-09", necessary: true, analytics: false, marketing: false, updatedAt: "2026-09-22T00:00:00.000Z" }),
    ),
  );
}

test("CT-017 compra completa: produto → sacola → checkout → confirmação", async ({ page }) => {
  await preConsent(page);
  await page.goto("/pt/perfume/cedro-branco");
  await expect(page.getByTestId("product-title")).toHaveText("Cedro Branco");
  await page.getByTestId("add-to-bag").click();

  const cart = page.getByTestId("mini-cart");
  await expect(cart).toBeVisible();
  await expect(cart.getByTestId("cart-line")).toHaveCount(1);
  await expect(page.getByTestId("cart-count")).toHaveText("1");
  await cart.getByTestId("go-checkout").click();

  await expect(page).toHaveURL(/\/pt\/finalizar$/);
  const form = page.getByTestId("checkout-form");

  // Invalid submit shows errors (R9)
  await page.getByTestId("place-order").click();
  await expect(page.getByTestId("form-error")).toBeVisible();

  await form.getByLabel("Nome completo", { exact: true }).fill("Maria Souza");
  await form.getByLabel("E-mail", { exact: true }).fill("maria@example.com");
  await form.getByLabel("CPF", { exact: true }).fill("52998224725");
  await form.getByLabel("CEP", { exact: true }).fill("01310100");
  await form.getByLabel("Endereço", { exact: true }).fill("Av. Paulista");
  await form.getByLabel("Número", { exact: true }).fill("1000");
  await form.getByLabel("Bairro", { exact: true }).fill("Bela Vista");
  await form.getByLabel("Cidade", { exact: true }).fill("São Paulo");
  await form.getByLabel("Estado", { exact: true }).selectOption("SP");
  await page.getByTestId("accept-terms").check();

  // 100 ml = R$ 589,00, Pix -5% = R$ 559,55, frete grátis (R3, R4)
  await expect(page.getByTestId("checkout-total")).toContainText("559,55");
  await page.getByTestId("place-order").click();

  await expect(page).toHaveURL(/\/pt\/finalizar\/confirmacao$/);
  await expect(page.getByTestId("confirmation")).toContainText("HM-");
  await expect(page.getByTestId("confirmation")).toContainText("559,55");
  await expect(page.getByTestId("cart-count")).toHaveCount(0);
});

test("CT-018 troca de idioma traduz a URL, mantém a página e persiste", async ({ page, isMobile }) => {
  await preConsent(page);
  await page.goto("/pt/colecao");
  if (isMobile) {
    await page.getByLabel("Abrir menu").click();
    await page.getByRole("dialog").getByRole("button", { name: /EN/ }).click();
  } else {
    await page.getByTestId("language-switcher").getByRole("button", { name: /Idioma/ }).click();
    await page.getByRole("menuitemradio", { name: /English/ }).click();
  }
  await expect(page).toHaveURL(/\/en\/collection$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en-US");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Fragrances");

  await page.goto("/");
  await expect(page).toHaveURL(/\/en$/);
});

test("CT-019 tema escuro persiste após recarregar", async ({ page, isMobile }) => {
  await preConsent(page);
  await page.goto("/pt");
  if (isMobile) await page.getByLabel("Abrir menu").click();
  const toggle = isMobile ? page.getByRole("dialog").getByTestId("theme-toggle") : page.getByTestId("theme-toggle").first();
  await toggle.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("C1 banner de cookies: padrão recusado, escolha persiste", async ({ page }) => {
  await page.goto("/pt");
  const banner = page.getByTestId("cookie-banner");
  await expect(banner).toBeVisible();
  await banner.getByRole("button", { name: "Apenas essenciais" }).click();
  await expect(banner).toHaveCount(0);
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("hm_consent") ?? "null"));
  expect(stored).toMatchObject({ analytics: false, marketing: false });
  await page.reload();
  await expect(page.getByTestId("cookie-banner")).toHaveCount(0);
});

test("busca tolerante a acento encontra produto (R8)", async ({ page }) => {
  await preConsent(page);
  await page.goto("/pt");
  await page.getByTestId("open-search").click();
  await page.getByTestId("search-input").fill("ambar");
  await expect(page.getByTestId("search-results")).toContainText("Âmbar Imperial");
});

test("filtros da coleção atualizam resultados e URL", async ({ page }) => {
  await preConsent(page);
  await page.goto("/pt/colecao");
  await page.getByRole("button", { name: "Amadeirados" }).click();
  await expect(page).toHaveURL(/family=woody/);
  await expect(page.getByTestId("product-card")).toHaveCount(2);
});

test("S1/S2 headers de segurança e CSP com nonce", async ({ request }) => {
  const res = await request.get("/pt");
  const h = res.headers();
  expect(h["content-security-policy"]).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]+' 'strict-dynamic'/);
  expect(h["content-security-policy"]).not.toContain("unsafe-eval");
  expect(h["x-frame-options"]).toBe("DENY");
  expect(h["x-content-type-options"]).toBe("nosniff");
});

test("S3 checkout sem CSRF é rejeitado", async ({ request }) => {
  const res = await request.post("/api/checkout", { data: {} });
  expect(res.status()).toBe(403);
});

for (const path of ["/pt", "/pt/colecao", "/pt/perfume/iris-nocturne", "/pt/finalizar", "/en/privacy"]) {
  test(`CT-020 axe sem violações serious/critical em ${path}`, async ({ page }) => {
    await preConsent(page);
    await page.goto(path);
    await page.waitForTimeout(1600); // let entrance animations settle before contrast checks
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    const blocking = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(blocking.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
}

test("CT-024 cartão (gateway de demonstração): confirmação consulta o status no servidor e mostra o aviso de demo", async ({ page }) => {
  await preConsent(page);
  await page.goto("/pt/perfume/cedro-branco");
  await page.getByTestId("add-to-bag").click();
  await page.getByTestId("mini-cart").getByTestId("go-checkout").click();

  const form = page.getByTestId("checkout-form");
  await form.getByLabel("Nome completo", { exact: true }).fill("Maria Souza");
  await form.getByLabel("E-mail", { exact: true }).fill("maria@example.com");
  await form.getByLabel("CPF", { exact: true }).fill("52998224725");
  await form.getByLabel("CEP", { exact: true }).fill("01310100");
  await form.getByLabel("Endereço", { exact: true }).fill("Av. Paulista");
  await form.getByLabel("Número", { exact: true }).fill("1000");
  await form.getByLabel("Bairro", { exact: true }).fill("Bela Vista");
  await form.getByLabel("Cidade", { exact: true }).fill("São Paulo");
  await form.getByLabel("Estado", { exact: true }).selectOption("SP");
  await form.locator('input[name="payment"][value="card"]').check();
  await page.getByTestId("accept-terms").check();
  await page.getByTestId("place-order").click();

  await expect(page).toHaveURL(/\/pt\/finalizar\/confirmacao$/);
  await expect(page.getByTestId("order-status")).toHaveAttribute("data-status", "paid");
  await expect(page.getByTestId("confirmation")).toContainText("Pedido de demonstração");
  await expect(page.getByTestId("cart-count")).toHaveCount(0);
});

test("CT-025 retorno do provedor: ?order= consulta o servidor; pedido desconhecido não quebra a página", async ({ page, request }) => {
  await preConsent(page);
  expect((await request.get("/api/orders/HM-NAO-EXISTE/status")).status()).toBe(404);
  expect((await request.get("/api/orders/..%2Fetc/status")).status()).toBe(404);

  await page.goto("/pt/finalizar/confirmacao?order=HM-ABC123-DEF456");
  await expect(page.getByTestId("confirmation")).toContainText("HM-ABC123-DEF456");
  await expect(page.getByTestId("order-status")).toHaveAttribute("data-status", "pending_payment");
});

test("CT-026 webhook sem assinatura válida é rejeitado e nunca altera pedidos", async ({ request }) => {
  const res = await request.post("/api/webhooks/payments?data.id=123&type=payment", {
    data: { type: "payment", data: { id: "123" } },
  });
  expect(res.status()).toBe(401);
});
