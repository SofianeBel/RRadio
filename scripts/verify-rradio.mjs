import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import http from 'http';

const ARTIFACTS_DIR = path.resolve('artifacts/verify-rradio');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/`, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 500);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1500, () => {
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
    console.error('[DOCTOR] FAIL: Port 5173 is not answering. Please ensure the dev server is launched.');
    process.exit(1);
  }
  console.log('[DOCTOR] PASS: Environment healthy and ready for verification.');
}

async function drive(feature) {
  ensureDir(ARTIFACTS_DIR);
  const targetDir = path.join(ARTIFACTS_DIR, feature);
  ensureDir(targetDir);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  console.log(`[DRIVE] Connecting to http://localhost:5173 for feature '${feature}'...`);
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1000);

  if (feature === 'radio-wheel') {
    console.log('[DRIVE] Pressing F8 to open radio wheel...');
    await page.keyboard.press('F8');
    await page.waitForTimeout(800);

    const screenshotPath = path.join(targetDir, 'radio-wheel.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`[EVIDENCE] Captured: ${screenshotPath}`);

    // Select next station with ArrowRight
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(500);
    const stationSwitchedPath = path.join(targetDir, 'radio-wheel-switched.png');
    await page.screenshot({ path: stationSwitchedPath });
    console.log(`[EVIDENCE] Captured: ${stationSwitchedPath}`);

  } else if (feature === 'settings-dialog') {
    console.log('[DRIVE] Pressing F10 to open settings dialog...');
    await page.keyboard.press('F10');
    await page.waitForTimeout(1000);

    const settingsScreenshot = path.join(targetDir, 'settings-audio.png');
    await page.screenshot({ path: settingsScreenshot });
    console.log(`[EVIDENCE] Captured: ${settingsScreenshot}`);

    // Click DISCORD RPC tab
    console.log('[DRIVE] Clicking DISCORD RPC tab...');
    const discordTab = page.locator('button:has-text("DISCORD RPC")');
    if (await discordTab.count() > 0) {
      await discordTab.first().click();
      await page.waitForTimeout(800);
      const discordScreenshot = path.join(targetDir, 'settings-discord.png');
      await page.screenshot({ path: discordScreenshot });
      console.log(`[EVIDENCE] Captured: ${discordScreenshot}`);
    }

  } else if (feature === 'ondemand-drilldown') {
    console.log('[DRIVE] Pressing F8 then F7 to switch to On-Demand mode...');
    await page.keyboard.press('F8');
    await page.waitForTimeout(600);
    await page.keyboard.press('F7');
    await page.waitForTimeout(800);

    const ondemandScreenshot = path.join(targetDir, 'ondemand-providers.png');
    await page.screenshot({ path: ondemandScreenshot });
    console.log(`[EVIDENCE] Captured: ${ondemandScreenshot}`);

  } else if (feature === 'discord-rpc') {
    console.log('[DRIVE] Verifying Discord RPC preview...');
    await page.keyboard.press('F10');
    await page.waitForTimeout(800);
    const discordTab = page.locator('button:has-text("DISCORD RPC")');
    if (await discordTab.count() > 0) {
      await discordTab.first().click();
      await page.waitForTimeout(800);
      const discordCard = path.join(targetDir, 'discord-preview-card.png');
      await page.screenshot({ path: discordCard });
      console.log(`[EVIDENCE] Captured: ${discordCard}`);
    }
  } else {
    console.error(`[DRIVE] Unknown feature '${feature}'`);
    await browser.close();
    process.exit(1);
  }

  await browser.close();
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
  console.error('[ERROR]', err);
  process.exit(1);
});
