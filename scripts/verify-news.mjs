import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

const native = process.argv.includes('--native');
const dir = 'artifacts/verify-rradio/news';
await mkdir(dir, { recursive: true });
const browser = native ? await chromium.connectOverCDP('http://127.0.0.1:9225') : await chromium.launch({ headless: true });
const context = native ? browser.contexts()[0] : await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const errors = [];
const evidence = [];
context.pages().forEach(p => p.on('pageerror', error => errors.push(error.message)));
context.on('page', p => p.on('pageerror', error => errors.push(error.message)));
const nativeWindow = () => JSON.parse(execFileSync('powershell.exe', ['-NoProfile', '-File', 'scripts/verify-news-window.ps1'], { encoding: 'utf8' }));
try {
  const page = native ? context.pages().find(p => !p.url().includes('?news')) : await context.newPage();
  assert(page, 'Main page exists');
  if (!native) await page.goto('http://127.0.0.1:5173');
  await page.evaluate(() => {
    localStorage.setItem('rradio_gta6_settings_v1', JSON.stringify({ language: 'en', hasCompletedOnboarding: true, discord: { enabled: false }, updates: { checkEnabled: false }, news: { enabled: true, soundEnabled: true } }));
    localStorage.removeItem('rradio_news_seen_v1');
  });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'getGamepads', { value: () => [] });
    window.newsTones = [];
    const create = AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator = function () {
      const oscillator = create.call(this);
      const start = oscillator.start.bind(oscillator);
      oscillator.start = (...args) => { window.newsTones.push(oscillator.type); return start(...args); };
      return oscillator;
    };
  });
  await page.reload();
  await page.waitForTimeout(1200);
  await page.keyboard.press('F10');
  await page.getByRole('button', { name: 'DISPLAY', exact: true }).click();
  await page.locator('.rr-news-panel').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${dir}/${native ? 'native' : 'browser'}-before.png` });
  if (native) {
    await page.locator('.rr-news-article').first().waitFor({ timeout: 20000 });
    const articles = await page.locator('.rr-news-article').allTextContents();
    assert(articles.length > 0 && articles.every(t => t.includes('Rockstar Games Newswire')));
    assert.equal(await page.evaluate(() => window.newsTones.length), 0, 'Automatic alert stays silent on muted launch');
    evidence.push({ check: 'Live native feed and muted launch', articles });
  }
  for (const theme of ['gta6', 'gta4']) {
    if (theme === 'gta4') {
      await page.getByRole('button', { name: /Liberty City/ }).click();
      await page.locator('.rr-news-panel').scrollIntoViewIfNeeded();
    }
    await page.evaluate(() => { window.newsTones = []; });
    const beforeWindow = native ? nativeWindow() : null;
    await page.getByRole('button', { name: /Preview Example notification/ }).click();
    const toastPage = native ? context.pages().find(p => p.url().includes('?news')) : page;
    assert(toastPage, 'News window exists');
    await toastPage.locator(`.rr-news-toast--${theme}`).waitFor();
    await page.waitForTimeout(500);
    assert.deepEqual(await page.evaluate(() => window.newsTones), theme === 'gta4' ? ['square', 'square', 'square'] : ['sine', 'sine']);
    assert.equal(await toastPage.locator('.rr-news-toast').evaluate(el => getComputedStyle(el).pointerEvents), 'none');
    await toastPage.screenshot({ path: `${dir}/${native ? 'native' : 'browser'}-${theme}.png` });
    if (native) {
      const actual = nativeWindow();
      assert(actual.visible && actual.clickThrough && actual.noActivate && actual.topmost);
      assert.equal(actual.foreground, beforeWindow.foreground, 'Alert must not change foreground');
      evidence.push({ check: `${theme} Win32 window styles and foreground`, ...actual });
    }
    evidence.push({ check: `${theme} preview`, sound: theme === 'gta4' ? 'three square beeps' : 'two sine glides', clickThroughDOM: true });
    await page.getByRole('switch', { name: 'Alert sound', exact: true }).click();
    await page.evaluate(() => { window.newsTones = []; });
    await page.getByRole('button', { name: /Preview Example notification/ }).click();
    await page.waitForTimeout(200);
    assert.equal(await page.evaluate(() => window.newsTones.length), 0);
    await page.getByRole('switch', { name: 'Alert sound', exact: true }).click();
  }
  const toastPage = native ? context.pages().find(p => p.url().includes('?news')) : page;
  await toastPage.locator('.rr-news-toast').waitFor({ state: 'detached', timeout: 11000 });
  if (native) {
    assert.equal(nativeWindow().visible, false, 'Native alert expires');
    await page.getByRole('button', { name: 'Refresh', exact: true }).click();
    await page.waitForTimeout(1500);
    assert.equal(await toastPage.locator('.rr-news-toast').count(), 0, 'Seen headlines must not alert again');
  }
  evidence.push({ check: 'Alert expires after 8 seconds', passed: true });
  await page.getByRole('switch', { name: 'News alerts', exact: true }).click();
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('rradio_gta6_settings_v1')).news.enabled), false);
  await page.reload();
  await page.waitForTimeout(700);
  await page.keyboard.press('F10');
  await page.getByRole('button', { name: 'DISPLAY', exact: true }).click();
  assert.equal(await page.getByRole('switch', { name: 'News alerts', exact: true }).getAttribute('aria-checked'), 'false');
  evidence.push({ check: 'News disabled persists across reload', passed: true });
  if (!native) {
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.locator('.rr-news-panel').scrollIntoViewIfNeeded();
      await page.getByRole('switch', { name: 'News alerts', exact: true }).click();
      await page.getByRole('button', { name: /Preview Example notification/ }).click();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      assert.equal(await page.locator('.rr-news-toast').evaluate(el => getComputedStyle(el).animationName), 'none');
      await page.screenshot({ path: `${dir}/mobile-${width}.png` });
      await page.getByRole('switch', { name: 'News alerts', exact: true }).click();
    }
    const checks = await page.evaluate(async () => {
      const { selectNewsAlert } = await import('/src/services/news.ts');
      const a = { id: 'a' }, b = { id: 'b' };
      return [selectNewsAlert([a,b], null)?.id === 'a', selectNewsAlert([a,b], ['a','b']) === null, selectNewsAlert([b,a], ['a'])?.id === 'b'];
    });
    assert(checks.every(Boolean), 'News deduplication');
    const failurePage = await context.newPage();
    await failurePage.addInitScript(() => {
      let listens = 0, reads = 0;
      window.__TAURI_EVENT_PLUGIN_INTERNALS__ = { unregisterListener() {} };
      window.__TAURI_INTERNALS__ = {
        transformCallback() { return 1; },
        async invoke(command) {
          if (command === 'plugin:event|listen' && ++listens <= 2) throw new Error('Injected listener failure');
          if (command === 'get_news_alert') {
            if (++reads === 1) throw new Error('Injected read failure');
            return { theme: 'gta6', language: 'en', item: { id: 'check', title: 'IPC recovered', source: 'Test', sourceIcon: '', url: '', publishedAt: '' } };
          }
          return 1;
        }
      };
    });
    await failurePage.goto('http://127.0.0.1:5173/?news');
    await failurePage.getByText('IPC recovered', { exact: true }).waitFor({ timeout: 12000 });
    evidence.push({ check: 'News window recovers from listener and read failures', passed: true });
    await failurePage.close();
  }
  assert.deepEqual(errors, []);
  evidence.push({ check: 'Runtime errors', errors });
  console.log(JSON.stringify(evidence, null, 2));
  await writeFile(`${dir}/${native ? 'native' : 'browser'}-checks.json`, JSON.stringify(evidence, null, 2));
} finally { await browser.close(); }
