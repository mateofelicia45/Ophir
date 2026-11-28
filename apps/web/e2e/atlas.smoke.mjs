// Smoke del atlas y su integración con el Lector, con Playwright (Chromium).
//
// Uso (desde apps/web):
//   npm run build
//   node e2e/atlas.smoke.mjs                       # levanta `vite preview` en el puerto 4173
//   ATLAS_BASE_URL=http://localhost:5173 node e2e/atlas.smoke.mjs   # contra un servidor ya corriendo
//   ATLAS_SHOTS=/ruta/capturas node e2e/atlas.smoke.mjs              # además guarda capturas
//
// Playwright no es dependencia del proyecto: se toma de la instalación global.
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const BASE = process.env.ATLAS_BASE_URL || 'http://localhost:4173';
const SHOTS = process.env.ATLAS_SHOTS || '';
const WEB_DIR = fileURLToPath(new URL('..', import.meta.url));

let failures = 0;
function check(name, ok, detail = '') {
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`);
  if (!ok) failures++;
}

async function reachable(url) {
  try { return (await fetch(url)).ok; } catch { return false; }
}

async function ensureServer() {
  if (await reachable(BASE)) return null;
  if (process.env.ATLAS_BASE_URL) throw new Error(`No responde ${BASE}`);
  const port = new URL(BASE).port || '4173';
  const proc = spawn(process.execPath, [fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url)), 'preview', '--port', port, '--strictPort'], { cwd: WEB_DIR, stdio: 'ignore' });
  for (let i = 0; i < 60; i++) {
    if (await reachable(BASE)) return proc;
    await new Promise((r) => setTimeout(r, 500));
  }
  proc.kill();
  throw new Error('vite preview no arrancó (¿falta `npm run build`?)');
}

// Sin red externa: solo localhost responde (fuentes y relieve quedan abortados).
async function newPage(browser, viewport, errors) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.route(/^https?:\/\/(?!localhost|127\.0\.0\.1)/, (r) => r.abort());
  page.on('pageerror', (e) => errors.pageerrors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.console.push(m.text()); });
  return { ctx, page };
}

async function shot(page, name) {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: `${SHOTS}/${name}.png` });
}

async function waitMap(page) {
  await page.waitForFunction(() => window.__atlasMap && window.__atlasMap.loaded(), null, { timeout: 30000 });
  await page.waitForFunction(() => window.__atlasMap.queryRenderedFeatures({ layers: ['land'] }).length > 0, null, { timeout: 30000 });
}

async function zoomClickable(page, label) {
  const btn = page.locator('.maplibregl-ctrl-zoom-in');
  const before = await page.evaluate(() => window.__atlasMap.getZoom());
  try {
    await btn.click({ timeout: 3000 });
    await page.waitForFunction((z) => window.__atlasMap.getZoom() > z + 0.2, before, { timeout: 5000 });
    check(`Zoom clickeable ${label}`, true);
  } catch (e) {
    check(`Zoom clickeable ${label}`, false, e.message.split('\n')[0]);
  }
}

const server = await ensureServer();
const browser = await chromium.launch();
try {
  // 1. Sin red: costas, lagos y lugares, sin errores de página.
  {
    const errors = { pageerrors: [], console: [] };
    const { ctx, page } = await newPage(browser, { width: 1440, height: 900 }, errors);
    await page.goto(`${BASE}/atlas`);
    await page.waitForSelector('canvas.maplibregl-canvas', { timeout: 30000 });
    await waitMap(page);
    const n = await page.evaluate(() => ({
      land: window.__atlasMap.queryRenderedFeatures({ layers: ['land'] }).length,
    }));
    check('1. /atlas muestra el canvas y la capa land sin red', n.land > 0, `${n.land} features`);
    await page.waitForTimeout(500);
    check('1. sin pageerror', errors.pageerrors.length === 0, errors.pageerrors.join(' | '));
    if (errors.console.length) console.log(`     (errores de consola esperados por requests abortados: ${errors.console.length})`);
    await ctx.close();
  }

  // 2. Banner del pasaje.
  {
    const errors = { pageerrors: [], console: [] };
    const { ctx, page } = await newPage(browser, { width: 1440, height: 900 }, errors);
    await page.goto(`${BASE}/atlas?cap=jhn.4`);
    const banner = page.getByText(/Lugares de Juan 4/);
    let ok = true;
    try { await banner.first().waitFor({ timeout: 15000 }); } catch { ok = false; }
    check('2. /atlas?cap=jhn.4 muestra «Lugares de Juan 4»', ok, ok ? await banner.first().innerText() : '');
    await waitMap(page);
    await page.waitForTimeout(1500);
    await shot(page, 'task-13-cap-banner');
    await ctx.close();
  }

  // 3. Celular 390x844: ficha abierta y cerrada, el zoom se puede clickear.
  for (const theme of ['light', 'dark']) {
    const errors = { pageerrors: [], console: [] };
    const { ctx, page } = await newPage(browser, { width: 390, height: 844 }, errors);
    await page.addInitScript((t) => {
      try { localStorage.setItem('ophir.atlas.v1', JSON.stringify({ v: 1, theme: t })); } catch { /* sin storage */ }
    }, theme);
    await page.goto(`${BASE}/atlas?lugar=jerusalem`);
    await waitMap(page);
    const sheet = page.locator('.atlas-app .right');
    await sheet.waitFor({ state: 'visible', timeout: 15000 });
    check(`3. ficha abierta en celular (${theme})`, await sheet.isVisible());
    // El lugar elegido queda visible sobre el borde superior de la hoja.
    await page.waitForFunction(() => !window.__atlasMap.isMoving(), null, { timeout: 10000 });
    await page.waitForTimeout(300);
    const vis = await page.evaluate(() => {
      const c = window.__atlasMap.getContainer().getBoundingClientRect();
      const sheetTop = document.querySelector('.atlas-app .right').getBoundingClientRect().top;
      const p = window.__atlasMap.project([35.2342, 31.7767]);
      return { y: c.top + p.y, sheetTop, mapTop: c.top };
    });
    check(`3. el lugar queda sobre la hoja (${theme})`, vis.y < vis.sheetTop - 10 && vis.y > vis.mapTop,
      `y=${Math.round(vis.y)} hoja=${Math.round(vis.sheetTop)}`);
    await shot(page, `task-13-${theme}-mobile`);
    await zoomClickable(page, `con la ficha abierta (${theme})`);
    await page.getByRole('button', { name: 'Cerrar la ficha' }).click();
    await sheet.waitFor({ state: 'hidden', timeout: 5000 });
    check(`3. la ficha se cierra (${theme})`, true);
    await zoomClickable(page, `con la ficha cerrada (${theme})`);
    // Panel izquierdo: cajón modal que se abre y se cierra con el fondo.
    await page.getByRole('button', { name: 'Mostrar u ocultar el panel de exploración' }).click();
    const left = page.locator('.atlas-app .left');
    await left.waitFor({ state: 'visible', timeout: 5000 });
    await page.locator('.atlas-app .scrim').click({ position: { x: 380, y: 400 } });
    await left.waitFor({ state: 'hidden', timeout: 5000 }).then(
      () => check(`3. el cajón izquierdo se cierra con el fondo (${theme})`, true),
      () => check(`3. el cajón izquierdo se cierra con el fondo (${theme})`, false),
    );
    await zoomClickable(page, `con el cajón cerrado (${theme})`);
    check(`3. sin pageerror en celular (${theme})`, errors.pageerrors.length === 0, errors.pageerrors.join(' | '));
    await ctx.close();
  }

  // Capturas de escritorio con una ficha abierta.
  if (SHOTS) {
    for (const theme of ['light', 'dark']) {
      const errors = { pageerrors: [], console: [] };
      const { ctx, page } = await newPage(browser, { width: 1440, height: 900 }, errors);
      await page.addInitScript((t) => {
        try { localStorage.setItem('ophir.atlas.v1', JSON.stringify({ v: 1, theme: t })); } catch { /* sin storage */ }
      }, theme);
      await page.goto(`${BASE}/atlas?lugar=jerusalem`);
      await waitMap(page);
      await page.waitForTimeout(1500);
      await shot(page, `task-13-${theme}-desktop`);
      await ctx.close();
    }
  }

  // 4. Lector -> Mapa.
  {
    const errors = { pageerrors: [], console: [] };
    const { ctx, page } = await newPage(browser, { width: 1440, height: 900 }, errors);
    await page.goto(`${BASE}/lector/jhn/4`);
    await page.getByRole('heading', { name: /Juan 4/ }).first().waitFor({ timeout: 15000 });
    check('4. /lector/jhn/4 abre Juan 4', true);
    await page.getByRole('button', { name: /Mapa/ }).first().click();
    await page.waitForURL(/\/atlas\?.*cap=jhn\.4/, { timeout: 10000 }).then(
      () => check('4. «Mapa» lleva a /atlas?cap=jhn.4', true),
      () => check('4. «Mapa» lleva a /atlas?cap=jhn.4', false, page.url()),
    );
    await ctx.close();
  }
} finally {
  await browser.close();
  if (server) server.kill();
}

console.log(failures ? `\n${failures} chequeo(s) fallaron` : '\nTodo en verde');
process.exit(failures ? 1 : 0);
