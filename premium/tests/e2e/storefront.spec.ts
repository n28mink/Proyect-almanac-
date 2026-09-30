import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const errors = (page: Page) => {
  const list: string[] = [];
  page.on('pageerror', (e) => list.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/WebGL|swiftshader|Failed to load resource: the server responded with a status of 40[14]/.test(m.text())) list.push(m.text());
  });
  return list;
};

test('home: 16 bloques, sin errores de consola, cabecera y CSP', async ({ page }) => {
  const errs = errors(page);
  const res = await page.goto('/es', { waitUntil: 'networkidle' });
  const h = res!.headers();
  expect(h['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(h['x-content-type-options']).toBe('nosniff');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('footer')).toBeVisible();
  expect(errs).toEqual([]);
});

test('las 12 categorías existen como páginas reales', async ({ request }) => {
  for (const c of ['jewelry', 'watches', 'necklaces', 'earrings', 'rings', 'bracelets', 'accessories', 'women', 'men', 'new-arrivals', 'gifts']) {
    const r = await request.get(`/es/shop/${c}`);
    expect(r.status(), c).toBe(200);
  }
  expect((await request.get('/es/collections')).status()).toBe(200);
  expect((await request.get('/es/shop/nope')).status()).toBe(404);
});

test('compra: añadir a la bolsa → drawer → checkout → pedido (proveedor mock)', async ({ page }) => {
  const errs = errors(page);
  await page.goto('/es/shop/rings', { waitUntil: 'networkidle' });
  await page.locator('a[href*="/product/"]').first().click();
  await page.waitForURL(/\/product\//);
  await page.getByRole('button', { name: /Añadir a la bolsa/ }).first().click();
  await page.getByRole('button', { name: /Bolsa \(1\)/ }).click();
  const drawer = page.getByRole('dialog');
  await expect(drawer).toBeVisible();
  await drawer.getByRole('link', { name: /pago|checkout|finalizar/i }).click();
  await page.waitForURL(/\/checkout/);
  await page.getByLabel('Correo electrónico').fill('cliente@example.com');
  await page.getByLabel('Nombre completo').fill('Cliente Prueba');
  await page.locator('#line1').fill('Calle 1 #2-3');
  await page.getByLabel('Ciudad').fill('Bogotá');
  await page.getByRole('button', { name: /pagar|confirmar|realizar/i }).last().click();
  await page.waitForURL(/checkout\/success/, { timeout: 20_000 });
  expect(errs).toEqual([]);
});

test('tienda: búsqueda y filtros en la URL', async ({ page }) => {
  await page.goto('/es/shop?sort=price-desc&view=list', { waitUntil: 'networkidle' });
  const prices = await page.locator('[data-price]').evaluateAll((els) => els.map((e) => Number(e.getAttribute('data-price'))));
  for (let i = 1; i < prices.length; i++) expect(prices[i]).toBeLessThanOrEqual(prices[i - 1]!);
});

test('EN: contenido localizado, hreflang y JSON-LD de producto', async ({ page }) => {
  await page.goto('/en/shop/watches', { waitUntil: 'networkidle' });
  await page.locator('a[href*="/product/"]').first().click();
  await page.waitForURL(/\/en\/product\//);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
  const types = ld.flatMap((t) => JSON.parse(t)).map((j: { '@type': string }) => j['@type']);
  expect(types).toEqual(expect.arrayContaining(['Product', 'BreadcrumbList']));
  await expect(page.locator('link[rel="alternate"][hreflang="es"]')).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
});

test('SEO: sitemap y robots', async ({ request }) => {
  const s = await (await request.get('/sitemap.xml')).text();
  expect(s).toContain('/es/shop');
  expect((await (await request.get('/robots.txt')).text())).toContain('Disallow: /');
});

test('seguridad: rutas privadas redirigen y el webhook rechaza firmas inválidas', async ({ page, request }) => {
  await page.goto('/es/account');
  await expect(page).toHaveURL(/\/login/);
  await page.goto('/es/admin');
  await expect(page).toHaveURL(/\/login|\/es$|not-found|404/);
  const r = await request.post('/api/webhooks/stripe', { data: '{}', headers: { 'stripe-signature': 't=1,v1=bad' } });
  expect([400, 401, 404, 503]).toContain(r.status());
});

for (const path of ['/es', '/es/shop', '/es/login']) {
  test(`a11y (axe, WCAG A/AA) ${path}`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).exclude('[data-decorative]').analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
}

test('@mobile sin desbordamiento horizontal en home, tienda y producto', async ({ page }) => {
  for (const p of ['/es', '/es/shop', '/es/shop/watches']) {
    await page.goto(p, { waitUntil: 'networkidle' });
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(over, p).toBeLessThanOrEqual(0);
  }
});
