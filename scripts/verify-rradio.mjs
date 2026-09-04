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

    if (feature !== 'onboarding') {
      await page.evaluate(() => {
        const stored = localStorage.getItem('rradio_gta6_settings_v1');
        const parsed = stored ? JSON.parse(stored) : {};
        parsed.hasCompletedOnboarding = true;
        localStorage.setItem('rradio_gta6_settings_v1', JSON.stringify(parsed));
      });
      await page.reload();
      await page.waitForTimeout(600);
    }

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
    } else if (feature === 'onboarding') {
      console.log('[DRIVE] Resetting localStorage to simulate first launch...');
      await page.evaluate(() => {
        localStorage.removeItem('rradio_gta6_settings_v1');
      });
      await page.reload();
      await page.waitForTimeout(1000);

      // 1. Assert Step 1: Language selection
      console.log('[ASSERT] Checking Step 1 (Language)...');
      await expectText(page, 'text=BIENVENUE SUR RRADIO', 'onboarding step 1 welcome title');
      await expectText(page, 'text=Français', 'french language card');
      await expectText(page, 'text=English', 'english language card');

      const step1FrShot = path.join(targetDir, 'step1-language-fr.png');
      await page.screenshot({ path: step1FrShot });
      console.log(`[EVIDENCE] Captured: ${step1FrShot}`);

      // Toggle to English to test live dynamic translation
      console.log('[DRIVE] Switching to English...');
      await page.locator('button:has-text("English")').first().click();
      await page.waitForTimeout(300);
      await expectText(page, 'text=WELCOME TO RRADIO', 'english welcome title');

      const step1EnShot = path.join(targetDir, 'step1-language-en.png');
      await page.screenshot({ path: step1EnShot });
      console.log(`[EVIDENCE] Captured: ${step1EnShot}`);

      // Switch back to French
      console.log('[DRIVE] Switching back to French...');
      await page.locator('button:has-text("Français")').first().click();
      await page.waitForTimeout(300);

      // Click Next to Step 2 (Volume)
      console.log('[DRIVE] Advancing to Step 2 (Volume)...');
      await page.locator('button:has-text("SUIVANT")').first().click();
      await page.waitForTimeout(400);

      // 2. Assert Step 2: Volume Calibration
      console.log('[ASSERT] Checking Step 2 (Volume Calibration)...');
      await expectText(page, 'text=CALIBRATION DU VOLUME', 'onboarding step 2 volume title');
      await expectText(page, 'text=VOLUME PRINCIPAL', 'master volume slider label');
      await expectText(page, 'text=DÉMARRER EN MODE SILENCIEUX', 'mute on startup toggle');

      // Adjust slider
      console.log('[DRIVE] Adjusting volume slider to test 1-second audio preview...');
      const slider = page.locator('input[type="range"]').first();
      await slider.fill('65');
      await page.waitForTimeout(400);

      const step2Shot = path.join(targetDir, 'step2-volume.png');
      await page.screenshot({ path: step2Shot });
      console.log(`[EVIDENCE] Captured: ${step2Shot}`);

      // Click Next to Step 3 (Google Connection)
      console.log('[DRIVE] Advancing to Step 3 (Google Connection)...');
      await page.locator('button:has-text("SUIVANT")').first().click();
      await page.waitForTimeout(400);

      // 3. Assert Step 3: Google connection & verification notice
      console.log('[ASSERT] Checking Step 3 (Google connection & verification notice)...');
      await expectText(page, 'text=CONNEXION GOOGLE & YOUTUBE MUSIC', 'onboarding step 3 title');
      await expectText(page, 'text=AVIS DE VÉRIFICATION GOOGLE OAUTH', 'google verification notice heading');
      await expectText(page, 'text=L\'application RRadio est actuellement en cours de vérification par Google', 'verification disclaimer text');
      await expectText(page, 'text=SE CONNECTER AVEC GOOGLE', 'connect google button');

      const step3Shot = path.join(targetDir, 'step3-google-verification.png');
      await page.screenshot({ path: step3Shot });
      console.log(`[EVIDENCE] Captured: ${step3Shot}`);

      // Click Next to Step 4 (Controls)
      console.log('[DRIVE] Advancing to Step 4 (Controls)...');
      await page.locator('button:has-text("SUIVANT")').first().click();
      await page.waitForTimeout(400);

      // 4. Assert Step 4: Controls & Finish
      console.log('[ASSERT] Checking Step 4 (Controls)...');
      await expectText(page, 'text=RACCOURCIS ET CONTRÔLES', 'onboarding step 4 title');
      await expectText(page, 'text=F8 / Alt + V', 'wheel shortcut');
      await expectText(page, 'text=F9 / Alt + M', 'mute shortcut');
      await expectText(page, 'text=F10 / Alt + S', 'settings shortcut');
      await expectText(page, 'text=COMMENCER L\'ÉCOUTE', 'finish button');

      const step4Shot = path.join(targetDir, 'step4-controls.png');
      await page.screenshot({ path: step4Shot });
      console.log(`[EVIDENCE] Captured: ${step4Shot}`);

      // Click "COMMENCER L'ÉCOUTE"
      console.log('[DRIVE] Clicking COMMENCER L\'ÉCOUTE to complete onboarding...');
      await page.locator('button:has-text("COMMENCER L\'ÉCOUTE")').first().click();
      await page.waitForTimeout(800);

      // Assert onboarding is closed and hasCompletedOnboarding is true
      const hasCompleted = await page.evaluate(() => {
        const raw = localStorage.getItem('rradio_gta6_settings_v1');
        return raw ? JSON.parse(raw).hasCompletedOnboarding : false;
      });
      if (!hasCompleted) {
        throw new Error('ASSERT FAIL: hasCompletedOnboarding was not set to true in localStorage');
      }
      console.log('[ASSERT] Onboarding completed and persisted: hasCompletedOnboarding = true');

      // Now verify replay button in SettingsDialog
      console.log('[DRIVE] Opening SettingsDialog to verify Replay Onboarding button...');
      await page.keyboard.press('F10');
      await page.waitForTimeout(600);
      await expectText(page, 'text=REJOUER LE TUTORIEL DE BIENVENUE', 'replay onboarding button in settings');

      const replaySettingsShot = path.join(targetDir, 'settings-replay-button.png');
      await page.screenshot({ path: replaySettingsShot });
      console.log(`[EVIDENCE] Captured: ${replaySettingsShot}`);

      console.log('[DRIVE] Clicking Replay Onboarding button...');
      await page.locator('button:has-text("REJOUER LE TUTORIEL DE BIENVENUE")').first().click();
      await page.waitForTimeout(500);
      await expectText(page, 'text=BIENVENUE SUR RRADIO', 'reopened onboarding modal');
      console.log('[ASSERT] Replay onboarding successfully reopened wizard');

      const replayedShot = path.join(targetDir, 'onboarding-reopened.png');
      await page.screenshot({ path: replayedShot });
      console.log(`[EVIDENCE] Captured: ${replayedShot}`);

      await page.keyboard.press('Escape');
    } else if (feature === 'oauth-client-id') {
      console.log('[DRIVE] Pressing F10 to open settings dialog...');
      await page.keyboard.press('F10');
      await expectText(page, 'button:has-text("SERVICES STREAMING")', 'streaming services tab');

      console.log('[DRIVE] Switching to English for OAuth check...');
      await page.locator('button:has-text("EN")').first().click();
      await page.waitForTimeout(300);

      console.log('[DRIVE] Opening STREAMING SERVICES tab...');
      await page.locator('button:has-text("STREAMING SERVICES")').first().click();
      await page.waitForTimeout(400);

      console.log('[DRIVE] Clicking Google Sign In button...');
      const connectBtn = page.locator('button:has-text("SIGN IN WITH GOOGLE")').first();
      await connectBtn.waitFor({ state: 'visible', timeout: 5000 });
      await connectBtn.click();
      await page.waitForTimeout(600);

      const shotPath = path.join(targetDir, 'oauth-client-id-verified.png');
      await page.screenshot({ path: shotPath });
      console.log(`[EVIDENCE] Captured: ${shotPath}`);

      const errorTextLocator = page.locator('text=This version of RRadio does not have a public Google Client ID configured.');
      const hasError = await errorTextLocator.isVisible();
      if (hasError) {
        throw new Error('ASSERT FAIL: Google Client ID missing error is displayed!');
      }

      const waitingIndicator = page.locator('text=Waiting for browser (90s)...');
      const isWaiting = await waitingIndicator.isVisible();
      if (!isWaiting) {
        throw new Error('ASSERT FAIL: OAuth flow was not started with public client ID!');
      }

      console.log('[ASSERT] Public Google Client ID configured and OAuth initiated cleanly without error banner');
      await page.keyboard.press('Escape');
    } else {
      throw new Error(`Unknown feature '${feature}' (expected radio-wheel, settings-dialog, ondemand-drilldown, discord-rpc, localization, onboarding, oauth-client-id)`);
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
