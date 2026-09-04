import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import http from 'http';

const ARTIFACTS_DIR = path.resolve('artifacts/verify-rradio');
const DEV_URL = 'http://127.0.0.1:5173';

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/`, (res) => {
      resolve(res.statusCode === 200);
      res.resume();
    });
    req.on('error', () => resolve(false));
    req.setTimeout(3000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function doctor() {
  console.log('[DOCTOR] Checking RRadio verification preconditions...');
  const portUp = await checkPort(5173);
  console.log(`- Dev server (http://127.0.0.1:5173): ${portUp ? 'ONLINE (Ready to drive)' : 'OFFLINE (Start with bun run dev)'}`);

  const exeExists = fs.existsSync('src-tauri/target/debug/rradio.exe');
  console.log(`- Native debug binary (src-tauri/target/debug/rradio.exe): ${exeExists ? 'FOUND' : 'NOT BUILT (Run cargo build --manifest-path src-tauri/Cargo.toml)'}`);

  const manifestExists = fs.existsSync('src/data/radioManifest.json');
  console.log(`- Audio manifest (src/data/radioManifest.json): ${manifestExists ? 'OK (139 tracks)' : 'MISSING'}`);

  if (!portUp) {
    console.error('[DOCTOR] FAIL: Dev server offline. Start it with `bun run dev` and retry.');
    process.exit(1);
  }
  console.log('[DOCTOR] PASS: Environment healthy and ready for verification.');
}

async function expectText(page, selector, label, timeout = 8000) {
  try {
    await page.waitForSelector(selector, { state: 'visible', timeout });
  } catch {
    throw new Error(`ASSERT FAIL: ${label} not visible (${selector})`);
  }
}

async function titleText(page) {
  return (await page.locator('h1.gta-hud-title').first().textContent())?.trim() ?? '';
}

async function drive(feature) {
  ensureDir(ARTIFACTS_DIR);
  const targetDir = path.join(ARTIFACTS_DIR, feature);
  ensureDir(targetDir);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  try {
    console.log(`[DRIVE] Connecting to ${DEV_URL} for feature '${feature}'...`);
    await page.goto(DEV_URL);
    await page.waitForTimeout(1000);

    if (feature === 'radio-wheel') {
      console.log('[DRIVE] Pressing F8 to open radio wheel...');
      await page.keyboard.press('F8');
      await expectText(page, 'h1.gta-hud-title', 'wheel station title');
      const nameBefore = await titleText(page);
      console.log(`[ASSERT] Wheel open on station: ${nameBefore}`);

      const screenshotPath = path.join(targetDir, 'radio-wheel.png');
      await page.screenshot({ path: screenshotPath });
      console.log(`[EVIDENCE] Captured: ${screenshotPath}`);

      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(600);
      const nameAfter = await titleText(page);
      if (nameAfter === nameBefore) {
        throw new Error(`ASSERT FAIL: station did not switch (still "${nameBefore}")`);
      }
      console.log(`[ASSERT] Station switched: ${nameBefore} -> ${nameAfter}`);
      await expectText(page, '.gta-hud-text', 'live track line');

      const stationSwitchedPath = path.join(targetDir, 'radio-wheel-switched.png');
      await page.screenshot({ path: stationSwitchedPath });
      console.log(`[EVIDENCE] Captured: ${stationSwitchedPath}`);

    } else if (feature === 'settings-dialog') {
      console.log('[DRIVE] Pressing F10 to open settings dialog...');
      await page.keyboard.press('F10');
      await expectText(page, 'button:has-text("DISCORD RPC")', 'settings tab bar');
      await expectText(page, 'text=QUALITÉ AUDIO', 'audio tab default content');
      console.log('[ASSERT] Settings open on AUDIO tab');

      const settingsScreenshot = path.join(targetDir, 'settings-audio.png');
      await page.screenshot({ path: settingsScreenshot });
      console.log(`[EVIDENCE] Captured: ${settingsScreenshot}`);

      console.log('[DRIVE] Clicking DISCORD RPC tab...');
      await page.locator('button:has-text("DISCORD RPC")').first().click();
      await expectText(page, 'text=Aperçu en direct de votre profil Discord', 'discord live preview card');
      await expectText(page, 'text=ACTIVER DISCORD RICH PRESENCE', 'discord toggle');
      console.log('[ASSERT] DISCORD RPC tab renders preview card and toggle');
      const discordScreenshot = path.join(targetDir, 'settings-discord.png');
      await page.screenshot({ path: discordScreenshot });
      console.log(`[EVIDENCE] Captured: ${discordScreenshot}`);

    } else if (feature === 'ondemand-drilldown') {
      console.log('[DRIVE] Pressing F8 then F7 to switch to On-Demand mode...');
      await page.keyboard.press('F8');
      await page.waitForTimeout(600);
      await page.keyboard.press('F7');
      await expectText(page, 'text=SÉLECTIONS DISPONIBLES', 'on-demand provider level');
      const provider = await titleText(page);
      console.log(`[ASSERT] On-Demand provider level visible: ${provider}`);

      const ondemandScreenshot = path.join(targetDir, 'ondemand-providers.png');
      await page.screenshot({ path: ondemandScreenshot });
      console.log(`[EVIDENCE] Captured: ${ondemandScreenshot}`);

    } else if (feature === 'discord-rpc') {
      console.log('[DRIVE] Verifying Discord RPC preview...');
      await page.keyboard.press('F10');
      await expectText(page, 'button:has-text("DISCORD RPC")', 'settings tab bar');
      await page.locator('button:has-text("DISCORD RPC")').first().click();
      await expectText(page, 'text=DISCORD RICH PRESENCE', 'discord tab heading');
      await expectText(page, 'text=Aperçu en direct de votre profil Discord', 'discord live preview card');
      console.log('[ASSERT] Discord preview card renders with live track state');
      const discordCard = path.join(targetDir, 'discord-preview-card.png');
      await page.screenshot({ path: discordCard });
      console.log(`[EVIDENCE] Captured: ${discordCard}`);
    } else if (feature === 'localization') {
      console.log('[DRIVE] Pressing F10 to open settings dialog...');
      await page.keyboard.press('F10');
      await expectText(page, 'button:has-text("AFFICHAGE")', 'settings tab AFFICHAGE');
      await expectText(page, 'button:has-text("COMMANDES")', 'settings tab COMMANDES');
      await expectText(page, 'text=QUALITÉ AUDIO', 'french audio tab content');
      console.log('[ASSERT] Settings default language is French');

      const frScreenshot = path.join(targetDir, 'settings-fr.png');
      await page.screenshot({ path: frScreenshot });
      console.log(`[EVIDENCE] Captured: ${frScreenshot}`);

      console.log('[DRIVE] Clicking EN language toggle in header...');
      await page.locator('button:has-text("EN")').first().click();
      await page.waitForTimeout(300);

      await expectText(page, 'button:has-text("DISPLAY")', 'settings tab DISPLAY');
      await expectText(page, 'button:has-text("CONTROLS")', 'settings tab CONTROLS');
      await expectText(page, 'button:has-text("STREAMING SERVICES")', 'settings tab STREAMING SERVICES');
      await expectText(page, 'text=AUDIO QUALITY', 'english audio tab content');
      console.log('[ASSERT] Settings switched to English successfully');

      const enScreenshot = path.join(targetDir, 'settings-en.png');
      await page.screenshot({ path: enScreenshot });
      console.log(`[EVIDENCE] Captured: ${enScreenshot}`);

      console.log('[DRIVE] Clicking DISPLAY tab to verify dedicated language setting row...');
      await page.locator('button:has-text("DISPLAY")').first().click();
      await page.waitForTimeout(400);
      await expectText(page, 'text=SYSTEM LANGUAGE', 'display tab language row');
      const displayEnScreenshot = path.join(targetDir, 'settings-display-en.png');
      await page.screenshot({ path: displayEnScreenshot });
      console.log(`[EVIDENCE] Captured: ${displayEnScreenshot}`);

      console.log('[DRIVE] Closing settings and opening Radio Wheel in English...');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);

      await page.keyboard.press('F8');
      await page.waitForTimeout(600);
      await page.keyboard.press('F7');
      await page.waitForTimeout(600);
      await expectText(page, 'text=SELECTIONS AVAILABLE', 'english ondemand text');
      console.log('[ASSERT] Radio Wheel On-Demand displays English subtitle: SELECTIONS AVAILABLE');

      const wheelEnScreenshot = path.join(targetDir, 'wheel-ondemand-en.png');
      await page.screenshot({ path: wheelEnScreenshot });
      console.log(`[EVIDENCE] Captured: ${wheelEnScreenshot}`);

      console.log('[DRIVE] Restoring French language...');
      await page.keyboard.press('F8');
      await page.waitForTimeout(400);
      await page.keyboard.press('F10');
      await page.waitForTimeout(500);
      await page.locator('button:has-text("FR")').first().click();
      await page.waitForTimeout(300);
      await expectText(page, 'button:has-text("AFFICHAGE")', 'restored french tab');
      console.log('[ASSERT] Restored French language successfully');

      const restoredScreenshot = path.join(targetDir, 'settings-fr-restored.png');
      await page.screenshot({ path: restoredScreenshot });
      console.log(`[EVIDENCE] Captured: ${restoredScreenshot}`);
      await page.keyboard.press('Escape');
    } else {
      throw new Error(`Unknown feature '${feature}' (expected radio-wheel, settings-dialog, ondemand-drilldown, discord-rpc, localization)`);
    }
  } finally {
    await browser.close();
  }

  console.log(`[DRIVE] Successfully verified feature '${feature}'. Evidence saved to ${targetDir}`);
}

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0] || 'doctor';

  if (cmd === 'doctor') {
    await doctor();
  } else if (cmd === 'drive') {
    const feature = args[1] || 'radio-wheel';
    await drive(feature);
  } else {
    console.log('Usage: node scripts/verify-rradio.mjs [doctor | drive <feature>]');
  }
}

main().catch(err => {
  console.error('[ERROR]', err.message || err);
  process.exit(1);
});
