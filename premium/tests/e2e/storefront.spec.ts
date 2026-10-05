import AxeBuilder from '@axe-core/playwright';
import { expect, test, type BrowserContext, type Page } from '@playwright/test';

const ADMIN = process.env.NEXT_PUBLIC_ADMIN_PATH || 'gestion';

/**
 * La confirmación abre WhatsApp sola mientras el toque de «Hacer pedido» siga activo (el navegador lo mantiene ~5 s).
 * Las pruebas fijan ese estado para no depender de la velocidad del servidor: activo para comprobar la apertura
 * automática, inactivo para las que necesitan quedarse en la confirmación.
 */
const userActivation = (ctx: BrowserContext, isActive: boolean) =>
  ctx.addInitScript((active) => Object.defineProperty(navigator, 'userActivation', { get: () => ({ isActive: active, hasBeenActive: active }) }), isActive);
const noAutoWhatsApp = (ctx: BrowserContext) => userActivation(ctx, false);

const errors = (page: Page) => {
  const list: string[] = [];
  page.on('pageerror', (e) => list.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/WebGL|swiftshader|Failed to load resource: the server responded with a status of 40[14]/.test(m.text())) list.push(m.text());
  });
  return list;
};

test('home: marca, cabeceras de seguridad y sin errores de consola', async ({ page }) => {
  const errs = errors(page);
  const res = await page.goto('/es', { waitUntil: 'networkidle' });
  const h = res!.headers();
  expect(h['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(h['x-content-type-options']).toBe('nosniff');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('header').getByText('Accesorios y Prendas')).toBeVisible();
  await expect(page.locator('header a[aria-label]').first()).toBeVisible();
  // El número no se muestra: el pie lleva un enlace con icono de WhatsApp.
  const wa = page.locator('footer a[href^="https://wa.me/584121318133"]');
  await expect(wa).toBeVisible();
  await expect(wa).toHaveAccessibleName('WhatsApp');
  await expect(wa.locator('svg')).toBeVisible();
  expect(errs).toEqual([]);
});

test('el número de teléfono no se muestra en ningún sitio: solo el icono de WhatsApp que enlaza', async ({ page }) => {
  for (const path of ['/es', '/en', '/es/shop/shirts', '/es/legal/privacy', '/es/legal/terms', '/en/legal/privacy']) {
    await page.goto(path, { waitUntil: 'networkidle' });
    const text = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
    expect(text, path).not.toMatch(/131\s?8133|\+?58\s?412/);
  }
  await page.goto('/es/legal/privacy', { waitUntil: 'networkidle' });
  const link = page.locator('main a[href^="https://wa.me/584121318133"]');
  await expect(link).toHaveAccessibleName('WhatsApp');
  await expect(link.locator('svg')).toBeVisible();
  await expect(page.locator('main')).not.toContainText('{{');
});

test('la barra superior y el pie no mencionan precios en USD', async ({ page }) => {
  await page.goto('/es', { waitUntil: 'networkidle' });
  await expect(page.locator('footer')).not.toContainText('USD');
  await expect(page.locator('footer')).toContainText('Pedidos por WhatsApp');
  await expect(page.getByText('Entregas en Venezuela, Maracay')).toHaveCount(1);
  await expect(page.getByText(/precios en USD/i)).toHaveCount(0);
});

test('las categorías existen como páginas reales', async ({ request }) => {
  for (const c of ['jewelry', 'watches', 'necklaces', 'earrings', 'rings', 'bracelets', 'shirts', 'accessories', 'women', 'men', 'new-arrivals', 'gifts']) {
    expect((await request.get(`/es/shop/${c}`)).status(), c).toBe(200);
  }
  expect((await request.get('/es/collections')).status()).toBe(200);
  expect((await request.get('/es/shop/nope')).status()).toBe(404);
});

test('sin cuentas de cliente ni enlaces al panel en el sitio público', async ({ page, request }) => {
  await page.goto('/es', { waitUntil: 'networkidle' });
  const hrefs = await page.locator('a[href]').evaluateAll((els) => els.map((e) => e.getAttribute('href') ?? ''));
  for (const h of hrefs) expect(h, h).not.toMatch(/\/(login|register|account|admin|gestion)(\/|$)/);
  for (const p of ['/es/login', '/es/register', '/es/account', '/es/admin', '/en/admin/login', '/es/account/orders']) {
    expect((await request.get(p)).status(), p).toBe(404);
  }
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).not.toMatch(/admin|gestion/);
});

test('compra por WhatsApp: se registra el pedido y WhatsApp se abre solo con el mensaje escrito (sin pago en línea)', async ({ page, context }) => {
  const errs = errors(page);
  await userActivation(context, true);
  // wa.me responde algo mínimo para que la navegación se complete también en el entorno de pruebas.
  await page.route('https://wa.me/**', (r) => r.fulfill({ contentType: 'text/html', body: '<h1>WhatsApp</h1>' }));
  await page.goto('/es/shop/rings', { waitUntil: 'networkidle' });
  await page.locator('a[href*="/product/"]').first().click();
  await page.waitForURL(/\/product\//);
  await page.getByRole('button', { name: /Añadir a la bolsa/ }).first().click();
  await page.getByRole('button', { name: /Bolsa \(1\)/ }).click();
  const drawer = page.getByRole('dialog');
  await expect(drawer).toBeVisible();
  await expect(drawer.getByText('Se acuerda por WhatsApp')).toBeVisible();
  await expect(drawer.getByPlaceholder(/promocional/i)).toHaveCount(0);
  await drawer.getByRole('link', { name: /pedido/i }).click();
  await page.waitForURL(/\/checkout/);
  await expect(page.locator('#country')).toHaveCount(0);
  await expect(page.locator('#email')).toHaveCount(0);
  await page.locator('#fullName').fill('Ana Pérez');
  await page.locator('#phone').fill('0412 555 1234');
  await page.locator('#line1').fill('Av. Principal, casa 3');
  await page.locator('#city').fill('Turmero');
  const opened = page.waitForRequest(/https:\/\/wa\.me\/584121318133\?text=/, { timeout: 20_000 });
  await page.getByRole('button', { name: 'Hacer pedido' }).click();
  // Sin tocar nada más, el navegador va a WhatsApp con el mensaje del pedido ya escrito.
  const req = await opened;
  const text = decodeURIComponent(req.url().split('text=')[1]!);
  for (const part of ['CLV-', 'Ana Pérez', '0412 555 1234', 'Turmero', 'Total', 'Forma de pago: Pago móvil']) expect(text).toContain(part);
  await page.waitForURL(/wa\.me/);

  // Al volver atrás queda la confirmación con el botón de respaldo y NO vuelve a redirigir.
  await page.goBack();
  await page.waitForURL(/checkout\/success/);
  const wa = page.getByRole('link', { name: /Enviar pedido por WhatsApp/ });
  await expect(wa).toHaveAttribute('href', /^https:\/\/wa\.me\/584121318133\?text=/);
  await expect(wa).toHaveAttribute('target', '_blank');
  await page.waitForTimeout(1500);
  expect(page.url()).toMatch(/checkout\/success/);
  // La ayuda para escribir por WhatsApp es un enlace con icono, sin el número.
  await expect(page.getByRole('main').getByRole('link', { name: 'WhatsApp', exact: true })).toBeVisible();
  expect(await page.locator('main').innerText()).not.toMatch(/131\s?8133/);
  expect(errs).toEqual([]);
});

test('forma de pago: iconos, preselección, texto de la elegida y resumen del pedido', async ({ page, context }) => {
  const errs = errors(page);
  await noAutoWhatsApp(context);
  await context.addInitScript(() => localStorage.setItem('clover-cart-v2', JSON.stringify({ state: { lines: [{ productId: 'cm04', variantId: 'cm04-l', quantity: 1 }] }, version: 0 })));
  await page.goto('/es/checkout', { waitUntil: 'networkidle' });
  const group = page.getByRole('group', { name: 'Forma de pago' });
  await expect(group.getByRole('radio')).toHaveCount(3);
  await expect(group.locator('.pay-icon svg')).toHaveCount(3);
  await expect(group.getByRole('radio', { name: 'Pago móvil' })).toBeChecked();
  await expect(page.locator('#pay-chosen')).toContainText('Pagarás con pago móvil');
  const summary = page.getByRole('complementary', { name: 'Resumen del pedido' });
  await expect(summary.getByTestId('summary-payment')).toContainText('Pago móvil');
  await expect(summary).toContainText('Talla L');
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).exclude('[data-decorative]').analyze();
  expect(axe.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);

  // Teclado: las flechas recorren las opciones del grupo.
  await group.getByRole('radio', { name: 'Pago móvil' }).focus();
  await page.keyboard.press('ArrowDown');
  await expect(group.getByRole('radio', { name: 'Transferencia bancaria' })).toBeChecked();
  await group.getByText('Efectivo', { exact: true }).click();
  await expect(group.getByRole('radio', { name: 'Efectivo' })).toBeChecked();
  await expect(page.locator('#pay-chosen')).toContainText('Pagarás en efectivo');
  await expect(summary.getByTestId('summary-payment')).toContainText('Efectivo');

  await page.locator('#fullName').fill('Ana Pérez');
  await page.locator('#phone').fill('0412 555 1234');
  await page.locator('#line1').fill('Calle 5, casa 2');
  await page.locator('#city').fill('Maracay');
  await page.getByRole('button', { name: 'Hacer pedido' }).click();
  await page.waitForURL(/checkout\/success/, { timeout: 20_000 });
  await expect(page.getByText('Efectivo', { exact: true })).toBeVisible();
  await expect(page.getByText(/Talla L/)).toBeVisible();
  const text = decodeURIComponent((await page.getByRole('link', { name: /Enviar pedido por WhatsApp/ }).getAttribute('href'))!.split('text=')[1]!);
  for (const part of ['Camisa Margaritas (Talla L)', 'Forma de pago: Efectivo', '$12,00']) expect(text).toContain(part);
  expect(errs).toEqual([]);
});

test('camisas: filtro por color en la URL, sin tocar las tallas', async ({ page }) => {
  const errs = errors(page);
  await page.goto('/es/shop/shirts', { waitUntil: 'networkidle' });
  const group = page.getByRole('group', { name: 'Color de la prenda' }).first();
  await expect(group.getByRole('checkbox')).toHaveCount(4);
  // La casilla es controlada por la URL: se hace clic y se espera a que la URL cambie (check() exige el cambio al instante).
  await group.getByRole('checkbox', { name: /Coral/ }).click();
  await expect(page).toHaveURL(/color=coral/);
  await expect(group.getByRole('checkbox', { name: /Coral/ })).toBeChecked();
  await expect(page.locator('article.product-card')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Camisa Margaritas' })).toBeVisible();
  await page.getByRole('button', { name: /Quitar filtro Coral/ }).click();
  await expect(page.locator('article.product-card')).toHaveCount(5);
  // La joyería no ofrece esa faceta.
  await page.goto('/es/shop/rings', { waitUntil: 'networkidle' });
  await expect(page.getByRole('group', { name: 'Color de la prenda' })).toHaveCount(0);
  expect(errs).toEqual([]);
});

test('camisas: tallas S–XL a 12 USD y personalización cotizada por WhatsApp', async ({ page }) => {
  const errs = errors(page);
  await page.goto('/es/shop/shirts', { waitUntil: 'networkidle' });
  await expect(page.locator('article.product-card')).toHaveCount(5);
  await page.goto('/es/product/gods-child-t-shirt', { waitUntil: 'networkidle' });
  await expect(page.locator('h1')).toHaveText("Camisa God's Child");
  await expect(page.getByText('$12,00').first()).toBeVisible();
  const sizes = page.getByRole('group', { name: /Talla/ });
  await expect(sizes.getByRole('radio')).toHaveCount(4);
  await sizes.getByText('XL', { exact: true }).click();
  await expect(sizes.getByRole('radio', { name: 'XL' })).toBeChecked();
  const quote = page.getByRole('link', { name: /Cotizar personalización/ });
  const text = decodeURIComponent((await quote.getAttribute('href'))!.split('text=')[1]!);
  expect(text).toContain("Camisa God's Child en talla XL");
  await expect(page.getByText('Los colores pueden variar un poco entre la pantalla y la prenda impresa.')).toBeVisible();
  // Sin «Avísame»: las tallas se quedan como están.
  await expect(page.getByText(/avísame/i)).toHaveCount(0);
  await expect(page.getByText('Poli-algodón').first()).toBeVisible();
  expect(errs).toEqual([]);
});

test('checkout en carga directa hidrata con la CSP de nonce (sin scripts bloqueados)', async ({ page, context }) => {
  const errs = errors(page);
  await context.addInitScript(() => localStorage.setItem('clover-cart-v2', JSON.stringify({ state: { lines: [{ productId: 'an04', variantId: 'an04-1', quantity: 1 }] }, version: 0 })));
  const res = await page.goto('/es/checkout', { waitUntil: 'networkidle' });
  expect(res!.headers()['content-security-policy']).toContain("'nonce-");
  await expect(page.locator('#fullName')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Hacer pedido' })).toBeEnabled();
  expect(errs.filter((e) => /Content Security Policy/.test(e))).toEqual([]);
});

test('movimiento: el interruptor del pie detiene el movimiento y se recuerda', async ({ page }) => {
  await page.goto('/es', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  expect(await page.locator('video').count()).toBeGreaterThan(0);
  const toggle = page.getByRole('button', { name: 'Reducir movimiento' });
  await toggle.scrollIntoViewIfNeeded();
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced');
  await expect(page.getByRole('button', { name: 'Activar movimiento' })).toHaveAttribute('aria-pressed', 'true');
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced');
  // Sin movimiento no se monta ningún <video> (queda el póster con su botón de reproducir).
  await expect(page.locator('video')).toHaveCount(0);
  await page.getByRole('button', { name: 'Activar movimiento' }).click();
  await expect(page.locator('html')).not.toHaveAttribute('data-motion', /.+/);
});

test('teclado: activar un enlace con Enter navega al instante, sin cortina de transición', async ({ page }) => {
  await page.goto('/es', { waitUntil: 'networkidle' });
  const link = page.locator('header nav a', { hasText: 'Relojes' }).first();
  await link.focus();
  await page.keyboard.press('Enter');
  await page.waitForURL(/\/es\/shop\/watches/, { timeout: 4000 });
  // La cortina (overlay de transición) no llegó a mostrarse.
  const shown = await page.evaluate(() => [...document.querySelectorAll('div[aria-hidden="true"].fixed')].some((e) => getComputedStyle(e).visibility === 'visible' && Number(getComputedStyle(e).opacity) > 0));
  expect(shown).toBe(false);
  await expect(page.locator('#main')).toBeFocused();
});

test('bolsa: quitar una pieza se puede deshacer', async ({ page }) => {
  await page.goto('/es/shop/rings', { waitUntil: 'networkidle' });
  await page.locator('a[href*="/product/"]').first().click();
  await page.waitForURL(/\/product\//);
  const add = page.getByRole('button', { name: /Añadir a la bolsa/ }).first();
  await add.click();
  await expect(page.getByRole('button', { name: 'Añadido' }).first()).toBeVisible(); // el botón cambia de estado
  await page.getByRole('button', { name: /Bolsa \(1\)/ }).click();
  const drawer = page.getByRole('dialog');
  await drawer.getByRole('button', { name: 'Quitar' }).click();
  await expect(drawer.getByText('Tu bolsa está vacía')).toBeVisible();
  await drawer.getByRole('button', { name: 'Deshacer' }).click();
  await expect(drawer.getByRole('button', { name: 'Quitar' })).toBeVisible();
});

test('checkout: errores junto al campo y foco en el primero que falla', async ({ page, context }) => {
  await context.addInitScript(() => localStorage.setItem('clover-cart-v2', JSON.stringify({ state: { lines: [{ productId: 'an04', variantId: 'an04-1', quantity: 1 }] }, version: 0 })));
  await page.goto('/es/checkout', { waitUntil: 'networkidle' });
  await expect(page.getByRole('button', { name: 'Hacer pedido' })).toBeEnabled();
  await page.getByRole('button', { name: 'Hacer pedido' }).click();
  await expect(page.locator('#fullName-error')).toContainText('nombre y apellido');
  await expect(page.locator('#fullName')).toBeFocused();
  await expect(page.locator('#fullName')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#phone')).toHaveAttribute('placeholder', /…$/);
  await page.locator('#fullName').fill('Ana Pérez');
  await page.locator('#phone').fill('12');
  await page.getByRole('button', { name: 'Hacer pedido' }).click();
  await expect(page.locator('#phone')).toBeFocused();
  await expect(page.locator('#phone-error')).toContainText('teléfono válido');
});

test('tienda: orden por precio en la URL', async ({ page }) => {
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

test('búsqueda sin resultados ofrece categorías para seguir explorando', async ({ page }) => {
  await page.goto('/es', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Buscar' }).click();
  await page.getByRole('searchbox').fill('zzzzqq');
  const dlg = page.getByRole('dialog', { name: /Buscar/ });
  await expect(dlg.getByText(/Sin resultados/)).toBeVisible();
  await expect(dlg.getByRole('link').first()).toBeVisible();
});

test('SEO: sitemap y robots', async ({ request }) => {
  const s = await (await request.get('/sitemap.xml')).text();
  expect(s).toContain('/es/shop');
  expect(s).not.toMatch(/admin|gestion|login|account/);
  expect(await (await request.get('/robots.txt')).text()).toContain('Disallow: /');
});

test('legal: privacidad, términos, envíos y cookies con los textos de Clover', async ({ request }) => {
  for (const s of ['privacy', 'terms', 'shipping', 'cookies']) expect((await request.get(`/es/legal/${s}`)).status(), s).toBe(200);
  expect(await (await request.get('/es/legal/terms')).text()).toContain('pago móvil');
});

test('panel de administración: solo en su ruta oculta, con login de administrador', async ({ page, request }) => {
  const errs = errors(page);
  // El panel sin sesión lleva al login del panel (misma ruta oculta) y el login no revela nada del sitio público.
  await page.goto(`/es/${ADMIN}`);
  await expect(page).toHaveURL(new RegExp(`/es/${ADMIN}/login`));
  await expect(page.getByRole('heading', { name: /Acceso al panel/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible(); // catálogo de mensajes del cliente completo
  expect(errs).toEqual([]);
  const bad = await request.get(`/es/${ADMIN}/orders`, { maxRedirects: 0 });
  expect([302, 307, 308]).toContain(bad.status());
  const headers = (await request.get(`/es/${ADMIN}/login`)).headers();
  expect(headers['x-robots-tag']).toContain('noindex');
  expect(headers['cache-control']).toContain('no-store');
});

for (const path of ['/es', '/es/shop', '/es/checkout', '/es/shop/shirts', '/es/product/daisies-t-shirt']) {
  test(`a11y (axe, WCAG A/AA) ${path}`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).exclude('[data-decorative]').analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
}

test('@mobile accesibilidad (axe) y objetivos táctiles en la cabecera', async ({ page }) => {
  for (const path of ['/es', '/es/shop/rings']) {
    await page.goto(path, { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).exclude('[data-decorative]').analyze();
    expect(r.violations.map((v) => `${path} ${v.id}: ${v.nodes.length}`)).toEqual([]);
  }
  // El botón de menú tiene nombre accesible aunque su texto se oculte en móvil y mide ≥ 44 px.
  const menu = page.getByRole('button', { name: 'Menú' });
  const box = (await menu.boundingBox())!;
  expect(box.height).toBeGreaterThanOrEqual(44);
  expect(box.width).toBeGreaterThanOrEqual(44);
});

test('@mobile sin desbordamiento horizontal en home, tienda y categoría', async ({ page }) => {
  for (const p of ['/es', '/es/shop', '/es/shop/watches', '/es/product/daisies-t-shirt']) {
    await page.goto(p, { waitUntil: 'networkidle' });
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(over, p).toBeLessThanOrEqual(0);
  }
});

test('admin: iniciar sesión y confirmar el pago de un pedido registrado por un cliente', async ({ page, browser, baseURL }) => {
  test.setTimeout(90_000);
  test.skip(!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD, 'Requiere ADMIN_EMAIL y ADMIN_PASSWORD (los mismos del servidor).');
  // 1) Un cliente hace un pedido de 1 unidad.
  const ctx = await browser.newContext({ baseURL: baseURL! });
  await noAutoWhatsApp(ctx);
  const shop = await ctx.newPage();
  await shop.goto('/es/shop/rings', { waitUntil: 'networkidle' });
  await shop.locator('a[href*="/product/"]').first().click();
  await shop.waitForURL(/\/product\//);
  await shop.getByRole('button', { name: /Añadir a la bolsa/ }).first().click();
  await shop.goto('/es/checkout', { waitUntil: 'networkidle' });
  await shop.locator('#fullName').fill('Cliente Admin Test');
  await shop.locator('#phone').fill('0414 111 2222');
  await shop.locator('#line1').fill('Calle 1, casa 2');
  await shop.locator('#city').fill('Maracay');
  await shop.getByRole('button', { name: 'Hacer pedido' }).click();
  await shop.waitForURL(/checkout\/success/);
  const number = (await shop.locator('main').innerText()).match(/CLV-\d+-\d+/)![0];
  await ctx.close();

  // 2) El administrador entra por la ruta oculta y confirma el pago.
  await page.goto(`/es/${ADMIN}`);
  await page.locator('#email').fill(process.env.ADMIN_EMAIL!);
  await page.locator('#password').fill(process.env.ADMIN_PASSWORD!);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL(new RegExp(`/es/${ADMIN}$`));
  await page.goto(`/es/${ADMIN}/orders`);
  for (const tab of ['Resumen', 'Productos', 'Pedidos', 'Campañas', 'Media']) await expect(page.getByRole('navigation', { name: 'Secciones del admin' }).getByRole('link', { name: tab, exact: true })).toBeVisible();
  const row = page.locator('li', { hasText: number });
  await expect(row).toContainText('Cliente Admin Test');
  await expect(row).toContainText('Forma de pago: Pago móvil');
  await row.getByRole('combobox').selectOption('paid');
  await row.getByRole('button', { name: 'Guardar' }).click();
  await page.reload();
  await expect(page.locator('li', { hasText: number }).getByRole('combobox')).toHaveValue('paid');

  // Se cancela al terminar: así el inventario se repone y la prueba se puede repetir sin agotar la pieza.
  const done = page.locator('li', { hasText: number });
  await done.getByRole('combobox').selectOption('cancelled');
  await done.getByRole('button', { name: 'Guardar' }).click();
  await page.reload();
  await expect(page.locator('li', { hasText: number }).getByRole('combobox')).toHaveValue('cancelled');
});
